## Context

`apps/api` is a NestJS 11 app with a `health` and an in-memory `documents` module and no database.
Nothing persists yet, so this change is additive — no data to migrate, no route to keep working.
See proposal.md — Why.

## Goals / Non-Goals

**Goals:** the four Core tables and their enums; one initial migration that includes the two indexes
Prisma cannot express; `docker compose` for Postgres and MinIO; a Prisma module and a storage module
that creates the bucket on boot.

**Non-Goals (design-level):** no repository or service layer over these tables — the first consumer
is slice 2's signup transaction, and writing an abstraction before it exists guesses at the shape.
No `BigInt` serialisation helper either: nothing serialises a node yet, and it belongs with the
first controller that returns one (slice 3).

## Decisions

**One `Node` table for folders and files.** A folder is a node with null `sizeBytes`, `mimeType` and
`storageKey`; a file has all three. Rejected alternative: separate `Folder` and `File` tables, which
duplicates listing, move, rename, delete and the uniqueness constraint for no gain, and makes a
mixed page of children a union query.

**No `DataRoom.rootId`.** A required FK to `Node` plus `Node.dataRoomId` back to `DataRoom` is an
insert cycle Postgres needs deferred constraints for. The root is the room's node with
`parentId IS NULL`, made exactly one by `node_single_root`.

**Blob/file-shape invariants stay in the application.** No check constraint asserts that a `FILE`
has a `storageKey` — that arrives with the upload path in slice 6, where the write is transactional
anyway (BR-060).

Schema, as it goes into `apps/api/prisma/schema.prisma`:

```prisma
model User {
  id           String     @id @default(uuid())
  email        String     @unique          // lowercased on write
  passwordHash String                      // argon2
  createdAt    DateTime   @default(now())
  dataRooms    DataRoom[]
}

model DataRoom {
  id        String   @id @default(uuid())
  ownerId   String
  name      String   @db.VarChar(255)
  createdAt DateTime @default(now())

  owner  User    @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  nodes  Node[]
  shares Share[]

  @@index([ownerId])
}

enum NodeType { FOLDER FILE }   // folders first: Postgres sorts enums by declaration order,
                                // so `ORDER BY type` groups folders ahead of files

model Node {
  id         String   @id @default(uuid())
  dataRoomId String
  parentId   String?                  // null on the room's root node only
  type       NodeType
  name       String   @db.VarChar(255)

  sizeBytes  BigInt?                  // files only
  mimeType   String?                  // files only, sniffed server-side
  storageKey String?                  // files only, the S3 object key

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  dataRoom DataRoom @relation(fields: [dataRoomId], references: [id], onDelete: Cascade)
  parent   Node?    @relation("children", fields: [parentId], references: [id], onDelete: Cascade)
  children Node[]   @relation("children")
  shares   Share[]

  @@index([dataRoomId, parentId, type, name, id])   // the listing index — covers the sort order
}                                                   // and the keyset cursor, including its tiebreak

enum ShareMode { PUBLIC RESTRICTED }
enum ShareRole { VIEWER EDITOR }   // EDITOR is unreachable today; see BR-070

model Share {
  id           String    @id @default(uuid())
  nodeId       String
  dataRoomId   String                       // denormalised, so scope checks need no join
  token        String    @unique             // 32 random bytes, base64url
  mode         ShareMode
  role         ShareRole @default(VIEWER)
  granteeEmail String?                       // set iff RESTRICTED, stored lowercased
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())

  node     Node     @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  dataRoom DataRoom @relation(fields: [dataRoomId], references: [id], onDelete: Cascade)

  @@index([nodeId])
  @@index([granteeEmail])                    // FR-SHARE-080's "Shared with me"
}
```

Appended by hand to the generated migration SQL (Prisma expresses neither a partial nor a
functional unique index):

```sql
-- BR-020: names are unique per folder, case-insensitively.
CREATE UNIQUE INDEX "node_name_unique"
  ON "Node" ("dataRoomId", "parentId", lower("name")) WHERE "parentId" IS NOT NULL;

-- One root per Data Room (FR-AUTH-050).
CREATE UNIQUE INDEX "node_single_root"
  ON "Node" ("dataRoomId") WHERE "parentId" IS NULL;
```

Identifiers are quoted camelCase: that is what Prisma emitted for `Node`, with no `@map` in the
schema. Prisma reports a violation of either index as `P2002` naming the fields, not the index name.
`pg_trgm` and `node_name_trgm` are deliberately absent; they belong to slice 13.

**Modules.** `PrismaService extends PrismaClient implements OnModuleInit` calling `$connect()`, in a
global `PrismaModule`. `StorageModule` provides an `S3Client` from `@aws-sdk/client-s3` and, in
`onModuleInit`, runs `HeadBucket` and on a 404 `CreateBucket` — private, no ACL. Object keys will be
`{dataRoomId}/{nodeId}`; nothing writes one in this change.

**Boot fails loudly.** A missing `DATABASE_URL`, an unreachable database or an unreachable
`S3_ENDPOINT` aborts startup with the variable or endpoint named. Assumption recorded here: a
process that cannot store bytes should not serve requests (BR-050's spirit) — cheap to relax later.

**Local infrastructure.** Root `docker-compose.yml` runs `postgres:17` and `minio/minio` and nothing
else; both apps stay on the host under `pnpm dev`.

New `apps/api/.env.example` entries, with their local defaults:

```
DATABASE_URL=postgresql://dataroom:dataroom@localhost:5432/dataroom
DIRECT_URL=postgresql://dataroom:dataroom@localhost:5432/dataroom
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=dataroom
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
```

`DIRECT_URL` is identical to `DATABASE_URL` locally and diverges wherever a connection pooler sits in
front of Postgres, since a pooler cannot run `prisma migrate deploy`. It ships now so that moving the
database anywhere is a change of env vars and nothing else. No provider is named here or in the code.

**Shipped on Prisma 7.9.1, which moved connection URLs out of the schema.** `datasource db` carries
only `provider`; the CLI reads `DIRECT_URL` from `apps/api/prisma.config.ts`, and the runtime client
takes `DATABASE_URL` through `@prisma/adapter-pg` (Prisma 7 has no Rust query engine). Two
consequences worth carrying into later slices: `$connect()` is lazy with a driver adapter, so
`PrismaService` follows it with `SELECT 1` to prove reach at boot, and the generated client lives in
`apps/api/src/generated/prisma` — gitignored, rebuilt by the api `postinstall`.

## Invariants touched

- **BR-020** — upheld in the database by `node_name_unique`, not by service code, so no later path
  can bypass it. The ` (2)` suffixing helper that turns the violation into a rename is slice 5.
- **BR-060** — the bucket is guaranteed to exist before any blob-first write happens, and the
  cascading self-relation is what lets a subtree delete be one statement inside one transaction.
- **BR-070** — `Share.role` ships defaulted to `VIEWER` and the enum already carries `EDITOR`, so
  the second role is a capability-map entry. No guard, principal or role UI here.
- **BR-100** — every environment-dependent value is an env var with a local default in
  `.env.example`; the compose file, the endpoint, the bucket name and both URLs are configuration,
  not code. Nothing here hardcodes a host, and nothing ships disabled.

## Risks / Trade-offs

- **Hand-written index lost on the next `migrate dev`** → it lives in a committed migration file, and
  the spec's reset scenario is the check that it does.
- **Prisma's identifier casing differs from the SQL above** → read the generated `CREATE TABLE`
  before appending, and verify by inserting a colliding row rather than by reading the file.
- **`lower(name)` follows the database collation** → adequate for ASCII diligence filenames; an ICU
  collation on the column is the upgrade if it ever matters.
- **MinIO endpoint reachability** → presigned URLs are signed against `S3_ENDPOINT`, so it stays
  `localhost:9000` (host-reachable), never a container-internal hostname. Bites in slice 6, decided
  here.

## Migration Plan

`docker compose up -d`, then `pnpm --filter @dataroom/api prisma migrate dev --name init`, append the
two `CREATE UNIQUE INDEX` statements to the generated SQL, `prisma migrate reset` to prove they
apply from scratch. Rollback is dropping the database: no data exists yet, anywhere.
