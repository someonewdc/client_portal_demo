import { PROBLEM_DETAILS_MEDIA_TYPE } from '@client-portal/platform-core/problem-details';
import { describe, expect, it } from 'vitest';

import { PROBLEM_DETAILS_RESPONSE } from './openapi.js';

describe('PROBLEM_DETAILS_RESPONSE', () => {
  it('documents RFC 7807 content type', () => {
    expect(Object.keys(PROBLEM_DETAILS_RESPONSE.content)).toEqual([PROBLEM_DETAILS_MEDIA_TYPE]);
  });
});
