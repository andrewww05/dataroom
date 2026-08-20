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
cp apps/api/.env.example apps/api/.env   # optional; defaults work as-is
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

It currently holds the document contract (`DocumentSummary`, `DOCUMENT_STATUSES`), the response envelopes, the `API_PREFIX` constant that the API mounts and the Vite proxy matches, and `formatBytes` — so the API and UI cannot drift on formatting.

## API endpoints

| Method | Path                 | Notes                                                    |
| ------ | -------------------- | -------------------------------------------------------- |
| GET    | `/api/health`        | Liveness + uptime                                        |
| GET    | `/api/documents`     | Optional `?status=draft\|in_review\|published\|archived` |
| GET    | `/api/documents/:id` | 404 on unknown id                                        |

Documents are served from an in-memory seed in `apps/api/src/documents/documents.service.ts` — swap it for a real repository when persistence lands.

## Configuration

| Variable                | Where           | Default                 |
| ----------------------- | --------------- | ----------------------- |
| `PORT`                  | `apps/api/.env` | `3000`                  |
| `CORS_ORIGIN`           | `apps/api/.env` | `http://localhost:5173` |
| `VITE_API_PROXY_TARGET` | web dev env     | `http://localhost:3000` |

A global `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`) rejects unknown or invalid query fields, so DTOs are the single source of truth for request shape.
