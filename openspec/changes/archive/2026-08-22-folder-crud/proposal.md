## Why

Slices 1–4 deliver infrastructure, auth, the nodes read side, and the web shell. The listing is
now visible and navigable, but users cannot create, rename or delete folders. Slice 5 completes
the folder write surface: without it the Data Room is read-only and the app is not demonstrable.
The BR-020 name-suffixing helper is also written once here, because create, rename, upload, move
and copy all need it and separate implementations will drift.

## What Changes

Slice 5 of `docs/05-build-order.md`. Delivers `FR-FLDR-010`, `FR-FLDR-020`, `FR-FLDR-030`, and
the shared name-suffixing logic (`BR-020`).

**API — `apps/api`:**
- `POST /nodes/folders` — create a folder under a given parent; `FsNode` response.
- `PATCH /nodes/:id` — rename any node; enforces `INVALID_NAME`; suffixes on conflict.
- `DELETE /nodes/:id` — delete a node and its whole subtree; fetches storage keys first then
  cascades; 204 response.
- One shared `resolveUniqueName(tx, dataRoomId, parentId, name, excludeId?)` helper used by every
  write path — never a second implementation elsewhere.

**Web — `apps/web`:**
- **New folder** — toolbar button opens `NewFolderDialog`; on success the listing and tree
  invalidate and the new row is selected; toast shows actual name if suffixed.
- **Rename** — F2 / toolbar / double-click on `NodeNameCell` opens inline rename or
  `RenameDialog` for a folder; same suffix toast.
- **Delete** — toolbar `Delete` opens `DeleteDialog` + `DeleteImpact`; the impact card fetches
  `GET /nodes/:id/stats` and keeps the confirm button disabled until the numbers arrive (BR-030).

## Capabilities

### New Capabilities
- `folders`: Create, rename, and delete folders, including the BR-020 suffixing helper and the
  BR-030 stats-preflight delete dialog.

### Modified Capabilities
- `navigation`: `NodeNameCell` gains inline-rename affordance (F2 key handler, blur-to-cancel);
  `ListingToolbar` gains New-folder, Rename and Delete buttons — requirement changes to
  `FR-NAV-040` toolbar contents.

## Impact

- New: `src/nodes/nodes.controller.ts`, `src/nodes/nodes.service.ts`,
  `src/nodes/nodes.module.ts`, `src/nodes/dto/` (create, rename DTOs),
  `src/nodes/name.helper.ts`.
- Modified: `apps/web` toolbar, listing row, `NewFolderDialog`, `RenameDialog`, `DeleteDialog`,
  `DeleteImpact` components and their backing hooks.
- `packages/shared`: no new types needed; `FsNode`, `NodeStats` and `ApiError` are sufficient.
- No new error codes: `INVALID_NAME` and `NOT_FOUND` are already in `docs/03`.
- No schema changes: cascade delete already set on the `Node` self-relation.

## Non-goals

- File upload / download (slice 6).
- Move dialog, drag-and-drop, cycle check (slice 8 — `FR-FLDR-040`).
- `FR-ACCT-020` details pane folder stats (slice 7).
- Multi-select, bulk delete (slice 14 — Polish).
