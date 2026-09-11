import { expect, test, type Response } from '@playwright/test';

const quoteCabinetPath = '/r/seed-z10043-quote-kuznetsov';

const capabilityHeaderTokens = {
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-robots-tag': 'noindex',
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
} as const;

function headerMap(response: Response): Map<string, string> {
  return new Map(
    Object.entries(response.headers()).map(([name, value]) => [name.toLowerCase(), value]),
  );
}

function expectCapabilityHeaders(response: Response | null, path: string) {
  expect(response, `GET ${path} must receive a response from :3000`).toBeTruthy();
  expect(response?.ok()).toBe(true);
  expect(response?.headers()['content-type'] ?? '').toMatch(/text\/html/);

  const headers = headerMap(response!);
  for (const [name, token] of Object.entries(capabilityHeaderTokens)) {
    expect(headers.get(name) ?? '', `${path} ${name}`).toMatch(new RegExp(token, 'i'));
  }
}

test('index HTML carries capability cache and embedding headers', async ({ page }) => {
  const response = await page.goto('/');
  expectCapabilityHeaders(response, '/');
});

test('quote cabinet HTML carries capability cache and embedding headers', async ({ page }) => {
  const response = await page.goto(quoteCabinetPath);
  expectCapabilityHeaders(response, quoteCabinetPath);
});
