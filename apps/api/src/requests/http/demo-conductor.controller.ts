import { PROBLEM_DETAILS_RESPONSE } from '@client-portal/nestjs-core/openapi';
import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';

import { AdvanceLiveRequestUseCase } from '../application/advance-live-request.use-case.js';
import { GetConductorSnapshotUseCase } from '../application/get-conductor-snapshot.use-case.js';
import { ResetLiveRequestUseCase } from '../application/reset-live-request.use-case.js';
import type { ConductorSnapshot } from '../domain/request.js';
import { CapabilityCacheControlInterceptor } from './capability-cache-control.interceptor.js';
import { mapApplicationError } from './map-application-error.js';
import { ConductorSnapshotResponseDto } from './request.dto.js';

@ApiTags('demo')
@SkipThrottle()
@Controller('demo/conductor')
@UseInterceptors(CapabilityCacheControlInterceptor)
export class DemoConductorController {
  constructor(
    @Inject(GetConductorSnapshotUseCase)
    private readonly getConductorSnapshot: GetConductorSnapshotUseCase,
    @Inject(AdvanceLiveRequestUseCase)
    private readonly advanceLiveRequest: AdvanceLiveRequestUseCase,
    @Inject(ResetLiveRequestUseCase)
    private readonly resetLiveRequest: ResetLiveRequestUseCase,
  ) {}

  @Get(':conductorSecret')
  @ApiOperation({ summary: 'Снимок живой заявки для пульта ведущего' })
  @ApiParam({ name: 'conductorSecret', type: String })
  @ApiOkResponse({ type: ConductorSnapshotResponseDto })
  @ApiNotFoundResponse({
    description: 'Секрет пульта неизвестен',
    ...PROBLEM_DETAILS_RESPONSE,
  })
  async show(
    @Param('conductorSecret') conductorSecret: string,
    @Req() request: FastifyRequest,
  ): Promise<{ data: ConductorSnapshot; meta: { traceId: string } }> {
    try {
      const data = await this.getConductorSnapshot.execute(conductorSecret);
      return { data, meta: { traceId: request.id } };
    } catch (error) {
      mapApplicationError(error);
    }
  }

  @Post(':conductorSecret/advance')
  @HttpCode(200)
  @ApiOperation({ summary: 'Один переход автомата живой заявки' })
  @ApiParam({ name: 'conductorSecret', type: String })
  @ApiOkResponse({ type: ConductorSnapshotResponseDto })
  @ApiNotFoundResponse({
    description: 'Секрет пульта неизвестен',
    ...PROBLEM_DETAILS_RESPONSE,
  })
  @ApiConflictResponse({
    description: 'Живая заявка уже на последнем шаге',
    ...PROBLEM_DETAILS_RESPONSE,
  })
  async advance(
    @Param('conductorSecret') conductorSecret: string,
    @Req() request: FastifyRequest,
  ): Promise<{ data: ConductorSnapshot; meta: { traceId: string } }> {
    try {
      const data = await this.advanceLiveRequest.execute(conductorSecret);
      return { data, meta: { traceId: request.id } };
    } catch (error) {
      mapApplicationError(error);
    }
  }

  @Post(':conductorSecret/reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Сброс живой заявки к принятой' })
  @ApiParam({ name: 'conductorSecret', type: String })
  @ApiOkResponse({ type: ConductorSnapshotResponseDto })
  @ApiNotFoundResponse({
    description: 'Секрет пульта неизвестен',
    ...PROBLEM_DETAILS_RESPONSE,
  })
  async reset(
    @Param('conductorSecret') conductorSecret: string,
    @Req() request: FastifyRequest,
  ): Promise<{ data: ConductorSnapshot; meta: { traceId: string } }> {
    try {
      const data = await this.resetLiveRequest.execute(conductorSecret);
      return { data, meta: { traceId: request.id } };
    } catch (error) {
      mapApplicationError(error);
    }
  }
}
