import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service.js';
import type {
  RequestLiveCommandPort,
  LiveRequestStateWrite,
} from '../application/request-live-command.port.js';
import type { RequestQueryPort } from '../application/request-query.port.js';
import { LIVE_REQUEST_PUBLIC_NUMBER } from '../domain/live-request-fixture.js';
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
export class PrismaRequestRepository implements RequestQueryPort, RequestLiveCommandPort {
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

  async replaceLive(write: LiveRequestStateWrite): Promise<RequestRecord | null> {
    return this.prisma.asClient().$transaction(async (tx) => {
      const existing = await tx.request.findUnique({
        where: { publicNumber: LIVE_REQUEST_PUBLIC_NUMBER },
      });
      if (existing === null) {
        return null;
      }

      await tx.request.update({
        data: {
          status: write.status,
          updatedAt: write.updatedAt,
        },
        where: { id: existing.id },
      });
      await tx.requestFile.deleteMany({ where: { requestId: existing.id } });
      await tx.requestStageHistory.deleteMany({ where: { requestId: existing.id } });
      await tx.requestFile.createMany({
        data: write.files.map((file, position) => ({
          byteSize: file.byteSize,
          fileName: file.fileName,
          kind: file.kind,
          position,
          requestId: existing.id,
          uploadedAt: file.uploadedAt,
        })),
      });
      await tx.requestStageHistory.createMany({
        data: write.stageHistory.map((entry) => ({
          reachedAt: entry.reachedAt,
          requestId: existing.id,
          status: entry.status,
        })),
      });

      const row = await tx.request.findUnique({
        include: requestInclude,
        where: { id: existing.id },
      });
      return row === null ? null : mapRequestRecord(row);
    });
  }
}
