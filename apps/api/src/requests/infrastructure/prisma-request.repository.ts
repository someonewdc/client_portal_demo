import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service.js';
import type { RequestQueryPort } from '../application/request-query.port.js';
import type { RequestRecord } from '../domain/request.js';
import { mapRequestRecord } from './prisma-request.mapper.js';

const requestInclude = {
  specLines: { orderBy: { position: 'asc' as const } },
  files: { orderBy: { position: 'asc' as const } },
  stageHistory: true,
};

@Injectable()
export class PrismaRequestRepository implements RequestQueryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listRequests(): Promise<readonly RequestRecord[]> {
    const rows = await this.prisma.asClient().request.findMany({
      include: requestInclude,
      orderBy: { publicNumber: 'asc' },
    });
    return rows.map(mapRequestRecord);
  }

  async findByAccessSecretHash(accessSecretHash: string): Promise<RequestRecord | null> {
    const row = await this.prisma.asClient().request.findUnique({
      include: requestInclude,
      where: { accessSecretHash },
    });
    return row === null ? null : mapRequestRecord(row);
  }
}
