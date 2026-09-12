import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const OPAQUE_TOKEN_BYTES = 32;

export function generateOpaqueToken(byteLength = OPAQUE_TOKEN_BYTES): string {
  if (!Number.isInteger(byteLength) || byteLength < 16 || byteLength > 64) {
    throw new RangeError('Opaque token byte length must be an integer between 16 and 64');
  }

  return randomBytes(byteLength).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function constantTimeTextEqual(left: string, right: string): boolean {
  const leftDigest = createHash('sha256').update(left, 'utf8').digest();
  const rightDigest = createHash('sha256').update(right, 'utf8').digest();

  return timingSafeEqual(leftDigest, rightDigest);
}
