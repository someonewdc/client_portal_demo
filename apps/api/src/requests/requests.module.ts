import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module.js';
import { GetDemoLinksUseCase } from './application/get-demo-links.use-case.js';
import { GetRequestByAccessSecretUseCase } from './application/get-request-by-access-secret.use-case.js';
import { REQUEST_QUERY } from './application/request-query.port.js';
import { DemoLinksController } from './http/demo-links.controller.js';
import { RequestPortalController } from './http/request-portal.controller.js';
import { PrismaRequestRepository } from './infrastructure/prisma-request.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [DemoLinksController, RequestPortalController],
  providers: [
    GetDemoLinksUseCase,
    GetRequestByAccessSecretUseCase,
    PrismaRequestRepository,
    { provide: REQUEST_QUERY, useExisting: PrismaRequestRepository },
  ],
})
export class RequestsModule {}
