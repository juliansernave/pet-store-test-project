import { test, expect } from '../../lib/fixtures';
import { buildOrder } from '../../lib/data/order';
import { routes } from '../../lib/routes';

test('DELETE /store/order/{orderId} removes an order', async ({ api }) => {
  const payload = buildOrder();
  await api.path(routes.store.orders).body(payload).postRequest(200);

  await api.path(routes.store.orderById(payload.id)).deleteRequest(200);

  const followUp = await api.path(routes.store.orderById(payload.id)).getRequest(404);
  expect(followUp).shouldMatchSchema('ApiResponse');
});

test('DELETE /store/order/{orderId} returns 404 for a non-existent id', async ({ api }) => {
  await api.path(routes.store.orderById(99999)).deleteRequest(404);
});
