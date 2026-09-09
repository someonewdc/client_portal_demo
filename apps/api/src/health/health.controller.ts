import { PROBLEM_DETAILS_RESPONSE } from '@client-portal/nestjs-core/openapi';
import { Controller, Get, Inject, Req, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { HealthResponseDto } from './health.dto.js';
import { ReadinessService } from './readiness.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(ReadinessService) private readonly readiness: ReadinessService) {}

  @Get('live')
  @ApiOperation({ summary: 'Проверить, что процесс API работает' })
  @ApiOkResponse({ description: 'Процесс жив', type: HealthResponseDto })
  live(@Req() request: FastifyRequest): HealthResponseDto {
    return { data: { status: 'ok' }, meta: { traceId: request.id } };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Проверить готовность API принимать трафик' })
  @ApiOkResponse({ description: 'API принимает трафик', type: HealthResponseDto })
  @ApiServiceUnavailableResponse({
    description: 'API ещё не слушает, уже останавливается или база данных недоступна',
    ...PROBLEM_DETAILS_RESPONSE,
  })
  async ready(@Req() request: FastifyRequest): Promise<HealthResponseDto> {
    if (!(await this.readiness.isReady())) {
      throw new ServiceUnavailableException('API is not ready');
    }

    return { data: { status: 'ok' }, meta: { traceId: request.id } };
  }
}
