import { Controller, Get, Inject, Req, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { ReadinessService } from './readiness.service.js';

interface HealthResponse {
  readonly data: {
    readonly status: 'ok';
  };
  readonly meta: {
    readonly traceId: string;
  };
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(ReadinessService) private readonly readiness: ReadinessService) {}

  @Get('live')
  @ApiOperation({ summary: 'Проверить, что процесс API работает' })
  @ApiOkResponse({ description: 'Процесс жив' })
  live(@Req() request: FastifyRequest): HealthResponse {
    return { data: { status: 'ok' }, meta: { traceId: request.id } };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Проверить готовность API принимать трафик' })
  @ApiOkResponse({ description: 'API принимает трафик' })
  @ApiServiceUnavailableResponse({
    description: 'API ещё не слушает, уже останавливается или база данных недоступна',
  })
  async ready(@Req() request: FastifyRequest): Promise<HealthResponse> {
    if (!(await this.readiness.isReady())) {
      throw new ServiceUnavailableException('API is not ready');
    }

    return { data: { status: 'ok' }, meta: { traceId: request.id } };
  }
}
