import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { isProblemDetails } from '@client-portal/platform-core/problem-details';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { getOptionsToken, type ThrottlerModuleOptions } from '@nestjs/throttler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { REQUEST_CATALOG } from './domain/request-catalog.js';
import { buildRequestStages } from './domain/request-stages.js';
import { PLANT_NAME, REQUEST_STATUS_LABELS } from './domain/request-status.js';
import type * as portalThrottle from './http/portal-throttle.js';

process.env.TZ = 'Europe/Moscow';

const intendedDatabaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://client_portal:client_portal@127.0.0.1:5433/client_portal';

const Z10043_SECRET = 'seed-z10043-quote-kuznetsov';
const Z10046_SECRET = 'seed-z10046-live-severnaya-duga';
const CONDUCTOR_SECRET = 'seed-demo-conductor-nordshield';
const UNKNOWN_SECRET = 'unknown-secret-not-in-seed';
const UNKNOWN_CONDUCTOR_SECRET = 'unknown-conductor-secret';
const UNKNOWN_SECRET_A = 'unknown-secret-a';
const UNKNOWN_SECRET_B = 'unknown-secret-b';
const SAME_CLIENT_IP = '127.0.0.1';
const OTHER_CLIENT_IP = '10.0.0.2';

function expectPrivateNoStore(headers: Record<string, unknown>): void {
  const cacheControl = headers['cache-control'];
  const value = typeof cacheControl === 'string' ? cacheControl : '';
  expect(value).toMatch(/private/i);
  expect(value).toMatch(/no-store/i);
}

function expectLiveStandNow(value: unknown, after: number): void {
  const parsed = Date.parse(String(value));
  expect(Number.isNaN(parsed)).toBe(false);
  expect(after - parsed).toBeLessThan(120_000);
  expect(parsed).toBeLessThanOrEqual(after + 5_000);
  expect(value).not.toBe('2026-09-01T10:00:00.000Z');
}

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
      comment: 'IP54, навесное',
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

function expectedPortalFromCatalog(entry: (typeof REQUEST_CATALOG)[number]) {
  return {
    publicNumber: entry.publicNumber,
    counterpartyName: entry.counterpartyName,
    title: entry.title,
    status: entry.status,
    statusLabel: REQUEST_STATUS_LABELS[entry.status],
    updatedAt: entry.updatedAt,
    plantName: PLANT_NAME,
    stages: buildRequestStages(entry.stageHistory),
    specLines: entry.specLines,
    files: entry.files,
  };
}

function applyEnv(databaseUrl: string): void {
  process.env.TZ = 'Europe/Moscow';
  process.env.API_PORT = '3001';
  process.env.DATABASE_URL = databaseUrl;
  process.env.DEMO_CONDUCTOR_SECRET = CONDUCTOR_SECRET;
  process.env.LOG_LEVEL = 'error';
  process.env.NODE_ENV = 'test';
  process.env.WEB_ORIGIN = 'http://localhost:3000';
}

function conductorUrl(secret: string, action?: 'advance' | 'reset'): string {
  const base = `/api/v1/demo/conductor/${secret}`;
  return action === undefined ? base : `${base}/${action}`;
}

function problemDetail(body: unknown): string {
  return typeof body === 'object' &&
    body !== null &&
    'detail' in body &&
    typeof body.detail === 'string'
    ? body.detail
    : '';
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

async function startSeededAppWithPortalThrottleLimit(
  limit: number,
): Promise<NestFastifyApplication> {
  applyEnv(intendedDatabaseUrl);
  vi.resetModules();
  vi.doMock('./http/portal-throttle.js', async (importOriginal) => {
    const actual = (await importOriginal()) as typeof portalThrottle;
    return {
      ...actual,
      portalThrottlerModuleOptions: (overrideLimit = limit) =>
        actual.portalThrottlerModuleOptions(overrideLimit),
    };
  });
  const { applyRequestSeed } = await import('./infrastructure/apply-request-seed.js');
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
    expectPrivateNoStore(response.headers);
    const body: { data: { items: Array<{ publicNumber: string }> } } = response.json();
    expect(body).toEqual({
      data: { items: [...EXPECTED_DEMO_LINKS] },
      meta: { traceId: expect.any(String) },
    });
    expect(body.data.items.map((item) => item.publicNumber)).not.toContain('З-10046');
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
    expectPrivateNoStore(response.headers);
    expect(body).toEqual({
      data: EXPECTED_Z10043,
      meta: { traceId: expect.any(String) },
    });
    expect(payload).not.toContain(hash);
    expect(body).not.toMatchObject({ data: { accessSecretHash: hash } });
    expect(body).not.toMatchObject({ data: { demoLive: false } });
    expect(payload).not.toContain('"demoLive"');
  });

  it('omits demoLive on every catalog fixture portal payload', async () => {
    for (const entry of REQUEST_CATALOG) {
      const response = await app!.inject({
        method: 'GET',
        url: `/api/v1/requests/${entry.accessSecret}`,
      });
      const body: unknown = response.json();
      const data =
        typeof body === 'object' && body !== null && 'data' in body ? body.data : undefined;

      expect(response.statusCode).toBe(200);
      expect(data).not.toHaveProperty('demoLive');
      expect(JSON.stringify(body)).not.toContain('"demoLive"');
    }
  });

  it('returns the live fixture with demoLive true, accepted catalog and stand now() dates', async () => {
    const response = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${Z10046_SECRET}`,
    });
    const after = Date.now();
    const body: unknown = response.json();
    const data =
      typeof body === 'object' && body !== null && 'data' in body
        ? (body.data as Record<string, unknown>)
        : undefined;

    expect(response.statusCode).toBe(200);
    expectPrivateNoStore(response.headers);
    expect(data).toEqual(
      expect.objectContaining({
        publicNumber: 'З-10046',
        counterpartyName: 'ООО «Северная дуга»',
        title: 'Щит ЩО-70 показа',
        status: 'accepted',
        statusLabel: 'Принят',
        plantName: 'ПК «Нордщит»',
        demoLive: true,
        specLines: [
          {
            name: 'Щит ЩО-70 800 А IP54',
            quantity: 1,
            unit: 'шт',
            comment: 'навесной, показ',
          },
          { name: 'Комплект автоматики ввода', quantity: 1, unit: 'шт' },
        ],
      }),
    );
    expect(data).toHaveProperty('demoLive', true);
    expect(data?.demoLive).not.toBe(false);
    const files = data?.files as Array<{ uploadedAt: string }> | undefined;
    const stages = data?.stages as Array<{ reachedAt: string | null }> | undefined;
    expect(files).toEqual([
      expect.objectContaining({
        fileName: 'Опросный-лист-З-10046.pdf',
        kind: 'questionnaire',
        byteSize: 100000,
      }),
    ]);
    expect(stages).toEqual([
      { status: 'accepted', label: 'Принят', reachedAt: expect.any(String) },
      { status: 'in_calculation', label: 'В расчёте', reachedAt: null },
      { status: 'quote_ready', label: 'КП готово', reachedAt: null },
      { status: 'invoice_issued', label: 'Счёт выставлен', reachedAt: null },
    ]);
    expectLiveStandNow(data?.updatedAt, after);
    expectLiveStandNow(stages?.[0]?.reachedAt, after);
    expectLiveStandNow(files?.[0]?.uploadedAt, after);
    expect(JSON.stringify(body)).not.toContain(hashOpaqueToken(Z10046_SECRET));
  });

  it('fails closed on an extra besides catalog and live, then seed resets З-10046 to accepted', async () => {
    const { PrismaService } = await import('../persistence/prisma.service.js');
    const prisma = app!.get(PrismaService).asClient();
    const live = await prisma.request.findUnique({ where: { publicNumber: 'З-10046' } });
    expect(live).not.toBeNull();

    await prisma.request.update({
      where: { publicNumber: 'З-10046' },
      data: { status: 'invoice_issued' },
    });
    await prisma.requestFile.create({
      data: {
        byteSize: 240000,
        fileName: 'КП-З-10046.pdf',
        kind: 'quote',
        position: 1,
        requestId: live!.id,
        uploadedAt: new Date(),
      },
    });
    await prisma.requestStageHistory.create({
      data: {
        reachedAt: new Date(),
        requestId: live!.id,
        status: 'in_calculation',
      },
    });
    await insertOrphanRequest(app!);

    const dirty = await app!.inject({ method: 'GET', url: '/api/v1/demo/links' });
    expect(dirty.statusCode).toBe(500);

    const { applyRequestSeed } = await import('./infrastructure/apply-request-seed.js');
    await applyRequestSeed();

    const healed = await app!.inject({ method: 'GET', url: '/api/v1/demo/links' });
    const healedBody: { data: { items: Array<{ publicNumber: string }> } } = healed.json();
    expect(healed.statusCode).toBe(200);
    expect(healedBody.data.items).toEqual([...EXPECTED_DEMO_LINKS]);
    expect(healedBody.data.items.map((item) => item.publicNumber)).not.toContain('З-10046');

    const restored = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${Z10046_SECRET}`,
    });
    const restoredData = restored.json().data as {
      demoLive?: unknown;
      files: unknown[];
      stages: Array<{ reachedAt: string | null; status: string }>;
      status: string;
    };
    expect(restored.statusCode).toBe(200);
    expect(restoredData.status).toBe('accepted');
    expect(restoredData.demoLive).toBe(true);
    expect(restoredData.files).toHaveLength(1);
    expect(restoredData.stages.filter((stage) => stage.reachedAt !== null)).toEqual([
      expect.objectContaining({ status: 'accepted' }),
    ]);
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

  it('keeps only primary and unique indexes; unique composites already cover requestId lookups', async () => {
    const { PrismaService } = await import('../persistence/prisma.service.js');
    const indexes = await app!.get(PrismaService).asClient().$queryRaw<
      Array<{ indexname: string; tablename: string }>
    >`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('Request', 'RequestSpecLine', 'RequestFile', 'RequestStageHistory')
      ORDER BY tablename, indexname
    `;

    expect(indexes).toEqual([
      { indexname: 'Request_accessSecretHash_key', tablename: 'Request' },
      { indexname: 'Request_pkey', tablename: 'Request' },
      { indexname: 'Request_publicNumber_key', tablename: 'Request' },
      { indexname: 'RequestFile_pkey', tablename: 'RequestFile' },
      { indexname: 'RequestFile_requestId_fileName_key', tablename: 'RequestFile' },
      { indexname: 'RequestFile_requestId_position_key', tablename: 'RequestFile' },
      { indexname: 'RequestSpecLine_pkey', tablename: 'RequestSpecLine' },
      { indexname: 'RequestSpecLine_requestId_position_key', tablename: 'RequestSpecLine' },
      { indexname: 'RequestStageHistory_pkey', tablename: 'RequestStageHistory' },
      { indexname: 'RequestStageHistory_requestId_status_key', tablename: 'RequestStageHistory' },
    ]);
  });

  it('returns 404 Problem Details for an unknown secret without leaking SQL, stack or the secret', async () => {
    const response = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${UNKNOWN_SECRET}`,
    });
    const body: unknown = response.json();
    const detail = problemDetail(body);

    expect(response.statusCode).toBe(404);
    expectPrivateNoStore(response.headers);
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

  it('wires ThrottlerModule to 60 requests per 60 seconds keyed by client IP', async () => {
    const { PORTAL_THROTTLE_LIMIT, PORTAL_THROTTLE_TTL_MS, clientIpTracker, portalThrottleKey } =
      await import('./http/portal-throttle.js');
    const options = app!.get<ThrottlerModuleOptions>(getOptionsToken());

    expect(PORTAL_THROTTLE_LIMIT).toBe(60);
    expect(PORTAL_THROTTLE_TTL_MS).toBe(60_000);
    expect(options).toEqual({
      errorMessage: 'The client has sent too many requests',
      generateKey: portalThrottleKey,
      getTracker: clientIpTracker,
      throttlers: [{ limit: PORTAL_THROTTLE_LIMIT, ttl: PORTAL_THROTTLE_TTL_MS }],
    });
  });

  it('returns the live conductor snapshot with nextStatus in_calculation after seed', async () => {
    const response = await app!.inject({
      method: 'GET',
      url: conductorUrl(CONDUCTOR_SECRET),
    });
    const body: unknown = response.json();

    expect(response.statusCode).toBe(200);
    expect(response.statusCode).not.toBe(401);
    expectPrivateNoStore(response.headers);
    expect(body).toEqual({
      data: {
        publicNumber: 'З-10046',
        status: 'accepted',
        statusLabel: 'Принят',
        portalPath: '/r/seed-z10046-live-severnaya-duga',
        nextStatus: 'in_calculation',
        nextStatusLabel: 'В расчёте',
      },
      meta: { traceId: expect.any(String) },
    });
  });

  it('returns 404 Problem Details for an unknown or empty conductor secret, not 401', async () => {
    const requests = [
      { method: 'GET' as const, url: conductorUrl(UNKNOWN_CONDUCTOR_SECRET) },
      { method: 'POST' as const, url: conductorUrl(UNKNOWN_CONDUCTOR_SECRET, 'advance') },
      { method: 'POST' as const, url: conductorUrl(UNKNOWN_CONDUCTOR_SECRET, 'reset') },
      { method: 'GET' as const, url: '/api/v1/demo/conductor/' },
      { method: 'POST' as const, url: '/api/v1/demo/conductor//advance' },
      { method: 'POST' as const, url: '/api/v1/demo/conductor//reset' },
    ];

    for (const request of requests) {
      const response = await app!.inject(request);
      const body: unknown = response.json();
      const detail = problemDetail(body);
      const payload = JSON.stringify(body);

      expect(response.statusCode).toBe(404);
      expect(response.statusCode).not.toBe(401);
      expectPrivateNoStore(response.headers);
      expect(response.headers['content-type']).toContain('application/problem+json');
      expect(isProblemDetails(body)).toBe(true);
      expect(body).toMatchObject({
        status: 404,
        title: 'Resource not found',
      });
      expect(detail).not.toContain(UNKNOWN_CONDUCTOR_SECRET);
      expect(detail).not.toContain(CONDUCTOR_SECRET);
      expect(detail.toLowerCase()).not.toMatch(/select |from |stack|prisma/i);
      expect(payload.toLowerCase()).not.toMatch(/select |from |stack|prisma/i);
    }
  });

  it('resets the live request to accepted with one questionnaire and next in_calculation', async () => {
    await app!.inject({ method: 'POST', url: conductorUrl(CONDUCTOR_SECRET, 'advance') });
    await app!.inject({ method: 'POST', url: conductorUrl(CONDUCTOR_SECRET, 'advance') });

    const response = await app!.inject({
      method: 'POST',
      url: conductorUrl(CONDUCTOR_SECRET, 'reset'),
    });
    const after = Date.now();
    const body: unknown = response.json();
    const portal = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${Z10046_SECRET}`,
    });
    const portalData = portal.json().data as {
      files: Array<{ fileName: string; kind: string }>;
      stages: Array<{ reachedAt: string | null; status: string }>;
      status: string;
      updatedAt: string;
    };

    expect(response.statusCode).toBe(200);
    expectPrivateNoStore(response.headers);
    expect(body).toEqual({
      data: {
        publicNumber: 'З-10046',
        status: 'accepted',
        statusLabel: 'Принят',
        portalPath: '/r/seed-z10046-live-severnaya-duga',
        nextStatus: 'in_calculation',
        nextStatusLabel: 'В расчёте',
      },
      meta: { traceId: expect.any(String) },
    });
    expect(portal.statusCode).toBe(200);
    expect(portalData.status).toBe('accepted');
    expect(portalData.files).toEqual([
      expect.objectContaining({
        fileName: 'Опросный-лист-З-10046.pdf',
        kind: 'questionnaire',
        byteSize: 100000,
      }),
    ]);
    expect(portalData.stages.filter((stage) => stage.reachedAt !== null)).toEqual([
      expect.objectContaining({ status: 'accepted', reachedAt: expect.any(String) }),
    ]);
    expectLiveStandNow(portalData.updatedAt, after);
    expectLiveStandNow(portalData.stages[0]?.reachedAt, after);
  });

  it('advances the live request three times per D-052 and rejects a fourth advance with 409', async () => {
    const first = await app!.inject({
      method: 'POST',
      url: conductorUrl(CONDUCTOR_SECRET, 'advance'),
    });
    const afterFirst = Date.now();
    const firstPortal = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${Z10046_SECRET}`,
    });
    const firstPortalData = firstPortal.json().data as {
      files: unknown[];
      stages: Array<{ reachedAt: string | null; status: string }>;
      status: string;
    };

    expect(first.statusCode).toBe(200);
    expect(first.json()).toEqual({
      data: {
        publicNumber: 'З-10046',
        status: 'in_calculation',
        statusLabel: 'В расчёте',
        portalPath: '/r/seed-z10046-live-severnaya-duga',
        nextStatus: 'quote_ready',
        nextStatusLabel: 'КП готово',
      },
      meta: { traceId: expect.any(String) },
    });
    expect(firstPortalData.status).toBe('in_calculation');
    expect(firstPortalData.files).toHaveLength(1);
    expect(firstPortalData.files).toEqual([
      expect.objectContaining({
        fileName: 'Опросный-лист-З-10046.pdf',
        kind: 'questionnaire',
      }),
    ]);
    expect(
      firstPortalData.stages.filter((stage) => stage.reachedAt !== null).map((s) => s.status),
    ).toEqual(['accepted', 'in_calculation']);
    expectLiveStandNow(firstPortalData.stages[1]?.reachedAt, afterFirst);

    const second = await app!.inject({
      method: 'POST',
      url: conductorUrl(CONDUCTOR_SECRET, 'advance'),
    });
    const afterSecond = Date.now();
    const secondPortal = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${Z10046_SECRET}`,
    });
    const secondPortalData = secondPortal.json().data as {
      files: Array<{ kind: string; uploadedAt: string }>;
      stages: Array<{ reachedAt: string | null; status: string }>;
      status: string;
      updatedAt: string;
    };

    expect(second.statusCode).toBe(200);
    expect(second.json().data).toEqual({
      publicNumber: 'З-10046',
      status: 'quote_ready',
      statusLabel: 'КП готово',
      portalPath: '/r/seed-z10046-live-severnaya-duga',
      nextStatus: 'invoice_issued',
      nextStatusLabel: 'Счёт выставлен',
    });
    expect(secondPortalData.status).toBe('quote_ready');
    expect(secondPortalData.files).toEqual([
      expect.objectContaining({ fileName: 'Опросный-лист-З-10046.pdf', kind: 'questionnaire' }),
      expect.objectContaining({
        fileName: 'КП-З-10046.pdf',
        kind: 'quote',
        byteSize: 240000,
      }),
    ]);
    expectLiveStandNow(secondPortalData.updatedAt, afterSecond);
    expectLiveStandNow(
      secondPortalData.stages.find((stage) => stage.status === 'quote_ready')?.reachedAt,
      afterSecond,
    );
    expectLiveStandNow(
      secondPortalData.files.find((file) => file.kind === 'quote')?.uploadedAt,
      afterSecond,
    );

    const third = await app!.inject({
      method: 'POST',
      url: conductorUrl(CONDUCTOR_SECRET, 'advance'),
    });
    const afterThird = Date.now();
    const thirdPortal = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${Z10046_SECRET}`,
    });
    const thirdPortalData = thirdPortal.json().data as {
      files: Array<{ kind: string; uploadedAt: string }>;
      stages: Array<{ reachedAt: string | null; status: string }>;
      status: string;
      updatedAt: string;
    };

    expect(third.statusCode).toBe(200);
    expect(third.json().data).toEqual({
      publicNumber: 'З-10046',
      status: 'invoice_issued',
      statusLabel: 'Счёт выставлен',
      portalPath: '/r/seed-z10046-live-severnaya-duga',
      nextStatus: null,
      nextStatusLabel: null,
    });
    expect(thirdPortalData.status).toBe('invoice_issued');
    expect(thirdPortalData.files).toEqual([
      expect.objectContaining({ fileName: 'Опросный-лист-З-10046.pdf', kind: 'questionnaire' }),
      expect.objectContaining({ fileName: 'КП-З-10046.pdf', kind: 'quote' }),
      expect.objectContaining({
        fileName: 'Счёт-З-10046.pdf',
        kind: 'invoice',
        byteSize: 180000,
      }),
    ]);
    expect(thirdPortalData.stages.every((stage) => stage.reachedAt !== null)).toBe(true);
    expectLiveStandNow(thirdPortalData.updatedAt, afterThird);
    expectLiveStandNow(
      thirdPortalData.stages.find((stage) => stage.status === 'invoice_issued')?.reachedAt,
      afterThird,
    );
    expectLiveStandNow(
      thirdPortalData.files.find((file) => file.kind === 'invoice')?.uploadedAt,
      afterThird,
    );

    const fourth = await app!.inject({
      method: 'POST',
      url: conductorUrl(CONDUCTOR_SECRET, 'advance'),
    });
    const fourthBody: unknown = fourth.json();
    const fourthDetail = problemDetail(fourthBody);
    const afterConflict = await app!.inject({
      method: 'GET',
      url: conductorUrl(CONDUCTOR_SECRET),
    });
    const afterConflictPortal = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${Z10046_SECRET}`,
    });

    expect(fourth.statusCode).toBe(409);
    expect(fourth.statusCode).not.toBe(401);
    expect(fourth.headers['content-type']).toContain('application/problem+json');
    expect(isProblemDetails(fourthBody)).toBe(true);
    expect(fourthBody).toMatchObject({
      status: 409,
      title: 'Request conflict',
    });
    expect(fourthDetail).not.toContain(CONDUCTOR_SECRET);
    expect(fourthDetail.toLowerCase()).not.toMatch(/select |from |stack|prisma/i);
    expect(afterConflict.json().data).toEqual({
      publicNumber: 'З-10046',
      status: 'invoice_issued',
      statusLabel: 'Счёт выставлен',
      portalPath: '/r/seed-z10046-live-severnaya-duga',
      nextStatus: null,
      nextStatusLabel: null,
    });
    expect(afterConflictPortal.json().data.files).toHaveLength(3);
    expect(afterConflictPortal.json().data.status).toBe('invoice_issued');
  });

  it('serializes concurrent advances so two POSTs from accepted take two D-052 steps', async () => {
    const [first, second] = await Promise.all([
      app!.inject({ method: 'POST', url: conductorUrl(CONDUCTOR_SECRET, 'advance') }),
      app!.inject({ method: 'POST', url: conductorUrl(CONDUCTOR_SECRET, 'advance') }),
    ]);
    const snapshot = await app!.inject({
      method: 'GET',
      url: conductorUrl(CONDUCTOR_SECRET),
    });
    const portal = await app!.inject({
      method: 'GET',
      url: `/api/v1/requests/${Z10046_SECRET}`,
    });
    const statuses = [first.json().data.status, second.json().data.status].sort();

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(statuses).toEqual(['in_calculation', 'quote_ready']);
    expect(snapshot.json().data).toEqual({
      publicNumber: 'З-10046',
      status: 'quote_ready',
      statusLabel: 'КП готово',
      portalPath: '/r/seed-z10046-live-severnaya-duga',
      nextStatus: 'invoice_issued',
      nextStatusLabel: 'Счёт выставлен',
    });
    expect(portal.json().data.files).toEqual([
      expect.objectContaining({
        fileName: 'Опросный-лист-З-10046.pdf',
        kind: 'questionnaire',
      }),
      expect.objectContaining({
        fileName: 'КП-З-10046.pdf',
        kind: 'quote',
        byteSize: 240000,
      }),
    ]);
  });

  it('does not mutate catalog request З-10043 when the conductor advances or resets', async () => {
    const advanced = await app!.inject({
      method: 'POST',
      url: conductorUrl(CONDUCTOR_SECRET, 'advance'),
    });
    const reset = await app!.inject({
      method: 'POST',
      url: conductorUrl(CONDUCTOR_SECRET, 'reset'),
    });
    const advancedAgain = await app!.inject({
      method: 'POST',
      url: conductorUrl(CONDUCTOR_SECRET, 'advance'),
    });

    expect(advanced.statusCode).toBe(200);
    expect(reset.statusCode).toBe(200);
    expect(advancedAgain.statusCode).toBe(200);

    const links = await app!.inject({ method: 'GET', url: '/api/v1/demo/links' });

    const z10043 = REQUEST_CATALOG.find((entry) => entry.publicNumber === 'З-10043');
    expect(z10043).toBeDefined();
    expect(expectedPortalFromCatalog(z10043!)).toEqual(EXPECTED_Z10043);
    for (const entry of REQUEST_CATALOG) {
      const catalog = await app!.inject({
        method: 'GET',
        url: `/api/v1/requests/${entry.accessSecret}`,
      });
      expect(catalog.statusCode).toBe(200);
      expect(catalog.json()).toEqual({
        data: expectedPortalFromCatalog(entry),
        meta: { traceId: expect.any(String) },
      });
    }
    expect(links.json().data.items).toEqual([...EXPECTED_DEMO_LINKS]);
  });

  it('allows CORS POST from the web origin and keeps credentials off', async () => {
    const preflight = await app!.inject({
      headers: {
        'access-control-request-method': 'POST',
        origin: 'http://localhost:3000',
      },
      method: 'OPTIONS',
      url: conductorUrl(CONDUCTOR_SECRET, 'advance'),
    });
    const get = await app!.inject({
      headers: { origin: 'http://localhost:3000' },
      method: 'GET',
      url: conductorUrl(CONDUCTOR_SECRET),
    });

    expect(String(preflight.headers['access-control-allow-methods'] ?? '')).toMatch(/POST/i);
    expect(preflight.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(preflight.headers['access-control-allow-credentials']).not.toBe('true');
    expect(get.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(get.headers['access-control-allow-credentials']).not.toBe('true');
  });

  it('compares the conductor secret with constantTimeTextEqual', () => {
    const source = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), 'infrastructure/env-conductor-auth.ts'),
      'utf8',
    );

    expect(source).toMatch(/constantTimeTextEqual/);
    expect(source).toMatch(/DEMO_CONDUCTOR_SECRET/);
  });
});

describe('request HTTP throttle', () => {
  let app: NestFastifyApplication | undefined;

  beforeEach(async () => {
    app = await startSeededAppWithPortalThrottleLimit(1);
  });

  afterEach(async () => {
    if (app !== undefined) {
      await app.close();
      app = undefined;
    }
    vi.doUnmock('./http/portal-throttle.js');
    vi.resetModules();
  });

  it('returns 429 Problem Details for a second GET from the same IP against a different unknown secret', async () => {
    const first = await app!.inject({
      method: 'GET',
      remoteAddress: SAME_CLIENT_IP,
      url: `/api/v1/requests/${UNKNOWN_SECRET_A}`,
    });
    const second = await app!.inject({
      method: 'GET',
      remoteAddress: SAME_CLIENT_IP,
      url: `/api/v1/requests/${UNKNOWN_SECRET_B}`,
    });
    const body: unknown = second.json();
    const detail = problemDetail(body);

    expect(first.statusCode).toBe(404);
    expect(second.statusCode).toBe(429);
    expect(second.headers['content-type']).toContain('application/problem+json');
    expect(isProblemDetails(body)).toBe(true);
    const retryAfter = Number(second.headers['retry-after']);

    expect(body).toMatchObject({
      status: 429,
      title: 'Too many requests',
      detail: 'The client has sent too many requests',
    });
    expect(detail).toBe('The client has sent too many requests');
    expect(detail).not.toMatch(/throttler/i);
    expect(detail).not.toContain(UNKNOWN_SECRET_A);
    expect(detail).not.toContain(UNKNOWN_SECRET_B);
    expect(detail.toLowerCase()).not.toMatch(/select |from |stack|prisma/i);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
  });

  it('keeps a separate portal throttle bucket for a different client IP', async () => {
    const first = await app!.inject({
      method: 'GET',
      remoteAddress: SAME_CLIENT_IP,
      url: `/api/v1/requests/${UNKNOWN_SECRET_A}`,
    });
    const sameIpSecond = await app!.inject({
      method: 'GET',
      remoteAddress: SAME_CLIENT_IP,
      url: `/api/v1/requests/${UNKNOWN_SECRET_B}`,
    });
    const otherIp = await app!.inject({
      method: 'GET',
      remoteAddress: OTHER_CLIENT_IP,
      url: `/api/v1/requests/${UNKNOWN_SECRET_B}`,
    });

    expect(first.statusCode).toBe(404);
    expect(sameIpSecond.statusCode).toBe(429);
    expect(otherIp.statusCode).toBe(404);
  });

  it('does not apply the portal secret limit to health or demo links', async () => {
    const firstPortal = await app!.inject({
      method: 'GET',
      remoteAddress: SAME_CLIENT_IP,
      url: `/api/v1/requests/${UNKNOWN_SECRET_A}`,
    });
    const secondPortal = await app!.inject({
      method: 'GET',
      remoteAddress: SAME_CLIENT_IP,
      url: `/api/v1/requests/${UNKNOWN_SECRET_B}`,
    });
    const demo = await app!.inject({
      method: 'GET',
      remoteAddress: SAME_CLIENT_IP,
      url: '/api/v1/demo/links',
    });
    const live = await app!.inject({
      method: 'GET',
      remoteAddress: SAME_CLIENT_IP,
      url: '/api/v1/health/live',
    });
    const ready = await app!.inject({
      method: 'GET',
      remoteAddress: SAME_CLIENT_IP,
      url: '/api/v1/health/ready',
    });

    expect(firstPortal.statusCode).toBe(404);
    expect(secondPortal.statusCode).toBe(429);
    expect(demo.statusCode).toBe(200);
    expect(live.statusCode).toBe(200);
    expect(ready.statusCode).not.toBe(429);
  });
});
