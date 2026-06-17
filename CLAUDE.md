# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                  # run all specs
npm run test:pet          # pet domain only
npm run test:store        # store domain only
npm run test:user         # user domain only
npm run report            # generate + serve Allure report in browser
npm run schema:sync       # refresh pinned swagger.json from live API
npm run test:upload       # run tests + upload results to QA Sphere

# Run a single spec
npx playwright test tests/pet/post-pet.spec.ts

# Filter by tag
npx playwright test --grep @smoke
```

## Environment

Copy `.env.example` to `.env`. Three variables matter:

| Variable | Default |
|---|---|
| `API_URL` | `https://petstore.swagger.io/v2` |
| `API_KEY` | `special-key` |
| `TEST_ENV` | `dev` |

## Architecture

Three layers — specs consume lib, lib talks to the API:

```
specs (tests/)  →  lib/  →  https://petstore.swagger.io/v2
```

**`lib/fixtures.ts`** is the entry point for all specs. It exports `test` (extended with `api` and `config` fixtures) and `expect` (extended with `shouldMatchSchema`). Always import from here, never from `@playwright/test` directly.

**`lib/request-handler.ts`** is a fluent builder over `APIRequestContext`. Every method call returns `this` so chains stay short. After calling a terminal method (`getRequest`, `postRequest`, etc.) the builder resets itself — the same instance can be reused across test steps.

**`lib/routes.ts`** is the single source of truth for endpoint paths. Never write path strings inline in specs. Use `routes.pet.byId(id)`, `routes.store.orders`, etc. The only exception: intentionally malformed paths in negative tests (e.g. `/pet/not-a-number`).

**`lib/data/`** contains faker-based builders (`buildPet()`, `buildOrder()`, `buildUser()`). Always use these for payloads — they generate unique IDs/usernames each run to avoid collisions on the shared public server.

**Schema validation**: `expect(body).shouldMatchSchema('Pet')` validates a response against the pinned `tests/fixtures/petstore-swagger.json`. Call this after every happy-path 2xx before making targeted field assertions.

## Writing specs

Specs live in `tests/<resource>/` grouped by resource domain (`pet`, `store`, `user`), not by HTTP verb or test type. Each file targets one endpoint + scenario. Lifecycle / multi-step tests are named `<resource>-lifecycle.spec.ts`.

Standard import block for every spec:

```ts
import { test, expect } from '../../lib/fixtures';
import { routes } from '../../lib/routes';
import { buildPet } from '../../lib/data/pet'; // or buildOrder / buildUser
```

Two code shapes:

```ts
// Happy path — assert status inline, validate schema
const body = await api.path(routes.pet.collection).body(payload).postRequest(200);
expect(body).shouldMatchSchema('Pet');
expect(body).toMatchObject({ name: payload.name });

// Ambiguous status — branch on raw response
const { status, body } = await api.path(routes.pet.findByStatus).params({ status: 'garbage' }).sendRaw('GET');
expect([200, 400]).toContain(status);
```

For negative-auth tests, chain `.clearAuth()` before the terminal method.

Single-test files: skip `describe`. Multi-test files: one `test.describe` block so the report reads `pet/post-pet-invalid > rejects empty body`.

## Tags

```ts
test('POST /pet creates a pet', { tag: '@smoke' }, async ({ api }) => { ... });
```

- `@smoke` — happy-path + lifecycle; run on every PR
- `@flaky` — quarantined; exclude from blocking CI

## QA Sphere linking

```ts
import { tms } from '../../lib/qa-sphere';

test('POST /pet creates a pet', { ...tms(101), tag: '@smoke' }, async ({ api }) => { ... });
```

Set `QA_SPHERE_TENANT_URL` and `QA_SPHERE_PROJECT_CODE` before running `test:upload`. The source of truth for what to test and which case IDs map to which specs is `specs/petstore-api.plan.md`.

## Constraints

- Tests run serially (`workers: 1`) — the public Petstore server has mutable global state. Do not change this.
- `tests/fixtures/` is excluded from test discovery (`testIgnore`) — put static fixtures there, not spec files.
- Specs must only import from `lib/` and `@faker-js/faker` — never from another spec file.
