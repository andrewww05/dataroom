# Project Overview

**dataroom** is a virtual Data Room: one authenticated owner signs in, uploads documents, organises
them in arbitrarily nested folders, reads them in the browser, and hands the other side a
revocable read-only link — public or restricted to a named grantee. It is a pnpm + Turborepo
monorepo with a NestJS 11 API (`apps/api`), a Vite 8 + React 19 client (`apps/web`), and one typed
contract package both sides import (`packages/shared`), so the API and the UI cannot drift on a
field name. It is built to **run locally and be deployed anywhere**: `docker compose up -d` starts
Postgres and MinIO, `pnpm dev` starts everything else, and no host, port, origin or bucket name is
hardcoded anywhere in the code.

## Repository Structure

- `apps/api/` — NestJS 11 REST API on `http://localhost:3000/api`; Prisma 7 + Postgres, Passport
  JWT, S3-compatible blob storage.
  - `src/auth/` — sign-up/sign-in/me, argon2 hashing, the JWT strategy, and the global
    `JwtAuthGuard` with its `@Public()` escape.
  - `src/prisma/` — `PrismaService` (pg driver adapter), the module, and a bare `test-client.ts`
    for schema tests.
  - `src/storage/` — the S3 client; creates the private `dataroom` bucket on boot if missing.
  - `src/http/` — the one error envelope: `ApiException`, `ErrorCode`, `ApiExceptionFilter`.
  - `src/config/env.ts` — the environment contract; boot fails naming every missing variable.
  - `src/documents/` — **placeholder** in-memory listing that slice 4 deletes; do not build on it.
  - `src/generated/prisma/` — Prisma client output. Generated, gitignored, never hand-edited.
  - `prisma/` — `schema.prisma` plus migrations, including two hand-written partial unique indexes.
  - `test/` — supertest e2e specs under their own Jest config.
- `apps/web/` — Vite 8 + React 19 client on `http://localhost:5173`; proxies `/api` to the API in
  dev, so the browser stays on one origin.
- `packages/shared/` — `@dataroom/shared`: every type crossing the API/web boundary, compiled to
  CommonJS so Nest can `require` it.
- `docs/` — the plan and the single source of truth for requirements, field names, endpoints, error
  codes, the env contract and the scaling answers.
- `openspec/` — spec-driven change workflow: `specs/` is what shipped, `changes/` is in flight,
  `changes/archive/` is done.
- `.claude/` — OpenSpec skills and slash commands for agents working in this repo.
- `docker-compose.yml` — local infrastructure only: `postgres:17` and `minio/minio`. The apps run
  on the host.

## Build & Development Commands

Run from the repo root — Turbo fans each task out across the workspace and caches results.

```bash
# First run, from a clean clone
pnpm install
cp apps/api/.env.example apps/api/.env   # required; its defaults work as-is
docker compose up -d                     # Postgres + MinIO
pnpm --filter @dataroom/api db:migrate    # apply migrations
pnpm dev                                  # API watch + Vite + shared tsc --watch
```

```bash
pnpm build       # shared → api → web, in dependency order
pnpm test        # Jest (api) and Vitest (web)
pnpm typecheck   # tsc --noEmit in every package
pnpm lint        # ESLint flat config in every package
pnpm verify      # typecheck + lint + test + openspec validate --all
pnpm format      # Prettier over the repo
pnpm format:check
pnpm clean       # removes build output
```

Scope a task to one package with `--filter`:

```bash
pnpm dev  --filter @dataroom/api
pnpm test --filter @dataroom/web
```

Package-only scripts (run from that directory, or via `--filter`):

```bash
# apps/api
pnpm test:e2e       # jest --config ./test/jest-e2e.json
pnpm start:debug    # nest start --debug --watch
pnpm start          # node dist/main — runs the built output
pnpm db:generate    # prisma generate (also runs on postinstall)
pnpm db:migrate     # prisma migrate dev
pnpm db:reset       # prisma migrate reset

# apps/web
pnpm preview
pnpm test:watch
```

Requires Node `>=22.12.0` and pnpm `10.14.0` (both pinned in the root `package.json`).
MinIO console: `http://localhost:9001` (`minioadmin` / `minioadmin`).

> TODO: no deploy command or pipeline exists — the plan deliberately picks no host. See
> [docs/03 § Running it somewhere else](docs/03-domain-and-api.md#running-it-somewhere-else) for
> the contract a host must satisfy.

## Code Style & Conventions

- **Formatting** — Prettier ([.prettierrc.json](.prettierrc.json)): semicolons, single quotes,
  trailing commas `all`, `printWidth` 100, `arrowParens` always. 2-space indent, LF, final newline
  ([.editorconfig](.editorconfig)).
- **TypeScript** — [tsconfig.base.json](tsconfig.base.json) is strict and adds `noImplicitOverride`,
  `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`. Target ES2023. The API is
  CommonJS with decorator metadata; the web app is ESNext with `verbatimModuleSyntax`.
- **Lint** — ESLint 10 flat config. [eslint.config.mjs](eslint.config.mjs) exports `base` (JS +
  typescript-eslint recommended + `eslint-config-prettier`) and `ignores`; each package extends it.
  Unused names are allowed only with a `_` prefix. `**/src/generated/**` is never linted.
- **Naming** — files are kebab-case with a role suffix: `*.controller.ts`, `*.service.ts`,
  `*.module.ts`, `*.guard.ts`, `*.decorator.ts`, `dto/*.dto.ts`, `dto/*.query.ts`, `*.spec.ts`,
  `*.e2e-spec.ts`. Prisma models are PascalCase singular; enums are `SCREAMING_CASE` members.
- **Comments explain the decision, not the mechanism.** The existing code says _why_ a thing is the
  way it is and cites the requirement ID (`FR-AUTH-030`, `BR-050`). Match that density and habit.
- **Contract types live in `packages/shared`** and are never duplicated in an app.
- **Commit messages** — Conventional Commits with a scope, then a body that explains the decision:

  ```text
  feat(api): local infra, Prisma schema and the two database invariants

  Slice 1 of docs/05-build-order.md. <what and why in prose>

  - <one bullet per notable decision, citing FR-/BR- IDs>

  <closing notes on implementation surprises worth recording>
  ```

## Architecture Notes

```mermaid
flowchart LR
  B[Browser] -->|"/api via Vite proxy"| W[apps/web<br/>Vite 8 + React 19]
  W -->|fetch| G[API_PREFIX = /api]
  G --> GU[JwtAuthGuard<br/>APP_GUARD — closed by default]
  GU --> VP[ValidationPipe<br/>whitelist + forbidNonWhitelisted]
  VP --> C[Controllers<br/>auth · health · documents]
  C --> S[Services]
  S --> P[PrismaService<br/>@prisma/adapter-pg]
  S --> ST[StorageService<br/>@aws-sdk/client-s3]
  P --> PG[(Postgres 17)]
  ST --> M[(S3-compatible bucket<br/>MinIO locally)]
  C -.->|throws| F[ApiExceptionFilter<br/>APP_FILTER]
  F -->|"{ code, message, details? }"| B
  SH[["packages/shared<br/>@dataroom/shared"]] -.-> W
  SH -.-> G
```

How it fits together:

1. **One HTTP surface, configured in one place.** [bootstrap.ts](apps/api/src/bootstrap.ts) applies
   the global prefix and the `ValidationPipe`; both `main.ts` and the tests call it, so a test never
   exercises a narrower app than the server runs.
2. **Closed by default.** `JwtAuthGuard` is registered as `APP_GUARD`, so a route added without
   `@Public()` refuses an anonymous caller. Handlers read the caller through `@CurrentPrincipal()`,
   never from the `Authorization` header.
3. **One failure shape.** `ApiExceptionFilter` is registered as `APP_FILTER` with a bare `@Catch()`,
   so nothing escapes in Nest's `{ statusCode, error }` shape. A code is added to `ErrorCode` only
   once a route can produce it.
4. **One table does folders and files.** A `Node` with no blob is a folder; one with
   `storageKey`/`sizeBytes`/`mimeType` is a file. `dataRoomId` is the scope column and leads every
   index, including the listing index `(dataRoomId, parentId, type, name, id)` that _is_ the sort
   order and covers the keyset cursor's tiebreak.
5. **Prisma 7 has no Rust engine.** The runtime client gets `DATABASE_URL` through
   `@prisma/adapter-pg`; the CLI reads `DIRECT_URL` from [prisma.config.ts](apps/api/prisma.config.ts),
   because migrations cannot run through a connection pooler. `$connect()` is lazy with an adapter,
   so `PrismaService` follows it with `SELECT 1` to actually prove reach.
6. **Boot fails loudly.** `validateEnv` runs before any provider is constructed and names every
   missing variable at once; Prisma and S3 failures name the variable or endpoint at fault.
7. **One storage code path.** MinIO locally, any S3-compatible store elsewhere — only the endpoint,
   credentials and path-style flag differ. The bucket is private and created on boot when missing.

## Testing Strategy

| Layer                  | Tool                               | Config                                            | Run                                    |
| ---------------------- | ---------------------------------- | ------------------------------------------------- | -------------------------------------- |
| API unit + integration | Jest 30 + ts-jest                  | [jest.config.js](apps/api/jest.config.js)         | `pnpm test --filter @dataroom/api`     |
| API e2e (supertest)    | Jest 30                            | [test/jest-e2e.json](apps/api/test/jest-e2e.json) | `pnpm --filter @dataroom/api test:e2e` |
| Web                    | Vitest 4 + jsdom + Testing Library | [vite.config.ts](apps/web/vite.config.ts)         | `pnpm test --filter @dataroom/web`     |

- API specs are `src/**/*.spec.ts` with `rootDir: src`; `setupFiles: ['dotenv/config']` loads
  `apps/api/.env`, because the schema and integration tests talk to the compose Postgres.
  **They need `docker compose up -d` plus `pnpm --filter @dataroom/api db:migrate` to pass.**
- Build the whole app under test with [createTestApp()](apps/api/src/testing/test-app.ts), not a
  hand-assembled module subset — half of what these tests assert _is_ the wiring (the global guard,
  the pipe, the filter). Use [createTestClient()](apps/api/src/prisma/test-client.ts) for tests that
  assert on database behaviour: constraints, cascades, query plans.
- Test the failure path of every rule a change touches, not only the happy path. Existing examples:
  `schema-invariants.spec.ts` (BR-020, FR-AUTH-050), `listing-index.spec.ts` (the query plan),
  `jwt-auth.guard.spec.ts` (expired, forged, `alg: none`, orphaned tokens).
- Before reporting any change complete, run `pnpm typecheck && pnpm lint && pnpm test` and paste
  failures verbatim. Or use the single command: `pnpm verify`.
- **Spec ↔ Test mapping** — run `scripts/verify-spec-coverage.sh` (or its `--change <name>` form)
  to see which spec scenario IDs (`FR-*`, `BR-*`) have matching test references and which do not.
  Both agents have a verify skill (`openspec-verify` for Antigravity, `/opsx:verify` for Claude
  Code) that chains structural validation, build checks and this mapping into one advisory report.

> TODO: no CI configuration exists in this repo (`.github/` is absent), so all of the above runs
> locally only.

## Security & Compliance

- **Secrets** — `.env` and `.env.*` are gitignored except `.env.example`, which is committed and
  whose defaults match the compose stack. Never commit a real secret; never read a secret value
  into a log line, an error message or a test snapshot.
- **`JWT_SECRET` has no default in code** (BR-100). A process without it aborts at boot with the
  variable named, rather than signing tokens with a value published in this repository. Use 32+
  random bytes per environment: `openssl rand -base64 32`.
- **Passwords** are argon2 hashes. Sign-in verifies against a decoy hash on an unknown email, so a
  wrong password and an unknown account return byte-identical `401 INVALID_CREDENTIALS` bodies.
- **Authorization is server-side.** Hiding a button is not access control: every handler resolves a
  principal and asks it for a capability (`read` / `write`), never for the header, the token or the
  role name (BR-010, BR-070). A node the principal has no claim on returns `404 NOT_FOUND`, never
  `403`.
- **No detail leaks in a 500.** The catch-all response carries a generic message and no stack, SQL,
  file path or library name; the cause goes to the log instead.
- **Input validation** — the global `ValidationPipe` runs `whitelist`, `transform` and
  `forbidNonWhitelisted`, so an unknown field is a `400 VALIDATION_FAILED` naming it and DTOs are
  the only source of truth for request shape.
- **Blobs are private.** No ACL is sent on bucket creation; every read is a presigned URL signed
  against `S3_ENDPOINT`, which must be browser-reachable and never a container-internal hostname.
- **Native build** — `argon2` compiles a native addon and is listed in `onlyBuiltDependencies` in
  [pnpm-workspace.yaml](pnpm-workspace.yaml); without it pnpm skips the build silently and the
  import fails at boot. `@node-rs/argon2` is the prebuilt drop-in if a platform refuses to build it.

> TODO: no dependency scanning, SAST or secret-scanning is configured.
> TODO: no LICENSE file exists; licensing terms are unstated.

## Agent Guardrails

Never modify:

1. `apps/api/src/generated/**` — Prisma client output, regenerated by `pnpm db:generate`. It is
   gitignored, lint-ignored and Prettier-ignored. Change `prisma/schema.prisma` instead.
2. `apps/api/prisma/migrations/**` for a migration that has already been applied — add a new one.
   `migration_lock.toml` is never edited by hand.
3. `apps/api/.env` or any `.env*` other than `.env.example`.
4. `dist/`, `.turbo/`, `coverage/`, `pnpm-lock.yaml` by hand (use `pnpm` to change the lockfile).
5. `openspec/changes/archive/**` — a shipped change is a record, not a draft.

Rules of engagement:

1. **`docs/` is the source of truth, with one owner per fact.** Limits and rules live in
   [02-requirements.md](docs/02-requirements.md); field names, endpoints, error codes, the env
   contract and the scaling answers in [03-domain-and-api.md](docs/03-domain-and-api.md). Cite the
   stable IDs (`FR-<AREA>-<nnn>`, `BR-<nnn>`). Never redefine a requirement inline — change it in
   `docs/` and say so.
2. **Do not break a `BR-*` invariant without an explicit decision from the user.** They are listed
   in full in [openspec/config.yaml](openspec/config.yaml) and
   [02 § Business rules](docs/02-requirements.md#business-rules).
3. **Nothing ships disabled or half-implemented (BR-100).** Remove a feature from the UI rather than
   greying it out. And nothing is wired to one machine: no host, port, origin or bucket name is
   hardcoded — each is an env var with a local default.
4. **Tier discipline.** A Core change never pulls in Polish or Extra-credit work. If it looks like it
   must, say so in the proposal rather than doing it.
5. **Stay inside the change's capability.** If work needs a file outside it, pause and say so
   instead of widening the change.
6. **Use the OpenSpec workflow** for a new slice: propose → apply → sync → archive, via the skills
   in [.claude/skills/](.claude/skills/). Archive only after a change has been verified by hand in
   the running app, not merely by a green test run.
7. **Commits are authored under the user's name only** — never add a `Co-Authored-By` trailer. Do
   not commit or push unless asked.
8. **Required before reporting completion:** `pnpm typecheck && pnpm lint && pnpm test`, with any
   failure pasted verbatim.

> TODO: no CODEOWNERS, review policy or rate limit is defined for automated agents.

## Extensibility Hooks

- **Global HTTP behaviour** — add to [configureApp()](apps/api/src/bootstrap.ts) so tests and
  `main.ts` share it. App-wide providers go through `APP_GUARD` / `APP_FILTER` in
  [app.module.ts](apps/api/src/app.module.ts).
- **Opening a route** — `@Public()` from [public.decorator.ts](apps/api/src/auth/public.decorator.ts).
  Everything else is closed. Reading the caller: `@CurrentPrincipal()`.
- **New principal kinds** — extend the `Principal` union in
  [principal.ts](apps/api/src/auth/principal.ts) and the capability map it feeds; `Share.role`
  already ships with `EDITOR` in the enum so a second role is a map entry, not a migration (BR-070).
- **New error codes** — add a member to `ErrorCode` plus its row in
  [api.exception.ts](apps/api/src/http/api.exception.ts), and the matching row to
  [docs/03 § Errors](docs/03-domain-and-api.md#errors). Add a code only once a route can produce it.
- **Cross-boundary types** — export from `packages/shared/src/` and re-export in `index.ts`. Turbo's
  `dependsOn: ["^build"]` guarantees it is built before anything that imports it.
- **Storage** — [StorageService](apps/api/src/storage/storage.service.ts) exposes `client` and
  `bucket`; object keys will be `{dataRoomId}/{nodeId}`.
- **Environment variables** — the full contract is
  [docs/03 § Configuration](docs/03-domain-and-api.md#configuration). Add a variable to `REQUIRED`
  in [env.ts](apps/api/src/config/env.ts) only when there is no sensible default, and always
  document it in [.env.example](apps/api/.env.example).

| Variable                          | Local default                                            | Used for                                         |
| --------------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| `PORT`                            | `3000`                                                   | Nest listener                                    |
| `CORS_ORIGIN`                     | `http://localhost:5173`                                  | Comma-separated allowed origins                  |
| `DATABASE_URL`                    | `postgresql://dataroom:dataroom@localhost:5432/dataroom` | Prisma at runtime                                |
| `DIRECT_URL`                      | same as above                                            | Prisma CLI — must be unpooled                    |
| `JWT_SECRET`                      | none in code — boot fails                                | Token signing                                    |
| `JWT_EXPIRES_IN`                  | `7d`                                                     | Token lifetime; no refresh token exists          |
| `S3_ENDPOINT`                     | `http://localhost:9000`                                  | Must be browser-reachable                        |
| `S3_REGION`                       | `us-east-1`                                              | SDK signing                                      |
| `S3_BUCKET`                       | `dataroom`                                               | Blob bucket                                      |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | `minioadmin` / `minioadmin`                              | Store credentials                                |
| `S3_FORCE_PATH_STYLE`             | `true`                                                   | `true` for MinIO, `false` for most hosted stores |
| `VITE_API_PROXY_TARGET`           | `http://localhost:3000`                                  | Vite dev proxy target (web)                      |

Planned variables not yet read by code: `MAX_FILE_BYTES`, `MAX_VERSIONS`, `PUBLIC_BASE_URL`,
`SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD`, `VITE_API_URL`. There are no feature flags — tiering is
done by slice, not by flag.

## Further Reading

- [README.md](README.md) — layout, commands, live endpoints, configuration
- [docs/README.md](docs/README.md) — the spec index and the five ground rules
- [docs/01-scope.md](docs/01-scope.md) — tiers, what was cut, traceability to the brief
- [docs/02-requirements.md](docs/02-requirements.md) — numbered requirements and business rules
- [docs/03-domain-and-api.md](docs/03-domain-and-api.md) — ERD, model, storage, REST surface,
  errors, configuration, "How it scales"
- [docs/04-ux.md](docs/04-ux.md) — screens, interactions, keyboard, component inventory, state
  ownership
- [docs/05-build-order.md](docs/05-build-order.md) — slices in build order with the cut line
- [openspec/config.yaml](openspec/config.yaml) — project context, invariants and artifact rules for
  spec-driven changes
- [openspec/specs/](openspec/specs/) — capability specs for what has shipped
- [openspec/changes/](openspec/changes/) — changes in flight, and `archive/` for completed ones
