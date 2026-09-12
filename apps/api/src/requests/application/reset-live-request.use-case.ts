import { Inject, Injectable } from '@nestjs/common';

import { liveRequestAcceptedFixture, toConductorSnapshot } from '../domain/live-request-fixture.js';
import type { ConductorSnapshot } from '../domain/request.js';
import { CONDUCTOR_AUTH, type ConductorAuthPort } from './conductor-auth.port.js';
import { loadLiveRequestForConductor } from './load-live-request-for-conductor.js';
import { RequestFixtureMismatchError } from './request-fixture-mismatch.error.js';
import { REQUEST_LIVE_COMMAND, type RequestLiveCommandPort } from './request-live-command.port.js';
import { REQUEST_QUERY, type RequestQueryPort } from './request-query.port.js';

@Injectable()
export class ResetLiveRequestUseCase {
  constructor(
    @Inject(CONDUCTOR_AUTH) private readonly auth: ConductorAuthPort,
    @Inject(REQUEST_QUERY) private readonly requests: RequestQueryPort,
    @Inject(REQUEST_LIVE_COMMAND) private readonly liveCommand: RequestLiveCommandPort,
  ) {}

  async execute(conductorSecret: string): Promise<ConductorSnapshot> {
    await loadLiveRequestForConductor(this.auth, this.requests, conductorSecret);
    const now = new Date();
    const fixture = liveRequestAcceptedFixture(now);
    const updated = await this.liveCommand.replaceLive({
      status: fixture.status,
      updatedAt: now,
      files: fixture.files.map((file) => ({
        fileName: file.fileName,
        kind: file.kind,
        byteSize: file.byteSize,
        uploadedAt: new Date(file.uploadedAt),
      })),
      stageHistory: fixture.stageHistory.map((entry) => ({
        status: entry.status,
        reachedAt: new Date(entry.reachedAt),
      })),
    });
    if (updated === null) {
      throw new RequestFixtureMismatchError();
    }

    return toConductorSnapshot(updated);
  }
}
