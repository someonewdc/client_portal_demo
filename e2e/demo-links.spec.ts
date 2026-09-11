import { expect, test } from '@playwright/test';

const catalog = [
  {
    publicNumber: 'З-10041',
    counterpartyName: 'ООО «Северэнергомонтаж»',
    title: 'Щит ЩО-70 800 А',
    statusLabel: 'Принят',
    portalPath: '/r/seed-z10041-accepted-severenergo',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    publicNumber: 'З-10042',
    counterpartyName: 'АО «ПортЛайн»',
    title: 'НКУ освещения причала',
    statusLabel: 'В расчёте',
    portalPath: '/r/seed-z10042-calc-portline',
    updatedAt: '2026-09-02T11:00:00.000Z',
  },
  {
    publicNumber: 'З-10043',
    counterpartyName: 'ИП Кузнецов П.А.',
    title: 'ВРУ 400 А',
    statusLabel: 'КП готово',
    portalPath: '/r/seed-z10043-quote-kuznetsov',
    updatedAt: '2026-09-04T12:00:00.000Z',
  },
  {
    publicNumber: 'З-10044',
    counterpartyName: 'ООО «Теплицы Поволжья»',
    title: 'Щит управления теплицами',
    statusLabel: 'Счёт выставлен',
    portalPath: '/r/seed-z10044-invoice-teplitsy',
    updatedAt: '2026-09-06T15:00:00.000Z',
  },
  {
    publicNumber: 'З-10045',
    counterpartyName: 'ЗАО «Горсвет»',
    title: 'Шкафы наружного освещения',
    statusLabel: 'В расчёте',
    portalPath: '/r/seed-z10045-calc-gorsvet',
    updatedAt: '2026-09-03T14:00:00.000Z',
  },
] as const;

test('demo links index lists seed requests and opens the quote cabinet URL', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'GET / must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expect(page.getByText(/не показывается заказчику/)).toBeVisible();
  await expect(
    page.getByText('Так выглядит то, что вы отправили бы заказчику в мессенджер'),
  ).toBeVisible();

  for (const item of catalog) {
    const row = page.getByRole('link', { name: new RegExp(item.publicNumber) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(item.counterpartyName);
    await expect(row).toContainText(item.title);
    await expect(row).toContainText(item.statusLabel);
    await expect(row).toHaveAttribute('href', item.portalPath);
    await expect(row.locator('time')).toHaveAttribute('datetime', item.updatedAt);
    await expect(row.locator('time')).toBeVisible();
  }

  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);

  await page.getByRole('link', { name: /З-10043/ }).click();
  await expect(page).toHaveURL(/\/r\/seed-z10043-quote-kuznetsov$/);
});

test('demo links index names itself and tells the conductor to click a row', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'GET / must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expect(page.getByRole('heading', { level: 1, name: 'Ссылки для показа' })).toBeVisible();
  expect(await page.title()).toContain('Ссылки для показа — ПК «Нордщит»');
  await expect(
    page.getByText('Нажмите строку — откроется экран заказчика по ссылке.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Этот список не показывается заказчику.')).toBeVisible();
  await expect(
    page.getByText('Так выглядит то, что вы отправили бы заказчику в мессенджер.'),
  ).toBeVisible();

  for (const item of catalog) {
    await expect(page.getByRole('link', { name: new RegExp(item.publicNumber) })).toHaveAttribute(
      'href',
      item.portalPath,
    );
  }

  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);

  await page.getByRole('link', { name: /З-10043/ }).click();
  await expect(page).toHaveURL(/\/r\/seed-z10043-quote-kuznetsov$/);
});
