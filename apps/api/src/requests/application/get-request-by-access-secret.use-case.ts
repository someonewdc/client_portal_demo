import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { Inject, Injectable } from '@nestjs/common';

import type { RequestPortalView } from '../domain/request.js';
import { PLANT_NAME, REQUEST_STATUS_LABELS } from '../domain/request-status.js';
import { buildRequestStages } from '../domain/request-stages.js';
import { RequestNotFoundError } from './request-not-found.error.js';
import { REQUEST_QUERY, type RequestQueryPort } from './request-query.port.js';

@Injectable()
export class GetRequestByAccessSecretUseCase {
  constructor(@Inject(REQUEST_QUERY) private readonly requests: RequestQueryPort) {}

  async execute(accessSecret: string): Promise<RequestPortalView> {
    const record = await this.requests.findByAccessSecretHash(hashOpaqueToken(accessSecret));
    if (record === null) {
      throw new RequestNotFoundError();
    }

    return {
      publicNumber: record.publicNumber,
      counterpartyName: record.counterpartyName,
      title: record.title,
      status: record.status,
      statusLabel: REQUEST_STATUS_LABELS[record.status],
      updatedAt: record.updatedAt,
      plantName: PLANT_NAME,
      stages: buildRequestStages(record.stageHistory),
      specLines: record.specLines,
      files: record.files,
    };
  }
}
