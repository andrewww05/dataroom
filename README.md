# dataroom

A Data Room: one authenticated owner signs in, uploads documents, organises them in an arbitrarily deep tree of folders, and shares read-only access via a public link or to a named grantee. Built as a monorepo (Vite + React, NestJS, Postgres, S3-compatible storage) that runs locally via Docker Compose and can be deployed anywhere, with no hardcoded hosts or origins.

## Setup from a clean clone

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # required; its defaults work as-is
docker compose up -d                     # Postgres + MinIO
pnpm --filter @dataroom/api db:migrate    # apply migrations
pnpm dev                                  # API watch + Vite + shared tsc --watch
```

## Demo account

You can seed the database with a demo account and sample folder structure:

```bash
pnpm --filter @dataroom/api db:seed
```

- **Email:** `demo@example.com`
- **Password:** `demodemo1`

## Design decisions

| Decision | Trade-off |
| -------- | --------- |
| One table does folders and files | Listing, moving, deleting, and name collisions are identical for both; but files have nullable `sizeBytes`/`mimeType`/`storageKey` columns. |
| `DataRoom` as the scope column | Fast index scans for listings and permissions; queries must carry `dataRoomId` on every operation. |
| Upload streams through the API | Server-side validation of sniffed MIME types before writing to storage; requires a persistent backend process (no serverless functions for the API). |
| S3 API everywhere | One storage code path whether local (MinIO) or hosted; requires the `S3_ENDPOINT` to be reachable by the browser for presigned URLs. |
| Keyset pagination | Page 500 is as fast as Page 1; no total counts are provided in directory listings. |

## ERD

```mermaid
erDiagram
  User ||--o{ DataRoom : owns
  DataRoom ||--o{ Node : contains
  Node ||--o{ Node : "parent of"
  Node ||--o{ Share : "granted on"
  Node ||--o{ FileVersion : "versions (extra credit)"

  User {
    uuid id PK
    text email UK "lowercased on write"
    text passwordHash "argon2"
  }
  DataRoom {
    uuid id PK
    uuid ownerId FK
    varchar name
  }
  Node {
    uuid id PK
    uuid dataRoomId FK
    uuid parentId FK "null on the room root"
    enum type "FOLDER | FILE"
    varchar name "unique per (dataRoomId, parentId), case-insensitive"
    bigint sizeBytes "files only"
    text mimeType "files only, sniffed"
    text storageKey "files only, the S3 object key"
  }
  Share {
    uuid id PK
    uuid nodeId FK
    uuid dataRoomId FK "denormalised, so scope checks need no join"
    text token UK "32 random bytes, base64url"
    enum mode "PUBLIC | RESTRICTED"
    enum role "VIEWER today, EDITOR later"
    text granteeEmail "set iff RESTRICTED"
    timestamp expiresAt "nullable"
  }
  FileVersion {
    uuid id PK
    uuid nodeId FK
    int version "1-based, dense"
    text storageKey
    bigint sizeBytes
  }
```

## How it scales

### Total size and item count of a folder including its whole subtree

One recursive CTE, seeded at the folder and walking `"parentId"` downward. It is depth-independent and costs one index scan per level, so it is `O(nodes in the subtree)`: microseconds for a normal folder, and a real cost only at the root of a very large room. It is called on demand, not per row of a listing, and cached.

When that stops being fast enough, in order of what I would reach for:
1. **Cached aggregates on the folder row** updated in the same transaction as the write that changed them (ancestor depth is capped at 32).
2. **A materialised path** (`ltree` or `path` text column), making subtree reads index-only prefix scans.
3. **A closure table** if arbitrary ancestor questions become common.

### One Data Room holding 100,000 files

Listing never depends on room size, because a listing is one folder's children and is paged:
- **Pagination is keyset, not offset.** `(type, name, id) > cursor` walks the index directly; page 500 costs what page 1 costs.
- **The listing index is the sort order**, avoiding a sort node.
- **No total counts in listings.**
- **The tree loads lazily.**
- **Search** is `ILIKE '%q%'` against a trigram index (`gin_trgm_ops`).
- **`dataRoomId` leads every index**, so a second room, or a hundred, never widens the range.

Two things at 100,000 files that would have to change:
- **Deleting a huge subtree:** The cascade delete is fast; issuing `DeleteObjects` for 100,000 keys is not. A `PendingBlobDeletion` table swept by a background job would be needed.
- **Upload throughput:** Every byte goes through one API process. Presigned direct-to-bucket `PUT`s fix it, moving validation to a post-upload check.

### Per-user roles (viewer/editor) without remodeling

Already in the schema: `Share.role` is a `ShareRole` defaulting to `VIEWER`. Handlers ask the principal for a capability (`read` or `write`), never for the token or the role name. `EDITOR` is one entry in a capability map plus letting the DTO accept it. Room-wide roles and per-node roles for named persons need no remodelling.

## Running it somewhere else

**This plan deploys nothing and picks no host.** The deliverable runs locally from a clean clone and carries no vendor in its code, so whoever wants it on a server chooses where. The contract a host must satisfy:

| Piece      | What it needs                     | Why                                                                                                                                                                                                |
| ---------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web` | Anything that serves static files | It is a static Vite build. `VITE_API_URL` points at the API origin, so the dev-only `/api` proxy has no counterpart to go wrong.                                                                   |
| `apps/api` | A **persistent** Node process     | Uploads stream through Nest so validation runs on sniffed bytes. A serverless function caps the request body far below 100 MB, so the API cannot be one without giving up server-side validation. |
| Postgres   | Any Postgres 17                   | `DATABASE_URL` at runtime, `DIRECT_URL` for `prisma migrate deploy` — the same split works whether or not a pooler is in front.                                                                    |
| Blobs      | Any S3-compatible bucket, private | The MinIO code path is the only code path; every read is a presigned URL.                                                                                                                          |

## AI usage

AI was used throughout this project, and the split of work was deliberate: one tool for thinking, another for typing.

| Stage                                        | Tool                                          | What it did                                                                                                                                                                    |
| -------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Design and decomposition (`docs/`)           | **Claude Code**                               | I designed the system with Claude as a thinking partner: scope and tiers, numbered requirements and business rules, the domain model and REST surface, the UX, and the build order. Everything in `docs/` came out of that dialogue and is the source of truth the rest of the work is held to. |
| Specs per slice (`openspec/`)                | **Claude Code**                               | Slice by slice down `docs/05-build-order.md`, I iterated with Claude to turn each slice into an OpenSpec change — proposal, design notes, delta specs with `FR-*`/`BR-*` scenario IDs, and a task list — then synced and archived it once it shipped.                                          |
| Implementation                               | **Gemini** (via **Antigravity**, free tier)   | The code itself was written with Gemini in Antigravity, driven by the specs above. The whole implementation was done on the free tier.                                                                                                                                                        |
| Validation                                   | Both, plus hand-verification                  | Each change ships `scripts/validate/<change-name>.sh`, which exercises its `FR-*`/`BR-*` scenarios against the running app (real Postgres, real MinIO, real HTTP), on top of `pnpm verify`. Nothing was archived on a green unit-test run alone.                                               |

What that means in practice: the architecture, the requirement IDs and the slicing are mine, arrived at with Claude; the keystrokes are largely Gemini's; and every slice had to pass its own runtime validation script before it counted as done.

## Configuration

| Variable                                 | Local default                                                     | Elsewhere                                              | Used for                                                                                         |
| ---------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `PORT`                                   | `3000`                                                            | whatever the host injects                              | Nest listener                                                                                    |
| `CORS_ORIGIN`                            | `http://localhost:5173`                                           | the origin serving the web app                         | Browser access to the API                                                                        |
| `DATABASE_URL`                           | `postgresql://dataroom:dataroom@localhost:5432/dataroom`          | the Postgres URL, pooled if the provider offers one    | Prisma at runtime, via the pg driver adapter                                                     |
| `DIRECT_URL`                             | same as above                                                     | an **unpooled** Postgres URL                           | The Prisma CLI (`migrate deploy`), which cannot run through a pooler; read in `prisma.config.ts` |
| `JWT_SECRET`                             | `dev-only-not-a-secret` in `.env.example`, **no default in code** | 32+ random bytes, per environment                      | Token signing. A process without it refuses to start (BR-100)                                    |
| `JWT_EXPIRES_IN`                         | `7d`                                                              | `7d`                                                   | FR-AUTH-020                                                                                      |
| `S3_ENDPOINT`                            | `http://localhost:9000`                                           | the bucket's S3 endpoint, reachable **by the browser** | MinIO or any S3-compatible store                                                                 |
| `S3_REGION`                              | `us-east-1`                                                       | whatever the store wants (`auto` for some)             | SDK signing                                                                                      |
| `S3_BUCKET`                              | `dataroom`                                                        | `dataroom`                                             | Blob bucket                                                                                      |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY`        | `minioadmin` / `minioadmin`                                       | the store's key pair                                   | Credentials                                                                                      |
| `S3_FORCE_PATH_STYLE`                    | `true`                                                            | `true` for MinIO, `false` for most hosted stores       | Addressing style                                                                                 |
| `MAX_FILE_BYTES`                         | `104857600`                                                       | `104857600`                                            | BR-040                                                                                           |
| `MAX_VERSIONS`                           | `20`                                                              | `20`                                                   | BR-080 (extra credit)                                                                            |
| `PUBLIC_BASE_URL`                        | `http://localhost:5173`                                           | the origin serving the web app                         | Building `/s/{token}` links                                                                      |
| `SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD` | unset                                                             | set once, if a demo account is wanted                  | FR-OPS-030's demo account                                                                        |
| `VITE_API_URL` (web)                     | unset — the Vite proxy handles `/api`                             | `https://<api-host>/api`                               | Where the browser sends requests                                                                 |

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

- `apps/api`: `pnpm test:e2e`, `pnpm start:debug`, `pnpm start` (runs the built output), `pnpm db:seed`
- `apps/web`: `pnpm preview`, `pnpm test:watch`
