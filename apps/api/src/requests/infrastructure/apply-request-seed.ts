import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client.js';
import { REQUEST_CATALOG } from '../domain/request-catalog.js';

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error('DATABASE_URL is required to seed');
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      connectionTimeoutMillis: 2_000,
    }),
  });
}

export async function applyRequestSeed(): Promise<void> {
  const prisma = createPrisma();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.request.deleteMany({
        where: {
          publicNumber: {
            notIn: REQUEST_CATALOG.map((fixture) => fixture.publicNumber),
          },
        },
      });

      for (const fixture of REQUEST_CATALOG) {
        const accessSecretHash = hashOpaqueToken(fixture.accessSecret);
        const request = await tx.request.upsert({
          create: {
            accessSecretHash,
            counterpartyName: fixture.counterpartyName,
            publicNumber: fixture.publicNumber,
            status: fixture.status,
            title: fixture.title,
            updatedAt: new Date(fixture.updatedAt),
          },
          update: {
            accessSecretHash,
            counterpartyName: fixture.counterpartyName,
            status: fixture.status,
            title: fixture.title,
            updatedAt: new Date(fixture.updatedAt),
          },
          where: { publicNumber: fixture.publicNumber },
        });

        await tx.requestSpecLine.deleteMany({ where: { requestId: request.id } });
        await tx.requestFile.deleteMany({ where: { requestId: request.id } });
        await tx.requestStageHistory.deleteMany({ where: { requestId: request.id } });

        await tx.requestSpecLine.createMany({
          data: fixture.specLines.map((line, position) => ({
            comment: line.comment ?? null,
            name: line.name,
            position,
            quantity: line.quantity,
            requestId: request.id,
            unit: line.unit,
          })),
        });
        await tx.requestFile.createMany({
          data: fixture.files.map((file, position) => ({
            byteSize: file.byteSize,
            fileName: file.fileName,
            kind: file.kind,
            position,
            requestId: request.id,
            uploadedAt: new Date(file.uploadedAt),
          })),
        });
        await tx.requestStageHistory.createMany({
          data: fixture.stageHistory.map((entry) => ({
            reachedAt: new Date(entry.reachedAt),
            requestId: request.id,
            status: entry.status,
          })),
        });
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}
