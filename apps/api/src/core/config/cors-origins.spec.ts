import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const createApplicationSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../bootstrap/create-application.ts'),
  'utf8',
);

describe('corsOriginsFromWebOrigin', () => {
  it('adds the 127.0.0.1 twin for a localhost WEB_ORIGIN', async () => {
    const { corsOriginsFromWebOrigin } = await import('./cors-origins.js');

    expect(corsOriginsFromWebOrigin('http://localhost:3000')).toEqual([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
  });

  it('adds the localhost twin for a 127.0.0.1 WEB_ORIGIN', async () => {
    const { corsOriginsFromWebOrigin } = await import('./cors-origins.js');

    expect(corsOriginsFromWebOrigin('http://127.0.0.1:3000')).toEqual([
      'http://127.0.0.1:3000',
      'http://localhost:3000',
    ]);
  });

  it('does not invent a loopback twin for a non-loopback host', async () => {
    const { corsOriginsFromWebOrigin } = await import('./cors-origins.js');

    expect(corsOriginsFromWebOrigin('http://example.test:3000')).toEqual([
      'http://example.test:3000',
    ]);
    expect(corsOriginsFromWebOrigin('http://example.test:3000')).not.toContain(
      'http://127.0.0.1:3000',
    );
  });

  it('keeps the protocol and port on the loopback twin', async () => {
    const { corsOriginsFromWebOrigin } = await import('./cors-origins.js');

    expect(corsOriginsFromWebOrigin('https://localhost:8443')).toEqual([
      'https://localhost:8443',
      'https://127.0.0.1:8443',
    ]);
  });
});

describe('createApplication CORS', () => {
  it('disables credentials and limits methods to GET, HEAD and OPTIONS', () => {
    expect(createApplicationSource).toMatch(/corsOriginsFromWebOrigin/);
    expect(createApplicationSource).not.toMatch(/credentials:\s*true/);
    expect(createApplicationSource).not.toMatch(/['"]POST['"]/);
    expect(createApplicationSource).not.toMatch(/['"]PUT['"]/);
    expect(createApplicationSource).not.toMatch(/['"]PATCH['"]/);
    expect(createApplicationSource).not.toMatch(/['"]DELETE['"]/);
    expect(createApplicationSource).toMatch(
      /methods:\s*\[\s*['"]GET['"]\s*,\s*['"]HEAD['"]\s*,\s*['"]OPTIONS['"]\s*\]/,
    );
  });
});
