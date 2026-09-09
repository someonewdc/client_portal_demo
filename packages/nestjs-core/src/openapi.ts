import {
  PROBLEM_DETAILS_MEDIA_TYPE,
  type ProblemDetails,
  type ProblemFieldError,
} from '@client-portal/platform-core/problem-details';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ApiResponseNoStatusOptions } from '@nestjs/swagger';

export class TraceMetaDto {
  @ApiProperty({ format: 'uuid', type: String })
  traceId!: string;
}

export class ProblemDetailsDto implements ProblemDetails {
  @ApiProperty({ example: 'One or more fields are invalid', type: String })
  detail!: string;

  @ApiPropertyOptional({
    example: [{ field: 'pageSize', message: 'pageSize must not be greater than 48' }],
    items: {
      properties: { field: { type: 'string' }, message: { type: 'string' } },
      required: ['field', 'message'],
      type: 'object',
    },
    type: 'array',
  })
  errors?: readonly ProblemFieldError[];

  @ApiProperty({ example: '/api/v1/resources', type: String })
  instance!: string;

  @ApiProperty({ example: 400, type: Number })
  status!: number;

  @ApiProperty({ example: 'Validation failed', type: String })
  title!: string;

  @ApiProperty({ format: 'uuid', type: String })
  traceId!: string;

  @ApiProperty({ example: 'https://demo.local/problems/validation-error', type: String })
  type!: string;
}

export const RATE_LIMIT_RESPONSE = {
  content: {
    [PROBLEM_DETAILS_MEDIA_TYPE]: {
      schema: { $ref: '#/components/schemas/ProblemDetailsDto' },
    },
  },
  headers: {
    'Retry-After': {
      description: 'Seconds until the request may be retried',
      schema: { minimum: 1, type: 'integer' },
    },
  },
} satisfies ApiResponseNoStatusOptions;

export const PROBLEM_DETAILS_RESPONSE = {
  content: {
    [PROBLEM_DETAILS_MEDIA_TYPE]: {
      schema: { $ref: '#/components/schemas/ProblemDetailsDto' },
    },
  },
} satisfies ApiResponseNoStatusOptions;
