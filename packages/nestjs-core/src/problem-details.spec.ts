import { BadRequestException, Logger } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PROBLEM_DETAILS_MEDIA_TYPE, ProblemDetailsFilter } from './problem-details.js';

function createHttpHost(url: string) {
  const send = vi.fn();
  const status = vi.fn(() => ({ send }));
  const type = vi.fn(() => ({ status }));
  const host = {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({ id: 'trace-id', url }),
      getResponse: () => ({ sent: false, type }),
    }),
  } as unknown as ArgumentsHost;

  return { host, send, status, type };
}

describe('ProblemDetailsFilter', () => {
  it('shapes validation errors without exposing query parameters', () => {
    const { host, send, status, type } = createHttpHost('/items?token=secret');
    const filter = new ProblemDetailsFilter({ typeBaseUrl: 'https://example.test/problems/' });

    filter.catch(new BadRequestException(['page must be positive']), host);

    expect(type).toHaveBeenCalledWith(PROBLEM_DETAILS_MEDIA_TYPE);
    expect(status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith({
      type: 'https://example.test/problems/validation-error',
      title: 'Validation failed',
      status: 400,
      detail: 'The request could not be completed',
      instance: '/items',
      traceId: 'trace-id',
      errors: [{ field: 'page', message: 'page must be positive' }],
    });
  });

  it('serializes unexpected errors as 500 Problem Details', () => {
    const { host, send, status, type } = createHttpHost('/health/ready');
    const filter = new ProblemDetailsFilter({ typeBaseUrl: 'https://example.test/problems/' });
    const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    filter.catch(new Error('secret internals'), host);

    expect(logError).toHaveBeenCalled();
    expect(type).toHaveBeenCalledWith(PROBLEM_DETAILS_MEDIA_TYPE);
    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({
      type: 'https://example.test/problems/request-error',
      title: 'Internal server error',
      status: 500,
      detail: 'The server could not complete the request',
      instance: '/health/ready',
      traceId: 'trace-id',
    });
  });
});
