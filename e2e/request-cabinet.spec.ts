import { expect, test } from '@playwright/test';

const quoteCabinet = {
  accessSecret: 'seed-z10043-quote-kuznetsov',
  publicNumber: 'З-10043',
  counterpartyName: 'ИП Кузнецов П.А.',
  title: 'ВРУ 400 А',
  statusLabel: 'КП готово',
  plantName: 'ПК «Нордщит»',
  updatedAt: '2026-09-04T12:00:00.000Z',
  stages: ['Принят', 'В расчёте', 'КП готово', 'Счёт выставлен'],
  specLine: 'Вводно-распределительное устройство 400 А',
  specLineSecondary: 'Рубильник ввода',
  questionnaireFileName: 'Опросный-лист-З-10043.pdf',
  quoteFileName: 'КП-З-10043.pdf',
} as const;

const unknownSecret = 'this-secret-does-not-exist';

test('quote cabinet shows Z-10043 seed payload from GET /requests/{accessSecret}', async ({
  page,
}) => {
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expect(
    page.getByRole('banner').getByRole('heading', { name: quoteCabinet.plantName }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: quoteCabinet.publicNumber })).toBeVisible();
  await expect(page.getByText(quoteCabinet.counterpartyName)).toBeVisible();
  await expect(page.getByText(quoteCabinet.title, { exact: true })).toBeVisible();

  const stageRibbon = page.getByRole('list', { name: 'Этапы заявки' });
  await expect(stageRibbon.getByRole('listitem')).toHaveCount(4);
  for (const label of quoteCabinet.stages) {
    await expect(stageRibbon.getByText(label, { exact: true })).toBeVisible();
  }

  await expect(page.getByText(quoteCabinet.specLine)).toBeVisible();
  await expect(page.getByText(quoteCabinet.specLineSecondary)).toBeVisible();
  await expect(page.getByText('IP54, навесной')).toBeVisible();
  await expect(page.getByText(quoteCabinet.questionnaireFileName, { exact: true })).toBeVisible();
  await expect(page.getByText(quoteCabinet.quoteFileName, { exact: true })).toBeVisible();
  await expect(page.locator(`time[datetime="${quoteCabinet.updatedAt}"]`)).toBeVisible();

  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /скачать/i })).toHaveCount(0);
  await expect(page.locator('[download]')).toHaveCount(0);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
});

test('index click opens the filled quote cabinet, not an empty shell', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'GET / must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await page.getByRole('link', { name: new RegExp(quoteCabinet.publicNumber) }).click();
  await expect(page).toHaveURL(new RegExp(`/r/${quoteCabinet.accessSecret}$`));

  await expect(page.getByRole('heading', { name: quoteCabinet.publicNumber })).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Этапы заявки' }).getByText(quoteCabinet.statusLabel, {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(quoteCabinet.specLine)).toBeVisible();
  await expect(page.getByText(quoteCabinet.questionnaireFileName, { exact: true })).toBeVisible();
  await expect(page.getByText(quoteCabinet.quoteFileName, { exact: true })).toBeVisible();
});

test('unknown secret is a Russian dead-end without login and API 404', async ({
  page,
  request,
}) => {
  const documentResponse = await page.goto(`/r/${unknownSecret}`);

  expect(documentResponse, 'GET /r/{unknown} must receive a response from :3000').toBeTruthy();
  expect(documentResponse?.status()).toBe(404);

  const deadEnd = page.getByRole('alert');
  await expect(deadEnd.getByRole('heading', { name: 'Ссылка недействительна' })).toBeVisible();
  await expect(deadEnd.getByText(/заявки по этой ссылке нет/i)).toBeVisible();
  await expect(deadEnd.getByText(/Код ошибки:/)).toBeVisible();
  await expect(page.getByText(unknownSecret)).toHaveCount(0);

  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.getByLabel(/телефон|phone|парол|логин|otp/i)).toHaveCount(0);
  await expect(page.getByText(/OTP|одноразов|войти|логин|пароль|телефон/i)).toHaveCount(0);

  const apiResponse = await request.get(`http://localhost:3001/api/v1/requests/${unknownSecret}`);
  expect(apiResponse.status()).toBe(404);
  expect(apiResponse.headers()['content-type'] ?? '').toContain('application/problem+json');

  const body: unknown = await apiResponse.json();
  expect(body).toEqual(
    expect.objectContaining({
      status: 404,
      title: 'Resource not found',
    }),
  );

  const detail =
    typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string'
      ? body.detail
      : '';
  const instance =
    typeof body === 'object' &&
    body !== null &&
    'instance' in body &&
    typeof body.instance === 'string'
      ? body.instance
      : '';
  const traceId =
    typeof body === 'object' &&
    body !== null &&
    'traceId' in body &&
    typeof body.traceId === 'string'
      ? body.traceId
      : '';

  expect(detail.length).toBeGreaterThan(0);
  expect(detail).not.toContain(unknownSecret);
  expect(detail.toLowerCase()).not.toMatch(/select |from |stack|prisma/i);
  expect(instance).toContain('/api/v1/requests/');
  expect(traceId.length).toBeGreaterThan(0);
});
