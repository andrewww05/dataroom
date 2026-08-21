## Why

Slice 1 of [docs/05-build-order.md](../../../docs/05-build-order.md). The repo has no database, no
object store and no schema — `apps/api` serves an in-memory `documents` seed. Every slice after this
one reads or writes `User`, `DataRoom`, `Node` or `Share`, so the model and the local infra it runs
on come first. Two invariants are cheapest to buy here, as database constraints rather than as
service code written four times later: names unique per folder (BR-020) and exactly one root node
per Data Room (FR-AUTH-050).

## What Changes

- `docker-compose.yml` running `postgres:17` and `minio/minio`, and nothing else. Apps stay on the
  host under `pnpm dev`.
- Prisma in `apps/api`: `User`, `DataRoom`, `Node` (one table for folders and files), `Share`, and
  the `NodeType` / `ShareMode` / `ShareRole` enums, per [docs/03 § Model](../../../docs/03-domain-and-api.md).
- One initial migration carrying the listing index `(dataRoomId, parentId, type, name, id)` plus two
  hand-written partial unique indexes Prisma cannot express: `node_name_unique` (BR-020,
  case-insensitive) and `node_single_root`.
- A `PrismaModule` / `PrismaService` and an `S3Module` that creates the private `dataroom` bucket on
  boot if it is missing, so local setup has no manual step.
- `apps/api/.env.example` gains `DATABASE_URL`, `DIRECT_URL` and the `S3_*` variables from
  [docs/03 § Configuration](../../../docs/03-domain-and-api.md#configuration).
- `Share.role` ships now, defaulted to `VIEWER` — the schema half of the brief's viewer/editor
  scaling answer (BR-070).

Delivers: BR-020 (constraint), BR-070 (`role` column), FR-AUTH-050 (one-root invariant),
FR-NAV-030 (listing index), FR-ROOM-020 (`dataRoomId` as the scope column).

## Capabilities

### New Capabilities

- `platform/persistence`: the relational schema and its invariants, migration handling, and the
  object-store bucket bootstrap.

### Modified Capabilities

None — this is the first change in the repo.

## Impact

`apps/api` gains `prisma`, `@prisma/client` and `@aws-sdk/client-s3`; new `src/prisma/` and
`src/storage/` modules; new root `docker-compose.yml`. No route changes, no `apps/web` changes, no
`packages/shared` changes. The `documents` module is left alone and retired later by slice 4.

## Non-goals

Named deliberately, each left to its own slice:

- **Slice 2** — the signup transaction that actually creates `User` + `DataRoom` + root `Node`. This
  change makes the row shapes possible, and writes none.
- **Slice 3** — any query, endpoint or DTO over these tables, including the keyset cursor and the
  recursive stats CTE. No controller is added.
- **Slice 13** — `pg_trgm` and `node_name_trgm`, which arrive with the search endpoint that needs
  them (Extra credit).
- **Slice 18** — `FileVersion` and the `Node.storageKey` move (Extra credit).
- **Hosting** — no provider is chosen anywhere, and none is named in the code. `DATABASE_URL` and
  `DIRECT_URL` ship as env vars with local defaults so that stays true (BR-100).
