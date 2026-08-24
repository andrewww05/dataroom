## Context

The API already has `PATCH /nodes/:id` (rename), `POST /nodes/move { ids: string[], targetId }`,
and `DELETE /nodes/:id`. The `RenameDialog` and `DeleteDialog` components exist in
`apps/web/src/components/dialogs/` but the rename UI is modal-only and not yet wired for files, and
the delete dialog does not yet show stats for files. No `MoveDialog` or `FolderPicker` exists.
`POST /nodes/move` in `nodes.service.ts` does not yet run the cycle check.

Relevant endpoints and types (from docs/03):

- `PATCH /nodes/:id` — body `{ name }`, returns `FsNode`
- `POST /nodes/move` — body `{ ids: string[], targetId: string }`, returns `FsNode[]`
- `DELETE /nodes/:id` — returns `204`
- `GET /nodes/:id/stats` — returns `{ folders: number, files: number, bytes: number }`
- `GET /nodes/:id/shares` — returns `NodeShares { own: Share[], inheritedFrom: Breadcrumb | null }`
- `GET /nodes/:id/path` — returns `Breadcrumb[]`; the ancestor walk used for the cycle check
- Error code `INVALID_MOVE` — `400` when a folder is moved into itself or a descendant

## Goals / Non-Goals

**Goals:**

- Inline rename for files and folders (single component, same UX)
- `MoveDialog` with `FolderPicker` that lazy-loads the tree and enforces picker-level disabling
- Drag-onto-folder in the listing and the sidebar tree as a no-dialog shortcut for move
- `DeleteDialog` extended to show file stats and active share count (BR-030)
- Cycle check in `NodesService.move()` using the ancestor walk
- Validation script `scripts/validate/file-and-folder-operations.sh`

**Non-Goals:**

- Multi-select move/delete (slice 14)
- Copy/paste (slice 15)
- Context menu (slice 14)
- Full keyboard map (slice 16)

## Decisions

**1. Cycle check via ancestor walk, not a recursive CTE.**
`GET /nodes/:id/path` already walks child→root using the same CTE as breadcrumbs. The cycle check
in `NodesService.move()` calls that internal helper: if any id in `ids` appears in the ancestor
path of `targetId`, it throws `InvalidMoveException`. The alternative — a second recursive CTE
seeded at the moved node and walking downward — duplicates logic and is slower for shallow trees
(which is every real-world folder that isn't the root). The walker is already tested; the cycle
check adds one unit test.

**2. `FolderPicker` is a separate component from `FolderTree`.**
Disabled-row logic differs: the picker disables the current parent and (for a folder being moved)
itself and its descendants. The tree disables nothing. Sharing a component would need a complex
`disabledIds` prop that the tree never uses. Separate components keep both simpler; `FolderPicker`
reuses the same `GET /nodes/:id/children` query hook as the tree, so there is one data path.

**3. Inline rename, not a modal.**
`F2` / clicking the already-selected name converts the listing name cell into an `<input>`. This
matches the UX spec (docs/04) and avoids opening a dialog for what is a one-field operation.
`RenameDialog` stays for the toolbar action path (click Rename button), which is still needed
because the name cell is not always reachable without first selecting. Both paths call the same
`useRename` mutation hook.

**4. Delete stats fetch inside the dialog, not before it.**
`DeleteImpact` (per the component inventory in docs/04) owns the `GET /nodes/:id/stats` and
`GET /nodes/:id/shares` fetches. The confirm button is disabled until both resolve. This keeps
the main listing unaware of pending deletions. The alternative — fetching before opening the
dialog — would delay the open feel for a slow network with no benefit.

## Invariants upheld

- **BR-020** — rename and move both go through `resolveUniqueName`, the single helper already
  unit-tested in `name.helper.spec.ts`. The response carries the name used; the toast echoes it.
- **BR-030** — `DeleteDialog` now shows stats for files and folders. A file always reads 0 folders
  / 1 file / N bytes; a folder reads the recursive result. Active share count from
  `GET /nodes/:id/shares` is shown as "This also revokes N links" when N > 0.
- **BR-060** — move runs in one Prisma transaction in `NodesService.move()`; this change adds the
  cycle check before the transaction begins, so a rejected move touches no rows.

## Risks / Trade-offs

- **Drag discovery** — drag-and-drop is not discoverable from the keyboard and cannot be the only
  path to move (FR-FILE-050 requires the dialog too). Both are implemented; neither is the
  only path.
- **Picker tree depth** — `FolderPicker` lazy-loads children the same way `FolderTree` does: one
  `GET /nodes/:id/children` per expand. For a very deep tree the user may need several clicks to
  reach the target. Acceptable at this scale; a flat search input in the picker is slice 13 work.

## Validation script coverage

The script (`scripts/validate/file-and-folder-operations.sh`) proves via the HTTP API:

- FR-FILE-030 — rename file, extension preserved; BR-020 collision suffixing; `400 INVALID_NAME`
- FR-FILE-040 — delete file returns `204`; cancel leaves the file; share count in dialog (manual)
- FR-FILE-050 — move file via `POST /nodes/move`; BR-020 collision at target; current-parent check
- FR-FLDR-040 — move folder; `400 INVALID_MOVE` on self-move; `400 INVALID_MOVE` on descendant-move
- FR-FLDR-020 — rename folder; BR-020 on folder rename

Cannot be proven by the script (manual checklist printed at the end):

- Inline rename UX: `F2` key, click-on-selected-name, Esc to cancel
- Drag-onto-folder in listing and sidebar tree
- Confirm button disabled while stats load
- Picker rows visually disabled for cycle targets
- Toast text with the name actually used
