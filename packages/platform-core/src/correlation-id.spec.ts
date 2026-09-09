import { describe, expect, it, vi } from 'vitest';

import {
  CORRELATION_ID_HEADER,
  CORRELATION_ID_HEADER_LOWERCASE,
  isCanonicalCorrelationId,
  normalizeCorrelationId,
  resolveCorrelationId,
} from './correlation-id.js';

const TRACE_ID = 'a30d58d2-7936-4a0a-b5c8-d6caa7f1caba';

describe('correlation IDs', () => {
  it('exports public and lowercase header spelling without changing the wire name', () => {
    expect(CORRELATION_ID_HEADER).toBe('X-Correlation-Id');
    expect(CORRELATION_ID_HEADER_LOWERCASE).toBe('x-correlation-id');
  });

  it('accepts and normalizes canonical UUIDs', () => {
    expect(isCanonicalCorrelationId(TRACE_ID)).toBe(true);
    expect(normalizeCorrelationId(TRACE_ID.toUpperCase())).toBe(TRACE_ID);
  });

  it('replaces invalid and array-valued input through an injectable generator', () => {
    const generate = vi.fn(() => TRACE_ID);

    expect(resolveCorrelationId('not-a-uuid', generate)).toBe(TRACE_ID);
    expect(resolveCorrelationId([TRACE_ID], generate)).toBe(TRACE_ID);
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
