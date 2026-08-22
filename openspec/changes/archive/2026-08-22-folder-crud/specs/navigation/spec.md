## Context

Slice 4 (`web-shell`) built the listing panel and toolbar scaffolding. The toolbar currently has
no working write buttons — new folder, rename, and delete are affordances without backing
mutations. This delta adds them to the navigation capability.

## ADDED Requirements

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

---

### Requirement: BR-020 name-conflict toast

After a create or rename that results in a suffixed name (BR-020), the UI shows a toast:

> Saved as **Q1 (2)**.

The newly created or renamed node is scrolled into view and selected.

#### Scenario: BR-020 suffix toast shown

- **WHEN** the server returns a name that differs from what the user typed
- **THEN** a toast reads "Saved as \<actual-name\>." and the item is selected

#### Scenario: BR-020 no toast on exact match

- **WHEN** the server returns the same name the user typed
- **THEN** no suffix toast is shown (the normal success state is visible selection)

---

### Requirement: BR-030 delete dialog preflight

`DeleteDialog` calls `GET /nodes/:id/stats` before enabling its confirm button. The dialog reads
"Delete **\<name\>**? This removes \<folders\> folders and \<files\> files (\<bytes formatted\>).
This cannot be undone." The confirm button is disabled while the stats fetch is in flight.

#### Scenario: BR-030 confirm disabled while fetching

- **WHEN** the user opens the delete dialog
- **THEN** the confirm button is disabled until the stats response arrives

#### Scenario: BR-030 real counts shown

- **WHEN** the stats response arrives with `{ folders: 4, files: 37, bytes: 117964800 }`
- **THEN** the dialog reads "This removes 4 folders and 37 files (112 MB)."
