import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = resolve(rootDirectory, 'scripts/free-stand-ports.mjs');

function unusedPort() {
  return new Promise((resolvePort, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolvePort(port);
      });
    });
    server.once('error', reject);
  });
}

function waitForOutput(child, needle, timeoutMs = 3000) {
  return new Promise((resolveWait, reject) => {
    let buffer = '';
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`timed out waiting for ${JSON.stringify(needle)}: ${buffer}`));
    }, timeoutMs);

    function onData(chunk) {
      buffer += chunk;
      if (buffer.includes(needle)) {
        cleanup();
        resolveWait();
      }
    }

    function cleanup() {
      clearTimeout(timer);
      child.stdout?.off('data', onData);
    }

    child.stdout?.on('data', onData);
  });
}

function hasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function waitForExit(child, timeoutMs = 3000) {
  return new Promise((resolveWait, reject) => {
    if (hasExited(child)) {
      resolveWait(child.exitCode);
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`timed out waiting for pid ${child.pid} to exit`));
    }, timeoutMs);

    function onExit(code) {
      cleanup();
      resolveWait(code);
    }

    function cleanup() {
      clearTimeout(timer);
      child.off('exit', onExit);
    }

    child.once('exit', onExit);
  });
}

function isPortListening(port) {
  return new Promise((resolveListen) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.end();
      resolveListen(true);
    });
    socket.once('error', () => {
      resolveListen(false);
    });
  });
}

function startListener(port, { ignoreTerm = false } = {}) {
  const ignoreTermSource = ignoreTerm ? "process.on('SIGTERM', () => {});\n" : '';

  return spawn(
    process.execPath,
    [
      '-e',
      `${ignoreTermSource}require('node:net').createServer().listen(${port}, '127.0.0.1', () => {
  process.stdout.write('listening\\n');
});
`,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

async function stopListener(child) {
  if (!child || hasExited(child)) {
    return;
  }

  try {
    child.kill('SIGKILL');
  } catch {
    return;
  }

  await waitForExit(child).catch(() => {});
}

function runFreeStandPorts(ports, extraEnv = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...ports.map(String)], {
      cwd: rootDirectory,
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      resolveRun({ code, stdout, stderr });
    });
  });
}

describe('free-stand-ports script', () => {
  it('defaults to the demo stand ports 3000, 3001 and 5433', () => {
    assert.equal(existsSync(scriptPath), true, 'scripts/free-stand-ports.mjs must exist');
    const source = readFileSync(scriptPath, 'utf8');
    assert.match(source, /\b3000\b/);
    assert.match(source, /\b3001\b/);
    assert.match(source, /\b5433\b/);
    assert.doesNotMatch(source, /xargs\s+-r/);
  });

  it('exits 0 when the requested port has no listener', async () => {
    const port = await unusedPort();
    const result = await runFreeStandPorts([port]);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(await isPortListening(port), false);
  });

  it('kills a leftover listener so the port can bind again', async () => {
    const port = await unusedPort();
    const listener = startListener(port);
    try {
      await waitForOutput(listener, 'listening');
      assert.equal(await isPortListening(port), true);

      const result = await runFreeStandPorts([port]);
      assert.equal(result.code, 0, result.stderr);
      await waitForExit(listener);
      assert.equal(await isPortListening(port), false);
    } finally {
      await stopListener(listener);
    }
  });

  it('SIGKILLs a listener that ignores SIGTERM', async () => {
    const port = await unusedPort();
    const listener = startListener(port, { ignoreTerm: true });
    try {
      await waitForOutput(listener, 'listening');
      assert.equal(await isPortListening(port), true);

      const result = await runFreeStandPorts([port], { FREE_STAND_PORTS_TERM_MS: '50' });
      assert.equal(result.code, 0, result.stderr);
      await waitForExit(listener);
      assert.equal(await isPortListening(port), false);
    } finally {
      await stopListener(listener);
    }
  });
});

describe('free-stand-ports listener classification', () => {
  it('parses lsof -F pc records and ignores file-descriptor lines', async () => {
    const { parseLsofPc } = await import(pathToFileURL(scriptPath).href);
    assert.deepEqual(parseLsofPc('p12558\nccom.docker.backend\nf157\np77794\ncnode\nf16\n'), [
      { pid: 12558, command: 'com.docker.backend' },
      { pid: 77794, command: 'node' },
    ]);
  });

  it('protects Docker Desktop and docker-proxy helpers; reclaims leftover node', async () => {
    const { classifyListener } = await import(pathToFileURL(scriptPath).href);
    assert.equal(classifyListener('com.docker.backend'), 'protected');
    assert.equal(classifyListener('com.docker.vmnetd'), 'protected');
    assert.equal(classifyListener('com.docke'), 'protected');
    assert.equal(classifyListener('vpnkit'), 'protected');
    assert.equal(classifyListener('docker-proxy'), 'protected');
    assert.equal(classifyListener('docker-pr'), 'protected');
    assert.equal(classifyListener('node'), 'reclaim');
    assert.equal(classifyListener('nodejs'), 'reclaim');
    assert.equal(classifyListener('postgres'), 'other');
  });

  it('does not send SIGTERM or SIGKILL to a docker helper listener', async () => {
    const { reclaimPort } = await import(pathToFileURL(scriptPath).href);
    const killed = [];
    const logs = [];
    const outcome = reclaimPort(5433, {
      listListeners: () => [{ pid: 12558, command: 'com.docker.backend' }],
      kill: (pid, signal) => {
        killed.push({ pid, signal });
      },
      sleep: () => {},
      write: (text) => {
        logs.push(text);
      },
      termWaitMs: 0,
    });

    assert.equal(outcome, 'ok');
    assert.deepEqual(killed, []);
    assert.match(logs.join(''), /skipping :5433/);
    assert.match(logs.join(''), /com\.docker\.backend/);
  });

  it('exits failed when a node listener survives SIGKILL', async () => {
    const { reclaimPort } = await import(pathToFileURL(scriptPath).href);
    const killed = [];
    const outcome = reclaimPort(3000, {
      listListeners: () => [{ pid: 7, command: 'node' }],
      kill: (pid, signal) => {
        killed.push({ pid, signal });
      },
      sleep: () => {},
      write: () => {},
      termWaitMs: 0,
    });

    assert.equal(outcome, 'failed');
    assert.deepEqual(killed, [
      { pid: 7, signal: 'SIGTERM' },
      { pid: 7, signal: 'SIGKILL' },
    ]);
  });

  it('fails closed on EPERM instead of swallowing the kill error', async () => {
    const { reclaimPort } = await import(pathToFileURL(scriptPath).href);
    const permission = new Error('kill EPERM');
    permission.code = 'EPERM';

    assert.throws(
      () =>
        reclaimPort(3000, {
          listListeners: () => [{ pid: 9, command: 'node' }],
          kill: () => {
            throw permission;
          },
          sleep: () => {},
          write: () => {},
          termWaitMs: 0,
        }),
      (error) => error && error.code === 'EPERM',
    );
  });

  it('ignores ESRCH when the listener is already gone', async () => {
    const { reclaimPort } = await import(pathToFileURL(scriptPath).href);
    const gone = new Error('kill ESRCH');
    gone.code = 'ESRCH';
    let calls = 0;

    const outcome = reclaimPort(3001, {
      listListeners: () => {
        calls += 1;
        return calls === 1 ? [{ pid: 11, command: 'node' }] : [];
      },
      kill: () => {
        throw gone;
      },
      sleep: () => {},
      write: () => {},
      termWaitMs: 0,
    });

    assert.equal(outcome, 'ok');
  });
});
