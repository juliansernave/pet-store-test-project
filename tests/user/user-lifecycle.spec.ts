import { test, expect } from '../../lib/fixtures';
import { buildUser } from '../../lib/data/user';
import { faker } from '@faker-js/faker';
import { routes } from '../../lib/routes';

test('User lifecycle: create -> login -> get -> update -> logout -> delete -> verify gone', async ({ api }) => {
  const user = buildUser({ password: 'Passw0rd!' });

  await test.step('create', async () => {
    const created = await api.path(routes.user.collection).body(user).postRequest(200);
    expect(created).shouldMatchSchema('ApiResponse');
  });

  await test.step('login', async () => {
    await api.path(routes.user.login).params({ username: user.username, password: user.password }).getRequest(200);
  });

  await test.step('get', async () => {
    const fetched = await api.path(routes.user.byUsername(user.username)).getRequest(200);
    expect(fetched).toMatchObject({ username: user.username, email: user.email });
  });

  const newEmail = faker.internet.email({ firstName: 'updated' }).toLowerCase();
  await test.step('update', async () => {
    await api.path(routes.user.byUsername(user.username)).body({ ...user, email: newEmail }).putRequest(200);
    const refetched = await api.path(routes.user.byUsername(user.username)).getRequest(200);
    expect(refetched).toMatchObject({ email: newEmail });
  });

  await test.step('logout', async () => {
    await api.path(routes.user.logout).getRequest(200);
  });

  await test.step('delete', async () => {
    await api.path(routes.user.byUsername(user.username)).deleteRequest(200);
  });

  await test.step('verify gone', async () => {
    await api.path(routes.user.byUsername(user.username)).getRequest(404);
  });
});
