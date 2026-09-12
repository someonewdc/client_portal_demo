import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { describe, expect, it } from 'vitest';

import { REQUEST_CATALOG } from '../domain/request-catalog.js';
import { RequestFixtureMismatchError } from './request-fixture-mismatch.error.js';
import type { RequestQueryPort, RequestSummary } from './request-query.port.js';
import { GetDemoLinksUseCase } from './get-demo-links.use-case.js';

function summaryFromCatalog(entry: (typeof REQUEST_CATALOG)[number]): RequestSummary {
  return {
    publicNumber: entry.publicNumber,
    counterpartyName: entry.counterpartyName,
    title: entry.title,
    status: entry.status,
    updatedAt: entry.updatedAt,
    accessSecretHash: hashOpaqueToken(entry.accessSecret),
  };
}

function queryWithSummaries(summaries: readonly RequestSummary[]): RequestQueryPort {
  return {
    listRequestSummaries: async () => summaries,
    findByAccessSecretHash: async () => null,
  };
}

function liveSummary(accessSecretHash: string): RequestSummary {
  return {
    publicNumber: 'З-10046',
    counterpartyName: 'ООО «Северная дуга»',
    title: 'Щит ЩО-70 показа',
    status: 'accepted',
    updatedAt: '2026-09-12T12:00:00.000Z',
    accessSecretHash,
  };
}

describe('GetDemoLinksUseCase', () => {
  it('builds portalPath from the fixture secret and omits the stored hash', async () => {
    const items = await new GetDemoLinksUseCase(
      queryWithSummaries(REQUEST_CATALOG.map(summaryFromCatalog)),
    ).execute();
    const expected = [...REQUEST_CATALOG].sort((left, right) =>
      left.publicNumber.localeCompare(right.publicNumber, 'ru'),
    );

    expect(items).toEqual(
      expected.map((entry) =>
        expect.objectContaining({
          publicNumber: entry.publicNumber,
          title: entry.title,
          portalPath: `/r/${entry.accessSecret}`,
        }),
      ),
    );
    for (const entry of REQUEST_CATALOG) {
      expect(JSON.stringify(items)).not.toContain(hashOpaqueToken(entry.accessSecret));
    }
    expect(items[0]).not.toHaveProperty('accessSecretHash');
  });

  it('rejects a single valid catalog hash when the other four publicNumbers are missing', async () => {
    const secret = 'seed-z10041-accepted-severenergo';
    const hash = hashOpaqueToken(secret);
    const port = queryWithSummaries([
      {
        publicNumber: 'З-10041',
        counterpartyName: 'ООО «Северэнергомонтаж»',
        title: 'Щит ЩО-70 800 А',
        status: 'accepted',
        updatedAt: '2026-09-01T10:00:00.000Z',
        accessSecretHash: hash,
      },
    ]);

    await expect(new GetDemoLinksUseCase(port).execute()).rejects.toBeInstanceOf(
      RequestFixtureMismatchError,
    );
  });

  it('rejects an empty stored catalog instead of returning no links', async () => {
    await expect(new GetDemoLinksUseCase(queryWithSummaries([])).execute()).rejects.toBeInstanceOf(
      RequestFixtureMismatchError,
    );
  });

  it('rejects a stored hash that is not in the fixture catalog instead of returning a truncated list', async () => {
    const secret = 'seed-z10041-accepted-severenergo';
    const hash = hashOpaqueToken(secret);
    const port = queryWithSummaries([
      {
        publicNumber: 'З-10041',
        counterpartyName: 'ООО «Северэнергомонтаж»',
        title: 'Щит ЩО-70 800 А',
        status: 'accepted',
        updatedAt: '2026-09-01T10:00:00.000Z',
        accessSecretHash: hash,
      },
      {
        publicNumber: 'З-10099',
        counterpartyName: 'Unknown',
        title: 'Orphan',
        status: 'accepted',
        updatedAt: '2026-09-01T10:00:00.000Z',
        accessSecretHash: 'hash-not-present-in-fixture-catalog',
      },
    ]);

    await expect(new GetDemoLinksUseCase(port).execute()).rejects.toBeInstanceOf(
      RequestFixtureMismatchError,
    );
  });

  it('omits the live З-10046 extra from items instead of failing closed', async () => {
    const items = await new GetDemoLinksUseCase(
      queryWithSummaries([
        ...REQUEST_CATALOG.map(summaryFromCatalog),
        liveSummary(hashOpaqueToken('seed-z10046-live-severnaya-duga')),
      ]),
    ).execute();

    expect(items.map((item) => item.publicNumber)).toEqual([
      'З-10041',
      'З-10042',
      'З-10043',
      'З-10044',
      'З-10045',
    ]);
    expect(items).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ publicNumber: 'З-10046' })]),
    );
  });

  it('rejects live З-10046 stored with a hash that is not the live fixture secret', async () => {
    await expect(
      new GetDemoLinksUseCase(
        queryWithSummaries([
          ...REQUEST_CATALOG.map(summaryFromCatalog),
          liveSummary('hash-not-the-live-fixture'),
        ]),
      ).execute(),
    ).rejects.toBeInstanceOf(RequestFixtureMismatchError);
  });

  it('rejects a non-live extra even when the live fixture is stored', async () => {
    await expect(
      new GetDemoLinksUseCase(
        queryWithSummaries([
          ...REQUEST_CATALOG.map(summaryFromCatalog),
          liveSummary(hashOpaqueToken('seed-z10046-live-severnaya-duga')),
          {
            publicNumber: 'З-19999',
            counterpartyName: 'ООО «Лишнее»',
            title: 'Лишняя заявка',
            status: 'accepted',
            updatedAt: '2026-09-09T00:00:00.000Z',
            accessSecretHash: 'hash-not-present-in-fixture-catalog',
          },
        ]),
      ).execute(),
    ).rejects.toBeInstanceOf(RequestFixtureMismatchError);
  });

  it('rejects an incomplete catalog even when the live fixture row is present', async () => {
    await expect(
      new GetDemoLinksUseCase(
        queryWithSummaries([
          summaryFromCatalog(REQUEST_CATALOG[0]),
          liveSummary(hashOpaqueToken('seed-z10046-live-severnaya-duga')),
        ]),
      ).execute(),
    ).rejects.toBeInstanceOf(RequestFixtureMismatchError);
  });
});
