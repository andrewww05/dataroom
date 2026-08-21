# Epic E03 — Folder Hierarchy & Navigation

## Purpose

This epic covers the folder tree and every way a person moves through it: creating and nesting
folders, renaming and moving them, deleting them with a warning that states exactly what will be
destroyed, and navigating the result on a 360 px screen where a desktop folder tree is unusable. It
also owns the navigation contract that the rest of the product depends on: what the Android system
back does, what the iOS in-app back does, what a deep link to a folder resolves to, and how scroll
position survives a preview, a background, and a discarded tab.

The four requested requirements from the original brief (create and nest a folder, view folders and
their contents with breadcrumb navigation, update the folder name, delete a folder and its nested
contents with a warning) are all satisfied inside this epic.

## Related documents

- [Documentation index](../README.md)
- [Personas & JTBD](../02-personas-and-jtbd.md)
- [Product overview](../03-product-overview.md)
- [Epics](../04-epics.md)
- [Functional requirements](../05-functional-requirements.md)
- [Business rules & permissions](../06-business-rules-and-permissions.md)
- [Non-functional requirements](../07-non-functional-requirements.md)
- [Mobile UX spec](../08-mobile-ux-spec.md)
- [Domain model & glossary](../09-domain-model-and-glossary.md)
- [Master backlog](../11-master-backlog.md)
- [Risks & open questions](../12-risks-and-open-questions.md)
- Sibling backlogs: [E01 Access & Identity](./epic-01-access-and-identity.md),
  [E02 Data Rooms & Workspace Home](./epic-02-data-rooms-and-workspace-home.md),
  [E04 File Operations](./epic-04-file-operations.md),
  [E05 Viewing, Preview & File Details](./epic-05-viewing-preview-and-file-details.md),
  [E06 Search & Discovery](./epic-06-search-and-discovery.md),
  [E07 Sharing & Access Control](./epic-07-sharing-and-access-control.md),
  [E08 Conflict Resolution & Data Integrity](./epic-08-conflict-resolution-and-data-integrity.md),
  [E09 Mobile UX Foundations](./epic-09-mobile-ux-foundations.md),
  [E10 Performance, Offline & Scale](./epic-10-performance-offline-and-scale.md),
  [E11 Trust, Audit & Notifications](./epic-11-trust-audit-and-notifications.md)

## Epic summary

| Field | Value |
| --- | --- |
| Epic ID | E03 |
| Goal | Make a nested folder structure fully buildable, navigable and repairable with one thumb on a 360 px screen: drill-down as the primary navigation model, a collapsing breadcrumb that always shows where you are, a destination-picker sheet in place of drag-and-drop, a cascade-delete warning that names counts, and a desktop tree that is a genuine enhancement rather than the baseline. |
| Primary personas | P4 Ashley Kim (transaction coordinator, builds and repairs the structure, 30 to 40 percent of touches on a phone), P1 Marcy Doyle (solo broker, creates folders in a car park), P3 Tomás Ferreira (invited CPA, triages "is the AR ageing in here yet"), P2 Dev Raman (first-time buyer, must find the P&L in two taps), P6 Ray Okonkwo (field uploads into the right folder on one bar of signal) |
| Release span | R1 (stories 01 to 11, 12, 14, 15, 17), R2 (stories 13, 16, 18) |
| Story count | 18 |
| Total points | 79 |
| Depends on | [E02](./epic-02-data-rooms-and-workspace-home.md) US-E02-01 (a room to hold folders), US-E02-02 (ownership), US-E02-03 (invisibility rule); [E01](./epic-01-access-and-identity.md) US-E01-01, US-E01-08 |
| Blocks | [E04](./epic-04-file-operations.md) (files need a folder and a destination picker), [E05](./epic-05-viewing-preview-and-file-details.md) (preview returns to a folder), [E06](./epic-06-search-and-discovery.md) (results jump to the containing folder), [E07](./epic-07-sharing-and-access-control.md) (folder-scoped shares and inheritance), [E08](./epic-08-conflict-resolution-and-data-integrity.md) (move-into-descendant prevention, name collisions) |

## Mobile-first design stance

- **Drill-down is the primary navigation model; the tree is a desktop enhancement.** At 360 CSS px a
  nested tree either scrolls horizontally, which WCAG 2.2 SC 1.4.10 Reflow forbids, or truncates folder
  names to uselessness. Its expand/collapse twisties are typically well under the 24 x 24 CSS px floor
  of SC 2.5.8 and they sit immediately next to the row's own navigate target, which is the same
  competing-trailing-control failure Apple warns about. So on compact width the folder body is a flat,
  virtualised list of children with disclosure indicators meaning "drill in", and the real tree returns
  in a navigation rail at Expanded width (>= 840 dp).
- **The mobile tree equivalent is a path sheet, not a shrunken tree.** Tapping the breadcrumb opens one
  sheet that shows the ancestor chain from room root to the current folder, each ancestor tappable to
  jump, plus the current folder's immediate children as a one-level outline. That gives the two things a
  tree is actually used for on a phone, orientation and a jump, without the indentation.
- **The breadcrumb never disappears, it collapses.** At 360 px the breadcrumb is a single 40 CSS px
  sticky line: room monogram, an ellipsis chip for the collapsed middle, and the current folder name.
  The ellipsis chip is a real 48 x 48 CSS px target that opens the path sheet. Deleting the breadcrumb on
  small screens is a defect, because it is the only thing that tells a user which of eight deals they
  are standing in.
- **Drag-and-drop is replaced, not polyfilled.** HTML5 drag events do not fire from a finger on Chrome
  for Android, Firefox Android or Samsung Internet, and SC 2.5.7 Dragging Movements requires a
  single-pointer non-dragging alternative regardless. The touch primitive is therefore "Move to..." with
  a destination-picker sheet that drills in place, matching the iOS Files and Dropbox Android patterns.
  HTML5 drag-and-drop is enabled only where a fine pointer exists, and "Move to..." remains the primary
  route there too.
- **Right-click becomes long-press plus a permanently visible overflow.** Every folder row carries a
  48 x 48 CSS px overflow button. Long-press opens the same menu. Long-press has exactly one meaning per
  surface across the whole product (context menu on a row; selection mode is entered by an explicit
  "Select" button, per [E04](./epic-04-file-operations.md)), because inconsistent long-press is a
  learnability failure. Unavailable items are hidden, not dimmed, in context menus.
- **Back must work three ways and mean the same thing.** Android's system back and edge gesture must pop
  in-app history, so every folder, sheet, preview and selection mode is its own popable history entry
  and predictive back is left enabled. iOS has no system back, so a persistent in-app back control of at
  least 48 x 48 CSS px sits at the top leading edge of every screen, and it is a genuine "up one level"
  in the hierarchy rather than only a history pop. The installed iOS Home Screen web app has no browser
  chrome at all, which makes this mandatory rather than optional.
- **Destructive folder actions state counts and are undoable.** "Warn the user what will be deleted" from
  the brief is necessary but not sufficient on a touch screen where mis-taps are normal. Every folder
  delete shows server-computed counts of subfolders, files and bytes, commits on the up-event, soft
  deletes to trash with 30-day retention, and offers a 10-second undo.
- **Deep links are first-class, because the link is the product.** A folder URL opens that folder
  directly, resolves the breadcrumb, works for a guest with a folder-scoped share, and returns 404 rather
  than 403 when the subject has no grant, so a link cannot be used to probe for the existence of a deal.
- **Desktop adds power at the top of the ladder.** Medium width (600 to 839 dp) adds a two-pane list plus
  details layout. Expanded (>= 840 dp) adds the persistent tree rail, marquee selection, HTML5
  drag-and-drop, a keyboard-navigable grid with type-to-jump, and shortcuts. Height is checked as well as
  width, because a landscape phone can be medium-width and compact-height, which makes two panes
  impractical.

---

## User stories

### US-E03-01 — Create a folder

**As a** P1 Marcy Doyle standing in a client's back office **I want** to create a folder in three taps
**so that** the P&L the seller just handed me lands somewhere sensible before I drive off.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E02-01 |
| Traces to | FR-FLDR-001, NFR-MOB-002, NFR-MOB-005, NFR-PERF-002, NFR-A11Y-004, BR-008, BR-009, BR-010, BR-011 |

**Acceptance criteria**

1. **Given** a folder the subject may write to **when** they tap the always-visible "New" primary action
   and choose "New folder" **then** a single sheet opens with a name field focused, the keyboard raised,
   and a "Create" button.
2. **Given** a name of 1 to 255 characters after trimming leading and trailing whitespace **when**
   "Create" is tapped **then** the folder is created as a child of the current folder, appears in the
   list in the current sort order, and the sheet closes.
3. **Given** the created folder **when** the list re-renders **then** the new row is briefly highlighted
   for 1.5 seconds and scrolled into view if it is outside the viewport, so the user can see the result
   of their action.
4. **Given** a name that collides case-insensitively with an existing sibling folder or file **when**
   "Create" is tapped **then** the API returns 409 `NAME_CONFLICT` and the sheet presents an explicit
   choice: "Leases already exists here. Keep both (creates Leases (2)) or Cancel." with no silent
   auto-rename (BR-008, BR-009).
5. **Given** a name containing a forbidden character (`/ \ : * ? " < > |`), a control character, only
   dots, or a reserved device name (`CON`, `PRN`, `AUX`, `NUL`, `COM1` to `COM9`, `LPT1` to `LPT9`)
   **when** submitted **then** inline error text names the specific problem, for example "A folder name
   cannot contain / or \\", and the request is not sent (BR-010).
6. **Given** a name with trailing spaces or dots **when** submitted **then** they are trimmed silently
   and the trimmed name is what appears in the field before submission, so the user sees what they will
   get (BR-010).
7. **Given** a name that would push the full path beyond the path-length limit **when** submitted
   **then** the error is "This name makes the folder path too long. Use a shorter name or move the parent
   folder up." and the current path length is shown (BR-011, see US-E03-14).
8. **Given** the subject has read-only access **when** the folder screen renders **then** no "New" action
   is rendered, and a direct API call to create a folder returns 403 `READ_ONLY` (BR-004).
9. **Given** creation succeeds **when** telemetry fires **then** `folder_created` is emitted with
   `depth`, `sibling_count`, `room_id` and `entry_point` (primary action, empty state, or destination
   picker).

**Mobile acceptance criteria**

- The "New" primary action is permanently visible in the bottom action bar or as a FAB of at least
  56 x 56 CSS px, offset above `env(safe-area-inset-bottom)`, inside the one-handed thumb zone. It is
  never hidden behind an overflow, because hidden primary actions measurably reduce discoverability.
- The create sheet opens at the medium detent with the field focused and the "Create" button visible
  above `env(keyboard-inset-bottom)` at 360 x 640; QA verifies with the keyboard open on iOS Safari and
  Chrome Android.
- Total taps for the default path: 3 (New, New folder, Create) after typing. QA fails the story at 4 or
  more.
- Swipe-down dismisses the sheet; dismissing with text entered preserves the draft name for 10 minutes so
  a mis-swipe does not lose the typing.
- Only one sheet at a time: if creation is initiated from inside the destination picker, the picker's own
  inline create row is used rather than stacking a second sheet.
- Tap-to-busy feedback within 100 ms; creation completes within 1.5 seconds at p75 on the reference
  network (9 Mbps down, 3 Mbps up, 100 ms RTT).
- Screen reader: the sheet is a modal dialog named "New folder"; on success a polite live region announces
  "Folder Leases created".
- Offline: the folder is created optimistically with a "Waiting to sync" chip, is usable as an upload
  destination locally, and reconciles per [E08](./epic-08-conflict-resolution-and-data-integrity.md); if
  the server rejects the name on sync, the user gets a notification with the conflict choice, and nothing
  is silently discarded.

**Edge cases & negative paths**

- Double-tap "Create": second tap swallowed by busy state; the request carries an idempotency key keyed on
  (parentId, name) so a network retry cannot create two folders.
- Name of exactly 255 characters: accepted if the path fits; 256 is rejected with "Folder names can be up
  to 255 characters."
- Unicode: names are normalised to NFC before storage and comparison, so a decomposed "é" and a composed
  "é" collide as the same name (BR-009).
- Right-to-left or bidirectional names: stored as typed, rendered with `dir="auto"` so the row does not
  scramble.
- Emoji-only name: permitted.
- Parent folder deleted by another user while the sheet is open: 404 on submit, and the sheet shows "The
  folder you were adding to was deleted." with a single "Go up one level" action.

---

### US-E03-02 — Nest folders arbitrarily deep, with an enforced limit

**As a** P4 Ashley Kim building a diligence structure **I want** to nest folders as deep as the deal
needs, with a clear limit **so that** I never build a structure the product cannot render, move or
delete.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E03-01 |
| Traces to | FR-FLDR-002, FR-FLDR-016, NFR-SCALE-001, NFR-A11Y-004, BR-011, BR-012 |

**Acceptance criteria**

1. **Given** any folder below the depth limit **when** a child folder is created **then** it succeeds, and
   the folder record stores `parentId`, `depth` and a materialised `path` so ancestor queries do not
   require recursive client calls.
2. **Given** the depth limit of 32 levels below the room root (BR-012) **when** a create or move would
   exceed it **then** the API returns 422 `DEPTH_LIMIT` and the user sees "Folders can be nested up to 32
   levels deep. This would be level 33."
3. **Given** the folder screen at any depth **when** it renders **then** the depth is discoverable from
   the breadcrumb path sheet, and no functionality degrades between depth 1 and depth 32.
4. **Given** a folder at depth 20 **when** it is loaded by deep link **then** the breadcrumb resolves the
   full ancestor chain in one API call, not 20.
5. **Given** a subtree being moved **when** the destination depth plus the subtree height would exceed the
   limit **then** the move is refused before any change with "Moving this would nest folders 34 levels
   deep. Choose a shallower destination." naming the deepest affected path.
6. **Given** the total path-length limit of 1,024 characters (BR-011) **when** a create, rename or move
   would exceed it **then** it is refused with the current length and the limit both shown.
7. **Given** a room created from a template (US-E02-15) **when** the template nests folders **then** the
   same limits apply and any skipped folders are reported by name.
8. **Given** the API **when** it returns a folder **then** it includes `depth` and `pathSegments` in the
   response contract in `packages/shared`, so client and server agree on the same limits.

**Mobile acceptance criteria**

- Deep folders are not visually penalised: the row rendering at depth 30 is identical to depth 1, because
  the list is flat, with no indentation at compact width.
- The limit message fits at 360 px width without truncation and at 200 percent text size.
- Refusals are announced through a polite live region and focus stays in the name field so the user can
  correct without hunting.
- Performance at depth: loading a folder at depth 32 has the same p75 LCP budget of 2.5 seconds as depth
  1; QA verifies with a seeded deep tree.

**Edge cases & negative paths**

- Legacy data imported above the limit (future import feature): reads work, further nesting is refused,
  and the folder shows "This folder is deeper than the current limit. You can move items out but not
  add more levels."
- Two concurrent creates at level 32 in different branches: both succeed, because the limit is per path.
- A folder whose name pushes only some children over the path limit: the refusal is per item, and a bulk
  operation reports partial failure with the specific paths (see E04 partial-failure reporting).

---

### US-E03-03 — Drill-down folder browsing on a 360 px screen

**As a** P2 Dev Raman on a commuter train **I want** to tap into folders and see their contents
immediately **so that** I can find the P&L in two taps with one thumb.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E03-01, US-E02-03 |
| Traces to | FR-FLDR-009, FR-VIEW-001, NFR-MOB-001, NFR-PERF-001, NFR-PERF-002, NFR-PERF-003, NFR-SCALE-001, NFR-A11Y-001, NFR-A11Y-002 |

**Acceptance criteria**

1. **Given** a folder **when** it is opened **then** its immediate children are listed in a single
   virtualised column: folders first by default, then files, each sorted by the active sort (default Name
   A to Z), with folder rows carrying a trailing disclosure indicator meaning "drill in".
2. **Given** a folder row **when** it is tapped anywhere except its overflow button **then** the app
   navigates into that folder as a new history entry, the breadcrumb updates, and the list scroll starts
   at the top.
3. **Given** a folder row **when** it renders **then** it shows the folder name (up to two lines, tail
   truncation), a secondary line with the item count ("12 items") and last-modified relative time, and a
   48 x 48 CSS px overflow button.
4. **Given** a folder with more than 100 children **when** it is opened **then** the first page loads via
   cursor pagination with a page size of 50, further pages load before the user reaches the end, and the
   header shows the true total ("1 of 3,412 items loaded" collapses to "3,412 items" once fully counted).
5. **Given** a folder with 10,000 or more children **when** the user scrolls **then** rows are recycled,
   no single main-thread task exceeds 50 ms on the baseline device class, and memory does not grow
   unbounded across a full scroll to the end.
6. **Given** the list is loading **when** it first renders **then** fixed-height skeleton rows are shown
   so arriving data causes no layout shift and the route stays within CLS 0.1.
7. **Given** the list has an explicit "Load more" control at the end of each page **when** infinite
   scroll is also active **then** both exist, because an unbounded scroll with no landmarks is a known
   failure for a find-one-specific-file task.
8. **Given** the user returns from a child folder, a preview or a sheet **when** the list re-renders
   **then** the scroll position is restored to within one row and the previously focused row is marked.
9. **Given** a read-only subject **when** the folder renders **then** no create, upload, rename, move or
   delete affordance appears anywhere, and every corresponding endpoint returns 403 `READ_ONLY` if called
   directly (BR-004).
10. **Given** an empty folder **when** it renders **then** the empty state from US-E03-17 is shown, not a
    blank list.

**Mobile acceptance criteria**

- Rows are at least 64 CSS px tall so two text lines plus a 48 px overflow target fit with at least
  8 CSS px separation. At 200 percent text size rows grow and the name wraps; the overflow button never
  leaves the viewport.
- No horizontal scrolling at 320 CSS px width. Verified by setting the viewport to 320 px and confirming
  the document scroll width equals the viewport width (SC 1.4.10).
- The disclosure indicator means "drill in" and is visually distinct from any details affordance; tapping
  the row navigates and tapping the overflow opens the menu. These two targets never overlap.
- Folder LCP is at most 2.5 seconds at p75 on mobile field data for a folder of 50 items; INP for a row
  tap is at most 200 ms at p75.
- Pull-to-refresh is available, and a "Refresh" item also exists in the screen overflow, because a gesture
  may never be the only mechanism.
- The sticky header (room identity plus breadcrumb) occupies at most 96 CSS px including
  `env(safe-area-inset-top)`, and the bottom action bar respects `env(safe-area-inset-bottom)`.
- Focus is never obscured: `scroll-padding-bottom` equals the bottom bar height plus the safe-area inset,
  so a keyboard-focused row is never hidden behind the bar (SC 2.4.11).
- Screen reader: the list has an accessible name of the current folder; each row announces name, type
  ("folder" or file type), item count or size, and modified date; the loading of a further page is
  announced politely as "20 more items loaded".
- Offline: the last-loaded page of the current folder renders from cache with an offline banner and the
  label "Cached copy, may be cleared by your browser"; rows whose content is not cached are dimmed with
  "Not available offline".

**Edge cases & negative paths**

- Folder deleted by another user while being viewed: the next request returns 404 and the screen shows
  "This folder was deleted by Ashley Kim." with one action, "Go up one level".
- Child renamed by another user while the list is open: the row updates on the next revalidation with no
  scroll jump.
- Mixed content with 9,000 files and 1,000 folders: folders-first grouping is computed server-side so the
  client never has to load everything to sort correctly.
- Slow network: the skeleton persists for at most 10 seconds then shows "Still loading. Check your
  connection." with Retry; already-rendered rows are never removed.
- Page discarded by the browser under memory pressure: on next open the app returns to the same folder and
  restores scroll from state persisted on `visibilitychange` to hidden, because `unload` does not fire
  when a tab is closed from the mobile tab switcher.

---

### US-E03-04 — Breadcrumb navigation and its collapse behaviour

**As a** P1 Marcy Doyle four levels deep in one of eight deals **I want** a single line that always
tells me where I am and lets me jump back **so that** I never upload Deal A's lease into Deal B.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E03-03 |
| Traces to | FR-FLDR-007, FR-FLDR-008, NFR-MOB-001, NFR-MOB-002, NFR-A11Y-001, NFR-A11Y-002, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** any folder screen **when** it renders **then** a breadcrumb is present directly under the
   room header, showing the path from the room root to the current folder, and it is sticky so it remains
   visible while the list scrolls.
2. **Given** the full path does not fit on one line at the current width **when** the breadcrumb renders
   **then** it collapses the middle segments into a single ellipsis chip, always keeping the room root
   chip (monogram plus name) at the start and the current folder name at the end.
3. **Given** the collapsed state **when** the user taps the ellipsis chip **then** the path sheet from
   US-E03-12 opens listing every ancestor in order, each tappable to jump.
4. **Given** any visible ancestor chip **when** it is tapped **then** the app navigates to that ancestor,
   and the history stack is truncated to that level rather than pushed, so system back from there goes to
   the screen the user came from before entering the subtree.
5. **Given** the current folder chip (the last one) **when** it is tapped **then** nothing navigates; it
   opens the folder details sheet (US-E03-16) in R2 and is inert in R1, and it is never rendered as if it
   were a link.
6. **Given** the breadcrumb **when** it renders **then** it is a single line of at most 40 CSS px height
   and it never wraps to two lines, because vertical space at 360 x 640 is the scarcest resource.
7. **Given** a folder-scoped share (E07) **when** a guest views it **then** the breadcrumb is rooted at
   the shared folder, shows no ancestors above it, and tapping the root chip stays inside the share, so
   the breadcrumb cannot be used to escape the share scope (BR-002).
8. **Given** the breadcrumb **when** it is rendered for a screen reader **then** it is a `nav` landmark
   labelled "Breadcrumb" containing an ordered list, with the current folder marked
   `aria-current="page"`.
9. **Given** the Expanded breakpoint (>= 840 dp) **when** the layout renders **then** the breadcrumb shows
   as many segments as fit without collapsing and the ellipsis chip appears only when genuinely needed.

**Mobile acceptance criteria**

- The ellipsis chip is a real target of at least 48 x 48 CSS px (visually smaller with transparent
  padding is acceptable), separated from its neighbours by at least 8 CSS px.
- Each visible chip is at least 48 CSS px in its tappable height; chips scroll horizontally inside their
  own `overflow-x: auto` container only when 2 or more chips fit, and the page body itself never scrolls
  horizontally.
- At 360 px width the breadcrumb shows at minimum "room monogram / ... / current folder", and the current
  folder name gets at least 60 percent of the available width before truncating.
- At 200 percent text size the breadcrumb still occupies one line by collapsing further, down to
  "monogram / ... / current".
- The breadcrumb remains visible while the on-screen keyboard is open (for example during rename), and it
  does not obscure the focused field.
- Screen reader: chips announce as "Acme HVAC, level 1 of 5", "Show 3 hidden folders", "Leases, current
  location".
- Tapping an ancestor completes navigation with the new folder's first paint within 1.5 seconds at p75
  using cached ancestor data.

**Edge cases & negative paths**

- Path with a single very long folder name (200 characters): the current chip truncates in the middle so
  both the start and the end of the name are visible, and the full name is in the accessible name and the
  details sheet.
- Ancestor renamed while the user is deep in the tree: the breadcrumb updates on the next revalidation
  without changing the user's position.
- Ancestor deleted while the user is deep in the tree: the next request returns 404, the user is moved to
  the nearest surviving ancestor, and a toast reads "Leases was deleted. You are now in Financials."
- Right-to-left locale: the chip order reverses with `dir` and the separator mirrors correctly.
- Breadcrumb at the room root: shows only the room chip, and no ellipsis.

---

### US-E03-05 — Up one level, and back-behaviour parity across platforms

**As a** P2 Dev Raman on Android and P5 Ingrid Sørensen on an installed iOS web app **I want** back to
do the obvious thing on my platform **so that** I never get stuck or thrown out of the app.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E03-03, US-E03-04 |
| Traces to | FR-FLDR-012, FR-FLDR-014, NFR-MOB-001, NFR-MOB-002, NFR-COMPAT-001, NFR-A11Y-001 |

**Acceptance criteria**

1. **Given** any screen below the room root **when** it renders **then** a persistent in-app back control
   is present at the top leading edge, labelled with an accessible name of "Up to <parent folder name>",
   and it navigates up one level in the hierarchy.
2. **Given** Android **when** the system back button or edge gesture is used **then** it pops the most
   recent in-app history entry, and every one of the following is its own popable entry: folder
   navigation, open sheet, open preview, selection mode, destination picker, and destructive confirmation
   route.
3. **Given** Android predictive back **when** it is previewed **then** the animation targets the correct
   destination, meaning the app does not opt out of `enableOnBackInvokedCallback` behaviour and does not
   intercept back without pushing a matching history entry.
4. **Given** the root folder of a room **when** back is used **then** the app returns to the workspace
   home, and from workspace home a further back exits the app on Android rather than looping.
5. **Given** iOS **when** the app is installed to the Home Screen and running standalone **then** there is
   no browser chrome, so the in-app back control is the only route and it is present on every screen
   including previews and sheets.
6. **Given** a horizontal edge swipe on iOS **when** the platform provides it **then** it is supported as
   a shortcut and never as the only mechanism, and the in-app back remains present.
7. **Given** a deep-linked entry into a folder with no in-app history **when** back is used **then** the
   app navigates up one level in the hierarchy rather than leaving the app, until it reaches the room root,
   and then it goes to workspace home.
8. **Given** an open sheet **when** back is used **then** the sheet closes and the underlying screen state
   including scroll position is unchanged.
9. **Given** a destructive confirmation route **when** back is used **then** it cancels, and it can never
   commit the destructive action.

**Mobile acceptance criteria**

- The in-app back control is at least 48 x 48 CSS px, sits within `env(safe-area-inset-top)` padding, and
  has an accessible name containing the visible label or the parent folder name (SC 2.5.3).
- QA script on Android: navigate root to A to B to C, open a preview, open a sheet, then press back five
  times and verify the sequence sheet, preview, C, B, A, root, home, then exit. No step skips two levels
  and no step re-enters a closed surface.
- QA script on iOS installed web app: repeat the same sequence using only the in-app back control, and
  confirm identical destinations.
- Row swipe actions elsewhere in the product must not start within 24 CSS px of either screen edge,
  because the Android system back gesture owns both edges and apps can carve out at most 200 dp per edge.
- Back never loses in-flight work: an upload in progress continues across every back navigation and its
  progress bar persists.
- Screen reader: back is announced as a button, not as a link, and its name states the destination.

**Edge cases & negative paths**

- Deep link into a folder inside a folder-scoped share: back stops at the share root and then shows "You
  have reached the top of what was shared with you"; it never reveals the parent.
- Back pressed twice quickly: the second press is queued, not dropped, and each pop is animated to
  completion or cancelled cleanly.
- Back from a folder that was deleted while the user was inside a child: the app skips the deleted level
  and lands on the nearest surviving ancestor with an explanatory toast.
- Browser tab restored after discard: history is reconstructed to at least the current folder plus the
  room root so back is never a dead end.

---

### US-E03-06 — Deep links to a folder

**As a** P3 Tomás Ferreira sent a link to one folder **I want** the link to open exactly that folder
**so that** I am not dropped at a room root and left hunting.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E03-03, US-E03-04, US-E01-08 |
| Traces to | FR-FLDR-013, NFR-SEC-001, NFR-MOB-001, NFR-PERF-001, BR-002, BR-003, BR-004 |

**Acceptance criteria**

1. **Given** a folder URL of the shape `/rooms/:roomId/folders/:folderId` **when** it is opened by a
   subject with a grant **then** that folder's contents render directly, the breadcrumb resolves its full
   ancestor chain, and no intermediate navigation is shown.
2. **Given** the same URL **when** it is opened by a subject with no grant **then** the response is 404
   and the screen reads "This folder is not available." with no room name, folder name, owner name or
   counts disclosed (BR-002).
3. **Given** the URL **when** it is opened while signed out **then** the sign-in screen is shown, and
   after a successful sign-in the user lands on the originally requested folder, with the intended
   destination persisted across the auth redirect (including an OAuth round trip).
4. **Given** a share link scoped to a folder **when** a guest opens it **then** the guest session is
   created per US-E01-08 and the folder renders as the root of their visible world.
5. **Given** a URL for a folder that has been moved **when** it is opened **then** it still resolves,
   because the URL carries the folder id rather than a path, and the breadcrumb reflects the new location.
6. **Given** a URL for a folder that has been trashed **when** it is opened by someone with a grant
   **then** the screen reads "This folder is in Trash. It will be deleted on 20 Sep 2026." with a
   "Restore" action for permitted subjects, and 404 for everyone else.
7. **Given** any deep link **when** it is opened **then** the route is server-rendered or shell-cached
   such that first contentful paint does not require the full application bundle for the recipient path
   (at most 200 KiB of JavaScript for the guest route).
8. **Given** a deep link with a stale or malformed id **when** it is opened **then** the response is 404
   with the same copy as an unauthorised request, so malformed and forbidden are indistinguishable.

**Mobile acceptance criteria**

- Opening a deep link from a mail client, a messaging app or an in-app WebView lands on the folder; where
  the WebView blocks storage, the app shows "Open in your browser to keep your place" and content still
  renders for the tab lifetime.
- On the reference network, a guest deep link paints its first contentful content within 2.5 seconds at
  p75; QA measures with the Lighthouse mobile preset as the CI guard and mobile field data as the
  acceptance gate.
- The URL is shareable from the phone: a "Copy link" item exists in the folder overflow, and on Android
  the Web Share API is used where available.
- After an auth redirect the intended destination survives a page discard, because it is persisted on
  `visibilitychange` to hidden before the redirect.
- Screen reader: on landing, focus is placed on the folder name heading, and the breadcrumb is available
  as the next landmark.

**Edge cases & negative paths**

- Link to a folder in an archived room: opens read-only with the "Archived - read only" banner.
- Link to a folder in a room whose owner is pending deletion: 404.
- Two links opened in two tabs for different rooms: each tab keeps its own room context; the room
  identity in the sticky header prevents confusion.
- Link with a tracking query string appended by a mail scanner: extra parameters are ignored, not treated
  as part of the id.
- Very long id in a truncated link: 404 with the generic copy, and telemetry records `deep_link_failed`
  with the reason.

---

### US-E03-07 — Item counts and the folder summary line

**As a** P3 Tomás Ferreira triaging in a client's reception **I want** each folder to tell me how much
is inside it **so that** I can tell in fifteen seconds whether the documents I asked for have arrived.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E03-03 |
| Traces to | FR-FLDR-015, NFR-PERF-001, NFR-SCALE-001, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** a folder row **when** it renders **then** its secondary line shows the count of immediate
   children as "12 items", or "Empty" when zero, computed server-side.
2. **Given** the folder screen header **when** it renders **then** it shows the current folder's own
   summary: "8 folders, 34 files, 210 MB", using `formatBytes` from `@dataroom/shared`.
3. **Given** counts **when** they are computed **then** they are maintained incrementally on write rather
   than by a full scan per request, so a folder with 10,000 children returns its counts within the same
   latency budget as one with 10.
4. **Given** a count that is being recomputed after a bulk operation **when** the row renders **then** it
   shows the last known value with a subtle "updating" indicator rather than 0, because a wrong zero next
   to a folder full of documents is worse than a stale number.
5. **Given** the summary **when** the subject is a Viewer with a partial grant **then** the counts reflect
   only what that subject can see, so counts never leak the existence of hidden items (BR-002).
6. **Given** an empty folder **when** its row renders **then** "Empty" is shown and the row is not
   visually de-emphasised, because an expected-but-empty folder is exactly what a CPA is looking for.
7. **Given** the counts **when** they are announced to a screen reader **then** they are part of the row's
   accessible name, not a separate focusable element.

**Mobile acceptance criteria**

- The summary line fits on one line at 360 px width for values up to "999 folders, 9,999 files, 999.9 GB",
  and wraps rather than truncating at 200 percent text size.
- The header summary is part of the sticky header only if total header height stays within 96 CSS px
  including safe-area inset; otherwise it scrolls with the content.
- Counts must not cause layout shift when they arrive: the slot is reserved at skeleton time.
- Live region announces the folder summary once on entering a folder, politely.

**Edge cases & negative paths**

- Counts disagree with the visible list because a page has not loaded: the header count is authoritative
  and the list header states "50 of 3,412 loaded".
- Trashed children: excluded from counts, and the trash count is shown separately in the folder details
  sheet.
- Counts unavailable due to a backend error: the line shows "Count unavailable" rather than 0, and Retry
  is available from the overflow.
- Concurrent uploads: counts increment as each upload completes, not when it starts, so the number never
  overstates what exists.

---

### US-E03-08 — Rename a folder

**As a** P4 Ashley Kim **I want** to rename a folder from my phone **so that** I can fix a naming
mistake on the train instead of waiting until I am back at a desk.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E03-01, US-E03-03 |
| Traces to | FR-FLDR-003, NFR-MOB-005, NFR-A11Y-004, BR-008, BR-009, BR-010, BR-011, BR-016 |

**Acceptance criteria**

1. **Given** a folder row overflow, a long-press context menu, or the folder's own header overflow **when**
   "Rename" is chosen **then** one sheet opens with the current name prefilled and fully selected, and a
   "Save" button.
2. **Given** a valid new name **when** Save is tapped **then** the folder is renamed, the list and
   breadcrumb update, and a toast reads "Renamed to Leases 2026. Undo" with Undo available for 10 seconds.
3. **Given** Undo is tapped **when** it fires **then** the previous name is restored in one request and the
   toast is replaced by "Name restored".
4. **Given** the new name collides case-insensitively with a sibling **when** Save is tapped **then** the
   API returns 409 and the sheet offers "Leases already exists here. Keep both (Leases (2)) / Replace is
   not available for folders / Cancel", with no silent auto-rename (BR-008, BR-009).
5. **Given** a forbidden character, reserved name, or a name that breaches the path-length limit **when**
   Save is tapped **then** the specific rule is named inline and the request is not sent.
6. **Given** another client renamed or moved the folder since the sheet opened **when** Save is tapped
   **then** the API returns 409 with the current state, and the sheet shows "This folder was renamed to X
   by Ashley Kim. Keep theirs or replace with yours?" (BR-016).
7. **Given** the rename commits **when** descendants exist **then** their stored paths are updated
   server-side in one transaction, and any open client view of a descendant reflects the new breadcrumb on
   its next revalidation without losing the user's position.
8. **Given** the rename commits **when** shares exist on the folder or its descendants **then** those
   share links continue to work, because they are bound to ids, and the sheet states "Existing links keep
   working."
9. **Given** a read-only subject **when** they attempt a rename by direct API call **then** the response is
   403 `READ_ONLY` (BR-004).

**Mobile acceptance criteria**

- There is no double-tap-to-edit and no inline editable row; rename is always an explicit command,
  reachable from both the overflow and the long-press menu.
- The sheet's field is focused with the existing name selected so a single type replaces it, and the Save
  button stays above `env(keyboard-inset-bottom)` at 360 x 640.
- The file-extension rule does not apply to folders, but the field must never silently strip characters the
  user typed beyond documented trimming.
- Swipe-down dismiss with unsaved changes prompts "Discard changes?" with Discard and Keep editing.
- Only one sheet at a time: opening rename from a context menu closes the menu first.
- The undo toast sits above `env(safe-area-inset-bottom)`, does not cover the primary action, and its Undo
  target is at least 48 x 48 CSS px.
- Screen reader announces "Renamed to Leases 2026, undo available" politely, and Undo is the next focus
  stop.

**Edge cases & negative paths**

- Offline rename: applied optimistically with a "Waiting to sync" chip; a sync conflict produces a
  notification with the same keep-theirs / replace choice, never a silent discard.
- Rename to the same name: treated as a no-op, sheet closes, no toast.
- Rename a folder whose parent was deleted mid-edit: 404 on Save with "The parent folder was deleted."
- Rename while a bulk move involving that folder is running: 409, with "This folder is being moved. Try
  again in a moment."
- Case-only rename ("leases" to "Leases"): permitted and not treated as a collision with itself.

---

### US-E03-09 — Move a folder with the destination-picker sheet

**As a** P4 Ashley Kim who filed a folder in the wrong place **I want** to move it with my thumb, with
no dragging **so that** I can fix room hygiene from a train.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E03-03, US-E03-04, US-E03-08 |
| Traces to | FR-FLDR-004, FR-FILE-012, NFR-MOB-002, NFR-A11Y-001, NFR-A11Y-006, BR-008, BR-011, BR-012, BR-016, BR-017 |

**Acceptance criteria**

1. **Given** a folder row overflow or long-press menu **when** "Move to..." is chosen **then** a single
   destination-picker sheet opens showing the room root and its child folders, with an internal breadcrumb,
   a "Move here" primary button, and an inline "New folder" row so a destination can be created without
   opening a second sheet.
2. **Given** the picker **when** the user taps a folder row inside it **then** the picker drills into that
   folder in place, updating its own internal breadcrumb, and never opens a stacked sheet.
3. **Given** a chosen destination **when** "Move here" is tapped **then** the folder and its entire subtree
   move, the sheet closes, the source list updates, and a toast reads "Moved Leases to Financials. Undo"
   with Undo available for 10 seconds.
4. **Given** the destination is the folder itself or any of its descendants **when** the picker renders
   **then** those rows are not shown at all (hidden, not disabled), and a direct API call attempting it
   returns 422 `MOVE_INTO_DESCENDANT` with "You cannot move a folder into itself." (BR-017).
5. **Given** the destination already contains an item with the same name **when** "Move here" is tapped
   **then** the API returns 409 and the sheet presents "Financials already has a folder called Leases.
   Keep both (Leases (2)) or Cancel." with no silent merge and no silent overwrite (BR-008).
6. **Given** the move would exceed the depth limit or the path-length limit **when** it is attempted
   **then** it is refused before any change with the specific limit and the offending path named
   (BR-011, BR-012).
7. **Given** the move commits **when** descendant paths are rewritten **then** it happens in one server
   transaction, so no intermediate state is observable where a child is orphaned.
8. **Given** the source or destination was modified concurrently **when** the move is attempted **then**
   the API uses the optimistic-concurrency token and returns 409 with "The destination changed. Choose it
   again." (BR-016).
9. **Given** shares exist on the moved folder or its descendants **when** the move commits **then** the
   shares continue to point at the same items, but any inherited permission from the old parent is
   recomputed per E07 inheritance rules and the confirmation states "Access inherited from the old parent
   will change." when that is true.
10. **Given** a read-only subject **when** they attempt a move **then** 403 `READ_ONLY` server-side, and no
    "Move to..." item is rendered.

**Mobile acceptance criteria**

- There is no drag-and-drop requirement on touch. HTML5 drag events do not fire from a finger on Chrome
  Android, Firefox Android or Samsung Internet, and SC 2.5.7 requires a single-pointer non-dragging
  alternative, so "Move to..." is the mechanism, not the fallback.
- The picker is one sheet with in-sheet drill-down and its own breadcrumb; QA fails the story if a second
  sheet is ever stacked on it.
- Picker rows are at least 56 CSS px tall; "Move here" is a full-width button of at least 48 CSS px in the
  thumb zone, above `env(safe-area-inset-bottom)`, and it always names the destination ("Move here:
  Financials").
- The picker opens at the large detent because it is a navigation surface, and the drag handle is at least
  48 CSS px wide and tappable to cycle detents so the sheet can be resized without a drag (SC 2.5.7).
- Android system back inside the picker goes up one level in the picker, and only closes the picker from
  its root.
- The move must survive a flaky connection: the request is idempotent, a timeout shows "We could not
  confirm the move. Checking..." and then reconciles from the server rather than firing a second move.
- Offline: "Move to..." is available and queued, the row shows in its new location with a "Waiting to sync"
  chip, and a sync conflict surfaces the keep-both choice as a notification.
- Screen reader: the picker announces "Choose a destination, currently in Acme HVAC"; each row announces
  "Financials, folder, 12 items, double tap to open"; the primary button announces "Move here to
  Financials".
- The undo toast has a 48 x 48 CSS px Undo target and persists 10 seconds even across a navigation.

**Edge cases & negative paths**

- Moving a folder to its current parent: "Move here" is disabled with the label "Already here".
- Destination deleted while the picker is open: on "Move here" the API returns 404 and the picker shows
  "That folder no longer exists." then returns to its parent level.
- Very large subtree (5,000 descendants): the move is accepted as a server-side transaction with a
  progress state on the row ("Moving...") and the toast appears on completion; the client never blocks.
- Undo after descendants were modified by another user: the undo restores the folder location only, and the
  toast copy on failure is "We could not undo the move because the folder changed."
- Cross-room move: not supported in R1. The picker shows only the current room, and the copy is "You can
  move within Acme HVAC. To move between rooms, download and re-upload." Recorded as OQ21.

---

### US-E03-10 — Delete a folder with an explicit cascade warning

**As a** P1 Marcy Doyle about to delete a folder on a phone **I want** to be shown exactly how many
subfolders and files will go with it **so that** a mis-tap cannot destroy a live deal's document set.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E03-03, US-E03-07 |
| Traces to | FR-FLDR-005, FR-FLDR-006, NFR-SEC-001, NFR-A11Y-004, NFR-MOB-002, BR-005, BR-013, BR-014, BR-015 |

**Acceptance criteria**

1. **Given** a folder row overflow, long-press menu, or the folder's own header overflow **when** "Delete"
   is chosen **then** a confirmation is presented that states server-computed counts in one sentence:
   "Delete Leases? This also deletes 3 folders and 47 files (210 MB). Everything goes to Trash for 30
   days." (BR-013).
2. **Given** the folder has active shares on it or on any descendant **when** the confirmation renders
   **then** it adds "2 share links will stop working immediately." and names how many people currently have
   access.
3. **Given** the confirmation **when** the counts cannot be computed **then** the delete button stays
   disabled and the copy reads "We could not confirm what this will delete. Try again." A delete without a
   count is a defect.
4. **Given** the counts exceed a threshold (Estimate: more than 25 files or more than 5 subfolders or any
   active share) **when** the user proceeds **then** the confirmation escalates from a sheet to a
   full-screen route with a typed confirmation of the folder name; below the threshold a sheet with a
   single destructive button is sufficient.
5. **Given** the user confirms **when** the delete commits **then** the folder and its entire subtree move
   to Trash (soft delete) with a 30-day retention, all shares on the subtree are revoked immediately, and a
   toast reads "Deleted Leases and 50 items. Undo" with Undo available for 10 seconds (BR-014, BR-015).
6. **Given** Undo is tapped inside the window **when** it fires **then** the whole subtree is restored to
   its original parent with names intact, and the toast is replaced by "Restored Leases and 50 items";
   revoked shares are not automatically restored and the toast says "Links stay revoked".
7. **Given** the counts change between opening the confirmation and confirming **when** the request is
   sent **then** the API validates the count token and returns 409 with "This folder changed. Review what
   will be deleted.", re-rendering fresh counts (BR-016).
8. **Given** a recipient is reading a file inside the subtree **when** the delete commits **then** their
   next request returns 404 and their screen shows "This document is no longer available." served by the
   server, not by a hidden client control (BR-003, BR-005).
9. **Given** the retention period elapses **when** the purge job runs **then** the subtree is permanently
   destroyed within 7 days, the deletion and its counts remain in the E11 activity log, and restore is no
   longer offered.
10. **Given** a read-only subject **when** they attempt a delete by direct API call **then** 403
    `READ_ONLY`, and no delete affordance is rendered for them anywhere.
11. **Given** the user is offline **when** they attempt the delete **then** it is queued only for the
    below-threshold case and refused for the escalated case with "You need a connection to delete this
    much." Queued deletes show a "Waiting to sync" chip and are reconciled per E08.

**Mobile acceptance criteria**

- The count sentence is fully visible at 360 x 640 without scrolling and never truncates at 200 percent
  text size. Truncating a blast-radius count is a defect.
- The destructive button is placed at the top of the button group in an iOS-style presentation and the
  safe "Cancel" or "Keep this folder" option occupies the thumb zone at the bottom, so the easiest target
  is the non-destructive one. Both are at least 48 CSS px tall with at least 16 CSS px between them.
- Commit happens on the up-event, and sliding off the button before release aborts it (SC 2.5.2).
- If a swipe action on the row is offered for delete, it is limited to one action in one direction, it does
  not start within 24 CSS px of either screen edge, it still presents the counted confirmation before
  committing, and it is duplicated in the row overflow. Swipe is never the only route.
- The escalated full-screen confirmation is its own history entry, so Android system back and the iOS
  in-app back cancel it and can never commit it.
- The undo toast persists a full 10 seconds, sits above `env(safe-area-inset-bottom)`, does not cover the
  primary action, and its Undo target is at least 48 x 48 CSS px.
- Screen reader: the confirmation is a modal dialog, the count sentence is read in full on open, and the
  result is announced assertively because it changes what the user can do.
- Haptic feedback on commit where the platform supports it, distinct from the success haptic used for
  non-destructive actions.

**Edge cases & negative paths**

- Empty folder: the sentence simplifies to "Delete Leases? It is empty. It goes to Trash for 30 days." and
  no escalation applies.
- Folder containing only trashed items: counts exclude them and the sentence adds "3 items already in
  Trash are unaffected."
- Concurrent delete by two users: the second request returns 409 `ALREADY_TRASHED` and the UI reflects the
  trashed state without an error toast.
- Delete of a folder that is currently an upload destination: in-flight uploads fail with 404, the client
  shows "Leases was deleted. 3 uploads were cancelled." and the local queue for that folder is cleared.
- Delete while a guest is mid-download from inside the subtree: the stream is terminated server-side and
  the partial file is not resumable.
- Quota: deleting to Trash does not free storage; the confirmation says "Storage is freed when Trash is
  emptied." (BR-018).

---

### US-E03-11 — Restore a deleted folder from Trash

**As a** P1 Marcy Doyle who deleted the wrong folder yesterday **I want** to restore it with its
contents intact **so that** a mistake on a phone is recoverable without a support ticket.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E03-10 |
| Traces to | FR-FLDR-006, NFR-SEC-001, NFR-A11Y-004, BR-008, BR-014, BR-017 |

**Acceptance criteria**

1. **Given** a room **when** the user opens Trash from the room overflow **then** it lists trashed items
   newest first, each row showing name, type, original path, deletion time, who deleted it, and days
   remaining before permanent deletion.
2. **Given** a trashed folder row **when** "Restore" is chosen **then** the folder and its entire subtree
   return to their original parent with original names, and a toast reads "Restored Leases and 50 items".
3. **Given** the original parent no longer exists **when** Restore is chosen **then** the user is offered
   "Restore to <room root>" or "Choose a location", using the destination picker from US-E03-09, and the
   copy explains why: "The original folder was deleted."
4. **Given** a name collision at the restore destination **when** Restore is chosen **then** the deterministic
   suffix from BR-008 is applied ("Leases (restored)") and the toast names the resulting name.
5. **Given** a trashed item **when** "Delete permanently" is chosen **then** a confirmation states "This
   permanently deletes Leases, 3 folders and 47 files. This cannot be undone." with a typed confirmation
   for subtrees above the escalation threshold, and on commit the content is destroyed immediately with no
   undo.
6. **Given** Trash **when** "Empty Trash" is chosen **then** the confirmation names totals ("Permanently
   delete 12 items, 1.4 GB?") and on commit storage is freed and the change is reflected in the room
   storage figure within 60 seconds.
7. **Given** shares that were revoked by the delete **when** the item is restored **then** they are not
   automatically reinstated, the restored item shows "No one has access" until re-shared, and this is
   stated in the restore toast.
8. **Given** the retention window **when** an item's remaining days reach zero **then** the purge job
   destroys it within 7 days, and the row disappears from Trash with the activity log retaining the record.
9. **Given** a read-only subject **when** they open the room **then** Trash is not available to them, and
   the endpoint returns 403.

**Mobile acceptance criteria**

- Trash rows are at least 64 CSS px tall to fit the original path on a secondary line with middle
  truncation ("Acme HVAC / ... / Financials"), with a 48 px overflow target.
- "Restore" is the row's primary action in its overflow and is listed above "Delete permanently", which is
  styled destructive and placed last.
- Days remaining is shown as text ("28 days left"), not only as a colour or a progress ring.
- At 360 px width the header shows "Trash - 12 items, 1.4 GB" and a single "Empty Trash" item in the
  screen overflow, never as a primary button that could be mis-tapped.
- Restore of a large subtree shows a determinate progress state on the row and completes asynchronously
  server-side, so closing the app does not interrupt it; the copy says "Restoring continues even if you
  close the app" because this is a genuine server job.
- Screen reader announces each row as "Leases, folder, deleted 2 days ago by Marcy Doyle, from Financials,
  28 days left".

**Edge cases & negative paths**

- Restore that would breach the depth limit because the destination moved deeper: refused with the limit
  named and the picker offered.
- Restore that would breach quota: refused with "Restoring needs 210 MB. You have 80 MB left." (BR-018).
- Two users restore the same item: second request returns 409 `ALREADY_RESTORED` and navigates to the
  restored item.
- Partial purge failure: the item stays in Trash marked "Purging", an operational alert fires, and the UI
  never claims it is gone before it is.
- Item trashed in a room that is itself trashed: restoring the room restores its Trash contents as they
  were, and the room Trash screen states that.

---

### US-E03-12 — The mobile tree equivalent: the path and outline sheet

**As a** P4 Ashley Kim deep in a nested structure **I want** a way to see and jump around the hierarchy
without a desktop tree **so that** I can reorient in one tap on a 360 px screen.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E03-04 |
| Traces to | FR-FLDR-010, NFR-MOB-001, NFR-A11Y-001, NFR-A11Y-002, NFR-A11Y-006 |

**Acceptance criteria**

1. **Given** the breadcrumb **when** the user taps its ellipsis chip or the room root chip **then** the
   path sheet opens showing two sections: "Path" listing every ancestor from the room root to the current
   folder in order, and "Inside <current folder>" listing the current folder's immediate child folders.
2. **Given** the Path section **when** an ancestor row is tapped **then** the sheet closes and the app
   navigates to that ancestor, truncating history to that level (consistent with US-E03-04 criterion 4).
3. **Given** the "Inside" section **when** a child row is tapped **then** the sheet closes and the app
   navigates into that child.
4. **Given** the sheet **when** it renders **then** each row is a flat row with a level indicator as text
   or a subtle marker, and indentation is capped at two visual levels so no horizontal scrolling occurs at
   320 CSS px width (SC 1.4.10).
5. **Given** a folder with many children **when** the "Inside" section renders **then** it shows the first
   50 with a "See all 3,412 items" row that closes the sheet and returns to the list view, because the
   sheet is for orientation and not for browsing at scale.
6. **Given** the sheet **when** the current folder is the room root **then** the Path section shows only
   the room and the sheet is dominated by the "Inside" section.
7. **Given** a folder-scoped share **when** a guest opens the sheet **then** the Path section is rooted at
   the shared folder and shows no ancestor above it (BR-002).
8. **Given** the sheet **when** it is dismissed by swipe-down or system back **then** the underlying list
   and its scroll position are unchanged.

**Mobile acceptance criteria**

- The sheet opens at the medium detent showing at least six rows, and expands to large on drag or on
  tapping the drag handle, which cycles detents so resizing needs no drag (SC 2.5.7).
- Rows are at least 48 CSS px tall with 8 CSS px separation; the current folder row is marked as current
  and is not tappable.
- The sheet is the only sheet on screen; opening it from a context menu closes the menu first.
- One-handed reach: the Path section is at the top and the "Inside" list scrolls, so the most likely target
  (an ancestor two levels up) sits within the middle third of the sheet at the medium detent.
- Screen reader: the sheet is a modal dialog named "Folder path"; rows announce "Financials, level 2 of 5"
  and "Leases, folder inside Financials".
- Opening the sheet requires no network call when the ancestor chain is already known from the breadcrumb;
  the "Inside" list may load and shows fixed-height skeletons.

**Edge cases & negative paths**

- Offline: the Path section always renders from local state; the "Inside" section shows "Not available
  offline" if the children were never loaded.
- Ancestor deleted while the sheet is open: tapping it returns 404 and the sheet shows "That folder was
  deleted." then refreshes the path.
- Path of 32 levels: the sheet scrolls; the current folder is scrolled into view on open.
- Very long ancestor names: middle truncation, with the full name as the accessible name.

---

### US-E03-13 — Desktop tree view in a navigation rail

**As a** P3 Tomás Ferreira at his desk with two monitors **I want** a real folder tree **so that** doing
actual diligence on a laptop feels like a step up in power rather than a shrunken phone app.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E03-03, US-E03-12 |
| Traces to | FR-FLDR-011, NFR-COMPAT-001, NFR-A11Y-001, NFR-A11Y-002, NFR-A11Y-006 |

**Acceptance criteria**

1. **Given** a viewport at Expanded width (>= 840 dp) with a height of at least 480 dp **when** a folder
   screen renders **then** a persistent tree rail appears on the leading edge showing the room's folder
   hierarchy with expand and collapse controls, and the content list occupies the remaining width.
2. **Given** Medium width (600 to 839 dp) **when** the layout renders **then** the tree is available as a
   dismissible drawer rather than a permanent rail, and the drill-down list remains the primary model.
3. **Given** Compact width (< 600 dp) **when** the layout renders **then** no tree is rendered at all and
   US-E03-12 is the only hierarchy surface.
4. **Given** a landscape phone that is medium-width but compact-height (< 480 dp) **when** the layout
   renders **then** the two-pane layout is not used, because it is impractical at that height, and the
   single-pane model applies.
5. **Given** the tree **when** a node is expanded **then** its children load lazily with a maximum of one
   request per expansion, and expansion state persists for the session per room.
6. **Given** the tree **when** a node is selected **then** the content list navigates to that folder and
   the breadcrumb updates, and the tree scrolls the selected node into view.
7. **Given** the tree **when** it is operated by keyboard **then** Up and Down move between visible nodes,
   Right expands, Left collapses or moves to the parent, Enter opens the folder, Home and End jump to first
   and last, and type-to-jump matches on the first letters of a node name (SC 2.1.1).
8. **Given** the tree **when** it is read by a screen reader **then** it uses `role="tree"`,
   `role="treeitem"`, `aria-expanded`, `aria-level` and `aria-selected` correctly, so level and state are
   announced.
9. **Given** HTML5 drag-and-drop **when** a fine pointer is present **then** dragging a folder onto a tree
   node moves it after the same confirmation as US-E03-09, and "Move to..." remains available as the
   primary, non-dragging route (SC 2.5.7).
10. **Given** the rail **when** its width is adjusted **then** preset widths are offered from a menu in
    addition to a draggable divider, so resizing does not require a drag.

**Mobile acceptance criteria**

- On a phone in portrait or landscape the tree must never appear. QA verifies at 360 x 640 and at 740 x 360
  that no tree rail is rendered and no horizontal scrolling exists.
- Expand and collapse controls in the tree are at least 24 x 24 CSS px with the 24 px spacing exception
  satisfied, and at least 32 x 32 CSS px in practice, because they sit adjacent to the node's own navigate
  target.
- A tablet at 834 x 1112 (medium width, expanded height) shows the drawer form, and the drawer is dismissed
  by system back on Android.
- Keyboard focus in the tree is always visible and is never hidden behind a sticky header or footer
  (SC 2.4.11).

**Edge cases & negative paths**

- A room with 10,000 folders: the tree virtualises its visible rows and never loads the entire hierarchy;
  a node with more than 500 children shows "Show 500 more" rather than expanding everything.
- A folder renamed elsewhere while its node is expanded: the label updates in place without collapsing.
- Window resized from Expanded to Compact mid-session: the tree unmounts, the current folder stays the
  same, and the drill-down list takes over with no navigation jump.
- Reduced motion: expand and collapse animate instantly.

---

### US-E03-14 — Name rules, path-length limits and Unicode handling

**As a** P4 Ashley Kim handling documents from sellers who name things badly **I want** clear, consistent
rules about what a folder can be called **so that** a name never silently changes or breaks a download
later.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E03-01, US-E03-08 |
| Traces to | FR-FLDR-016, FR-CONF-001, FR-CONF-002, NFR-I18N-001, NFR-A11Y-004, BR-009, BR-010, BR-011, BR-012 |

**Acceptance criteria**

1. **Given** any folder name **when** it is submitted **then** the server validates: 1 to 255 characters
   after trimming; no `/ \ : * ? " < > |`; no control characters U+0000 to U+001F; not composed only of
   dots; not a Windows reserved device name; and no leading or trailing whitespace or dots after trimming
   (BR-010).
2. **Given** a name in any script **when** it is stored **then** it is normalised to Unicode NFC, and
   collision comparison uses NFC plus a case-insensitive fold, so "Résumé" and "Résumé" in different
   normalisation forms collide (BR-009, NFR-I18N-001).
3. **Given** the full path from the room root **when** any create, rename or move is attempted **then**
   the resulting path must be at most 1,024 characters, and a breach is refused with the current length,
   the limit, and the offending segment named (BR-011).
4. **Given** a folder nesting operation **when** it would exceed 32 levels **then** it is refused
   (BR-012).
5. **Given** the client **when** it validates **then** it applies the same rules from a single shared
   validator exported by `packages/shared`, so client and server messages agree exactly and no rule exists
   in only one place.
6. **Given** any refusal **when** it is shown **then** the message names the specific rule and the
   offending characters, for example "A folder name cannot contain : or ?", never a generic "Invalid
   name".
7. **Given** a name with a zero-width or bidirectional control character **when** it is submitted **then**
   those characters are stripped and the user is shown the resulting name before commit, because invisible
   characters in a folder name are a spoofing risk.
8. **Given** the download of a folder as a zip (E04) **when** names are written into the archive **then**
   the stored names round-trip on Windows, macOS and Android without further mangling, which is why the
   forbidden set is the intersection of platform restrictions rather than the union of what the database
   allows.
9. **Given** a case-only difference between two sibling names **when** the second is created **then** it
   is treated as a collision and the keep-both choice is offered (BR-009).

**Mobile acceptance criteria**

- All refusal messages fit at 360 px width across at most three lines and remain fully readable at 200
  percent text size.
- Validation runs on submit rather than on every keystroke, so typing on a slow device is never blocked and
  INP stays under 200 ms; a soft hint (character counter) appears only after 200 characters.
- The character counter and error text are announced through a polite live region, and errors are
  associated with the field via `aria-describedby` (SC 4.1.3).
- Stripping of invisible characters is shown, not silent: the field visibly updates and the hint reads
  "We removed a hidden character from this name."
- Pasting a name from another app (a common phone behaviour) is fully supported, including a paste that
  fails validation, which produces the rule-specific message rather than a silent truncation.

**Edge cases & negative paths**

- A seller-supplied name of 400 characters pasted in: rejected with "Folder names can be up to 255
  characters. You pasted 400." and the field keeps the text so the user can trim it.
- Names differing only by a trailing space: collision after trimming, keep-both offered.
- Emoji sequences with zero-width joiners: preserved, because they are meaningful, while standalone
  zero-width characters are stripped. Recorded as OQ23 for a final decision on the exact allowlist.
- Locale-specific casing (Turkish dotless i): the case fold uses a locale-independent algorithm, documented
  in the domain model, so behaviour is deterministic across users.
- Path length breached by a move of a shallow folder into a deep one: refused with the specific descendant
  path that would break.

---

### US-E03-15 — Navigation state, scroll restoration and resumption

**As a** P5 Ingrid Sørensen interrupted after 40 seconds **I want** to come back to exactly where I was
**so that** six two-minute sessions add up to one real review instead of six restarts.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E03-03, US-E03-05 |
| Traces to | FR-FLDR-018, NFR-MOB-006, NFR-PERF-002, NFR-PERF-003, NFR-A11Y-003 |

**Acceptance criteria**

1. **Given** a folder list scrolled to an arbitrary position **when** the user navigates into a child and
   comes back **then** the scroll position is restored to within one row and the previously activated row
   is visually marked.
2. **Given** a folder list **when** the user opens a preview and returns **then** the same restoration
   applies, and the list does not re-fetch from page one.
3. **Given** the app **when** it is backgrounded **then** the current room, folder, scroll offset, active
   sort, open sheet state and any draft text are persisted on `visibilitychange` to hidden and on
   `pagehide`, because a frozen page cannot run timers or fetch callbacks and a discarded page runs no code
   at all.
4. **Given** the tab was discarded by the browser **when** the user reopens the app **then** it restores
   the same room, folder and scroll offset, and shows no error about the discard.
5. **Given** the app is reopened after more than 24 hours **when** it restores **then** it restores the
   location but revalidates the content, and stale rows are replaced without a scroll jump.
6. **Given** restoration **when** it happens **then** it must not cause a layout shift that breaches CLS
   0.1: the virtualised list uses fixed row heights or measured heights cached with the scroll state.
7. **Given** a deep link **when** it is opened **then** no prior state is restored and the folder renders at
   the top of its list.
8. **Given** an in-progress upload **when** the user navigates between folders and rooms **then** the upload
   continues, its progress bar persists across navigations, and its label names the destination folder.
9. **Given** persisted state **when** it is written **then** it contains no file contents and no
   credentials, only ids and offsets, and it is written to a storage mechanism the app treats as evictable.

**Mobile acceptance criteria**

- QA script: scroll a 3,000-item folder to row 800, open a child, return, and confirm the position is
  within one row. Then switch to another app, kill the tab from the mobile tab switcher, reopen, and confirm
  the same position.
- Restoration paints within 300 ms of the app becoming visible for cached content, and the offline banner
  appears if revalidation fails.
- Restoring must not move focus: if a screen reader user was on row 800, focus returns to row 800 and is
  not reset to the top of the document.
- The restored focused row is never hidden behind the sticky bottom bar; `scroll-padding-bottom` accounts
  for the bar plus `env(safe-area-inset-bottom)` (SC 2.4.11).
- Memory: restoration of a large list must not hold the full item array in memory. The client holds at most
  the loaded pages, and iOS memory pressure is treated as fatal and uncatchable, so no flow may depend on
  buffering an entire folder.

**Edge cases & negative paths**

- Restored folder was deleted: the app lands on the nearest surviving ancestor with the toast from
  US-E03-04.
- Restored sort no longer valid (a sort field was removed): fall back to Name A to Z silently.
- Two tabs on the same folder with different scroll positions: state is per tab, keyed by history entry, not
  global.
- Storage eviction cleared the persisted state: the app opens at workspace home with no error, because
  eviction is normal and all-or-nothing across IndexedDB, Cache API and OPFS.

---

### US-E03-16 — Folder details sheet

**As a** P3 Tomás Ferreira **I want** to see a folder's full name, path, counts, size and who can see it
**so that** I can answer "is this the right folder and has anyone else seen it" without leaving the list.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 3 |
| Depends on | US-E03-03, US-E03-07 |
| Traces to | FR-FLDR-017, FR-VIEW-004, NFR-MOB-001, NFR-A11Y-001, BR-002, BR-006 |

**Acceptance criteria**

1. **Given** a folder row overflow, long-press menu, or the current-folder breadcrumb chip **when**
   "Details" is chosen **then** a details sheet opens at the medium detent showing full name, full path,
   item counts, total size, created date and creator, modified date and modifier, and the viewer's own
   access level.
2. **Given** the subject is the room owner or a Manager **when** the sheet renders **then** it also shows
   "Who can see this" as a count plus the first three names ("4 people, including Dev Raman") with a link
   into the share-management screen in E07.
3. **Given** the subject is a Viewer **when** the sheet renders **then** the "Who can see this" section is
   omitted entirely, because the recipient list is not theirs to see (BR-002).
4. **Given** the sheet **when** it opens **then** the list behind it remains partly visible at the medium
   detent, so the user keeps their place in the list (progressive disclosure rather than a full-screen
   route).
5. **Given** the sheet **when** the user drags it up **then** it expands to the large detent and reveals
   secondary details: folder id, deep link with a "Copy link" action, and the folder's own activity summary
   linking to E11.
6. **Given** the sheet **when** it is dismissed by swipe-down or system back **then** the list scroll
   position is unchanged.
7. **Given** the folder is inside an archived room **when** the sheet renders **then** it states "Archived
   - read only".
8. **Given** the details **when** they are fetched **then** the request is a single call and the sheet shows
   fixed-height skeletons for values still loading, so the sheet does not resize as data arrives.

**Mobile acceptance criteria**

- The sheet has a drag handle of at least 48 CSS px width that is tappable to cycle detents, so resizing
  never requires a drag (SC 2.5.7).
- All values are selectable text so a user can copy a path; "Copy link" is an explicit 48 px action rather
  than relying on long-press-to-select.
- At 360 px width the full path wraps across at most three lines with middle truncation only if longer, and
  the full path is always available by copy.
- Only one sheet at a time: opening Details from a context menu closes the menu; opening Share from Details
  closes Details first.
- Screen reader: the sheet is a modal dialog named "<folder name> details", and each field is a
  term-and-value pair rather than a table with no headers.

**Edge cases & negative paths**

- Details for a folder that was just deleted: the sheet shows "This folder was deleted." with one action,
  "Close".
- Size still being computed: shows "Calculating..." rather than 0 bytes.
- Creator was a guest: shown as the guest email plus "via share link".
- Creator account was deleted: shown as "Deleted user", consistent with the audit anonymisation rule in
  US-E01-18.

---

### US-E03-17 — Empty folder state

**As a** P2 Dev Raman opening a folder with nothing in it **I want** to know it is genuinely empty rather
than broken **so that** I do not think the app failed and give up.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 2 |
| Depends on | US-E03-03 |
| Traces to | FR-FLDR-019, NFR-MOB-001, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** a folder with no children and write access **when** it renders **then** it shows "This folder
   is empty" plus two clearly separated primary actions, "Upload files" and "New folder", both in the thumb
   zone.
2. **Given** a folder with no children and read-only access **when** it renders **then** it shows "This
   folder is empty" and "Nothing has been added here yet." with no action, because there is nothing the
   viewer can do.
3. **Given** a load error rather than emptiness **when** it renders **then** the error state is visually
   distinct, names the problem ("We could not load this folder"), and offers Retry. An error must never be
   rendered as an empty folder.
4. **Given** an offline load with no cached children **when** it renders **then** it shows "Not available
   offline. Reconnect to see what is in this folder." rather than "empty".
5. **Given** a folder whose children are all filtered out by the active filter or search **when** it renders
   **then** it shows "No items match your filter" plus "Clear filter", which is a different state from
   empty.
6. **Given** a folder that is empty because everything in it was trashed **when** it renders **then** it adds
   "3 items are in Trash" with a link to Trash for permitted subjects.
7. **Given** any empty state **when** it is announced **then** the heading and body are read once by a
   polite live region and focus moves to the primary action if one exists.

**Mobile acceptance criteria**

- The empty state fits within a 360 x 640 viewport without scrolling, with any primary action inside the
  bottom third.
- Body copy is at most 160 characters and wraps to at most four lines at 200 percent text size.
- No empty state instructs the user to tap something that may be off screen; actions are rendered inline in
  the state itself as well as in the bottom action bar.
- Illustrations are at most 96 CSS px tall and are decorative with `aria-hidden`.

**Edge cases & negative paths**

- Empty because the viewer's grant hides everything inside: shows the read-only empty text, never "4 items
  you cannot see" (BR-002).
- Empty root of a brand new room: reuses the room empty state from US-E02-16 so the first-run experience is
  a single consistent screen.
- Emptiness that changes while on screen (someone uploads): the list replaces the empty state without a
  layout jump and announces "1 item added".

---

### US-E03-18 — Recent folders and jump-to-folder

**As a** P6 Ray Okonkwo uploading from a site visit **I want** the folders I use most to be one tap away
**so that** I file a survey correctly without navigating four levels with a gloved thumb.

| | |
|---|---|
| Priority | Could |
| Release | R2 |
| Estimate | 3 |
| Depends on | US-E03-03, US-E03-09, US-E02-09 |
| Traces to | FR-FLDR-020, FR-SRCH-002, NFR-MOB-002, NFR-PERF-002, NFR-A11Y-002 |

**Acceptance criteria**

1. **Given** the destination picker (US-E03-09) and the upload destination flow (E04) **when** either opens
   **then** the top section is "Recent folders" listing the five folders this subject most recently wrote
   to in this room, each with its path.
2. **Given** the folder screen **when** the user taps the "Jump to folder" item in the screen overflow
   **then** a search field opens that matches folder names within the current room, with a 250 ms debounce,
   and selecting a result navigates there directly.
3. **Given** a jump result row **when** it renders **then** it shows the folder name and its containing path
   with middle truncation, so two folders called "Leases" in different branches are distinguishable.
4. **Given** the recents list **when** a folder in it has been deleted or its access revoked **then** it is
   omitted server-side and never rendered as a dead row.
5. **Given** a guest **when** they open a picker or jump **then** the scope is limited to the shared subtree
   (BR-002).
6. **Given** the jump search **when** it is offline **then** it matches only cached folder names and labels
   the results "Offline results".
7. **Given** the recents list **when** it is empty (new room) **then** the section is omitted rather than
   shown empty.

**Mobile acceptance criteria**

- Recent-folder rows are at least 56 CSS px tall with the path on a second line; the section is the first
  thing in the picker so it is under the thumb without scrolling.
- The jump search field opens with the keyboard raised and shows at least three results above the keyboard
  at 360 x 640.
- Typing remains responsive with INP under 200 ms on the baseline device class; in-flight requests are
  cancelled on each new keystroke so no out-of-order result overwrites a newer one.
- The clear control inside the search field is at least 48 x 48 CSS px and not within 24 CSS px of either
  screen edge.
- Screen reader announces the result count once per settled query through a polite live region.

**Edge cases & negative paths**

- Two folders with identical names and identical visible paths (deep truncation): the row adds the parent's
  parent to disambiguate, and the accessible name contains the full path.
- Recents polluted by a single bulk operation: recents dedupe by folder and store the most recent write
  time only.
- Jump query matching 500 folders: results are capped at 50 with "Refine your search" as the last row.
- Jump into a folder in an archived room: allowed, read-only, with the archived banner.

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| File upload (camera, library, files picker, share sheet), resumable and background upload, download and zip | [E04](./epic-04-file-operations.md) |
| Multi-select mode, the bulk action bar, bulk move and bulk delete, partial-failure reporting | [E04](./epic-04-file-operations.md) |
| Copy and duplicate of folders and files; cut and paste and the staging tray | [E04](./epic-04-file-operations.md) |
| List versus tiles view, thumbnails, sort and grouping controls, file preview and the file details sheet for files | [E05](./epic-05-viewing-preview-and-file-details.md) |
| Split view for moving files between two locations | [E05](./epic-05-viewing-preview-and-file-details.md) |
| Search across files, filters, saved searches, content and OCR search | [E06](./epic-06-search-and-discovery.md) |
| Folder-level sharing, the role model, inheritance and override rules, revocation UX, read-only policy definition | [E07](./epic-07-sharing-and-access-control.md) |
| Duplicate-name resolution mechanics beyond folders, versioning, optimistic concurrency internals, the offline mutation queue | [E08](./epic-08-conflict-resolution-and-data-integrity.md) |
| The sheet, action bar, toast, haptic, theming and breakpoint system itself | [E09](./epic-09-mobile-ux-foundations.md) |
| Virtualisation implementation, cursor pagination internals, prefetch and cache policy, performance telemetry | [E10](./epic-10-performance-offline-and-scale.md) |
| Folder-level activity log and viewer analytics | [E11](./epic-11-trust-audit-and-notifications.md) |
| Cross-room folder move | Not in R1 to R3 as a native operation. Recorded as OQ21. |

## Open questions

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ17 | Is a 32-level depth limit and a 1,024-character path limit right, or should the path limit be set by the zip-download target platform rather than by our database? | Engineering | Before R1 code freeze |
| OQ18 | What is the escalation threshold for a folder delete (currently more than 25 files, more than 5 subfolders, or any active share)? Too low and the typed confirmation becomes noise; too high and a mis-tap is cheap. | Product + design partners | Before R1 code freeze |
| OQ19 | Is 30 days the right trash retention for folders, and should it match the room retention in OQ10? | Product + Legal | Before R1 code freeze |
| OQ20 | Should the current-folder breadcrumb chip open the details sheet in R1 rather than being inert? | Design | R1 build |
| OQ21 | Do users need to move a folder between rooms, or is download-and-re-upload acceptable? P4-class users are the ones to ask. | Product | R2 planning |
| OQ22 | Should folders support a manual sort order (template order) as well as name and date, given templates create an intentional sequence? | Product + Design | R2 |
| OQ23 | Exact allowlist for Unicode characters in names: which zero-width and bidirectional characters are stripped versus preserved, and how are emoji ZWJ sequences handled? | Engineering + Security | Before R1 code freeze |
| OQ24 | Does the mobile path sheet need a genuine multi-level expandable outline for power users like P4, or does one level plus the ancestor chain remain sufficient at scale? | Design + P4 design partners | R2 |
