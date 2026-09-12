import { Inject, Injectable } from '@nestjs/common';

import type { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaService } from '../../persistence/prisma.service.js';
import type {
  LiveAdvanceApply,
  LiveRequestStateWrite,
  RequestLiveCommandPort,
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

type LiveTransaction = {
  $queryRaw: PrismaClient['$queryRaw'];
  request: PrismaClient['request'];
  requestFile: PrismaClient['requestFile'];
  requestStageHistory: PrismaClient['requestStageHistory'];
};

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
      const locked = await lockLiveRequest(tx);
      if (locked === null) {
        return null;
      }
      return persistLiveState(tx, locked.id, write);
    });
  }

  async applyLiveAdvance(apply: LiveAdvanceApply): Promise<RequestRecord | null | 'conflict'> {
    return this.prisma.asClient().$transaction(async (tx) => {
      const locked = await lockLiveRequest(tx);
      if (locked === null) {
        return null;
      }

      const write = apply(mapRequestRecord(locked));
      if (write === 'conflict') {
        return 'conflict';
      }

      return persistLiveState(tx, locked.id, write);
    });
  }
}

async function lockLiveRequest(tx: LiveTransaction) {
  await tx.$queryRaw`
    SELECT id FROM "Request"
    WHERE "publicNumber" = ${LIVE_REQUEST_PUBLIC_NUMBER}
    FOR UPDATE
  `;
  return tx.request.findUnique({
    include: requestInclude,
    where: { publicNumber: LIVE_REQUEST_PUBLIC_NUMBER },
  });
}

async function persistLiveState(
  tx: LiveTransaction,
  requestId: string,
  write: LiveRequestStateWrite,
): Promise<RequestRecord | null> {
  await tx.request.update({
    data: {
      status: write.status,
      updatedAt: write.updatedAt,
    },
    where: { id: requestId },
  });
  await tx.requestFile.deleteMany({ where: { requestId } });
  await tx.requestStageHistory.deleteMany({ where: { requestId } });
  await tx.requestFile.createMany({
    data: write.files.map((file, position) => ({
      byteSize: file.byteSize,
      fileName: file.fileName,
      kind: file.kind,
      position,
      requestId,
      uploadedAt: file.uploadedAt,
    })),
  });
  await tx.requestStageHistory.createMany({
    data: write.stageHistory.map((entry) => ({
      reachedAt: entry.reachedAt,
      requestId,
      status: entry.status,
    })),
  });

  const row = await tx.request.findUnique({
    include: requestInclude,
    where: { id: requestId },
  });
  return row === null ? null : mapRequestRecord(row);
}
