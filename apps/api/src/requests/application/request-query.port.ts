import type { RequestRecord } from '../domain/request.js';

export const REQUEST_QUERY = Symbol('REQUEST_QUERY');

export type { RequestRecord };

export interface RequestQueryPort {
  listRequests(): Promise<readonly RequestRecord[]>;
  findByAccessSecretHash(accessSecretHash: string): Promise<RequestRecord | null>;
}
