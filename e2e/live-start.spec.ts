import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const CONDUCTOR_SECRET = 'seed-demo-conductor-nordshield';
const LIVE_ACCESS_SECRET = 'seed-z10046-live-severnaya-duga';
const LIVE_PORTAL_PATH = `/r/${LIVE_ACCESS_SECRET}`;
const LIVE_PUBLIC_NUMBER = 'З-10046';
const API_BASE_URL = 'http://localhost:3001/api/v1';

const startCopy = {
  heading: 'Подать заявку',
  title: 'Подать заявку — ПК «Нордщит»',
  firstParagraph:
    'Щит, НКУ или комплект нельзя купить карточкой с полки. На заводе заявку принимают письмом или от менеджера. Здесь одна кнопка заменяет этот вход, чтобы сразу открыть ссылку заказчика.',
  secondParagraph: 'После отправки откроется ссылка, которую менеджер отправил бы в мессенджер.',
  button: 'Подать заявку',
} as const;

function repoFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function composeService(compose: string, name: string): string {
  const start = compose.indexOf(`\n  ${name}:`);
  if (start < 0) {
    return '';
  }

  const fromService = compose.slice(start);
  const next = fromService.slice(1).search(/\n {2}[a-z]|\nvolumes:/);
  return next < 0 ? fromService : fromService.slice(0, next + 1);
}

async function conductorPost(request: APIRequestContext, action: 'advance' | 'reset') {
  const response = await request.post(
    `${API_BASE_URL}/demo/conductor/${CONDUCTOR_SECRET}/${action}`,
  );
  expect(response.ok(), `POST conductor ${action} must succeed against the stand API`).toBeTruthy();
}

async function advanceLiveToInvoiceIssued(request: APIRequestContext) {
  await conductorPost(request, 'reset');
  await conductorPost(request, 'advance');
  await conductorPost(request, 'advance');
  await conductorPost(request, 'advance');
}

function collectBrowserConductorLeak(page: Page): string[] {
  const leaked: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes(CONDUCTOR_SECRET) || url.includes('/demo/conductor/')) {
      leaked.push(url);
    }
  });
  return leaked;
}

test('stand env wires NUXT_DEMO_CONDUCTOR_SECRET for make dev and make up', () => {
  const envExample = repoFile('.env.example');
  const compose = repoFile('compose.yaml');
  const ci = repoFile('.github/workflows/ci.yml');
  const webService = composeService(compose, 'web');

  expect(envExample).toMatch(/^NUXT_DEMO_CONDUCTOR_SECRET=seed-demo-conductor-nordshield$/m);
  expect(envExample).not.toMatch(/^NUXT_PUBLIC_.*seed-demo-conductor-nordshield/m);
  expect(webService).toMatch(/NUXT_DEMO_CONDUCTOR_SECRET:\s*seed-demo-conductor-nordshield/);
  expect(webService).not.toMatch(/NUXT_PUBLIC_[A-Z0-9_]+:[^\n]*seed-demo-conductor-nordshield/);
  expect(ci).toMatch(/NUXT_DEMO_CONDUCTOR_SECRET:\s*seed-demo-conductor-nordshield/);
});

test('start page names the entry and shows both D-052 paragraphs', async ({ page }) => {
  const response = await page.goto('/start');

  expect(response, 'GET /start must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expect(
    page.getByRole('heading', { exact: true, level: 1, name: startCopy.heading }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  expect(await page.title()).toContain(startCopy.title);
  await expect(page.getByText(startCopy.firstParagraph, { exact: true })).toBeVisible();
  await expect(page.getByText(startCopy.secondParagraph, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { exact: true, name: startCopy.button })).toBeVisible();
  await expect(page.getByRole('button')).toHaveCount(1);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
});

test('start HTML does not leak the conductor secret', async ({ page }) => {
  const response = await page.goto('/start');

  expect(response, 'GET /start must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  const html = await page.content();
  expect(html).not.toContain(CONDUCTOR_SECRET);
  expect(html).not.toContain('NUXT_PUBLIC_DEMO_CONDUCTOR_SECRET');
});

test('index live block links to /start and keeps the four D-027 phrases exact', async ({
  page,
}) => {
  const response = await page.goto('/');

  expect(response, 'GET / must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expect(
    page.getByRole('heading', { exact: true, level: 1, name: 'Ссылки для показа' }),
  ).toBeVisible();
  await expect(
    page.getByText('Этот список не показывается заказчику.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Так выглядит то, что вы отправили бы заказчику в мессенджер.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Нажмите строку — откроется экран заказчика по ссылке.', { exact: true }),
  ).toBeVisible();

  await expect(page.getByRole('heading', { exact: true, name: 'Живой показ' })).toBeVisible();
  const startLink = page.getByRole('link', { exact: true, name: 'Как заказчик начинает' });
  await expect(startLink).toBeVisible();
  await expect(startLink).toHaveAttribute('href', '/start');
  await expect(page.getByRole('link', { name: 'Пульт смены шага' })).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);

  await startLink.click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(
    page.getByRole('heading', { exact: true, level: 1, name: startCopy.heading }),
  ).toBeVisible();
});

test.describe('live request start action', () => {
  test.describe.configure({ mode: 'serial' });

  test('clicking Подать заявку opens the live cabinet at Принят', async ({ page }) => {
    const leaked = collectBrowserConductorLeak(page);
    const response = await page.goto('/start');

    expect(response, 'GET /start must receive a response from :3000').toBeTruthy();
    expect(response?.ok()).toBe(true);

    await page.getByRole('button', { exact: true, name: startCopy.button }).click();

    await expect(page).toHaveURL(new RegExp(`${LIVE_PORTAL_PATH}$`));
    await expect(
      page.getByRole('heading', { exact: true, level: 1, name: 'Принят' }),
    ).toBeVisible();
    await expect(page.getByText(LIVE_PUBLIC_NUMBER, { exact: true })).toBeVisible();
    expect(leaked, 'browser must not call conductor API with the secret').toEqual([]);
  });

  test('clicking Подать заявку after invoice_issued resets to Принят', async ({
    page,
    request,
  }) => {
    await advanceLiveToInvoiceIssued(request);

    const invoiceCabinet = await page.goto(LIVE_PORTAL_PATH);
    expect(invoiceCabinet, 'GET live cabinet must receive a response from :3000').toBeTruthy();
    expect(invoiceCabinet?.ok()).toBe(true);
    await expect(
      page.getByRole('heading', { exact: true, level: 1, name: 'Счёт выставлен' }),
    ).toBeVisible();

    const leaked = collectBrowserConductorLeak(page);
    await page.goto('/start');
    await page.getByRole('button', { exact: true, name: startCopy.button }).click();

    await expect(page).toHaveURL(new RegExp(`${LIVE_PORTAL_PATH}$`));
    await expect(
      page.getByRole('heading', { exact: true, level: 1, name: 'Принят' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { exact: true, level: 1, name: 'Счёт выставлен' }),
    ).toHaveCount(0);
    expect(leaked, 'browser must not call conductor API with the secret').toEqual([]);
  });
});
