## Context

See proposal.md — Why. Constraints that shape the approach: `useSelection` is a checkbox-only
Zustand store with no anchor; `apps/web/src/index.css` already declares `:root` / `.dark` and
`@custom-variant dark (&:is(.dark *))` with nothing writing the class; there is no `data-rooms`
module in the API; `StorageService` exposes `client` and `bucket` and object keys are
`{dataRoomId}/{nodeId}`; `resolveUniqueName` (BR-020) and `NodeScopeService` (BR-010) already exist
and are reused rather than reimplemented.

## Goals / Non-Goals

**Goals:** one selection model both views and the keyboard drive; copy as a server operation; usage
as one aggregate query; theme as one token set.

**Non-Goals:** no zip endpoint, no drag-to-reorder, no virtualised grid, no new env var — nothing
here reads a host, port or bucket name (BR-100).

## Decisions

**Selection** — `useSelection` gains `anchorId` and `selectOne | toggle | selectRange(items, id) |
selectAll(items)`; the range is computed against the rendered order the listing already holds, so
list and tiles share it. Rejected: keeping per-row checkbox state — it cannot express a range and
forces every action back to one row.

**Copy** — `POST /nodes/copy` `{ ids: string[], targetId: string }` → `FsNode[]`, mirroring
`/nodes/move`. One `prisma.$transaction`: walk the subtree, `resolveUniqueName` per created row,
`CopyObject` (`CopySource: {bucket}/{dataRoomId}/{srcNodeId}` → `{dataRoomId}/{newNodeId}`) before
each file row, and on any failure delete the objects written so far so nothing is orphaned (BR-060).
`400 INVALID_MOVE` for a target inside the copied subtree, `404 NOT_FOUND` for a foreign id
(BR-010), `403 READ_ONLY` for a share principal via the `write` capability (BR-070).

**Usage** — `GET /data-rooms/:id/usage` → `{ bytes, files }` from one flat aggregate:

```sql
SELECT count(*)::int AS files, coalesce(sum("sizeBytes"), 0)::bigint AS bytes
FROM "Node" WHERE "dataRoomId" = $1 AND "type" = 'FILE';
```

Rejected: the FR-ACCT-020 recursive CTE seeded from the root — every node already carries
`dataRoomId`, so the walk buys nothing and costs a recursion. `bytes` crosses the boundary through
the one BigInt serialiser. Query key `['usage', dataRoomId]`, invalidated by every write.

**Bulk download** — N presigned `GET /files/:id/download` navigations, folders skipped. Rejected:
a server zip — no such endpoint in docs/03 and it would round-trip bytes through Nest.

**Theme / view mode** — Zustand slices persisted to `localStorage`, plus a tiny inline script in
`index.html` writing `.dark` on `<html>` before first paint.

## Risks / Trade-offs

- Sequential downloads look like a popup burst → cap the selection and stagger the navigations.
- `CopyObject` on a large subtree is N round-trips → bounded by the copy running in one request;
  no progress UI, so the toast reports only on completion.
- `Ctrl+A` / `Delete` colliding with browser or field defaults → the key handler ignores events
  originating in an input, textarea or inline rename (FR-VIEW-040).
- Range selection over an unloaded page selects only loaded rows → `Ctrl+A` is documented as
  "everything loaded in this folder", matching the spec's wording.

## Validation

`scripts/validate/ux-ui-polish.sh` proves at runtime: **FR-FILE-060** (copy, subtree copy, BR-020
suffixing, `400 INVALID_MOVE`, `404 NOT_FOUND`, `403 READ_ONLY`, BR-060 leaves nothing behind) and
**FR-ACCT-010** (totals, zeros, >4 GiB exactness, `404` for another owner and for a share token).

It cannot prove and therefore prints as the manual checklist: **FR-FILE-070** (click / Ctrl / Shift
/ Ctrl+A, bulk confirm, download burst), **FR-VIEW-010** (tiles toggle, persistence),
**FR-VIEW-030** (context menu, right-click selection rules), **FR-VIEW-040** (arrows, `Esc` order,
focus traps and return, `aria-label`s), **FR-VIEW-050** (OS default, override, no flash).
