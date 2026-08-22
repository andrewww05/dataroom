## Purpose

File rename in the listing, move to another folder via dialog or drag-and-drop, and delete with a
confirmation that states the precise blast radius. All three operations use the owner's existing
`PATCH /nodes/:id`, `POST /nodes/move` and `DELETE /nodes/:id` endpoints; this capability covers
the UI wiring and server-side cycle detection that were missing from earlier slices.

---

## ADDED Requirements

### Requirement: FR-FILE-030 — Rename a file

A file MUST be renamable inline in the listing. The file extension is preserved unless the user
deliberately changes it. Submitting applies `PATCH /nodes/:id` with the new name. BR-020 applies:
a collision is silently suffixed by the server and the toast shows the name actually saved.

#### Scenario: FR-FILE-030 happy path — file renamed, extension preserved

- **WHEN** the user edits a file name, removes the stem but keeps the extension `.pdf`, and confirms
- **THEN** `PATCH /nodes/:id` returns `200` with the new `name` ending in `.pdf`, the listing row
  updates to the returned name, and the inline editor closes

#### Scenario: FR-FILE-030 BR-020 — name collision auto-resolved

- **WHEN** the user renames a file to a name already taken in the same folder
- **THEN** `PATCH /nodes/:id` returns `200` with a suffixed name (e.g. `report (2).pdf`), and a
  toast reads "Saved as report (2).pdf"

#### Scenario: FR-FILE-030 invalid name — empty or illegal characters

- **WHEN** the user submits an empty name, or one containing `/` or `\`
- **THEN** `PATCH /nodes/:id` returns `400 INVALID_NAME` and the inline editor shows an error
  without navigating away

---

### Requirement: FR-FILE-040 — Delete a file with confirm

Deleting a file MUST open a confirm dialog (BR-030). Because a file is a single node, the stats are
trivially 0 folders / 1 file / N bytes; the dialog also shows the count of active shares on that
node (if any). Confirming calls `DELETE /nodes/:id` which removes the row and the blob.

#### Scenario: FR-FILE-040 happy path — file deleted after confirm

- **WHEN** the user selects a file, clicks Delete, and confirms in the dialog
- **THEN** `DELETE /nodes/:id` returns `204`, the row disappears from the listing, and a success
  toast is shown

#### Scenario: FR-FILE-040 BR-030 — active shares count shown

- **WHEN** a file has 2 active shares and the user opens its delete dialog
- **THEN** the dialog reads "This also revokes 2 links" in addition to the file name and size

#### Scenario: FR-FILE-040 cancel — no change

- **WHEN** the user opens the delete dialog and clicks Cancel
- **THEN** no `DELETE` request is sent and the file remains in the listing

---

### Requirement: FR-FILE-050 — Move via dialog and drag-onto-folder

Files (and folders) MUST be movable to another folder through the "Move to…" dialog or by dragging
the item onto a folder row in the listing or the sidebar tree. Both paths call `POST /nodes/move`.

The dialog renders the FR-NAV-010 folder tree as a picker. The current parent folder is disabled
and labelled "current folder". For a folder being moved, itself and all its descendants are also
disabled (cycle prevention). The Move button is inactive until a valid target is selected.

Dragging a listing row onto a folder row is an alternative entry point to the same mutation without
opening the dialog.

BR-020 applies: if a name collision occurs at the target, the server resolves it by suffixing, the
response carries the names actually used, and a toast confirms the move and any renamed items.

#### Scenario: FR-FILE-050 happy path — item moved via dialog

- **WHEN** the user opens "Move to…" on a file, picks a different folder, and clicks Move
- **THEN** `POST /nodes/move` returns `200` with `FsNode[]`, the item disappears from the source
  listing, and a toast confirms the move destination

#### Scenario: FR-FILE-050 drag-onto-folder — item moved without dialog

- **WHEN** the user drags a listing row and drops it onto a folder row in the listing
- **THEN** `POST /nodes/move` is called with the dragged item's id and the target folder's id as
  `targetId`, returning `200`, and the item leaves the source listing

#### Scenario: FR-FILE-050 drag-onto-tree-node — item moved via sidebar

- **WHEN** the user drags a listing row and drops it onto a sidebar tree node (folder)
- **THEN** `POST /nodes/move` is called and the item leaves the source listing

#### Scenario: FR-FILE-050 current-parent disabled — picker blocks no-op

- **WHEN** the user opens "Move to…" on a node
- **THEN** the current parent row in the picker is disabled and the Move button stays inactive if
  no other folder is selected

#### Scenario: FR-FILE-050 BR-020 name collision at target

- **WHEN** moving a file results in a name collision at the target
- **THEN** `POST /nodes/move` returns `200` with a suffixed name, and a toast reads "Moved as
  report (2).pdf"
