## 1. API — Cycle check in NodesService.move()

- [x] 1.1 In `apps/api/src/nodes/nodes.service.ts`, add a cycle check at the top of `move()`: for
  each folder id in `ids`, resolve its ancestor path using the existing `getPath()` helper; if
  `targetId` equals any ancestor id (including the node itself), throw `InvalidMoveException`
  (`400 INVALID_MOVE`). The check runs before the transaction opens (BR-060).
- [x] 1.2 Add a unit test in `apps/api/src/nodes/` (or extend an existing spec) covering:
  self-move → `INVALID_MOVE`; descendant-move → `INVALID_MOVE`; valid move → succeeds.
  This is the BR-060 test for the move transaction boundary.

## 2. Web — Mutation hooks

- [x] 2.1 Create `apps/web/src/hooks/useRename.ts` — wraps `PATCH /nodes/:id` with
  TanStack Query `useMutation`, invalidates `['children', parentId]` and `['path', id]` on
  success, shows a toast with the name actually returned by the server (BR-020).
- [x] 2.2 Create `apps/web/src/hooks/useMove.ts` — wraps `POST /nodes/move` with `useMutation`,
  invalidates `['children', sourceParentId]` and `['children', targetId]` on success, shows a
  toast confirming the destination and any renamed items (BR-020).
- [x] 2.3 Ensure `apps/web/src/hooks/useDelete.ts` (or extend the existing delete call in
  the toolbar/dialog) invalidates `['children', parentId]` and `['stats', …ancestors]` on `204`.

## 3. Web — Inline rename in NodeRow

- [x] 3.1 In `apps/web/src/components/` (e.g. `NodeNameCell.tsx`), convert the name cell into an
  inline `<input>` when in rename mode. Rename mode is entered by `F2` or by clicking the name
  of the already-selected row. `Esc` cancels without saving; `Enter` or blur submits via
  `useRename`. The extension is stripped from the editable stem for files and re-appended on
  submit (FR-FILE-030).
- [x] 3.2 Wire the existing `RenameDialog` (used from the toolbar Rename button) through the same
  `useRename` hook so both paths share one mutation (FR-FLDR-020).

## 4. Web — DeleteDialog with stats and share count

- [x] 4.1 Extend `apps/web/src/components/dialogs/DeleteDialog.tsx` to fetch
  `GET /nodes/:id/stats` and `GET /nodes/:id/shares` when the dialog opens. Keep the confirm
  button disabled until both resolve. Show recursive counts (folders, files, bytes) for folders;
  for a file show 1 file and its size. If `shares.own.length > 0`, add "This also revokes N links"
  (BR-030, FR-FILE-040).
- [x] 4.2 Wire the toolbar Delete action to open `DeleteDialog` for files as well as folders.

## 5. Web — MoveDialog and FolderPicker

- [x] 5.1 Create `apps/web/src/components/dialogs/MoveDialog.tsx` — a shadcn Dialog wrapping
  `FolderPicker`. Opens with the node(s) to move; calls `useMove` on confirm. Shows the selected
  target name and disables the Move button until a valid folder is chosen (FR-FILE-050,
  FR-FLDR-040).
- [x] 5.2 Create `apps/web/src/components/dialogs/FolderPicker.tsx` — a lazy-expanding folder
  tree using `GET /nodes/:id/children?type=FOLDER`. Disabled rows: the current parent (labelled
  "current folder") and, for a folder being moved, itself and its loaded descendants. On select,
  calls back with the target `FsNode` (FR-FILE-050 picker, FR-FLDR-040 cycle prevention in UI).
- [x] 5.3 Wire the toolbar "Move" button to open `MoveDialog` for the selected node.

## 6. Web — Drag-onto-folder

- [x] 6.1 In `apps/web/src/components/` (listing row and/or `NodeRow`), add `draggable` and
  `onDragStart` to set `dragData = { ids: [node.id] }` in `dataTransfer`. Add `onDragOver` /
  `onDrop` to folder rows in the listing and the sidebar tree; on drop, call `useMove` with the
  dragged ids and the drop target's id as `targetId`. Highlight the drop target with a CSS class
  during `dragover` (FR-FILE-050 drag-onto-folder).

## 7. Validation script

- [x] 7.1 Write `scripts/validate/file-and-folder-operations.sh` to the AGENTS.md contract:
  - Bash, `set -euo pipefail`, executable; `API_BASE_URL` from env (default
    `http://localhost:3000/api`).
  - Creates a fresh user + uploads a test file and folders via the API; deletes all on exit.
  - Asserts: FR-FILE-030 rename happy path; BR-020 collision suffix on rename; `400 INVALID_NAME`
    on empty name; FR-FILE-040 delete → `204`; FR-FILE-050 move file → `200`; BR-020 collision at
    move target; FR-FLDR-040 move folder happy path; `400 INVALID_MOVE` on self-move; `400
    INVALID_MOVE` on descendant-move; FR-FLDR-020 rename folder.
  - Manual checklist printed at end: inline rename with F2, Esc to cancel, drag-onto-folder in
    listing, drag-onto-folder in tree, confirm button disabled while stats load, disabled picker
    rows for cycle targets, toast with actual name used.
  - Verify it exits 0 against the running app before marking this task done.
