import type { RequestStage, RequestStageHistoryEntry } from './request.js';
import { REQUEST_STATUS_LABELS, REQUEST_STATUSES } from './request-status.js';

export function buildRequestStages(
  history: readonly RequestStageHistoryEntry[],
): readonly RequestStage[] {
  const reachedAtByStatus = new Map(history.map((entry) => [entry.status, entry.reachedAt]));

  return REQUEST_STATUSES.map((status) => ({
    status,
    label: REQUEST_STATUS_LABELS[status],
    reachedAt: reachedAtByStatus.get(status) ?? null,
  }));
}
