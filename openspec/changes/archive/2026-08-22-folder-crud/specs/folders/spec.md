## Purpose

The folder capability covers creating, renaming, and deleting folders in the Data Room tree.
It also introduces the BR-020 `resolveUniqueName` helper that every subsequent write path
(rename, move, upload, copy) reuses — writing it once here avoids four ad-hoc versions later.

## ADDED Requirements

### Requirement: FR-FLDR-010 — Create folder

The owner may create a new folder inside any folder in their Data Room. `POST /nodes/folders`
accepts `{ parentId, name }` and returns `FsNode`. The name is validated per BR-020 before
persistence; a conflict is resolved by suffixing, and the response carries the name actually used.
Nesting is unlimited in the model; the UI caps new folder paths at 32 levels (FR-FLDR-010).

#### Scenario: FR-FLDR-010 happy path

- **WHEN** the owner posts `{ parentId, name: "Financials" }` to `POST /nodes/folders`
- **THEN** the server responds `201` with an `FsNode` of type `FOLDER`, `name: "Financials"`,
  the given `parentId`, and the correct `dataRoomId`.

#### Scenario: FR-FLDR-010 depth guard — name validation

- **WHEN** the owner posts a `name` that is empty, `"."`, `".."`, or contains `/` or `\`
- **THEN** the server responds `400 INVALID_NAME`

#### Scenario: FR-FLDR-010 depth guard — name too long

- **WHEN** the owner posts a `name` longer than 255 characters
- **THEN** the server responds `400 INVALID_NAME`

#### Scenario: FR-FLDR-010 name conflict is suffixed

- **WHEN** the owner posts `{ parentId, name: "Q1" }` and `"Q1"` already exists in that folder
- **THEN** the server responds `201` with `name: "Q1 (2)"` (or the next available suffix)

#### Scenario: FR-FLDR-010 parent not found

- **WHEN** the owner posts `{ parentId: "<unknown-id>", name: "X" }`
- **THEN** the server responds `404 NOT_FOUND`

#### Scenario: FR-FLDR-010 parent belongs to another room

- **WHEN** the owner posts a `parentId` that exists but belongs to a different Data Room
- **THEN** the server responds `404 NOT_FOUND` (BR-010)

---

### Requirement: FR-FLDR-020 — Rename folder

The owner may rename any folder. `PATCH /nodes/:id` accepts `{ name }` and returns the updated
`FsNode`. The same name-validation and BR-020 suffixing rules apply as for create. The root node
may not be renamed (it is renamed via `PATCH /data-rooms/:id`).

#### Scenario: FR-FLDR-020 happy path

- **WHEN** the owner patches `{ name: "Financials 2024" }` on an existing folder node
- **THEN** the server responds `200` with `FsNode` carrying the new `name` and an updated
  `updatedAt`

#### Scenario: FR-FLDR-020 name conflict is suffixed

- **WHEN** the rename would collide with a sibling
- **THEN** the server responds `200` with the suffixed name (e.g. `"Financials 2024 (2)"`)

#### Scenario: FR-FLDR-020 invalid name is rejected

- **WHEN** the owner patches `{ name: "" }` or a name containing `/`
- **THEN** the server responds `400 INVALID_NAME`

#### Scenario: FR-FLDR-020 not found

- **WHEN** the requested node id does not exist or is in another room
- **THEN** the server responds `404 NOT_FOUND` (BR-010)

---

### Requirement: FR-FLDR-030 — Delete folder with stats preflight

The owner may delete any folder (or file). `DELETE /nodes/:id` responds `204` and cascades the
whole subtree plus all `Share` rows on every node in it. Before deleting, the client fetches
`GET /nodes/:id/stats` and shows the real counts in the confirm dialog (BR-030). The server does
not gate delete on the preflight having been called; authorization and existence are the only
server-side checks.

#### Scenario: FR-FLDR-030 happy path

- **WHEN** the owner deletes a folder with children
- **THEN** the server responds `204`; subsequent `GET /nodes/:id` on the deleted folder and any
  descendant returns `404 NOT_FOUND`

#### Scenario: FR-FLDR-030 not found

- **WHEN** the owner deletes a node that does not exist or is in another room
- **THEN** the server responds `404 NOT_FOUND` (BR-010)

#### Scenario: FR-FLDR-030 stats endpoint returns real counts

- **WHEN** the client calls `GET /nodes/:id/stats` on a folder containing 4 sub-folders and 37
  files totalling 112 MB
- **THEN** the server responds `200 { folders: 4, files: 37, bytes: 117964800 }` (BR-030)

---

### Requirement: BR-020 — Name-uniqueness helper (shared)

One `resolveUniqueName(tx, dataRoomId, parentId, name, excludeId?)` function is the single
implementation for all write paths. The function:
1. Trims the name; rejects empty, `.`, `..`, names containing `/` or `\`, names longer than 255
   characters with `INVALID_NAME`.
2. Checks for a case-insensitive collision in `(dataRoomId, parentId)`.
3. On collision, splits `name` into stem + extension (last `.` after the first character), appends
   ` (2)`, ` (3)`, … before the extension and retries until no collision.
4. Returns the resolved name; callers persist it and include it in the response.

#### Scenario: BR-020 no extension

- **WHEN** `"Q1 Reports"` collides and has no extension
- **THEN** the helper returns `"Q1 Reports (2)"`

#### Scenario: BR-020 with extension

- **WHEN** `"statement.pdf"` collides twice
- **THEN** the helper returns `"statement (3).pdf"`

#### Scenario: BR-020 case-insensitive check

- **WHEN** `"financials"` is submitted and `"Financials"` exists in the same folder
- **THEN** the helper considers it a collision and suffixes
