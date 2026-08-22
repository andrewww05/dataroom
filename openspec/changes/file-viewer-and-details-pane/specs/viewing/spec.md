## ADDED Requirements

### Requirement: Opening a file shows it; downloading is a separate, deliberate act

Opening a file SHALL put its contents on screen and SHALL NOT start a download (FR-VIEW-060). The
gestures that open a file are double-click, `Enter` on a single selected file, and clicking the
details-pane preview. A download SHALL happen only when the owner activates a control that says
Download — in the toolbar or inside the viewer.

#### Scenario: FR-VIEW-060 double-clicking a file opens the viewer

- **WHEN** the owner double-clicks a file in the listing
- **THEN** a full-screen viewer opens over the listing showing that file, and no download begins —
  nothing is saved to the browser's downloads

#### Scenario: FR-VIEW-060 Enter opens the selected file

- **WHEN** exactly one file is selected and the owner presses `Enter`
- **THEN** the viewer opens on that file

#### Scenario: FR-VIEW-060 the details-pane preview opens the viewer

- **WHEN** the owner clicks the preview shown in the details pane for a selected file
- **THEN** the viewer opens on that file

#### Scenario: FR-VIEW-060 opening a folder is still navigation

- **WHEN** the owner double-clicks a folder, or presses `Enter` with one folder selected
- **THEN** the listing navigates into that folder and no viewer opens

#### Scenario: FR-VIEW-060 downloading is asked for, never implied

- **WHEN** the owner activates Download inside the viewer
- **THEN** the file is saved under the name it has in the Data Room, and the viewer stays open on it

---

### Requirement: The viewer renders each kind at full size, or says plainly that it cannot

The viewer SHALL render a PDF inline at full viewport height and an image fitted to the viewport
(FR-VIEW-060). Any other kind — plain text, CSV, Markdown, and the Office and OpenDocument formats —
SHALL show a type icon, the file's name and size, and a Download button, rather than an embed that
renders nothing. The bytes SHALL reach the browser from the object store, never through the API.

#### Scenario: FR-VIEW-060 a PDF renders inline

- **WHEN** the owner opens a PDF
- **THEN** its first page is visible at full viewport height without scrolling the page behind it,
  and the viewer's title is the file's name

#### Scenario: FR-VIEW-060 an image is fitted to the viewport

- **WHEN** the owner opens a PNG, JPEG, GIF or WebP
- **THEN** the whole image is visible, scaled down to fit rather than cropped or overflowing, on a
  dark backdrop

#### Scenario: FR-VIEW-060 a kind with no renderer is honest about it

- **WHEN** the owner opens a `.txt`, `.csv`, `.md`, `.docx` or `.odt` file
- **THEN** the viewer shows a type icon, the file's name and its size, and a Download button — and no
  empty frame, spinner that never resolves, or error

#### Scenario: BR-050 a preview that cannot be fetched fails visibly

- **WHEN** the URL the viewer was given is refused or unreachable
- **THEN** the viewer shows a message saying the file could not be loaded, with a way to retry and a
  Download button, and never a blank frame

#### Scenario: FR-VIEW-060 the bytes do not pass through the API

- **WHEN** a file is displayed in the viewer
- **THEN** the request that carries its bytes is not on the API's own origin

---

### Requirement: The viewer closes, steps through the folder, and lives in the URL

The viewer SHALL close on `Esc` and on its own close control, returning to the listing with the file
still selected (FR-VIEW-060). `←` and `→` SHALL step to the previous and next **file** of the same
folder in the order the listing shows, without returning to the listing. The open file SHALL be part
of the URL, so a viewer link opens the same file and the browser's Back closes the viewer.

#### Scenario: FR-VIEW-060 Esc closes the viewer

- **WHEN** the owner presses `Esc` in the viewer
- **THEN** the viewer closes, the listing is shown again, and the file that was open is the selected
  row

#### Scenario: FR-VIEW-060 the arrows step through the folder's files

- **WHEN** the owner presses `→` while viewing a file in a folder holding several files
- **THEN** the viewer shows the next file of that folder, its own name and Download now referring to
  that file — and the listing is never returned to in between

#### Scenario: FR-VIEW-060 stepping skips folders

- **WHEN** the folder holds folders as well as files and the owner steps through it
- **THEN** only files are shown, because a folder has nothing to render

#### Scenario: FR-VIEW-060 stepping stops at the ends

- **WHEN** the owner is viewing the last file of a folder
- **THEN** there is no next-file affordance to activate and `→` does nothing — it does not wrap
  around to the first file, and no disabled control is on display (BR-100)

#### Scenario: FR-VIEW-060 a viewer link opens the viewer

- **WHEN** a URL that names an open file is loaded directly by the signed-in owner
- **THEN** the viewer opens on that file over its own folder's listing

#### Scenario: FR-VIEW-060 Back closes the viewer rather than leaving the folder

- **WHEN** the owner opens the viewer from a listing and then presses the browser's Back
- **THEN** the viewer closes and the same folder's listing is shown

#### Scenario: FR-VIEW-060 a file the caller cannot have is refused, not half-rendered

- **WHEN** a viewer URL names a file id that does not exist or belongs to another Data Room
- **THEN** the viewer shows a not-found message with a way back to the folder, and no request for
  bytes is made (the API answers `404 NOT_FOUND` under BR-010)

---

### Requirement: One selected item reports itself in the details pane

Selecting exactly one item SHALL show a details pane carrying its name, its kind, and when it was
created and last modified (FR-VIEW-020). A **file** SHALL also show its size and a preview that opens
the viewer; a kind with no renderer SHALL show its type icon in place of the preview. A **folder**
SHALL instead show the recursive figures for what is inside it — folders, files and total bytes —
which SHALL be the same figures the delete dialog states (FR-ACCT-020, BR-030). With nothing selected
the pane SHALL show those figures for the open folder, so the pane is never blank.

#### Scenario: FR-VIEW-020 a selected file reports its own metadata

- **WHEN** the owner selects one file
- **THEN** the pane shows its name, that it is a file of its content type, its size, its created and
  modified dates, and a preview that opens the viewer when clicked

#### Scenario: FR-VIEW-020 a file with no renderer shows an icon, not an empty box

- **WHEN** the owner selects a `.docx` or `.csv` file
- **THEN** the pane shows that kind's type icon where the preview would be, and clicking it still
  opens the viewer

#### Scenario: FR-ACCT-020 a selected folder reports what is inside it

- **WHEN** the owner selects a folder holding nested folders and files at several depths
- **THEN** the pane shows the folder count, the file count and the total bytes for the whole subtree,
  and shows no size of its own

#### Scenario: FR-ACCT-020 an empty folder reports zeros, not a blank

- **WHEN** the owner selects a folder with nothing in it
- **THEN** the pane shows zero folders, zero files and zero bytes

#### Scenario: FR-ACCT-020 the open folder's figures show when nothing is selected

- **WHEN** the owner has nothing selected in a folder
- **THEN** the pane shows that folder's own recursive figures rather than a placeholder telling the
  owner to select something

#### Scenario: BR-030 figures in flight are not guessed at

- **WHEN** the recursive figures for a selected folder have not arrived yet
- **THEN** the pane shows that they are loading and shows no number until the real one arrives —
  never a zero standing in for an unknown

#### Scenario: BR-050 figures that cannot be fetched fail visibly

- **WHEN** the request for a folder's recursive figures fails
- **THEN** the pane says the figures could not be loaded and offers a retry, and the rest of the
  pane's metadata is still shown

#### Scenario: BR-100 the pane offers nothing that does not work yet

- **WHEN** the details pane is shown for any selection
- **THEN** it contains no section, control or placeholder for sharing, versions or any other feature
  this change does not deliver
