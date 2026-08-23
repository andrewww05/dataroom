# files Specification

## Purpose

Covers getting bytes into a Data Room and back out of it: what an upload must prove about itself
before anything is stored, what the stored file looks like as a row, how a file is handed back
without its bytes passing through the API, and what happens to the bytes when the row goes away.

## Requirements

### Requirement: An upload proves what it is before anything is stored

The API SHALL decide whether to accept an upload from the bytes themselves, never from the client's
claimed content type or the file's extension, and SHALL make that decision before writing anything
to the object store (BR-040). A file larger than the configured maximum SHALL be refused
`413 FILE_TOO_LARGE`; a file whose sniffed type is not on the allow list SHALL be refused
`415 UNSUPPORTED_TYPE`. The allow list is PDF, plain text, CSV, Markdown, PNG, JPEG, GIF, WebP, and
the Office and OpenDocument formats. A refused upload SHALL leave no stored object and no row.

#### Scenario: BR-040 an allowed type is accepted on its bytes

- **WHEN** a PDF, a PNG, a plain-text file and an OpenDocument text file are each uploaded
- **THEN** each is accepted, and each resulting file reports the content type that was sniffed from
  its bytes rather than the one the client sent

#### Scenario: BR-040 the client's claimed content type is ignored

- **WHEN** an upload declares `application/pdf` and sends PNG bytes
- **THEN** the upload is accepted and the file reports the PNG content type, not the declared one

#### Scenario: BR-040 a disallowed type is refused on its bytes

- **WHEN** an upload named `report.pdf` and declared `application/pdf` in fact carries an executable
- **THEN** the response is `415` with code `UNSUPPORTED_TYPE`, and nothing is stored

#### Scenario: BR-040 SVG is refused however it is presented

- **WHEN** an SVG document is uploaded, whatever its name or declared content type
- **THEN** the response is `415` with code `UNSUPPORTED_TYPE` — SVG is deliberately off the allow
  list because it is a script container

#### Scenario: BR-040 an oversized file is refused

- **WHEN** an upload exceeds the configured maximum file size
- **THEN** the response is `413` with code `FILE_TOO_LARGE`, and nothing is stored

#### Scenario: BR-040 an empty file is refused

- **WHEN** a zero-byte file is uploaded
- **THEN** the response is `415` with code `UNSUPPORTED_TYPE`, because no type can be sniffed from
  no bytes

#### Scenario: BR-040 the maximum is configured, not compiled in

- **WHEN** the deployment's maximum file size is changed and the API restarted
- **THEN** the new limit is what uploads are measured against, with no code change (BR-100)

---

### Requirement: An accepted upload becomes a file in a folder

The API SHALL create, for an accepted upload, one file node in the named folder carrying its name,
its byte size as a JSON number, and its sniffed content type (FR-FILE-010). A name that collides
with a sibling SHALL be suffixed by the same rule every other write path uses, and the response
SHALL carry the name actually stored (BR-020). A target the caller has no claim on, one that does
not exist, and one that is not a folder SHALL all answer `404 NOT_FOUND` (BR-010).

#### Scenario: FR-FILE-010 an upload appears in the folder that was named

- **WHEN** a file is uploaded into a folder
- **THEN** the response is `201` with the new file's id, its parent's id, the file kind, its name,
  its byte size as a number and its sniffed content type — and the folder's next listing includes it

#### Scenario: BR-020 an upload whose name is taken is stored under a suffixed name

- **WHEN** `statement.pdf` is uploaded into a folder that already holds `statement.pdf`
- **THEN** the response is `201` and the stored name is `statement (2).pdf` — the suffix before the
  extension, and the response says which name was used

#### Scenario: BR-020 a name collision is judged without regard to case

- **WHEN** `Statement.PDF` is uploaded into a folder that already holds `statement.pdf`
- **THEN** it is treated as a collision and the stored name is suffixed

#### Scenario: BR-010 an upload into a folder in someone else's room is refused

- **WHEN** a caller uploads into a folder id that exists but belongs to another Data Room
- **THEN** the response is `404` with code `NOT_FOUND` — indistinguishable from a folder that does
  not exist, and never `403`

#### Scenario: BR-010 an upload into an unknown target is refused

- **WHEN** a caller uploads into an id no row has, or into an id that names a file rather than a
  folder
- **THEN** the response is `404` with code `NOT_FOUND`

#### Scenario: FR-AUTH-030 an anonymous upload is refused

- **WHEN** an upload arrives with no token, or an expired one
- **THEN** the response is `401` with code `UNAUTHENTICATED`, and nothing is stored

#### Scenario: BR-050 an object store that refuses is reported as retryable

- **WHEN** the object store cannot be reached or refuses the write
- **THEN** the response is `502` with code `STORAGE_UNAVAILABLE` and a message the client can show,
  no row exists for the attempt, and the body names no host, bucket, credential or library

---

### Requirement: A file's row and its bytes exist together or not at all

The API SHALL never leave a file row whose bytes are missing, nor stored bytes that no row refers to
(BR-060). An upload that fails after its bytes are stored SHALL remove them. Deleting a node SHALL
remove the stored bytes of every file in its subtree once the rows are gone, so a delete leaves
nothing behind in the object store (BR-060, FR-FLDR-030).

#### Scenario: BR-060 a failed row write leaves nothing stored

- **WHEN** an upload's bytes are stored but the row cannot be written
- **THEN** the request fails, no file appears in the folder, and the object store holds no object
  for that attempt

#### Scenario: BR-050 an abandoned upload leaves nothing behind

- **WHEN** an upload is cancelled or its connection drops before it completes
- **THEN** no file appears in the folder and the object store holds no object for that attempt

#### Scenario: BR-060 deleting a file removes its bytes

- **WHEN** a file is deleted
- **THEN** the response is `204`, the file is gone from its folder, and the object store no longer
  holds its object

#### Scenario: BR-060 deleting a folder removes the bytes of everything under it

- **WHEN** a folder holding files at several depths is deleted
- **THEN** the object store no longer holds an object for any file that was in that subtree

---

### Requirement: A file is handed back through a short-lived URL, not through the API

The API SHALL answer a download request for a file the caller is entitled to with a short-lived URL
the browser navigates to, so the bytes travel from the object store to the browser and never through
the API (FR-FILE-020). The URL SHALL carry the file's stored name and present as an attachment, and
SHALL stop working once it expires. A folder, an unknown id and a node in another Data Room SHALL
all answer `404 NOT_FOUND` (BR-010).

#### Scenario: FR-FILE-020 a download hands back a working URL

- **WHEN** the owner requests a download for one of their files
- **THEN** the response is `200` carrying a URL and the moment it expires, the URL is not on the
  API's own origin, and fetching it returns exactly the bytes that were uploaded

#### Scenario: FR-FILE-020 the URL downloads under the stored name

- **WHEN** that URL is opened in a browser
- **THEN** the browser saves the file rather than displaying it, under the name the file has in the
  Data Room

#### Scenario: FR-FILE-020 the URL stops working when it expires

- **WHEN** the URL is used after the moment the response named
- **THEN** the object store refuses it, so a copied link is not a permanent handle on the bytes

#### Scenario: BR-010 a download for a foreign or unknown file is refused

- **WHEN** a download is requested for an id that does not exist, that belongs to another Data Room,
  or that names a folder rather than a file
- **THEN** the response is `404` with code `NOT_FOUND`, never `403`

#### Scenario: FR-AUTH-030 an anonymous download request is refused

- **WHEN** a download is requested with no token, or an expired one
- **THEN** the response is `401` with code `UNAUTHENTICATED` and no URL is handed out

---

### Requirement: Uploading is reachable by button and by dropping files on the listing

The UI SHALL let the owner start an upload into the open folder from an explicit control and by
dropping files onto the listing, including onto an empty folder's own empty state (FR-FILE-010). A
drag carrying files SHALL be visibly acknowledged before it is released. A selection larger than the
per-batch cap SHALL be refused in the UI before any request is made, with the reason stated.

#### Scenario: FR-FILE-010 files can be chosen from a control

- **WHEN** the owner activates Upload and picks one or more files
- **THEN** each picked file starts uploading into the folder currently shown

#### Scenario: FR-FILE-010 files can be dropped on the listing

- **WHEN** the owner drags files over the listing and releases them
- **THEN** the listing indicates it will accept them while the drag is over it, and on release each
  file starts uploading into the folder currently shown

#### Scenario: FR-FILE-010 an empty folder accepts a drop too

- **WHEN** the owner drops files on a folder that is showing its empty state
- **THEN** the files upload into it, and the empty state also offers Upload as an explicit control

#### Scenario: BR-040 an over-large batch is refused before anything is sent

- **WHEN** the owner picks or drops more files at once than the per-batch cap allows
- **THEN** nothing is uploaded, and the UI says how many files may be sent at once

---

### Requirement: Every upload reports its own progress and can be cancelled or retried

The UI SHALL show one row per upload with its progress as a percentage and a way to cancel it, and
one upload's failure SHALL NOT abort the others (FR-FILE-010). A failure SHALL be visible and carry
the server's own message; an upload SHALL retry twice with backoff on a network error or a `5xx`,
and SHALL NOT retry a `4xx` (BR-050). The queue SHALL remain until the owner dismisses it, so a
failure is not lost by navigating away.

#### Scenario: FR-FILE-010 each file gets its own progress

- **WHEN** several files are uploaded at once
- **THEN** each has its own row showing a percentage that advances, and each completes or fails on
  its own

#### Scenario: FR-FILE-010 one failure does not abort the others

- **WHEN** one file in a batch is refused and the rest are valid
- **THEN** the refused row shows its failure and the other rows finish and appear in the listing

#### Scenario: FR-FILE-010 an upload can be cancelled mid-flight

- **WHEN** the owner cancels an upload that is in progress
- **THEN** its row reports it was cancelled, the transfer stops, and no file appears in the folder

#### Scenario: BR-050 a transport failure retries and then offers Retry

- **WHEN** an upload fails with a network error or a `5xx`
- **THEN** it is retried twice with a growing delay, and only after the third failure does its row
  show the failure with a Retry action that starts it again

#### Scenario: BR-050 a rejected upload is not retried

- **WHEN** an upload is refused `413 FILE_TOO_LARGE`, `415 UNSUPPORTED_TYPE` or `404 NOT_FOUND`
- **THEN** it is not retried, and its row shows the message the server sent rather than a generic one

#### Scenario: BR-050 the queue outlives the folder it started in

- **WHEN** the owner navigates to another folder while uploads are running or after one has failed
- **THEN** the queue and its rows are still visible, and are removed only when dismissed

#### Scenario: BR-020 a completed row names the file as it was stored

- **WHEN** an upload is stored under a suffixed name because its own name was taken
- **THEN** its completed row shows the name that was actually stored, not the name that was picked

### Requirement: A file can be fetched for display instead of for saving

The API SHALL answer a preview request for a file the caller is entitled to with a short-lived URL
that presents the bytes **inline**, so a browser displays the file rather than saving it
(FR-VIEW-060). It is the display counterpart of the download URL and behaves the same way otherwise:
the bytes travel from the object store to the browser and never through the API, the URL carries the
file's content type, and it stops working once it expires. A folder, an unknown id and a node in
another Data Room SHALL all answer `404 NOT_FOUND` (BR-010).

#### Scenario: FR-VIEW-060 a preview hands back a working inline URL

- **WHEN** the owner requests a preview for one of their files
- **THEN** the response is `200` carrying a URL and the moment it expires, the URL is not on the API's
  own origin, and fetching it returns exactly the bytes that were uploaded

#### Scenario: FR-VIEW-060 the URL displays rather than saves

- **WHEN** that URL is opened in a browser
- **THEN** the browser displays the file rather than offering to save it, and the response carries the
  file's sniffed content type

#### Scenario: FR-VIEW-060 the preview URL stops working when it expires

- **WHEN** the URL is used after the moment the response named
- **THEN** the object store refuses it, so a copied preview link is not a permanent handle on the
  bytes

#### Scenario: BR-010 a preview for a foreign or unknown file is refused

- **WHEN** a preview is requested for an id that does not exist, that belongs to another Data Room, or
  that names a folder rather than a file
- **THEN** the response is `404` with code `NOT_FOUND`, never `403`, and no URL is handed out

#### Scenario: FR-AUTH-030 an anonymous preview request is refused

- **WHEN** a preview is requested with no token, or an expired one
- **THEN** the response is `401` with code `UNAUTHENTICATED` and no URL is handed out

#### Scenario: BR-050 an object store that cannot sign is reported without leaking

- **WHEN** the object store cannot be reached to sign the URL
- **THEN** the response is `502` with code `STORAGE_UNAVAILABLE` and a message the client can show,
  and the body names no host, bucket, credential or library

#### Scenario: FR-VIEW-060 a malformed id is a validation failure, not a server error

- **WHEN** a preview or a download is requested for an id that is not a well-formed identifier —
  which a hand-edited viewer link can produce
- **THEN** the response is `400` with code `VALIDATION_FAILED` naming `id`, and never `500 INTERNAL`

---

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

### Requirement: FR-FILE-070 — Multi-select, and the actions that act on the whole selection

The listing SHALL support selecting several items at once: a plain click replaces the selection, a
`Ctrl`/`⌘` click adds or removes one item, a `Shift` click selects the range from the anchor to the
clicked row, and `Ctrl`/`⌘` `A` selects everything in the open folder. The anchor is the last item
selected without `Shift`.

Delete, Move and Download SHALL act on the whole selection rather than on one item. Actions that
cannot mean anything for the selection SHALL be absent from the toolbar and the context menu, not
present and disabled (BR-100): Share and Rename appear only for exactly one selected item, and
Download appears only when the selection contains at least one file.

A multi-item delete SHALL confirm once and state the aggregate blast radius — the summed recursive
folder count, file count and byte total across every selected item, from the same figures a single
delete uses (BR-030). Navigating to another folder SHALL clear the selection, because the selection
names rows in the open folder and no action may reach across folders.

#### Scenario: FR-FILE-070 a plain click replaces the selection

- **WHEN** the owner has three items selected and clicks a fourth row without a modifier
- **THEN** only the clicked row is selected, and the details pane reports that one item

#### Scenario: FR-FILE-070 Ctrl-click adds and removes one item

- **WHEN** the owner `Ctrl`/`⌘` clicks an unselected row, then `Ctrl`/`⌘` clicks a selected one
- **THEN** the first row joins the selection and the second leaves it, and no other row changes

#### Scenario: FR-FILE-070 Shift-click selects the range from the anchor

- **WHEN** the owner clicks the second row, then `Shift` clicks the fifth
- **THEN** rows two through five are selected in the listing's own sort order, whichever direction
  the range runs

#### Scenario: FR-FILE-070 Ctrl+A selects everything in the open folder

- **WHEN** the owner presses `Ctrl`/`⌘` `A` with the listing focused
- **THEN** every item currently loaded in the open folder is selected, and no item from another
  folder is

#### Scenario: FR-FILE-070 delete acts on the whole selection with one confirm

- **WHEN** the owner selects two folders and three files and chooses Delete
- **THEN** one confirm dialog states the summed folder count, file count and byte total for all five
  items, and confirming removes every one of them and the blobs beneath them

#### Scenario: FR-FILE-070 move acts on the whole selection

- **WHEN** the owner selects several items and picks a target in the Move dialog
- **THEN** one `POST /nodes/move` carries every selected id, the response names every item as it
  landed, and each collision at the target is suffixed per BR-020

#### Scenario: FR-FILE-070 download acts on every file in the selection

- **WHEN** the owner selects two files and one folder and chooses Download
- **THEN** each of the two files is downloaded through its own short-lived presigned URL, and the
  folder is not downloaded and is not reported as a failure

#### Scenario: FR-FILE-070 BR-100 Download is absent, not disabled, for a folders-only selection

- **WHEN** the owner selects only folders
- **THEN** neither the toolbar nor the context menu offers Download at all

#### Scenario: FR-FILE-070 BR-100 Rename and Share are absent for a multi-item selection

- **WHEN** the owner has two or more items selected
- **THEN** neither the toolbar nor the context menu offers Rename or Share

#### Scenario: FR-FILE-070 BR-050 one failure in a bulk action does not hide the others

- **WHEN** a bulk delete or move fails for one item
- **THEN** the failure is reported in a toast carrying the server's message, the items that
  succeeded stay gone from the source listing, and the listing is refetched rather than left guessing

#### Scenario: FR-FILE-070 leaving the folder clears the selection

- **WHEN** the owner selects several items and navigates to another folder
- **THEN** nothing is selected in the new folder, and the toolbar offers only the actions that need
  no selection

### Requirement: FR-FILE-060 — Cut, copy and paste duplicate a selection server-side

The owner SHALL be able to put a selection on a clipboard as a **copy** or as a **cut**, and paste it
into another folder. Paste after a copy SHALL duplicate the selection into the target; paste after a
cut SHALL move it, which is `POST /nodes/move` and the behaviour FR-FILE-050 already defines.

Copying SHALL be performed by the server through `POST /nodes/copy` with `{ ids, targetId }`,
returning the created `FsNode[]`. Copying a folder SHALL copy its whole subtree at every depth. Blob
bytes SHALL be duplicated inside the object store and SHALL NOT pass through the API or the browser.
Each created item resolves its own name conflict under BR-020 and the response carries the names
actually used. The whole copy SHALL succeed or leave nothing behind (BR-060): a failure part-way
SHALL leave no row and no orphan object.

The clipboard SHALL hold ids, not rows, and Paste SHALL be absent from the toolbar and the context
menu while the clipboard is empty (BR-100). A cut whose source has since been deleted SHALL fail
visibly rather than silently pasting less than was cut.

#### Scenario: FR-FILE-060 copying a file duplicates it into the target

- **WHEN** the owner copies a file and pastes it into another folder
- **THEN** `POST /nodes/copy` returns `200` with one `FsNode` in the target folder, the original stays
  where it was, and both files download the same bytes

#### Scenario: FR-FILE-060 copying a folder copies its whole subtree

- **WHEN** the owner copies a folder holding nested folders and files several levels down, and pastes
  it elsewhere
- **THEN** the target holds a folder whose subtree has the same shape, the same names and the same
  byte totals as the original, at every depth

#### Scenario: FR-FILE-060 BR-020 a collision at the target is suffixed, not refused

- **WHEN** the owner pastes a copy of `report.pdf` into a folder that already holds `report.pdf`
- **THEN** the response names the created file `report (2).pdf`, a toast says so, and the existing
  file is untouched

#### Scenario: FR-FILE-060 pasting into the source folder duplicates in place

- **WHEN** the owner copies an item and pastes it into the folder it already sits in
- **THEN** a suffixed duplicate is created alongside the original rather than the request being
  refused

#### Scenario: FR-FILE-060 copying a folder into itself is refused

- **WHEN** a copy names a folder as both an id to copy and the `targetId`, or names a descendant of
  it as the target
- **THEN** the response is `400 INVALID_MOVE`, and nothing is created

#### Scenario: FR-FILE-060 BR-010 copying a node in another Data Room is not found

- **WHEN** a copy names an id the caller has no claim on, or a `targetId` in another Data Room
- **THEN** the response is `404 NOT_FOUND`, never `403`, and nothing is created

#### Scenario: FR-FILE-060 BR-070 a share principal cannot copy

- **WHEN** a request authenticated by a share token calls `POST /nodes/copy`
- **THEN** the response is `403 READ_ONLY` and nothing is created, whether or not the ids are inside
  the shared subtree

#### Scenario: FR-FILE-060 BR-060 a copy that fails part-way leaves nothing behind

- **WHEN** a subtree copy fails after some rows and objects have been written
- **THEN** no new row and no new object survives the failure, and the target folder lists exactly
  what it listed before

#### Scenario: FR-FILE-060 a cut then a paste moves rather than duplicates

- **WHEN** the owner cuts a selection and pastes it into another folder
- **THEN** the items leave the source folder and appear in the target, and the clipboard is emptied

#### Scenario: FR-FILE-060 BR-050 pasting a cut whose source is gone fails visibly

- **WHEN** the owner cuts an item, deletes it, then pastes
- **THEN** the failure is reported in a toast carrying the server's message and no partial result is
  presented as a success

#### Scenario: FR-FILE-060 BR-100 Paste is absent while the clipboard is empty

- **WHEN** nothing has been cut or copied in this session
- **THEN** neither the toolbar nor the context menu shows a Paste entry, disabled or otherwise
