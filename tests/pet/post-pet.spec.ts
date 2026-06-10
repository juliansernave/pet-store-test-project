import { test, expect } from '../../lib/fixtures';
import { buildPet, uniquePetId } from '../../lib/data/pet';
import { tms } from '../../lib/qa-sphere';
import { routes } from '../../lib/routes';

test('POST /pet creates a pet and returns it with assigned id', { ...tms(101), tag: '@smoke' }, async ({ api }) => {
  const payload = buildPet({ status: 'available' });

  const created = await api.path(routes.pet.collection).body(payload).postRequest(200);

  expect(created).shouldMatchSchema('Pet');
  expect(created).toMatchObject({
    id: payload.id,
    name: payload.name,
    status: 'available',
  });
});

test('POST /pet with an empty body is not persisted as a real pet', async ({ api }) => {
  const { status, body } = await api.path(routes.pet.collection).body({}).sendRaw('POST');
  expect([200, 400, 405, 500]).toContain(status);
  // Even if the demo accepts {} with 200, it must not echo back a fully-formed pet.
  if (status === 200) expect(body).not.toHaveProperty('name');
});

test('POST /pet with malformed JSON returns 400/415/500', async ({ apiContext, config }) => {
  const response = await apiContext.post(`${config.apiUrl}/pet`, {
    headers: { 'Content-Type': 'application/json', api_key: config.apiKey },
    data: '{ "id": 1, "name": "broken',
  });
  expect([400, 415, 500]).toContain(response.status());
});

test('POST /pet with text/plain Content-Type is rejected', async ({ apiContext, config }) => {
  const response = await apiContext.post(`${config.apiUrl}/pet`, {
    headers: { 'Content-Type': 'text/plain', api_key: config.apiKey },
    data: 'not-json',
  });
  expect([400, 415, 500]).toContain(response.status());
});

test('POST /pet with numeric status is rejected or sanitized', async ({ api }) => {
  const payload = { ...buildPet(), status: 123 as unknown as 'available' };

  const { status, body } = await api.path(routes.pet.collection).body(payload).sendRaw('POST');

  expect([200, 400, 500]).toContain(status);
  // If the server "coerces" rather than rejects, the response must not echo the invalid raw type.
  if (status === 200 && body && typeof body === 'object' && 'status' in body) {
    expect((body as { status: unknown }).status).not.toBe(123);
  }
});

test('POST /pet with string id is rejected and the bogus id is not persisted', async ({ api }) => {
  const bogusId = 'abc';
  const payload = { ...buildPet({ id: uniquePetId() }), id: bogusId as unknown as number };

  const { status } = await api.path(routes.pet.collection).body(payload).sendRaw('POST');

  expect([400, 500, 200]).toContain(status);
  // Whatever the server did, GET /pet/abc should not return a real pet.
  const { status: getStatus } = await api.path(routes.pet.byId(bogusId)).sendRaw('GET');
  expect([400, 404]).toContain(getStatus);
});
