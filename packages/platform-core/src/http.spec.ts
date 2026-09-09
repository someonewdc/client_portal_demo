import { describe, expect, it } from 'vitest';

import {
  JsonResponseTooLargeError,
  readBoundedJsonResponse,
  serializeHttpRequest,
} from './http.js';

describe('HTTP primitives', () => {
  it('removes query data from request logs', () => {
    expect(
      serializeHttpRequest({ id: 'trace', method: 'GET', url: '/health?token=secret' }),
    ).toEqual({ id: 'trace', method: 'GET', url: '/health' });
  });

  it('rejects a streamed response above its byte budget', async () => {
    const response = new Response(JSON.stringify({ value: 'too large' }));

    await expect(readBoundedJsonResponse(response, 4)).rejects.toBeInstanceOf(
      JsonResponseTooLargeError,
    );
  });
});
