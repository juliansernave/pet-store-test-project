import { test, expect } from '../../lib/fixtures';
import { buildPet } from '../../lib/data/pet';
import { routes } from '../../lib/routes';

test('GET /store/inventory returns a status->count map', async ({ api }) => {
  const inventory = (await api.path(routes.store.inventory).getRequest(200)) as Record<string, unknown>;

  expect(inventory).toBeTruthy();
  expect(typeof inventory).toBe('object');
  expect(Array.isArray(inventory)).toBe(false);

  // Every value in the map should be a non-negative integer count.
  for (const [key, value] of Object.entries(inventory)) {
    expect(typeof key).toBe('string');
    expect(typeof value).toBe('number');
    expect(Number.isInteger(value)).toBe(true);
    expect(value as number).toBeGreaterThanOrEqual(0);
  }
});

/* test('INTENTIONAL FAILURE - demo for failing report output', async ({ api }) => {
const inventory = (await api.path(routes.store.inventory).getRequest(200)) as Record<string, number>;
expect(inventory).toHaveProperty('this-key-does-not-exist');
}); */

test('GET /store/inventory does not regress after creating an available pet', async ({ api }) => {
  const baseline = (await api.path(routes.store.inventory).getRequest(200)) as Record<string, number>;
  const baselineAvailable = baseline.available ?? 0;

  await api.path(routes.pet.collection).body(buildPet({ status: 'available' })).postRequest(200);

  const after = (await api.path(routes.store.inventory).getRequest(200)) as Record<string, number>;
  const afterAvailable = after.available ?? 0;

  // The demo's inventory aggregates may be cached; assert it didn't regress rather than strict +1.
  expect(afterAvailable).toBeGreaterThanOrEqual(baselineAvailable);
});
