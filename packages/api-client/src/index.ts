import {
  createProblemAwareClient,
  type Client,
  type ProblemAwareClientOptions,
} from '@client-portal/openapi-client-core';

import type { paths } from './schema.js';

export { ApiNetworkError, ApiProblemError } from '@client-portal/openapi-client-core';
export type { Client, ProblemAwareClientOptions } from '@client-portal/openapi-client-core';
export type { components, operations, paths } from './schema.js';

export type ApiClient = Client<paths>;

export function createApiClient(
  baseUrl: string,
  options: ProblemAwareClientOptions = {},
): ApiClient {
  return createProblemAwareClient<paths>(baseUrl, options);
}
