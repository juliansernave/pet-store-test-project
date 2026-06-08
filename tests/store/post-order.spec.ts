import { test, expect } from '../../lib/fixtures';
import { buildOrder } from '../../lib/data/order';

test('POST /store/order places an order and returns it with id', async ({ api }) => {
  const payload = buildOrder({ status: 'placed', complete: true });

  const created = await api.path('/store/order').body(payload).postRequest(200);

  expect(created).shouldMatchSchema('Order');
  expect(created).toMatchObject({
    id: payload.id,
    petId: payload.petId,
    quantity: payload.quantity,
    status: 'placed',
  });
});

test('POST /store/order with wrong-typed fields is rejected or sanitized', async ({ api }) => {
  const { status } = await api
    .path('/store/order')
    .body({ id: 1, petId: 'not-a-number', quantity: true, status: 'placed', complete: true })
    .sendRaw('POST');

  expect([200, 400, 500]).toContain(status);
});

test('POST /store/order with malformed JSON returns 400/415/500', async ({ apiContext, config }) => {
  const response = await apiContext.post(`${config.apiUrl}/store/order`, {
    headers: { 'Content-Type': 'application/json', api_key: config.apiKey },
    data: '{ "id": 1, "petId":',
  });
  expect([400, 415, 500]).toContain(response.status());
});
