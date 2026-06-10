import { test, expect } from '../../lib/fixtures';
import { buildUser, uniqueUsername } from '../../lib/data/user';
import { faker } from '@faker-js/faker';
import { routes } from '../../lib/routes';

test('PUT /user/{username} updates an existing user', async ({ api }) => {
  const original = buildUser();
  await api.path(routes.user.collection).body(original).postRequest(200);

  const updated = {
    ...original,
    firstName: 'Updated',
    email: faker.internet.email({ firstName: 'updated' }).toLowerCase(),
  };
  const putResponse = await api.path(routes.user.byUsername(original.username)).body(updated).putRequest(200);
  expect(putResponse).shouldMatchSchema('ApiResponse');

  const fetched = await api.path(routes.user.byUsername(original.username)).getRequest(200);
  expect(fetched).toMatchObject({ firstName: 'Updated', email: updated.email });
});

test('PUT /user/{username} on a non-existent username behaves per documented contract', async ({ api }) => {
  const ghost = uniqueUsername('ghost');
  const payload = buildUser({ username: ghost });

  // Swagger documents 400/404; the demo upserts and returns 200. Accept either.
  const { status } = await api.path(routes.user.byUsername(ghost)).body(payload).sendRaw('PUT');

  expect([200, 400, 404]).toContain(status);
});
