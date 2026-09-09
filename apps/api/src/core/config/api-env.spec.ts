import { describe, expect, it } from 'vitest';

import { validateApiEnv } from './api-env.js';

const validEnv = {
  API_PORT: '3001',
  DATABASE_URL: 'postgresql://client_portal:client_portal@127.0.0.1:5433/client_portal',
  NODE_ENV: 'test',
  WEB_ORIGIN: 'http://localhost:3000',
};

describe('validateApiEnv', () => {
  it('accepts the boilerplate environment', () => {
    expect(validateApiEnv(validEnv)).toMatchObject({
      API_PORT: 3001,
      DATABASE_URL: validEnv.DATABASE_URL,
      NODE_ENV: 'test',
      WEB_ORIGIN: 'http://localhost:3000',
    });
  });

  it('rejects the boilerplate environment without DATABASE_URL', () => {
    expect(() =>
      validateApiEnv({
        API_PORT: validEnv.API_PORT,
        NODE_ENV: validEnv.NODE_ENV,
        WEB_ORIGIN: validEnv.WEB_ORIGIN,
      }),
    ).toThrow(/Invalid API environment/);
  });

  it('rejects a WEB_ORIGIN with a path', () => {
    expect(() => validateApiEnv({ ...validEnv, WEB_ORIGIN: 'http://localhost:3000/app' })).toThrow(
      /Invalid API environment/,
    );
  });
});
