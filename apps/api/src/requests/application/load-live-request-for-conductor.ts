import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';

import { LIVE_REQUEST_ACCESS_SECRET } from '../domain/live-request-fixture.js';
import type { RequestRecord } from '../domain/request.js';
import type { ConductorAuthPort } from './conductor-auth.port.js';
import { RequestFixtureMismatchError } from './request-fixture-mismatch.error.js';
import { RequestNotFoundError } from './request-not-found.error.js';
import type { RequestQueryPort } from './request-query.port.js';

export async function loadLiveRequestForConductor(
  auth: ConductorAuthPort,
  requests: RequestQueryPort,
  conductorSecret: string,
): Promise<RequestRecord> {
  if (!auth.matches(conductorSecret)) {
    throw new RequestNotFoundError();
  }

  const record = await requests.findByAccessSecretHash(hashOpaqueToken(LIVE_REQUEST_ACCESS_SECRET));
  if (record === null) {
    throw new RequestFixtureMismatchError();
  }

  return record;
}
