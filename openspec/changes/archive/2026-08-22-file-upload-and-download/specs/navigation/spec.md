## MODIFIED Requirements

### Requirement: Navigation toolbar write actions (FR-FLDR-010, FR-FLDR-020, FR-FLDR-030)

The `ListingToolbar` SHALL offer these actions, each present only when the selection state warrants
it:

- **New folder** — always visible; opens `NewFolderDialog`.
- **Upload** — always visible; opens the file picker for the folder currently shown (FR-FILE-010).
- **Rename** — visible when exactly one folder is selected; opens `RenameDialog` (or
  `NodeNameCell` inline rename on F2).
- **Download** — visible when the selection is one or more files and no folder (FR-FILE-020).
- **Delete** — visible when one or more items are selected (files and folders alike); opens
  `DeleteDialog`.

Toolbar buttons SHALL never be disabled or greyed out for write actions — per BR-100, an action that
cannot be performed is hidden, not greyed. Download SHALL be a toolbar action and never the result
of opening an item.

#### Scenario: FR-FLDR-010 new folder button visible

- **WHEN** the user is in any folder (with or without a selection)
- **THEN** the toolbar shows a **New folder** button

#### Scenario: FR-FILE-010 upload button visible

- **WHEN** the user is in any folder (with or without a selection)
- **THEN** the toolbar shows an **Upload** button

#### Scenario: FR-FLDR-020 rename button visible only with single folder selection

- **WHEN** exactly one folder is selected
- **THEN** the toolbar shows a **Rename** button

#### Scenario: FR-FLDR-020 rename button absent for multi-selection

- **WHEN** more than one item is selected
- **THEN** the toolbar does **not** show a Rename button

#### Scenario: FR-FILE-020 download button visible for a file selection

- **WHEN** the selection is one or more files and contains no folder
- **THEN** the toolbar shows a **Download** button

#### Scenario: FR-FILE-020 download button absent when a folder is selected

- **WHEN** the selection is empty, or contains a folder
- **THEN** the toolbar does **not** show a Download button — it is absent rather than greyed
  (BR-100)

#### Scenario: FR-FLDR-030 delete button visible with any selection

- **WHEN** one or more items are selected
- **THEN** the toolbar shows a **Delete** button
