# Petstore API Test Framework — Project Guide

A presentation-oriented walkthrough of this test project: what it is, how it's
structured, and **why** the key architectural choices were made.

## What this is

An API test suite for the public **Swagger Petstore** demo API
(`https://petstore.swagger.io/v2`), built with **Playwright Test + TypeScript**.
It covers 48 endpoint specs across three resource domains — `pet`, `store`,
`user` — plus a `seed` spec, and runs serially against the shared live server.

## Architecture at a glance

```mermaid
flowchart TD
    subgraph Specs["Test Specs — tests/"]
        Pet["Pet · 22"]:::code
        Store["Store · 10"]:::code
        User["User · 16"]:::code
    end
    Fix["Test Fixtures<br/>api · expect · config"]:::code
    RH["RequestHandler<br/>fluent HTTP client"]:::code
    Data["Data builders<br/>(faker)"]:::code
    Val["Schema validator<br/>(Ajv)"]:::code
    QA["QA Sphere<br/>tms()"]:::code
    Cfg["config.ts"]:::code
    Swg["swagger.json"]:::code
    API["Swagger Petstore API"]:::ext
    Out["Reporting & CI<br/>JSON/HTML · QA Sphere · GitHub Actions"]:::ext

    Specs -->|import| Fix
    Fix -->|api| RH
    RH -->|HTTP| API
    Data -.->|payloads| Specs
    Val -.->|schema check| Specs
    Swg -.->|definitions| Val
    Cfg -.->|url + key| Fix
    QA -.->|tms()| Specs
    RH --> Out

    classDef code fill:#E6F1FB,stroke:#378ADD;
    classDef ext fill:#FAEEDA,stroke:#EF9F27;
```

The flow is one spine — **specs → fixtures → RequestHandler → live API** — with
small focused helpers feeding into it.

## Directory layout

```
lib/                     Shared framework code
  request-handler.ts     Fluent HTTP client + assertions
  fixtures.ts            Playwright fixtures (api, config, expect)
  config.ts              Base URL + API key
  custom-expect.ts       expect.shouldMatchSchema(...)
  schema-validator.ts    Ajv compiled from swagger definitions
  qa-sphere.ts           TMS annotation helper (tms())
  data/                  faker-based payload builders (pet, order, user, image)
tests/
  pet/ store/ user/      Endpoint specs, one behavior per file
  seed.spec.ts           Baseline data setup
  fixtures/petstore-swagger.json   Pinned OpenAPI contract
playwright.config.ts     Runner config, reporters, baseURL
.github/workflows/       CI pipeline
```

## Key design decisions (and why)

- **`RequestHandler` (fluent builder)** — one place to set base URL, inject the
  auth header, assert the status code, and parse the body, so specs stay short
  and declarative (`api.path('/pet').body(p).postRequest(200)`) instead of
  repeating boilerplate.
- **Worker-scoped `apiContext` + per-test `api` fixture** — reuse one HTTP
  context per worker for speed, while each test gets a clean handler with no
  leftover state.
- **`config.ts` as the single source of URL/key** — swap environments or
  servers from one spot; nothing is hardcoded inside specs.
- **faker data builders (`buildPet/Order/User`)** — generate unique, valid
  payloads each run to avoid ID collisions on the shared public server.
- **Ajv schema validator + `expect.shouldMatchSchema`** — assert responses
  against the *real* `swagger.json` definitions, giving contract coverage
  without hand-writing field-by-field checks.
- **Pinned `swagger.json` + `schema:sync` script** — lock the contract locally
  for deterministic validation; refresh on demand rather than fetching live.
- **`qa-sphere.ts` `tms()` helper** — link each test to its TMS case so
  `qas-cli` can upload results to the right place.
- **`sendRaw` escape hatch** — for endpoints where the demo API returns
  ambiguous status codes, the test can branch on the raw response.
- **Serial execution (`workers: 1`, `fullyParallel: false`)** — the public
  server has mutable global state, so running serially prevents cross-test
  interference.
- **CI workflow** — runs on push/PR to main, installs browsers, runs the suite,
  and uploads the HTML report as an artifact.

## Running it

```
npm test              # run everything
npm run test:pet      # one domain (pet | store | user)
npm run report        # open the HTML report
npm run schema:sync   # refresh the pinned swagger.json
npm run test:upload   # run + upload results to QA Sphere
```

## Notes / gotchas

- The Petstore demo server is **public, stateful, and occasionally flaky** — CI
  retries twice; locally there are no retries.
- `TEST_ENV` is read in `config.ts` but currently only logged — env switching is
  scaffolded, not yet wired.

## Next steps

- **Deterministic CI**: stand up a mock from the OpenAPI spec (e.g. Prism) so
  tests don't depend on a flaky shared server.
- **Parallelize** once the API is isolated/mocked (lift `workers: 1`).
- **Wire `TEST_ENV`** to real per-environment config blocks.
- **Type the responses**: add generics to `RequestHandler` methods so
  `postRequest<Pet>(200)` returns a typed body.
- **Externalize QA Sphere creds** via `.env`/CI secrets (currently env vars with
  placeholder defaults).
- **Close coverage gaps**: more auth/negative-path and concurrency cases.
