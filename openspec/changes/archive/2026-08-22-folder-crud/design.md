## Context

See proposal.md — Why. Key constraints from the existing codebase:

- `Node` table: `(dataRoomId, parentId, type, name, id)` listing index; partial unique index
  `node_name_unique ON Node (dataRoomId, parentId, lower(name)) WHERE parentId IS NOT NULL`
  enforces BR-020 at the DB layer. A violation raises Prisma `P2002` naming the constraint fields.
- `onDelete: Cascade` on `Node → Node` (self-relation) makes subtree delete one statement; `Share`
  rows cascade from their `nodeId`.
- Endpoints (from `docs/03`):
  - `POST /nodes/folders` — `{ parentId, name }` → `FsNode` (201)
  - `PATCH /nodes/:id` — `{ name }` → `FsNode` (200)
  - `DELETE /nodes/:id` — 204
  - `GET /nodes/:id/stats` — already live from slice 3
- Error codes in play: `INVALID_NAME` (400), `NOT_FOUND` (404), `VALIDATION_FAILED` (400).
  Both are already in `src/http/api.exception.ts`.
- Auth: all routes are closed by default via `APP_GUARD`; no `@Public()` is needed. The handler
  reads the principal via `@CurrentPrincipal()` and verifies `write` capability.

## Goals / Non-Goals

**Goals:**

- Ship `POST /nodes/folders`, `PATCH /nodes/:id`, `DELETE /nodes/:id` behind the closed guard.
- Write `resolveUniqueName(tx, dataRoomId, parentId, name, excludeId?)` once, in
  `src/nodes/name.helper.ts`. Upload (slice 6), move (slice 8) and copy (slice 15) import it —
  never a second implementation.
- Wire the toolbar's New-folder, Rename, Delete buttons and their dialogs in the web app.
- `DeleteImpact` fetches `GET /nodes/:id/stats` and keeps the confirm button disabled until done.

**Non-Goals:**

- File upload / download (slice 6).
- Move dialog and cycle check (slice 8 — `FR-FLDR-040`).
- `FR-ACCT-020` folder stats in the details pane (slice 7).
- Sharing counts in the delete dialog — `BR-030` says "active shares" too, but that requires the
  share layer from slice 10. The dialog will add that line there.

## Decisions

### D1 — `resolveUniqueName` runs inside the caller's transaction

**Decision:** The helper accepts a Prisma `TransactionClient` (the `tx` parameter) rather than
using `PrismaService` directly, so it participates in the caller's transaction automatically.

**Alternative rejected:** A standalone service method on `PrismaService` that opens its own
`$transaction`. Rejected because it cannot join an outer transaction, making it impossible to
guarantee atomicity when called during a move or copy that already holds a transaction.

**BR-020 uphold:** The retry loop queries case-insensitively (`where: { dataRoomId, parentId,
name: { equals: candidate, mode: 'insensitive' } }`) and increments the suffix counter until the
candidate is free. On P2002 (race between check and insert) the write is retried once.

### D2 — `PATCH /nodes/:id` is the single rename endpoint for both folders and files

**Decision:** One endpoint renames both node types. The handler validates the node exists in the
room, computes the suffixed name, and writes `name` + `updatedAt`.

**Alternative rejected:** Separate `PATCH /nodes/folders/:id` and `PATCH /files/:id`. Rejected
because there is no type-specific rename logic; the duplication buys nothing and means two routes
to guard.

### D3 — `DeleteImpact` owns its own stats fetch (not shared with the details pane)

**Decision:** `DeleteImpact` calls `GET /nodes/:id/stats` independently via TanStack Query with
key `['stats', id]`. If the details pane has already fetched the same stats they come from the
cache for free.

**Alternative rejected:** Passing stats as props from the parent that already fetched them.
Rejected because `DeleteDialog` can be opened from the toolbar without a details-pane selection,
so the data may not exist in the parent's scope.

### D4 — Cascade delete: no blob collection needed in this slice

This slice deletes folders only. Folders have no `storageKey`, so no S3 `DeleteObjects` call is
needed. The Prisma cascade handles the subtree. When file delete is added (slice 8), the service
will collect `storageKey`s from the subtree before the `delete` call (as `docs/03` describes).

**BR-060 uphold:** The `DELETE /nodes/:id` service method runs inside a Prisma transaction.
In this slice no blob exists to delete, so the blob-first / row-second ordering is satisfied
trivially; the pattern is established here for slice 6 to follow.

## Risks / Trade-offs

- **Race on name suffix** — two concurrent creates of the same name can both pass the
  `resolveUniqueName` check and one will hit `P2002`. The helper catches `P2002` and retries
  once. A second collision in the same millisecond is possible but astronomically unlikely in a
  single-owner room.
  → Mitigation: the retry handles the common case; a second failure surfaces as a
  `VALIDATION_FAILED` with the field named.

- **Stats CTE on a large subtree** — the recursive query in `GET /nodes/:id/stats` is
  `O(nodes in subtree)`. For a very large Data Room this could be slow, but it is called only on
  demand (dialog open, not per row) and TanStack Query caches the result per node.
  → Mitigation: acceptable at this scale; `docs/03 § How it scales` names the upgrade path.

## Migration Plan

No schema changes. No new migrations. No deployment step beyond the normal `pnpm build`.
