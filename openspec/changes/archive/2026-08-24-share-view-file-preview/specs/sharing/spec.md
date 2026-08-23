## ADDED Requirements

### Requirement: Opening a file in the shared view shows it, it does not download it

The shared view at `/s/{token}` SHALL open a file in the same full-screen viewer the owner's view
uses, with the same open gestures and the same render behaviour already recorded in the viewing
capability — PDF inline, images fitted, video and audio with native controls, plain text verbatim,
and the honest icon-plus-Download fallback for everything else (FR-SHARE-070, FR-VIEW-060). A share
on a **file** SHALL land in the viewer directly, because the shared node is the file and there is
nothing to browse. A share on a **folder** SHALL open the viewer on double-click of a file row, the
same gesture the owner uses.

Opening SHALL NOT start a download. A download SHALL happen only when the visitor activates the
Download control inside the viewer, and it SHALL save the file under the name it has in the Data
Room.

The bytes SHALL travel from the object store to the browser over a short-lived inline URL and SHALL
NOT be routed through the API (BR-050), exactly as for the owner. No control that writes — rename,
move, delete, upload, share — SHALL appear anywhere in the shared viewer (FR-SHARE-070, BR-070).

#### Scenario: FR-SHARE-070 a shared image opens in the viewer rather than as a download card

- **WHEN** a visitor opens a PUBLIC link to a shared PNG while signed in to nothing
- **THEN** the image is shown fitted to the viewport, and nothing is saved to the browser's downloads

#### Scenario: FR-SHARE-070 a shared PDF renders inline for an anonymous visitor

- **WHEN** a visitor holding a PUBLIC link to a shared PDF opens it
- **THEN** the document renders inline at full height, and the file's name is the viewer's title

#### Scenario: FR-SHARE-070 double-clicking a file inside a shared folder opens the viewer

- **WHEN** a visitor browsing a shared folder double-clicks a file row
- **THEN** the viewer opens over the shared listing on that file, and the listing does not navigate

#### Scenario: FR-SHARE-070 double-clicking a folder inside a shared folder is still navigation

- **WHEN** a visitor browsing a shared folder double-clicks a folder row
- **THEN** the shared listing navigates into that folder and no viewer opens

#### Scenario: FR-SHARE-070 the arrows step through the shared folder's files

- **WHEN** a visitor viewing a file in a shared folder holding several files presses `→`
- **THEN** the viewer shows the next file of that folder, skipping folders, and stops at the last
  file without wrapping and without a disabled control on display (BR-100)

#### Scenario: FR-SHARE-070 closing the shared viewer returns to the shared listing

- **WHEN** a visitor presses `Esc` or activates the close control in the shared viewer
- **THEN** the viewer closes and the shared listing is shown at the folder it was opened from,
  breadcrumbs still stopping at the shared root

#### Scenario: FR-SHARE-070 a file share has no close control, because there is nothing behind it

- **WHEN** the shared node is a file, so the viewer is the whole screen rather than an overlay over a
  listing
- **THEN** no close control and no stepping arrows are on display, since there is no listing to
  return to and no sibling file to step to — and no disabled control stands in their place (BR-100)

#### Scenario: FR-SHARE-070 Download inside the shared viewer still saves the file

- **WHEN** a visitor activates Download inside the shared viewer
- **THEN** the file is saved under the name it has in the Data Room and the viewer stays open on it

#### Scenario: FR-SHARE-070 an unrenderable type shows the honest fallback, not an empty frame

- **WHEN** a visitor opens a shared `.docx`, `.xlsx` or other type the browser cannot render
- **THEN** the viewer shows a type icon, the file's name and size, and a Download button — no empty
  frame and no spinner that never resolves

#### Scenario: FR-SHARE-070 no write affordance is reachable from the shared viewer

- **WHEN** a visitor has the shared viewer open on any file
- **THEN** the only actions on screen are Download, close and stepping between files — no rename,
  move, delete, upload or share control exists

### Requirement: A shared preview is authorized by the share token, never by a signed-in session

The inline URL the shared viewer renders SHALL be obtained by presenting the share token, so a
visitor who is signed in to nothing can view a PUBLIC share (FR-SHARE-020, BR-010, BR-070). A
`RESTRICTED` share SHALL additionally require the matching signed-in grantee, exactly as every other
read route in the shared subtree does. A preview request for a node outside the shared subtree SHALL
be refused with `404 NOT_FOUND`, never `403`, and no URL SHALL be handed out (BR-010).

#### Scenario: FR-SHARE-020 an anonymous visitor previews a PUBLIC shared file

- **WHEN** `GET /api/files/:id/preview` is called with `Authorization: Share <public-token>` and no
  signed-in session, for a file inside that share's subtree
- **THEN** the response is `200` carrying an inline URL and the moment it expires

#### Scenario: BR-010 a preview outside the shared subtree is refused

- **WHEN** `GET /api/files/:id/preview` is called with a share token for a file that sits outside
  that share's subtree, or in another Data Room
- **THEN** the response is `404` with code `NOT_FOUND`, never `403`, and no URL is handed out

#### Scenario: FR-SHARE-020 a RESTRICTED preview without the matching grantee is refused

- **WHEN** `GET /api/files/:id/preview` is called with a `RESTRICTED` share token and no signed-in
  session
- **THEN** the response is `401` with code `SIGN_IN_REQUIRED` and no URL is handed out

#### Scenario: FR-SHARE-050 a preview on a revoked or expired share is refused

- **WHEN** the owner revokes the share, or its expiry passes, and a preview is then requested with
  that token
- **THEN** the response is `401` with code `UNAUTHENTICATED`, so a viewer left open on the screen
  cannot keep signing fresh URLs after access ends

#### Scenario: BR-050 a shared preview that cannot be fetched fails visibly

- **WHEN** the URL the shared viewer was given is refused or unreachable
- **THEN** the viewer shows a message saying the file could not be loaded, with a way to retry and a
  Download button, and never a blank frame
