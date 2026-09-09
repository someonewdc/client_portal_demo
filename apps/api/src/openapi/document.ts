import { ProblemDetailsDto, TraceMetaDto } from '@client-portal/nestjs-core/openapi';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function buildOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('ПК «Нордщит» — кабинет заявки')
    .setVersion('0.0.0')
    .addServer('/api/v1')
    .build();

  return SwaggerModule.createDocument(app, config, {
    extraModels: [ProblemDetailsDto, TraceMetaDto],
    ignoreGlobalPrefix: true,
  });
}
