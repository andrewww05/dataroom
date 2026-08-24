# 03 — Domain, storage, API and configuration

This file owns field names, endpoints, error codes and the environment contract. Rules and limits
live in [02-requirements.md](./02-requirements.md). The ERD, the scaling answers and the hosting
requirements here are lifted verbatim into the root README by FR-OPS-020, so they are written to be
read by someone who has not read the rest of the spec.

## Model

Three tables carry Core. **One table does folders and files**: a folder is a node with no blob, a
file is a node with one. That keeps listing, moving, renaming, deleting and the uniqueness
constraint identical for both instead of duplicating every operation. **The `DataRoom` is the
scope**: it is the brief's top-level object, it is what a share can cover whole, and it is the
column every index leads with, so the answer to "what changes at 100,000 files" is about one room's
rows rather than one user's rows.

### ERD

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

### Prisma

Prisma 7 keeps connection URLs out of `schema.prisma`: the datasource block carries only
`provider = "postgresql"`. The CLI reads `DIRECT_URL` from `apps/api/prisma.config.ts`, and the
runtime client is handed `DATABASE_URL` through the `@prisma/adapter-pg` driver adapter — there is
no Rust query engine to configure. The env vars and their roles are unchanged from
[Configuration](#configuration).

```prisma
model User {
  id           String     @id @default(uuid())
  email        String     @unique
  passwordHash String
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

enum NodeType { FOLDER FILE }            // declared folders-first: Postgres sorts enums by
                                         // declaration order, so `ORDER BY type` groups them

model Node {
  id         String   @id @default(uuid())
  dataRoomId String
  parentId   String?                     // null on the room's root node only
  type       NodeType
  name       String   @db.VarChar(255)

  sizeBytes  BigInt?                     // files only
  mimeType   String?                     // files only, sniffed server-side
  storageKey String?                     // files only, the S3 object key

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  dataRoom DataRoom @relation(fields: [dataRoomId], references: [id], onDelete: Cascade)
  parent   Node?    @relation("children", fields: [parentId], references: [id], onDelete: Cascade)
  children Node[]   @relation("children")
  shares   Share[]

  @@index([dataRoomId, parentId, type, name, id])   // the listing index — covers the sort order
                                                    // and the keyset cursor, including its tiebreak
}

enum ShareMode { PUBLIC RESTRICTED }
enum ShareRole { VIEWER EDITOR }          // EDITOR is unreachable today; see BR-070

model Share {
  id           String    @id @default(uuid())
  nodeId       String
  dataRoomId   String
  token        String    @unique          // 32 random bytes, base64url
  mode         ShareMode
  role         ShareRole @default(VIEWER)
  granteeEmail String?                    // set iff mode = RESTRICTED, stored lowercased
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())

  node     Node     @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  dataRoom DataRoom @relation(fields: [dataRoomId], references: [id], onDelete: Cascade)

  @@index([nodeId])
  @@index([granteeEmail])                 // FR-SHARE-080's "Shared with me"
}
```

`DataRoom` deliberately has **no `rootId`**: a required FK to `Node` plus `Node.dataRoomId` back to
`DataRoom` is a cycle Postgres can only insert into with deferred constraints, for no gain. The root
is the node in that room with `parentId IS NULL`, which the partial unique index below makes exactly
one, and `GET /auth/me` resolves it in a single indexed lookup.

Two constraints need hand-written SQL in the first migration, because Prisma can express neither a
partial nor a functional unique index; the trigram index arrives later, with the search slice that
needs it. Identifiers are quoted camelCase, because that is what Prisma emits without an `@map`:

```sql
-- BR-020: names are unique per folder, case-insensitively.
CREATE UNIQUE INDEX "node_name_unique"
  ON "Node" ("dataRoomId", "parentId", lower("name")) WHERE "parentId" IS NOT NULL;

-- One root per Data Room.
CREATE UNIQUE INDEX "node_single_root"
  ON "Node" ("dataRoomId") WHERE "parentId" IS NULL;

-- FR-SRCH-010 (extra credit, its own migration in slice 13): substring search on name,
-- scoped by "dataRoomId" at query time.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "node_name_trgm" ON "Node" USING gin ("name" gin_trgm_ops);
```

A unique violation on either index surfaces from Prisma as `P2002` naming the _fields_, not the
index — `("dataRoomId", "parentId", lower(name::text))` against `("dataRoomId")` — which is how the
two are told apart when handling BR-020's auto-rename.

`onDelete: Cascade` on the self-relation is what makes FR-FLDR-030 one statement: deleting a
folder row deletes its whole subtree, and every `Share` on every node in it. The service collects
the subtree's `storageKey`s first (same recursive query as stats), deletes the row, then deletes
the blobs.

### Authorization in queries

BR-010 resolves a principal per request, and the scope check happens **once per request, not per
row**:

1. The requested node is loaded by primary key, which yields its `dataRoomId`.
2. That room is checked against the principal — `DataRoom.ownerId = principal.userId` for an owner,
   or `Share.dataRoomId` plus an ancestor walk for a share (BR-070).
3. Every subsequent query in the request filters on `dataRoomId` and, for a share, stays inside the
   subtree.

Two point lookups on primary keys, then plain indexed reads. The alternative — a denormalised
`ownerId` on every node so listings can filter on it directly — buys one fewer lookup and costs a
column that can disagree with the room it belongs to. Not worth it at this size, and it is the
denormalisation to add first if profiling ever says otherwise.

### Sorting and paging

Listings are ordered `type ASC, name ASC, id ASC` — folders first, then name, with `id` making the
tuple unique. `name ASC` follows the database collation; if case-insensitive ordering matters, give
the column an ICU collation in the migration.

The cursor **is** that tuple, not an offset and not a row id: `base64url` of
`{"t":<type>,"n":<name>,"i":<id>}`. It is opaque to the client, and a token that does not decode —
or whose `t` is not a `NodeType` — is `400 VALIDATION_FAILED` naming `cursor`, never a silent page
from the beginning. A page defaults to **100 rows and 100 is also the maximum**: `?limit` outside
`1..100` is `400 VALIDATION_FAILED` naming `limit`, never a silently clamped page. Raising the cap
is one number in `ListChildrenQuery`.

The page asks for `limit + 1` rows; the extra row is what decides whether there is a next cursor,
and it never leaves the service. So no listing pays for a count in order to know it has ended.

Page 500 costs the same as page 1 only if the cursor is the scan's **start condition** rather than a
filter over the rows before it, and that is narrower than it looks:

- `("type","name","id") > ($1::"NodeType",$2,$3)` lands in `Index Cond` on
  `Node_dataRoomId_parentId_type_name_id_idx` and opens the scan at the cursor.
- The same predicate as an `OR` of three branches — Prisma's only form, its enum filter having no
  `gt` — lands in `Filter` instead. Measured over a 20,000-row folder: page 190 discarded 19,001
  index entries before its first row, at 3.0ms against 0.03ms.

`GET /nodes/:id/children` is therefore the one read path written as `$queryRaw`; `BigInt` and `Date`
still convert in the single `toFsNode` boundary. Prisma's own `cursor` + `skip: 1` is not used at
all: it makes Postgres re-read the cursor row through correlated subselects to recover a tuple the
token already carries.

No listing shows a total count. `SELECT count(*)` over a folder is the one query in the listing path
that cannot use the index to stop early, and "1–100 of 100,000" is not worth a full scan per page —
the details pane shows counts on demand instead (FR-ACCT-020).

### Recursive stats

`GET /nodes/:id/stats`, the folder row of the details pane and the BR-030 delete dialog all run:

```sql
WITH RECURSIVE subtree AS (
  SELECT "id", "type", "sizeBytes", 0 AS depth
    FROM "Node" WHERE "id" = $1 AND "dataRoomId" = $2
  UNION ALL
  SELECT n."id", n."type", n."sizeBytes", s.depth + 1
    FROM "Node" n JOIN subtree s ON n."parentId" = s."id"
   WHERE n."dataRoomId" = $2
)
SELECT (count(*) FILTER (WHERE "type" = 'FOLDER' AND depth > 0))::int AS folders,
       (count(*) FILTER (WHERE "type" = 'FILE'   AND depth > 0))::int AS files,
       (coalesce(sum("sizeBytes") FILTER (WHERE depth > 0), 0))::bigint AS bytes
FROM subtree;
```

Identifiers are quoted camelCase because the schema carries no `@map` — these are the columns
Prisma emits. `depth > 0` is what excludes the node from its own contents; `count(*) - 1` would
report **minus one folder** for a file, which has no contents at all. The recursive term repeats
`"dataRoomId" = $2` so the walk cannot leave the room even if a `parentId` ever pointed out of it.
Counts are cast to `int` so the driver yields numbers; `bytes` stays `bigint` and crosses the
boundary through the one serialiser.

The same shape, seeded from the root and counting every depth, answers FR-ACCT-010.

`GET /nodes/:id/path` walks the other way — child to root — for breadcrumbs, and is also the
ancestor walk BR-070's scope check and FR-FLDR-040's cycle check use: if the move target is the node
itself or appears in its own subtree, reject with `INVALID_MOVE`. Its **head segment carries
`DataRoom.name`**, read from the room on each request rather than from the root node's copy of it, so
FR-ROOM-010's rename needs no write here and no breadcrumb can go stale. No segment is ever named
"Root".

## Storage

One private bucket (`dataroom`), reached over the S3 API. Locally that is **MinIO** from
`docker compose`; anywhere else it is whichever S3-compatible store the operator already has — AWS
S3, Cloudflare R2, Backblaze B2, Spaces, or MinIO on a box. `@aws-sdk/client-s3` and every presigned
URL are byte-identical across all of them; only `S3_ENDPOINT`, the credentials and
`S3_FORCE_PATH_STYLE` change, which is the whole reason for choosing an S3-compatible store over a
proprietary blob API. No vendor is named in the code.

Objects are keyed `{dataRoomId}/{nodeId}` — the id is generated in the service with
`crypto.randomUUID()` so the key is known before the row is inserted, which is what makes BR-060's
blob-first ordering possible. With versioning (extra credit) the key gains a third segment.

- **Upload** streams through the API (`FileInterceptor` → `PutObject`) so BR-040's validation runs
  on real bytes before anything is stored. This is the one decision that constrains where the API
  can run: a serverless function caps request bodies well below 100 MB, so the API needs a
  persistent process (see [Running it somewhere else](#running-it-somewhere-else)). Presigned
  direct-to-bucket uploads are the change to make when throughput matters more than synchronous
  validation, and they are also what makes 100 MB free.
- **Download and preview** return a `200` JSON payload with a presigned `GetObject` URL valid for 5 minutes —
  download with `response-content-disposition=attachment`, preview with `inline`. Bytes never
  pass through Nest. The payload is `200` rather than a `302` redirect because an `<iframe>` navigation (for preview) or a bare `<a>` navigation (for download) carries no `Authorization` header, meaning the server cannot authenticate a direct browser navigation to the API endpoint (FR-VIEW-060). FR-VIEW-060 renders the inline URL in an `<iframe>`, which is a navigation
  rather than a `fetch`, so the bucket needs no CORS rule; it would if the viewer ever moved to
  pdf.js or the client ever `PUT` directly.
- **Copy** _(Polish)_ is `CopyObject` server-side (FR-FILE-060).
- **Delete** is `DeleteObjects`, batched a thousand keys at a time, after the row is gone.

## API

Everything under `/api` (the `API_PREFIX` in `packages/shared`). All routes require
`Authorization: Bearer <jwt>` or `Authorization: Share <token>` except `/auth/signup`,
`/auth/login`, `/shares/resolve` and `/health`. That is enforced by one global guard with a
`@Public()` escape, so a route added without an annotation is closed rather than open. **Tier**
marks what is Core.

| Method | Path                     | Body / query                                  | Returns                                                                                         | Tier   |
| ------ | ------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------ |
| POST   | `/auth/signup`           | `{ email, password }`                         | `{ token, user, dataRoom }`                                                                     | Core   |
| POST   | `/auth/login`            | `{ email, password }`                         | `{ token, user, dataRoom }`                                                                     | Core   |
| GET    | `/auth/me`               | —                                             | `{ id, email, dataRoom: { id, name, rootId } }`                                                 | Core   |
| PATCH  | `/data-rooms/:id`        | `{ name }`                                    | `DataRoom`                                                                                      | Core   |
| GET    | `/nodes/:id`             | —                                             | `FsNode`                                                                                        | Core   |
| GET    | `/nodes/:id/children`    | `?cursor&limit&type`                          | `{ items: FsNode[], nextCursor }`                                                               | Core   |
| GET    | `/nodes/:id/path`        | —                                             | `Breadcrumb[]`, shared root or Data Room first                                                  | Core   |
| GET    | `/nodes/:id/stats`       | —                                             | `{ folders, files, bytes }`                                                                     | Core   |
| POST   | `/nodes/folders`         | `{ parentId, name }`                          | `FsNode`                                                                                        | Core   |
| PATCH  | `/nodes/:id`             | `{ name }`                                    | `FsNode`                                                                                        | Core   |
| POST   | `/nodes/move`            | `{ ids: string[], targetId }`                 | `FsNode[]`                                                                                      | Core   |
| DELETE | `/nodes/:id`             | —                                             | `204`                                                                                           | Core   |
| POST   | `/files`                 | multipart: `parentId`, `file`                 | `FsNode`                                                                                        | Core   |
| GET    | `/files/:id/download`    | Download a file                               | `200` `PresignedUrl`                                                                            | Core   |
| GET    | `/files/:id/preview`     | Preview a file in the browser (FR-VIEW-060)*  | `200` `PresignedUrl`                                                                            | Core   |
| POST   | `/shares`                | `{ nodeId, mode, granteeEmail?, expiresAt? }` | `Share`                                                                                         | Core   |
| GET    | `/nodes/:id/shares`      | —                                             | `NodeShares`                                                                                    | Core   |
| DELETE | `/shares/:id`            | —                                             | `204`                                                                                           | Core   |
| GET    | `/shares/resolve`        | `?token`                                      | `{ node, mode, role, rootNodeId, ownerEmail }` — the only route a share token may call unscoped | Core   |
| GET    | `/shares/preview/:token` | —                                             | `200` `text/html` with Open Graph tags for rich previews                                        | Core   |
| GET    | `/shares/received`       | —                                             | `ReceivedShare[]` (FR-SHARE-080)                                                                | Core   |
| GET    | `/health`                | —                                             | `{ status, uptimeSeconds }`                                                                     | Core   |
| POST   | `/nodes/copy`            | `{ ids: string[], targetId }`                 | `FsNode[]`                                                                                      | Polish |
| GET    | `/data-rooms/:id/usage`  | —                                             | `{ bytes, files }`                                                                              | Polish |
| GET    | `/search`                | `?q`                                          | `{ items: SearchHit[] }`                                                                        | Extra  |

Move and copy take arrays because FR-FILE-070 acts on a selection; each item resolves its own
name conflict under BR-020, and the response carries the names actually used.

Every `/nodes/*` and `/files/*` read route works unchanged for a share principal once its scope
check passes — that is the whole reason for reusing them instead of writing a parallel `/public/*`
tree, and it means the shared view in [04](./04-ux.md) is the owner's view with the write
affordances removed rather than a second implementation of the same screens.

### Principals

| Header                         | Principal                                                  | Capabilities             | Sees                     |
| ------------------------------ | ---------------------------------------------------------- | ------------------------ | ------------------------ |
| `Authorization: Bearer <jwt>`  | `{ kind: 'owner', userId }`                                | `read`, `write`          | every Data Room they own |
| `Authorization: Share <token>` | `{ kind: 'share', shareId, role, rootNodeId, dataRoomId }` | `read` (`role = VIEWER`) | the shared subtree only  |

Handlers ask the principal for a capability, never for the header or the role name. That indirection
is BR-070 and it is the whole of the brief's viewer/editor question: `EDITOR` adds `write` to one
capability map.

## Shared contract

`packages/shared` currently holds a `DocumentSummary` demo type. It is replaced by the real
one, which both sides import so they cannot drift:

```ts
export type NodeType = 'FOLDER' | 'FILE';
export type ShareMode = 'PUBLIC' | 'RESTRICTED';
export type ShareRole = 'VIEWER' | 'EDITOR';

export interface FsNode {
  id: string;
  parentId: string | null;
  type: NodeType;
  name: string;
  sizeBytes: number | null; // BigInt serialised as a number; 100 MB is far inside 2^53
  mimeType: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
}
export interface DataRoom {
  id: string;
  name: string;
  rootId: string;
}
export interface AuthResponse {
  token: string;
  user: AuthUser;
  dataRoom: DataRoom;
}
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
export interface Breadcrumb {
  id: string;
  name: string;
}
export interface NodeStats {
  folders: number;
  files: number;
  bytes: number;
}
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface Share {
  id: string;
  nodeId: string;
  token: string;
  mode: ShareMode;
  role: ShareRole;
  granteeEmail: string | null;
  expiresAt: string | null;
  createdAt: string;
}
export interface NodeShares {
  own: Share[];
  inheritedFrom: Breadcrumb | null; // the nearest shared ancestor, for FR-SHARE-060
}
export interface ReceivedShare {
  token: string;
  node: FsNode;
  ownerEmail: string;
  role: ShareRole;
  createdAt: string;
}
export interface SearchHit extends FsNode {
  path: Breadcrumb[];
} // extra credit
```

`formatBytes` and `API_PREFIX` stay as they are.

## Extra credit — versioning

One migration on top of the model above. Nothing in Core is restructured; the one column that
moves is `Node.storageKey`.

```prisma
model FileVersion {
  id         String   @id @default(uuid())
  nodeId     String
  version    Int                              // 1-based, dense within the file
  storageKey String                           // {dataRoomId}/{nodeId}/{versionId}
  sizeBytes  BigInt
  mimeType   String
  createdAt  DateTime @default(now())

  node Node @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  @@unique([nodeId, version])
}
```

`Node` gains `currentVersionId String?` and **loses `storageKey`** — the blob now hangs off the
version, and `Node.sizeBytes` mirrors the current version so listings still sort and total without a
join. The migration backfills one `FileVersion` per existing file and copies the key across.
`onDelete: Cascade` is what makes FR-VER-040 free; only the blobs need collecting first, and that
query now reads `FileVersion.storageKey`.

| Method | Path                              | Body / query      | Returns                                  |
| ------ | --------------------------------- | ----------------- | ---------------------------------------- |
| POST   | `/files/:id/versions`             | multipart: `file` | `FsNode` with the new `currentVersionId` |
| GET    | `/files/:id/versions`             | —                 | `FileVersion[]`, newest first            |
| GET    | `/files/:id/versions/:v/download` | —                 | `302` to a presigned URL                 |
| POST   | `/files/:id/versions/:v/restore`  | —                 | `FsNode` (FR-VER-030)                    |

```ts
export interface FileVersion {
  id: string;
  version: number;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}
```

## Errors

One envelope, from a global exception filter: `{ "code": "...", "message": "...", "details"?: {} }`.
The `code` is what the UI switches on; the `message` is what the toast shows.

| Code                  | HTTP | When                                                                                                                                         |
| --------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `UNAUTHENTICATED`     | 401  | Missing, malformed or expired token                                                                                                          |
| `INVALID_CREDENTIALS` | 401  | Wrong email or password                                                                                                                      |
| `EMAIL_TAKEN`         | 409  | Sign-up on an existing email                                                                                                                 |
| `NOT_FOUND`           | 404  | Unknown node, room or share — or one the principal has no claim on (BR-010)                                                                  |
| `INVALID_NAME`        | 400  | Empty, too long, or contains `/` `\` `.` `..`                                                                                                |
| `INVALID_MOVE`        | 400  | Folder moved into itself or a descendant; target is not a folder                                                                             |
| `FILE_TOO_LARGE`      | 413  | Over 100 MB (BR-040)                                                                                                                         |
| `UNSUPPORTED_TYPE`    | 415  | Sniffed MIME type not in the allow list (BR-040)                                                                                             |
| `TOO_MANY_FILES`      | 400  | Over 20 files in one batch                                                                                                                   |
| `VALIDATION_FAILED`   | 400  | `ValidationPipe` rejected the DTO; `details` carries the fields                                                                              |
| `STORAGE_UNAVAILABLE` | 502  | The bucket refused or timed out — the client may retry (BR-050)                                                                              |
| `READ_ONLY`           | 403  | A share principal called a mutating route (BR-070)                                                                                           |
| `SIGN_IN_REQUIRED`    | 401  | A `RESTRICTED` link opened by nobody — see below                                                                                             |
| `INTERNAL`            | 500  | Nothing above matched. Generic message, no stack trace, SQL, path or library name in the body; the cause and its stack go to the log instead |

A code exists once a route can produce it, so the table above is the whole set and each slice adds
its own rows to the filter (BR-100). `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `EMAIL_TAKEN`,
`VALIDATION_FAILED`, `NOT_FOUND` and `INTERNAL` are live today.

Name collisions produce no error: BR-020 renames and reports the name used.

The one place BR-010's indistinguishability bends is `SIGN_IN_REQUIRED`. A `RESTRICTED` link
opened by an anonymous visitor has to say _something_, or the intended recipient has no way to
know they need to sign in — so it admits a link exists without naming what is behind it. Once
signed in as the wrong person, it is a flat `404` again.

## Configuration

Every value that depends on the environment is here, with a local default that matches
`docker compose`. Nothing in this column set is host-specific, which is what makes FR-OPS-010's
"configuration, not a code change" true.

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

`docker-compose.yml` runs `postgres:17` and `minio/minio` and nothing else; the bucket is created on
API boot if it is missing, so there is no manual setup step. Apps run on the host with `pnpm dev`.

One dependency needs a native build: `argon2`, which pnpm would otherwise skip silently, leaving an
import that fails at boot. It is listed in `onlyBuiltDependencies` in `pnpm-workspace.yaml` so
`pnpm install` compiles it from a clean clone. `@node-rs/argon2` is the prebuilt drop-in if a
platform ever refuses to build it.

## Running it somewhere else

**This plan deploys nothing and picks no host.** The deliverable is an app that runs locally from a
clean clone (FR-OPS-010) and carries no vendor in its code, so whoever wants it on a server chooses
where. What follows is the contract such a host has to satisfy — not a decision about which one.

| Piece      | What it needs                     | Why                                                                                                                                                                                                |
| ---------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web` | Anything that serves static files | It is a static Vite build. `VITE_API_URL` points at the API origin, so the dev-only `/api` proxy has no counterpart to go wrong.                                                                   |
| `apps/api` | A **persistent** Node process     | Uploads stream through Nest so BR-040 can validate sniffed bytes. A serverless function caps the request body far below 100 MB, so the API cannot be one without giving up server-side validation. |
| Postgres   | Any Postgres 17                   | `DATABASE_URL` at runtime, `DIRECT_URL` for `prisma migrate deploy` — the same split works whether or not a pooler is in front.                                                                    |
| Blobs      | Any S3-compatible bucket, private | The MinIO code path is the only code path; every read is a presigned URL.                                                                                                                          |

Four things that break only once it is not all on one machine, all cheap to get right up front:

- **The presigned host must be reachable by the browser.** URLs are signed against `S3_ENDPOINT`, so
  it has to be the endpoint the browser can resolve, never a container-internal hostname.
- **CORS is one origin.** `CORS_ORIGIN` is the origin serving the web app; if a host hands out a new
  hostname per build, either allow that pattern or test on the stable one.
- **Share links leak through `Referer`.** Send `Referrer-Policy: no-referrer` on `/s/*` so an
  outbound click from a shared view cannot hand the token to a third party.
- **Migrations are a step, not a hope.** Run `prisma migrate deploy` before the new process serves
  traffic, and let `/health` confirm it worked.
- **Rich link previews.** Social media bots (Slack, Twitter, Discord, etc.) do not execute JavaScript and cannot render client-side routes. Configure your reverse proxy (e.g., Nginx, Caddy, Vercel) to route user-agents matching bots from `/s/:token` to the `/api/shares/preview/:token` endpoint so they receive the server-rendered HTML with Open Graph tags.

## How it scales

The three questions the brief asks, answered against the model above.

### Total size and item count of a folder including its whole subtree

One recursive CTE, seeded at the folder and walking `"parentId"` downward — the query in
[Recursive stats](#recursive-stats). It is depth-independent and costs one index scan per level, so
it is `O(nodes in the subtree)`: microseconds for a normal folder, and a real cost only at the root
of a very large room. It is called on demand, not per row of a listing — the details pane and the
BR-030 delete dialog — and TanStack Query caches it per node, so browsing does not re-run it.

When that stops being fast enough, in order of what I would reach for:

1. **Cached aggregates on the folder row** (`subtreeBytes`, `subtreeFiles`), updated in the same
   transaction as the write that changed them. The update touches only the ancestors of the changed
   node — depth, not breadth — and depth is capped at 32 by FR-FLDR-010. Reads become one row.
2. **A materialised path** (`ltree`, or a `path` text column with a `text_pattern_ops` index).
   Subtree reads become a prefix scan with no recursion, which also makes "everything under here"
   queries — search inside a folder, share-scope checks — index-only. The cost is rewriting paths on
   move, which is again bounded by subtree size.
3. **A closure table**, if arbitrary ancestor/descendant questions ever become the common case
   rather than the rare one. It is the most flexible and the most write-amplifying; it would need a
   reason.

The current schema supports all three without touching the listing path, which is why it starts with
the CTE instead of pre-optimising.

### One Data Room holding 100,000 files

Listing never depends on room size, because a listing is one folder's children and is paged:

- **Pagination is keyset, not offset.** The cursor is `(type, name, id)` base64-encoded, so
  `WHERE (type, name, id) > cursor ORDER BY type, name, id LIMIT 100` walks
  `@@index([dataRoomId, parentId, type, name, id])` and page 500 costs what page 1 costs. `OFFSET`
  would read and discard 50,000 rows to reach the same place.
- **The listing index is the sort order**, so no sort node, and it covers the cursor's tiebreak.
- **No total counts in listings** — see [Sorting and paging](#sorting-and-paging).
- **The tree loads lazily** (FR-NAV-010), so the sidebar never fetches more than one folder's
  children either.
- **Search** (extra credit) is `ILIKE '%q%'` against the `gin_trgm_ops` index, filtered by
  `dataRoomId` and capped at 50 rows. Trigram indexes need three characters to be selective, so the
  box waits for the third before querying — below that a leading wildcard degrades to a scan.
- **`dataRoomId` leads every index**, so a second room, or a hundred, never widens the range a query
  walks. If one room ever outgrows a single table, that column is also the partition key, and no
  application code changes.

Two things at 100,000 files that the current design would have to change, and I would rather name
them than pretend they scale:

- **Deleting a huge subtree.** The cascade delete is one statement and fast; collecting and issuing
  `DeleteObjects` for 100,000 keys is not, and it does not belong in a request. The change is a
  `PendingBlobDeletion` table written in the same transaction and swept by a background job — rows
  vanish immediately for the user, blobs follow.
- **Upload throughput.** Every byte goes through one API process. Presigned direct-to-bucket `PUT`s
  fix it, and move BR-040's validation to a post-upload check — the trade discussed in
  [Storage](#storage).

### Per-user roles (viewer/editor) without remodeling

Already in the schema: `Share.role` is a `ShareRole` defaulting to `VIEWER`, shipped in the first
migration. The reason it is enough is BR-070 — **handlers ask the principal for a capability, never
for the token or the role name**:

```ts
type Capability = 'read' | 'write';
const CAPABILITIES: Record<ShareRole, Capability[]> = {
  VIEWER: ['read'],
  EDITOR: ['read', 'write'],
};
```

So `EDITOR` is one entry in that map plus letting the DTO accept it. Mutating handlers already assert
`write` against the principal, and they assert it for owners today, so no route is missed. Read
routes do not care who is asking beyond scope, and the scope check is unchanged.

Two extensions that also need no remodelling:

- **Room-wide roles** — a `Membership(dataRoomId, userId, role)` table adds a third principal kind
  (`{ kind: 'member', role, dataRoomId }`) resolved by the same guard. Nodes, shares and listings
  are untouched: they are already scoped by `dataRoomId`, not by "is this the owner".
- **Per-node roles for a named person** — that is what a `RESTRICTED` share with `role = EDITOR`
  already is. One row per grantee per node is the same shape the brief's permissioned mode already
  demands, which is why it was not modelled as a single `Share` with a list of emails.

The UI shows no role control until there is a second role to choose (BR-100).
