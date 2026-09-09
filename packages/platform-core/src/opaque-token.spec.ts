import { describe, expect, it } from 'vitest';

import {
  OPAQUE_TOKEN_BYTES,
  constantTimeTextEqual,
  generateOpaqueToken,
  hashOpaqueToken,
} from './opaque-token.js';

describe('opaque token primitives', () => {
  it('creates a base64url CSPRNG token from 32 bytes by default', () => {
    const token = generateOpaqueToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Buffer.from(token, 'base64url')).toHaveLength(OPAQUE_TOKEN_BYTES);
    expect(generateOpaqueToken()).not.toBe(token);
  });

  it('hashes tokens to a lowercase SHA-256 hex digest', () => {
    expect(hashOpaqueToken('opaque-token')).toBe(
      '84d3f23da9b5f51b3269566eff05d3fb23607eeef89567f9cd280b90ca0dbc5c',
    );
  });

  it('compares equal-length text in constant time and rejects distinct or malformed values', () => {
    expect(constantTimeTextEqual('same-value', 'same-value')).toBe(true);
    expect(constantTimeTextEqual('same-value', 'same-Value')).toBe(false);
    expect(constantTimeTextEqual('same-value', 'short')).toBe(false);
  });
});
