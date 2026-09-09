import { isRecord } from '@client-portal/platform-core/json';
import {
  PROBLEM_DETAILS_MEDIA_TYPE,
  type ProblemDetails,
  type ProblemFieldError,
} from '@client-portal/platform-core/problem-details';
import type { ArgumentsHost, ExceptionFilter, Provider } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import type { FastifyReply, FastifyRequest } from 'fastify';

export { PROBLEM_DETAILS_MEDIA_TYPE };
export type { ProblemDetails, ProblemFieldError };

export interface ProblemDetailsFilterOptions {
  readonly typeBaseUrl: string;
}

function titleFor(status: number): string {
  if (status === HttpStatus.BAD_REQUEST) {
    return 'Validation failed';
  }
  if (status === HttpStatus.CONFLICT) {
    return 'Request conflict';
  }
  if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
    return 'Payload too large';
  }
  if (status === HttpStatus.UNSUPPORTED_MEDIA_TYPE) {
    return 'Unsupported media type';
  }
  if (status === HttpStatus.TOO_MANY_REQUESTS) {
    return 'Too many requests';
  }
  if (status === HttpStatus.NOT_FOUND) {
    return 'Resource not found';
  }
  if (status === HttpStatus.SERVICE_UNAVAILABLE) {
    return 'Service unavailable';
  }
  if (status >= 500) {
    return 'Internal server error';
  }
  return 'Request failed';
}

function typeFor(status: number): string {
  if (status === HttpStatus.BAD_REQUEST) {
    return 'validation-error';
  }
  if (status === HttpStatus.CONFLICT) {
    return 'conflict';
  }
  if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
    return 'payload-too-large';
  }
  if (status === HttpStatus.UNSUPPORTED_MEDIA_TYPE) {
    return 'unsupported-media-type';
  }
  if (status === HttpStatus.TOO_MANY_REQUESTS) {
    return 'rate-limit-exceeded';
  }
  if (status === HttpStatus.NOT_FOUND) {
    return 'not-found';
  }
  if (status === HttpStatus.SERVICE_UNAVAILABLE) {
    return 'service-unavailable';
  }
  return 'request-error';
}

function validationErrors(response: string | object): readonly ProblemFieldError[] | undefined {
  if (!isRecord(response) || !Array.isArray(response.message)) {
    return undefined;
  }

  return response.message
    .filter((message): message is string => typeof message === 'string')
    .map((message) => {
      const [field = 'request'] = message.split(' ');
      return { field, message };
    });
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  constructor(private readonly options: ProblemDetailsFilterOptions) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();
    if (reply.sent) {
      return;
    }

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const response = isHttpException ? exception.getResponse() : 'Unexpected server error';
    const errors = status === HttpStatus.BAD_REQUEST ? validationErrors(response) : undefined;
    const detail =
      status >= 500
        ? 'The server could not complete the request'
        : typeof response === 'string'
          ? response
          : isRecord(response) && typeof response.message === 'string'
            ? response.message
            : 'The request could not be completed';

    if (!isHttpException || status >= 500) {
      this.logger.error({ exception, traceId: request.id }, 'Request failed');
    }

    const problem: ProblemDetails = {
      type: `${this.options.typeBaseUrl.replace(/\/$/, '')}/${typeFor(status)}`,
      title: titleFor(status),
      status,
      detail,
      instance: request.url.split('?')[0] ?? request.url,
      traceId: request.id,
      ...(errors && errors.length > 0 ? { errors } : {}),
    };

    void reply.type(PROBLEM_DETAILS_MEDIA_TYPE).status(status).send(problem);
  }
}

export function provideProblemDetailsFilter(options: ProblemDetailsFilterOptions): Provider {
  return {
    provide: APP_FILTER,
    useFactory: () => new ProblemDetailsFilter(options),
  };
}
