import { test, expect } from '../../lib/fixtures';
import { buildOrder } from '../../lib/data/order';

test('GET /store/order/{orderId} returns a previously placed order', async ({ api }) => {
  const payload = buildOrder();
  await api.path('/store/order').body(payload).postRequest(200);

  const fetched = await api.path(`/store/order/${payload.id}`).getRequest(200);

  expect(fetched).shouldMatchSchema('Order');
  expect(fetched).toMatchObject({
    id: payload.id,
    petId: payload.petId,
    quantity: payload.quantity,
    status: payload.status,
  });
});

test('GET /store/order/{orderId} returns 404 for a non-existent id', async ({ api }) => {
  const body = await api.path('/store/order/99999').getRequest(404);
  expect(body).shouldMatchSchema('ApiResponse');
});

test('GET /store/order/0 (below documented range 1..10) is rejected', async ({ api }) => {
  const { status } = await api.path('/store/order/0').sendRaw('GET');
  expect([400, 404]).toContain(status);
});

test('GET /store/order/-1 is rejected', async ({ api }) => {
  const { status } = await api.path('/store/order/-1').sendRaw('GET');
  expect([400, 404]).toContain(status);
});

test('GET /store/order/abc (non-integer id) is rejected', async ({ api }) => {
  const { status } = await api.path('/store/order/abc').sendRaw('GET');
  expect([400, 404]).toContain(status);
});
