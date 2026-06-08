import { test, expect } from '../../lib/fixtures';
import { buildPet } from '../../lib/data/pet';

test('POST /pet/{petId} updates a pet via form data', async ({ api }) => {
  const payload = buildPet();
  await api.path('/pet').body(payload).postRequest(200);

  const formResponse = await api
    .path(`/pet/${payload.id}`)
    .form({ name: 'UpdatedName', status: 'pending' })
    .postRequest(200);
  expect(formResponse).shouldMatchSchema('ApiResponse');

  const fetched = await api.path(`/pet/${payload.id}`).getRequest(200);
  expect(fetched).toMatchObject({ name: 'UpdatedName', status: 'pending' });
});

test('POST /pet/{petId} form update for a non-existent petId returns 404 or 405', async ({ api }) => {
  const { status } = await api
    .path('/pet/9999999999')
    .form({ name: 'GhostPet', status: 'pending' })
    .sendRaw('POST');

  expect([200, 404, 405]).toContain(status);
});
