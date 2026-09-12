import { expect, test } from '@playwright/test';

const CONDUCTOR_SECRET = 'seed-demo-conductor-nordshield';
const CONDUCTOR_PATH = `/c/${CONDUCTOR_SECRET}`;
const LIVE_ACCESS_SECRET = 'seed-z10046-live-severnaya-duga';
const LIVE_PORTAL_PATH = `/r/${LIVE_ACCESS_SECRET}`;
const QUOTE_CABINET_PATH = '/r/seed-z10043-quote-kuznetsov';

const conductorCopy = {
  heading: 'Пульт показа',
  title: 'Пульт показа — ПК «Нордщит»',
  disclaimer: 'Этот экран не показывается заказчику.',
  advance: 'Продвинуть заявку',
  reset: 'Сбросить',
} as const;

const unknownSecretDeadEnd = {
  heading: 'Ссылка недействительна',
  title: 'Ссылка недействительна — ПК «Нордщит»',
  body: 'Заявки по этой ссылке нет. Проверьте адрес или попросите новую ссылку у менеджера.',
} as const;

test('unknown conductor secret is a Russian dead-end without login', async ({ page }) => {
  const response = await page.goto('/c/nope');

  expect(response, 'GET /c/nope must receive a response from :3000').toBeTruthy();
  expect(response?.status()).toBe(404);

  const deadEnd = page.getByRole('alert');
  await expect(
    deadEnd.getByRole('heading', { exact: true, level: 1, name: unknownSecretDeadEnd.heading }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  expect(await page.title()).toContain(unknownSecretDeadEnd.title);
  await expect(deadEnd.getByText(unknownSecretDeadEnd.body, { exact: true })).toBeVisible();
  await expect(page.getByText(/Код ошибки:/)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /К заявке/ })).toHaveCount(0);
  await expect(page.locator('main a[href="/"]')).toHaveCount(0);

  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.getByLabel(/телефон|phone|парол|логин|otp/i)).toHaveCount(0);
  await expect(page.getByText(/OTP|одноразов|войти|логин|пароль|телефон/i)).toHaveCount(0);
  await expect(page.getByText(/401/)).toHaveCount(0);
});

test('conductor page names itself and shows both D-052 actions', async ({ page }) => {
  const response = await page.goto(CONDUCTOR_PATH);

  expect(response, 'GET /c/{fixture} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expect(
    page.getByRole('heading', { exact: true, level: 1, name: conductorCopy.heading }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  expect(await page.title()).toContain(conductorCopy.title);
  await expect(page.getByText(conductorCopy.disclaimer, { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { exact: true, name: conductorCopy.advance }),
  ).toBeVisible();
  await expect(page.getByRole('button', { exact: true, name: conductorCopy.reset })).toBeVisible();
  await expect(page.getByRole('button')).toHaveCount(2);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByLabel(/телефон|phone|парол|логин|otp/i)).toHaveCount(0);
});

test('index live block links to the conductor fixture and keeps D-027 phrases exact', async ({
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
  const conductorLink = page.getByRole('link', { exact: true, name: 'Пульт показа' });
  await expect(conductorLink).toBeVisible();
  await expect(conductorLink).toHaveAttribute('href', CONDUCTOR_PATH);
  await expect(page.getByRole('button')).toHaveCount(0);

  await conductorLink.click();
  await expect(page).toHaveURL(new RegExp(`${CONDUCTOR_PATH}$`));
  await expect(
    page.getByRole('heading', { exact: true, level: 1, name: conductorCopy.heading }),
  ).toBeVisible();
});

test('customer cabinets have no conductor action buttons', async ({ page }) => {
  const quote = await page.goto(QUOTE_CABINET_PATH);
  expect(quote, 'GET quote cabinet must receive a response from :3000').toBeTruthy();
  expect(quote?.ok()).toBe(true);
  await expect(page.getByRole('button', { name: conductorCopy.advance })).toHaveCount(0);
  await expect(page.getByRole('button', { name: conductorCopy.reset })).toHaveCount(0);

  const live = await page.goto(LIVE_PORTAL_PATH);
  expect(live, 'GET live cabinet must receive a response from :3000').toBeTruthy();
  expect(live?.ok()).toBe(true);
  await expect(page.getByRole('button', { name: conductorCopy.advance })).toHaveCount(0);
  await expect(page.getByRole('button', { name: conductorCopy.reset })).toHaveCount(0);
});
