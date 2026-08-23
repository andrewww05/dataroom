## ADDED Requirements

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

---

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
