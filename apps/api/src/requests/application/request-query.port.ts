import type { RequestRecord, RequestSummary } from '../domain/request.js';

export const REQUEST_QUERY = Symbol('REQUEST_QUERY');

export type { RequestRecord, RequestSummary };

export interface RequestQueryPort {
  listRequestSummaries(): Promise<readonly RequestSummary[]>;
  findByAccessSecretHash(accessSecretHash: string): Promise<RequestRecord | null>;
}
