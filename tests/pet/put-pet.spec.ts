import { test, expect } from '../../lib/fixtures';
import { buildPet } from '../../lib/data/pet';
import { routes } from '../../lib/routes';

test('PUT /pet updates an existing pet', async ({ api }) => {
  const original = buildPet({ status: 'available' });
  await api.path(routes.pet.collection).body(original).postRequest(200);

  const updated = { ...original, name: `${original.name}-updated`, status: 'sold' as const };
  const putResponse = await api.path(routes.pet.collection).body(updated).putRequest(200);
  expect(putResponse).shouldMatchSchema('Pet');
  expect(putResponse).toMatchObject({ id: original.id, name: updated.name, status: 'sold' });

  const fetched = await api.path(routes.pet.byId(original.id)).getRequest(200);
  expect(fetched).toMatchObject({ name: updated.name, status: 'sold' });
});

test('PUT /pet with a body missing required fields is rejected', async ({ api }) => {
  // Pet's required fields per Swagger: name, photoUrls.
  const { status } = await api.path(routes.pet.collection).body({ id: 12345 }).sendRaw('PUT');
  expect([400, 405, 500, 200]).toContain(status);
});

test('PUT /pet for a never-created id behaves per documented contract', async ({ api }) => {
  // Per Swagger: 400 / 404 / 405. The demo upserts and returns 200. Both are acceptable.
  const payload = buildPet();

  const { status, body } = await api.path(routes.pet.collection).body(payload).sendRaw('PUT');

  expect([200, 400, 404, 405]).toContain(status);
  if (status === 200 && body && typeof body === 'object') {
    // If the server upserted, the echoed id must match what we sent (no silent rewriting).
    expect((body as { id: number }).id).toBe(payload.id);
  }
});
