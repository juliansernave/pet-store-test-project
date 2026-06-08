import { test, expect } from '../../lib/fixtures';
import { buildPet } from '../../lib/data/pet';

test('Pet lifecycle: create -> read -> update -> form-update -> delete -> verify gone', async ({ api }) => {
  const payload = buildPet({ status: 'available' });

  await test.step('create', async () => {
    const created = await api.path('/pet').body(payload).postRequest(200);
    expect(created).shouldMatchSchema('Pet');
    expect(created).toMatchObject({ id: payload.id, name: payload.name });
  });

  await test.step('read', async () => {
    const fetched = await api.path(`/pet/${payload.id}`).getRequest(200);
    expect(fetched).toMatchObject({ id: payload.id, name: payload.name });
  });

  await test.step('update via PUT', async () => {
    const updated = await api
      .path('/pet')
      .body({ ...payload, name: `${payload.name}-v2`, status: 'pending' })
      .putRequest(200);
    expect(updated).toMatchObject({ id: payload.id, name: `${payload.name}-v2`, status: 'pending' });
  });

  await test.step('update via form POST', async () => {
    const formResponse = await api
      .path(`/pet/${payload.id}`)
      .form({ name: `${payload.name}-final`, status: 'sold' })
      .postRequest(200);
    expect(formResponse).shouldMatchSchema('ApiResponse');
  });

  await test.step('delete', async () => {
    await api.path(`/pet/${payload.id}`).deleteRequest(200);
  });

  await test.step('verify gone', async () => {
    await api.path(`/pet/${payload.id}`).getRequest(404);
  });
});
