import { test, expect } from '../../lib/fixtures';
import { buildPet, type Pet } from '../../lib/data/pet';
import { routes } from '../../lib/routes';

test('GET /pet/findByStatus?status=available returns pets filtered to that status', async ({ api }) => {
  const payload = buildPet({ status: 'available' });
  await api.path(routes.pet.collection).body(payload).postRequest(200);

  const results = (await api
    .path(routes.pet.findByStatus)
    .params({ status: 'available' })
    .getRequest(200)) as Pet[];

  expect(Array.isArray(results)).toBe(true);
  expect(results.length).toBeGreaterThan(0);
  for (const pet of results) expect(pet.status).toBe('available');
  expect(results.some((p) => p.id === payload.id)).toBe(true);
});

test('GET /pet/findByStatus with an unknown status returns 400 or 200 with empty array', async ({ api }) => {
  const { status, body } = await api
    .path(routes.pet.findByStatus)
    .params({ status: 'notARealStatus' })
    .sendRaw('GET');

  expect([200, 400]).toContain(status);
  if (status === 200) {
    expect(Array.isArray(body)).toBe(true);
    expect((body as unknown[]).length).toBe(0);
  }
});

test('GET /pet/findByStatus with no status param returns 400 or empty result', async ({ api }) => {
  const { status, body } = await api.path(routes.pet.findByStatus).sendRaw('GET');
  expect([200, 400]).toContain(status);
  if (status === 200) expect(Array.isArray(body)).toBe(true);
});

test('GET /pet/findByStatus supports multiple status values', async ({ api }) => {
  const results = (await api
    .path(routes.pet.findByStatus)
    .params({ status: ['available', 'pending', 'sold'] })
    .getRequest(200)) as Pet[];

  expect(Array.isArray(results)).toBe(true);
  const allowed = new Set(['available', 'pending', 'sold']);
  for (const pet of results) expect(allowed.has(pet.status)).toBe(true);
});
