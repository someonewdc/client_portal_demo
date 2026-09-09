import { describe, expect, it } from 'vitest';

import { redactJsonObject, toBoundedJsonValue } from './json.js';

describe('JSON primitives', () => {
  it('redacts secret-like keys and header casing variants recursively without mutating input', () => {
    const original = {
      nested: {
        access_token: 'secret',
        headers: {
          Authorization: 'Bearer authorization-secret',
          Cookie: 'session=cookie-secret',
          'Set-Cookie': 'session=response-cookie-secret',
          'X-Api-Key': 'api-key-secret',
          api_key: 'snake-case-api-key-secret',
          password: 'password-secret',
          safe: 'visible',
          secret: 'secret-value',
          token: 'token-secret',
        },
      },
    } as const;

    expect(redactJsonObject(original)).toEqual({
      nested: {
        access_token: '***REDACTED***',
        headers: {
          Authorization: '***REDACTED***',
          Cookie: '***REDACTED***',
          'Set-Cookie': '***REDACTED***',
          'X-Api-Key': '***REDACTED***',
          api_key: '***REDACTED***',
          password: '***REDACTED***',
          safe: 'visible',
          secret: '***REDACTED***',
          token: '***REDACTED***',
        },
      },
    });
    expect(original.nested.access_token).toBe('secret');
    expect(original.nested.headers).toEqual({
      Authorization: 'Bearer authorization-secret',
      Cookie: 'session=cookie-secret',
      'Set-Cookie': 'session=response-cookie-secret',
      'X-Api-Key': 'api-key-secret',
      api_key: 'snake-case-api-key-secret',
      password: 'password-secret',
      safe: 'visible',
      secret: 'secret-value',
      token: 'token-secret',
    });
  });

  it('bounds depth and cycles for safe rendering', () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;

    expect(JSON.stringify(toBoundedJsonValue(cyclic))).toContain('circular reference');
  });
});
