import { describe, expect, it } from 'vitest';

import { normalizeIntegerInput } from './input.js';

describe('normalizeIntegerInput', () => {
  it('keeps digits and enforces a closed integer range', () => {
    expect(normalizeIntegerInput('12abc', 1, 100_000)).toBe('12');
    expect(normalizeIntegerInput('', 0, 5_000)).toBe('0');
    expect(normalizeIntegerInput('999999', 1, 100_000)).toBe('100000');
  });
});
