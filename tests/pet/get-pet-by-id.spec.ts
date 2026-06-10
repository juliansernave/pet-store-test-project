import { test, expect } from '../../lib/fixtures';
import { buildPet } from '../../lib/data/pet';
import { routes } from '../../lib/routes';

test('GET /pet/{petId} returns a previously created pet', async ({ api }) => {
  const payload = buildPet();
  await api.path(routes.pet.collection).body(payload).postRequest(200);

  const fetched = await api.path(routes.pet.byId(payload.id)).getRequest(200);

  expect(fetched).shouldMatchSchema('Pet');
  expect(fetched).toMatchObject({
    id: payload.id,
    name: payload.name,
    status: payload.status,
  });
});

test('GET /pet/{petId} returns 404 for a non-existent id', async ({ api }) => {
  const missingId = 9_999_999_999;

  const body = await api.path(routes.pet.byId(missingId)).getRequest(404);

  expect(body).shouldMatchSchema('ApiResponse');
});

test('GET /pet/{petId} rejects an invalid id format', async ({ api }) => {
  // Swagger doc says 400, the demo server returns 404 - both are acceptable per the plan.
  const { status } = await api.path('/pet/not-a-number').sendRaw('GET');
  expect([400, 404]).toContain(status);
});
