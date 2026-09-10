export type AsyncDataProblemPayload = {
  readonly traceId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function traceIdFromThrown(error: unknown): string | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  if (isRecord(error.problem) && typeof error.problem.traceId === 'string') {
    return error.problem.traceId;
  }

  if ('cause' in error) {
    return traceIdFromThrown(error.cause);
  }

  return undefined;
}

export function asyncDataProblemPayload(error: unknown): AsyncDataProblemPayload | undefined {
  const traceId = traceIdFromThrown(error);
  if (traceId === undefined || traceId.length === 0) {
    return undefined;
  }

  return { traceId };
}

export function traceIdFromAsyncDataError(error: unknown): string | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  if (
    isRecord(error.data) &&
    typeof error.data.traceId === 'string' &&
    error.data.traceId.length > 0
  ) {
    return error.data.traceId;
  }

  return traceIdFromThrown(error);
}

export function statusCodeFromThrown(error: unknown, fallback = 502): number {
  if (isRecord(error) && typeof error.status === 'number') {
    return error.status;
  }

  return fallback;
}

export function statusCodeFromAsyncDataError(error: unknown, fallback = 502): number {
  if (isRecord(error) && typeof error.statusCode === 'number') {
    return error.statusCode;
  }

  return statusCodeFromThrown(error, fallback);
}

export function documentStatusFromAsyncData(error: unknown, fallback = 200): number {
  if (error == null) {
    return fallback;
  }

  return statusCodeFromAsyncDataError(error);
}
