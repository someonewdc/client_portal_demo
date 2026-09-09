import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module.js';
import { PrismaService } from '../persistence/prisma.service.js';
import { DATABASE_HEALTH } from './database-health.port.js';
import { HealthController } from './health.controller.js';
import { ReadinessService } from './readiness.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [ReadinessService, { provide: DATABASE_HEALTH, useExisting: PrismaService }],
  exports: [ReadinessService],
})
export class HealthModule {}
