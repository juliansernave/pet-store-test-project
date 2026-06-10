import { test, expect } from '../../lib/fixtures';
import { buildUser } from '../../lib/data/user';
import { routes } from '../../lib/routes';

test('POST /user creates a single user', async ({ api }) => {
  const payload = buildUser();

  const response = (await api.path(routes.user.collection).body(payload).postRequest(200)) as {
    code: number;
    type: string;
    message: string;
  };

  expect(response).shouldMatchSchema('ApiResponse');
  // The demo echoes the created user's id as the message string.
  expect(response.message).toBe(String(payload.id));
});

test('POST /user with malformed JSON returns 400/415/500', async ({ apiContext, config }) => {
  const response = await apiContext.post(`${config.apiUrl}/user`, {
    headers: { 'Content-Type': 'application/json', api_key: config.apiKey },
    data: '{ "id": 1, "username":',
  });
  expect([400, 415, 500]).toContain(response.status());
});

test('POST /user with text/plain Content-Type is rejected', async ({ apiContext, config }) => {
  const response = await apiContext.post(`${config.apiUrl}/user`, {
    headers: { 'Content-Type': 'text/plain', api_key: config.apiKey },
    data: 'username=qa',
  });
  expect([400, 415, 500]).toContain(response.status());
});
