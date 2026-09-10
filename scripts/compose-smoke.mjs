import { execFileSync } from 'node:child_process';
import net from 'node:net';

const readyUrl = 'http://localhost:3001/api/v1/health/ready';
const indexUrl = 'http://localhost:3000/';
const disclaimer = 'не показывается заказчику';
const postgresPort = 5433;
const requiredContainers = ['client-portal-postgres', 'client-portal-api', 'client-portal-web'];

function runningContainerNames() {
  const output = execFileSync(
    'docker',
    ['ps', '--format', '{{.Names}}', '--filter', 'name=client-portal-'],
    { encoding: 'utf8' },
  );
  return new Set(
    output
      .split('\n')
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

function assertComposeStand() {
  const running = runningContainerNames();
  for (const name of requiredContainers) {
    if (!running.has(name)) {
      throw new Error(`compose stand is missing running container ${name}`);
    }
  }
}

function assertTcpOpen(port) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.end();
      resolve();
    });
    socket.once('error', (error) => {
      reject(new Error(`Postgres on 127.0.0.1:${port} is not reachable: ${error.message}`));
    });
  });
}

async function main() {
  assertComposeStand();
  await assertTcpOpen(postgresPort);

  const readyResponse = await fetch(readyUrl);
  if (readyResponse.status !== 200) {
    throw new Error(`${readyUrl} expected 200, got ${readyResponse.status}`);
  }

  const readyBody = await readyResponse.json();
  if (readyBody?.data?.status !== 'ok') {
    throw new Error(`${readyUrl} payload was not ready: ${JSON.stringify(readyBody)}`);
  }

  const indexResponse = await fetch(indexUrl);
  if (!indexResponse.ok) {
    throw new Error(`${indexUrl} expected an ok HTML response, got ${indexResponse.status}`);
  }

  const html = await indexResponse.text();
  if (!html.includes(disclaimer)) {
    throw new Error(`${indexUrl} did not include the demo disclaimer`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
