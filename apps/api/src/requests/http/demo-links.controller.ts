import { Controller, Get, Inject, Req, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { GetDemoLinksUseCase } from '../application/get-demo-links.use-case.js';
import type { DemoLink } from '../domain/request.js';
import { CapabilityCacheControlInterceptor } from './capability-cache-control.interceptor.js';
import { DemoLinksResponseDto } from './request.dto.js';

@ApiTags('demo')
@Controller('demo')
@UseInterceptors(CapabilityCacheControlInterceptor)
export class DemoLinksController {
  constructor(@Inject(GetDemoLinksUseCase) private readonly getDemoLinks: GetDemoLinksUseCase) {}

  @Get('links')
  @ApiOperation({ summary: 'Служебный список демо-ссылок на заявки' })
  @ApiOkResponse({ type: DemoLinksResponseDto })
  async list(@Req() request: FastifyRequest): Promise<{
    data: { items: readonly DemoLink[] };
    meta: { traceId: string };
  }> {
    const items = await this.getDemoLinks.execute();
    return { data: { items }, meta: { traceId: request.id } };
  }
}
