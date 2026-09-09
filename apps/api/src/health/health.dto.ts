import { TraceMetaDto } from '@client-portal/nestjs-core/openapi';
import { ApiProperty } from '@nestjs/swagger';

export class HealthDataDto {
  @ApiProperty({ enum: ['ok'], example: 'ok', type: String })
  status!: 'ok';
}

export class HealthResponseDto {
  @ApiProperty({ type: () => HealthDataDto })
  data!: HealthDataDto;

  @ApiProperty({ type: () => TraceMetaDto })
  meta!: TraceMetaDto;
}
