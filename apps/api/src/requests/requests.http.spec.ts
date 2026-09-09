import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { isProblemDetails } from '@client-portal/platform-core/problem-details';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const intendedDatabaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://client_portal:client_portal@127.0.0.1:5433/client_portal';

const Z10043_SECRET = 'seed-z10043-quote-kuznetsov';
const UNKNOWN_SECRET = 'unknown-secret-not-in-seed';

const EXPECTED_DEMO_LINKS = [
  {
    publicNumber: 'З-10041',
    title: 'Щит ЩО-70 800 А',
    portalPath: '/r/seed-z10041-accepted-severenergo',
  },
  {
    publicNumber: 'З-10042',
    title: 'НКУ освещения причала',
    portalPath: '/r/seed-z10042-calc-portline',
  },
  {
    publicNumber: 'З-10043',
    title: 'ВРУ 400 А',
    portalPath: '/r/seed-z10043-quote-kuznetsov',
  },
  {
    publicNumber: 'З-10044',
    title: 'Щит управления теплицами',
    portalPath: '/r/seed-z10044-invoice-teplitsy',
  },
  {
    publicNumber: 'З-10045',
    title: 'Шкафы наружного освещения',
    portalPath: '/r/seed-z10045-calc-gorsvet',
  },
] as const;

function applyEnv(databaseUrl: string): void {
  process.env.API_PORT = '3001';
  process.env.DATABASE_URL = databaseUrl;
  process.env.LOG_LEVEL = 'error';
  process.env.NODE_ENV = 'test';
  process.env.WEB_ORIGIN = 'http://localhost:3000';
}

async function startSeededApp(): Promise<NestFastifyApplication> {
  applyEnv(intendedDatabaseUrl);
  vi.resetModules();
  const { applyRequestSeed } = await import('../../prisma/seed.js');
  await applyRequestSeed();
  await applyRequestSeed();
  const { createApplication } = await import('../bootstrap/create-application.js');
  const app = await createApplication();
  await app.init();
  return app;
}

describe('request HTTP', () => {
  let app: NestFastifyApplication | undefined;

  beforeEach(async () => {
    app = await startSeededApp();
  });

  afterEach(async () => {
    if (app !== undefined) {
      await app.close();
      app = undefined;
    }
  });

  it('returns five catalog demo links with title and portalPath', async () => {
    const response = await app!.inject({ method: 'GET', url: '/api/v1/demo/links' });
    const body: unknown = response.json();
    const items =
      typeof body === 'object' &&
      body !== null &&
      'data' in body &&
      typeof body.data === 'object' &&
      body.data !== null &&
      'items' in body.data &&
      Array.isArray(body.data.items)
        ? body.data.items
        : [];

    expect(response.statusCode).toBe(200);
    expect(items).toHaveLength(5);
    expect(items).toEqual(EXPECTED_DEMO_LINKS.map((link) => expect.objectContaining({ ...link })));
  });

  it('returns the quote fixture by access secret with catalog spec and files', async () => {
    const response = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${Z10043_SECRET}`,
    });
    const body: unknown = response.json();
    const payload = JSON.stringify(body);
    const hash = hashOpaqueToken(Z10043_SECRET);

    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({
      data: {
        publicNumber: 'З-10043',
        title: 'ВРУ 400 А',
        status: 'quote_ready',
        specLines: [
          {
            name: 'Вводно-распределительное устройство 400 А',
            quantity: 1,
            unit: 'шт',
            comment: 'IP54, навесной',
          },
          {
            name: 'Рубильник ввода',
            quantity: 1,
            unit: 'шт',
          },
        ],
      },
    });
    expect(body).toMatchObject({
      data: {
        stages: [
          { status: 'accepted' },
          { status: 'in_calculation' },
          { status: 'quote_ready' },
          { status: 'invoice_issued' },
        ],
      },
    });
    const stages =
      typeof body === 'object' &&
      body !== null &&
      'data' in body &&
      typeof body.data === 'object' &&
      body.data !== null &&
      'stages' in body.data &&
      Array.isArray(body.data.stages)
        ? body.data.stages
        : [];
    expect(stages).toHaveLength(4);
    const files =
      typeof body === 'object' &&
      body !== null &&
      'data' in body &&
      typeof body.data === 'object' &&
      body.data !== null &&
      'files' in body.data &&
      Array.isArray(body.data.files)
        ? body.data.files
        : [];
    expect(files).toEqual(
      expect.arrayContaining([expect.objectContaining({ fileName: 'КП-З-10043.pdf' })]),
    );
    expect(payload).not.toContain(hash);
    expect(body).not.toMatchObject({ data: { accessSecretHash: hash } });
  });

  it('returns 404 Problem Details for an unknown secret without leaking SQL, stack or the secret', async () => {
    const response = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${UNKNOWN_SECRET}`,
    });
    const body: unknown = response.json();
    const detail =
      typeof body === 'object' &&
      body !== null &&
      'detail' in body &&
      typeof body.detail === 'string'
        ? body.detail
        : '';

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(isProblemDetails(body)).toBe(true);
    expect(body).toMatchObject({
      status: 404,
      title: 'Resource not found',
    });
    expect(detail).not.toContain(UNKNOWN_SECRET);
    expect(detail.toLowerCase()).not.toMatch(/select |from |stack|prisma/i);
    expect(body).toMatchObject({
      instance: `/api/v1/requests/${UNKNOWN_SECRET}`,
    });
  });
});
