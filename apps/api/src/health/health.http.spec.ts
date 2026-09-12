import { isProblemDetails } from '@client-portal/platform-core/problem-details';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

const UNREACHABLE_DATABASE_URL =
  'postgresql://client_portal:client_portal@127.0.0.1:1/client_portal';

const intendedDatabaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://client_portal:client_portal@127.0.0.1:5433/client_portal';

function applyEnv(databaseUrl: string): void {
  process.env.API_PORT = '3001';
  process.env.DATABASE_URL = databaseUrl;
  process.env.LOG_LEVEL = 'error';
  process.env.NODE_ENV = 'test';
  process.env.WEB_ORIGIN = 'http://localhost:3000';
  process.env.DEMO_CONDUCTOR_SECRET = 'seed-demo-conductor-nordshield';
}

async function startApp(databaseUrl: string): Promise<{
  app: NestFastifyApplication;
  markReady: () => void;
}> {
  applyEnv(databaseUrl);
  vi.resetModules();
  const { createApplication } = await import('../bootstrap/create-application.js');
  const { ReadinessService } = await import('./readiness.service.js');
  const app = await createApplication();
  await app.init();
  return {
    app,
    markReady: () => {
      app.get(ReadinessService).markReady();
    },
  };
}

describe('health HTTP', () => {
  let app: NestFastifyApplication | undefined;

  afterEach(async () => {
    if (app !== undefined) {
      await app.close();
      app = undefined;
    }
  });

  it('returns 200 for live when the database is unreachable', async () => {
    ({ app } = await startApp(UNREACHABLE_DATABASE_URL));
    const response = await app.inject({ method: 'GET', url: '/api/v1/health/live' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ data: { status: 'ok' } });
  });

  it('returns 503 Problem Details for ready when marked ready but the database is unreachable', async () => {
    const started = await startApp(UNREACHABLE_DATABASE_URL);
    app = started.app;
    started.markReady();
    const response = await app.inject({ method: 'GET', url: '/api/v1/health/ready' });
    const body: unknown = response.json();

    expect(response.statusCode).toBe(503);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(isProblemDetails(body)).toBe(true);
    expect(body).toMatchObject({
      status: 503,
      title: 'Service unavailable',
    });
  });

  it('returns 200 for ready when marked ready and the database is reachable', async () => {
    const started = await startApp(intendedDatabaseUrl);
    app = started.app;
    started.markReady();
    const response = await app.inject({ method: 'GET', url: '/api/v1/health/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ data: { status: 'ok' } });
  });
});
