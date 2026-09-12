import {
  configureBaseFastifyApplication,
  createCorrelatedFastifyAdapter,
} from '@client-portal/nestjs-core/bootstrap';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from '../app.module.js';
import type { ApiEnv } from '../core/config/api-env.js';
import { corsOriginsFromWebOrigin } from '../core/config/cors-origins.js';
import { ReadinessService } from '../health/readiness.service.js';

export async function createApplication(): Promise<NestFastifyApplication> {
  const adapter = createCorrelatedFastifyAdapter();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService<ApiEnv, true>);

  await configureBaseFastifyApplication(app, { globalPrefix: 'api/v1' });
  app.enableCors({
    credentials: false,
    methods: ['GET', 'HEAD', 'OPTIONS', 'POST'],
    origin: corsOriginsFromWebOrigin(config.get('WEB_ORIGIN', { infer: true })),
  });
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', (request, reply, done) => {
      const path = request.url.split('?')[0] ?? request.url;
      if (path === '/api/v1/demo/conductor' || path.startsWith('/api/v1/demo/conductor/')) {
        void reply.header('Cache-Control', 'private, no-store');
      }
      done();
    });
  const readiness = app.get(ReadinessService);
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onClose', (_instance, done) => {
      readiness.markNotReady();
      done();
    });
  return app;
}
