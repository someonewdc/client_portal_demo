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
  await expect(page.locator(`p > time[datetime="${quoteCabinet.updatedAt}"]`)).toBeVisible();

  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /скачать/i })).toHaveCount(0);
  await expect(page.locator('[download]')).toHaveCount(0);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
});

test('quote cabinet reads as a status document with a dated process list', async ({ page }) => {
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expect(page.getByText('Статус заявки', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Менеджер отправил вам эту ссылку. Вход не нужен.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: quoteCabinet.publicNumber })).toBeVisible();

  const stageRibbon = page.getByRole('list', { name: 'Этапы заявки' });
  const stageItems = stageRibbon.getByRole('listitem');
  await expect(stageItems).toHaveCount(4);

  const accepted = stageItems.filter({ hasText: 'Принят' });
  const inCalculation = stageItems.filter({ hasText: 'В расчёте' });
  const quoteReady = stageItems.filter({ hasText: 'КП готово' });
  const invoiceIssued = stageItems.filter({ hasText: 'Счёт выставлен' });

  await expect(accepted.getByText('1', { exact: true })).toBeVisible();
  await expect(inCalculation.getByText('2', { exact: true })).toBeVisible();
  await expect(quoteReady.getByText('3', { exact: true })).toBeVisible();
  await expect(invoiceIssued.getByText('4', { exact: true })).toBeVisible();

  await expect(accepted.locator('time')).toHaveAttribute('datetime', '2026-09-01T09:00:00.000Z');
  await expect(inCalculation.locator('time')).toHaveAttribute(
    'datetime',
    '2026-09-02T11:00:00.000Z',
  );
  await expect(quoteReady.locator('time')).toHaveAttribute('datetime', '2026-09-04T12:00:00.000Z');

  await expect(invoiceIssued.getByText('ещё нет', { exact: true })).toBeVisible();
  await expect(invoiceIssued.locator('time')).toHaveCount(0);

  await expect(page.getByText('КП готово', { exact: true })).toHaveCount(1);
  await expect(page.locator(`p > time[datetime="${quoteCabinet.updatedAt}"]`)).toBeVisible();
  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
});

test('quote cabinet lists files as records and keeps the comment column', async ({ page }) => {
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  const files = page.getByRole('list', { name: 'Файлы' });
  const questionnaire = files.getByRole('listitem').filter({
    hasText: quoteCabinet.questionnaireFileName,
  });
  const quoteFile = files.getByRole('listitem').filter({ hasText: quoteCabinet.quoteFileName });

  await expect(questionnaire.getByText('Опросный лист', { exact: true })).toBeVisible();
  await expect(questionnaire.getByText('120 КБ', { exact: true })).toBeVisible();
  await expect(questionnaire.locator('time')).toHaveAttribute(
    'datetime',
    '2026-09-01T09:05:00.000Z',
  );

  await expect(quoteFile.getByText('КП', { exact: true })).toBeVisible();
  await expect(quoteFile.getByText('240 КБ', { exact: true })).toBeVisible();
  await expect(quoteFile.locator('time')).toHaveAttribute('datetime', '2026-09-04T12:00:00.000Z');

  const quoteSheetHref = `/r/${quoteCabinet.accessSecret}/d/${encodeURIComponent(quoteCabinet.quoteFileName)}`;
  const questionnaireSheetHref = `/r/${quoteCabinet.accessSecret}/d/${encodeURIComponent(quoteCabinet.questionnaireFileName)}`;
  await expect(
    quoteFile.getByRole('link', { name: quoteCabinet.quoteFileName, exact: true }),
  ).toHaveAttribute('href', quoteSheetHref);
  await expect(
    questionnaire.getByRole('link', { name: quoteCabinet.questionnaireFileName, exact: true }),
  ).toHaveAttribute('href', questionnaireSheetHref);
  await expect(page.locator('[download]')).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);

  await expect(page.getByRole('columnheader', { name: 'Комментарий' })).toBeVisible();
  await expect(page.getByText('IP54, навесной')).toBeVisible();
});

test('quote cabinet file name opens an HTML document sheet', async ({ page }) => {
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  const quoteSheetHref = `/r/${quoteCabinet.accessSecret}/d/${encodeURIComponent(quoteCabinet.quoteFileName)}`;
  const quoteFile = page
    .getByRole('list', { name: 'Файлы' })
    .getByRole('listitem')
    .filter({ hasText: quoteCabinet.quoteFileName });
  const link = quoteFile.getByRole('link', { name: quoteCabinet.quoteFileName, exact: true });

  await expect(link).toHaveAttribute('href', quoteSheetHref);
  await link.click();

  await expect(page).toHaveURL(new RegExp(`/r/${quoteCabinet.accessSecret}/d/`));
  await expect(page.getByRole('heading', { name: quoteCabinet.quoteFileName })).toBeVisible();
  await expect(page.getByText('КП', { exact: true })).toBeVisible();
  await expect(page.getByText('240 КБ', { exact: true })).toBeVisible();
  await expect(page.locator('time')).toHaveAttribute('datetime', '2026-09-04T12:00:00.000Z');
  await expect(page.getByText('Коммерческое предложение.', { exact: true })).toBeVisible();
  await expect(page.getByText(quoteCabinet.specLine)).toBeVisible();
  await expect(page.getByText(quoteCabinet.specLineSecondary)).toBeVisible();
  await expect(
    page.getByRole('link', { name: `К заявке ${quoteCabinet.publicNumber}` }),
  ).toBeVisible();
  await expect(page.locator('[download]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /скачать/i })).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);
});

test('quote cabinet file sheet returns to the request', async ({ page }) => {
  const sheetPath = `/r/${quoteCabinet.accessSecret}/d/${encodeURIComponent(quoteCabinet.quoteFileName)}`;
  const response = await page.goto(sheetPath);

  expect(response, 'GET /r/{secret}/d/{fileName} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await page.getByRole('link', { name: `К заявке ${quoteCabinet.publicNumber}` }).click();
  await expect(page).toHaveURL(new RegExp(`/r/${quoteCabinet.accessSecret}$`));
  await expect(page.getByRole('heading', { name: quoteCabinet.publicNumber })).toBeVisible();
});

test('unknown file name on a live secret is a Russian dead-end', async ({ page }) => {
  const response = await page.goto(
    `/r/${quoteCabinet.accessSecret}/d/${encodeURIComponent('нет-такого.pdf')}`,
  );

  expect(response, 'GET /r/{secret}/d/{unknown} must receive a response from :3000').toBeTruthy();
  expect(response?.status()).toBe(404);

  const deadEnd = page.getByRole('alert');
  await expect(deadEnd.getByRole('heading', { name: 'Ссылка недействительна' })).toBeVisible();
  await expect(deadEnd.getByText(/заявки по этой ссылке нет/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: quoteCabinet.publicNumber })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: quoteCabinet.quoteFileName })).toHaveCount(0);

  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);
});

test('calculation cabinet hides an empty specification comment column', async ({ page }) => {
  const response = await page.goto('/r/seed-z10042-calc-portline');

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expect(page.getByRole('heading', { name: 'З-10042' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Комментарий' })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'НКУ освещения причала' })).toBeVisible();
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
