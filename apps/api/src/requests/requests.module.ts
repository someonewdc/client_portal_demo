import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module.js';
import { AdvanceLiveRequestUseCase } from './application/advance-live-request.use-case.js';
import { CONDUCTOR_AUTH } from './application/conductor-auth.port.js';
import { GetConductorSnapshotUseCase } from './application/get-conductor-snapshot.use-case.js';
import { GetDemoLinksUseCase } from './application/get-demo-links.use-case.js';
import { GetRequestByAccessSecretUseCase } from './application/get-request-by-access-secret.use-case.js';
import { REQUEST_LIVE_COMMAND } from './application/request-live-command.port.js';
import { REQUEST_QUERY } from './application/request-query.port.js';
import { ResetLiveRequestUseCase } from './application/reset-live-request.use-case.js';
import { DemoConductorController } from './http/demo-conductor.controller.js';
import { DemoLinksController } from './http/demo-links.controller.js';
import { RequestPortalController } from './http/request-portal.controller.js';
import { EnvConductorAuth } from './infrastructure/env-conductor-auth.js';
import { PrismaRequestRepository } from './infrastructure/prisma-request.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [DemoConductorController, DemoLinksController, RequestPortalController],
  providers: [
    AdvanceLiveRequestUseCase,
    EnvConductorAuth,
    GetConductorSnapshotUseCase,
    GetDemoLinksUseCase,
    GetRequestByAccessSecretUseCase,
    PrismaRequestRepository,
    ResetLiveRequestUseCase,
    { provide: CONDUCTOR_AUTH, useExisting: EnvConductorAuth },
    { provide: REQUEST_LIVE_COMMAND, useExisting: PrismaRequestRepository },
    { provide: REQUEST_QUERY, useExisting: PrismaRequestRepository },
  ],
})
export class RequestsModule {}
