import { defineConfig, devices } from '@playwright/test';

const webServer = {
  command: 'pnpm --filter @client-portal/web dev',
  url: 'http://localhost:3000',
  reuseExistingServer: true,
  timeout: 120_000,
  stdout: 'pipe' as const,
  stderr: 'pipe' as const,
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // One worker: F31–33 mutate the same З-10046 row (testing.md serial) and share the F24 GET bucket.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(process.env.CI ? {} : { webServer }),
});
