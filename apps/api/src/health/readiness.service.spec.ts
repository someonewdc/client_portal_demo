import { describe, expect, it } from 'vitest';

import { ReadinessService } from './readiness.service.js';

describe('ReadinessService', () => {
  it('is not ready when marked ready but the database ping fails', async () => {
    const service = new ReadinessService({
      ping: async () => {
        throw new Error('connect ECONNREFUSED');
      },
    });
    service.markReady();

    await expect(service.isReady()).resolves.toBe(false);
  });

  it('is ready when marked ready and the database ping succeeds', async () => {
    let pingCount = 0;
    const service = new ReadinessService({
      ping: async () => {
        pingCount += 1;
      },
    });
    service.markReady();

    await expect(service.isReady()).resolves.toBe(true);
    expect(pingCount).toBe(1);
  });

  it('does not ping the database before the process accepts traffic', async () => {
    let pingCount = 0;
    const service = new ReadinessService({
      ping: async () => {
        pingCount += 1;
      },
    });

    await expect(service.isReady()).resolves.toBe(false);
    expect(pingCount).toBe(0);
  });
});
