import { test, expect } from '../../lib/fixtures';
import { buildPet } from '../../lib/data/pet';
import { tinyPng } from '../../lib/data/image';
import { routes } from '../../lib/routes';

test('POST /pet/{petId}/uploadImage uploads an image and returns ApiResponse', async ({ api }) => {
  const payload = buildPet();
  await api.path(routes.pet.collection).body(payload).postRequest(200);

  const fileName = `qa-${Date.now()}.png`;
  const response = (await api
    .path(routes.pet.uploadImage(payload.id))
    .multipart({
      additionalMetadata: 'qa-upload',
      file: { name: fileName, mimeType: 'image/png', buffer: tinyPng() },
    })
    .postRequest(200)) as { code: number; type: string; message: string };

  expect(response).shouldMatchSchema('ApiResponse');
  expect(response.message).toContain(fileName);
});

test('POST /pet/{petId}/uploadImage for a non-existent petId returns ApiResponse or 404', async ({ api }) => {
  const { status, body } = await api
    .path(routes.pet.uploadImage(9999999999))
    .multipart({
      additionalMetadata: 'qa-upload-ghost',
      file: { name: 'ghost.png', mimeType: 'image/png', buffer: tinyPng() },
    })
    .sendRaw('POST');

  expect([200, 404]).toContain(status);
  if (status === 200) {
    expect(body).shouldMatchSchema('ApiResponse');
  }
});
