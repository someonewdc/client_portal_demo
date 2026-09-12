import { expect, test, type Locator, type Page } from '@playwright/test';

const CONDUCTOR_PATH = '/c/seed-demo-conductor-nordshield';

const themeRgb = {
  accent: 'rgb(61, 90, 115)',
  ink: 'rgb(28, 25, 23)',
  paper: 'rgb(244, 241, 234)',
  sheet: 'rgb(255, 252, 247)',
} as const;

const themeValues = new Set<string>(Object.values(themeRgb));
const statusStampPlateRgb = 'rgb(214, 208, 196)';

type ControlStyle = {
  backgroundColor: string;
  borderTopColor: string;
  color: string;
  cursor: string;
  textDecorationLine: string;
};

async function computedControlStyle(target: Locator): Promise<ControlStyle> {
  return target.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      backgroundColor: computed.backgroundColor,
      borderTopColor: computed.borderTopColor,
      color: computed.color,
      cursor: computed.cursor,
      textDecorationLine: computed.textDecorationLine,
    };
  });
}

function expectThemeToken(value: string, label: string) {
  expect(themeValues.has(value), `${label} must use a @theme fill, got ${value}`).toBe(true);
}

function expectNoticeableShift(from: ControlStyle, to: ControlStyle, label: string) {
  const changed =
    to.backgroundColor !== from.backgroundColor ||
    to.color !== from.color ||
    to.borderTopColor !== from.borderTopColor;
  expect(
    changed,
    `${label} must change background, ink, or border (rest bg=${from.backgroundColor} color=${from.color} border=${from.borderTopColor}; next bg=${to.backgroundColor} color=${to.color} border=${to.borderTopColor})`,
  ).toBe(true);
}

async function expectLiveControlLooksPressable(page: Page, target: Locator, label: string) {
  await expect(target).toBeVisible();
  await expect(target).not.toHaveClass(/document-link/);
  await expect(target).not.toHaveClass(/status-stamp/);

  const rest = await computedControlStyle(target);
  expect(rest.cursor, `${label} rest cursor must be pointer`).toBe('pointer');
  expect(rest.textDecorationLine, `${label} must not copy document-link underline`).not.toBe(
    'underline',
  );
  expect(rest.backgroundColor, `${label} must not sit on the status-stamp plate`).not.toBe(
    statusStampPlateRgb,
  );
  expectThemeToken(rest.backgroundColor, `${label} rest background`);
  expectThemeToken(rest.color, `${label} rest color`);
  expectThemeToken(rest.borderTopColor, `${label} rest border`);

  await target.hover();
  const hover = await computedControlStyle(target);
  expect(hover.cursor, `${label} hover cursor must stay pointer`).toBe('pointer');
  expect(hover.textDecorationLine, `${label} hover must not copy document-link underline`).not.toBe(
    'underline',
  );
  expect(hover.backgroundColor, `${label} hover must not become a status-stamp`).not.toBe(
    statusStampPlateRgb,
  );
  expectThemeToken(hover.backgroundColor, `${label} hover background`);
  expectThemeToken(hover.color, `${label} hover color`);
  expectThemeToken(hover.borderTopColor, `${label} hover border`);
  expectNoticeableShift(rest, hover, `${label} hover`);

  await target.evaluate((node) => {
    node.closest('form')?.addEventListener('submit', (event) => {
      event.preventDefault();
    });
  });
  await page.mouse.down();
  const active = await computedControlStyle(target);
  const box = await target.boundingBox();
  expect(box, `${label} must stay hittable while active`).not.toBeNull();
  await page.mouse.move(0, 0);
  await page.mouse.up();

  expect(
    active.textDecorationLine,
    `${label} active must not copy document-link underline`,
  ).not.toBe('underline');
  expect(active.backgroundColor, `${label} active must not become a status-stamp`).not.toBe(
    statusStampPlateRgb,
  );
  expectThemeToken(active.backgroundColor, `${label} active background`);
  expectThemeToken(active.color, `${label} active color`);
  expectThemeToken(active.borderTopColor, `${label} active border`);
  expectNoticeableShift(rest, active, `${label} active`);
}

test('start Подать заявку is a pointer control with hover and active feedback', async ({
  page,
}) => {
  const response = await page.goto('/start');

  expect(response, 'GET /start must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  const button = page.getByRole('button', { exact: true, name: 'Подать заявку' });
  await expectLiveControlLooksPressable(page, button, 'start submit');
});

test('conductor actions are pointer controls with hover and active feedback', async ({ page }) => {
  const response = await page.goto(CONDUCTOR_PATH);

  expect(response, 'GET /c/{fixture} must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  const advance = page.getByRole('button', { exact: true, name: 'Продвинуть заявку' });
  const reset = page.getByRole('button', { exact: true, name: 'Сбросить' });
  await expectLiveControlLooksPressable(page, advance, 'conductor advance');
  await expectLiveControlLooksPressable(page, reset, 'conductor reset');
});
