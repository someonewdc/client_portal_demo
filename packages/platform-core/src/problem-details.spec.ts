import { describe, expect, it } from 'vitest';

import {
  PROBLEM_DETAILS_MEDIA_TYPE,
  isProblemDetails,
  type ProblemDetails,
} from './problem-details.js';

const TRACE_ID = 'a30d58d2-7936-4a0a-b5c8-d6caa7f1caba';

const validProblem: ProblemDetails = {
  detail: 'API is not ready',
  instance: '/health/ready',
  status: 503,
  title: 'Service unavailable',
  traceId: TRACE_ID,
  type: 'https://example.test/problems/service-unavailable',
};

describe('Problem Details contract', () => {
  it('exports the RFC 7807 media type', () => {
    expect(PROBLEM_DETAILS_MEDIA_TYPE).toBe('application/problem+json');
  });

  it('accepts a complete problem without field errors', () => {
    expect(isProblemDetails(validProblem)).toBe(true);
  });

  it('accepts optional well-formed field errors and extra extension fields', () => {
    expect(
      isProblemDetails({
        ...validProblem,
        errors: [{ field: 'pageSize', message: 'pageSize must not be greater than 48' }],
        extra: 'allowed',
      }),
    ).toBe(true);
  });

  it('rejects missing required fields', () => {
    const omit = (key: keyof ProblemDetails) =>
      Object.fromEntries(Object.entries(validProblem).filter(([field]) => field !== key));

    expect(isProblemDetails(omit('type'))).toBe(false);
    expect(isProblemDetails(omit('title'))).toBe(false);
    expect(isProblemDetails(omit('status'))).toBe(false);
    expect(isProblemDetails(omit('detail'))).toBe(false);
    expect(isProblemDetails(omit('instance'))).toBe(false);
    expect(isProblemDetails(omit('traceId'))).toBe(false);
    expect(isProblemDetails(null)).toBe(false);
    expect(isProblemDetails('problem')).toBe(false);
  });

  it('rejects non-finite status and malformed errors arrays', () => {
    expect(isProblemDetails({ ...validProblem, status: Number.NaN })).toBe(false);
    expect(isProblemDetails({ ...validProblem, errors: 'invalid' })).toBe(false);
    expect(isProblemDetails({ ...validProblem, errors: null })).toBe(false);
    expect(isProblemDetails({ ...validProblem, errors: [{ message: 'missing field' }] })).toBe(
      false,
    );
    expect(isProblemDetails({ ...validProblem, errors: [{ field: 1, message: 'bad' }] })).toBe(
      false,
    );
  });
});
