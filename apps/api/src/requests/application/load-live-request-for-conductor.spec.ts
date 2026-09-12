import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { describe, expect, it } from 'vitest';

import { LIVE_REQUEST_ACCESS_SECRET } from '../domain/live-request-fixture.js';
import type { RequestRecord } from '../domain/request.js';
import type { ConductorAuthPort } from './conductor-auth.port.js';
import { loadLiveRequestForConductor } from './load-live-request-for-conductor.js';
import { RequestFixtureMismatchError } from './request-fixture-mismatch.error.js';
import type { RequestQueryPort } from './request-query.port.js';

const CONDUCTOR_SECRET = 'seed-demo-conductor-nordshield';

const auth: ConductorAuthPort = {
  matches: (secret) => secret === CONDUCTOR_SECRET,
};

function liveHashOnWrongNumber(): RequestRecord {
  return {
    publicNumber: 'З-19999',
    counterpartyName: 'ООО «Лишнее»',
    title: 'Чужая заявка',
    status: 'accepted',
    updatedAt: '2026-09-12T12:00:00.000Z',
    accessSecretHash: hashOpaqueToken(LIVE_REQUEST_ACCESS_SECRET),
    specLines: [],
    files: [],
    stageHistory: [{ status: 'accepted', reachedAt: '2026-09-12T12:00:00.000Z' }],
  };
}

function queryWithRecord(record: RequestRecord | null): RequestQueryPort {
  return {
    listRequestSummaries: async () => [],
    findByAccessSecretHash: async () => record,
  };
}

describe('loadLiveRequestForConductor', () => {
  it('rejects a live access-secret hash paired with a different publicNumber', async () => {
    await expect(
      loadLiveRequestForConductor(auth, queryWithRecord(liveHashOnWrongNumber()), CONDUCTOR_SECRET),
    ).rejects.toBeInstanceOf(RequestFixtureMismatchError);
  });
});
