import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { isProblemDetails } from '@client-portal/platform-core/problem-details';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

process.env.TZ = 'Europe/Moscow';

const intendedDatabaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://client_portal:client_portal@127.0.0.1:5433/client_portal';

const Z10043_SECRET = 'seed-z10043-quote-kuznetsov';
const UNKNOWN_SECRET = 'unknown-secret-not-in-seed';

const EXPECTED_DEMO_LINKS = [
  {
    publicNumber: 'З-10041',
    counterpartyName: 'ООО «Северэнергомонтаж»',
    title: 'Щит ЩО-70 800 А',
    status: 'accepted',
    statusLabel: 'Принят',
    portalPath: '/r/seed-z10041-accepted-severenergo',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    publicNumber: 'З-10042',
    counterpartyName: 'АО «ПортЛайн»',
    title: 'НКУ освещения причала',
    status: 'in_calculation',
    statusLabel: 'В расчёте',
    portalPath: '/r/seed-z10042-calc-portline',
    updatedAt: '2026-09-02T11:00:00.000Z',
  },
  {
    publicNumber: 'З-10043',
    counterpartyName: 'ИП Кузнецов П.А.',
    title: 'ВРУ 400 А',
    status: 'quote_ready',
    statusLabel: 'КП готово',
    portalPath: '/r/seed-z10043-quote-kuznetsov',
    updatedAt: '2026-09-04T12:00:00.000Z',
  },
  {
    publicNumber: 'З-10044',
    counterpartyName: 'ООО «Теплицы Поволжья»',
    title: 'Щит управления теплицами',
    status: 'invoice_issued',
    statusLabel: 'Счёт выставлен',
    portalPath: '/r/seed-z10044-invoice-teplitsy',
    updatedAt: '2026-09-06T15:00:00.000Z',
  },
  {
    publicNumber: 'З-10045',
    counterpartyName: 'ЗАО «Горсвет»',
    title: 'Шкафы наружного освещения',
    status: 'in_calculation',
    statusLabel: 'В расчёте',
    portalPath: '/r/seed-z10045-calc-gorsvet',
    updatedAt: '2026-09-03T14:00:00.000Z',
  },
] as const;

const EXPECTED_Z10043 = {
  publicNumber: 'З-10043',
  counterpartyName: 'ИП Кузнецов П.А.',
  title: 'ВРУ 400 А',
  status: 'quote_ready',
  statusLabel: 'КП готово',
  updatedAt: '2026-09-04T12:00:00.000Z',
  plantName: 'ПК «Нордщит»',
  stages: [
    { status: 'accepted', label: 'Принят', reachedAt: '2026-09-01T09:00:00.000Z' },
    { status: 'in_calculation', label: 'В расчёте', reachedAt: '2026-09-02T11:00:00.000Z' },
    { status: 'quote_ready', label: 'КП готово', reachedAt: '2026-09-04T12:00:00.000Z' },
    { status: 'invoice_issued', label: 'Счёт выставлен', reachedAt: null },
  ],
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
  files: [
    {
      fileName: 'Опросный-лист-З-10043.pdf',
      kind: 'questionnaire',
      byteSize: 120400,
      uploadedAt: '2026-09-01T09:05:00.000Z',
    },
    {
      fileName: 'КП-З-10043.pdf',
      kind: 'quote',
      byteSize: 240000,
      uploadedAt: '2026-09-04T12:00:00.000Z',
    },
  ],
} as const;

function applyEnv(databaseUrl: string): void {
  process.env.TZ = 'Europe/Moscow';
  process.env.API_PORT = '3001';
  process.env.DATABASE_URL = databaseUrl;
  process.env.LOG_LEVEL = 'error';
  process.env.NODE_ENV = 'test';
  process.env.WEB_ORIGIN = 'http://localhost:3000';
}

async function startSeededApp(): Promise<NestFastifyApplication> {
  applyEnv(intendedDatabaseUrl);
  vi.resetModules();
  const { applyRequestSeed } = await import('./infrastructure/apply-request-seed.js');
  await applyRequestSeed();
  await applyRequestSeed();
  const { createApplication } = await import('../bootstrap/create-application.js');
  const app = await createApplication();
  await app.init();
  return app;
}

async function insertOrphanRequest(app: NestFastifyApplication): Promise<void> {
  const { PrismaService } = await import('../persistence/prisma.service.js');
  await app
    .get(PrismaService)
    .asClient()
    .request.create({
      data: {
        accessSecretHash: hashOpaqueToken('orphan-not-in-catalog'),
        counterpartyName: 'ООО «Лишнее»',
        publicNumber: 'З-19999',
        status: 'accepted',
        title: 'Лишняя заявка',
        updatedAt: new Date('2026-09-09T00:00:00.000Z'),
      },
    });
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

  it('returns five catalog demo links 1:1 including status, counterparty and UTC updatedAt', async () => {
    const response = await app!.inject({ method: 'GET', url: '/api/v1/demo/links' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: { items: [...EXPECTED_DEMO_LINKS] },
      meta: { traceId: expect.any(String) },
    });
  });

  it('fails closed on an extra stored request, then seed restores the catalog envelope', async () => {
    await insertOrphanRequest(app!);

    const dirty = await app!.inject({ method: 'GET', url: '/api/v1/demo/links' });
    const dirtyBody: unknown = dirty.json();

    expect(dirty.statusCode).toBe(500);
    expect(dirty.headers['content-type']).toContain('application/problem+json');
    expect(isProblemDetails(dirtyBody)).toBe(true);
    expect(dirtyBody).toMatchObject({
      status: 500,
      title: 'Internal server error',
      detail: 'The server could not complete the request',
    });

    const { applyRequestSeed } = await import('./infrastructure/apply-request-seed.js');
    await applyRequestSeed();

    const healed = await app!.inject({ method: 'GET', url: '/api/v1/demo/links' });
    expect(healed.statusCode).toBe(200);
    expect(healed.json()).toEqual({
      data: { items: [...EXPECTED_DEMO_LINKS] },
      meta: { traceId: expect.any(String) },
    });
  });

  it('fails closed when a catalog request is missing, then seed restores the catalog envelope', async () => {
    const { PrismaService } = await import('../persistence/prisma.service.js');
    await app!
      .get(PrismaService)
      .asClient()
      .request.deleteMany({ where: { publicNumber: 'З-10043' } });

    const dirty = await app!.inject({ method: 'GET', url: '/api/v1/demo/links' });
    const dirtyBody: unknown = dirty.json();
    const detail =
      typeof dirtyBody === 'object' &&
      dirtyBody !== null &&
      'detail' in dirtyBody &&
      typeof dirtyBody.detail === 'string'
        ? dirtyBody.detail
        : '';

    expect(dirty.statusCode).toBe(500);
    expect(dirty.headers['content-type']).toContain('application/problem+json');
    expect(isProblemDetails(dirtyBody)).toBe(true);
    expect(dirtyBody).toMatchObject({
      status: 500,
      title: 'Internal server error',
      detail: 'The server could not complete the request',
    });
    expect(detail.toLowerCase()).not.toMatch(/select |from |stack|prisma/i);
    expect(dirtyBody).not.toEqual(
      expect.objectContaining({
        data: { items: EXPECTED_DEMO_LINKS.filter((item) => item.publicNumber !== 'З-10043') },
      }),
    );

    const { applyRequestSeed } = await import('./infrastructure/apply-request-seed.js');
    await applyRequestSeed();

    const healed = await app!.inject({ method: 'GET', url: '/api/v1/demo/links' });
    expect(healed.statusCode).toBe(200);
    expect(healed.json()).toEqual({
      data: { items: [...EXPECTED_DEMO_LINKS] },
      meta: { traceId: expect.any(String) },
    });
  });

  it('returns the quote fixture by access secret with catalog dates, stages and files 1:1', async () => {
    const response = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${Z10043_SECRET}`,
    });
    const body: unknown = response.json();
    const payload = JSON.stringify(body);
    const hash = hashOpaqueToken(Z10043_SECRET);

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      data: EXPECTED_Z10043,
      meta: { traceId: expect.any(String) },
    });
    expect(payload).not.toContain(hash);
    expect(body).not.toMatchObject({ data: { accessSecretHash: hash } });
  });

  it('stores catalog instants as timestamptz so UTC ISO does not depend on the host TZ', async () => {
    const { PrismaService } = await import('../persistence/prisma.service.js');
    const columns = await app!.get(PrismaService).asClient().$queryRaw<
      Array<{ column_name: string; data_type: string; table_name: string }>
    >`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'Request' AND column_name = 'updatedAt')
          OR (table_name = 'RequestFile' AND column_name = 'uploadedAt')
          OR (table_name = 'RequestStageHistory' AND column_name = 'reachedAt')
        )
      ORDER BY table_name, column_name
    `;

    expect(columns).toEqual([
      { table_name: 'Request', column_name: 'updatedAt', data_type: 'timestamp with time zone' },
      {
        table_name: 'RequestFile',
        column_name: 'uploadedAt',
        data_type: 'timestamp with time zone',
      },
      {
        table_name: 'RequestStageHistory',
        column_name: 'reachedAt',
        data_type: 'timestamp with time zone',
      },
    ]);
  });

  it('enforces unique RequestFile ("requestId","fileName") so a leaf lookup cannot collide', async () => {
    const { PrismaService } = await import('../persistence/prisma.service.js');
    const columns = await app!.get(PrismaService).asClient().$queryRaw<
      Array<{ column_name: string; table_name: string }>
    >`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'RequestFile'
        AND column_name IN ('requestId', 'fileName')
      ORDER BY column_name
    `;
    const indexes = await app!.get(PrismaService).asClient().$queryRaw<
      Array<{ indexdef: string; indexname: string }>
    >`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'RequestFile'
        AND indexdef ILIKE '%UNIQUE%'
        AND indexdef LIKE '%("requestId", "fileName")%'
      ORDER BY indexname
    `;

    expect(columns).toEqual([
      { column_name: 'fileName', table_name: 'RequestFile' },
      { column_name: 'requestId', table_name: 'RequestFile' },
    ]);
    expect(indexes).toEqual([
      {
        indexdef:
          'CREATE UNIQUE INDEX "RequestFile_requestId_fileName_key" ON public."RequestFile" USING btree ("requestId", "fileName")',
        indexname: 'RequestFile_requestId_fileName_key',
      },
    ]);
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
