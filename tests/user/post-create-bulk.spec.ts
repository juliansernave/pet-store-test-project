import { test, expect } from '../../lib/fixtures';
import { buildUser, buildUsers, type User } from '../../lib/data/user';

test('POST /user/createWithArray creates multiple users and each is retrievable', async ({ api }) => {
  const payload = buildUsers(3);

  const response = await api.path('/user/createWithArray').body(payload).postRequest(200);
  expect(response).shouldMatchSchema('ApiResponse');

  for (const user of payload) {
    const fetched = (await api.path(`/user/${user.username}`).getRequest(200)) as User;
    expect(fetched).shouldMatchSchema('User');
    expect(fetched).toMatchObject({ username: user.username, email: user.email });
  }
});

test('POST /user/createWithArray with a non-array body is rejected', async ({ api }) => {
  const singleUser = buildUser();

  const { status } = await api.path('/user/createWithArray').body(singleUser).sendRaw('POST');

  // Server may reject (400/500) or silently accept the malformed input — the latter
  // must not result in a retrievable user under the supplied username.
  expect([200, 400, 500]).toContain(status);
  if (status === 200) {
    const { status: getStatus } = await api.path(`/user/${singleUser.username}`).sendRaw('GET');
    expect(getStatus).toBe(404);
  }
});

test('POST /user/createWithList creates multiple users and each is retrievable', async ({ api }) => {
  const payload = buildUsers(2);

  const response = await api.path('/user/createWithList').body(payload).postRequest(200);
  expect(response).shouldMatchSchema('ApiResponse');

  for (const user of payload) {
    await api.path(`/user/${user.username}`).getRequest(200);
  }
});
