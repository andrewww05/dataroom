## Purpose

Answers what a caller is told about an item beyond its own row — today the recursive figures behind
a folder's details pane and the blast radius every delete has to state: how many folders, how many
files and how many bytes are inside it.

## Requirements

### Requirement: A node's contents are counted and totalled on demand

The API SHALL report, for one node, the number of folders, the number of files and the total bytes
**inside** it — its whole subtree at any depth, not merely its immediate children — computed in one
request rather than by walking the tree from the client (FR-ACCT-020). The figures SHALL describe the
contents and SHALL NOT count the node itself, so they can be read aloud as "this removes N folders
and M files (X bytes)" without arithmetic (BR-030). The figures SHALL be exact, never sampled,
estimated or capped, and SHALL be reported only when asked for — never attached to a listing row.

#### Scenario: FR-ACCT-020 a folder reports its whole subtree, not just its children

- **WHEN** the contents of a folder holding nested folders, and files several levels below it, are
  read
- **THEN** the folder count, file count and byte total cover every descendant at every depth

#### Scenario: FR-ACCT-020 the node itself is not counted

- **WHEN** the contents of a folder holding exactly one empty subfolder and one file are read
- **THEN** the answer is one folder and one file, not two folders — the folder asked about is the
  container, not part of what is inside it

#### Scenario: FR-ACCT-020 an empty folder reports zeros

- **WHEN** the contents of a folder with nothing in it are read
- **THEN** every figure is zero, and none is null, absent or negative

#### Scenario: FR-ACCT-020 a file reports nothing inside it

- **WHEN** the contents of a file are read
- **THEN** every figure is zero, because nothing is inside a file — not an error, and not the file's
  own size, which is already on the file's own row

#### Scenario: FR-ACCT-020 the byte total sums only files, at every depth

- **WHEN** the contents of a folder whose files sit at mixed depths are read
- **THEN** the byte total is the sum of every file in the subtree, folders contributing nothing

#### Scenario: FR-ACCT-020 a total beyond 32 bits is reported exactly

- **WHEN** the contents of a folder holding more than 4 GiB of files are read
- **THEN** the byte total is exact and is a plain JSON number, not a string, an object or a rounded
  value

#### Scenario: FR-ACCT-020 depth does not change the answer

- **WHEN** the same set of files is read once nested shallowly and once nested 32 levels deep
- **THEN** both answers are identical, and neither request fails on depth

#### Scenario: FR-ACCT-020 another Data Room's rows are never counted

- **WHEN** the contents of a folder are read while other Data Rooms hold folders and files of their
  own
- **THEN** the figures cover only the caller's own room

#### Scenario: FR-ACCT-020 the figures are never attached to a listing

- **WHEN** a folder's children are listed
- **THEN** no row carries recursive figures, so browsing never pays for a count nobody asked to see

### Requirement: List View

The client application MUST render folders and files in a list view format, and MUST offer a second
**tiles** view of the same folder, toggled from the toolbar (FR-VIEW-010). List shows name, size,
type and modified; tiles show a type icon, the name and the size. The chosen view SHALL be
remembered in `localStorage` and SHALL apply to every folder, not only the one it was chosen in.

Both views SHALL render the same items in the same order and SHALL support the same selection,
context menu, keyboard and drag behaviour, so the toggle changes how the folder looks and nothing
about what can be done in it.

#### Scenario: FR-VIEW-010 Rendering the list view

- **WHEN** a folder's contents are loaded successfully
- **THEN** the main content area renders a list view showing the folder's nodes, including their names, types, and relevant metadata.

#### Scenario: FR-VIEW-010 the toolbar toggles to tiles and back

- **WHEN** the owner chooses the tiles view from the toolbar
- **THEN** the same items are re-rendered as tiles, each carrying a type icon, its name and, for a
  file, its size, and choosing list again restores the table

#### Scenario: FR-VIEW-010 the chosen view survives navigation and reload

- **WHEN** the owner switches to tiles, opens another folder, and reloads the page
- **THEN** both folders render as tiles, because the choice is remembered across folders and across
  sessions

#### Scenario: FR-VIEW-010 selection and the context menu work identically in tiles

- **WHEN** the owner selects, `Shift` clicks, right-clicks and drags in the tiles view
- **THEN** every one of those behaves exactly as it does in the list view, on the same items

#### Scenario: FR-VIEW-010 an empty folder and a failed listing look the same in both views

- **WHEN** a folder is empty, or its listing fails, while the tiles view is active
- **THEN** the same empty state and the same inline error with Retry are shown as in the list view
  (FR-NAV-040)

### Requirement: Empty States

The client application MUST guide the user when a folder is empty.

#### Scenario: FR-VIEW-010 Empty folder state

- **WHEN** a user navigates to a folder that contains no children
- **THEN** the list view displays an empty state illustration or message indicating there are no files or folders here.

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

The viewer SHALL render the following MIME families natively, without installing any third-party
library, using the browser's own rendering engine (FR-VIEW-060):

| Family       | MIME prefix / type                                           | Element                                                                                    |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| PDF          | `application/pdf`                                            | `<iframe>`                                                                                 |
| Raster image | `image/` (excl. SVG)                                         | `<img>`                                                                                    |
| SVG          | `image/svg+xml`                                              | `<img>` (same as raster; SVG is sandboxed by the object-store; inline is not used, BR-040) |
| Video        | `video/`                                                     | `<video controls>`                                                                         |
| Audio        | `audio/`                                                     | `<audio controls>`                                                                         |
| Plain text   | `text/plain`, `text/csv`, `text/markdown`, `text/x-markdown` | `<pre>` fetched as text and displayed verbatim                                             |

Any other MIME type — specifically Office formats (`.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`),
proprietary binary formats, and any format not in the table above — SHALL display the honest
fallback: a type icon, the file's name and size, and a Download button. No empty frame, no spinner
that never resolves.

The bytes in all cases SHALL be fetched directly from the object store via the presigned URL, never
routed through the API (FR-VIEW-060, BR-050).

#### Scenario: FR-VIEW-060 a PDF renders inline

- **WHEN** the owner opens a PDF
- **THEN** its first page is visible at full viewport height without scrolling the page behind it,
  and the viewer's title is the file's name

#### Scenario: FR-VIEW-060 an image is fitted to the viewport

- **WHEN** the owner opens a PNG, JPEG, GIF or WebP
- **THEN** the whole image is visible, scaled down to fit rather than cropped or overflowing, on a
  dark backdrop

#### Scenario: FR-VIEW-060 a video file renders with native controls

- **WHEN** the owner opens a file whose MIME type starts with `video/`
- **THEN** the viewer renders a `<video>` element at full available size with browser-native playback
  controls, and no download begins automatically

#### Scenario: FR-VIEW-060 an audio file renders with native controls

- **WHEN** the owner opens a file whose MIME type starts with `audio/`
- **THEN** the viewer renders an `<audio>` element with browser-native playback controls, centered
  in the viewport, with the file's name visible above it

#### Scenario: FR-VIEW-060 a plain-text file renders its contents verbatim

- **WHEN** the owner opens a `.txt`, `.csv`, `.md`, or `.log` file (MIME `text/plain`,
  `text/csv`, or `text/markdown`)
- **THEN** the viewer fetches the text from the presigned URL, renders it inside a `<pre>` block
  with wrapping and a monospaced font, and does not interpret it as HTML or Markdown

#### Scenario: FR-VIEW-060 an SVG image renders like a raster image

- **WHEN** the owner opens an SVG file (MIME `image/svg+xml`)
- **THEN** the viewer renders it via an `<img>` tag fitted to the viewport on a dark backdrop,
  identical to a PNG or JPEG — it is not embedded as inline `<svg>`

#### Scenario: FR-VIEW-060 an Office or proprietary file shows the honest fallback

- **WHEN** the owner opens a `.docx`, `.xlsx`, `.pptx`, or `.odt` file
- **THEN** the viewer shows a type icon, the file's name and size, and a Download button — no empty
  frame, no spinner, no partial render

#### Scenario: BR-050 a preview that cannot be fetched fails visibly

- **WHEN** the URL the viewer was given is refused or unreachable
- **THEN** the viewer shows a message saying the file could not be loaded, with a way to retry and a
  Download button, and never a blank frame

#### Scenario: BR-050 a text fetch that fails shows the error state

- **WHEN** the viewer attempts to fetch the text content of a plain-text file and the request fails
- **THEN** the viewer shows the same error state used for PDF and image failures: a message, a Retry
  button, and a Download button — it does not leave an empty `<pre>`

#### Scenario: FR-VIEW-060 the bytes do not pass through the API

- **WHEN** a file is displayed in the viewer
- **THEN** the request that carries its bytes is not on the API's own origin

---

### Requirement: The viewer closes, steps through the folder, and lives in the URL

The viewer SHALL close on `Esc` and on its own close control, returning to the listing with the file
still selected (FR-VIEW-060). `←` and `→` SHALL step to the previous and next **file** of the same
folder in the order the listing shows, without returning to the listing.

In the owner's listing the open file SHALL be part of the URL, so a viewer link opens the same file
and the browser's Back closes the viewer. The shared view at `/s/{token}` SHALL NOT carry the open
file in the URL, because the folder the visitor is browsing is not carried there either — a URL that
named a file but not its folder would open the viewer over the wrong listing. The shared viewer
SHALL instead close on `Esc` and on its close control back to the folder it was opened from
(FR-SHARE-070).

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

#### Scenario: FR-SHARE-070 the shared viewer is not addressable by URL

- **WHEN** a visitor opens a file in the shared view and then copies the address bar
- **THEN** the address is still the share's own URL, so the copied link opens the shared root rather
  than a viewer over a folder the link does not name

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

### Requirement: FR-VIEW-030 — The context menu mirrors the toolbar

Right-clicking an item SHALL open a context menu offering the same actions as the toolbar for the
current selection (FR-VIEW-030). Right-clicking an item that is not selected SHALL select it first,
replacing the selection, so the menu always acts on what the owner can see is selected;
right-clicking an item that is already part of a multi-item selection SHALL leave that selection
intact.

Right-clicking empty space in the listing SHALL open a menu for the open folder — New folder, Upload
and Paste — with no item action on it. The menu SHALL offer only what the current selection allows,
and an action the selection does not allow SHALL be absent rather than disabled (BR-100).

#### Scenario: FR-VIEW-030 the menu offers what the toolbar offers

- **WHEN** the owner right-clicks a single selected file
- **THEN** the menu carries the same actions the toolbar shows for that selection — Open, Download,
  Rename, Move, Copy, Cut, Share, Delete — and no action the toolbar withholds

#### Scenario: FR-VIEW-030 right-clicking an unselected item selects it first

- **WHEN** the owner right-clicks a row that is not currently selected
- **THEN** that row becomes the whole selection before the menu opens, and the menu's actions act on
  it

#### Scenario: FR-VIEW-030 right-clicking inside a multi-item selection keeps it

- **WHEN** the owner has four items selected and right-clicks one of them
- **THEN** all four stay selected and the menu offers the bulk actions for all four

#### Scenario: FR-VIEW-030 right-clicking empty space offers folder actions

- **WHEN** the owner right-clicks the empty area below the rows
- **THEN** the menu offers New folder, Upload and — only when the clipboard holds something — Paste,
  and offers no action that needs a selected item

#### Scenario: FR-VIEW-030 BR-100 the menu never shows a disabled entry

- **WHEN** the selection cannot support an action, such as Rename on two items or Download on a
  folder
- **THEN** that entry does not appear in the menu at all

### Requirement: FR-VIEW-040 — The keyboard reaches every action, and focus is visible and trapped

The listing SHALL be operable from the keyboard alone (FR-VIEW-040): `↑` `↓` move the selection,
`Shift` `↑` `↓` extend it, `Enter` opens the selected folder or file, `Backspace` goes to the parent
folder, `F2` renames inline, `Delete` deletes with the BR-030 confirm, `Ctrl`/`⌘` `A` selects
everything, `Ctrl`/`⌘` `X` / `C` / `V` cut, copy and paste, `/` focuses the search box, and `Esc`
closes the viewer or the open dialog, else leaves an inline rename, else clears the selection — in
that order.

A shortcut SHALL NOT fire while the caret is in a text input, a textarea or an inline rename, except
the keys that field itself defines. Focus SHALL be visible on every focusable control at every step.
Dialogs and the viewer SHALL trap focus while open and SHALL return focus to the control that opened
them when they close. Every icon-only control SHALL carry an `aria-label` naming the action, and the
current selection SHALL be conveyed to assistive technology, not by colour alone.

#### Scenario: FR-VIEW-040 arrows move the selection and Enter opens

- **WHEN** the owner focuses the listing and presses `↓` twice, then `Enter` on a folder
- **THEN** the selection moves one row at a time in the listing's sort order and the folder opens

#### Scenario: FR-VIEW-040 Shift and the arrows extend the selection

- **WHEN** the owner presses `Shift` `↓` twice from a selected row
- **THEN** three contiguous rows are selected, the same set a `Shift` click on the third would give

#### Scenario: FR-VIEW-040 Backspace goes to the parent folder

- **WHEN** the owner presses `Backspace` in a folder below the Data Room root
- **THEN** the parent folder opens, and pressing it at the root does nothing rather than erroring

#### Scenario: FR-VIEW-040 Esc resolves in order

- **WHEN** the owner presses `Esc` with the viewer open, then again with an inline rename active,
  then again with several items selected
- **THEN** the first closes the viewer, the second leaves the rename without saving, and the third
  clears the selection

#### Scenario: FR-VIEW-040 a shortcut does not fire while typing

- **WHEN** the owner types a name containing `a`, `v` or `/` into the search box or an inline rename
- **THEN** the text is entered and no select-all, paste or search-focus shortcut runs

#### Scenario: FR-VIEW-040 Delete asks before it deletes

- **WHEN** the owner presses `Delete` with items selected
- **THEN** the BR-030 confirm dialog opens stating the blast radius, and nothing is deleted until it
  is confirmed

#### Scenario: FR-VIEW-040 a dialog traps focus and gives it back

- **WHEN** the owner opens a dialog from a toolbar button, tabs past its last control, and closes it
- **THEN** focus stays inside the dialog while it is open and returns to the toolbar button that
  opened it once it closes

#### Scenario: FR-VIEW-040 every icon-only control is named

- **WHEN** the listing, toolbar, viewer and dialogs are inspected for accessible names
- **THEN** every control whose label is an icon alone carries an `aria-label` naming its action

#### Scenario: FR-VIEW-040 the selection is announced, not merely coloured

- **WHEN** an item is selected
- **THEN** its row or tile reports its selected state to assistive technology, so selection is not
  conveyed by background colour alone

### Requirement: FR-VIEW-020 — A multi-item selection replaces the details pane with a count and bulk actions

When two or more items are selected, the details pane SHALL show how many items are selected and
the actions that apply to all of them, in place of the single-item metadata (FR-VIEW-020,
FR-FILE-070). It SHALL NOT show the name, size, dates, preview or shares of any one of them, and it
SHALL NOT show recursive figures for the open folder, which describe something the owner has not
selected.

#### Scenario: FR-VIEW-020 several selected items report a count, not one item's metadata

- **WHEN** the owner selects three items
- **THEN** the pane reads that three items are selected and shows no name, size, date, preview or
  share list belonging to any single one of them

#### Scenario: FR-VIEW-020 the pane offers the bulk actions for the selection

- **WHEN** the owner has a multi-item selection containing at least one file
- **THEN** the pane offers Delete, Move and Download for the whole selection, and offers neither
  Rename nor Share

#### Scenario: FR-VIEW-020 dropping back to one selected item restores its details

- **WHEN** the owner clicks a single row while several were selected
- **THEN** the pane returns to that item's own name, kind, size and dates

### Requirement: The viewer's media frame is covered until its bytes have painted

Between the moment the viewer has a presigned URL and the moment the browser has painted the media,
the frame SHALL show a placeholder rather than the element's own empty background (FR-VIEW-060,
FR-VIEW-070). This window is separate from the one the presigned-URL request already covers: the URL
arrives quickly, and the bytes behind it then stream from the object store.

It matters for the two elements that paint an opaque background of their own before any content
arrives — the `<iframe>` a PDF renders in, which paints white regardless of the active theme, and the
`<img>` an image renders in. The placeholder SHALL be removed once the element reports that it has
loaded, and SHALL be replaced by the viewer's existing failure state — a message, Retry and Download —
if the element reports an error instead (BR-050). It SHALL NOT depend on the element's load report
alone: a report that never arrives SHALL still resolve to the failure state rather than leave the
placeholder on screen indefinitely.

#### Scenario: FR-VIEW-060 a PDF's frame is covered until its first page paints

- **WHEN** the owner opens a PDF whose bytes take measurable time to stream from the object store
- **THEN** the frame shows a placeholder shaped like a document page for the whole wait, and the
  placeholder is gone once the first page is visible

#### Scenario: FR-VIEW-060 an image's frame is covered until the image paints

- **WHEN** the owner opens a large image
- **THEN** the frame shows a placeholder sized to the frame until the image has decoded, and the image
  then replaces it without the frame flashing empty in between

#### Scenario: FR-VIEW-050 nothing white appears in the frame under the dark theme

- **WHEN** the dark theme is active and the owner opens a PDF
- **THEN** no white rectangle appears in the frame at any point before the PDF's own page paints

#### Scenario: FR-VIEW-060 stepping to the next file covers the frame again

- **WHEN** the owner presses `→` in the viewer to step to the next file in the folder
- **THEN** the frame shows the placeholder again for the new file, rather than holding the previous
  file's rendering or going empty

#### Scenario: BR-050 a media frame that fails to load shows the failure state

- **WHEN** the element reports an error because the URL was refused or the object is gone
- **THEN** the placeholder is replaced by the viewer's existing failure state, with a Retry and a
  Download button

#### Scenario: BR-050 a media frame that never reports at all still resolves

- **WHEN** the element neither loads nor reports an error — the request hangs
- **THEN** the frame eventually shows the failure state with Retry and Download, and the placeholder
  is not left on screen as a wait with no end
