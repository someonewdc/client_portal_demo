import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { describe, expect, it } from 'vitest';

import { RequestNotFoundError } from './request-not-found.error.js';
import type { RequestQueryPort, RequestRecord } from './request-query.port.js';
import { GetRequestByAccessSecretUseCase } from './get-request-by-access-secret.use-case.js';

const FIXTURE_SECRET = 'seed-z10043-quote-kuznetsov';
const LIVE_SECRET = 'seed-z10046-live-severnaya-duga';

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
    expect(result).not.toHaveProperty('demoLive');
    expect(JSON.stringify(result)).not.toContain('"demoLive"');
  });

  it('marks only the live fixture with demoLive true', async () => {
    const hash = hashOpaqueToken(LIVE_SECRET);
    const port: RequestQueryPort = {
      listRequestSummaries: async () => [],
      findByAccessSecretHash: async (value) =>
        value === hash
          ? {
              publicNumber: 'З-10046',
              counterpartyName: 'ООО «Северная дуга»',
              title: 'Щит ЩО-70 показа',
              status: 'accepted',
              updatedAt: '2026-09-12T12:00:00.000Z',
              accessSecretHash: hash,
              specLines: [
                {
                  name: 'Щит ЩО-70 800 А IP54',
                  quantity: 1,
                  unit: 'шт',
                  comment: 'навесной, показ',
                },
                { name: 'Комплект автоматики ввода', quantity: 1, unit: 'шт' },
              ],
              files: [
                {
                  fileName: 'Опросный-лист-З-10046.pdf',
                  kind: 'questionnaire',
                  byteSize: 100000,
                  uploadedAt: '2026-09-12T12:00:00.000Z',
                },
              ],
              stageHistory: [{ status: 'accepted', reachedAt: '2026-09-12T12:00:00.000Z' }],
            }
          : null,
    };

    const result = await new GetRequestByAccessSecretUseCase(port).execute(LIVE_SECRET);

    expect(result).toEqual(
      expect.objectContaining({
        publicNumber: 'З-10046',
        title: 'Щит ЩО-70 показа',
        status: 'accepted',
        demoLive: true,
      }),
    );
    expect(result).toHaveProperty('demoLive', true);
    expect(JSON.stringify(result)).toContain('"demoLive":true');
    expect(JSON.stringify(result)).not.toContain('"demoLive":false');
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
