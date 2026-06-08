// QA Sphere test-case annotation helper.
//
// Wires each Playwright test to its corresponding QA Sphere test case so that
// `qas-cli playwright-json-upload` lands results on the right case.
//
// Usage:
//   import { tms } from '../../lib/qa-sphere';
//   test('POST /pet creates a pet', tms(101), async ({ api }) => { ... });
//
// Configure tenant + project once via env vars (e.g. in .env or CI):
//   QA_SPHERE_TENANT_URL=https://acme.eu1.qasphere.com
//   QA_SPHERE_PROJECT_CODE=PETS

const TENANT = process.env.QA_SPHERE_TENANT_URL ?? 'https://example.qasphere.com';
const PROJECT = process.env.QA_SPHERE_PROJECT_CODE ?? 'PETS';

export type TmsAnnotation = {
  annotation: { type: 'test case'; description: string };
};

/** Link a test to a QA Sphere test case by numeric id. */
export function tms(caseId: number): TmsAnnotation {
  return {
    annotation: {
      type: 'test case',
      description: `${TENANT}/project/${PROJECT}/tcase/${caseId}`,
    },
  };
}
