import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { describe, expect, it } from 'vitest';

import type { RequestQueryPort } from './request-query.port.js';
import { GetDemoLinksUseCase } from './get-demo-links.use-case.js';

describe('GetDemoLinksUseCase', () => {
  it('builds portalPath from the fixture secret and omits the stored hash', async () => {
    const secret = 'seed-z10041-accepted-severenergo';
    const hash = hashOpaqueToken(secret);
    const port: RequestQueryPort = {
      listRequests: async () => [
        {
          publicNumber: 'З-10041',
          counterpartyName: 'ООО «Северэнергомонтаж»',
          title: 'Щит ЩО-70 800 А',
          status: 'accepted',
          updatedAt: '2026-09-01T10:00:00.000Z',
          accessSecretHash: hash,
          specLines: [],
          files: [],
          stageHistory: [{ status: 'accepted', reachedAt: '2026-09-01T09:00:00.000Z' }],
        },
      ],
      findByAccessSecretHash: async () => null,
    };

    const items = await new GetDemoLinksUseCase(port).execute();

    expect(items).toEqual([
      expect.objectContaining({
        publicNumber: 'З-10041',
        title: 'Щит ЩО-70 800 А',
        portalPath: `/r/${secret}`,
      }),
    ]);
    expect(JSON.stringify(items)).not.toContain(hash);
    expect(items[0]).not.toHaveProperty('accessSecretHash');
  });
});
