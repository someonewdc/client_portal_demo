import { describe, expect, it } from 'vitest';

import { exactHttpBaseUrlSchema } from './url.js';

describe('exactHttpBaseUrlSchema', () => {
  it('normalizes one trailing slash and enforces the exact path', () => {
    const schema = exactHttpBaseUrlSchema('/api/v1');

    expect(schema.parse('https://example.test/api/v1/')).toBe('https://example.test/api/v1');
    expect(() => schema.parse('https://example.test/api/v2')).toThrow();
  });

  it.each([
    'https://example.test/api/v1?preview=true',
    'https://example.test/api/v1//',
    'ftp://example.test/api/v1',
    'https://user:password@example.test/api/v1',
  ])('rejects a URL form that is unsafe for a configured HTTP base URL: %s', (value) => {
    const schema = exactHttpBaseUrlSchema('/api/v1');

    expect(schema.safeParse(value).success).toBe(false);
  });
});
