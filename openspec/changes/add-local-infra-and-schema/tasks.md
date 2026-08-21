## 1. Local infrastructure

- [x] 1.1 Add root `docker-compose.yml` running `postgres:17` (db/user/password `dataroom`, port 5432) and `minio/minio` (ports 9000 and 9001, root user/password `minioadmin`) with named volumes and nothing else. Verify `docker compose up -d` leaves both healthy and `psql "$DATABASE_URL" -c 'select 1'` plus the MinIO console on `localhost:9001` both answer.
- [x] 1.2 Extend `apps/api/.env.example` with `DATABASE_URL`, `DIRECT_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_FORCE_PATH_STYLE` at the local defaults in design.md, and note the compose prerequisite in the file. Verify `cp apps/api/.env.example apps/api/.env` needs no hand-editing to reach the compose stack.

## 2. Schema and migration

- [x] 2.1 Add `prisma` and `@prisma/client` to `apps/api`, and write `apps/api/prisma/schema.prisma` with `User`, `DataRoom`, `Node`, `Share`, the `NodeType` / `ShareMode` / `ShareRole` enums, the `@@index` set from design.md, and `directUrl` on the datasource. Verify `prisma validate` and `prisma generate` both succeed and `pnpm typecheck` still passes.
- [x] 2.2 Generate the initial migration, then append the `node_name_unique` and `node_single_root` statements from design.md to its SQL using the identifiers the generated `CREATE TABLE` actually emitted. Verify `prisma migrate reset --force` replays it from empty and `\di` lists both indexes plus the listing index.

## 3. API modules

- [x] 3.1 Add a global `PrismaModule` with a `PrismaService extends PrismaClient` that `$connect()`s in `onModuleInit`, wired into `AppModule`. Verify the API boots and `GET /api/health` still answers with the module loaded.
- [x] 3.2 Add a `StorageModule` providing a configured `S3Client` from `@aws-sdk/client-s3` that runs `HeadBucket` on boot and `CreateBucket` (private, no ACL) on a 404. Verify a first boot against empty MinIO creates the `dataroom` bucket and a second boot is a no-op (BR-060).
- [x] 3.3 Validate the connection configuration at startup so a missing `DATABASE_URL`, an unreachable database or an unreachable `S3_ENDPOINT` aborts boot with the variable or endpoint named. Verify by starting with compose down and with the variable unset, and reading the message in each case.

## 4. Tests

- [x] 4.1 Add an integration test in `apps/api` against the compose Postgres covering the database-level invariants: a duplicate child name and a case-only variant both rejected, the same name under a different parent and in a different Data Room both accepted (BR-020); a second null-parent node rejected (FR-AUTH-050); a folder delete removing its subtree and the shares on it (FR-FLDR-030); a share row defaulting to `VIEWER` and accepting `EDITOR` (BR-070). Verify `pnpm test --filter @dataroom/api` passes.
- [x] 4.2 Add a check that a keyset page of one folder's children ordered `type, name, id` plans as an index scan on `Node_dataRoomId_parentId_type_name_id_idx` with no sort node, seeded with enough rows that Postgres would not prefer a sequential scan (FR-NAV-030). Verify by asserting on `EXPLAIN` output in the test.

## 5. Documentation

- [x] 5.1 If the implementation diverged from the plan — Prisma's emitted column identifiers, the index name, or a compose detail — update `docs/03-domain-and-api.md` to match what shipped. Drop this task if nothing diverged.
