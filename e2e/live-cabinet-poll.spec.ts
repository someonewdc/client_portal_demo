import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { LIVE_CABINET_POLL_INTERVAL_MS } from '../apps/web/app/utils/live-cabinet-poll.ts';

const CONDUCTOR_SECRET = 'seed-demo-conductor-nordshield';
const LIVE_ACCESS_SECRET = 'seed-z10046-live-severnaya-duga';
const LIVE_PORTAL_PATH = `/r/${LIVE_ACCESS_SECRET}`;
const LIVE_PUBLIC_NUMBER = 'З-10046';
const QUOTE_ACCESS_SECRET = 'seed-z10043-quote-kuznetsov';
const QUOTE_CABINET_PATH = `/r/${QUOTE_ACCESS_SECRET}`;
const API_BASE_URL = 'http://localhost:3001/api/v1';

const livePollHint = 'Эта заявка обновляется на глазах. Обновится сама через несколько секунд.';

function repoFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function routeRuleBlock(source: string, path: string): string {
  const marker = `'${path}':`;
  const start = source.indexOf(marker);
  expect(start, `routeRules must declare ${path}`).toBeGreaterThanOrEqual(0);
  const from = source.slice(start);
  const open = from.indexOf('{');
  const close = from.indexOf('}');
  expect(open, `${path} routeRules object`).toBeGreaterThanOrEqual(0);
  expect(close, `${path} routeRules object end`).toBeGreaterThan(open);
  return from.slice(open, close + 1);
}

async function conductorPost(request: APIRequestContext, action: 'advance' | 'reset') {
  const response = await request.post(
    `${API_BASE_URL}/demo/conductor/${CONDUCTOR_SECRET}/${action}`,
  );
  expect(response.ok(), `POST conductor ${action} must succeed against the stand API`).toBeTruthy();
}

function countPortalGets(page: Page, accessSecret: string): { count: () => number } {
  let count = 0;
  page.on('request', (request) => {
    if (request.method() !== 'GET') {
      return;
    }
    if (!request.url().includes(`/requests/${accessSecret}`)) {
      return;
    }
    count += 1;
  });
  return {
    count: () => count,
  };
}

function countDocumentNavigations(page: Page): { count: () => number } {
  let navigations = 0;
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      navigations += 1;
    }
  });
  return {
    count: () => navigations,
  };
}

test('live cabinet poll interval is 4s, gated on demoLive, and /r/** has no swr/isr', () => {
  const pollSource = repoFile('apps/web/app/utils/live-cabinet-poll.ts');
  expect(pollSource).toMatch(/export const LIVE_CABINET_POLL_INTERVAL_MS = 4000;/);
  expect(pollSource).toContain('demoLive === true');
  expect(pollSource).toContain('shouldApplyLiveCabinetPollResult');

  const portal = repoFile('apps/web/app/composables/useRequestPortal.ts');
  expect(portal).toContain('LIVE_CABINET_POLL_INTERVAL_MS');
  expect(portal).toContain('shouldPollLiveCabinet');
  expect(portal).toContain('shouldApplyLiveCabinetPollResult');
  expect(portal).toContain('bindLiveCabinetPoll');
  const scopeAt = portal.indexOf('getCurrentScope()');
  const awaitAt = portal.indexOf('await useAsyncData');
  expect(scopeAt, 'capture the page scope before await useAsyncData').toBeGreaterThanOrEqual(0);
  expect(awaitAt, 'useAsyncData must stay async').toBeGreaterThan(scopeAt);
  expect(portal).toContain('liveCabinetScope.run');

  const nuxtConfig = repoFile('apps/web/nuxt.config.ts');
  const liveCabinetRule = routeRuleBlock(nuxtConfig, '/r/**');
  expect(liveCabinetRule, '/r/** must not enable Nitro swr').not.toMatch(/\bswr\b/i);
  expect(liveCabinetRule, '/r/** must not enable Nitro isr').not.toMatch(/\bisr\b/i);
});

test('quote cabinet Z-10043 does not show the live poll phrase and does not poll', async ({
  page,
}) => {
  const portalGets = countPortalGets(page, QUOTE_ACCESS_SECRET);
  const response = await page.goto(QUOTE_CABINET_PATH);

  expect(response, 'GET quote cabinet must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expect(page.getByRole('heading', { exact: true, level: 1, name: 'КП готово' })).toBeVisible(
    { timeout: 5_000 },
  );
  await expect(page.getByText(livePollHint, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Продвинуть по статусу' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Сбросить' })).toHaveCount(0);

  const quietStartedAt = Date.now();
  await expect
    .poll(() => Date.now() - quietStartedAt, { intervals: [100], timeout: 1_000 })
    .toBeGreaterThan(500);
  const getsAfterLoad = portalGets.count();
  const startedAt = Date.now();
  await expect
    .poll(
      () => {
        const extraGets = portalGets.count() - getsAfterLoad;
        expect(extraGets, 'catalog Z-10043 must not poll GET /requests/{secret}').toBe(0);
        return Date.now() - startedAt;
      },
      { intervals: [250], timeout: LIVE_CABINET_POLL_INTERVAL_MS + 2_000 },
    )
    .toBeGreaterThan(LIVE_CABINET_POLL_INTERVAL_MS);
});

test.describe('live cabinet poll', () => {
  test.describe.configure({ mode: 'serial' });

  test('live cabinet at Принят shows the D-052 poll phrase and no conductor buttons', async ({
    page,
    request,
  }) => {
    await conductorPost(request, 'reset');

    const response = await page.goto(LIVE_PORTAL_PATH);
    expect(response, 'GET live cabinet must receive a response from :3000').toBeTruthy();
    expect(response?.ok()).toBe(true);

    await expect(page.getByRole('heading', { exact: true, level: 1, name: 'Принят' })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText(LIVE_PUBLIC_NUMBER, { exact: true })).toBeVisible();
    await expect(page.getByText(livePollHint, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Продвинуть по статусу' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Сбросить' })).toHaveCount(0);
    await expect(page.getByRole('button')).toHaveCount(0);
  });

  test('POST advance updates live cabinet h1 without a new navigation', async ({
    page,
    request,
  }) => {
    await conductorPost(request, 'reset');

    const navigations = countDocumentNavigations(page);
    const response = await page.goto(LIVE_PORTAL_PATH);
    expect(response, 'GET live cabinet must receive a response from :3000').toBeTruthy();
    expect(response?.ok()).toBe(true);

    await expect(page.getByRole('heading', { exact: true, level: 1, name: 'Принят' })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText(livePollHint, { exact: true })).toBeVisible();
    const urlAfterLoad = page.url();
    const navigationsAfterLoad = navigations.count();

    await conductorPost(request, 'advance');

    await expect(
      page.getByRole('heading', { exact: true, level: 1, name: 'В расчёте' }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { exact: true, level: 1, name: 'Принят' })).toHaveCount(
      0,
    );
    expect(page.url(), 'cabinet must stay on the same URL after advance').toBe(urlAfterLoad);
    expect(
      navigations.count(),
      'cabinet must not load a new document after conductor advance',
    ).toBe(navigationsAfterLoad);
    await expect(page.getByText(livePollHint, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Продвинуть по статусу' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Сбросить' })).toHaveCount(0);
  });

  test('live invoice_issued file sheets show distinct spec tables by kind', async ({
    page,
    request,
  }) => {
    await conductorPost(request, 'reset');
    await conductorPost(request, 'advance');
    await conductorPost(request, 'advance');
    await conductorPost(request, 'advance');

    const cabinetResponse = await page.goto(LIVE_PORTAL_PATH);
    expect(cabinetResponse, 'GET live cabinet must receive a response from :3000').toBeTruthy();
    expect(cabinetResponse?.ok()).toBe(true);
    await expect(
      page.getByRole('heading', { exact: true, level: 1, name: 'Счёт выставлен' }),
    ).toBeVisible({ timeout: 5_000 });

    const cabinetSpec = page.getByRole('table', { name: 'Спецификация' });
    await expect(cabinetSpec.getByText('Щит ЩО-70 800 А IP54', { exact: true })).toBeVisible();
    await expect(cabinetSpec.getByText('Комплект автоматики ввода', { exact: true })).toBeVisible();

    const liveSheets = [
      { caption: 'Состав заявки', fileName: 'Опросный-лист-З-10046.pdf' },
      { caption: 'Спецификация', fileName: 'КП-З-10046.pdf' },
      { caption: 'Позиции счёта', fileName: 'Счёт-З-10046.pdf' },
    ] as const;

    const identities: string[] = [];
    for (const sheet of liveSheets) {
      const response = await page.goto(
        `${LIVE_PORTAL_PATH}/d/${encodeURIComponent(sheet.fileName)}`,
      );
      expect(response, `GET live ${sheet.fileName} must receive a response`).toBeTruthy();
      expect(response?.ok(), `${sheet.fileName} must be HTTP 200`).toBe(true);

      const table = page.getByRole('table', { name: sheet.caption });
      await expect(table).toBeVisible();
      const identity = await table.locator('tbody tr').evaluateAll((rows) =>
        rows
          .map((row) => {
            const values = [...row.querySelectorAll('td')].map((cell) => {
              const spans = [...cell.querySelectorAll('span')];
              const valueSpan = spans.at(-1);
              return (valueSpan?.textContent ?? cell.textContent ?? '').trim();
            });
            return `${values[0] ?? ''}|${values[1] ?? ''}|${values[2] ?? ''}`;
          })
          .sort()
          .join('||'),
      );
      expect(identity.length, `${sheet.fileName} spec identity`).toBeGreaterThan(0);
      identities.push(identity);
    }

    expect(
      new Set(identities).size,
      `live questionnaire/quote/invoice tables must not be copies, got ${identities.join(' ;; ')}`,
    ).toBe(3);

    await conductorPost(request, 'reset');
  });
});
