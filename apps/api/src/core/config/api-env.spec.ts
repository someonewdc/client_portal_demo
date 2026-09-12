import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { validateApiEnv } from './api-env.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../');

const validEnv = {
  API_PORT: '3001',
  DATABASE_URL: 'postgresql://client_portal:client_portal@127.0.0.1:5433/client_portal',
  DEMO_CONDUCTOR_SECRET: 'seed-demo-conductor-nordshield',
  NODE_ENV: 'test',
  WEB_ORIGIN: 'http://localhost:3000',
};

describe('validateApiEnv', () => {
  it('accepts the boilerplate environment', () => {
    expect(validateApiEnv(validEnv)).toMatchObject({
      API_PORT: 3001,
      DATABASE_URL: validEnv.DATABASE_URL,
      DEMO_CONDUCTOR_SECRET: 'seed-demo-conductor-nordshield',
      NODE_ENV: 'test',
      WEB_ORIGIN: 'http://localhost:3000',
    });
  });

  it('rejects the boilerplate environment without DATABASE_URL', () => {
    expect(() =>
      validateApiEnv({
        API_PORT: validEnv.API_PORT,
        DEMO_CONDUCTOR_SECRET: validEnv.DEMO_CONDUCTOR_SECRET,
        NODE_ENV: validEnv.NODE_ENV,
        WEB_ORIGIN: validEnv.WEB_ORIGIN,
      }),
    ).toThrow(/Invalid API environment/);
  });

  it('rejects the environment without DEMO_CONDUCTOR_SECRET', () => {
    expect(() =>
      validateApiEnv({
        API_PORT: validEnv.API_PORT,
        DATABASE_URL: validEnv.DATABASE_URL,
        NODE_ENV: validEnv.NODE_ENV,
        WEB_ORIGIN: validEnv.WEB_ORIGIN,
      }),
    ).toThrow(/Invalid API environment/);
  });

  it('rejects an empty DEMO_CONDUCTOR_SECRET', () => {
    expect(() => validateApiEnv({ ...validEnv, DEMO_CONDUCTOR_SECRET: '' })).toThrow(
      /Invalid API environment/,
    );
  });

  it('rejects a WEB_ORIGIN with a path', () => {
    expect(() => validateApiEnv({ ...validEnv, WEB_ORIGIN: 'http://localhost:3000/app' })).toThrow(
      /Invalid API environment/,
    );
  });

  it('documents the conductor fixture in .env.example, compose api env and CI', () => {
    const envExample = readFileSync(resolve(repoRoot, '.env.example'), 'utf8');
    const compose = readFileSync(resolve(repoRoot, 'compose.yaml'), 'utf8');
    const ci = readFileSync(resolve(repoRoot, '.github/workflows/ci.yml'), 'utf8');

    expect(envExample).toMatch(/^DEMO_CONDUCTOR_SECRET=seed-demo-conductor-nordshield$/m);
    expect(compose).toMatch(/DEMO_CONDUCTOR_SECRET:\s*seed-demo-conductor-nordshield/);
    expect(ci).toMatch(/DEMO_CONDUCTOR_SECRET:\s*seed-demo-conductor-nordshield/);
  });
});
