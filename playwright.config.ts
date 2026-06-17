import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/fixtures/**'],
  globalSetup: './lib/global-setup.ts',
  globalTeardown: './lib/global-teardown.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'reports/playwright-report.json' }],
    ['allure-playwright', { resultsDir: 'allure-results', detail: true, suiteTitle: false }],
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
