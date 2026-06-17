import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config';

const ALLURE_RESULTS = 'allure-results';

const categories = [
  {
    name: 'Schema mismatches',
    messageRegex: '.*shouldMatchSchema.*|.*does not match schema.*|.*Schema validation failed.*',
  },
  {
    name: 'API 5xx errors',
    messageRegex: '.*expected.*2\\d\\d.*(received|got).*5\\d\\d.*',
  },
  {
    name: 'Auth failures',
    messageRegex: '.*\\b(401|403)\\b.*',
  },
  {
    name: 'Not found (404)',
    messageRegex: '.*\\b404\\b.*',
  },
  {
    name: 'Test defects',
    matchedStatuses: ['broken'],
  },
];

export default async function globalSetup() {
  mkdirSync(ALLURE_RESULTS, { recursive: true });

  const env: Record<string, string> = {
    API_URL: config.apiUrl,
    TEST_ENV: process.env.TEST_ENV ?? 'dev',
    Node: process.version,
    Platform: `${process.platform} ${process.arch}`,
    CI: process.env.CI ? 'true' : 'false',
  };
  if (process.env.GITHUB_SHA) env.Commit = process.env.GITHUB_SHA;
  if (process.env.GITHUB_REF_NAME) env.Branch = process.env.GITHUB_REF_NAME;

  const properties = Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  writeFileSync(join(ALLURE_RESULTS, 'environment.properties'), properties + '\n');

  writeFileSync(
    join(ALLURE_RESULTS, 'categories.json'),
    JSON.stringify(categories, null, 2) + '\n',
  );
}
