import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service.js';
import type { RequestQueryPort } from '../application/request-query.port.js';
import type { RequestRecord, RequestSummary } from '../domain/request.js';
import { mapRequestRecord, mapRequestSummary } from './prisma-request.mapper.js';

const requestInclude = {
  specLines: { orderBy: { position: 'asc' as const } },
  files: { orderBy: { position: 'asc' as const } },
  stageHistory: true,
};

const requestSummarySelect = {
  publicNumber: true,
  counterpartyName: true,
  title: true,
  status: true,
  updatedAt: true,
  accessSecretHash: true,
} as const;

@Injectable()
export class PrismaRequestRepository implements RequestQueryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listRequestSummaries(): Promise<readonly RequestSummary[]> {
    const rows = await this.prisma.asClient().request.findMany({
      orderBy: { publicNumber: 'asc' },
      select: requestSummarySelect,
    });
    return rows.map(mapRequestSummary);
  }

  async findByAccessSecretHash(accessSecretHash: string): Promise<RequestRecord | null> {
    const row = await this.prisma.asClient().request.findUnique({
      include: requestInclude,
      where: { accessSecretHash },
    });
    return row === null ? null : mapRequestRecord(row);
  }
}
