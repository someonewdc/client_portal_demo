import { describe, expect, it } from 'vitest';

import { buildRequestStages } from './request-stages.js';

describe('buildRequestStages', () => {
  it('always returns four canonical stages with future steps as null', () => {
    const stages = buildRequestStages([
      { status: 'accepted', reachedAt: '2026-09-01T09:00:00.000Z' },
      { status: 'in_calculation', reachedAt: '2026-09-02T11:00:00.000Z' },
      { status: 'quote_ready', reachedAt: '2026-09-04T12:00:00.000Z' },
    ]);

    expect(stages).toEqual([
      { status: 'accepted', label: 'Принят', reachedAt: '2026-09-01T09:00:00.000Z' },
      { status: 'in_calculation', label: 'В расчёте', reachedAt: '2026-09-02T11:00:00.000Z' },
      { status: 'quote_ready', label: 'КП готово', reachedAt: '2026-09-04T12:00:00.000Z' },
      { status: 'invoice_issued', label: 'Счёт выставлен', reachedAt: null },
    ]);
  });
});
