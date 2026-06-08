# Testing Conventions

Defaults for this Playwright + TypeScript API test suite. Mirror these in every new spec so reports stay readable and TMS uploads stay clean.

## Stack

- Playwright `@playwright/test` (API-only — no browser projects).
- TypeScript, strict mode, CommonJS module resolution.
- Schema validation via `ajv` + `ajv-formats` against `tests/fixtures/petstore-swagger.json`.
- Test data via `@faker-js/faker` builders in `lib/data/`.

## File naming

- **`kebab-case.spec.ts`** under `tests/<resource>/`.
- One endpoint + scenario per file. File name reflects the assertion, not the verb alone — `get-pet-not-found.spec.ts`, not `get-pet-2.spec.ts`.
- A negative-case file should mention the negation (`-invalid`, `-not-found`, `-missing`, `-wrong-types`).
- Lifecycle / multi-step round-trip tests are named `<resource>-lifecycle.spec.ts`.

## Folder layout

```
lib/
  request-handler.ts     # fluent wrapper over APIRequestContext
  fixtures.ts            # test.extend + worker-scoped apiContext, exposes `test` and `expect`
  custom-expect.ts       # adds `shouldMatchSchema(definitionName)`
  schema-validator.ts    # ajv setup against swagger definitions
  config.ts              # apiUrl, apiKey, env switch
  qa-sphere.ts           # tms(caseId) annotation helper
  data/                  # typed builders: buildPet, buildOrder, buildUser, tinyPng, ...
tests/
  fixtures/              # swagger snapshot + any other static fixtures (excluded from discovery)
  pet/                   # Pet endpoints (plan section 1)
  store/                 # Store endpoints (plan section 2)
  user/                  # User endpoints (plan section 3)
specs/
  petstore-api.plan.md   # source of truth for what's being tested
```

Principles:
- Group by **resource** (the plan's top-level sections), not by HTTP verb or test type.
- Anything reusable across specs lives in `lib/`; anything static lives in `tests/fixtures/`.
- Specs only import from `lib/` and `@faker-js/faker` — never reach into another spec.

## Test titles

- Present-tense, observable behavior. Start with the endpoint when the spec is endpoint-scoped.
- Good: `'POST /pet creates a pet and returns it with assigned id'`
- Good: `'GET /pet/{petId} returns 404 for a non-existent id'`
- Good: `'Pet lifecycle: create -> read -> update -> form-update -> delete -> verify gone'`
- Weak: `'pet test'`, `'works'`, `'test case 5'`

One assertion theme per test. If the title needs `and`, split it.

## Grouping (`describe`)

- Single-test files: skip `describe`. The file path already conveys the group.
- Multi-test files (e.g. several negative cases for one endpoint): wrap them in one `test.describe('<Endpoint or behavior>', () => { ... })` so the report reads `pet/post-pet-invalid-body > rejects empty body`.

## Tags

Optional, but recommended for CI filtering:

- `@smoke` — happy-path + lifecycle tests. Run on every PR.
- `@regression` — everything (implicit; no tag needed).
- `@flaky` — quarantined; excluded from blocking CI.

```ts
test('POST /pet creates a pet', { tag: '@smoke' }, async ({ api }) => { ... });
```

Filter on CI with `npx playwright test --grep @smoke`.

## Test writing patterns

Two primary code shapes — pick the one that matches the assertion:

**Single expected status — most cases:**
```ts
const created = await api.path('/pet').body(payload).postRequest(200);
expect(created).shouldMatchSchema('Pet');
expect(created).toMatchObject({ id: payload.id, name: payload.name });
```

**Multiple acceptable statuses or response branching — for Petstore's loose endpoints:**
```ts
const { status, body } = await api.path('/pet/findByStatus').params({ status: 'garbage' }).sendRaw('GET');
expect([200, 400]).toContain(status);
if (status === 200) expect(Array.isArray(body)).toBe(true);
```

Always:
- Validate the response body with `expect(body).shouldMatchSchema('<Definition>')` after a happy-path 2xx.
- Make targeted field assertions only on what the test created or modified — the schema covers the rest.
- Use builders from `lib/data/` for payloads. Each call returns unique ids/usernames so tests don't collide on the shared demo server.
- Use the framework default `api_key` header. For negative-auth cases, call `.clearAuth()`.

## QA Sphere linking

Tests link to QA Sphere cases via the `playwright-json-upload` annotation path. The JSON reporter is wired in `playwright.config.ts`; the helper lives in `lib/qa-sphere.ts`.

### Annotate a test

```ts
import { tms } from '../../lib/qa-sphere';

test('POST /pet creates a pet', { ...tms(101), tag: '@smoke' }, async ({ api }) => {
  // ...
});
```

`tms(caseId)` returns `{ annotation: { type: 'test case', description: '<tenant>/project/<code>/tcase/<id>' } }`. Spread it into the options object alongside any tags.

### Tenant / project config

Set these in your shell, `.env`, or CI secret store before running `test:upload`:

```bash
QA_SPHERE_TENANT_URL=https://acme.eu1.qasphere.com   # your actual QA Sphere tenant
QA_SPHERE_PROJECT_CODE=PETS                          # your actual project code
```

If unset, the helper falls back to `https://example.qasphere.com` / `PETS` — fine for local syntax checks, useless for real uploads.

### Upload

```bash
npm run test:upload
# == playwright test && npx qas-cli playwright-json-upload --attachments reports/playwright-report.json
```

You'll need `qas-cli` installed and authenticated first per QA Sphere's CLI docs. By default the upload fails on any unmarked test — that's the signal to add a `tms(...)` annotation rather than `--force` past it.

### Exemplar specs already annotated

These three show the pattern; copy them when annotating the rest:

- `tests/pet/post-pet-create.spec.ts` — case 101 (happy path)
- `tests/store/order-lifecycle.spec.ts` — case 210 (multi-step lifecycle)
- `tests/user/login.spec.ts` — case 312 (header inspection)

### Migration

The remaining 46 specs are unannotated. Add `tms(<caseId>)` per spec as real QA Sphere case IDs are assigned. Until then, `--ignore-unmatched` on `qas-cli` will summarize the gap instead of failing the upload — useful while linking gradually.

## When in doubt

The plan at `specs/petstore-api.plan.md` is the source of truth for what to test. The skill that produced these conventions is `qa-testing-toolkit:test-project-conventions`; the API patterns underneath are from `qa-testing-toolkit:playwright-api-test-patterns`.
