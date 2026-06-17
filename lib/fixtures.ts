import { test as base, request as baseRequest, APIRequestContext } from '@playwright/test';
import { RequestHandler, Capture } from './request-handler';
import { config } from './config';

export { expect } from './custom-expect';

export type TestOptions = {
  api: RequestHandler;
  config: typeof config;
};

export type WorkerFixtures = {
  apiContext: APIRequestContext;
};

function safeParse(text: string): unknown {
  if (!text) return '';
  try { return JSON.parse(text); } catch { return text; }
}

export const test = base.extend<TestOptions, WorkerFixtures>({
  apiContext: [
    async ({}, use) => {
      const ctx = await baseRequest.newContext({ baseURL: config.apiUrl });
      await use(ctx);
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],

  api: async ({ apiContext }, use, testInfo) => {
    const captures: Capture[] = [];
    const handler = new RequestHandler(apiContext, config.apiUrl, config.apiKey, captures);
    await use(handler);

    const failed = testInfo.status && testInfo.status !== testInfo.expectedStatus;
    if (!failed) return;

    for (let i = 0; i < captures.length; i++) {
      const c = captures[i];
      const idx = String(i + 1).padStart(2, '0');
      const label = `${idx} ${c.method} ${c.status}`;
      await testInfo.attach(`${label} — request`, {
        body: JSON.stringify({ url: c.url, headers: c.requestHeaders, body: c.requestBody ?? null }, null, 2),
        contentType: 'application/json',
      });
      await testInfo.attach(`${label} — response (${c.duration}ms)`, {
        body: JSON.stringify({ status: c.status, headers: c.responseHeaders, body: safeParse(c.responseBody) }, null, 2),
        contentType: 'application/json',
      });
    }
  },

  config: async ({}, use) => {
    await use(config);
  },
});
