import { faker } from '@faker-js/faker';

export type OrderStatus = 'placed' | 'approved' | 'delivered';

export type Order = {
  id: number;
  petId: number;
  quantity: number;
  shipDate: string;
  status: OrderStatus;
  complete: boolean;
};

export function uniqueOrderId(): number {
  // Unique enough to avoid cross-test collisions on the shared demo server,
  // small enough to stay within int64 comfortably.
  return Number(`${Date.now() % 1_000_000}${faker.number.int({ min: 100, max: 999 })}`);
}

export function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: uniqueOrderId(),
    petId: Number(`${Date.now()}${faker.number.int({ min: 10, max: 99 })}`),
    quantity: faker.number.int({ min: 1, max: 5 }),
    shipDate: new Date().toISOString(),
    status: 'placed',
    complete: true,
    ...overrides,
  };
}
