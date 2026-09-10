import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { requestPortalCacheKey } from '../app/utils/request-portal-cache-key.ts';

describe('requestPortalCacheKey', () => {
  it('builds a useAsyncData key from the access secret', () => {
    assert.equal(
      requestPortalCacheKey('seed-z10043-quote-kuznetsov'),
      'request-portal:seed-z10043-quote-kuznetsov',
    );
  });
});
