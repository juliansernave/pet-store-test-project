import { faker } from '@faker-js/faker';

export type PetStatus = 'available' | 'pending' | 'sold';

export type Pet = {
  id: number;
  category: { id: number; name: string };
  name: string;
  photoUrls: string[];
  tags: { id: number; name: string }[];
  status: PetStatus;
};

export function uniquePetId(): number {
  return Number(`${Date.now()}${faker.number.int({ min: 100, max: 999 })}`);
}

export function buildPet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: uniquePetId(),
    category: { id: faker.number.int({ min: 1, max: 100 }), name: faker.animal.type() },
    name: `qa-${faker.animal.dog()}-${faker.string.alphanumeric(6)}`,
    photoUrls: [faker.image.url()],
    tags: [{ id: faker.number.int({ min: 1, max: 1000 }), name: `qa-tag-${faker.string.alphanumeric(6)}` }],
    status: 'available',
    ...overrides,
  };
}
