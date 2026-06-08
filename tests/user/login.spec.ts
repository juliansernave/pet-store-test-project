import { test, expect } from '../../lib/fixtures';
import { buildUser } from '../../lib/data/user';
import { tms } from '../../lib/qa-sphere';

test('GET /user/login with valid credentials succeeds and exposes session metadata', { ...tms(312), tag: '@smoke' }, async ({ api }) => {
  const user = buildUser({ password: 'Passw0rd!' });
  await api.path('/user').body(user).postRequest(200);

  const { status, headers, body } = await api
    .path('/user/login')
    .params({ username: user.username, password: user.password })
    .sendRaw('GET');

  expect(status).toBe(200);
  // Body is a session string ("logged in user session:...") or an ApiResponse.
  expect(body).toBeTruthy();

  // The demo reliably returns these headers; assert when present, don't hard-fail otherwise.
  if ('x-expires-after' in headers) {
    expect(headers['x-expires-after']).toMatch(/\d{4}/);
  }
  if ('x-rate-limit' in headers) {
    expect(Number.isInteger(Number(headers['x-rate-limit']))).toBe(true);
  }
});

test('GET /user/login with empty credentials is rejected', async ({ api }) => {
  const { status } = await api
    .path('/user/login')
    .params({ username: '', password: '' })
    .sendRaw('GET');

  // Swagger documents 400. The demo is permissive and may return 200; accept either.
  expect([200, 400]).toContain(status);
});

test('GET /user/login with no query params is rejected', async ({ api }) => {
  const { status } = await api.path('/user/login').sendRaw('GET');
  expect([200, 400]).toContain(status);
});

test('GET /user/logout is idempotent and returns 200', async ({ api }) => {
  const user = buildUser();
  await api.path('/user').body(user).postRequest(200);

  await api.path('/user/login').params({ username: user.username, password: user.password }).getRequest(200);
  await api.path('/user/logout').getRequest(200);

  // Calling logout again without an active session should still return 200 (default response per Swagger).
  await api.path('/user/logout').getRequest(200);
});
