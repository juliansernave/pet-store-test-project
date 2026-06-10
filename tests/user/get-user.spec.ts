import { test, expect } from '../../lib/fixtures';
import { buildUser, uniqueUsername } from '../../lib/data/user';
import { routes } from '../../lib/routes';

test('GET /user/{username} returns a previously created user', async ({ api }) => {
  const payload = buildUser();
  await api.path(routes.user.collection).body(payload).postRequest(200);

  const fetched = await api.path(routes.user.byUsername(payload.username)).getRequest(200);

  expect(fetched).shouldMatchSchema('User');
  expect(fetched).toMatchObject({
    username: payload.username,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
  });
});

test('GET /user/{username} returns 404 for a non-existent username', async ({ api }) => {
  const ghost = uniqueUsername('ghost');

  const body = await api.path(routes.user.byUsername(ghost)).getRequest(404);

  expect(body).shouldMatchSchema('ApiResponse');
});
