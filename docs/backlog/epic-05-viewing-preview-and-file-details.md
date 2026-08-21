# Epic E05 — Viewing, Preview & File Details

## Purpose

This epic owns everything a person does with a document they are not changing: seeing it in a list
or a grid, learning its facts, and reading it. It is the highest-frequency moment in this market and
the most consistently reported failure across every incumbent at every price point, which makes it
the epic where a benchmarkable claim is available to us: the first page of a large confidential
document readable on a phone, over a poor 4G link, in about two seconds. It also translates two
desktop primitives from the brief that have no touch analogue at all: the hover preview pane and the
split view.

## Related documents

- [Documentation index](../README.md)
- [Prior art & UX benchmark](../01-prior-art-and-ux-benchmark.md)
- [Personas & JTBD](../02-personas-and-jtbd.md)
- [Product overview](../03-product-overview.md)
- [Epics](../04-epics.md)
- [Functional requirements](../05-functional-requirements.md)
- [Business rules & permissions](../06-business-rules-and-permissions.md)
- [Non-functional requirements](../07-non-functional-requirements.md)
- [Mobile UX spec](../08-mobile-ux-spec.md)
- [Domain model & glossary](../09-domain-model-and-glossary.md)
- [Success metrics & analytics](../10-success-metrics-and-analytics.md)
- [Master backlog](../11-master-backlog.md)
- [Risks & open questions](../12-risks-and-open-questions.md)
- Sibling backlogs: [E01 Access & Identity](./epic-01-access-and-identity.md),
  [E02 Data Rooms & Workspace Home](./epic-02-data-rooms-and-workspace-home.md),
  [E03 Folder Hierarchy & Navigation](./epic-03-folder-hierarchy-and-navigation.md),
  [E04 File Operations](./epic-04-file-operations.md),
  [E06 Search & Discovery](./epic-06-search-and-discovery.md),
  [E07 Sharing & Access Control](./epic-07-sharing-and-access-control.md),
  [E08 Conflict Resolution & Data Integrity](./epic-08-conflict-resolution-and-data-integrity.md),
  [E09 Mobile UX Foundations](./epic-09-mobile-ux-foundations.md),
  [E10 Performance, Offline & Scale](./epic-10-performance-offline-and-scale.md),
  [E11 Trust, Audit & Notifications](./epic-11-trust-audit-and-notifications.md),
  [E12 Account, Storage & Governance](./epic-12-account-storage-and-governance.md)

## Epic summary

| Field | Value |
| --- | --- |
| Epic ID | E05 |
| Goal | Make a large confidential document readable, legible and resumable on a 360 px screen within seconds, and expose every fact about a file (size, type, dates, owner, path, version, who can see it) without a hover pane, a fixed-width table or a desktop. |
| Primary personas | P2 Dev Raman (first-time buyer, Android, commuter train, 20 to 40 second bursts across a dozen sessions a day), P5 Ingrid Sørensen (seed-fund partner, iPhone, taxi, 60 seconds to 4 minutes, interrupted and resumed), P3 Tomás Ferreira (buy-side CPA, triages on the phone and analyses on a laptop, the persona who justifies the desktop inspector), P1 Marcy Doyle (checks what her buyer will actually see), P4 Ashley Kim (uses list versus tiles and sort to keep a room tidy) |
| Release span | R1 (stories 01 to 12), R2 (stories 13 to 17) |
| Story count | 17 |
| Total points | 82 |
| Depends on | [E09](./epic-09-mobile-ux-foundations.md) (sheets and detents, full-screen routes, history entries, safe area, reduced motion, live regions), [E03](./epic-03-folder-hierarchy-and-navigation.md) (the folder listing this epic renders), [E04](./epic-04-file-operations.md) (something must be uploaded before it can be previewed), [E10](./epic-10-performance-offline-and-scale.md) (virtualisation, lazy loading, streaming budgets, cached reads) |
| Blocks | [E06](./epic-06-search-and-discovery.md) (result rows reuse the row anatomy and the details sheet), [E07](./epic-07-sharing-and-access-control.md) (watermarking applies to rendered preview pages, and the recipient experience is this viewer), [E11](./epic-11-trust-audit-and-notifications.md) (viewer analytics and page-level dwell are measured from this viewer's view sessions) |

## Mobile-first design stance

- **The hover preview pane is replaced by two surfaces, not shrunk into one.** There is no hover on
  touch, so nothing may be gated behind it. Tapping a row opens a **full-screen viewer** that is its
  own history entry. Tapping the row's info affordance opens a **details bottom sheet at the medium
  detent**, so the list stays partly visible and the reader keeps their place. At expanded width the
  same details component docks as a right-hand inspector: one component, two presentations.
- **A fixed-width metadata table is illegal at 360 px, so metadata moves into the sheet.** WCAG 2.2
  SC 1.4.10 forbids two-dimensional scrolling at 320 CSS px, and a table with name, size, type,
  modified, owner, path and permissions cannot fit. The list row therefore carries the name, a type
  indicator and exactly one line of secondary metadata; everything else is one tap away.
- **Rendering is delegated above a size threshold, because the phone's ceilings are real and
  uncatchable.** iOS caps a single canvas at 16,777,216 pixels and enforces an additional total
  canvas memory budget, and a mobile Safari page was measured crashing at roughly 100 MB of
  allocated JavaScript data with no catchable exception. So: server-rendered page images streamed
  one page at a time, a single reused canvas capped to viewport times `min(devicePixelRatio, 2)`,
  explicit canvas release on close, and never a client-side engine parsing a whole document into the
  tab.
- **Pinch-zoom is supported and is never the only zoom.** SC 2.5.1 is Level A. Every viewer carries
  single-pointer zoom-in, zoom-out and fit-to-width controls, and text-heavy documents offer a
  reflow-to-width reading mode, which is the direct answer to the finding that 45 percent of people
  have abandoned a document on a phone.
- **Sessions are short, interrupted and resumed, so position is a first-class stored value.** A
  complete investor deck review measures around 3.2 minutes with roughly 15 seconds per page after
  the first, and recipient sessions here run 20 seconds to 4 minutes. Page and scroll offset are
  persisted on `visibilitychange` to hidden and on `pagehide`, because those are the last moments
  code is guaranteed to run, and restored per file per principal.
- **Split view is gated on height as well as width.** A landscape phone is medium width and compact
  height, which is exactly where a width-only rule breaks. The true two-pane view appears only at
  600 dp width *and* 480 dp height, ideally 840 dp width; at compact width the capability exists as
  the staging tray from [E04](./epic-04-file-operations.md) US-E04-10, and the interface says so in
  those words.
- **Read-only is enforced in the viewer by the server, not by a hidden button.** Capabilities are
  resolved per request and rendered from `NodeCapabilities`; a download-disabled grant is refused at
  the API with `403 DOWNLOAD_NOT_PERMITTED` even if a client offers the control, and a revocation
  mid-read terminates the view session at its next heartbeat.
- **No dead ends.** A type we cannot render still gets a screen that names the type, states plainly
  that no preview is available, and offers the actions that do work. Quick Look's principle applies:
  let people preview what the app cannot open, and when it cannot, hand it to something that can.
- **Desktop adds the inspector, the tree, the split and the keyboard, and takes nothing away.**
  Hover affordances exist only inside `@media (hover: hover) and (pointer: fine)` and never carry
  unique information.

---

## User stories

### US-E05-01 — The list row: what a file looks like on a 360 px screen

**As a** P2 Dev Raman scanning a folder on a train **I want** each row to tell me what the file is
and let me act on it with one thumb **so that** I can decide in seconds what is worth opening.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | none |
| Traces to | FR-VIEW-001, FR-VIEW-033, FR-MOB-002, FR-MOB-028, FR-MOB-037, NFR-A11Y-001, NFR-A11Y-002, NFR-PERF-003 |

**Acceptance criteria**

1. **Given** a folder listing **when** it renders at compact width **then** each row is a fixed 64
   CSS px tall and shows a leading type indicator or thumbnail box, the item name on one line
   truncated with an ellipsis at the end, one line of secondary metadata, and a trailing overflow
   control.
2. **Given** a file row **when** the secondary line renders **then** it reads size and relative
   modified time for a file ("2.4 MB · 3 days ago") and item count for a folder ("12 items"), with
   the full timestamp available in the details sheet.
3. **Given** a row **when** it is tapped anywhere outside the overflow **then** a folder navigates and
   a file opens the full-screen viewer; no row action depends on a long-press alone, and no
   information appears only on hover.
4. **Given** a row **when** the trailing overflow is rendered **then** it is a 48 x 48 CSS px target
   at least 8 px from any other target, and it opens the same action set as long-press.
5. **Given** a file whose thumbnail has not yet arrived **when** the row renders **then** the
   thumbnail box is reserved at its final size so that arrival causes no layout shift, and the
   measured CLS for the folder route stays at or below 0.1 at the 75th percentile.
6. **Given** an item that is currently shared **when** the row renders **then** a shared indicator is
   shown on the row and activating it opens that item's share settings, so "who can see this" is
   answerable from the list.
7. **Given** a file still being scanned or rendered **when** the row renders **then** its state is
   shown on the row ("Checking for viruses", "Preparing preview") rather than the row appearing
   inert.
8. **Given** a screen reader **when** a row receives focus **then** it announces name, kind, size,
   modified date, shared state and selection state in that order, and the overflow announces its own
   accessible name containing its visible label.

**Mobile acceptance criteria**

- At 360 x 640 with 200 percent text size, the name wraps to a second line and the row grows rather
  than clipping the overflow control off-screen; no horizontal scrolling occurs at 320 CSS px.
- Long file names are truncated at the end in the list but shown in full, wrapped, in the details
  sheet, because a middle-truncated filename hides the extension.
- The row's tap target and the overflow's tap target never overlap, verified by an automated hit-box
  test at 320, 360 and 390 CSS px.
- Right-to-left names render with correct bidirectional isolation so the extension does not visually
  jump to the wrong end.
- Rows render from a virtualised window of at most three pages (about 150 rows) so a 10,000-item
  folder does not exceed the device memory ceiling.
- With reduced motion enabled, row press states use opacity rather than movement.

**Edge cases & negative paths**

- Zero-byte file: shows "0 B", never blank.
- Missing modified date (imported data): shows "Date unknown" rather than an epoch.
- A file whose type cannot be determined: shows a generic document glyph and the sniffed type in the
  details sheet, never "undefined".
- An item the principal may read but not download: no download affordance renders on the row, and the
  API refuses regardless.
- Thumbnail request fails: the row degrades to a type glyph and never blocks or retries in a loop.

---

### US-E05-02 — Tiles view and a persisted view preference

**As a** P1 Marcy Doyle checking a folder of scanned pages **I want** a grid of thumbnails **so that**
I can tell which photograph is the P&L without opening each one.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E05-01 |
| Traces to | FR-VIEW-002, FR-VIEW-003, FR-VIEW-004, FR-MOB-028, NFR-A11Y-002, NFR-PERF-003 |

**Acceptance criteria**

1. **Given** a folder screen **when** the view control is activated **then** the listing switches
   between list and tiles without a page reload and without losing scroll anchoring on the item that
   was at the top.
2. **Given** tiles view at 360 CSS px **when** it renders **then** at least two columns are shown,
   each tile has a fixed aspect-ratio thumbnail box, and the name is shown on at most two lines
   beneath it.
3. **Given** the view control **when** it renders **then** it is always visible on the folder screen
   (never inside an overflow), is at least 48 x 48 CSS px, and states the target state in its
   accessible name ("Switch to tiles").
4. **Given** a chosen view mode **when** the principal returns to the same room on the same or another
   device **then** the mode is applied, because the preference is persisted per account per room via
   `PATCH /me` and returned with the room summary.
5. **Given** tiles view **when** the viewport widens to medium and expanded **then** the column count
   increases at the documented breakpoints (2 at 360, 3 at 600, 4 at 840, 6 at 1200) without
   changing the tile aspect ratio.
6. **Given** tiles view **when** a screen reader traverses it **then** it is exposed as a grid with
   row and column semantics, and each tile announces the same fields as a list row.
7. **Given** selection mode **when** tiles view is active **then** checkboxes appear on tiles at 48 x
   48 CSS px in a consistent corner and the contextual action bar behaves identically to list view.

**Mobile acceptance criteria**

- Switching views does not refetch the listing; the same cursor page set is re-laid out, verified by
  a network assertion in the E2E test.
- Tile targets are at least 48 CSS px in both dimensions including their label, with 8 px gutters.
- At 200 percent text size tile names truncate to two lines with an ellipsis and the full name is
  available in the details sheet; the tile does not overflow its grid cell.
- Tiles view is usable in landscape on a phone (medium width, compact height) without vertical
  clipping of the first row under the sticky header.
- Scroll position is preserved across a view switch and across a return from the viewer.

**Edge cases & negative paths**

- A folder of 10,000 items in tiles view: virtualised by row of tiles, with the same three-page DOM
  budget; the sticky header still reports "1 to 50 of about 10,240".
- Mixed folders and files in tiles: folders render as folder tiles with item counts, ordered before
  files by the default sort.
- No thumbnails available at all (a folder of ZIP files): tiles degrade to large type glyphs and the
  view remains useful rather than empty.
- Preference write fails offline: the local choice applies immediately and syncs on reconnect; it is
  never lost silently.

---

### US-E05-03 — Thumbnails: server-generated, lazily loaded, never layout-shifting

**As a** P5 Ingrid Sørensen opening a room in a taxi **I want** thumbnails to appear without the list
jumping under my thumb **so that** I do not tap the wrong document.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E05-01, US-E05-02 |
| Traces to | FR-VIEW-005, FR-VIEW-006, FR-PERF-006, FR-PERF-017, NFR-PERF-003, NFR-PERF-005, NFR-MOB-002 |

**Acceptance criteria**

1. **Given** an uploaded image, PDF or video **when** the commit completes **then** a thumbnail job is
   enqueued and `thumbnailState` moves `pending` to `ready`, and `GET /nodes/:nodeId/thumbnail`
   returns `202` while pending rather than blocking.
2. **Given** a type with no possible thumbnail **when** the listing renders **then** `thumbnailState`
   is `unsupported` and a type glyph is served immediately, with no request retried in a loop.
3. **Given** a scrolling list **when** rows approach the viewport **then** thumbnails are requested
   through `IntersectionObserver` with a 200 px root margin, at most six concurrent requests, and
   requests for rows scrolled far out of view are cancelled.
4. **Given** a thumbnail **when** it is served **then** it is delivered in a modern format where the
   client advertises support, sized to the requested density bucket, with immutable caching, and it is
   never included inline in the listing payload.
5. **Given** any thumbnail arrival **when** it paints **then** no layout shift occurs, because the box
   was reserved at its final aspect ratio before the request was made.
6. **Given** thumbnail generation fails **when** the state resolves **then** `thumbnailState` is
   `failed`, a type glyph is shown, and the failure is recorded in telemetry with the file type so the
   pipeline can be improved.
7. **Given** a data-saving preference or a metered connection with data saving enabled **when** the
   list renders **then** thumbnails are suppressed in favour of type glyphs and the state is
   discoverable in the overflow as "Thumbnails off to save data".

**Mobile acceptance criteria**

- Scrolling a 10,000-item folder at speed on the reference device does not produce a main-thread task
  over 50 ms and does not exceed six in-flight thumbnail requests, verified by a performance trace and
  a network trace.
- Total thumbnail bytes for the first viewport at 360 CSS px stay under 120 KB (Estimate: 6 tiles at
  about 20 KB), so the folder route stays inside the initial-route budget.
- A thumbnail never becomes the largest contentful paint element for the route; the LCP element is the
  first row's text, keeping LCP at or under 2.5 seconds at the 75th percentile of mobile sessions.
- Offline, previously fetched thumbnails render from the cache and missing ones degrade to glyphs with
  no error state.
- With a screen reader, thumbnails are decorative and are not announced; the row's text carries the
  meaning.

**Edge cases & negative paths**

- Animated GIF or long video: a single static frame is used; no animation plays in a list.
- HEIC source: the thumbnail is served in a web format while the stored file remains HEIC.
- A password-protected PDF: `thumbnailState` is `unsupported`, and the details sheet states "This PDF
  is password protected, so we cannot show a preview."
- Extremely large image (20,000 x 20,000 px): the server downsamples for the thumbnail; the client
  never decodes the original in a list.
- A file whose bytes are quarantined by the scanner: no thumbnail is generated and the row shows the
  blocked state.

---

### US-E05-04 — Sort controls with a persisted preference

**As a** P4 Ashley Kim **I want** to sort a folder by newest or by size **so that** I can find what
arrived today or what is bloating the room, from a phone.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E05-01 |
| Traces to | FR-VIEW-025, FR-VIEW-026, FR-VIEW-027, FR-PERF-002, NFR-SCALE-001, NFR-A11Y-003 |

**Acceptance criteria**

1. **Given** a folder screen **when** the sort control in the sticky header is activated **then** a
   single sheet offers name, size, type, modified date and created date, each with ascending and
   descending, and the current selection is marked.
2. **Given** a sort change **when** it is applied **then** the listing is refetched from the first
   cursor page with the new `sort` parameter, the previous cursor is discarded, and the header states
   the new order.
3. **Given** the default state **when** a folder is first opened **then** the order is folders first,
   then files, each alphabetical and case-insensitive, with a stable id tie-breaker so pagination
   cannot duplicate or skip a row.
4. **Given** the setting to sort folders and files together **when** it is enabled **then** it applies
   in every room and is persisted per account.
5. **Given** a chosen sort **when** the principal returns to the same room **then** it is reapplied,
   because it is persisted per account per room.
6. **Given** an unsupported or unindexed sort request **when** the API receives it **then** it returns
   `400 UNSUPPORTED_SORT` with the message "That sort is not available here." and the control reverts
   to the previous value rather than leaving the list in an undefined order.
7. **Given** a sort change **when** it completes **then** a polite live region announces "Sorted by
   newest first, 312 items", so a screen-reader user learns the outcome without focus moving.

**Mobile acceptance criteria**

- The sort control is inside the sticky header, at least 48 x 48 CSS px, and shows the active sort as
  text (not an icon alone) at 360 CSS px, truncating the label before the direction indicator.
- The sort sheet has at most ten labelled rows in two grouped sections, does not scroll at 360 x 640
  at default text size, and is a modal bottom sheet rather than an action sheet.
- Changing sort resets scroll to the top deliberately and says so ("Sorted by size, back at the top"),
  because silently keeping a scroll offset in a re-ordered list is disorienting.
- On a slow connection the previous list stays visible marked as stale while the new order loads; the
  list is never emptied to a spinner.
- With a hardware keyboard, the sort menu is reachable and operable without a pointer.

**Edge cases & negative paths**

- Sorting a folder while an upload commits into it: the new item appears in its correct position on the
  next page fetch; no duplicate row appears because the cursor is keyset-based.
- Two items with identical names and timestamps: order is stable across pages because of the id
  tie-breaker.
- Sort by size on a folder of folders: folder sizes are rolled up and eventually consistent, and the
  header notes "Folder sizes are approximate".
- Preference write fails: local sort applies and syncs later.

---

### US-E05-05 — File and folder details in a bottom sheet

**As a** P3 Tomás Ferreira **I want** to see a file's facts without leaving the list **so that** I can
tell in fifteen seconds whether this is the AR ageing I asked for.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E05-01 |
| Traces to | FR-VIEW-007, FR-VIEW-008, FR-VIEW-009, FR-FLDR-025, FR-MOB-005, FR-SHARE-023, NFR-A11Y-001, NFR-A11Y-002 |

**Acceptance criteria**

1. **Given** a row **when** the details affordance is activated (from the row overflow, the long-press
   sheet, or the viewer's Info control) **then** a bottom sheet opens at the medium detent, leaving the
   underlying list partly visible and its scroll position untouched.
2. **Given** the details sheet for a file **when** it renders **then** it shows name (wrapped, in
   full), file size in the same units used elsewhere, sniffed type, created timestamp, modified
   timestamp with the timezone named, the principal who last changed it, the full path, the current
   version number, and the list of principals with access.
3. **Given** the details sheet for a folder **when** it renders **then** it shows name, full path,
   direct item count, recursive item count, rolled-up size, created and modified timestamps, the
   creating principal, and the principals with access.
4. **Given** the sheet **when** the grabber is dragged **then** it resizes between medium and large
   detents; **when** the grabber is tapped once **then** it cycles detents, providing the non-dragging
   single-pointer alternative required by SC 2.5.7.
5. **Given** the sheet **when** the principal swipes down or activates the close control **then** it
   dismisses and returns to the list at its previous scroll position, and the system back does the same
   because the sheet is its own history entry.
6. **Given** the sheet **when** an action is chosen inside it (rename, move, share, download, delete)
   **then** the sheet closes before any other sheet opens, so that only one sheet is ever presented at
   a time.
7. **Given** the access list **when** it renders **then** it shows each principal or link with its role
   and whether download is allowed, sourced from `GET /nodes/:nodeId/access`, and it is visible only to
   principals with `canManagePermissions`; other principals see their own effective access instead.
8. **Given** a version count above one **when** the sheet renders **then** the version row states the
   count and links to version history (E08), so "which copy is this" is answerable.

**Mobile acceptance criteria**

- The sheet at the medium detent occupies at most 55 percent of a 640 px viewport height, leaving at
  least three list rows visible above it.
- The grabber is at least 48 CSS px wide and 48 CSS px tall in its hit area, and works with a screen
  reader so the sheet can be resized without sight.
- Every label and value pair wraps rather than truncating at 360 CSS px and 200 percent text size; the
  path wraps across lines and is copyable with a single tap on Copy path.
- Opening the sheet does not steal focus from the list for screen-reader users beyond the standard
  modal focus trap, and closing it returns focus to the row that opened it.
- The sheet's action row sits in the thumb zone, with destructive actions visually separated and
  placed last.
- On a flaky connection the sheet renders from the cached node immediately and marks the access list as
  loading rather than blocking the whole sheet.

**Edge cases & negative paths**

- The node is deleted by another principal while the sheet is open: the sheet switches to "This item
  was deleted" with a Close action, rather than showing stale facts.
- The access list is long (30 grants): it is virtualised inside the sheet and shows "and 24 more" with
  a link to the share-management screen.
- A guest with `canRead` only: the sheet hides owner-only fields (activity, full access list) and says
  "You have view-only access to this room."
- Timestamps in a different timezone from the device: shown in the device timezone with the zone
  named, never in UTC without a label.
- Size not yet rolled up for a folder: shown as "Calculating…" with a value once available, never as 0
  B.

---

### US-E05-06 — The full-screen viewer shell

**As a** P2 Dev Raman **I want** a document to fill the screen and close the way I expect **so that**
I never feel trapped in a reader on a phone.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E05-01 |
| Traces to | FR-VIEW-010, FR-VIEW-011, FR-VIEW-012, FR-VIEW-034, FR-FLDR-020, FR-MOB-044, NFR-A11Y-001, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** a file row **when** it is tapped **then** the viewer opens as a full-screen route with its
   own history entry, and both the Android system back and the in-app back control close it and return
   to the list at its previous scroll position.
2. **Given** the viewer **when** the principal swipes down from the content area **then** it dismisses;
   a visible close control in the top leading corner does the same, so the gesture is never the only
   route.
3. **Given** the viewer **when** the principal swipes horizontally **then** it moves to the previous or
   next file in the folder's active sort order, and visible previous and next controls provide the
   single-pointer equivalent required by SC 2.5.1.
4. **Given** the viewer **when** it renders **then** the room name and the file name are both visible in
   the header, so the room is never ambiguous while reading a confidential document.
5. **Given** the viewer **when** the device is rotated **then** it works in both orientations with no
   lock and no instruction to rotate, and the current page and zoom survive the rotation.
6. **Given** the viewer's chrome **when** the principal taps the content once **then** the chrome
   toggles between shown and hidden, and hidden chrome always reappears on any interaction with a
   control edge, so the reader cannot be stranded without controls.
7. **Given** the viewer **when** it opens **then** a view session is created via
   `POST /rooms/:roomId/view-sessions`, and heartbeats report dwell to E11 without blocking rendering.
8. **Given** a screen reader **when** the viewer opens **then** focus moves into the viewer, the
   document's accessible name is announced, and the close control is the first focusable element.

**Mobile acceptance criteria**

- All viewer controls sit within `env(safe-area-inset-*)` and no control is under the home indicator or
  the notch; the bottom action row is inside the thumb zone.
- Swipe-down-to-dismiss does not fire while the content is zoomed in beyond fit-to-width, because the
  gesture would fight panning; the close control still works.
- Horizontal file-to-file swipes do not start within 24 CSS px of either screen edge, so the Android
  system back gesture is never intercepted.
- The viewer opens to a first meaningful frame (header, page frame, skeleton) within 300 ms on the
  reference device, before any page bytes arrive.
- With reduced motion enabled, page transitions cross-fade at most and never slide or scale.
- At 200 percent text size the header truncates the room name before the file name and neither
  overlaps a control.

**Edge cases & negative paths**

- Last file in the folder: the next control is absent rather than disabled, and a swipe past the end
  produces a bounce, not a blank screen.
- The file is deleted by another principal while open: the viewer shows "This file was deleted or
  moved" with a Back to folder action, per FR-CONF-020, never a blank pane or a raw error.
- Deep link straight into the viewer with no list context: previous and next are absent and back exits
  to the containing folder.
- Standalone installed iOS web app with no browser chrome: the in-app back control is present on every
  viewer instance.
- Opening a viewer while an upload runs: both continue; the tray collapses to its bar above the viewer
  action row.

---

### US-E05-07 — PDF preview: manifest, progressive server-rendered pages, first-page budget

**As a** P5 Ingrid Sørensen with four minutes between meetings **I want** the first page of a large
PDF on screen in about two seconds **so that** I can decide whether this deal is worth my weekend.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E05-06 |
| Traces to | FR-VIEW-014, FR-VIEW-015, FR-VIEW-016, FR-VIEW-019, FR-PERF-020, NFR-PERF-004, NFR-MOB-002, NFR-SCALE-002, NFR-PRIV-001 |

**Acceptance criteria**

1. **Given** a PDF **when** the viewer opens **then** `GET /nodes/:nodeId/preview` returns a manifest
   carrying page count, per-page image URLs by density bucket, whether a watermark applies, and a
   render state; `202` is returned while rendering with a stated retry interval.
2. **Given** a document above the server-render threshold (Assumption: 10 MB or 50 pages) **when** it
   is previewed **then** pages are served as server-rendered images from `PreviewAsset` and the client
   never parses the document; below the threshold client rendering is permitted but still page-at-a-
   time.
3. **Given** the reference device on the reference network (9 Mbps down, 100 ms RTT) **when** a 200 MB
   PDF is opened **then** the first page is visibly readable within 2.5 seconds at the 75th percentile
   of real user sessions, measured in the field and reported per file-size band.
4. **Given** any preview **when** pages render **then** at most one drawing surface exists at a time,
   capped to viewport dimensions times `min(devicePixelRatio, 2)`, and it is explicitly released
   (resized to 1 x 1 and cleared) when the viewer closes.
5. **Given** a long document **when** the reader scrolls or pages **then** the next page is prefetched
   and at most three page images are retained in memory, so peak heap attributable to the viewer stays
   under 48 MB on the reference device.
6. **Given** a page image request **when** it is served **then** it is delivered in a modern format
   where supported, is authorised per request against the caller's grant, and its URL is not
   guessable or shareable beyond the signed lifetime.
7. **Given** a document that is still rendering **when** the viewer is open **then** a skeleton page
   frame of the correct aspect ratio is shown with "Preparing page 1", and the first available page
   replaces it without layout shift.
8. **Given** rendering fails for a page **when** the reader reaches it **then** that page shows
   "This page could not be prepared" with a Retry control, and the rest of the document remains
   readable.
9. **Given** any third-party service participates in rendering **when** the architecture is reviewed
   **then** it is named in the privacy documentation as a processor, because a confidential
   memorandum passing through an undisclosed renderer is a compliance defect.

**Mobile acceptance criteria**

- QA script on an iPhone SE 3rd generation and a Galaxy A24 4G: open a 200 MB, 1,200-page PDF over a
  throttled 4G profile; the first page must be readable and the tab must not crash, repeated five
  times without a reload.
- No single main-thread task exceeds 50 ms during page turns; the decode happens off the main thread
  where `createImageBitmap` is available.
- Page images are sized for the device: a 360 CSS px viewport at DPR 3 requests at most a 1080 px wide
  render, never a print-resolution page.
- On losing connectivity mid-document, pages already fetched remain readable and the next page shows
  "No connection. Pages you have already opened are still available."
- Memory is verified, not assumed: a DevTools heap sample after 30 page turns must show no monotonic
  growth beyond the three-page retention window.
- With a screen reader, the page frame announces "Page 4 of 312" and the extracted text layer, where
  available, is exposed for reading; where it is not, the viewer says so rather than presenting an
  unlabelled image.

**Edge cases & negative paths**

- Password-protected PDF: the viewer states "This PDF is password protected. We cannot preview it." and
  offers download and open-in, per US-E05-11.
- Corrupt or truncated PDF: the manifest returns a render failure and the viewer offers download, never
  an infinite spinner.
- 5,000-page document: the manifest is paged, the page-jump control accepts a number, and the page
  count is stated as exact once known.
- Watermarked share (E07, R2): the watermark is composited into the rendered page server-side, so it
  cannot be stripped by disabling client code.
- Very tall or very wide page geometry (a survey drawing): fit-to-width is the default and the page's
  own aspect ratio is preserved.

---

### US-E05-08 — Zoom, fit-to-width, rotation and reflow reading mode

**As a** P2 Dev Raman reading a P&L in a queue **I want** the page legible at phone width without
pinching **so that** I actually finish the document instead of abandoning it.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E05-07 |
| Traces to | FR-VIEW-013, FR-VIEW-018, FR-VIEW-023, FR-MOB-030, FR-MOB-041, NFR-A11Y-001, NFR-A11Y-002 |

**Acceptance criteria**

1. **Given** a page **when** the viewer opens **then** the default zoom is fit-to-width, so the page's
   full width is visible and no horizontal panning is required to read a line.
2. **Given** the viewer **when** the zoom controls render **then** zoom-in, zoom-out and fit-to-width
   are single-pointer targets of at least 48 x 48 CSS px, in addition to pinch-to-zoom, satisfying
   WCAG 2.2 SC 2.5.1.
3. **Given** a zoomed page **when** the reader double-taps **then** it toggles between fit-to-width and
   the last explicit zoom level, and the pan position is retained.
4. **Given** a rotate control **when** it is activated **then** the displayed page rotates in 90 degree
   steps without modifying the stored file, and the rotation applies to the whole document for the
   duration of the session.
5. **Given** a text-based document (PDF with a text layer, plain text, Markdown, source code) **when**
   the reader activates reading mode **then** the text reflows to the viewport width with a
   user-selectable text size, with no horizontal scrolling at 320 CSS px.
6. **Given** reading mode **when** it is unavailable for a document (a scanned image-only PDF) **then**
   the control is absent and the viewer states "This document is a scan, so text cannot be reflowed"
   in the overflow rather than offering a broken control.
7. **Given** a zoom level above fit-to-width **when** the reader pans **then** panning is single-finger
   and does not trigger the dismiss or next-file gestures.
8. **Given** the platform text-size setting at 200 percent **when** reading mode is used **then** the
   text honours it and no control is clipped.

**Mobile acceptance criteria**

- Fit-to-width on a 360 CSS px viewport renders body text at an effective size of at least 16 CSS px
  for a standard A4 page, verified by measurement; if it cannot, reading mode is offered proactively
  with a one-line prompt.
- Pinch-zoom is never disabled by the viewport meta tag anywhere in the product.
- Zoom state and rotation persist across a page turn within the session, and are reset on opening a
  different file.
- Reading mode remembers its text size per account, so a reader does not reset it on every document.
- With a screen reader, reading mode exposes the text as a document region with headings where the
  source provides them.
- Rotation and zoom controls are within the thumb zone, and rotation is not adjacent to the close
  control.

**Edge cases & negative paths**

- Pinch on a device with a stylus or trackpad: the same zoom applies through the pointer events, and
  keyboard `+`, `-` and `0` map to zoom in, out and fit.
- Reading mode on a document with tables: tables are preserved in a horizontally scrollable container
  inside the reflowed text, so the table alone scrolls, not the page.
- A document whose text layer is garbled (bad embedded encoding): reading mode is offered but flags
  "Text extraction looks unreliable for this document" once.
- Zooming a very large page beyond the canvas cap: the render is tiled rather than allocating a single
  oversized surface, and the tab does not crash.
- Reduced-motion users: zoom transitions are instant rather than animated.

---

### US-E05-09 — Page indicator, jump-to-page and resume where I left off

**As a** P5 Ingrid Sørensen interrupted after forty seconds **I want** to come back to the exact page I
was on **so that** my six two-minute sessions add up to one real review.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E05-07 |
| Traces to | FR-VIEW-017, FR-VIEW-024, FR-PERF-014, NFR-AVAIL-001, NFR-A11Y-003, NFR-OBS-001 |

**Acceptance criteria**

1. **Given** a paginated document **when** the viewer renders **then** a page indicator shows "Page 4
   of 312" and remains visible whenever the viewer chrome is shown.
2. **Given** the page indicator **when** it is activated **then** a jump-to-page control opens
   accepting a page number, with a numeric keypad on mobile, and validates the range with the message
   "Enter a page between 1 and 312".
3. **Given** the viewer **when** the page or scroll offset changes **then** the position is persisted
   locally on a debounce and to the server on `visibilitychange` to hidden and on `pagehide`, because
   those are the last moments code is guaranteed to run.
4. **Given** a returning reader **when** they reopen the same file **then** the viewer restores the
   stored page and scroll offset and shows a one-line dismissible notice "Resumed on page 41", with a
   control to start from page 1.
5. **Given** the stored position **when** it is read **then** it is scoped per file per principal and
   per version, so restoring after a replacement does not land on a page that no longer exists.
6. **Given** a resume position that exceeds the current page count **when** the file is reopened
   **then** the viewer opens the last page and states "This document is shorter than when you last
   read it".
7. **Given** position tracking **when** it runs **then** it emits the analytics events used by E11 for
   page-level dwell without blocking rendering or delaying a page turn.

**Mobile acceptance criteria**

- QA script: open a 300-page PDF, read to page 41, switch apps for five minutes, kill the tab from the
  tab switcher, reopen the installed web app, open the same file. The viewer must resume on page 41.
- Resume works offline for a document whose pages are cached, and states honestly that later pages
  need a connection.
- The jump-to-page field keeps its Go control visible above the on-screen keyboard at 360 x 640 using
  the keyboard inset.
- The resume notice is announced politely, does not steal focus, and auto-dismisses after 5 seconds
  while remaining dismissible by tap.
- The page indicator is at least 48 CSS px tall as a tap target and shows the numbers, not just a
  progress bar, because a bar cannot answer "which page am I on".

**Edge cases & negative paths**

- Position saved on one device, resumed on another: the most recent position wins and the notice names
  the source ("Resumed on page 41 from your iPhone").
- The document was replaced with a new version between sessions: resume applies to the version read,
  and the viewer notes "A newer version is available" with a control to open it.
- Reader jumps to a page whose image has not rendered: a skeleton page frame of the correct aspect
  ratio is shown with the page number, never a blank screen.
- Position storage evicted by the browser: the file opens at page 1 with no error, because position is
  a convenience and never the only copy of anything.
- A file with one page: the indicator and jump control are hidden.

---

### US-E05-10 — Image, text and code preview

**As a** P1 Marcy Doyle **I want** photographs and plain-text files to open instantly **so that** the
room feels responsive even when the document is a scan.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E05-06 |
| Traces to | FR-VIEW-019, FR-VIEW-023, FR-PERF-017, NFR-PERF-004, NFR-MOB-002, NFR-A11Y-002 |

**Acceptance criteria**

1. **Given** a JPEG, PNG, WebP, HEIC, GIF or SVG **when** the viewer opens **then** a
   density-appropriate rendition is served and displayed fit-to-screen, with pinch and single-pointer
   zoom per US-E05-08.
2. **Given** an image larger than the viewport **when** it is displayed **then** the client requests a
   server-downscaled rendition rather than decoding the original, so a 20,000 px wide image does not
   exhaust memory.
3. **Given** an SVG **when** it is previewed **then** it is rendered in a sandboxed context with
   scripting disabled, because an SVG is executable content.
4. **Given** plain text, Markdown, CSV or a common source-code type **when** the viewer opens **then**
   the content reflows to the viewport width with no horizontal scrolling at 320 CSS px, with syntax
   highlighting for code and monospaced rendering preserved for CSV alignment inside a horizontally
   scrollable block.
5. **Given** a text file larger than the streaming threshold (Assumption: 2 MB) **when** it is opened
   **then** only the first window is fetched, with an explicit "Load more" control, so a 400 MB log
   file does not crash the tab.
6. **Given** an image preview **when** it renders **then** the first paint occurs within 1.5 seconds at
   the 75th percentile on the reference network for a file under 5 MB.
7. **Given** any of these types **when** the file is shared with watermarking (E07, R2) **then** the
   watermark is composited server-side into the served rendition.

**Mobile acceptance criteria**

- HEIC from an iPhone camera capture displays on Android, because the server normalises the rendition.
- An image preview never uses a `data:` URL, and no file is read into an ArrayBuffer client-side.
- Text preview honours the platform text-size setting up to 200 percent without clipping and without
  two-dimensional scrolling.
- With a screen reader, an image preview announces the file name and any stored description; the
  product does not invent alternative text.
- Rotation of a photograph respects the EXIF orientation, so a portrait photograph is not shown on its
  side.

**Edge cases & negative paths**

- Corrupt image bytes: "We could not display this image" with download and open-in, never a broken
  image glyph.
- A text file in an unknown encoding: decoded as UTF-8 with a note "Some characters may not display
  correctly", and the raw file is still downloadable.
- A CSV with 200 columns: the block scrolls horizontally inside the page while the page itself does
  not, satisfying reflow.
- An SVG referencing external resources: blocked by the content policy and noted once.
- A `.txt` file that is actually binary: shown as unsupported per US-E05-11 rather than rendering
  mojibake.

---

### US-E05-11 — Unsupported type: a fallback that never dead-ends

**As a** P3 Tomás Ferreira **I want** a clear route when the product cannot render a file **so that** I
can still get to my data instead of hitting a wall.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E05-06 |
| Traces to | FR-VIEW-021, FR-FILE-019, FR-FILE-023, NFR-COMPAT-001, NFR-A11Y-003 |

**Acceptance criteria**

1. **Given** a file whose type has no preview in the current release **when** the viewer opens **then**
   `GET /nodes/:nodeId/preview` returns `415 UNSUPPORTED_PREVIEW_TYPE` and the viewer shows a state
   that names the type ("This is a ZIP archive"), states plainly "We cannot preview this file type
   yet", and offers the actions that do work.
2. **Given** that state **when** the principal has download permission **then** Download and (where
   the platform supports file sharing) Open in another app are offered as primary actions.
3. **Given** that state **when** the principal does not have download permission **then** neither
   action is offered and the copy reads "You have view-only access and this file type cannot be
   previewed. Ask the owner to send it another way." with a one-tap request that notifies the owner.
4. **Given** the unsupported state **when** it renders **then** it also shows the file's key facts
   (size, type, modified, path) inline, so the screen is informative rather than merely apologetic.
5. **Given** a type that will be supported in a later release (Office formats in R2) **when** the state
   renders **then** the copy does not promise a date, and the analytics event
   `preview_unsupported_type` records the MIME type so the support matrix is driven by real demand.
6. **Given** a file that is temporarily unavailable rather than unsupported (rendering, scanning,
   failed) **when** the viewer opens **then** the state is distinct from unsupported and states which
   it is, because "not yet" and "never" are different answers.

**Mobile acceptance criteria**

- The state fits at 360 x 640 without scrolling at default text size, and wraps rather than truncating
  at 200 percent.
- Actions are in the thumb zone at 48 CSS px minimum, with Download as the leading action.
- The state is announced politely on open, including the type and the available actions.
- Back from the unsupported state returns to the list at its previous scroll position, exactly as the
  viewer does.
- No spinner is shown on an unsupported type: the answer is immediate.

**Edge cases & negative paths**

- A file type this build cannot preview: the copy names the type and what the user can do instead
   (Download, Open in another app), never a bare refusal.
- A `blocked` file (malware detection): the state says "This file failed our security scan" and offers
  no download.
- Type supported but rendering permanently failed: the state offers Retry once and then Download.
- Unsupported type reached by deep link from a share: the recipient sees the same state, with no
  information about the room beyond the shared scope.

---

### US-E05-12 — Read-only, download-off and revocation while reading

**As a** P1 Marcy Doyle who has just revoked a buyer **I want** their open document to stop working
**so that** revocation is a real security control rather than a hidden button.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E05-06, US-E05-07 |
| Traces to | FR-SHARE-011, FR-SHARE-015, FR-SHARE-017, FR-SHARE-018, FR-VIEW-035, NFR-SEC-001, NFR-SEC-002, BR-108, BR-121 |

**Acceptance criteria**

1. **Given** any viewer session **when** the client renders affordances **then** it renders them from
   the server-resolved `NodeCapabilities` on the response, never from a role string, so read-only
   enforcement cannot drift between interface and API.
2. **Given** a grant with the download flag off **when** the viewer renders **then** no download,
   share-to-app or print affordance is present, and a direct request to
   `GET /nodes/:nodeId/content` returns `403 DOWNLOAD_NOT_PERMITTED` with the message "The owner turned
   off downloads for this file." This is asserted by a security test that bypasses the interface.
3. **Given** a view-only principal **when** any mutating request is issued (rename, move, delete,
   upload into the folder) **then** the API returns `403 READ_ONLY_SHARE`, any optimistic client change
   is reverted, and a persistent "View only" chip is shown in the header.
4. **Given** a share is revoked **when** the reader's next view-session heartbeat or page request
   occurs **then** it is refused within the propagation target in BR-108 (Assumption: 15 seconds), the
   viewer replaces the content with "This link no longer works." and offers Request access, revealing
   nothing about the document or the room.
5. **Given** signed page-image URLs already issued **when** the share is revoked **then** they stop
   working because the signing key version is rotated, so a pre-fetched page cannot outlive the
   revocation.
6. **Given** a locally cached preview of a revoked item **when** the app next validates **then** the
   cached copy is purged and the reader sees the revoked state, within one successful network call.
7. **Given** a watermarked share (R2) **when** any page renders **then** the watermark carrying the
   viewer identifier and access timestamp is composited server-side into the page image, and no client
   flag can remove it.
8. **Given** any refusal in this story **when** it occurs **then** an activity entry records the denied
   access with the reason, so an owner can prove the control worked.

**Mobile acceptance criteria**

- QA script, two devices: device A revokes while device B has the document open. Device B must show the
  revoked state within 15 seconds without the reader taking any action.
- The revoked state is a full-screen state, not a toast over a still-readable document.
- The "View only" chip is visible in the header at 360 CSS px without truncating the room name past
  recognisability, and is announced by a screen reader as part of the header region.
- Screenshot prevention is not claimed anywhere, because the web platform cannot provide it; the
  product's honest claim is watermarking plus audit.
- Offline, a cached document remains readable until the next successful validation, and the cache
  banner states "Cached copy, may be cleared by your browser" so the reader knows what they are
  looking at.

**Edge cases & negative paths**

- Revocation during an active platform download: the transfer may complete because the URL was already
  redeemed; this is stated in the sharing documentation and recorded in the audit log rather than
  hidden.
- Link expires mid-read: identical behaviour to revocation, with the message "This link expired." plus
  the expiry date.
- Room archived while reading: the viewer continues in read-only mode and the header shows "This room
  is archived and read-only."
- Grant downgraded from contributor to viewer mid-session: the next capability refresh removes the
  edit affordances and the header gains the chip; no client-only guard is trusted.
- Principal's account placed on hold by an administrator, or read-only after a quota reduction: reading stays available per BR-204 and E12,
  and mutating requests return `403 ACCOUNT_SUSPENDED`.

---

### US-E05-13 — Video and audio preview by streaming

**As a** P6 Ray Okonkwo **I want** a site walkthrough video to play without downloading it **so that**
I can show a prospect from the truck.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E05-06 |
| Traces to | FR-VIEW-019, FR-VIEW-022, FR-PERF-020, NFR-MOB-002, NFR-A11Y-001 |

**Acceptance criteria**

1. **Given** an MP4, MOV, MP3 or WAV file **when** the viewer opens **then** playback uses a media
   element fed by HTTP range requests or an adaptive manifest, and the file is never fetched into a Blob
   before playback.
2. **Given** a video **when** playback starts **then** the first frame appears within 3 seconds at the
   75th percentile on the reference network, and the player shows buffered progress honestly.
3. **Given** a download-disabled grant **when** a media file is played **then** range requests are
   authorised per request and the download affordance is absent; the media URL is signed and
   short-lived.
4. **Given** playback **when** the app is backgrounded **then** the product does not claim background
   playback on platforms that suspend it, and on return playback resumes at the same position.
5. **Given** a media file **when** the player renders **then** play, pause, seek, volume and a 15-second
   skip are all single-pointer targets of at least 48 CSS px, and seeking is possible without a drag
   (tap on the timeline plus skip controls).
6. **Given** captions or an audio description track exists in the file **when** playback begins **then**
   the track is selectable, and where none exists the product does not claim accessibility it does not
   have.
7. **Given** a large media file on a metered connection **when** playback is requested **then** a
   one-time confirmation states the estimated data use.

**Mobile acceptance criteria**

- Playback works in the installed web app on both iOS and Android, verified on real devices, including
  after a rotation.
- The player respects the platform mute switch and the system volume, and does not autoplay with sound.
- Seek by tapping the timeline works with a thumb at 360 CSS px, with a hit area at least 48 CSS px
  tall.
- Position is persisted like a document page position, so a 40-minute walkthrough resumes where it
  stopped.
- With a screen reader, the player announces state changes (playing, paused, buffering) through a
  polite live region.

**Edge cases & negative paths**

- Codec unsupported by the browser: falls back to the unsupported-type state naming the codec, with
  download offered where permitted.
- Network drops mid-playback: the player pauses with "Waiting for a better connection" rather than
  erroring out, and resumes automatically.
- Very long audio file with no metadata duration: the timeline shows elapsed time only and says so.
- A media file that is really a document: the sniffed type governs, and the viewer routes accordingly.

---

### US-E05-14 — Office document preview through server conversion

**As a** P3 Tomás Ferreira **I want** to read an Excel model and a Word summary on my phone **so that**
I can triage before I commit a desk session to it.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E05-07 |
| Traces to | FR-VIEW-020, FR-VIEW-016, NFR-PRIV-001, NFR-PERF-004, NFR-SEC-003 |

**Acceptance criteria**

1. **Given** a DOCX, XLSX or PPTX file **when** it is committed **then** a conversion job produces a
   paginated image or PDF representation, and `previewAvailable` becomes true only when the
   representation exists.
2. **Given** a converted document **when** the viewer opens **then** it uses exactly the same
   page-image pipeline, zoom, page jump and resume behaviour as a native PDF, so there is one viewer
   rather than two.
3. **Given** a spreadsheet **when** it is converted **then** each sheet is a labelled section with a
   sheet selector, because a spreadsheet paginated blindly is unreadable.
4. **Given** conversion fidelity limits **when** the viewer opens a converted document **then** a
   one-line notice states "Converted for viewing. Download for the original formatting." and the notice
   is dismissible per file.
5. **Given** conversion fails or times out **when** the viewer opens **then** the unsupported-type
   fallback is shown with the reason, and the failure is recorded with the file type for pipeline
   improvement.
6. **Given** the conversion runs **when** the architecture is reviewed **then** the converter runs
   inside our own processing boundary or a named processor documented in the privacy policy, is
   sandboxed, and never has network egress, because a converter is a large attack surface fed by
   untrusted files.
7. **Given** a converted representation **when** it is stored **then** it is treated as a derived asset
   that is regenerated on demand and is not counted against the account's storage quota.

**Mobile acceptance criteria**

- A 40-sheet workbook opens to a sheet selector rather than page 1 of 900, and the selector is a single
  sheet with search.
- First readable content for a 5 MB DOCX arrives within 3 seconds at the 75th percentile on the
  reference network.
- Reading mode is offered for word-processing documents because a converted page at 360 CSS px is often
  too small; for spreadsheets it is not offered and the reason is stated.
- Conversion progress uses the same skeleton page frame as PDF, with "Preparing this document" and no
  invented percentage.
- The fidelity notice does not obstruct the first page and is announced politely once.

**Edge cases & negative paths**

- Macro-enabled documents: converted for viewing with macros stripped, and the notice says so.
- Password-protected Office file: unsupported state with the reason.
- A 100 MB PowerPoint with embedded video: pages convert, embedded media is represented by a poster
  frame and a note that video is not included in the preview.
- Legacy binary formats (.doc, .xls): out of scope for R2 unless the converter supports them; the
  unsupported state names the format. Recorded as OQ45.
- A converted document whose share has watermarking enabled: the watermark is applied to the converted
  pages, not the source.

---

### US-E05-15 — Grouping and the docked desktop inspector

**As a** P4 Ashley Kim at a desk **I want** grouped lists and a persistent details pane **so that** the
desktop is a real step up when I am building a room.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E05-04, US-E05-05 |
| Traces to | FR-VIEW-028, FR-VIEW-032, FR-VIEW-033, FR-MOB-010, NFR-A11Y-001, NFR-COMPAT-001 |

**Acceptance criteria**

1. **Given** a folder listing **when** grouping by type or by modified date is enabled **then** sticky
   group headers are rendered, each stating the group label and its item count, and grouping composes
   with the active sort rather than replacing it.
2. **Given** grouping at compact width **when** it is enabled **then** the headers are 40 CSS px tall,
   remain sticky beneath the breadcrumb without stacking two sticky bars over the content, and the list
   still virtualises correctly across group boundaries.
3. **Given** expanded width (840 CSS px and above) **when** an item is selected **then** the same
   details component from US-E05-05 renders as a docked right-hand inspector, showing the same fields
   with the same labels.
4. **Given** the inspector **when** the viewport narrows below expanded width **then** it collapses back
   into the bottom sheet with no loss of information and no separate code path.
5. **Given** hover-capable pointers **when** a row is hovered at expanded width **then** secondary
   affordances may appear, but only inside `@media (hover: hover) and (pointer: fine)` and never
   carrying information available nowhere else.
6. **Given** a keyboard at any width **when** the arrow keys traverse the list **then** the inspector
   follows the focused row, and Escape returns focus to the list.

**Mobile acceptance criteria**

- Grouping never introduces horizontal scrolling at 320 CSS px, and group headers wrap rather than
  truncating their counts.
- Enabling grouping is announced politely with the group count ("Grouped by type, 6 groups").
- No hover-revealed affordance renders on a touch-only device, asserted by an automated test on the
  mobile emulation profile.
- Group headers are not tap targets unless they collapse, and if they collapse they are 48 CSS px tall
  with an expanded or collapsed state announced to a screen reader.

**Edge cases & negative paths**

- Grouping by date on a folder where every item shares one date: one group, and the header states it
  rather than showing an empty grouping affordance.
- Grouping plus a search-in-folder filter: groups reflect only the filtered set and the header says so.
- Collapsed group containing the item the user returns to from a viewer: the group auto-expands and the
  item is scrolled into view and briefly highlighted.
- Very many groups (200 file types): grouping falls back to a coarse type taxonomy (documents, images,
  media, archives, other) and states the mapping.

---

### US-E05-16 — Two-pane split view, and its compact-width equivalent

**As a** P4 Ashley Kim on a tablet **I want** two locations side by side **so that** moving files feels
like a file manager, while my phone keeps the same capability in a different shape.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E05-15 |
| Traces to | FR-VIEW-029, FR-VIEW-030, FR-VIEW-031, FR-FILE-026, FR-MOB-041, FR-MOB-046, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** a viewport of at least 600 CSS px width **and** at least 480 CSS px height **when** split
   view is enabled **then** two independent panes render, each with its own breadcrumb, sort and
   scroll, and each able to navigate independently.
2. **Given** a landscape phone (medium width, compact height) **when** split view is evaluated **then**
   it is not offered, because two panes at that height are unusable, and the staging tray remains the
   mechanism.
3. **Given** split view **when** an item is moved or copied from one pane to the other **then** it uses
   the same server call, the same conflict sheet and the same count-bearing toast with undo as the
   destination picker path.
4. **Given** a draggable divider **when** it is present **then** preset ratios (50:50, 30:70, 70:30) are
   offered as a non-dragging alternative, satisfying WCAG 2.2 SC 2.5.7, and the chosen ratio is
   persisted per account.
5. **Given** compact width **when** the principal looks for split view **then** the interface presents
   the staging tray as the equivalent, in those words: "On a phone, use Cut or Copy and then Paste
   here. This is the phone version of a split view."
6. **Given** split view **when** a keyboard is attached **then** Tab moves between panes, the focused
   pane is visibly indicated, and the move and copy shortcuts act from the focused pane to the other.
7. **Given** split view **when** the viewport shrinks below the gate **then** it collapses to a single
   pane, preserving the active pane's location and any staged items.

**Mobile acceptance criteria**

- No split-view affordance, hint or empty second pane renders at compact width; asserted by a test at
  360 x 640 and at 780 x 360 (landscape phone).
- The staging tray equivalence text is present in the compact-width overflow under a "Move files
  between folders" entry, so the capability is discoverable rather than merely existing.
- At 600 to 839 CSS px, panes each retain at least 300 CSS px so filenames remain readable; below that
  the split is refused rather than squeezed.
- Split view honours 200 percent text size by reducing the pane count to one rather than clipping.

**Edge cases & negative paths**

- Both panes showing the same folder: a move within the same folder is refused with "Already in this
  folder".
- One pane showing a folder the principal loses access to mid-session: that pane shows the not-found
  state and offers to navigate to the room root.
- A drag between panes on a touch-capable tablet: permitted where a fine pointer exists, with the
  non-dragging path always available.
- Split view with an active bulk operation: the operation's progress remains in the global tray and is
  not duplicated per pane.

---

### US-E05-17 — Show file extensions, consistently

**As a** P4 Ashley Kim **I want** to choose whether extensions are visible **so that** I can tell a
`.xlsx` from a `.csv` when it matters and keep lists clean when it does not.

| | |
|---|---|
| Priority | Could |
| Release | R2 |
| Estimate | 2 |
| Depends on | US-E05-01, US-E05-05 |
| Traces to | FR-FILE-030, FR-FILE-029, NFR-A11Y-001, NFR-MAINT-001 |

**Acceptance criteria**

1. **Given** the default state **when** any list or tile renders **then** file extensions are hidden and
   the type is conveyed by the type indicator and the details sheet.
2. **Given** the account setting "Show file extensions" **when** it is enabled **then** extensions are
   shown in every list, tile, tree, search result, details sheet, staging tray and rename field, with no
   surface left inconsistent.
3. **Given** extensions hidden **when** a file is renamed **then** the extension is preserved and cannot
   be destroyed by the rename, proven by the test in [E04](./epic-04-file-operations.md) US-E04-11.
4. **Given** extensions shown **when** a file is renamed **then** the extension is editable, and
   changing it triggers a confirmation "Changing the file type may stop this file from opening
   correctly" with Keep and Change.
5. **Given** the setting **when** it is changed **then** it is persisted per account, applies across
   devices, and does not require a reload.
6. **Given** a file with no extension **when** it renders **then** nothing is appended and the details
   sheet still names the sniffed type.

**Mobile acceptance criteria**

- The setting lives in account settings under a "Files" group, is a single switch, and its label states
  the effect rather than the mechanism.
- With extensions shown at 360 CSS px, a long name truncates before the extension so the extension
  stays visible, which is the whole point of the setting.
- With a screen reader, the name is announced once, including the extension when shown, and never
  twice.

**Edge cases & negative paths**

- Double extensions (`archive.tar.gz`): the last segment is treated as the extension for display and
  the whole compound is preserved on rename.
- Uppercase extensions (`.PDF`): displayed as stored; the type is determined by sniffing, not by case.
- A name that looks like an extension only (`.gitignore`): treated as a name, not an extension, and
  shown in full.

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| Upload, download, move, copy, rename, delete, trash, bulk actions and the staging tray implementation | [E04](./epic-04-file-operations.md) (this epic consumes the tray and the actions) |
| Breadcrumbs, drill-down navigation, the mobile tree sheet and the desktop tree rail | [E03](./epic-03-folder-hierarchy-and-navigation.md) |
| Dynamic watermark configuration, share links, roles, expiry and the recipient's entry flow | [E07](./epic-07-sharing-and-access-control.md) (this epic renders what E07 authorises) |
| Version history listing and version restore | [E08](./epic-08-conflict-resolution-and-data-integrity.md) (this epic links to it from the details sheet) |
| Viewer analytics, page-level dwell reporting and download tracking presentation | [E11](./epic-11-trust-audit-and-notifications.md) (this epic emits the view sessions) |
| Search inside a document's text and OCR | [E06](./epic-06-search-and-discovery.md) |
| Virtualisation internals, cursor pagination, prefetch policy, offline pinning and RUM | [E10](./epic-10-performance-offline-and-scale.md) |
| Sheet and detent mechanics, safe area, haptics, theming, breakpoints, focus management | [E09](./epic-09-mobile-ux-foundations.md) |
| Annotation, highlighting, commenting on a document, redaction and e-signature | Not in R1 to R3. Annotation is the board-portal category's strength and is recorded as a deliberate non-goal. |
| Screenshot prevention | Not achievable on the web platform; the product claims watermarking plus audit instead and says so. |
| Legacy binary Office formats (.doc, .xls, .ppt) | R3 at the earliest, gated on converter support. Recorded as OQ45. |

## Open questions

Open-question IDs in this file come from the block reserved for E05 (OQ41 to OQ50), so that epics
authored in parallel cannot collide.

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ41 | Where exactly is the server-render threshold? The current Assumption is 10 MB or 50 pages, which decides both our rendering bill and the crash risk on iOS. It must be validated against a real corpus of broker documents. | Engineering + Product | Before R1 code freeze |
| OQ42 | Is the 2.5-second first-page target measured from the tap or from the viewer route mounting? The first is the honest user-perceived number and the harder one; the second is what most vendors quote. | Product + Engineering | Before R1 launch |
| OQ43 | Do we run document conversion and rendering in our own boundary or use a third-party processor? A processor is faster to ship and is a disclosure and trust cost with legal buyers. | Product + Legal + Engineering | Before R2 start |
| OQ44 | Should reading mode be the default for text-heavy PDFs on a phone rather than an opt-in? It directly addresses the abandonment evidence, but it changes what the recipient sees versus what the owner sent. | Product + design partners | R2 planning |
| OQ45 | Do we support legacy binary Office formats, and if not, is the unsupported state acceptable to brokers whose sellers still send `.xls`? | Product + design partners | R2 planning |
| OQ46 | How long is a resume position retained, and is it per version or per file? Current answer is per file per version, retention 180 days (Assumption). | Product + Engineering | Before R1 code freeze |
| OQ47 | Are rendered preview assets excluded from the account's storage quota permanently, or only while they are derived on demand? BR-198 currently excludes them; the question is whether that stays true once a cache is retained. | Product + Engineering | Before R2 launch |
| OQ48 | Does the details sheet show the full access list to a Contributor, or only to Manager and Owner? Current answer is Manager and above, which may frustrate a coordinator who needs to check what a buyer can see. | Product + Security | Before R1 launch |
