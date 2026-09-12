import { describe, expect, it } from 'vitest';

import { liveFilesForStatus, liveRequestAcceptedFixture } from './live-request-fixture.js';
import { REQUEST_CATALOG } from './request-catalog.js';

type SpecLineLike = {
  readonly name?: string;
  readonly quantity?: number;
  readonly unit?: string;
};

function specLineIdentity(lines: unknown): string {
  if (!Array.isArray(lines)) {
    return '';
  }

  return [...lines]
    .map((line) => {
      const rec = line as SpecLineLike;
      return `${String(rec.name)}|${String(rec.quantity)}|${String(rec.unit)}`;
    })
    .sort()
    .join('||');
}

function fileSpecLines(file: object | undefined): unknown {
  if (file === undefined || !('specLines' in file)) {
    return undefined;
  }

  return file.specLines;
}

describe('request file spec lines', () => {
  it('keeps Z-10044 cabinet specLines and gives each file kind a distinct table', () => {
    const entry = REQUEST_CATALOG.find((item) => item.publicNumber === 'З-10044');
    expect(entry?.specLines).toEqual([
      { name: 'Щит управления теплицами', quantity: 1, unit: 'комплект' },
      { name: 'Шкаф частотников', quantity: 1, unit: 'шт' },
    ]);

    const identities = (['questionnaire', 'quote', 'invoice'] as const).map((kind) => {
      const file = entry?.files.find((item) => item.kind === kind);
      const identity = specLineIdentity(fileSpecLines(file));
      expect(identity.length, `${kind} specLines`).toBeGreaterThan(0);
      return identity;
    });

    expect(new Set(identities).size).toBe(3);
  });

  it('gives live Z-10046 distinct file spec tables at invoice_issued and keeps cabinet specLines', () => {
    const accepted = liveRequestAcceptedFixture(new Date('2026-09-12T12:00:00.000Z'));
    expect(accepted.specLines).toEqual([
      {
        name: 'Щит ЩО-70 800 А IP54',
        quantity: 1,
        unit: 'шт',
        comment: 'навесной, показ',
      },
      { name: 'Комплект автоматики ввода', quantity: 1, unit: 'шт' },
    ]);

    const files = liveFilesForStatus('invoice_issued', new Date('2026-09-12T12:00:00.000Z'));
    const identities = (['questionnaire', 'quote', 'invoice'] as const).map((kind) => {
      const file = files.find((item) => item.kind === kind);
      const identity = specLineIdentity(fileSpecLines(file));
      expect(identity.length, `${kind} specLines`).toBeGreaterThan(0);
      return identity;
    });

    expect(new Set(identities).size).toBe(3);
  });
});
