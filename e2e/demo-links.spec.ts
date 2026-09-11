import { expect, test, type Locator } from '@playwright/test';

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

test('demo links index status stamp is a regular-weight tag, not a button', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'GET / must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Ссылки для показа', exact: true }),
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

  const quoteRow = page.getByRole('link', { name: /З-10043/ });
  await expect(quoteRow).toHaveAttribute('href', '/r/seed-z10043-quote-kuznetsov');
  await expect(page.getByRole('button')).toHaveCount(0);

  const stamp = quoteRow.getByText('КП готово', { exact: true });
  await expect(stamp).toBeVisible();
  await expect(stamp).not.toHaveClass(/document-link/);
  await expectStatusStampLooksLikeTag(stamp, 'index status stamp');

  await stamp.click();
  await expect(page).toHaveURL(/\/r\/seed-z10043-quote-kuznetsov$/);
});

const documentLinkAccentRgb = 'rgb(61, 90, 115)';
const statusStampInkRgb = 'rgb(28, 25, 23)';
const statusStampPlateRgb = 'rgb(214, 208, 196)';

async function expectStatusStampLooksLikeTag(target: Locator, label: string) {
  const style = await target.evaluate((node) => {
    const stamp = node.closest('.status-stamp') ?? node;
    const computed = getComputedStyle(stamp);
    const raw = computed.fontWeight;
    const fontWeight = raw === 'normal' ? 400 : raw === 'bold' ? 700 : Number.parseInt(raw, 10);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      cursor: computed.cursor,
      fontWeight,
      textDecorationLine: computed.textDecorationLine,
    };
  });

  expect(style.cursor, `${label} must look unpressable`).toBe('default');
  expect(style.color, `${label} must use ink, not accent link color`).toBe(statusStampInkRgb);
  expect(style.backgroundColor, `${label} must sit on the rule plate, not the link wash`).toBe(
    statusStampPlateRgb,
  );
  expect(style.textDecorationLine, `${label} must not look like a document link`).not.toBe(
    'underline',
  );
  expect(style.fontWeight, `${label} must stay a regular-weight tag`).toBeLessThanOrEqual(400);
}

function isAccentWash(backgroundColor: string): boolean {
  const modern = backgroundColor.match(
    /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\/\s*([\d.]+)\)$/,
  );
  if (modern) {
    const red = Number.parseFloat(modern[1] ?? '') * 255;
    const green = Number.parseFloat(modern[2] ?? '') * 255;
    const blue = Number.parseFloat(modern[3] ?? '') * 255;
    const alpha = Number.parseFloat(modern[4] ?? '');
    return (
      Math.abs(red - 61) < 0.5 &&
      Math.abs(green - 90) < 0.5 &&
      Math.abs(blue - 115) < 0.5 &&
      Math.abs(alpha - 0.1) < 0.01
    );
  }

  const legacy = backgroundColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (!legacy) {
    return false;
  }

  return (
    Number.parseInt(legacy[1] ?? '', 10) === 61 &&
    Number.parseInt(legacy[2] ?? '', 10) === 90 &&
    Number.parseInt(legacy[3] ?? '', 10) === 115 &&
    Math.abs(Number.parseFloat(legacy[4] ?? '') - 0.1) < 0.01
  );
}

async function restLinkStyle(target: Locator) {
  return target.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      backgroundColor: computed.backgroundColor,
      borderTopWidth: computed.borderTopWidth,
      boxDecorationBreak: computed.boxDecorationBreak,
      color: computed.color,
      display: computed.display,
      textDecorationColor: computed.textDecorationColor,
      textDecorationThickness: computed.textDecorationThickness,
      textUnderlineOffset: computed.textUnderlineOffset,
      webkitBoxDecorationBreak: computed.getPropertyValue('-webkit-box-decoration-break'),
    };
  });
}

function expectDocumentLinkMark(style: Awaited<ReturnType<typeof restLinkStyle>>, label: string) {
  expect(style.textDecorationThickness, `${label} rest underline must be 2px`).toBe('2px');
  expect(style.textUnderlineOffset, `${label} rest underline offset must be 3px`).toBe('3px');
  expect(
    isAccentWash(style.backgroundColor),
    `${label} rest wash must be a light accent tint, got ${style.backgroundColor}`,
  ).toBe(true);
  expect(style.borderTopWidth, `${label} must not use a form-field contour`).toBe('0px');
  expect(style.display, `${label} must stay inline so wrapping names are not boxed`).toBe('inline');
  expect(
    style.boxDecorationBreak === 'clone' || style.webkitBoxDecorationBreak === 'clone',
    `${label} wash must clone per line`,
  ).toBe(true);
}

test('demo links index number and title are accent document links at rest', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'GET / must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Ссылки для показа', exact: true }),
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

  const quoteRow = page.getByRole('link', { name: /З-10043/ });
  await expect(quoteRow).toHaveAttribute('href', '/r/seed-z10043-quote-kuznetsov');
  await expect(page.getByRole('button')).toHaveCount(0);

  const publicNumber = quoteRow.getByText('З-10043', { exact: true });
  const title = quoteRow.getByText('ВРУ 400 А', { exact: true });
  await expect(publicNumber).toBeVisible();
  await expect(title).toBeVisible();
  await expect(publicNumber).toHaveClass(/document-link/);
  await expect(title).toHaveClass(/document-link/);

  const numberStyle = await restLinkStyle(publicNumber);
  expect(numberStyle.color, 'index publicNumber rest color must be accent').toBe(
    documentLinkAccentRgb,
  );
  expect(numberStyle.textDecorationColor, 'index publicNumber rest underline must be accent').toBe(
    documentLinkAccentRgb,
  );
  expectDocumentLinkMark(numberStyle, 'index publicNumber');

  const titleStyle = await restLinkStyle(title);
  expect(titleStyle.color, 'index title rest color must be accent').toBe(documentLinkAccentRgb);
  expect(titleStyle.textDecorationColor, 'index title rest underline must be accent').toBe(
    documentLinkAccentRgb,
  );
  expectDocumentLinkMark(titleStyle, 'index title');

  const stamp = quoteRow.getByText('КП готово', { exact: true });
  await expect(stamp).toBeVisible();
  await expect(stamp).not.toHaveClass(/document-link/);

  await expectStatusStampLooksLikeTag(stamp, 'index rest-state status stamp');

  await quoteRow.click();
  await expect(page).toHaveURL(/\/r\/seed-z10043-quote-kuznetsov$/);
});
