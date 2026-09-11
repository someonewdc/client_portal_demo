import { expect, type Page, test } from '@playwright/test';

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

const calculationCabinet = {
  accessSecret: 'seed-z10042-calc-portline',
  publicNumber: 'З-10042',
  statusLabel: 'В расчёте',
} as const;

const nextStepCabinets = [
  {
    accessSecret: 'seed-z10041-accepted-severenergo',
    publicNumber: 'З-10041',
    statusLabel: 'Принят',
    phrase: 'Заявку приняли. Сейчас готовят расчёт.',
  },
  {
    accessSecret: calculationCabinet.accessSecret,
    publicNumber: calculationCabinet.publicNumber,
    statusLabel: calculationCabinet.statusLabel,
    phrase: 'Идёт расчёт. Коммерческое предложение ещё не готово.',
  },
  {
    accessSecret: quoteCabinet.accessSecret,
    publicNumber: quoteCabinet.publicNumber,
    statusLabel: quoteCabinet.statusLabel,
    phrase: 'Коммерческое предложение готово. Счёт ещё не выставлен.',
  },
  {
    accessSecret: 'seed-z10044-invoice-teplitsy',
    publicNumber: 'З-10044',
    statusLabel: 'Счёт выставлен',
    phrase: 'Счёт выставлен. Оплата в этом окне не принимается.',
  },
] as const;

async function expectCabinetStatusHeader(page: Page, publicNumber: string, statusLabel: string) {
  await expect(
    page.getByRole('heading', { level: 1, name: statusLabel, exact: true }),
  ).toBeVisible();
  const publicNumberText = page.getByText(publicNumber, { exact: true });
  await expect(publicNumberText).toBeVisible();
  await expect(publicNumberText).toHaveClass(/tabular-nums/);
  await expect(page.getByRole('heading', { name: publicNumber })).toHaveCount(0);
}

async function expectCabinetFieldLabels(
  page: Page,
  fields: {
    counterpartyName: string;
    statusLabel: string;
    title: string;
    updatedAt: string;
  },
) {
  const customerLabel = page.locator('dt', { hasText: /^Заказчик$/ });
  await expect(customerLabel).toBeVisible();
  await expect(page.getByText('Заказчик', { exact: true })).toBeVisible();
  await expect(page.getByText(fields.counterpartyName, { exact: true })).toBeVisible();
  await expect(
    customerLabel.locator('xpath=following-sibling::dd[1]').getByText(fields.counterpartyName, {
      exact: true,
    }),
  ).toBeVisible();

  const productLabel = page.locator('dt', { hasText: /^Изделие$/ });
  await expect(productLabel).toBeVisible();
  await expect(page.getByText('Изделие', { exact: true })).toBeVisible();
  await expect(page.getByText(fields.title, { exact: true })).toBeVisible();
  await expect(
    productLabel.locator('xpath=following-sibling::dd[1]').getByText(fields.title, { exact: true }),
  ).toBeVisible();

  const updatedLabel = page.locator('dt', { hasText: /^Обновлено$/ });
  await expect(updatedLabel).toBeVisible();
  await expect(page.getByText('Обновлено', { exact: true })).toBeVisible();
  const updatedValue = updatedLabel.locator('xpath=following-sibling::dd[1]');
  await expect(updatedValue.locator(`time[datetime="${fields.updatedAt}"]`)).toBeVisible();
  await expect(updatedValue.getByText(fields.statusLabel, { exact: true })).toHaveCount(0);
}

async function expectCabinetNextStepPhrase(page: Page, phrase: string) {
  const nextStep = page.getByText(phrase, { exact: true });
  await expect(nextStep).toBeVisible();
  await expect(nextStep).toHaveCount(1);
  await expect(nextStep).toHaveJSProperty('tagName', 'P');
  await expect(page.locator('main dl + p')).toHaveText(phrase);
  await expect(page.locator('main dl + p + ol[aria-label="Этапы заявки"]')).toBeVisible();
  await expect(page.getByRole('banner').getByText(phrase, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('alert').getByText(phrase, { exact: true })).toHaveCount(0);

  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /оплатить/i })).toHaveCount(0);
  await expect(page.getByText(/оплатить/i)).toHaveCount(0);
}

async function expectCurrentProcessStep(
  page: Page,
  fields: {
    currentLabel: string;
    pastLabels: readonly string[];
    futureLabel: string;
  },
) {
  const stageRibbon = page.getByRole('list', { name: 'Этапы заявки' });
  const current = stageRibbon.locator('[aria-current="step"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveJSProperty('tagName', 'LI');
  await expect(current.getByText(fields.currentLabel, { exact: true })).toBeVisible();

  const nowLabel = current.locator('span.sr-only');
  await expect(nowLabel).toHaveText('сейчас');
  await expect(nowLabel).toHaveCSS('position', 'absolute');
  await expect(nowLabel).toHaveCSS('width', '1px');
  await expect(nowLabel).toHaveCSS('height', '1px');
  await expect(nowLabel).toHaveCSS('overflow', 'hidden');
  await expect(nowLabel).not.toHaveClass(/bg-accent/);

  for (const label of fields.pastLabels) {
    const item = stageRibbon.getByRole('listitem').filter({ hasText: label });
    await expect(item).not.toHaveAttribute('aria-current');
    await expect(item.locator('span.sr-only')).toHaveCount(0);
  }

  const future = stageRibbon.getByRole('listitem').filter({ hasText: fields.futureLabel });
  await expect(future).not.toHaveAttribute('aria-current');
  await expect(future.getByText('ещё нет', { exact: true })).toBeVisible();
  await expect(future.locator('time')).toHaveCount(0);
  await expect(future.locator('span.sr-only')).toHaveCount(0);
}

async function expectProcessRibbonStacksOnNarrowPhone(page: Page) {
  const stageRibbon = page.getByRole('list', { name: 'Этапы заявки' });
  const stageItems = stageRibbon.getByRole('listitem');
  await expect(stageItems).toHaveCount(4);

  let previousBottom = Number.NEGATIVE_INFINITY;

  for (const label of quoteCabinet.stages) {
    const item = stageItems.filter({ hasText: label });
    await expect(item.getByText(label, { exact: true })).toBeVisible();

    const layout = await item.evaluate((li, stageLabel) => {
      const stampLabel = [...li.querySelectorAll('span')].find((element) => {
        const text = element.textContent?.replace(/\s*сейчас\s*$/u, '').trim();
        return text === stageLabel && element.children.length === 0;
      });
      const dateEl =
        li.querySelector('time') ??
        [...li.querySelectorAll('span')].find(
          (element) => element.textContent?.trim() === 'ещё нет',
        );

      if (stampLabel == null || dateEl == null) {
        return null;
      }

      const stampRect = stampLabel.getBoundingClientRect();
      const dateRect = dateEl.getBoundingClientRect();
      const itemRect = li.getBoundingClientRect();

      return {
        bottom: itemRect.y + itemRect.height,
        clientWidth: li.clientWidth,
        dateClientWidth: dateEl.clientWidth,
        dateScrollWidth: dateEl.scrollWidth,
        dateY: dateRect.y,
        flexDirection: getComputedStyle(li).flexDirection,
        scrollWidth: li.scrollWidth,
        stampClientWidth: stampLabel.clientWidth,
        stampScrollWidth: stampLabel.scrollWidth,
        stampY: stampRect.y,
        top: itemRect.y,
      };
    }, label);

    expect(layout, `${label}: stamp and date exist`).not.toBeNull();
    if (layout == null) {
      continue;
    }

    expect(layout.scrollWidth, `${label} step must not clip horizontally`).toBeLessThanOrEqual(
      layout.clientWidth + 1,
    );
    expect(layout.stampScrollWidth, `${label} stamp must not clip`).toBeLessThanOrEqual(
      layout.stampClientWidth + 1,
    );
    expect(layout.dateScrollWidth, `${label} date must not clip`).toBeLessThanOrEqual(
      layout.dateClientWidth + 1,
    );

    expect(
      layout.dateY,
      `${label}: date/ещё нет (y=${layout.dateY}) must sit below the stamp (y=${layout.stampY})`,
    ).toBeGreaterThan(layout.stampY + 4);
    expect(layout.flexDirection, `${label}: item stacks as a column below 40rem`).toBe('column');

    expect(layout.top, `${label} must not overlap the previous step`).toBeGreaterThanOrEqual(
      previousBottom - 1,
    );
    previousBottom = layout.bottom;
  }

  await expect(stageRibbon.getByText('ещё нет', { exact: true })).toBeVisible();
}

const specColumnLabels = ['Наименование', 'Кол-во', 'Ед.', 'Комментарий'] as const;

async function expectSpecLineBlockLabels(
  row: ReturnType<Page['locator']>,
  labels: readonly string[],
) {
  for (const label of labels) {
    const heading = row.getByText(label, { exact: true });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(label);

    const metrics = await heading.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        clientWidth: element.clientWidth,
        right: rect.right,
        scrollWidth: element.scrollWidth,
      };
    });
    expect(metrics.scrollWidth, `${label} must not clip`).toBeLessThanOrEqual(
      metrics.clientWidth + 1,
    );
    expect(metrics.right, `${label} must stay inside the 390px viewport`).toBeLessThanOrEqual(390);
  }
}

async function expectSpecTableStacksOnNarrowPhone(page: Page) {
  const specTable = page.getByRole('table', { name: 'Спецификация' });
  await expect(specTable).toBeVisible();
  await expect(specTable.getByText(quoteCabinet.specLine, { exact: true })).toBeVisible();
  await expect(specTable.getByText('IP54, навесной', { exact: true })).toBeVisible();
  await expect(specTable.getByText(quoteCabinet.specLineSecondary, { exact: true })).toBeVisible();

  const rows = specTable.locator('tbody tr');
  await expect(rows).toHaveCount(2);

  const firstRow = rows.filter({ hasText: quoteCabinet.specLine });
  const secondRow = rows.filter({ hasText: quoteCabinet.specLineSecondary });

  await expectSpecLineBlockLabels(firstRow, specColumnLabels);
  await expectSpecLineBlockLabels(secondRow, specColumnLabels);

  for (const row of [firstRow, secondRow]) {
    const layout = await row.evaluate((tr) => {
      const cells = [...tr.querySelectorAll('td')];
      return {
        cellYs: cells.map((cell) => cell.getBoundingClientRect().y),
        display: getComputedStyle(tr).display,
      };
    });

    expect(layout.display, 'each spec line is a block, not a 4-column table-row').toBe('block');
    expect(layout.cellYs.length, 'spec line keeps name, qty, unit, comment cells').toBe(4);
    for (let index = 1; index < layout.cellYs.length; index += 1) {
      expect(
        layout.cellYs[index],
        `cell ${index} (y=${layout.cellYs[index]}) must sit below cell ${index - 1} (y=${layout.cellYs[index - 1]})`,
      ).toBeGreaterThan(layout.cellYs[index - 1] + 4);
    }
  }

  const widths = await specTable.evaluate((table) => ({
    pageScrollWidth: document.documentElement.scrollWidth,
    tableClientWidth: table.clientWidth,
    tableScrollWidth: table.scrollWidth,
  }));
  expect(widths.tableScrollWidth, 'spec table must not clip horizontally').toBeLessThanOrEqual(
    widths.tableClientWidth + 1,
  );
  expect(
    widths.pageScrollWidth,
    'page must not scroll horizontally because of the spec table',
  ).toBeLessThanOrEqual(390);
}

async function expectSpecTableDesktopColumns(page: Page) {
  const specTable = page.getByRole('table', { name: 'Спецификация' });
  await expect(specTable).toBeVisible();

  const nameHeader = specTable.getByRole('columnheader', { name: 'Наименование', exact: true });
  const quantityHeader = specTable.getByRole('columnheader', { name: 'Кол-во', exact: true });
  const unitHeader = specTable.getByRole('columnheader', { name: 'Ед.', exact: true });
  const commentHeader = specTable.getByRole('columnheader', { name: 'Комментарий', exact: true });

  await expect(nameHeader).toBeVisible();
  await expect(nameHeader).toHaveText('Наименование');
  await expect(quantityHeader).toBeVisible();
  await expect(quantityHeader).toHaveText('Кол-во');
  await expect(unitHeader).toBeVisible();
  await expect(unitHeader).toHaveText('Ед.');
  await expect(commentHeader).toBeVisible();
  await expect(commentHeader).toHaveText('Комментарий');

  await expect(
    specTable.getByRole('cell', { name: quoteCabinet.specLine, exact: true }),
  ).toBeVisible();
  await expect(specTable.getByRole('cell', { name: 'IP54, навесной', exact: true })).toBeVisible();
  await expect(
    specTable.getByRole('cell', { name: quoteCabinet.specLineSecondary, exact: true }),
  ).toBeVisible();

  const firstRow = specTable.locator('tbody tr').filter({ hasText: quoteCabinet.specLine });
  const layout = await firstRow.evaluate((tr) => getComputedStyle(tr).display);
  expect(layout, 'desktop spec stays a table-row').toBe('table-row');
  await expect(firstRow.getByText('Наименование', { exact: true })).toBeHidden();
}

const filesSheetHint = 'Имя открывает выписку на экране.';

async function expectFilesSheetHint(page: Page) {
  await expect(page.getByRole('heading', { level: 2, name: 'Файлы', exact: true })).toBeVisible();
  const hint = page.getByText(filesSheetHint, { exact: true });
  await expect(hint).toBeVisible();
  await expect(hint).toHaveCount(1);
  await expect(hint).toHaveJSProperty('tagName', 'P');
  await expect(page.locator('main h2 + p')).toHaveText(filesSheetHint);
  await expect(page.locator('main h2 + p + ul[aria-label="Файлы"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: filesSheetHint })).toHaveCount(0);
}

async function expectFileNameIsTheOnlyRecordLink(
  page: Page,
  fields: { fileName: string; href: string; kindLabel: string; sizeLabel: string },
) {
  const item = page
    .getByRole('list', { name: 'Файлы' })
    .getByRole('listitem')
    .filter({ hasText: fields.fileName });
  const link = item.getByRole('link', { name: fields.fileName, exact: true });

  await expect(link).toHaveAttribute('href', fields.href);
  await expect(item.getByRole('link')).toHaveCount(1);
  await expect(item.getByRole('link', { name: fields.kindLabel, exact: true })).toHaveCount(0);
  await expect(item.getByRole('link', { name: fields.sizeLabel, exact: true })).toHaveCount(0);
  await expect(item.locator('time').getByRole('link')).toHaveCount(0);
}

const fileSheetDisclaimer = 'Это выписка на экране, не файл для скачивания.';

async function expectQuoteFileSheetExtract(page: Page) {
  await expect(
    page.getByRole('heading', { level: 1, name: quoteCabinet.quoteFileName }),
  ).toBeVisible();
  await expect(page.getByText(fileSheetDisclaimer, { exact: true })).toBeVisible();
  await expect(page.getByText('Коммерческое предложение.', { exact: true })).toBeVisible();

  const customerLabel = page.locator('dt', { hasText: /^Заказчик$/ });
  await expect(customerLabel).toBeVisible();
  await expect(
    customerLabel
      .locator('xpath=following-sibling::dd[1]')
      .getByText(quoteCabinet.counterpartyName, {
        exact: true,
      }),
  ).toBeVisible();

  const productLabel = page.locator('dt', { hasText: /^Изделие$/ });
  await expect(productLabel).toBeVisible();
  await expect(
    productLabel.locator('xpath=following-sibling::dd[1]').getByText(quoteCabinet.title, {
      exact: true,
    }),
  ).toBeVisible();

  const uploadedLabel = page.locator('dt', { hasText: /^Загружено$/ });
  await expect(uploadedLabel).toBeVisible();
  await expect(
    uploadedLabel
      .locator('xpath=following-sibling::dd[1]')
      .locator('time[datetime="2026-09-04T12:00:00.000Z"]'),
  ).toBeVisible();

  const sizeLabel = page.locator('dt', { hasText: /^Размер$/ });
  await expect(sizeLabel).toBeVisible();
  await expect(
    sizeLabel.locator('xpath=following-sibling::dd[1]').getByText('240 КБ', { exact: true }),
  ).toBeVisible();

  const firstLine = page.getByRole('listitem').filter({ hasText: quoteCabinet.specLine });
  await expect(firstLine.getByText('1', { exact: true })).toBeVisible();
  await expect(firstLine.getByText('шт', { exact: true })).toBeVisible();
  await expect(firstLine.getByText('IP54, навесной', { exact: true })).toBeVisible();

  expect(await page.title()).toContain('КП — З-10043 — ПК «Нордщит»');

  await expect(
    page.getByRole('link', { name: `К заявке ${quoteCabinet.publicNumber}` }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /скачать/i })).toHaveCount(0);
  await expect(page.getByText('скачать', { exact: true })).toHaveCount(0);
  await expect(page.locator('[download]')).toHaveCount(0);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
}

type FileRecordFieldYs = {
  dateY: number;
  kindY: number;
  nameY: number;
  sizeY: number;
};

function fieldRowIndex(ys: readonly number[], y: number): number {
  const unique: number[] = [];
  for (const value of [...ys].sort((left, right) => left - right)) {
    if (unique.every((existing) => Math.abs(existing - value) > 4)) {
      unique.push(value);
    }
  }

  return unique.findIndex((existing) => Math.abs(existing - y) <= 4);
}

function fileRecordRowPattern(ys: FileRecordFieldYs): string {
  const allYs = [ys.kindY, ys.nameY, ys.sizeY, ys.dateY];
  return [
    fieldRowIndex(allYs, ys.kindY),
    fieldRowIndex(allYs, ys.nameY),
    fieldRowIndex(allYs, ys.sizeY),
    fieldRowIndex(allYs, ys.dateY),
  ].join('-');
}

async function fileRecordFieldYs(
  item: ReturnType<Page['locator']>,
): Promise<FileRecordFieldYs | null> {
  return item.evaluate((li) => {
    const kind = li.querySelector(':scope > span:first-of-type');
    const name = li.querySelector(':scope > a');
    const size = [...li.querySelectorAll(':scope > span')].find((element) =>
      /КБ$/u.test(element.textContent?.trim() ?? ''),
    );
    const date = li.querySelector(':scope > time');

    if (kind == null || name == null || size == null || date == null) {
      return null;
    }

    return {
      dateY: date.getBoundingClientRect().y,
      kindY: kind.getBoundingClientRect().y,
      nameY: name.getBoundingClientRect().y,
      sizeY: size.getBoundingClientRect().y,
    };
  });
}

async function expectFileRecordsShareOneRhythm(page: Page) {
  const files = page.getByRole('list', { name: 'Файлы' });
  const items = [
    files.getByRole('listitem').filter({ hasText: quoteCabinet.questionnaireFileName }),
    files.getByRole('listitem').filter({ hasText: quoteCabinet.quoteFileName }),
  ];

  const patterns: string[] = [];

  for (const item of items) {
    const ys = await fileRecordFieldYs(item);
    expect(ys, 'file record keeps kind, name, size, and date').not.toBeNull();
    if (ys == null) {
      continue;
    }

    const pattern = fileRecordRowPattern(ys);
    patterns.push(pattern);

    expect(fieldRowIndex([ys.kindY, ys.nameY, ys.sizeY, ys.dateY], ys.kindY)).toBe(
      fieldRowIndex([ys.kindY, ys.nameY, ys.sizeY, ys.dateY], ys.nameY),
    );

    if (Math.abs(ys.sizeY - ys.nameY) > 4) {
      expect(ys.sizeY, 'wrap after the file name, not before size/date').toBeGreaterThan(
        ys.nameY + 4,
      );
      expect(
        Math.abs(ys.sizeY - ys.dateY),
        'size and date stay on the same wrapped row',
      ).toBeLessThanOrEqual(4);
    }
  }

  expect(patterns).toHaveLength(2);
  expect(
    patterns[0],
    `questionnaire wrap ${patterns[0]} must match quote wrap ${patterns[1]}`,
  ).toBe(patterns[1]);
}

const unknownSecret = 'this-secret-does-not-exist';

test('quote cabinet shows Z-10043 seed payload from GET /requests/{accessSecret}', async ({
  page,
}) => {
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  const banner = page.getByRole('banner');
  await expect(banner.getByText(quoteCabinet.plantName, { exact: true })).toBeVisible();
  await expect(banner.getByRole('heading', { name: quoteCabinet.plantName })).toHaveCount(0);
  await expectCabinetStatusHeader(page, quoteCabinet.publicNumber, quoteCabinet.statusLabel);
  expect(await page.title()).toContain('КП готово — З-10043 — ПК «Нордщит»');
  await expectCabinetFieldLabels(page, quoteCabinet);

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
  await expect(page.locator(`dd > time[datetime="${quoteCabinet.updatedAt}"]`)).toBeVisible();

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
  await expectCabinetStatusHeader(page, quoteCabinet.publicNumber, quoteCabinet.statusLabel);
  expect(await page.title()).toContain('КП готово — З-10043 — ПК «Нордщит»');
  await expectCabinetFieldLabels(page, quoteCabinet);
  expect(await page.getByText('КП готово', { exact: true }).count()).toBeGreaterThanOrEqual(2);

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

  const updatedAt = page.locator(`dd > time[datetime="${quoteCabinet.updatedAt}"]`);
  await expect(updatedAt).toBeVisible();
  await expect(
    updatedAt.locator('xpath=ancestor::dd[1]').getByText(quoteCabinet.statusLabel, { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
});

test('quote cabinet labels customer, product, and updated date', async ({ page }) => {
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expectCabinetStatusHeader(page, quoteCabinet.publicNumber, quoteCabinet.statusLabel);
  await expectCabinetFieldLabels(page, quoteCabinet);
});

test('quote cabinet marks the current process step for assistive tech', async ({ page }) => {
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expectCabinetStatusHeader(page, quoteCabinet.publicNumber, quoteCabinet.statusLabel);
  await expectCabinetFieldLabels(page, quoteCabinet);
  await expectCabinetNextStepPhrase(
    page,
    'Коммерческое предложение готово. Счёт ещё не выставлен.',
  );
  await expectCurrentProcessStep(page, {
    currentLabel: quoteCabinet.statusLabel,
    pastLabels: ['Принят', 'В расчёте'],
    futureLabel: 'Счёт выставлен',
  });
});

test('quote cabinet process list stays readable on a 390px messenger viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expectCabinetStatusHeader(page, quoteCabinet.publicNumber, quoteCabinet.statusLabel);
  await expectProcessRibbonStacksOnNarrowPhone(page);
  await expectCurrentProcessStep(page, {
    currentLabel: quoteCabinet.statusLabel,
    pastLabels: ['Принят', 'В расчёте'],
    futureLabel: 'Счёт выставлен',
  });
});

test('quote cabinet specification stays readable on a 390px messenger viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expectCabinetStatusHeader(page, quoteCabinet.publicNumber, quoteCabinet.statusLabel);
  await expectSpecTableStacksOnNarrowPhone(page);
});

test('quote cabinet specification keeps a desktop table with thead at 1280px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expectCabinetStatusHeader(page, quoteCabinet.publicNumber, quoteCabinet.statusLabel);
  await expectSpecTableDesktopColumns(page);
});

for (const cabinet of nextStepCabinets) {
  test(`${cabinet.publicNumber} tells the viewer what happens next`, async ({ page }) => {
    const response = await page.goto(`/r/${cabinet.accessSecret}`);

    expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
    expect(response?.ok()).toBe(true);

    await expectCabinetStatusHeader(page, cabinet.publicNumber, cabinet.statusLabel);
    await expectCabinetNextStepPhrase(page, cabinet.phrase);

    if (cabinet.publicNumber === quoteCabinet.publicNumber) {
      await expectCabinetFieldLabels(page, quoteCabinet);
    }
  });
}

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

test('quote cabinet files hint that the name opens an on-screen sheet', async ({ page }) => {
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expectFilesSheetHint(page);

  const quoteSheetHref = `/r/${quoteCabinet.accessSecret}/d/${encodeURIComponent(quoteCabinet.quoteFileName)}`;
  const questionnaireSheetHref = `/r/${quoteCabinet.accessSecret}/d/${encodeURIComponent(quoteCabinet.questionnaireFileName)}`;

  await expectFileNameIsTheOnlyRecordLink(page, {
    fileName: quoteCabinet.quoteFileName,
    href: quoteSheetHref,
    kindLabel: 'КП',
    sizeLabel: '240 КБ',
  });
  await expectFileNameIsTheOnlyRecordLink(page, {
    fileName: quoteCabinet.questionnaireFileName,
    href: questionnaireSheetHref,
    kindLabel: 'Опросный лист',
    sizeLabel: '120 КБ',
  });

  await expect(page.getByRole('link', { name: /скачать/i })).toHaveCount(0);
  await expect(page.locator('[download]')).toHaveCount(0);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);

  await expectFileRecordsShareOneRhythm(page);
});

test('quote cabinet file records keep one rhythm on a 390px messenger viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`/r/${quoteCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expectFilesSheetHint(page);
  await expectFileRecordsShareOneRhythm(page);
  await expect(page.getByRole('link', { name: /скачать/i })).toHaveCount(0);
  await expect(page.locator('[download]')).toHaveCount(0);
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
  await expect(
    page.getByRole('heading', { level: 1, name: quoteCabinet.quoteFileName }),
  ).toBeVisible();
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

test('quote file sheet is a labelled on-screen extract with a full specification', async ({
  page,
}) => {
  const sheetPath = `/r/${quoteCabinet.accessSecret}/d/${encodeURIComponent(quoteCabinet.quoteFileName)}`;
  const response = await page.goto(sheetPath);

  expect(response, 'GET /r/{secret}/d/{fileName} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expectQuoteFileSheetExtract(page);
});

test('quote cabinet file sheet returns to the request', async ({ page }) => {
  const sheetPath = `/r/${quoteCabinet.accessSecret}/d/${encodeURIComponent(quoteCabinet.quoteFileName)}`;
  const response = await page.goto(sheetPath);

  expect(response, 'GET /r/{secret}/d/{fileName} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await page.getByRole('link', { name: `К заявке ${quoteCabinet.publicNumber}` }).click();
  await expect(page).toHaveURL(new RegExp(`/r/${quoteCabinet.accessSecret}$`));
  await expectCabinetStatusHeader(page, quoteCabinet.publicNumber, quoteCabinet.statusLabel);
});

test('unknown file name on a live secret is a Russian dead-end', async ({ page }) => {
  const response = await page.goto(
    `/r/${quoteCabinet.accessSecret}/d/${encodeURIComponent('нет-такого.pdf')}`,
  );

  expect(response, 'GET /r/{secret}/d/{unknown} must receive a response from :3000').toBeTruthy();
  expect(response?.status()).toBe(404);

  const deadEnd = page.getByRole('alert');
  await expect(
    deadEnd.getByRole('heading', { level: 1, name: 'Ссылка недействительна' }),
  ).toBeVisible();
  await expect(deadEnd.getByText(/заявки по этой ссылке нет/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: quoteCabinet.publicNumber })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: quoteCabinet.quoteFileName })).toHaveCount(0);

  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(0);
});

test('calculation cabinet hides an empty specification comment column', async ({ page }) => {
  const response = await page.goto(`/r/${calculationCabinet.accessSecret}`);

  expect(response, 'GET /r/{secret} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await expectCabinetStatusHeader(
    page,
    calculationCabinet.publicNumber,
    calculationCabinet.statusLabel,
  );
  await expect(page.getByRole('columnheader', { name: 'Комментарий' })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'НКУ освещения причала' })).toBeVisible();
});

test('index click opens the filled quote cabinet, not an empty shell', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'GET / must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  await page.getByRole('link', { name: new RegExp(quoteCabinet.publicNumber) }).click();
  await expect(page).toHaveURL(new RegExp(`/r/${quoteCabinet.accessSecret}$`));

  await expectCabinetStatusHeader(page, quoteCabinet.publicNumber, quoteCabinet.statusLabel);
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
  await expect(
    deadEnd.getByRole('heading', { level: 1, name: 'Ссылка недействительна' }),
  ).toBeVisible();
  expect(await page.title()).toContain('Ссылка недействительна — ПК «Нордщит»');
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
