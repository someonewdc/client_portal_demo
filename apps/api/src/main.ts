import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';

import { createApplication } from './bootstrap/create-application.js';
import type { ApiEnv } from './core/config/api-env.js';
import { ReadinessService } from './health/readiness.service.js';

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  const config = app.get(ConfigService<ApiEnv, true>);
  const readiness = app.get(ReadinessService);
  const port: number = config.get('API_PORT', { infer: true });

  await app.listen({ host: '0.0.0.0', port });
  readiness.markReady();
}

void bootstrap();
