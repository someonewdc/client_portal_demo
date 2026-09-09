import type { OnModuleDestroy } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import type { ApiEnv } from '../core/config/api-env.js';
import { PrismaClient } from '../generated/prisma/client.js';
import type { DatabaseHealthPort } from '../health/database-health.port.js';

@Injectable()
export class PrismaService implements DatabaseHealthPort, OnModuleDestroy {
  private readonly client: PrismaClient;

  constructor(@Inject(ConfigService) config: ConfigService<ApiEnv, true>) {
    const adapter = new PrismaPg({
      connectionString: config.get('DATABASE_URL', { infer: true }),
      connectionTimeoutMillis: 2_000,
    });
    this.client = new PrismaClient({ adapter });
  }

  asClient(): PrismaClient {
    return this.client;
  }

  async ping(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
