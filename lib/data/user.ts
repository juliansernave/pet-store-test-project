import { faker } from '@faker-js/faker';

export type User = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userStatus: number;
};

export function uniqueUsername(prefix = 'qa'): string {
  return `${prefix}-${Date.now()}-${faker.string.alphanumeric(6).toLowerCase()}`;
}

export function buildUser(overrides: Partial<User> = {}): User {
  const username = overrides.username ?? uniqueUsername();
  return {
    id: faker.number.int({ min: 1_000_000, max: 9_999_999 }),
    username,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email({ firstName: username }).toLowerCase(),
    password: 'Passw0rd!',
    phone: faker.phone.number(),
    userStatus: 1,
    ...overrides,
  };
}

export function buildUsers(count: number, overrides: Partial<User> = {}): User[] {
  return Array.from({ length: count }, () => buildUser(overrides));
}
