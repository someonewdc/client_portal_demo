import {
  CORRELATION_ID_HEADER,
  normalizeCorrelationId,
} from '@client-portal/platform-core/correlation-id';
import {
  isProblemDetails,
  type ProblemDetails,
} from '@client-portal/platform-core/problem-details';
import createClient from 'openapi-fetch';
import type { Client, ClientOptions, Middleware } from 'openapi-fetch';

export type { Client } from 'openapi-fetch';
export type {
  ProblemDetails,
  ProblemFieldError,
} from '@client-portal/platform-core/problem-details';

export interface ProblemAwareClientOptions extends Omit<ClientOptions, 'baseUrl'> {
  readonly createCorrelationId?: () => string;
}

export class ApiProblemError extends Error {
  readonly problem: ProblemDetails;
  readonly status: number;

  constructor(problem: ProblemDetails) {
    super(problem.detail);
    this.name = 'ApiProblemError';
    this.problem = problem;
    this.status = problem.status;
  }
}

export class ApiNetworkError extends Error {
  constructor(cause: unknown) {
    super('The API request could not reach the server', { cause });
    this.name = 'ApiNetworkError';
  }
}

function correlationMiddleware(createCorrelationId: () => string): Middleware {
  return {
    onRequest({ request }) {
      if (request.headers.has(CORRELATION_ID_HEADER)) {
        return;
      }

      const traceId = normalizeCorrelationId(createCorrelationId());
      if (!traceId) {
        throw new TypeError('createCorrelationId must return a canonical UUID');
      }

      request.headers.set(CORRELATION_ID_HEADER, traceId);
      return request;
    },
  };
}

const errorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (response.ok) {
      return;
    }

    const body: unknown = await response
      .clone()
      .json()
      .catch(() => undefined);
    if (isProblemDetails(body)) {
      throw new ApiProblemError(body);
    }

    throw new ApiProblemError({
      detail: 'The API returned an undocumented error response',
      instance: '',
      status: response.status,
      title: 'Request failed',
      traceId: response.headers.get(CORRELATION_ID_HEADER) ?? 'unknown',
      type: 'about:blank',
    });
  },
  onError({ error }) {
    return error instanceof ApiProblemError ? error : new ApiNetworkError(error);
  },
};

export function createProblemAwareClient<Paths extends object>(
  baseUrl: string,
  options: ProblemAwareClientOptions = {},
): Client<Paths> {
  const normalizedBaseUrl = new URL(baseUrl).toString().replace(/\/$/, '');
  const { createCorrelationId = () => globalThis.crypto.randomUUID(), ...clientOptions } = options;
  const client = createClient<Paths>({ ...clientOptions, baseUrl: normalizedBaseUrl });

  client.use(correlationMiddleware(createCorrelationId), errorMiddleware);
  return client;
}
