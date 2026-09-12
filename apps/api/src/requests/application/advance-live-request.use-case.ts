import { Inject, Injectable } from '@nestjs/common';

import { mergeLiveFilesAfterAdvance, toConductorSnapshot } from '../domain/live-request-fixture.js';
import type { ConductorSnapshot } from '../domain/request.js';
import { nextRequestStatus } from '../domain/request-status.js';
import { CONDUCTOR_AUTH, type ConductorAuthPort } from './conductor-auth.port.js';
import { LiveRequestAdvanceConflictError } from './live-request-advance-conflict.error.js';
import { loadLiveRequestForConductor } from './load-live-request-for-conductor.js';
import { RequestFixtureMismatchError } from './request-fixture-mismatch.error.js';
import { REQUEST_LIVE_COMMAND, type RequestLiveCommandPort } from './request-live-command.port.js';
import { REQUEST_QUERY, type RequestQueryPort } from './request-query.port.js';

@Injectable()
export class AdvanceLiveRequestUseCase {
  constructor(
    @Inject(CONDUCTOR_AUTH) private readonly auth: ConductorAuthPort,
    @Inject(REQUEST_QUERY) private readonly requests: RequestQueryPort,
    @Inject(REQUEST_LIVE_COMMAND) private readonly liveCommand: RequestLiveCommandPort,
  ) {}

  async execute(conductorSecret: string): Promise<ConductorSnapshot> {
    const record = await loadLiveRequestForConductor(this.auth, this.requests, conductorSecret);
    const nextStatus = nextRequestStatus(record.status);
    if (nextStatus === null) {
      throw new LiveRequestAdvanceConflictError();
    }

    const now = new Date();
    const updated = await this.liveCommand.replaceLive({
      status: nextStatus,
      updatedAt: now,
      files: mergeLiveFilesAfterAdvance(record, nextStatus, now).map((file) => ({
        fileName: file.fileName,
        kind: file.kind,
        byteSize: file.byteSize,
        uploadedAt: new Date(file.uploadedAt),
      })),
      stageHistory: [
        ...record.stageHistory.map((entry) => ({
          status: entry.status,
          reachedAt: new Date(entry.reachedAt),
        })),
        { status: nextStatus, reachedAt: now },
      ],
    });
    if (updated === null) {
      throw new RequestFixtureMismatchError();
    }

    return toConductorSnapshot(updated);
  }
}
