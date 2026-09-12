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
  DATABASE_URL: z.url().check((context) => {
    const protocol = new URL(context.value).protocol;
    if (protocol !== 'postgresql:' && protocol !== 'postgres:') {
      context.issues.push({
        code: 'custom',
        input: context.value,
        message: 'DATABASE_URL protocol must be postgresql or postgres',
      });
    }
  }),
  WEB_ORIGIN: exactHttpBaseUrlSchema('/'),
  DEMO_CONDUCTOR_SECRET: z.string().min(1),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function validateApiEnv(input: Record<string, unknown>): ApiEnv {
  return validateEnvironment(apiEnvSchema, input, 'API');
}
