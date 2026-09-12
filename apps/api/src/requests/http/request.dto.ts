import { TraceMetaDto } from '@client-portal/nestjs-core/openapi';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { REQUEST_FILE_KINDS, REQUEST_STATUSES } from '../domain/request-status.js';

export class DemoLinkItemDto {
  @ApiProperty({ example: 'З-10041', type: String })
  publicNumber!: string;

  @ApiProperty({ example: 'ООО «Северэнергомонтаж»', type: String })
  counterpartyName!: string;

  @ApiProperty({ example: 'Щит ЩО-70 800 А', type: String })
  title!: string;

  @ApiProperty({ enum: REQUEST_STATUSES, example: 'accepted', type: String })
  status!: string;

  @ApiProperty({ example: 'Принят', type: String })
  statusLabel!: string;

  @ApiProperty({ example: '/r/seed-z10041-accepted-severenergo', type: String })
  portalPath!: string;

  @ApiProperty({ example: '2026-09-01T10:00:00.000Z', format: 'date-time', type: String })
  updatedAt!: string;
}

export class DemoLinksDataDto {
  @ApiProperty({ type: () => DemoLinkItemDto, isArray: true })
  items!: DemoLinkItemDto[];
}

export class DemoLinksResponseDto {
  @ApiProperty({ type: () => DemoLinksDataDto })
  data!: DemoLinksDataDto;

  @ApiProperty({ type: () => TraceMetaDto })
  meta!: TraceMetaDto;
}

export class RequestStageDto {
  @ApiProperty({ enum: REQUEST_STATUSES, type: String })
  status!: string;

  @ApiProperty({ example: 'Принят', type: String })
  label!: string;

  @ApiProperty({
    example: '2026-09-01T09:00:00.000Z',
    format: 'date-time',
    nullable: true,
    type: String,
  })
  reachedAt!: string | null;
}

export class RequestSpecLineDto {
  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: 'integer', example: 1, format: 'int32' })
  quantity!: number;

  @ApiProperty({ example: 'шт', type: String })
  unit!: string;

  @ApiPropertyOptional({ example: 'IP54, навесное', type: String })
  comment?: string;
}

export class RequestFileDto {
  @ApiProperty({ example: 'КП-З-10043.pdf', type: String })
  fileName!: string;

  @ApiProperty({ enum: REQUEST_FILE_KINDS, type: String })
  kind!: string;

  @ApiProperty({ type: 'integer', example: 240000, format: 'int32' })
  byteSize!: number;

  @ApiProperty({ example: '2026-09-04T12:00:00.000Z', format: 'date-time', type: String })
  uploadedAt!: string;
}

export class RequestPortalDataDto {
  @ApiProperty({ example: 'З-10043', type: String })
  publicNumber!: string;

  @ApiProperty({ example: 'ИП Кузнецов П.А.', type: String })
  counterpartyName!: string;

  @ApiProperty({ example: 'ВРУ 400 А', type: String })
  title!: string;

  @ApiProperty({ enum: REQUEST_STATUSES, example: 'quote_ready', type: String })
  status!: string;

  @ApiProperty({ example: 'КП готово', type: String })
  statusLabel!: string;

  @ApiProperty({ example: '2026-09-04T12:00:00.000Z', format: 'date-time', type: String })
  updatedAt!: string;

  @ApiProperty({ example: 'ПК «Нордщит»', type: String })
  plantName!: string;

  @ApiProperty({
    type: () => RequestStageDto,
    isArray: true,
    maxItems: 4,
    minItems: 4,
  })
  stages!: RequestStageDto[];

  @ApiProperty({
    type: () => RequestSpecLineDto,
    isArray: true,
    maxItems: 5,
    minItems: 2,
  })
  specLines!: RequestSpecLineDto[];

  @ApiProperty({ type: () => RequestFileDto, isArray: true })
  files!: RequestFileDto[];

  @ApiPropertyOptional({ example: true, type: Boolean })
  demoLive?: true;
}

export class RequestPortalResponseDto {
  @ApiProperty({ type: () => RequestPortalDataDto })
  data!: RequestPortalDataDto;

  @ApiProperty({ type: () => TraceMetaDto })
  meta!: TraceMetaDto;
}

export class ConductorSnapshotDataDto {
  @ApiProperty({ example: 'З-10046', type: String })
  publicNumber!: string;

  @ApiProperty({ enum: REQUEST_STATUSES, example: 'accepted', type: String })
  status!: string;

  @ApiProperty({ example: 'Принят', type: String })
  statusLabel!: string;

  @ApiProperty({ example: '/r/seed-z10046-live-severnaya-duga', type: String })
  portalPath!: string;

  @ApiProperty({
    enum: REQUEST_STATUSES,
    example: 'in_calculation',
    nullable: true,
    type: String,
  })
  nextStatus!: string | null;

  @ApiProperty({ example: 'В расчёте', nullable: true, type: String })
  nextStatusLabel!: string | null;
}

export class ConductorSnapshotResponseDto {
  @ApiProperty({ type: () => ConductorSnapshotDataDto })
  data!: ConductorSnapshotDataDto;

  @ApiProperty({ type: () => TraceMetaDto })
  meta!: TraceMetaDto;
}
