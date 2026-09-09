import { describe, expect, it, vi } from 'vitest';

import { createApiClient } from './index.js';

const TRACE_ID = 'a30d58d2-7936-4a0a-b5c8-d6caa7f1caba';

describe('createApiClient', () => {
  it('calls GET /demo/links on the prefixed base URL without credentials include', async () => {
    const fetch = vi.fn(async (request: Request) => {
      expect(request.url).toBe('http://localhost:3001/api/v1/demo/links');
      expect(request.credentials).not.toBe('include');
      return new Response(
        JSON.stringify({
          data: { items: [] },
          meta: { traceId: TRACE_ID },
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    });
    const client = createApiClient('http://localhost:3001/api/v1', { fetch });

    await expect(client.GET('/demo/links')).resolves.toMatchObject({
      data: { data: { items: [] }, meta: { traceId: TRACE_ID } },
    });
  });
});
