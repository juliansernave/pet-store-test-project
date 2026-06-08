import { test, expect } from '../../lib/fixtures';
import { buildOrder } from '../../lib/data/order';
import { tms } from '../../lib/qa-sphere';

test('Store order lifecycle: place -> get -> delete -> verify gone', { ...tms(210), tag: '@smoke' }, async ({ api }) => {
  const payload = buildOrder();

  await test.step('place', async () => {
    const created = await api.path('/store/order').body(payload).postRequest(200);
    expect(created).shouldMatchSchema('Order');
    expect(created).toMatchObject({ id: payload.id, petId: payload.petId });
  });

  await test.step('get', async () => {
    const fetched = await api.path(`/store/order/${payload.id}`).getRequest(200);
    expect(fetched).toMatchObject({ id: payload.id, petId: payload.petId });
  });

  await test.step('delete', async () => {
    await api.path(`/store/order/${payload.id}`).deleteRequest(200);
  });

  await test.step('verify gone', async () => {
    await api.path(`/store/order/${payload.id}`).getRequest(404);
  });
});
