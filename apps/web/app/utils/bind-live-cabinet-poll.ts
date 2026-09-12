import { onScopeDispose, watch } from 'vue';

import { shouldApplyLiveCabinetPollResult, shouldPollLiveCabinet } from './live-cabinet-poll.ts';

export type LiveCabinetPollPortal = {
  readonly demoLive?: boolean;
};

export function bindLiveCabinetPoll<TPortal extends LiveCabinetPollPortal>(options: {
  readonly applyPortal: (accessSecret: string, portal: TPortal) => void;
  readonly fetchPortal: (accessSecret: string) => Promise<TPortal | null | undefined>;
  readonly getAccessSecret: () => string;
  readonly getDemoLive: () => boolean | undefined;
  readonly getReady: () => boolean;
  readonly intervalMs: number;
}): void {
  let pollTimer: ReturnType<typeof setInterval> | undefined;

  function stopLiveCabinetPoll() {
    if (pollTimer === undefined) {
      return;
    }

    clearInterval(pollTimer);
    pollTimer = undefined;
  }

  function canPoll(): boolean {
    return options.getReady() && shouldPollLiveCabinet({ demoLive: options.getDemoLive() });
  }

  async function pollLiveCabinet() {
    if (!canPoll()) {
      stopLiveCabinetPoll();
      return;
    }

    const secret = options.getAccessSecret();
    try {
      const portal = await options.fetchPortal(secret);
      if (!portal) {
        return;
      }

      if (!shouldApplyLiveCabinetPollResult(secret, options.getAccessSecret())) {
        return;
      }

      options.applyPortal(secret, portal);
    } catch {
      return;
    }
  }

  function syncLiveCabinetPoll() {
    stopLiveCabinetPoll();
    if (!canPoll()) {
      return;
    }

    pollTimer = setInterval(() => {
      void pollLiveCabinet();
    }, options.intervalMs);
  }

  watch(
    () => [options.getAccessSecret(), options.getDemoLive(), options.getReady()] as const,
    syncLiveCabinetPoll,
    { immediate: true },
  );
  onScopeDispose(stopLiveCabinetPoll);
}
