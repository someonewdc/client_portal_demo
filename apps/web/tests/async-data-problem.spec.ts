import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  asyncDataProblemPayload,
  statusCodeFromThrown,
  traceIdFromAsyncDataError,
} from '../app/utils/async-data-problem.ts';

const TRACE_ID = 'a30d58d2-7936-4a0a-b5c8-d6caa7f1caba';

const problemError = {
  problem: { traceId: TRACE_ID },
  status: 503,
};

describe('async-data-problem payload', () => {
  it('copies traceId onto createError data so hydration does not need cause', () => {
    assert.deepEqual(asyncDataProblemPayload(problemError), { traceId: TRACE_ID });
    assert.equal(statusCodeFromThrown(problemError), 503);

    const hydrated = {
      data: asyncDataProblemPayload(problemError),
      message: 'Не удалось загрузить список заявок.',
      statusCode: 503,
    };

    assert.equal(traceIdFromAsyncDataError(hydrated), TRACE_ID);
    assert.equal('cause' in hydrated, false);
  });

  it('reads data.traceId from the H3 toJSON shape after cause is dropped', () => {
    const serialized = {
      data: { traceId: TRACE_ID },
      message: 'Не удалось загрузить список заявок.',
      statusCode: 502,
    };

    assert.equal(traceIdFromAsyncDataError(serialized), TRACE_ID);
    assert.equal(traceIdFromAsyncDataError({ cause: problemError }), TRACE_ID);
    assert.equal(traceIdFromAsyncDataError(new Error('network')), undefined);
  });
});
