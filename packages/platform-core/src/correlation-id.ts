export const CORRELATION_ID_HEADER = 'X-Correlation-Id';
export const CORRELATION_ID_HEADER_LOWERCASE = 'x-correlation-id';

export const CANONICAL_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CorrelationIdGenerator = () => string;

export function isCanonicalCorrelationId(value: string): boolean {
  return CANONICAL_UUID_PATTERN.test(value);
}

export function normalizeCorrelationId(value: string): string | undefined {
  return isCanonicalCorrelationId(value) ? value.toLowerCase() : undefined;
}

export function resolveCorrelationId(
  value: string | readonly string[] | undefined,
  generate: CorrelationIdGenerator = () => globalThis.crypto.randomUUID(),
): string {
  return typeof value === 'string' ? (normalizeCorrelationId(value) ?? generate()) : generate();
}
