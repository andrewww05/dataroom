# dataroom

Turborepo monorepo with a Vite + React frontend and a NestJS backend, sharing one typed contract package.

## Layout

```
apps/
  api/       NestJS 11 REST API        → http://localhost:3000/api
  web/       Vite 8 + React 19 client  → http://localhost:5173
packages/
  shared/    Types + helpers both sides import (@dataroom/shared)
```

`apps/web` proxies `/api` to `apps/api` in dev, so the browser stays on one origin and never hits CORS.

## Getting started

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # required; its defaults work as-is
pnpm dev
```

`pnpm dev` starts all three in parallel: the API in watch mode, the Vite dev server, and `tsc --watch` on the shared package so type changes propagate immediately.

## Commands

Run from the repo root — Turbo fans each one out across the workspace and caches results.

| Command          | What it does                                   |
| ---------------- | ---------------------------------------------- |
| `pnpm dev`       | API + web dev servers + shared package watcher |
| `pnpm build`     | Builds shared → api → web in dependency order  |
| `pnpm test`      | Jest (api) and Vitest (web)                    |
| `pnpm typecheck` | `tsc --noEmit` in every package                |
| `pnpm lint`      | ESLint flat config in every package            |
| `pnpm format`    | Prettier over the repo                         |
| `pnpm clean`     | Removes build output                           |

Scope a task to one package with `--filter`:

```bash
pnpm dev  --filter @dataroom/api
pnpm test --filter @dataroom/web
```

Package-only scripts (run from that directory, or via `--filter`):

- `apps/api`: `pnpm test:e2e`, `pnpm start:debug`, `pnpm start` (runs the built output)
- `apps/web`: `pnpm preview`, `pnpm test:watch`

## The shared package

`@dataroom/shared` compiles to CommonJS so Nest can `require` it directly; Vite pre-bundles it to ESM via `optimizeDeps.include`. Both apps depend on it with `workspace:*`, and `turbo.json` declares `dependsOn: ["^build"]`, so it is always built before anything that imports it.

It currently holds the auth contract (`AuthUser`, `DataRoom`, `AuthResponse`, `ApiError`), the document contract (`DocumentSummary`, `DOCUMENT_STATUSES`), the response envelopes, the `API_PREFIX` constant that the API mounts and the Vite proxy matches, and `formatBytes` — so the API and UI cannot drift on formatting.

## API endpoints

Every route needs `Authorization: Bearer <jwt>` unless the table says otherwise. A request without
one is `401 UNAUTHENTICATED`, and that is the default for any route added later.

| Method | Path                 | Notes                                                                |
| ------ | -------------------- | -------------------------------------------------------------------- |
| POST   | `/api/auth/signup`   | Public. `{ email, password }` → `201 { token, user, dataRoom }`      |
| POST   | `/api/auth/login`    | Public. `{ email, password }` → `200 { token, user, dataRoom }`      |
| GET    | `/api/auth/me`       | The caller, their Data Room and its root folder id                   |
| GET    | `/api/health`        | Public. Liveness + uptime                                            |
| GET    | `/api/documents`     | Public, temporarily. `?status=draft\|in_review\|published\|archived` |
| GET    | `/api/documents/:id` | 404 on unknown id                                                    |

Tokens last 7 days (`JWT_EXPIRES_IN`) and there is no refresh token: signing out is dropping the
token client-side.

Failures all share one envelope — `{ code, message, details? }` — where `code` is stable and
switched on by the client.

Documents are served from an in-memory seed in `apps/api/src/documents/documents.service.ts`. The
listing stays public only so the placeholder page keeps loading; both it and the module behind it go
when the real shell lands.

## Configuration

The full contract is [docs/03 § Configuration](./docs/03-domain-and-api.md#configuration); the
variables most often changed by hand:

| Variable                | Where           | Default                 |
| ----------------------- | --------------- | ----------------------- |
| `PORT`                  | `apps/api/.env` | `3000`                  |
| `CORS_ORIGIN`           | `apps/api/.env` | `http://localhost:5173` |
| `JWT_SECRET`            | `apps/api/.env` | none — boot fails       |
| `JWT_EXPIRES_IN`        | `apps/api/.env` | `7d`                    |
| `VITE_API_PROXY_TARGET` | web dev env     | `http://localhost:3000` |

`JWT_SECRET` deliberately has no fallback in code: a deployment that forgets it fails at boot with
the variable named, rather than signing tokens with a value published in this repository.

A global `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`) rejects unknown or invalid query fields, so DTOs are the single source of truth for request shape.
