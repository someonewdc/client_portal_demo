import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { describe, it } from 'node:test';

import { effectScope } from 'vue';

import { bindLiveCabinetPoll } from '../app/utils/bind-live-cabinet-poll.ts';

describe('bindLiveCabinetPoll', () => {
  it('stops polling when the page scope is disposed', async () => {
    const scope = effectScope();
    let fetches = 0;
    let accessSecret = 'seed-z10046-live-severnaya-duga';

    scope.run(() => {
      bindLiveCabinetPoll({
        getAccessSecret: () => accessSecret,
        getDemoLive: () => true,
        getReady: () => true,
        intervalMs: 25,
        fetchPortal: async () => {
          fetches += 1;
          return { demoLive: true };
        },
        applyPortal: () => {},
      });
    });

    await delay(70);
    assert.ok(fetches > 0, 'poll must start while the page scope is active');
    const fetchesWhenLeaving = fetches;
    scope.stop();
    accessSecret = 'left';
    await delay(70);
    assert.equal(fetches, fetchesWhenLeaving, 'poll must not continue after leaving the page');
  });

  it('does not apply a poll result after the access secret changes', async () => {
    const scope = effectScope();
    let accessSecret = 'seed-z10046-live-severnaya-duga';
    let releaseFetch: (() => void) | undefined;
    const applied: string[] = [];

    scope.run(() => {
      bindLiveCabinetPoll({
        getAccessSecret: () => accessSecret,
        getDemoLive: () => true,
        getReady: () => true,
        intervalMs: 20,
        fetchPortal: async (secret) => {
          await new Promise<void>((resolve) => {
            releaseFetch = resolve;
          });
          return { demoLive: true, requested: secret };
        },
        applyPortal: (secret) => {
          applied.push(secret);
        },
      });
    });

    await delay(30);
    assert.equal(typeof releaseFetch, 'function', 'poll fetch must start');
    accessSecret = 'seed-z10043-quote-kuznetsov';
    releaseFetch?.();
    await delay(20);
    scope.stop();
    assert.deepEqual(applied, []);
  });
});
