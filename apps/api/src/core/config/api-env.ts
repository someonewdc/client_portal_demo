import {
  environmentPortSchema,
  logLevelSchema,
  nodeEnvironmentSchema,
  validateEnvironment,
} from '@client-portal/platform-core/environment';
import { exactHttpBaseUrlSchema } from '@client-portal/platform-core/url';
import { z } from 'zod';

export const apiEnvSchema = z.object({
  NODE_ENV: nodeEnvironmentSchema,
  LOG_LEVEL: logLevelSchema,
  API_PORT: environmentPortSchema(3001),
  WEB_ORIGIN: exactHttpBaseUrlSchema('/'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function validateApiEnv(input: Record<string, unknown>): ApiEnv {
  return validateEnvironment(apiEnvSchema, input, 'API');
}
