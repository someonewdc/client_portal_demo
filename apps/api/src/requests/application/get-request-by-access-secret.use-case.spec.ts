import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { describe, expect, it } from 'vitest';

import { RequestNotFoundError } from './request-not-found.error.js';
import type { RequestQueryPort, RequestRecord } from './request-query.port.js';
import { GetRequestByAccessSecretUseCase } from './get-request-by-access-secret.use-case.js';

const FIXTURE_SECRET = 'seed-z10043-quote-kuznetsov';

function quoteRecord(accessSecretHash: string): RequestRecord {
  return {
    publicNumber: 'З-10043',
    counterpartyName: 'ИП Кузнецов П.А.',
    title: 'ВРУ 400 А',
    status: 'quote_ready',
    updatedAt: '2026-09-04T12:00:00.000Z',
    accessSecretHash,
    specLines: [
      {
        name: 'Вводно-распределительное устройство 400 А',
        quantity: 1,
        unit: 'шт',
        comment: 'IP54, навесное',
      },
      { name: 'Рубильник ввода', quantity: 1, unit: 'шт' },
    ],
    files: [
      {
        fileName: 'КП-З-10043.pdf',
        kind: 'quote',
        byteSize: 240000,
        uploadedAt: '2026-09-04T12:00:00.000Z',
      },
    ],
    stageHistory: [
      { status: 'accepted', reachedAt: '2026-09-01T09:00:00.000Z' },
      { status: 'in_calculation', reachedAt: '2026-09-02T11:00:00.000Z' },
      { status: 'quote_ready', reachedAt: '2026-09-04T12:00:00.000Z' },
    ],
  };
}

describe('GetRequestByAccessSecretUseCase', () => {
  it('looks up by hashOpaqueToken and does not put the hash in the portal view', async () => {
    const hash = hashOpaqueToken(FIXTURE_SECRET);
    const lookups: string[] = [];
    const port: RequestQueryPort = {
      listRequestSummaries: async () => [],
      findByAccessSecretHash: async (value) => {
        lookups.push(value);
        return value === hash ? quoteRecord(hash) : null;
      },
    };
    const useCase = new GetRequestByAccessSecretUseCase(port);

    const result = await useCase.execute(FIXTURE_SECRET);

    expect(lookups).toEqual([hash]);
    expect(lookups).not.toContain(FIXTURE_SECRET);
    expect(result.status).toBe('quote_ready');
    expect(result.stages).toHaveLength(4);
    expect(JSON.stringify(result)).not.toContain(hash);
    expect(result).not.toHaveProperty('accessSecretHash');
  });

  it('throws a typed not-found error for an unknown secret', async () => {
    const port: RequestQueryPort = {
      listRequestSummaries: async () => [],
      findByAccessSecretHash: async () => null,
    };
    const useCase = new GetRequestByAccessSecretUseCase(port);

    await expect(useCase.execute('unknown-secret-not-in-seed')).rejects.toBeInstanceOf(
      RequestNotFoundError,
    );
  });
});
