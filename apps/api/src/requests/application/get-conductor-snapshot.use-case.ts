import { Inject, Injectable } from '@nestjs/common';

import { toConductorSnapshot } from '../domain/live-request-fixture.js';
import type { ConductorSnapshot } from '../domain/request.js';
import { CONDUCTOR_AUTH, type ConductorAuthPort } from './conductor-auth.port.js';
import { loadLiveRequestForConductor } from './load-live-request-for-conductor.js';
import { REQUEST_QUERY, type RequestQueryPort } from './request-query.port.js';

@Injectable()
export class GetConductorSnapshotUseCase {
  constructor(
    @Inject(CONDUCTOR_AUTH) private readonly auth: ConductorAuthPort,
    @Inject(REQUEST_QUERY) private readonly requests: RequestQueryPort,
  ) {}

  async execute(conductorSecret: string): Promise<ConductorSnapshot> {
    const record = await loadLiveRequestForConductor(this.auth, this.requests, conductorSecret);
    return toConductorSnapshot(record);
  }
}
