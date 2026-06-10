import { test, expect } from '../../lib/fixtures';
import { buildPet } from '../../lib/data/pet';
import { routes } from '../../lib/routes';

test('DELETE /pet/{petId} removes a pet', async ({ api }) => {
  const payload = buildPet();
  await api.path(routes.pet.collection).body(payload).postRequest(200);

  await api.path(routes.pet.byId(payload.id)).deleteRequest(200);

  const followUp = await api.path(routes.pet.byId(payload.id)).getRequest(404);
  expect(followUp).shouldMatchSchema('ApiResponse');
});

test('DELETE /pet/{petId} returns 404 for a non-existent pet', async ({ api }) => {
  await api.path(routes.pet.byId(9999999999999)).deleteRequest(404);
});

test('DELETE /pet/{petId} with an invalid id format is rejected', async ({ api }) => {
  const { status } = await api.path('/pet/not-an-int').sendRaw('DELETE');
  expect([400, 404]).toContain(status);
});
