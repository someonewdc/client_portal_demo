import type { IncomingMessage } from 'node:http';

import {
  CORRELATION_ID_HEADER,
  CORRELATION_ID_HEADER_LOWERCASE,
  resolveCorrelationId,
} from '@client-portal/platform-core/correlation-id';
import helmet from '@fastify/helmet';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';

import { createGlobalValidationPipe } from './validation.js';

export interface CorrelatedFastifyAdapterOptions {
  readonly trustProxy?: boolean;
}

export interface BaseFastifyApplicationOptions {
  readonly globalPrefix?: string;
}

export function createCorrelatedFastifyAdapter(
  options: CorrelatedFastifyAdapterOptions = {},
): FastifyAdapter {
  return new FastifyAdapter({
    genReqId: (request: IncomingMessage) =>
      resolveCorrelationId(request.headers[CORRELATION_ID_HEADER_LOWERCASE]),
    trustProxy: options.trustProxy ?? false,
  });
}

export async function configureBaseFastifyApplication(
  app: NestFastifyApplication,
  options: BaseFastifyApplicationOptions = {},
): Promise<void> {
  app.useLogger(app.get(Logger));
  if (options.globalPrefix) {
    app.setGlobalPrefix(options.globalPrefix);
  }
  app.useGlobalPipes(createGlobalValidationPipe());
  await app.register(helmet, { contentSecurityPolicy: false });
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', (request, reply, done) => {
      void reply.header(CORRELATION_ID_HEADER, request.id);
      done();
    });
  app.enableShutdownHooks();
}
