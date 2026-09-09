import { z } from 'zod';

export const nodeEnvironmentSchema = z
  .enum(['development', 'test', 'production'])
  .default('development');

export const logLevelSchema = z
  .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
  .default('info');

export const environmentBooleanSchema = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

export function environmentPortSchema(defaultPort?: number) {
  const schema = z.coerce.number().int().min(1).max(65_535);
  return defaultPort === undefined ? schema : schema.default(defaultPort);
}

export function validateEnvironment<TSchema extends z.ZodType>(
  schema: TSchema,
  input: Record<string, unknown>,
  label: string,
): z.output<TSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new Error(`Invalid ${label} environment: ${z.prettifyError(result.error)}`);
  }

  return result.data;
}
