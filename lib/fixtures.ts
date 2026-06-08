import { test as base, request as baseRequest, APIRequestContext } from '@playwright/test';
import { RequestHandler } from './request-handler';
import { config } from './config';

export { expect } from './custom-expect';

export type TestOptions = {
  api: RequestHandler;
  config: typeof config;
};

export type WorkerFixtures = {
  apiContext: APIRequestContext;
};

export const test = base.extend<TestOptions, WorkerFixtures>({
  apiContext: [
    async ({}, use) => {
      const ctx = await baseRequest.newContext({ baseURL: config.apiUrl });
      await use(ctx);
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],

  api: async ({ apiContext }, use) => {
    const handler = new RequestHandler(apiContext, config.apiUrl, config.apiKey);
    await use(handler);
  },

  config: async ({}, use) => {
    await use(config);
  },
});
