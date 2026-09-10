import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultPorts = [3000, 3001, 5433];
const termWaitMs = Number(process.env.FREE_STAND_PORTS_TERM_MS ?? 300);

function parsePorts(argv) {
  const given = argv
    .slice(2)
    .map((value) => Number(value))
    .filter((port) => Number.isInteger(port) && port > 0);
  return given.length > 0 ? given : defaultPorts;
}

export function parseLsofPc(output, selfPid = process.pid) {
  const listeners = [];
  let pid = null;

  for (const rawLine of String(output).split(/\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const kind = line[0];
    const value = line.slice(1);
    if (kind === 'p') {
      pid = Number(value);
      continue;
    }

    if (kind === 'c' && pid != null) {
      if (Number.isInteger(pid) && pid > 1 && pid !== selfPid) {
        listeners.push({ pid, command: value });
      }
    }
  }

  return listeners;
}

export function classifyListener(command) {
  const base = String(command ?? '')
    .split(/[/\\]/)
    .pop()
    .toLowerCase();

  if (
    base.startsWith('com.dock') ||
    base.startsWith('vpnkit') ||
    base.startsWith('docker-pr') ||
    base === 'docker-proxy' ||
    base === 'docker'
  ) {
    return 'protected';
  }

  if (base === 'node' || base === 'nodejs') {
    return 'reclaim';
  }

  return 'other';
}

function sendSignal(pid, signal, killFn) {
  try {
    killFn(Number(pid), signal);
  } catch (error) {
    if (error && error.code === 'ESRCH') {
      return;
    }

    throw error;
  }
}

export function reclaimPort(port, io) {
  const listeners = io.listListeners(port);
  const reclaimable = listeners.filter(
    (listener) => classifyListener(listener.command) === 'reclaim',
  );
  const protectedListeners = listeners.filter(
    (listener) => classifyListener(listener.command) === 'protected',
  );
  const otherListeners = listeners.filter(
    (listener) => classifyListener(listener.command) === 'other',
  );

  for (const listener of protectedListeners) {
    io.write(`skipping :${port} ${listener.command} (${listener.pid}) docker helper\n`);
  }

  for (const listener of otherListeners) {
    io.write(`leaving :${port} ${listener.command} (${listener.pid})\n`);
  }

  if (reclaimable.length === 0) {
    return 'ok';
  }

  io.write(`freeing :${port} (${reclaimable.map((listener) => listener.pid).join(' ')})\n`);
  for (const listener of reclaimable) {
    sendSignal(listener.pid, 'SIGTERM', io.kill);
  }

  io.sleep(io.termWaitMs ?? 0);

  const afterTerm = io
    .listListeners(port)
    .filter((listener) => classifyListener(listener.command) === 'reclaim');
  for (const listener of afterTerm) {
    sendSignal(listener.pid, 'SIGKILL', io.kill);
  }

  const leftover = io
    .listListeners(port)
    .filter((listener) => classifyListener(listener.command) === 'reclaim');
  if (leftover.length > 0) {
    io.write(`still listening :${port} (${leftover.map((listener) => listener.pid).join(' ')})\n`);
    return 'failed';
  }

  return 'ok';
}

function listListeners(port) {
  try {
    const output = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-F', 'pc'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return parseLsofPc(output);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error('lsof is required to free stand ports');
    }

    return parseLsofPc(error && error.stdout ? error.stdout : '');
  }
}

function sleep(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return;
  }

  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

const defaultIo = {
  listListeners,
  kill: (pid, signal) => {
    process.kill(Number(pid), signal);
  },
  sleep,
  write: (text) => {
    process.stdout.write(text);
  },
  termWaitMs,
};

function invokedAsCli() {
  const entry = process.argv[1];
  return Boolean(entry) && fileURLToPath(import.meta.url) === resolve(entry);
}

export function runCli(argv = process.argv, io = defaultIo) {
  const ports = parsePorts(argv);
  let failed = false;

  for (const port of ports) {
    if (reclaimPort(port, io) === 'failed') {
      failed = true;
    }
  }

  return failed ? 1 : 0;
}

if (invokedAsCli()) {
  try {
    process.exitCode = runCli();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  }
}
