## Context

`apps/api` boots `PrismaModule` (global), `StorageModule`, `HealthModule`, `AuthModule` and the
in-memory `DocumentsModule`. `configureApp()` in `src/bootstrap.ts` sets the `api` prefix and one
`ValidationPipe({ whitelist, transform, forbidNonWhitelisted, exceptionFactory })` — **no
`enableImplicitConversion`**, so a numeric query param needs `@Type(() => Number)`. `JwtAuthGuard`
(`APP_GUARD`) puts `{ kind: 'owner', userId }` on the request; handlers read it with
`@CurrentPrincipal()`. `ApiExceptionFilter` (`APP_FILTER`) already maps `HttpStatus.NOT_FOUND` →
`{ code: 'NOT_FOUND', message: 'That does not exist.' }`, and `ErrorCode.NOT_FOUND` is declared.
`Node.id`, `dataRoomId` and `parentId` are Postgres `TEXT`, so a malformed id matches nothing rather
than raising. The listing index is `Node_dataRoomId_parentId_type_name_id_idx`. See proposal.md — Why.

## Goals / Non-Goals

**Goals:** four read routes, one scope check, one cursor codec, one `BigInt` boundary.

**Non-Goals (design-level):** no capability map — it has one entry until slice 9 and writing it now
guesses at the share half. No repository layer: Prisma calls in one service is not an abstraction
worth having yet. No `@IsUUID()` on `:id` — a bad id must be `404`, not `400`.

## Decisions

**Routes.** `src/nodes/`, all closed by default (no `@Public()`):

```
GET /api/nodes/:id                                → 200 FsNode
GET /api/nodes/:id/children?cursor&limit&type     → 200 Page<FsNode>
GET /api/nodes/:id/path                           → 200 Breadcrumb[]
GET /api/nodes/:id/stats                          → 200 NodeStats
```

**Shared contract** — `packages/shared/src/nodes.ts`, re-exported from `index.ts`:

```ts
export type NodeType = 'FOLDER' | 'FILE';

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
```

**One scope check (BR-010).** `NodeScopeService.resolve(principal, id)` is the only place ownership
is asserted, and the only file slice 9 edits to add the share branch:

```ts
const node = await this.prisma.node.findFirst({
  where: { id, dataRoom: { ownerId: principal.userId } },
  select: { ...FS_NODE_SELECT, dataRoomId: true, dataRoom: { select: { name: true } } },
});
if (!node) throw new NotFoundException(); // 404 NOT_FOUND — never 403
```

One round trip, two primary-key lookups, checked once per request; handlers then pass
`node.dataRoomId` into every subsequent query. `NotFoundException` joins
`src/http/api.exception.ts` beside the existing classes; the code and the filter row already exist.
The `dataRoom.name` column rides along because `/path` needs it — FR-ROOM-010's head segment reads
`DataRoom.name`, not the root row's copy, so the later rename endpoint touches nothing here.

**Keyset paging (FR-NAV-030).** The cursor is the `(type, name, id)` tuple, `base64url` of
`JSON.stringify({ t, n, i })`, in `src/nodes/cursor.ts`. A token that does not decode, or whose `t`
is not a `NodeType`, throws `ValidationFailedException({ cursor: [...] })` → `400
VALIDATION_FAILED`. `ListChildrenQuery`: `cursor?: string`, `limit`
`@Type(() => Number) @IsInt() @Min(1) @Max(100)` default 100, `type?` `@IsIn(['FOLDER', 'FILE'])`.

The page is the row-value form in `$queryRaw`, in `childrenPageQuery` — **this one method, and
nothing else in the slice** — because Prisma cannot express the comparison the index can start on:

```sql
SELECT n."id", n."parentId", n."type", n."name", n."sizeBytes", n."mimeType",
       n."createdAt", n."updatedAt"
  FROM "Node" n
 WHERE n."dataRoomId" = $1 AND n."parentId" = $2
   AND (n."type", n."name", n."id") > ($3::"NodeType", $4, $5)   -- omitted on the first page
 ORDER BY n."type", n."name", n."id"
 LIMIT $6                                                        -- limit + 1, decides nextCursor
```

`LIMIT limit + 1` is how `nextCursor` is known without a total (docs/03: no listing shows a count).
`ORDER BY` names the columns **qualified**: an unqualified `"type"` binds to an output column, and
ordering that as text would put files before folders.

**Reversed during apply — this was Prisma's `where` until the plan test ran.** Prisma's enum filter
carries no `gt`, so the tuple can only be written as an `OR` of three branches, and Postgres plans
that as a `Filter` _inside_ the scan rather than as its start condition. Both forms walk
`Node_dataRoomId_parentId_type_name_id_idx` with no `Sort` and no `Seq Scan`; the difference is what
the scan reads. Measured on the compose Postgres over a 20,000-row folder:

| Cursor at | `OR` form: rows discarded / time | Row-value form |
| --- | --- | --- |
| page 1 | 1 / 0.04ms | 0 / 0.03ms |
| page 90 | 9,000 / 1.5ms | 0 / 0.03ms |
| page 190 | 19,001 / 3.0ms | 0 / 0.03ms |

The `OR` form's cost grows with depth into the folder, and FR-NAV-030 says a page's cost may not.
The `Filter` it adds is on `(type, name, id)` rather than over other Data Rooms, so the acceptance
criterion first written here would have passed it — the criterion was the thing that was wrong. Task
3.2 now asserts `ROW` inside `Index Cond`, no `Filter`, and zero rows discarded at a deep cursor.

What the raw form was rejected for costs less than expected: `BigInt` and `Date` conversion is still
the one `toFsNode` boundary, because `$queryRaw` hands back `bigint` for `int8`, `Date` for
`timestamp` and the enum's label as a string — exactly what `FsNodeRow` already declares. What is
genuinely new is hand-quoted identifiers on the hottest read path, held by the plan test and by the
paging tests either form has to pass.

Also rejected: Prisma's `cursor: { id }, skip: 1`, which makes Postgres re-read the cursor row
through correlated subselects to recover a tuple the token already carries.

**Path and stats** are `$queryRaw` too — recursion has no Prisma form. Identifiers are quoted camelCase
because the schema carries no `@map` (docs/03's sample SQL says `size_bytes` / `parent_id`; the real
columns are `"sizeBytes"` / `"parentId"`, and the last task corrects docs/03).

```sql
-- /path — child to root. Also slice 9's scope walk and slice 8's cycle check.
WITH RECURSIVE ancestors AS (
  SELECT "id", "parentId", "name", 0 AS depth
    FROM "Node" WHERE "id" = $1 AND "dataRoomId" = $2
  UNION ALL
  SELECT n."id", n."parentId", n."name", a.depth + 1
    FROM "Node" n JOIN ancestors a ON n."id" = a."parentId"
   WHERE n."dataRoomId" = $2
)
SELECT "id", "name", depth FROM ancestors ORDER BY depth DESC
```

The head row (`depth` highest, `parentId IS NULL`) has its `name` replaced by `dataRoom.name` from
the scope lookup, so no breadcrumb ever reads "Root".

```sql
-- /stats — one recursive CTE, `depth > 0` so the node itself is not part of its own contents.
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
FROM subtree
```

`depth > 0` replaces docs/03's `- 1`, which returns `-1` folders when the node is a file. Counts are
cast to `int` so the driver yields numbers; `bytes` stays `bigint` and crosses the boundary through
the one serialiser.

**One `BigInt` boundary.** `src/nodes/node.serializer.ts` holds `toFsNode` and `toNodeStats`:
`Number(sizeBytes)` and `Number(bytes)`, `Date` → `toISOString()`. Nothing else in the change
touches a `BigInt`, so `JSON.stringify` can never meet one.

**A file's children** are an empty page, not an error: nothing is inside a file, and inventing a code
docs/03's table does not carry would be a code no documented route produces (BR-100).

## Invariants touched

- **BR-010** — the `404` half. One scope service, checked once per request before any child, path or
  stats query runs; a foreign or unknown node is `404 NOT_FOUND` with the filter's fixed message, so
  the two are byte-identical. Slice 9's share branch is an `if` in that one method.
- **BR-050** — every failure keeps the one envelope: `404 NOT_FOUND` from the filter row that
  already exists, `400 VALIDATION_FAILED` with `details` for a bad cursor, limit or type.
- **BR-070** — the scope service takes a `Principal`, never a header or a token, so the capability
  map lands in one file. No route added here is mutating, so nothing needs a `write` assertion yet.
- **BR-100** — nothing half-built: no route returns a placeholder, no error code is added that no
  route can produce, and no host, port or bucket name appears. No new env var.

## Risks / Trade-offs

- **~~The `OR` keyset form may plan as an in-index filter rather than a start condition~~** → it did,
  and the page is the row-value form instead; see the reversal above. What remains is one hand-written
  query on the hottest read path: the task 3.2 plan test asserts the index, the absence of `Sort`,
  `Incremental Sort` and `Seq Scan`, `ROW` inside `Index Cond`, no `Filter`, and zero rows discarded
  at a deep cursor. A plan regression fails that test rather than only getting slower.
- **The plan a small table gets is not the plan that matters** → at 250 rows Postgres reads the table
  sequentially and is right to, whichever form the query takes. The plan test seeds 4,000 rows in one
  folder so the index is genuinely the cheaper plan; asserting on a small fixture would have passed
  the `OR` form and proved nothing.
- **`sum("sizeBytes")` returns `numeric`, which the pg adapter may hand back as a string** → the
  `::bigint` cast pins it, and `toNodeStats` is the one place it converts.
- **A 32-level path is 32 recursive steps per request** → each is a primary-key lookup; TanStack
  Query caches `['path', id]` per node in slice 4. Cached ancestor aggregates are docs/03's first
  escalation if it ever matters.
- **`?limit` caps at 100** → a caller cannot ask for a bigger page, only a smaller one. Bounds the
  response and keeps page cost flat; raising the cap is one number.
- **`/children` on a file answers `200` with no rows** → a client bug reads as an empty folder rather
  than an error. Accepted: no documented code fits, and the spec records the behaviour.

## Migration Plan

No migration, no schema change, no new dependency, no new env var — `prisma migrate` is not run.
Rollback is reverting the commit. `packages/shared` gains types only, so an older API build keeps
compiling against it.
