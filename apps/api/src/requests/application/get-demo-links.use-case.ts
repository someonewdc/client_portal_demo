import { Inject, Injectable } from '@nestjs/common';

import type { DemoLink } from '../domain/request.js';
import { REQUEST_CATALOG, fixtureSecretForHash } from '../domain/request-catalog.js';
import { REQUEST_STATUS_LABELS } from '../domain/request-status.js';
import { RequestFixtureMismatchError } from './request-fixture-mismatch.error.js';
import { REQUEST_QUERY, type RequestQueryPort } from './request-query.port.js';

const CATALOG_PUBLIC_NUMBERS = new Set(REQUEST_CATALOG.map((entry) => entry.publicNumber));

function isCompleteCatalog(publicNumbers: readonly string[]): boolean {
  if (publicNumbers.length !== CATALOG_PUBLIC_NUMBERS.size) {
    return false;
  }
  const actual = new Set(publicNumbers);
  if (actual.size !== CATALOG_PUBLIC_NUMBERS.size) {
    return false;
  }
  for (const publicNumber of CATALOG_PUBLIC_NUMBERS) {
    if (!actual.has(publicNumber)) {
      return false;
    }
  }
  return true;
}

@Injectable()
export class GetDemoLinksUseCase {
  constructor(@Inject(REQUEST_QUERY) private readonly requests: RequestQueryPort) {}

  async execute(): Promise<readonly DemoLink[]> {
    const records = await this.requests.listRequestSummaries();
    const items = records
      .map((record) => {
        const accessSecret = fixtureSecretForHash(record.accessSecretHash);
        if (accessSecret === undefined) {
          throw new RequestFixtureMismatchError();
        }
        return {
          publicNumber: record.publicNumber,
          counterpartyName: record.counterpartyName,
          title: record.title,
          status: record.status,
          statusLabel: REQUEST_STATUS_LABELS[record.status],
          portalPath: `/r/${accessSecret}`,
          updatedAt: record.updatedAt,
        };
      })
      .sort((left, right) => left.publicNumber.localeCompare(right.publicNumber, 'ru'));

    if (!isCompleteCatalog(items.map((item) => item.publicNumber))) {
      throw new RequestFixtureMismatchError();
    }

    return items;
  }
}
