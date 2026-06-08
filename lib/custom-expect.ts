import { expect as baseExpect } from '@playwright/test';
import { validateAgainstSchema } from './schema-validator';

export const expect = baseExpect.extend({
  shouldMatchSchema(received: unknown, definitionName: string) {
    const { valid, errors } = validateAgainstSchema(received, definitionName);
    return {
      pass: valid,
      name: 'shouldMatchSchema',
      message: () =>
        valid
          ? `Body matched "${definitionName}" schema (unexpected pass).`
          : `Body did not match "${definitionName}" schema:\n  - ${errors}\nBody:\n${JSON.stringify(received, null, 2)}`,
    };
  },
});
