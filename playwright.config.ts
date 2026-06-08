import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/fixtures/**'],
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'reports/playwright-report.json' }],
  ],
  use: {
    baseURL: process.env.API_URL ?? 'https://petstore.swagger.io/v2',
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
  projects: [
    {
      name: 'api',
      testMatch: /.*\.spec\.ts/,
    },
  ],
});
