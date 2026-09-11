import { expect, test } from '@playwright/test';

test('layout header on / shows ПК «Нордщит» as HTML', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'GET / must receive a response from :3000').toBeTruthy();
  expect(response?.ok()).toBe(true);
  expect(response?.headers()['content-type'] ?? '').toMatch(/text\/html/);

  const banner = page.getByRole('banner');
  await expect(banner.getByText('ПК «Нордщит»', { exact: true })).toBeVisible();
  await expect(banner.getByRole('heading', { name: 'ПК «Нордщит»' })).toHaveCount(0);

  await expect(page.getByRole('heading', { level: 1, name: 'Ссылки для показа' })).toBeVisible();
  expect(await page.title()).toContain('Ссылки для показа — ПК «Нордщит»');
});
