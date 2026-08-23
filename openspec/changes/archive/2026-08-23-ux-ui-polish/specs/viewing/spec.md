## MODIFIED Requirements

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

## ADDED Requirements

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

---

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

---

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
