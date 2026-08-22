## ADDED Requirements

### Requirement: FR-FLDR-040 — Move a folder; cycle check

A folder MUST be movable to another folder through the "Move to…" dialog (same component as
FR-FILE-050) or by drag-onto-folder. The picker disables the folder being moved and all of its
descendants, so the invalid-target cases are unreachable from the UI. The server enforces the
constraint regardless: moving a folder into itself or into any of its descendants returns
`400 INVALID_MOVE`. BR-020 applies if a name collision occurs at the target.

#### Scenario: FR-FLDR-040 happy path — folder moved via dialog

- **WHEN** the user opens "Move to…" on a folder, picks a valid target, and clicks Move
- **THEN** `POST /nodes/move` returns `200` with `FsNode[]`, the folder disappears from the source
  listing, and a toast confirms the destination

#### Scenario: FR-FLDR-040 self-move rejected by server

- **WHEN** `POST /nodes/move` is called with a folder's own `id` also as `targetId`
- **THEN** the API returns `400 INVALID_MOVE` and no node is moved

#### Scenario: FR-FLDR-040 descendant-move rejected by server

- **WHEN** `POST /nodes/move` is called with `targetId` set to one of the folder's own descendants
- **THEN** the API returns `400 INVALID_MOVE` and no node is moved

#### Scenario: FR-FLDR-040 picker disables self and descendants

- **WHEN** the user opens "Move to…" on a folder
- **THEN** the picker row for that folder and each of its known descendants is disabled (no-click,
  visually distinct), so `INVALID_MOVE` is unreachable from normal interaction

#### Scenario: FR-FLDR-040 BR-020 name collision at target

- **WHEN** moving a folder results in a name collision at the target
- **THEN** `POST /nodes/move` returns `200` with a suffixed name, and a toast confirms the move
  with the name actually used

---

### Requirement: FR-FLDR-020 — Rename a folder (UI wiring)

Folder rename via `PATCH /nodes/:id` was available in the API; this change MUST wire the same inline
rename UI as FR-FILE-030. BR-020 applies.

#### Scenario: FR-FLDR-020 happy path — folder renamed

- **WHEN** the user activates rename on a folder and submits a new name
- **THEN** `PATCH /nodes/:id` returns `200` with the updated `name`, the listing row and any
  breadcrumb segment update to the returned name, and the sidebar tree node refreshes

#### Scenario: FR-FLDR-020 BR-020 — name collision auto-resolved

- **WHEN** the user renames a folder to a name already taken in the same parent
- **THEN** `PATCH /nodes/:id` returns `200` with a suffixed name and a toast shows the name used
