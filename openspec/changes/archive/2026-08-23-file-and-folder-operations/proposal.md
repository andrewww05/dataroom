## Why

Slice 8 of docs/05-build-order.md. The app can display and view content but the owner cannot yet
reorganise it beyond creating new folders: there is no way to rename a file, no "Move to…" dialog,
no drag-onto-folder gesture, and delete requires no confirmation. This slice delivers the full
mutation surface for files and folders that the brief requires, making the Data Room genuinely usable
as an organising tool rather than just a viewer.

The `POST /nodes/move` endpoint already exists in the API (shipped in an earlier change), but no UI
calls it. The cycle-check for folder moves is not yet enforced. This change wires the UI to the
existing endpoint, adds the cycle check server-side, and builds the Move dialog and the drag target.

## What Changes

- **File rename** — inline rename in the listing row (`F2` / double-click name); the extension is
  preserved by default (FR-FILE-030). Uses the existing `PATCH /nodes/:id`.
- **Folder rename** — already available via `PATCH /nodes/:id`; this change ensures the UI wires it
  the same way as file rename (`F2` / rename toolbar action) (FR-FLDR-020).
- **Delete with confirm** — `DeleteDialog` already exists but does not yet show the BR-030 stats
  summary for files. This change ensures both files and folders show the recursive stats (file count,
  folder count, bytes) and active share count before confirming (FR-FILE-040, BR-030).
- **Move dialog** — new `MoveDialog` with `FolderPicker` (the FR-NAV-010 tree as a picker). Current
  parent and, for folders being moved, themselves and their descendants are disabled. Dispatches to
  `POST /nodes/move`. BR-020 name conflict is surfaced via toast (FR-FILE-050, FR-FLDR-040).
- **Drag-onto-folder** — dropping a listing item onto a folder row (tree or listing) triggers
  `POST /nodes/move` without opening the dialog (FR-FILE-050).
- **Cycle check** — server-side: moving a folder into itself or any of its descendants returns
  `400 INVALID_MOVE`. The picker disables those rows so the error is practically unreachable from
  the UI, but the server enforces it regardless (FR-FLDR-040).

## Capabilities

### New Capabilities

- `files/move`: "Move to…" dialog with tree picker, drag-onto-folder gesture, cycle check enforcement
- `files/delete-confirm`: Confirm dialog with BR-030 stats (file count, size, active share count)
- `files/rename`: Inline rename for files in the listing

### Modified Capabilities

- `folders`: FR-FLDR-020 (rename) and FR-FLDR-040 (move + cycle check) are now UI-wired

## Non-goals

This change does not touch:

- **Multi-select** (slice 14, Polish) — Move and Delete act on a single selection only.
- **Copy/paste** (slice 15, Polish) — no `POST /nodes/copy` wiring.
- **Keyboard navigation** (slice 16, Polish) — F2 and Delete keys are wired here as they are Core
  per FR-VIEW-040 context, but full arrow/Ctrl+A/Ctrl+X keyboard map is not.
- **Sharing** (slice 10) — share count in the delete dialog reads `GET /nodes/:id/shares` which
  already exists; no share creation or revocation is built here.
- **Context menu** (slice 14, Polish) — all actions remain toolbar-only.

## Impact

- `apps/api/src/nodes/nodes.service.ts` — cycle check in `move()`.
- `apps/web/src/components/dialogs/` — `MoveDialog`, `FolderPicker`, extended `DeleteDialog`.
- `apps/web/src/components/` — drag handlers on `NodeRow` and `FolderTreeNode`.
- `apps/web/src/hooks/` — `useMove`, `useRename`, `useDelete` mutation hooks.
- `packages/shared/` — no type additions needed; `FsNode[]` response from move already exists.
- `scripts/validate/file-and-folder-operations.sh` — mandatory runtime validation script.
