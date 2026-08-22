## ADDED Requirements

### Requirement: The open folder is the URL

The folder currently shown SHALL be identified by the URL — `/f/$folderId` — and `/` SHALL land in the
Data Room's own root folder (FR-NAV-020). Opening a folder SHALL change the URL, so Back, Forward,
reload and a pasted link all land in the same folder, and a listing SHALL never navigate to a URL the
application does not serve.

#### Scenario: FR-NAV-020 opening a folder changes the URL and the listing

- **WHEN** the owner opens a folder from the listing
- **THEN** the URL becomes that folder's own and the listing shows that folder's children — not a
  blank pane, and not the root's children again

#### Scenario: FR-NAV-020 the room's root is what `/` shows

- **WHEN** the signed-in owner loads `/`
- **THEN** they land in the Data Room's root folder, and the URL names that folder rather than staying
  at `/`

#### Scenario: FR-NAV-020 a pasted folder link lands in that folder

- **WHEN** a folder's URL is loaded directly, in a new tab or after a reload
- **THEN** the same folder's children are listed, with its breadcrumbs, without passing through the
  root first

#### Scenario: FR-NAV-020 Back and Forward walk the folders visited

- **WHEN** the owner opens two folders in turn and then presses Back
- **THEN** the previous folder's listing is shown, and Forward returns to the second

#### Scenario: BR-010 a folder the caller cannot have shows a way out, not a blank pane

- **WHEN** a URL names a folder id that does not exist or belongs to another Data Room, and the API
  answers `404 NOT_FOUND`
- **THEN** the screen says that folder could not be found and offers a way back to the Data Room —
  never a blank listing, a raw error, or an endless skeleton

#### Scenario: FR-NAV-020 a file id in a folder URL is not a listing

- **WHEN** a URL in the folder position names a file rather than a folder
- **THEN** the screen says it could not be shown as a folder and offers a way back, rather than
  listing nothing

## MODIFIED Requirements

### Requirement: Breadcrumb Navigation

The client application must display the current path in the folder hierarchy as interactive
breadcrumbs. The trail SHALL be the path the server reports for the open folder
(`GET /nodes/:id/path`), and its head segment SHALL be the Data Room's name (FR-ROOM-010) — never the
word "Root", and never a fixed placeholder standing in for the real path.

#### Scenario: FR-NAV-020 Breadcrumbs rendering

- **WHEN** the user navigates into a nested folder
- **THEN** the UI displays breadcrumbs reflecting the path from the root to the current folder.

#### Scenario: FR-NAV-020 Breadcrumb interaction

- **WHEN** the user clicks an ancestor folder in the breadcrumb trail
- **THEN** the application navigates to that folder's view.

#### Scenario: FR-ROOM-010 the head of the trail is the Data Room's name

- **WHEN** the owner is anywhere in the tree
- **THEN** the first breadcrumb segment is the Data Room's name, and no segment reads "Root" or
  "Current Folder"

#### Scenario: FR-NAV-020 the trail follows the folder that is open

- **WHEN** the owner moves between folders at different depths
- **THEN** the trail changes with them, one segment per ancestor, ending at the open folder

#### Scenario: FR-NAV-020 the root's own trail is one segment

- **WHEN** the owner is in the Data Room's root folder
- **THEN** the trail is the Data Room's name alone, with nothing after it
