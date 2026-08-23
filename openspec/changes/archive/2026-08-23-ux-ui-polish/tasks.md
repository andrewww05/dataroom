## 1. Shared contract

- [x] 1.1 In `packages/shared/src/nodes.ts`, add `RoomUsage { bytes: number; files: number }` and
  `CopyNodesRequest { ids: string[]; targetId: string }` (mirroring the existing move shape), export
  both from `index.ts`. Verify `pnpm build --filter @dataroom/shared` succeeds and both apps
  typecheck against them.

## 2. API — `POST /nodes/copy` (FR-FILE-060)

- [x] 2.1 In `apps/api/src/storage/storage.service.ts`, add `copyObject(srcKey, destKey)` over
  `CopyObjectCommand` (`CopySource: {bucket}/{srcKey}`) and `deleteObjects(keys)` reuse for
  rollback. Verify with a spec that a copied key resolves to identical bytes and that a missing
  source surfaces as a failure, not a silent no-op.
- [x] 2.2 Add `apps/api/src/nodes/dto/copy-nodes.dto.ts` and a `copyNodes()` on `NodesService`:
  scope-check every id and `targetId` through `NodeScopeService` (404 on a foreign id, BR-010),
  reject a `targetId` equal to or inside a copied folder with `InvalidMoveException`
  (`400 INVALID_MOVE`), then in one `prisma.$transaction` walk each subtree breadth-first, call
  `resolveUniqueName` per created row (BR-020), and `copyObject` each file's blob from
  `{dataRoomId}/{srcNodeId}` to `{dataRoomId}/{newNodeId}` before its row is written (BR-060).
  On any failure, delete the objects written so far. Verify: `pnpm test --filter @dataroom/api`.
- [x] 2.3 Add `@Post('copy')` to `NodesController` returning `FsNode[]`, asserting the `write`
  capability so a share principal gets `403 READ_ONLY` (BR-070). Verify with a controller spec
  covering owner-copies-file, owner-copies-subtree, `INVALID_MOVE`, `NOT_FOUND` and `READ_ONLY`.
- [x] 2.4 Add the BR-060 rollback test: force a failure part-way through a subtree copy and assert
  no new `Node` row and no new object survives it.

## 3. API — `GET /data-rooms/:id/usage` (FR-ACCT-010)

- [x] 3.1 Create `apps/api/src/data-rooms/` (module, controller, service) with one route
  `GET /data-rooms/:id/usage` → `RoomUsage`, backed by
  `SELECT count(*)::int AS files, coalesce(sum("sizeBytes"),0)::bigint AS bytes FROM "Node" WHERE "dataRoomId" = $1 AND "type" = 'FILE'`,
  with `bytes` crossing the boundary through the existing BigInt serialiser. Register the module in
  `app.module.ts`. Verify the route answers `200` with plain JSON numbers.
- [x] 3.2 Add a spec covering: totals across mixed depths; zeros for an empty room; folders adding
  nothing; a total above 4 GiB reported exactly; another owner's room → `404 NOT_FOUND`; a share
  token → `404 NOT_FOUND` (BR-010). Verify `pnpm test --filter @dataroom/api` passes.

## 4. Web — selection model and bulk actions (FR-FILE-070, FR-VIEW-020)

- [x] 4.1 Rewrite `apps/web/src/hooks/useSelection.ts` around `selectedIds`, `anchorId` and
  `selectOne` / `toggle` / `selectRange(orderedItems, id)` / `selectAll(items)` / `clear`, and clear
  the selection on folder change. Verify with a Vitest spec covering plain click, Ctrl+click both
  ways, Shift+click in both directions, and Ctrl+A.
- [x] 4.2 Wire the modifier keys in `NodeRow` and the listing route, replacing the checkbox-only
  path, and show selected state through `aria-selected` as well as background colour. Verify by
  selecting a range in the running app and reading the details pane count.
- [x] 4.3 Extend `DeleteDialog` to take `FsNode[]`: fetch `GET /nodes/:id/stats` for each and state
  the summed folders / files / bytes in one confirm (BR-030), keeping the button disabled until
  every figure arrives. Verify a mixed folder+file selection reports the summed blast radius.
- [x] 4.4 Add `BulkActionBar` to `DetailsPane` for a selection of two or more — the count plus
  Delete, Move and Download — and hide the single-item metadata. Verify Rename and Share are absent
  (not disabled) for a multi-item selection and Download is absent for a folders-only one (BR-100).
- [x] 4.5 Add bulk download: one presigned `GET /files/:id/download` navigation per selected file,
  folders skipped, staggered so the browser does not treat it as a popup burst. Verify two files
  selected produce two downloads and no error for a folder in the same selection.

## 5. Web — clipboard and paste (FR-FILE-060)

- [x] 5.1 Add `apps/web/src/hooks/useClipboard.ts` (Zustand: `ids`, `mode: 'cut' | 'copy'`, set and
  clear) and `useCopyNodes.ts` wrapping `POST /nodes/copy` with `useMutation`, invalidating
  `['nodes', targetId, 'children']`, `['usage', dataRoomId]` and the ancestors' `stats`, and
  toasting the names actually returned (BR-020). Verify a paste into a folder holding the same name
  toasts "Pasted as report (2).pdf".
- [x] 5.2 Wire Cut / Copy / Paste into the toolbar: paste-after-copy calls `useCopyNodes`,
  paste-after-cut calls the existing `useMove` and empties the clipboard. Verify Paste is absent
  from the toolbar while the clipboard is empty (BR-100) and that pasting a cut whose source was
  deleted surfaces the server's message in a toast (BR-050).

## 6. Web — context menu (FR-VIEW-030)

- [x] 6.1 Add `apps/web/src/components/NodeContextMenu.tsx` over the shadcn context-menu primitive,
  built from the same action list the toolbar renders so the two cannot drift; right-clicking an
  unselected row selects it first, right-clicking inside a multi-selection preserves it. Verify the
  menu on a single file offers exactly the toolbar's actions and omits every action the selection
  does not allow.
- [x] 6.2 Add the empty-space menu on the listing background — New folder, Upload, and Paste only
  when the clipboard holds something. Verify by right-clicking below the last row in both views.

## 7. Web — tiles view, theme and storage footer (FR-VIEW-010, FR-VIEW-050, FR-ACCT-010)

- [x] 7.1 Add `NodeTiles` / `NodeTile` and a list/tiles toggle in `ListingToolbar`, backed by a
  Zustand slice persisted to `localStorage`, reusing the same selection, context-menu and drag
  handlers as the table. Verify the choice survives navigating to another folder and a reload.
- [x] 7.2 Add `ThemeToggle` to the header plus a persisted theme slice writing `.dark` on
  `<html>`, and an inline script in `apps/web/index.html` applying the stored value before first
  paint. Verify: OS dark with nothing stored renders dark; an override survives reload and outlives
  an OS change; no light frame flashes on load; dialogs, the viewer, toasts and `/s/{token}` all
  follow.
- [x] 7.3 Add `StorageFooter` to the sidebar footer reading `GET /data-rooms/:id/usage` under
  `['usage', dataRoomId]`, showing a loading state rather than a zero (BR-030) and a visible failure
  rather than silence (BR-050). Verify an upload and a delete both move the figures without a
  reload.

## 8. Web — keyboard map, focus and a11y (FR-VIEW-040)

- [x] 8.1 Add `apps/web/src/hooks/useKeyboardMap.ts` binding `↑` `↓`, `Shift` `↑` `↓`, `Enter`,
  `Backspace`, `F2`, `Delete`, `Ctrl/⌘ A`, `Ctrl/⌘ X` / `C` / `V`, `/` and `Esc` (viewer → dialog →
  inline rename → clear selection, in that order), ignoring every event originating in an input,
  textarea or inline rename. Verify with a Vitest spec covering the `Esc` order and the
  typing-in-a-field exemption.
- [x] 8.2 Sweep the listing, toolbar, viewer and dialogs for focus: visible focus rings on every
  control, focus trapped in dialogs and the viewer, focus returned to the opener on close, and an
  `aria-label` on every icon-only button. Verify by driving one full create → rename → move →
  delete cycle with the keyboard alone.

## 9. Validation script

- [x] 9.1 Write `scripts/validate/ux-ui-polish.sh` to the AGENTS.md contract — bash,
  `set -euo pipefail`, executable, `API_BASE_URL` defaulting to `http://localhost:3000/api`,
  creating and deleting its own accounts and files so two consecutive runs both pass. It asserts:
  FR-FILE-060 copy a file, copy a subtree, BR-020 suffix at the target, `400 INVALID_MOVE` into own
  descendant, `404 NOT_FOUND` for a foreign id, `403 READ_ONLY` for a share token, BR-060 nothing
  left behind after a failed copy; FR-ACCT-010 totals, zeros, exact >4 GiB figure, `404` for another
  owner and `404` for a share token. It closes by printing the manual checklist for FR-FILE-070,
  FR-VIEW-010, FR-VIEW-030, FR-VIEW-040 and FR-VIEW-050 as listed in design.md § Validation. Verify
  it exits 0 against the running app.
- [x] 9.2 Run `pnpm verify` and `scripts/verify-spec-coverage.sh --change ux-ui-polish`, and paste
  any failure verbatim before calling this change done.

## 10. Docs reconciliation

- [x] 10.1 If the implementation diverged from the plan — a different endpoint shape, an extra error
  code, a UI affordance not in docs/04 — update `docs/02`, `docs/03` or `docs/04` to match and say
  so in the commit body. Drop this task if nothing diverged.
