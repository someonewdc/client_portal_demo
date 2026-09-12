import { Inject, Injectable } from '@nestjs/common';

import { mergeLiveFilesAfterAdvance, toConductorSnapshot } from '../domain/live-request-fixture.js';
import type { ConductorSnapshot } from '../domain/request.js';
import { nextRequestStatus } from '../domain/request-status.js';
import { CONDUCTOR_AUTH, type ConductorAuthPort } from './conductor-auth.port.js';
import { LiveRequestAdvanceConflictError } from './live-request-advance-conflict.error.js';
import { RequestFixtureMismatchError } from './request-fixture-mismatch.error.js';
import { RequestNotFoundError } from './request-not-found.error.js';
import { REQUEST_LIVE_COMMAND, type RequestLiveCommandPort } from './request-live-command.port.js';

@Injectable()
export class AdvanceLiveRequestUseCase {
  constructor(
    @Inject(CONDUCTOR_AUTH) private readonly auth: ConductorAuthPort,
    @Inject(REQUEST_LIVE_COMMAND) private readonly liveCommand: RequestLiveCommandPort,
  ) {}

  async execute(conductorSecret: string): Promise<ConductorSnapshot> {
    if (!this.auth.matches(conductorSecret)) {
      throw new RequestNotFoundError();
    }

    const updated = await this.liveCommand.applyLiveAdvance((record) => {
      const nextStatus = nextRequestStatus(record.status);
      if (nextStatus === null) {
        return 'conflict';
      }

      const now = new Date();
      return {
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
      };
    });
    if (updated === 'conflict') {
      throw new LiveRequestAdvanceConflictError();
    }
    if (updated === null) {
      throw new RequestFixtureMismatchError();
    }

    return toConductorSnapshot(updated);
  }
}
