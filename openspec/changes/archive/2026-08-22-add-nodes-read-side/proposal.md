## Why

Slice 3 of [docs/05-build-order.md](../../../docs/05-build-order.md). Slice 2 attached a principal
to every request but only `/auth/me` reads it: there is still no way to read a single node row over
HTTP. This slice is where BR-010's second half lands — the scope check that turns a principal into
"which rows may this caller see" — and it is written once here rather than per handler, because
every route after it inherits it.

## What Changes

- Four read routes per [docs/03 § API](../../../docs/03-domain-and-api.md#api), all requiring a
  bearer token: `GET /nodes/:id` → `FsNode`; `GET /nodes/:id/children?cursor&limit&type` →
  `{ items, nextCursor }`, keyset-paged on `(type, name, id)`, folders first, 100 rows by default
  and never a total count (FR-NAV-030); `GET /nodes/:id/path` → `Breadcrumb[]`, Data Room first
  (FR-NAV-020); `GET /nodes/:id/stats` → `{ folders, files, bytes }` from one recursive CTE
  (FR-ACCT-020).
- One scope check for all four: the node is loaded by primary key and its Data Room checked against
  the principal once per request; a node in another owner's room is `404 NOT_FOUND`, never `403`
  (BR-010, FR-ROOM-030).
- `packages/shared` gains the real node contract — `NodeType`, `FsNode`, `Breadcrumb`, `NodeStats`,
  `Page<T>` — so `BigInt` becomes `number` in one serialiser and neither side redeclares a field.

Delivers FR-NAV-020, FR-NAV-030, FR-ACCT-020, FR-ROOM-030 and BR-010's `404` half. No requirement in
docs/02 changes; three sample-SQL and shape details in docs/03 are corrected by the last task.

## Capabilities

### New Capabilities

- `navigation`: reading the tree — one node, one folder's children as a keyset page, and the
  breadcrumb path from the Data Room down to the open node.
- `viewing`: the server half of the details pane's folder figures — recursive folder count, file
  count and byte total for one node's contents (FR-ACCT-020), the same endpoint BR-030's delete
  dialog will read.

### Modified Capabilities

- `platform/authz`: today it records only that a request without a resolvable principal is refused
  (`401`). This change adds the scope half — a resolvable principal asking for a node it has no
  claim on is answered `404 NOT_FOUND`, indistinguishable from a node that does not exist.

## Impact

`apps/api` gains `src/nodes/` (controller, service, the one scope service, the cursor codec and the
`FsNode` serialiser) and a `NotFoundException` in the existing `src/http/api.exception.ts`;
`ErrorCode.NOT_FOUND` is already declared and already mapped by the filter. `packages/shared` gains
`src/nodes.ts`. No migration, no schema change, no new dependency, no `apps/web` change.

## Non-goals

Named deliberately, each left to its own slice:

- **Slice 4** — every screen that consumes these routes: the shell, breadcrumbs, the listing and its
  empty / skeleton / error states, and retiring the `documents` placeholder that still feeds the
  demo page. `?type=FOLDER` ships here because docs/03 puts it on this endpoint's contract, but the
  tree that uses it does not.
- **Slice 5–8** — every write route (`POST /nodes/folders`, `PATCH`, `/move`, `DELETE`) and BR-020's
  suffixing helper. This change reads; nothing it adds can create, rename, move or delete a row.
- **Slice 9** — the share principal, the capability map and the subtree confinement on the ancestor
  walk (BR-070). The scope service resolves an owner only, and is the one file slice 9 edits.
- **Slice 10** — `/path` stopping at a shared root instead of the Data Room.
- **`PATCH /data-rooms/:id`** (FR-ROOM-010's rename) — still with the slice whose UI renames in
  place. `/path` reads `DataRoom.name` for its head segment, so that rename needs no change here.
- **Polish and Extra credit** — `GET /data-rooms/:id/usage` (FR-ACCT-010) and `GET /search`.
