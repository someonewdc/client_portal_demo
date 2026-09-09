import { ProblemDetailsDto } from '@client-portal/nestjs-core/openapi';
import { Controller, Get, Inject, Param, Req } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { GetRequestByAccessSecretUseCase } from '../application/get-request-by-access-secret.use-case.js';
import type { RequestPortalView } from '../domain/request.js';
import { mapApplicationError } from './map-application-error.js';
import { RequestPortalResponseDto } from './request.dto.js';

@ApiTags('requests')
@Controller('requests')
export class RequestPortalController {
  constructor(
    @Inject(GetRequestByAccessSecretUseCase)
    private readonly getRequestByAccessSecret: GetRequestByAccessSecretUseCase,
  ) {}

  @Get(':accessSecret')
  @ApiOperation({ summary: 'Кабинет одной заявки по секрету в URL' })
  @ApiParam({ name: 'accessSecret', type: String })
  @ApiOkResponse({ type: RequestPortalResponseDto })
  @ApiNotFoundResponse({ type: ProblemDetailsDto })
  async show(
    @Param('accessSecret') accessSecret: string,
    @Req() request: FastifyRequest,
  ): Promise<{ data: RequestPortalView; meta: { traceId: string } }> {
    try {
      const data = await this.getRequestByAccessSecret.execute(accessSecret);
      return { data, meta: { traceId: request.id } };
    } catch (error) {
      mapApplicationError(error);
    }
  }
}
