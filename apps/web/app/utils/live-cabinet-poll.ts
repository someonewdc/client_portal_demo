export const LIVE_CABINET_POLL_INTERVAL_MS = 4000;

export const LIVE_CABINET_POLL_HINT =
  'Эта заявка обновляется на глазах. Обновится сама через несколько секунд.';

export function shouldPollLiveCabinet(
  portal: { readonly demoLive?: boolean } | null | undefined,
): boolean {
  return portal?.demoLive === true;
}
