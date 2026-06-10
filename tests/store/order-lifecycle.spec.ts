import { test, expect } from '../../lib/fixtures';
import { buildOrder } from '../../lib/data/order';
import { tms } from '../../lib/qa-sphere';
import { routes } from '../../lib/routes';

test('Store order lifecycle: place -> get -> delete -> verify gone', { ...tms(210), tag: '@smoke' }, async ({ api }) => {
  const payload = buildOrder();

  await test.step('place', async () => {
    const created = await api.path(routes.store.orders).body(payload).postRequest(200);
    expect(created).shouldMatchSchema('Order');
    expect(created).toMatchObject({ id: payload.id, petId: payload.petId });
  });

  await test.step('get', async () => {
    const fetched = await api.path(routes.store.orderById(payload.id)).getRequest(200);
    expect(fetched).toMatchObject({ id: payload.id, petId: payload.petId });
  });

  await test.step('delete', async () => {
    await api.path(routes.store.orderById(payload.id)).deleteRequest(200);
  });

  await test.step('verify gone', async () => {
    await api.path(routes.store.orderById(payload.id)).getRequest(404);
  });
});
