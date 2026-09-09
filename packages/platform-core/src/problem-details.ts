import { isRecord } from './json.js';

export const PROBLEM_DETAILS_MEDIA_TYPE = 'application/problem+json';

export interface ProblemFieldError {
  readonly field: string;
  readonly message: string;
}

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
  readonly traceId: string;
  readonly errors?: readonly ProblemFieldError[];
}

function isProblemFieldError(value: unknown): value is ProblemFieldError {
  return isRecord(value) && typeof value.field === 'string' && typeof value.message === 'string';
}

function isProblemFieldErrorList(value: unknown): value is readonly ProblemFieldError[] {
  return Array.isArray(value) && value.every(isProblemFieldError);
}

export function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    isRecord(value) &&
    typeof value.type === 'string' &&
    typeof value.title === 'string' &&
    typeof value.status === 'number' &&
    Number.isFinite(value.status) &&
    typeof value.detail === 'string' &&
    typeof value.instance === 'string' &&
    typeof value.traceId === 'string' &&
    (value.errors === undefined || isProblemFieldErrorList(value.errors))
  );
}
