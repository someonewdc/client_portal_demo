import { describe, expect, it } from 'vitest';

import { serializeHttpRequest } from './logging.js';

describe('serializeHttpRequest', () => {
  it('never includes query parameters in request logs', () => {
    expect(
      serializeHttpRequest({
        id: 'a30d58d2-7936-4a0a-b5c8-d6caa7f1caba',
        method: 'GET',
        url: '/api/v1/health/ready?token=secret&email=user%40example.test',
      }),
    ).toEqual({
      id: 'a30d58d2-7936-4a0a-b5c8-d6caa7f1caba',
      method: 'GET',
      url: '/api/v1/health/ready',
    });
  });
});
