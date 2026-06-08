const env = process.env.TEST_ENV ?? 'dev';

export const config = {
  apiUrl: 'https://petstore.swagger.io/v2',
  apiKey: 'special-key',
};

console.log(`Test env is: ${env}`);
