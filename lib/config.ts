const env = process.env.TEST_ENV ?? 'dev';

export const config = {
  apiUrl: process.env.API_URL ?? 'https://petstore.swagger.io/v2',
  apiKey: process.env.API_KEY ?? 'special-key',
};

console.log(`Test env is: ${env}`);
