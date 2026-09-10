import { execFileSync } from 'node:child_process';

const defaultPorts = [3000, 3001, 5433];
const termWaitMs = Number(process.env.FREE_STAND_PORTS_TERM_MS ?? 300);

function parsePorts(argv) {
  const given = argv
    .slice(2)
    .map((value) => Number(value))
    .filter((port) => Number.isInteger(port) && port > 0);
  return given.length > 0 ? given : defaultPorts;
}

function uniquePids(output) {
  return [
    ...new Set(
      String(output)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .filter((pid) => {
          const numeric = Number(pid);
          return Number.isInteger(numeric) && numeric > 1 && numeric !== process.pid;
        }),
    ),
  ];
}

function listenPids(port) {
  try {
    const output = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return uniquePids(output);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error('lsof is required to free stand ports');
    }
    return uniquePids(error && error.stdout ? error.stdout : '');
  }
}

function killPids(pids, signal) {
  for (const pid of pids) {
    try {
      process.kill(Number(pid), signal);
    } catch {
      // already gone
    }
  }
}

function sleep(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return;
  }

  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

const ports = parsePorts(process.argv);

for (const port of ports) {
  const pids = listenPids(port);
  if (pids.length === 0) {
    continue;
  }

  process.stdout.write(`freeing :${port} (${pids.join(' ')})\n`);
  killPids(pids, 'SIGTERM');
  sleep(termWaitMs);
  const leftover = listenPids(port);
  if (leftover.length > 0) {
    killPids(leftover, 'SIGKILL');
  }
}
