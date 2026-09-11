import { describe, expect, it, vi } from 'vitest';

import { CORRELATION_ID_HEADER } from '@client-portal/platform-core/correlation-id';
import { PROBLEM_DETAILS_MEDIA_TYPE } from '@client-portal/platform-core/problem-details';

import { ApiNetworkError, ApiProblemError, createProblemAwareClient } from './index.js';

const TRACE_ID = 'a30d58d2-7936-4a0a-b5c8-d6caa7f1caba';

interface TestPaths {
  readonly '/health': {
    readonly get: {
      readonly responses: {
        readonly 200: {
          readonly content: {
            readonly 'application/json': { readonly status: 'ok' };
          };
        };
      };
    };
  };
}

const validProblem = {
  detail: 'API is not ready',
  instance: '/health',
  status: 503,
  title: 'Service unavailable',
  traceId: TRACE_ID,
  type: 'https://example.test/problems/service-unavailable',
};

describe('createProblemAwareClient', () => {
  it('adds a canonical correlation ID', async () => {
    const fetch = vi.fn(async (request: Request) => {
      expect(request.headers.get(CORRELATION_ID_HEADER)).toBe(TRACE_ID);
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    });
    const client = createProblemAwareClient<TestPaths>('http://localhost:3001/', {
      createCorrelationId: () => TRACE_ID.toUpperCase(),
      fetch,
    });

    await expect(client.GET('/health')).resolves.toMatchObject({ data: { status: 'ok' } });
  });

  it('turns Problem Details responses into a typed error', async () => {
    const client = createProblemAwareClient<TestPaths>('http://localhost:3001', {
      fetch: async () =>
        new Response(JSON.stringify(validProblem), {
          headers: { 'Content-Type': PROBLEM_DETAILS_MEDIA_TYPE },
          status: 503,
        }),
    });

    await expect(client.GET('/health')).rejects.toMatchObject({
      name: 'ApiProblemError',
      problem: validProblem,
      status: 503,
    });
  });

  it('does not treat malformed field errors as Problem Details', async () => {
    const client = createProblemAwareClient<TestPaths>('http://localhost:3001', {
      fetch: async () =>
        new Response(
          JSON.stringify({
            ...validProblem,
            errors: [{ message: 'missing field' }],
          }),
          {
            headers: {
              'Content-Type': PROBLEM_DETAILS_MEDIA_TYPE,
              [CORRELATION_ID_HEADER]: TRACE_ID,
            },
            status: 400,
          },
        ),
    });

    const request = client.GET('/health');
    await expect(request).rejects.toBeInstanceOf(ApiProblemError);
    await expect(request).rejects.toMatchObject({
      problem: {
        detail: 'The API returned an undocumented error response',
        instance: '',
        status: 400,
        title: 'Request failed',
        traceId: TRACE_ID,
        type: 'about:blank',
      },
      status: 400,
    });
  });

  it('rejects with ApiNetworkError when fetch hangs past timeoutMs', async () => {
    const fetch = vi.fn(
      (request: Request) =>
        new Promise<Response>((resolve, reject) => {
          const timer = setTimeout(() => {
            resolve(
              new Response(JSON.stringify({ status: 'ok' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
              }),
            );
          }, 120);

          const abort = () => {
            clearTimeout(timer);
            reject(request.signal.reason);
          };

          if (request.signal.aborted) {
            abort();
            return;
          }

          request.signal.addEventListener('abort', abort, { once: true });
        }),
    );
    const client = createProblemAwareClient<TestPaths>('http://localhost:3001', {
      fetch,
      timeoutMs: 20,
    });

    await expect(client.GET('/health')).rejects.toBeInstanceOf(ApiNetworkError);
  });

  it('returns JSON when the response arrives before timeoutMs', async () => {
    const fetch = vi.fn(async (request: Request) => {
      expect(request.headers.get(CORRELATION_ID_HEADER)).toBe(TRACE_ID);
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    });
    const client = createProblemAwareClient<TestPaths>('http://localhost:3001/', {
      createCorrelationId: () => TRACE_ID.toUpperCase(),
      fetch,
      timeoutMs: 20,
    });

    await expect(client.GET('/health')).resolves.toMatchObject({ data: { status: 'ok' } });
  });
});
