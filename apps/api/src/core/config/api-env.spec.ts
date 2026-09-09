import { describe, expect, it } from 'vitest';

import { validateApiEnv } from './api-env.js';

const validEnv = {
  API_PORT: '3001',
  NODE_ENV: 'test',
  WEB_ORIGIN: 'http://localhost:3000',
};

describe('validateApiEnv', () => {
  it('accepts the boilerplate environment', () => {
    expect(validateApiEnv(validEnv)).toMatchObject({
      API_PORT: 3001,
      NODE_ENV: 'test',
      WEB_ORIGIN: 'http://localhost:3000',
    });
  });

  it('rejects a WEB_ORIGIN with a path', () => {
    expect(() => validateApiEnv({ ...validEnv, WEB_ORIGIN: 'http://localhost:3000/app' })).toThrow(
      /Invalid API environment/,
    );
  });
});
