import { Inject, Injectable } from '@nestjs/common';

import type { DemoLink } from '../domain/request.js';
import { fixtureSecretForHash } from '../domain/request-catalog.js';
import { REQUEST_STATUS_LABELS } from '../domain/request-status.js';
import { REQUEST_QUERY, type RequestQueryPort } from './request-query.port.js';

@Injectable()
export class GetDemoLinksUseCase {
  constructor(@Inject(REQUEST_QUERY) private readonly requests: RequestQueryPort) {}

  async execute(): Promise<readonly DemoLink[]> {
    const records = await this.requests.listRequests();
    return records
      .flatMap((record) => {
        const accessSecret = fixtureSecretForHash(record.accessSecretHash);
        if (accessSecret === undefined) {
          return [];
        }
        return [
          {
            publicNumber: record.publicNumber,
            counterpartyName: record.counterpartyName,
            title: record.title,
            status: record.status,
            statusLabel: REQUEST_STATUS_LABELS[record.status],
            portalPath: `/r/${accessSecret}`,
            updatedAt: record.updatedAt,
          },
        ];
      })
      .sort((left, right) => left.publicNumber.localeCompare(right.publicNumber, 'ru'));
  }
}
