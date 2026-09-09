import { expect, test } from '@playwright/test';

test('layout header on / shows ПК «Нордщит» as HTML', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'GET / must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);
  expect(response?.headers()['content-type'] ?? '').toMatch(/text\/html/);

  await expect(
    page.getByRole('banner').getByRole('heading', { name: 'ПК «Нордщит»' }),
  ).toBeVisible();
});
