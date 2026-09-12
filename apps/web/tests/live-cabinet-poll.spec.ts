import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  LIVE_CABINET_POLL_HINT,
  LIVE_CABINET_POLL_INTERVAL_MS,
  shouldPollLiveCabinet,
} from '../app/utils/live-cabinet-poll.ts';

describe('live cabinet poll', () => {
  it('polls every 4s only when demoLive is true', () => {
    assert.equal(LIVE_CABINET_POLL_INTERVAL_MS, 4000);
    assert.equal(shouldPollLiveCabinet({ demoLive: true }), true);
    assert.equal(shouldPollLiveCabinet({}), false);
    assert.equal(shouldPollLiveCabinet({ demoLive: false }), false);
    assert.equal(shouldPollLiveCabinet(null), false);
    assert.equal(shouldPollLiveCabinet(undefined), false);
  });

  it('keeps the D-052 live cabinet phrase exact', () => {
    assert.equal(
      LIVE_CABINET_POLL_HINT,
      'Эта заявка обновляется на глазах. Обновится сама через несколько секунд.',
    );
  });
});
