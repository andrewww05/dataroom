## Why

Core is green and demonstrable, so the Polish tier is now in scope: slices **14–17** of
[docs/05](../../../docs/05-build-order.md). Today the listing selects with checkboxes only, delete
and share act on one row, there is no context menu, no keyboard map beyond the viewer, no tiles
view, and `.dark` exists in `index.css` with nothing to toggle it. The brief grades design and
polish second, right after functionality.

Delivers **FR-FILE-060**, **FR-FILE-070**, **FR-VIEW-010** (tiles half), **FR-VIEW-030**,
**FR-VIEW-040**, **FR-VIEW-050**, **FR-ACCT-010**, under BR-020, BR-030, BR-060, BR-070, BR-100.

## What Changes

- **Selection (14)** — click / Ctrl+click / Shift+click / Ctrl+A replace the checkbox-only store.
  Delete, move and download act on the whole selection; the details pane becomes a count plus bulk
  actions when several are selected.
- **Context menu (14)** — right-click mirrors the toolbar and offers only what the selection allows;
  right-click on empty space offers New folder, Upload, Paste.
- **Storage footer (14)** — new `GET /data-rooms/:id/usage` → `{ bytes, files }`, rendered in the
  sidebar footer.
- **Cut / copy / paste (15)** — new `POST /nodes/copy`; server-side `CopyObject`, recursive subtree
  copy, per-item BR-020 suffixing, one transaction (BR-060).
- **Keyboard and a11y (16)** — the full docs/04 key map, visible focus, dialog and viewer focus
  traps, `aria-label` on every icon-only control.
- **Tiles and theme (17)** — a list/tiles toggle persisted to `localStorage`; light/dark following
  the OS, overridable from the header, persisted.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `files`: adds FR-FILE-060 (copy/paste, subtree copy) and FR-FILE-070 (delete / move / download act
  on a multi-selection).
- `viewing`: adds FR-VIEW-010's tiles half, FR-VIEW-030 (context menu) and FR-VIEW-040 (keyboard,
  focus, `aria-label`s).
- `ui-shell`: adds FR-VIEW-050 (light/dark themes, OS default, header override, persisted).
- `data-room`: adds FR-ACCT-010 (Data Room usage total, endpoint and sidebar footer).

## Non-goals

- **Slice 18 — versioning** (FR-VER-\*, BR-080). Untouched; no `FileVersion`, no upload conflict
  prompt.
- **Slice 12 — the test sweep.** This change tests its own scenarios only.
- **`PATCH /data-rooms/:id`** (FR-ROOM-010's in-place rename) is Core and still unbuilt. This change
  creates the `data-rooms` module for `usage` and deliberately does not add rename to it — that is a
  Core gap to raise separately, not Polish work to absorb (tier discipline).
- **A second share role.** `EDITOR` stays a capability-map entry nobody selects (BR-070).
- No requirement in `docs/02` or `docs/03` changes; every ID and endpoint here is already written
  down there.

## Impact

- **API** — new `apps/api/src/data-rooms/` (usage); `POST /nodes/copy` in `NodesController` /
  `NodesService`; `StorageService` gains `CopyObject` and a subtree key-copy helper.
- **Web** — `useSelection` rewritten (anchor + range); new `NodeContextMenu`, `NodeTiles`,
  `ThemeToggle`, `StorageFooter`, `BulkActionBar`, `useClipboard`, `useKeyboardMap`; `ListingToolbar`,
  `NodeRow`, `DetailsPane` and the `_authenticated` layout all change.
- **Shared** — `RoomUsage` type; `CopyNodesRequest` alongside the existing move shape.
- **Storage** — copy is server-side; bytes never round-trip through the API or the browser.
