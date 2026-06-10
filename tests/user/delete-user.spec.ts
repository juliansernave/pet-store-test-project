import { test, expect } from '../../lib/fixtures';
import { buildUser, uniqueUsername } from '../../lib/data/user';
import { routes } from '../../lib/routes';

test('DELETE /user/{username} removes a user', async ({ api }) => {
  const payload = buildUser();
  await api.path(routes.user.collection).body(payload).postRequest(200);

  await api.path(routes.user.byUsername(payload.username)).deleteRequest(200);

  const followUp = await api.path(routes.user.byUsername(payload.username)).getRequest(404);
  expect(followUp).shouldMatchSchema('ApiResponse');
});

test('DELETE /user/{username} returns 404 for a non-existent user', async ({ api }) => {
  await api.path(routes.user.byUsername(uniqueUsername('ghost'))).deleteRequest(404);
});
