import { expect, test } from '@playwright/test';

test('keyboard Tab on the first index request row shows a visible focus outline', async ({
  page,
}) => {
  const response = await page.goto('/');

  expect(response, 'GET / must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);

  const firstRow = page.getByRole('link', { name: /З-10041/ });
  await expect(firstRow).toBeVisible();

  for (let press = 0; press < 20; press += 1) {
    await page.keyboard.press('Tab');
    if (await firstRow.evaluate((node) => node === document.activeElement)) {
      break;
    }
  }

  await expect(firstRow).toBeFocused();

  const outline = await firstRow.evaluate((node) => {
    const target = document.querySelector(':focus-visible') ?? document.activeElement;
    if (!(target instanceof HTMLElement) || target !== node) {
      return { outlineStyle: 'none', outlineWidth: '0px' };
    }

    const style = getComputedStyle(target);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });

  expect(outline.outlineStyle, 'focused request row must keep a visible outline').not.toBe('none');
  expect(
    Number.parseFloat(outline.outlineWidth),
    'focus outline width must be at least 2px',
  ).toBeGreaterThanOrEqual(2);
});
