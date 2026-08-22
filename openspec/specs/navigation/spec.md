## Purpose

Answers "where am I and what is here" for one Data Room: reading a single node, walking one folder's
children a bounded page at a time in a stable order, and naming the trail from the Data Room down to
whatever is open, so a link, a reload and a back button all land in the same place.

## Requirements

### Requirement: One node is readable by its id

The API SHALL return a single node by id as one shape covering both kinds: its id, its parent's id
or nothing for the room's root, whether it is a folder or a file, its name, and — for a file only —
its byte size and content type, plus when it was created and last changed (FR-NAV-020, FR-VIEW-020).
Byte sizes SHALL be plain JSON numbers, not strings or objects, so a client can arithmetic on them
without decoding.

#### Scenario: FR-NAV-020 a folder reads back with no file fields

- **WHEN** a folder is read by id
- **THEN** the response is `200`, reports the folder kind, its name and its parent's id, and its
  size and content type are both null rather than absent or zero

#### Scenario: FR-VIEW-020 a file reads back with its size and content type

- **WHEN** a file is read by id
- **THEN** the response is `200`, reports the file kind, and carries its byte size as a JSON number
  and its content type as a string

#### Scenario: FR-NAV-020 the Data Room's root reports no parent

- **WHEN** the room's root node is read by id
- **THEN** the response is `200` and its parent's id is null, which is how a client recognises the
  top of the tree without being told the id in advance

#### Scenario: FR-ACCT-010 a size beyond 32 bits survives the round trip

- **WHEN** a file larger than 4 GiB is read by id
- **THEN** its size is returned exactly, as a JSON number, and no request in the surface fails on
  serialising it

### Requirement: A folder's children are read one ordered page at a time

The API SHALL return a folder's immediate children as a page of rows plus a cursor for the next
page, ordered folders-first and then by name ascending, with a stable tiebreak so no row is
returned twice or skipped (FR-NAV-030). A page SHALL default to 100 rows, SHALL NOT report a total
count of the folder's contents, and SHALL report the absence of a further page rather than an empty
one. The cost of a page SHALL NOT depend on how many rows the Data Room holds or on how deep into
the folder the page is.

#### Scenario: FR-NAV-030 the first page is folders first, then name ascending

- **WHEN** a folder holding a mix of folders and files is listed with no cursor
- **THEN** every folder appears before every file, each group ordered by name ascending, and the
  response carries a cursor because more rows remain

#### Scenario: FR-NAV-030 the cursor resumes exactly after the last row returned

- **WHEN** the cursor from one page is passed back
- **THEN** the next page begins with the row immediately after the previous page's last row, in the
  same order, and no row appears on both pages

#### Scenario: FR-NAV-030 walking to the end returns every row exactly once

- **WHEN** a folder holding more rows than one page is walked cursor by cursor to exhaustion
- **THEN** the concatenated pages are exactly that folder's children, each once, in the specified
  order, and the last page reports no next cursor

#### Scenario: FR-NAV-030 no page reports a total

- **WHEN** any page of any folder is read
- **THEN** the response carries only the rows and the next cursor — no count of the folder's
  contents, so no request pays for one

#### Scenario: FR-NAV-030 a caller may ask for a smaller page

- **WHEN** a page is requested with a row limit below the default
- **THEN** at most that many rows are returned and the cursor still resumes correctly from them

#### Scenario: FR-NAV-030 an unusable row limit is rejected

- **WHEN** a page is requested with a limit that is zero, negative, not a whole number, or above the
  maximum the endpoint accepts
- **THEN** the response is `400` with code `VALIDATION_FAILED` and `details` naming the limit, never
  a silently clamped page

#### Scenario: FR-NAV-030 a cursor that did not come from this endpoint is rejected

- **WHEN** a page is requested with a cursor that is corrupt, truncated, or does not decode to a
  position in this ordering
- **THEN** the response is `400` with code `VALIDATION_FAILED` naming the cursor, rather than
  silently paging from the beginning and hiding rows from a caller who thinks it resumed

#### Scenario: FR-NAV-010 children can be narrowed to folders

- **WHEN** a folder's children are listed with the kind narrowed to folders
- **THEN** only folders are returned, in the same order and with the same cursor behaviour, so a
  tree can load one level without reading the files in it

#### Scenario: FR-NAV-030 an unknown kind filter is rejected

- **WHEN** a page is requested narrowed to a kind the model does not define
- **THEN** the response is `400` with code `VALIDATION_FAILED` naming the field

#### Scenario: FR-NAV-030 another Data Room's rows never appear

- **WHEN** a folder is listed while other Data Rooms hold folders and files of their own, including
  ones whose names sort into the middle of this page
- **THEN** the page contains only rows from the caller's own room

#### Scenario: FR-NAV-030 an empty folder reports an empty page and no cursor

- **WHEN** a folder with no children is listed
- **THEN** the response is `200` with no rows and no next cursor

#### Scenario: FR-NAV-030 a file has no children

- **WHEN** a file's children are listed
- **THEN** the response is `200` with no rows and no next cursor, because nothing is inside a file —
  not an error and not the file itself

### Requirement: The trail from the Data Room to a node is readable

The API SHALL return the path from the Data Room down to a node as an ordered list of navigable
segments, the Data Room first and the node itself last, each carrying the id a client navigates to
and the name it displays (FR-NAV-020). The head segment SHALL carry the **Data Room's** name, never
the word "Root" and never a stored copy of that name that can fall behind a rename (FR-ROOM-010).

#### Scenario: FR-NAV-020 the path runs from the Data Room down to the node

- **WHEN** the path of a folder nested several levels deep is read
- **THEN** the segments are ordered outermost first, beginning with the Data Room and ending with
  that folder, with every intervening folder named in between and none missing

#### Scenario: FR-ROOM-010 the head segment is the Data Room, not "Root"

- **WHEN** the path of any node is read
- **THEN** the first segment's name is the Data Room's name, and no segment anywhere in the list is
  named "Root"

#### Scenario: FR-ROOM-010 the head segment follows the Data Room's name

- **WHEN** the Data Room's name is changed and a path is read again
- **THEN** the head segment shows the new name, because it is read from the room rather than copied
  at creation time

#### Scenario: FR-NAV-020 every segment is navigable

- **WHEN** the path of a nested folder is read
- **THEN** each segment carries an id that reads back as a node through this same surface, including
  the head segment, so every breadcrumb is a working link

#### Scenario: FR-NAV-020 the root's own path is one segment

- **WHEN** the path of the Data Room's root node is read
- **THEN** the response is a single segment, the Data Room itself

#### Scenario: FR-VIEW-020 a file's path ends at the file

- **WHEN** the path of a file is read
- **THEN** the last segment is the file and the one before it is its containing folder

#### Scenario: FR-FLDR-010 a deeply nested node still returns its whole path

- **WHEN** the path of a node 32 or more levels below the root is read
- **THEN** every level is returned in order, with no truncation and no recursion failure

### Requirement: Breadcrumb Navigation

The client application must display the current path in the folder hierarchy as interactive breadcrumbs.

#### Scenario: FR-NAV-020 Breadcrumbs rendering
- **WHEN** the user navigates into a nested folder
- **THEN** the UI displays breadcrumbs reflecting the path from the root to the current folder.

#### Scenario: FR-NAV-020 Breadcrumb interaction
- **WHEN** the user clicks an ancestor folder in the breadcrumb trail
- **THEN** the application navigates to that folder's view.

### Requirement: Navigation toolbar write actions (FR-FLDR-010, FR-FLDR-020, FR-FLDR-030)

The `ListingToolbar` gains three active buttons when the selection state warrants it:

- **New folder** — always visible; opens `NewFolderDialog`.
- **Rename** — visible when exactly one folder is selected; opens `RenameDialog` (or
  `NodeNameCell` inline rename on F2).
- **Delete** — visible when one or more items are selected (files in slice 6; folders here);
  opens `DeleteDialog`.

Toolbar buttons are never disabled or greyed out for write actions — per BR-100, actions that
cannot be performed are hidden, not greyed.

#### Scenario: FR-FLDR-010 new folder button visible

- **WHEN** the user is in any folder (with or without a selection)
- **THEN** the toolbar shows a **New folder** button

#### Scenario: FR-FLDR-020 rename button visible only with single folder selection

- **WHEN** exactly one folder is selected
- **THEN** the toolbar shows a **Rename** button

#### Scenario: FR-FLDR-020 rename button absent for multi-selection

- **WHEN** more than one item is selected
- **THEN** the toolbar does **not** show a Rename button

#### Scenario: FR-FLDR-030 delete button visible with any selection

- **WHEN** one or more items are selected
- **THEN** the toolbar shows a **Delete** button

### Requirement: BR-020 name-conflict toast

After a create or rename that results in a suffixed name (BR-020), the UI shows a toast:
> Saved as **Q1 (2)**.

The newly created or renamed node is scrolled into view and selected.

#### Scenario: BR-020 suffix toast shown

- **WHEN** the server returns a name that differs from what the user typed
- **THEN** a toast reads "Saved as \\<actual-name\\>." and the item is selected

#### Scenario: BR-020 no toast on exact match

- **WHEN** the server returns the same name the user typed
- **THEN** no suffix toast is shown (the normal success state is visible selection)

### Requirement: BR-030 delete dialog preflight

`DeleteDialog` calls `GET /nodes/:id/stats` before enabling its confirm button. The dialog reads
"Delete **\\<name\\>**? This removes \\<folders\\> folders and \\<files\\> files (\\<bytes formatted\\>).
This cannot be undone." The confirm button is disabled while the stats fetch is in flight.

#### Scenario: BR-030 confirm disabled while fetching

- **WHEN** the user opens the delete dialog
- **THEN** the confirm button is disabled until the stats response arrives

#### Scenario: BR-030 real counts shown

- **WHEN** the stats response arrives with `{ folders: 4, files: 37, bytes: 117964800 }`
- **THEN** the dialog reads "This removes 4 folders and 37 files (112 MB)."
