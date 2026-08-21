# Epic E02 — Data Rooms & Workspace Home

## Purpose

This epic defines the Data Room as the product's top-level container and the workspace home as the
first screen a signed-in person sees on a phone. It covers the full room lifecycle (create, rename,
duplicate, archive, delete, restore), room ownership, room settings, room templates, and the
invisibility rule that makes a room undiscoverable to anyone it was not shared with. It also owns the
one safety property the beachhead persona cares about most: on a 360 px screen, eight live mandates
must be visibly and unmistakably separate, so Deal A's financials can never be sent to Deal B's
buyer.

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
- [Success metrics & analytics](../10-success-metrics-and-analytics.md)
- [Master backlog](../11-master-backlog.md)
- [Risks & open questions](../12-risks-and-open-questions.md)
- Sibling backlogs: [E01 Access & Identity](./epic-01-access-and-identity.md),
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
| Epic ID | E02 |
| Goal | Make the Data Room a first-class, owner-scoped container that can be created in under 60 seconds from a phone, is invisible to everyone it was not shared with, is visually impossible to confuse with a sibling room, and can be archived or destroyed only with a blast-radius warning and a restore path. |
| Primary personas | P1 Marcy Doyle (solo broker running 5 to 8 live mandates, owner), P6 Ray Okonkwo (CRE broker marketing 6 to 10 assets, owner, field conditions), P4 Ashley Kim (transaction coordinator building and maintaining rooms for three brokers), P3 Tomás Ferreira (invited CPA, shared-with-me consumer), P5 Ingrid Sørensen (recipient with a four-minute patience budget) |
| Release span | R1 (stories 01 to 09 and 11, 13, 16), R2 (stories 10, 12, 14, 15, 17, 18) |
| Story count | 18 |
| Total points | 76 |
| Depends on | [E01](./epic-01-access-and-identity.md) US-E01-01 (subject model), US-E01-05 (sessions), US-E01-08 (guest sessions) |
| Blocks | [E03](./epic-03-folder-hierarchy-and-navigation.md) (a folder needs a room to live in), [E04](./epic-04-file-operations.md), [E06](./epic-06-search-and-discovery.md) (all-rooms search scope), [E07](./epic-07-sharing-and-access-control.md) (room-level sharing), [E11](./epic-11-trust-audit-and-notifications.md) (per-room activity), [E12](./epic-12-account-storage-and-governance.md) (per-room storage breakdown) |

## Mobile-first design stance

- **The home screen is a list of rooms, not a dashboard.** At 360 px there is no room for a metrics
  grid, a table with six columns, or a Kanban board. Home is a single-column, virtualised list of room
  cards with a segmented control for My rooms / Shared with me / Recents, a persistent search
  affordance, and one primary "New room" action in the thumb zone. Everything that a desktop VDR puts
  in a dashboard is either on the room card, in the room's own Activity tab (E11), or absent.
- **Room identity is a safety feature, so it is visual and redundant.** Every room carries an
  owner-chosen colour plus a two-letter monogram plus its name, and the colour and monogram travel with
  the room into the header, the breadcrumb, the share sheet and the confirmation dialogs. This exists
  because the highest-cost user error in the beachhead segment is sending the wrong room's link, and on
  a phone the room name alone is often truncated to 18 characters.
- **The room switcher replaces the desktop sidebar.** A desktop VDR keeps a persistent room list in a
  left rail. On compact width that rail is a sheet, opened by tapping the room name in the header,
  presenting the same list with search, pinned rooms first, and the current room marked. At Medium
  width (>= 600 dp) it becomes a navigation rail; at Expanded (>= 840 dp) it becomes a permanent
  sidebar. The touch primitive is the header tap, not a hamburger, because hidden navigation measurably
  reduces discoverability.
- **Right-click becomes long-press plus a permanently visible overflow.** Every room card carries a
  48 x 48 CSS px overflow button in its trailing edge. Long-press on the card opens the same menu.
  Neither is the only route: rename, archive and delete also exist inside room settings, per the rule
  that context-menu items must always be reachable from the main interface.
- **Destructive room actions are routes, not sheets.** Deleting a room destroys more than any other
  action in the product, so it gets its own full-screen route with server-computed counts, a typed
  confirmation, a soft-delete with 30-day retention, and a 10-second undo toast. It is never a
  two-button alert.
- **Empty states do work.** A new user with zero rooms sees a single primary action and a one-line
  promise, not an illustration and a paragraph. A recipient with zero shared rooms sees an explanation
  of how rooms arrive. Empty is the most common state in week one, so it is specified as carefully as
  the populated state.
- **Offline is a read state, and it says so honestly.** The room list and the last-opened room's top
  level are cached for offline read. The cache is labelled "Cached copy, may be cleared by your
  browser", because WebKit deletes all script-created storage for an origin with no user interaction in
  the last seven days of browser use, and eviction is all-or-nothing across IndexedDB, Cache API and
  OPFS together. No room mutation is ever presented as having succeeded offline unless it is queued and
  labelled as queued.
- **Desktop adds power, never the baseline.** Expanded width adds the persistent room sidebar,
  multi-column room grid, sortable columns, marquee selection over room cards, hover-revealed secondary
  actions inside `@media (hover: hover) and (pointer: fine)`, and keyboard shortcuts (`g` then `h` for
  home, `/` for search, `n` for new room). None of these carry unique information or unique capability.

---

## User stories

### US-E02-01 — Create a Data Room from a phone in under 60 seconds

**As a** P1 Marcy Doyle standing in a client's car park **I want** to create a Data Room with one tap
and one field **so that** I can start putting documents in front of a buyer before their interest
cools.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E01-01, US-E01-05 |
| Traces to | FR-ROOM-001, FR-ROOM-002, FR-ROOM-015, NFR-MOB-001, NFR-MOB-002, NFR-MOB-005, NFR-PERF-002, BR-001, BR-011, BR-025 |

**Acceptance criteria**

1. **Given** the workspace home **when** the user taps the primary "New room" action **then** a single
   bottom sheet opens containing a name field (focused, keyboard raised), an optional colour and
   monogram preview, an optional template selector (US-E02-15, hidden in R1 until templates ship), and
   one "Create room" button.
2. **Given** the name field **when** it is empty **then** "Create room" is disabled, and when it
   contains 1 to 128 characters after trimming, the button is enabled.
3. **Given** a valid name **when** "Create room" is tapped **then** the room is created server-side
   with the current subject as `ownerSubjectId`, the client navigates to the new room's root folder,
   and the whole path from tapping "New room" to seeing the empty room takes at most 3 network round
   trips.
4. **Given** the room is created **when** it is persisted **then** it has a generated colour from a
   fixed palette of 12 and a monogram derived from the first letters of the first two words of the
   name, both editable later in room settings (US-E02-11).
5. **Given** a name that duplicates an existing room name for the same owner **when** it is submitted
   **then** creation succeeds (room names are not unique) and the client shows a one-line notice "You
   have another room called Acme HVAC. Consider adding the year." with a "Rename" shortcut, per BR-025.
6. **Given** a name containing only whitespace, or characters forbidden by BR-010 **when** submitted
   **then** the field shows "Enter a name using letters, numbers, spaces or - _ . ( )" and the submit is
   not sent.
7. **Given** creation succeeds **when** telemetry fires **then** `room_created` is emitted with
   `template_id` (or `none`), `elapsed_ms_from_intent`, `viewport_width`, `install_state` and
   `network_type` where available.
8. **Given** the account is at the room-count ceiling an administrator set (BR-236) **when** "New room"
   is tapped **then** the sheet is replaced by `403 ACCOUNT_LIMIT_REACHED` copy naming the figure and who
   set it — "You have used all 20 rooms this workspace allows. Ashley Kim can raise the limit." — with
   "Archive a room" and "Request more space" actions, and no partial room is created (see E12).
9. **Given** the user is offline **when** "Create room" is tapped **then** the action is queued, the
   room appears in the list with a "Waiting to sync" chip, no share link can be created for it until it
   syncs, and it is reconciled on reconnect per E08.

**Mobile acceptance criteria**

- The sheet opens at the medium detent, the name field is auto-focused with the keyboard raised, and
  the "Create room" button stays visible above `env(keyboard-inset-bottom)` at 360 x 640.
- Total taps from home to a usable empty room: 3 (New room, type, Create). QA counts taps and fails the
  story at 4 or more for the default path.
- "New room" is a persistent primary action in the bottom action bar or as a bottom-right FAB, at least
  56 x 56 CSS px, positioned inside the one-handed thumb zone and offset by
  `env(safe-area-inset-bottom)` so it never sits under the home indicator.
- The sheet dismisses on swipe-down and on Android system back, and dismissing preserves the typed name
  for 10 minutes so a mis-swipe does not lose it.
- Only one sheet is on screen at a time: if the template selector needs its own surface, it replaces the
  create sheet rather than stacking on it.
- Tap-to-busy feedback appears within 100 ms so INP stays under 200 ms on the baseline device class.
- With a screen reader, the sheet is announced as a modal dialog titled "New Data Room", focus is
  trapped, and the created room is announced as "Room Acme HVAC created, now showing its contents".
- On the Lighthouse mobile preset the create round trip completes within 2 seconds at p75, and on
  timeout the button shows "Still creating. Do not tap again." rather than allowing a duplicate.

**Edge cases & negative paths**

- Double-tap on "Create room": the second tap is swallowed by the busy state; the request carries an
  idempotency key so a network retry cannot create two rooms.
- Name of exactly 128 characters: accepted; 129 is rejected with "Names can be up to 128 characters."
- Emoji or non-Latin script in the name: accepted, normalised to Unicode NFC, and the monogram falls
  back to the first grapheme cluster.
- Creation succeeds but navigation fails (page discarded): the room exists and appears at the top of
  My rooms on next open, never silently lost.
- Unverified email: room creation is allowed; sharing is not (BR-028, see US-E01-03).

---

### US-E02-02 — Room ownership and owner-only actions

**As a** P1 Marcy Doyle **I want** unambiguous ownership of each room **so that** only I can rename,
archive, delete or re-share it, and my buyers can never restructure my deal.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E02-01 |
| Traces to | FR-ROOM-002, FR-ROOM-012, NFR-SEC-001, BR-001, BR-003, BR-006, BR-023 |

**Acceptance criteria**

1. **Given** a room **when** it is created **then** it has exactly one `ownerSubjectId` of kind `user`,
   enforced by a database constraint, and a guest subject can never be an owner (BR-001).
2. **Given** the owner-only action set (rename room, change room settings, archive, delete, duplicate,
   transfer ownership, manage shares, view activity log) **when** any of those endpoints is called by a
   non-owner **then** the API returns 403 `NOT_ROOM_OWNER` and the action is refused server-side
   regardless of the client's UI state.
3. **Given** a non-owner with a Manager grant (E07) **when** they call an owner-only endpoint **then**
   they receive 403, and the client hides the control rather than showing it disabled, because a
   permanently disabled destructive control on a phone is a mis-tap magnet.
4. **Given** the room header **when** it renders for a non-owner **then** it shows the owner's display
   name and the viewer's own role as static text, for example "Shared by Marcy Doyle - You can view".
5. **Given** an owner **when** they open room settings **then** every owner-only action is present in
   one place, so no capability is reachable only through a long-press menu.
6. **Given** ownership transfer (E07) completes **when** it commits **then** the previous owner retains
   whatever explicit grant they were given, all owner-only controls disappear for them within one
   request cycle, and both parties receive a notification.
7. **Given** the owner's account enters `pending_deletion` (US-E01-18) **when** any request for the
   room arrives **then** the room is inaccessible to everyone and the response is 404 for non-owners.
8. **Given** an audit event on the room **when** it is recorded **then** it names the acting subject
   and the room owner at the time of the event, so a later ownership transfer does not rewrite history.

**Mobile acceptance criteria**

- At 360 px, the owner-only action list in room settings is a single-column list of rows at least
  56 CSS px tall with 48 px targets, and the destructive group is visually separated and placed last.
- The role indicator in the header is static text, never a badge that looks tappable, and is legible at
  200 percent text size without truncating the room name to fewer than 12 characters.
- A screen reader reads the header as "Room Acme HVAC, shared by Marcy Doyle, your access: view only".
- QA verification of server enforcement from a phone: sign in as a Viewer, use the browser devtools
  console (or an HTTP client) to call `PATCH /api/rooms/:id`, and confirm 403 with code
  `NOT_ROOM_OWNER`.

**Edge cases & negative paths**

- Owner loses access to their own email: ownership does not change; recovery is via E01 password reset.
- Two clients race a rename and an ownership transfer: optimistic concurrency (BR-016) returns 409 to
  the loser with "This room changed while you were editing. Reload to see the latest."
- Owner archived the room and a Manager tries to add a file: 403 `ROOM_ARCHIVED` (see US-E02-12).
- Non-owner attempts to leave a room they were shared into: permitted, and it removes their own grant
  only (E07), never the room.

---

### US-E02-03 — The invisibility rule, enforced on the server

**As a** P1 Marcy Doyle **I want** my rooms to be invisible to anyone I have not shared them with
**so that** a competitor cannot discover that I am selling a client's business.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E02-01, US-E02-02 |
| Traces to | FR-ROOM-013, NFR-SEC-001, NFR-PRIV-001, NFR-OBS-001, BR-002, BR-003, BR-005 |

**Acceptance criteria**

1. **Given** any subject with no grant on a room **when** they request the room, any of its folders,
   files, thumbnails, previews, activity or metadata by id **then** the API returns HTTP 404 with body
   `{ error: { code: 'NOT_FOUND' } }`, never 403, and never a body containing the room name, owner name
   or item counts (BR-002).
2. **Given** any list endpoint (rooms, search results, recents, activity) **when** it is queried
   **then** the result set is filtered server-side by the requesting subject's grants, and no
   client-side filter is relied upon.
3. **Given** a room id **when** it is generated **then** it is a non-sequential opaque identifier of at
   least 128 bits of entropy, so ids cannot be enumerated.
4. **Given** a shared link to one folder inside a room **when** the guest requests the room root or a
   sibling folder **then** the response is 404, so the share's scope boundary is also a visibility
   boundary.
5. **Given** a revoked grant **when** the former recipient makes a request **then** the response is 404
   from the revocation instant, cached content in their client is purged on the first failed
   validation, and the UI shows "This Data Room is no longer available. Contact the person who shared
   it."
6. **Given** search across all rooms (E06) **when** it runs **then** it can only ever return items the
   subject has a grant for, verified by a test that indexes two rooms owned by different users and
   searches as each.
7. **Given** an email-based invite to an address with no account **when** anyone else signs in with a
   different address **then** nothing about the invited room is visible to them, and the invite itself
   is not discoverable.
8. **Given** any 404 produced by this rule **when** it is logged **then** an `access_denied` telemetry
   event records `subjectId`, `resourceType`, `resourceId` and `reason: 'no_grant'` for E11, without
   leaking the resource name into user-facing responses.
9. **Given** an unauthenticated request for a room **when** it arrives **then** the response is 401 if
   no credential is present and 404 if a valid credential without a grant is present, so anonymity does
   not reveal existence either.

**Mobile acceptance criteria**

- The "not available" screen fits at 360 x 640 without scrolling, offers one action ("Go to my rooms" or
  "Request access" when the share exists but is revoked) and does not offer a retry loop that will keep
  failing.
- Client-side cache purge on a 404: verifiable by opening a shared room on a phone, having the owner
  revoke on another device, then pulling to refresh and confirming that thumbnails and file names are
  gone from the list and from the offline cache, not merely hidden.
- With the app installed and offline, previously cached content for a revoked room must not be readable
  after the next successful validation attempt; when still offline the app shows "Cached copy, may be
  cleared by your browser" and re-validates before allowing further reads.
- Announced assertively by a screen reader when access disappears mid-session, because it changes what
  the user can do.

**Edge cases & negative paths**

- Owner shares, revokes, then re-shares to the same person: a new grant is created; the old cached data
  is not resurrected and the new grant's scope is applied fresh.
- Two rooms with identical names owned by different users: no cross-visibility, and search never
  discloses the existence of the other.
- Room id pasted from a colleague's screenshot: 404.
- Log aggregation: room names must not appear in error payloads or client-side console output for
  unauthorised requests, and this is a review checklist item.

---

### US-E02-04 — Workspace home: My rooms on a 360 px screen

**As a** P1 Marcy Doyle running eight live mandates **I want** all my rooms on one thumb-scrollable
screen **so that** I can get into the right one in one tap without reading carefully.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E02-01, US-E02-03 |
| Traces to | FR-ROOM-007, FR-ROOM-016, FR-ROOM-017, NFR-MOB-001, NFR-MOB-002, NFR-PERF-001, NFR-PERF-003, NFR-A11Y-001, NFR-SCALE-001 |

**Acceptance criteria**

1. **Given** a signed-in owner **when** the workspace home loads **then** it shows a segmented control
   with My rooms, Shared with me and Recents; My rooms is the default for a subject that owns at least
   one room, and Shared with me is the default for a subject that owns none.
2. **Given** the My rooms list **when** it renders **then** each row shows the room monogram in the
   room colour, the room name on one line with tail truncation, a secondary line reading "12 files ·
   updated 2h ago", a pin indicator when pinned, and a trailing overflow button.
3. **Given** a room row **when** it is tapped anywhere except the overflow **then** the app navigates to
   the room's root folder, and the navigation is a new history entry so system back returns to home
   with the scroll position restored to within one row.
4. **Given** the room list **when** it exceeds one screen **then** it is virtualised, uses cursor
   pagination with a page size of 25, and shows a total count ("8 rooms") in the section header so the
   list has a landmark rather than being an unbounded scroll.
5. **Given** the list has loaded once **when** the user returns to home from a room **then** the list is
   rendered from cache within 300 ms and revalidated in the background, and any change animates in
   without a layout jump that would breach CLS 0.1.
6. **Given** the list is loading for the first time **when** it renders **then** skeleton rows of the
   correct height are shown so no layout shift occurs when data arrives.
7. **Given** sort options **when** the user opens the sort control **then** the options are Recently
   updated (default), Name A to Z, Recently created, and Largest first, and the choice persists per
   subject across devices.
8. **Given** a subject with 200 rooms **when** they scroll **then** no frame takes longer than 50 ms of
   main-thread work on the baseline device class, and memory does not grow unbounded (rows are
   recycled).
9. **Given** the offline state **when** home loads **then** the last cached room list is shown with an
   offline banner, room rows are tappable for cached content only, and rooms with no cached content
   show "Not available offline" instead of failing on tap.

**Mobile acceptance criteria**

- Row height is at least 64 CSS px so both text lines and a 48 px overflow target fit with 8 px
  separation; at 200 percent text size the row grows and the name wraps to two lines rather than
  pushing the overflow off screen.
- No horizontal scrolling at 320 CSS px width (SC 1.4.10). Verified by resizing to 320 px and confirming
  the document scroll width equals the viewport width.
- Pull-to-refresh is available on the list, and a visible "Refresh" item exists in the screen overflow
  because a gesture may not be the only mechanism.
- The segmented control is reachable with a thumb (top of the content area is acceptable because it is
  navigation, but the primary "New room" action stays in the bottom thumb zone), and each segment is at
  least 48 CSS px tall.
- LCP for the home route is at most 2.5 seconds at p75 on mobile field data; the home route ships at
  most 300 KiB of JavaScript on the critical path.
- Screen reader: the list is a single list with each row exposing name, item count, last-updated and
  pinned state in one accessible name; the section header count is announced when the segment changes.
- Backgrounding home and returning restores the exact scroll offset, verified after killing the tab from
  the mobile tab switcher (state is persisted on `visibilitychange` to hidden, because `unload` does not
  fire).

**Edge cases & negative paths**

- Zero rooms: see US-E02-16 empty states.
- A room whose name is a single long word of 128 characters: truncated with an ellipsis at the tail, and
  the full name is available in the details sheet and as the accessible name.
- Item counts unavailable (still being computed after a bulk upload): the secondary line reads "Counting
  files..." rather than showing 0.
- Stale cache after a room was deleted on another device: the row is removed on revalidation with no
  error toast; tapping it during the gap shows "This room is no longer available."
- Very slow network: the skeleton persists for at most 10 seconds then shows "Still loading. Check your
  connection." with a Retry.

---

### US-E02-05 — Shared with me: the recipient's home

**As a** P3 Tomás Ferreira invited into nine deals **I want** one list of every room shared with me
**so that** I stop hunting through my inbox for links.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E02-04, US-E01-08 |
| Traces to | FR-ROOM-008, NFR-SEC-001, NFR-MOB-001, NFR-A11Y-001, BR-002, BR-004, BR-006 |

**Acceptance criteria**

1. **Given** a registered subject with grants on other people's rooms **when** they open Shared with me
   **then** each row shows the room monogram and name, the owner's display name, the subject's own role
   ("View only", "Can upload"), and the last activity time.
2. **Given** a guest session with no account **when** the guest opens the app root **then** they see
   only the shared scope they hold a token for, not a list, because a guest has no workspace home; the
   copy is "You are viewing Acme HVAC, shared by Marcy Doyle."
3. **Given** the list **when** it renders **then** it is filtered server-side by grant, and a test with
   two accounts confirms no cross-visibility (BR-002).
4. **Given** a read-only grant **when** the row is opened **then** no create, upload, rename, move or
   delete affordance is rendered anywhere inside that room, and the server independently returns 403
   `READ_ONLY` for those endpoints (BR-004).
5. **Given** a share is revoked **when** the recipient refreshes Shared with me **then** the row
   disappears without an error, and opening a stale deep link shows the standard "no longer available"
   screen.
6. **Given** the recipient chooses "Leave this room" from the row overflow **when** they confirm
   **then** their own grant is removed, the room disappears from their list, the owner is notified, and
   the copy on the confirmation is "You will lose access to Acme HVAC. Only Marcy Doyle can give it back."
7. **Given** an expiring share **when** the row renders **then** it shows "Access ends 12 Sep" when
   fewer than 14 days remain, so the recipient is not surprised.
8. **Given** a recipient with more than 25 shared rooms **when** they scroll **then** cursor pagination
   and virtualisation behave as in US-E02-04.

**Mobile acceptance criteria**

- Rows are visually distinguishable from owned rooms at a glance: the owner name is always on the
  secondary line and a "Shared" chip is present, both legible at 360 px width.
- Read-only rooms show a static "View only" chip with a contrast ratio of at least 4.5:1; it is not a
  disabled-looking control and is not tappable.
- The row overflow ("Leave room", "Details", "Pin") is a 48 x 48 CSS px target with 8 px separation from
  the row's own tap area; long-press opens the same menu and does not enter selection mode.
- With a screen reader, each row's accessible name includes the role, for example "Acme HVAC, shared by
  Marcy Doyle, view only, updated 2 hours ago".
- On a flaky connection, the list renders from cache with an offline banner and the "Leave room" action
  is disabled with "You need a connection to leave a room."

**Edge cases & negative paths**

- Grant exists but the room's owner account is pending deletion: the row is hidden and a stale open
  shows "This Data Room is no longer available."
- Recipient is both a Manager on one room and a Viewer on another: roles are shown per row, never
  aggregated.
- Recipient leaves a room by mistake: no self-service undo; the confirmation copy is explicit that only
  the owner can restore access. Recorded as OQ12.
- Guest tries to reach the workspace home URL directly: 404 for the list, with a link back to their
  shared scope.

---

### US-E02-06 — Rename a room

**As a** P1 Marcy Doyle **I want** to rename a room from my phone **so that** "New room" becomes "Acme
HVAC - 2026 Sale" before I share it with anyone.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 2 |
| Depends on | US-E02-01, US-E02-02 |
| Traces to | FR-ROOM-003, NFR-MOB-005, NFR-A11Y-004, BR-010, BR-011, BR-016, BR-025 |

**Acceptance criteria**

1. **Given** the room row overflow, the room header overflow, or room settings **when** "Rename" is
   chosen **then** one sheet opens with a prefilled text field, the existing name fully selected, and a
   "Save" button.
2. **Given** a new name of 1 to 128 characters after trimming **when** Save is tapped **then** the room
   is renamed, the sheet closes, and a toast reads "Renamed to Acme HVAC - 2026 Sale" with an "Undo"
   action available for 10 seconds.
3. **Given** Undo is tapped inside the window **when** it fires **then** the previous name is restored
   in one request and the toast is replaced by "Name restored".
4. **Given** a forbidden name (empty after trim, only dots, control characters, or a reserved name per
   BR-010) **when** Save is tapped **then** inline error text explains the specific rule and the request
   is not sent.
5. **Given** another client renamed the room since this sheet opened **when** Save is tapped **then** the
   API returns 409 with the current name and `ETag`, and the sheet shows "This room was renamed to X by
   Ashley Kim. Keep theirs or replace with yours?" with both options (BR-016).
6. **Given** the rename commits **when** it propagates **then** the room name updates in the header,
   breadcrumb, room switcher, home list, share sheet and any open activity view without a full reload.
7. **Given** the rename commits **when** shares exist **then** existing share links continue to work
   unchanged, because links are bound to ids not names, and the sheet says so in one line: "Existing
   links keep working."
8. **Given** the monogram was auto-derived **when** the room is renamed **then** the monogram updates
   only if it was never manually edited, and the colour never changes automatically.

**Mobile acceptance criteria**

- The rename sheet's field is auto-focused with the keyboard raised, the whole existing name selected so
  a single type replaces it, and the Save button remains above the keyboard inset at 360 x 640.
- There is no double-tap-to-edit-inline behaviour anywhere; rename is always an explicit command from an
  overflow, a long-press menu or settings.
- Swipe-down dismisses the sheet, and dismissing with unsaved changes shows a confirmation ("Discard
  changes?") per the sheet rules in E09.
- Only one sheet at a time: opening rename from a context menu closes the context menu first.
- The toast with Undo sits above the bottom action bar and above `env(safe-area-inset-bottom)`, does not
  cover the primary action, and its Undo target is at least 48 x 48 CSS px.
- Screen reader announces "Renamed to Acme HVAC - 2026 Sale, undo available" through a polite live
  region, and the Undo control is reachable by the next focus move.

**Edge cases & negative paths**

- Offline rename: queued, the row shows the new name with a "Waiting to sync" chip, and reconciliation
  follows E08; a conflict on sync is surfaced as a notification rather than silently discarded.
- Rename to a name that duplicates a sibling room: allowed, with the BR-025 notice.
- Rename an archived room: allowed for the owner; the archived state is unaffected.
- Rename during an active share-link view by a guest: the guest's header updates on their next request;
  no disruption to their reading position.

---

### US-E02-07 — Room switcher

**As a** P1 Marcy Doyle deep inside Deal A **I want** to jump to Deal B in two taps **so that** I can
answer a second buyer's question without going back to a home screen and losing my place.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E02-04 |
| Traces to | FR-ROOM-011, FR-ROOM-015, NFR-MOB-001, NFR-MOB-002, NFR-A11Y-002, NFR-PERF-002 |

**Acceptance criteria**

1. **Given** any screen inside a room **when** the user taps the room name and monogram in the header
   **then** a room switcher sheet opens listing pinned rooms first, then recent rooms, then all rooms,
   each with monogram, colour and name, with the current room marked and non-tappable.
2. **Given** the switcher **when** it opens **then** it includes a search field that filters the list as
   the user types with a 200 ms debounce, and "New room" as the last item.
3. **Given** a room is chosen **when** the tap registers **then** the app navigates to that room's root
   folder (not to its last-visited folder in R1), the sheet closes, and the transition is a new history
   entry so system back returns to the previous room.
4. **Given** the switcher **when** it renders with more than 25 rooms **then** it paginates and the
   search covers all rooms server-side, not only the loaded page.
5. **Given** the user is offline **when** the switcher opens **then** rooms with cached content are
   tappable and the rest are shown dimmed with "Not available offline" as static text.
6. **Given** the switcher is open **when** the Android system back is used or the sheet is swiped down
   **then** it closes and returns to the exact prior screen state.
7. **Given** a room the subject no longer has access to **when** the switcher list is refreshed **then**
   the row is removed silently on the next successful load.
8. **Given** the desktop breakpoint (>= 840 dp) **when** the layout renders **then** the same list is a
   persistent sidebar and the header tap is no longer required, while remaining available.

**Mobile acceptance criteria**

- The header tap target that opens the switcher is at least 48 CSS px tall and spans the room name plus
  monogram; it has an explicit disclosure chevron so it does not look like plain text.
- Rows are at least 56 CSS px tall with a 44 x 44 CSS px monogram avatar, so the colour and monogram are
  legible at arm's length in daylight (relevant to P6 working outdoors).
- The sheet opens at the medium detent with the search field not auto-focused (to avoid raising the
  keyboard for a user who only wants to scan the list), and tapping search expands to the large detent.
- Switching rooms completes with the new room's first paint within 1.5 seconds at p75 on the reference
  network, using the cached room shell.
- One-handed reach: the list is scrollable and the first five rows sit within the lower two thirds of the
  sheet at the medium detent.
- Screen reader announces the sheet as "Switch Data Room, 8 rooms", the current room as "selected", and
  the search field as "Filter rooms".

**Edge cases & negative paths**

- Only one room exists: the header still opens the switcher, which shows that room plus "New room", so
  the affordance is consistent rather than appearing later.
- Switching while an upload is in progress in the current room: the upload continues, the bottom upload
  bar persists across the switch, and its label names the source room ("Uploading 3 files to Acme HVAC").
- Switching while a destructive confirmation route is open: the confirmation is abandoned, not committed.
- A pinned room that has been revoked: removed from the pinned group on refresh with no error.

---

### US-E02-08 — Visual disambiguation between rooms

**As a** P1 Marcy Doyle running eight mandates **I want** each room to be unmistakable at a glance
**so that** I never send Deal A's confidential financials to Deal B's buyer.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E02-01, US-E02-07 |
| Traces to | FR-ROOM-015, NFR-MOB-001, NFR-A11Y-001, NFR-A11Y-002, BR-025 |

**Acceptance criteria**

1. **Given** a room **when** it is created **then** it is assigned one of 12 palette colours (chosen to
   be distinguishable under protanopia and deuteranopia) and a two-character monogram, both stored on
   the room.
2. **Given** the room identity **when** it is rendered **then** the colour and monogram appear in the
   home row, the room header, the room switcher, the destination picker (E04), the share sheet (E07),
   and every destructive confirmation for that room.
3. **Given** a new room whose auto-assigned colour matches an existing room of the same owner **when**
   it is created **then** the next unused palette colour is chosen instead, until all 12 are used, after
   which reuse begins with the least recently used.
4. **Given** the owner opens room settings **when** they change the colour or monogram **then** the
   change is reflected everywhere within one request cycle and is visible to recipients as well.
5. **Given** colour is used to convey room identity **when** it is rendered **then** colour is never the
   only channel: the monogram and the name are always present, so the identity survives greyscale and
   colour blindness (SC 1.4.1 in spirit and required by NFR-A11Y-001).
6. **Given** a share confirmation (E07) **when** it is presented **then** it repeats the room colour,
   monogram and full name plus the recipient email in one sentence: "Send Acme HVAC to
   dev@example.com?" so a wrong-room send requires ignoring an explicit statement.
7. **Given** two rooms with identical names **when** they appear in any list **then** a disambiguating
   secondary line is added automatically (created date), so the rows are never visually identical.

**Mobile acceptance criteria**

- The monogram avatar is at least 40 x 40 CSS px in lists and 32 x 32 CSS px in headers and chips, with
  a contrast ratio of at least 4.5:1 between the monogram text and its background colour in both light
  and dark themes.
- The room header is sticky while scrolling a folder, so the room identity is on screen at all times at
  360 px width; it occupies at most 56 CSS px of vertical space plus `env(safe-area-inset-top)`.
- The colour picker in room settings presents 12 swatches at 48 x 48 CSS px with 8 px gaps, each with an
  accessible name ("Amber"), and shows a check mark on the selected one rather than relying on a border
  colour alone.
- Verified in greyscale: a QA engineer takes a screenshot of the home list, converts it to greyscale, and
  must still be able to identify each room by monogram and name.
- Screen reader announces the room identity once per screen, not per element.

**Edge cases & negative paths**

- Non-Latin names: the monogram uses the first grapheme cluster of the first two words; if only one word,
  the first two grapheme clusters.
- Names starting with punctuation or emoji: the emoji becomes the monogram, single character, centred.
- Recipient's theme is dark and the room colour is light: the monogram text colour is computed for
  contrast, not fixed.
- All 12 colours in use and 13 rooms exist: reuse is documented and the duplicate-name secondary line
  from criterion 7 carries the load.

---

### US-E02-09 — Recents

**As a** P1 Marcy Doyle who touches the same three rooms all week **I want** the rooms and folders I
opened recently at the top of my home screen **so that** I do not scroll or search for the obvious.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E02-04 |
| Traces to | FR-ROOM-009, NFR-PRIV-001, NFR-MOB-001, NFR-PERF-001 |

**Acceptance criteria**

1. **Given** the Recents segment **when** it renders **then** it lists the 20 most recently opened rooms
   and folders for this subject, newest first, each row showing the room monogram, the item name, and
   the containing path when it is a folder.
2. **Given** an item is opened **when** the navigation commits **then** the recents entry is recorded
   server-side against the subject so it is consistent across devices, deduplicated by item, and
   updated rather than appended.
3. **Given** a recents row **when** it is tapped **then** the app navigates directly to that room or
   folder, and a folder row lands with the breadcrumb already reflecting its full path.
4. **Given** an item that has been deleted or whose access has been revoked **when** recents is loaded
   **then** the row is omitted server-side, so no dead row is ever rendered.
5. **Given** the user opens the Recents overflow **when** they choose "Clear recents" **then** a
   confirmation states "This clears 20 recent items for your account. It does not delete anything." and
   on confirm the list is emptied.
6. **Given** a guest session **when** recents would be recorded **then** nothing is recorded beyond the
   share scope, because a guest has no cross-room history (NFR-PRIV-001).
7. **Given** offline **when** Recents is opened **then** the cached list renders and rows without cached
   content are dimmed with "Not available offline".

**Mobile acceptance criteria**

- Rows are at least 56 CSS px tall; the containing path is a single line with middle truncation so both
  the room and the leaf folder name remain readable at 360 px ("Acme HVAC / ... / Leases").
- Recents is the default segment for a returning subject who has opened at least three items, so the
  most likely destination is the first thing under the thumb.
- Loading recents must not delay the primary My rooms render: it is fetched in parallel and the segment
  shows skeletons of fixed height.
- Screen reader announces each row as "Leases, folder in Acme HVAC, opened 2 hours ago".

**Edge cases & negative paths**

- The same folder opened 30 times: one entry, timestamp updated.
- Recents across a room rename: the row shows the current name, because it stores ids.
- Privacy on a shared device: "Clear recents" exists and is also cleared by sign-out everywhere.
- Clock skew between devices: ordering uses server time.

---

### US-E02-10 — Pin a room to the top

**As a** P6 Ray Okonkwo marketing three hot assets **I want** to pin those rooms **so that** they are
always the first thing under my thumb, regardless of activity.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 2 |
| Depends on | US-E02-04, US-E02-07 |
| Traces to | FR-ROOM-010, NFR-MOB-002, NFR-A11Y-002 |

**Acceptance criteria**

1. **Given** a room row overflow or the room header overflow **when** "Pin to top" is chosen **then**
   the room moves into a "Pinned" section at the top of My rooms and of the room switcher, and the item
   becomes "Unpin".
2. **Given** pinned rooms **when** they render **then** they keep their own ordering (most recently
   pinned first) and are excluded from the unpinned list below, with a section header "Pinned (3)".
3. **Given** the pin state **when** it changes **then** it is stored per subject server-side so it is
   the same on the phone and the laptop.
4. **Given** more than 10 pins **when** an 11th is attempted **then** the action is refused with "You
   can pin up to 10 rooms. Unpin one first." (Estimate: 10 is the cap.)
5. **Given** a pinned room whose access is revoked **when** the list refreshes **then** the pin is
   removed silently along with the row.
6. **Given** a shared room **when** the recipient pins it **then** the pin affects only that
   recipient's own view and is never visible to the owner.
7. **Given** pinning **when** it completes **then** a toast reads "Pinned Acme HVAC" with an "Undo" for
   10 seconds.

**Mobile acceptance criteria**

- Pin is available from the row overflow and from long-press; it is not a swipe-only action.
- If a swipe action is used for pin, it is the non-destructive direction, is limited to one action, does
  not begin within 24 CSS px of either screen edge, and is duplicated in the overflow.
- The pin indicator on a row is a 16 CSS px icon with a text alternative in the accessible name; it is
  not the only difference between the pinned and unpinned sections (the section header is).
- Reordering pins by drag is not required in R2; if it ships later it must have a single-pointer
  alternative ("Move up" / "Move down") per SC 2.5.7.

**Edge cases & negative paths**

- Pin while offline: queued, indicated with a "Waiting to sync" chip.
- Pin the current room from the header while inside it: works, and the header overflow item toggles
  immediately.
- Pinned archived room: allowed; the row keeps its "Archived" chip.

---

### US-E02-11 — Room settings

**As a** P1 Marcy Doyle **I want** one place that holds everything about a room **so that** I am not
hunting through menus for the setting I need while a buyer is on the phone.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E02-02, US-E02-06, US-E02-08 |
| Traces to | FR-ROOM-012, FR-ROOM-016, NFR-MOB-001, NFR-SEC-001, NFR-A11Y-001, BR-001, BR-006 |

**Acceptance criteria**

1. **Given** an owner inside a room **when** they open Settings from the room header overflow **then** a
   dedicated route (not a sheet) presents grouped sections: Identity (name, colour, monogram),
   Structure (template applied, default folder structure), Access (link to share management in E07),
   Storage (size used, item counts, link to E12), Notifications (link to E11 per-room preferences), and
   a clearly separated Danger zone (Archive, Duplicate, Transfer ownership, Delete).
2. **Given** a non-owner **when** they open room settings **then** they see a read-only subset (name,
   owner, their own role, storage used) and no Danger zone, and the server enforces the same distinction.
3. **Given** any single setting is changed **when** it is saved **then** the save is per-setting with an
   explicit confirmation ("Saved") rather than a page-level Save button, and each change is written to
   the E11 activity log.
4. **Given** the Storage section **when** it renders **then** it shows total size, file count, folder
   count and the largest five files, all computed server-side and cached with an explicit "as of"
   timestamp.
5. **Given** the Danger zone **when** it renders **then** each action opens its own confirmation route or
   sheet as specified in US-E02-12, US-E02-13 and US-E02-14, and no destructive action commits from this
   screen directly.
6. **Given** a setting only an administrator may change **when** it renders **then** it is present with
   a read-only state, the value in force, and a one-line explanation naming who can change it, rather
   than being hidden, so the user can see the setting they are being held to.
7. **Given** the route **when** the user navigates away **then** no unsaved state exists, because saves
   are per-setting.

**Mobile acceptance criteria**

- The settings route is a single-column list of rows at least 56 CSS px tall; no inline accordions and no
  tabs, because collapsed sections create scope ambiguity about what a save applies to.
- Section headers are sticky so the user always knows which group they are in when scrolling at 360 px.
- The Danger zone is the last section, separated by at least 32 CSS px, with destructive rows in the
  destructive colour and no destructive row adjacent to a frequently used one.
- Any sheet opened from settings is the only sheet on screen; opening a second closes the first.
- Storage figures wrap rather than truncate at 200 percent text size.
- Screen reader: each section is a labelled group; the Danger zone group is announced as "Danger zone,
  4 items".

**Edge cases & negative paths**

- Setting changed simultaneously on two devices: last write wins for cosmetic settings (colour), 409 with
  a merge prompt for the name (BR-016).
- Offline: cosmetic settings queue; destructive actions are refused with "You need a connection for this."
- Storage figure is stale after a large upload: the "as of" timestamp plus a Refresh control makes it
  honest rather than wrong.
- Non-owner deep-links to the settings route: server returns the read-only projection, never 500.

---

### US-E02-12 — Archive and unarchive a room

**As a** P1 Marcy Doyle whose deal just closed **I want** to archive the room rather than delete it
**so that** the documents survive for my records but nobody can add to or change them.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E02-11 |
| Traces to | FR-ROOM-005, NFR-SEC-001, NFR-A11Y-004, BR-004, BR-005, BR-024 |

**Acceptance criteria**

1. **Given** an owner in the Danger zone **when** they tap "Archive room" **then** a sheet states
   exactly what archiving does: "Acme HVAC becomes read-only. 412 files stay where they are. 3 active
   share links keep working but nobody can upload, rename, move or delete. You can unarchive at any
   time." with counts computed server-side.
2. **Given** archiving is confirmed **when** it commits **then** the room state becomes `archived`, and
   every mutating endpoint for that room and its contents returns 409 `ROOM_ARCHIVED` for all subjects
   including the owner (BR-024).
3. **Given** an archived room **when** it appears in any list **then** it carries an "Archived" chip, is
   sorted below active rooms by default, and can be filtered to "Archived only".
4. **Given** an archived room **when** a recipient with a read grant opens it **then** they can read and
   (if permitted) download exactly as before, and no upload or edit affordance is rendered.
5. **Given** an archived room **when** the owner taps "Unarchive" **then** the room returns to `active`
   immediately with a toast, and no content was changed by the round trip.
6. **Given** archiving **when** it commits **then** it is written to the E11 activity log, and a
   notification is sent to subjects with grants only if the owner opts in on the confirmation sheet.
7. **Given** the room-count ceiling of BR-236 **when** a room is archived **then** whether it still
   counts is stated on the sheet, and the R2 behaviour is that archived rooms do not count toward the
   active-room ceiling but do count toward storage.
8. **Given** an in-flight upload to a room that is being archived **when** the archive commits **then**
   in-flight chunks are rejected with 409, the client marks those uploads "Room archived. Unarchive to
   finish." and preserves the local queue.

**Mobile acceptance criteria**

- The confirmation is a modal bottom sheet with explanatory text, at most three buttons, a 48 px drag
  handle, and swipe-down to dismiss; it is not an iOS action sheet because it carries a paragraph.
- Counts are never truncated at 360 px or at 200 percent text size.
- Committing happens on the up-event of the button, and a 10-second undo toast reads "Archived Acme
  HVAC. Undo."
- Inside an archived room the read-only state is communicated once as a sticky banner of at most 40 CSS
  px ("Archived - read only") rather than as many disabled buttons, and the banner does not obscure the
  focused element (SC 2.4.11).
- Screen reader announces the archived state on entering the room, as static text in the header region.

**Edge cases & negative paths**

- Archive a room with a queued offline mutation: the mutation fails on sync with 409 and the user is
  told "Acme HVAC is archived, so 2 changes could not be applied" with a list.
- Unarchive at the room-count ceiling: refused with "Unarchiving would exceed the 20 active rooms this
  workspace allows. Archive another room, or ask an administrator to raise the limit."
- Archive a room that is currently being duplicated (US-E02-14): the duplicate job completes and the
  copy is created active.
- Guest mid-upload when the room is archived: the guest sees "This room is now read-only" and their
  partial upload is discarded server-side after the orphan TTL.

---

### US-E02-13 — Delete a room, with an explicit blast-radius warning and restore

**As a** P1 Marcy Doyle cleaning up after a dead mandate **I want** to be told exactly what deleting
this room destroys, and to be able to get it back **so that** a mis-tap on a phone cannot end a live
deal.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E02-02, US-E02-11 |
| Traces to | FR-ROOM-006, NFR-SEC-001, NFR-A11Y-004, NFR-MOB-002, BR-005, BR-013, BR-014, BR-015 |

**Acceptance criteria**

1. **Given** an owner **when** they choose "Delete room" **then** a dedicated full-screen route opens
   (its own history entry), showing server-computed counts in a single explicit statement: "Deleting
   Acme HVAC will remove 14 folders, 412 files and 2.1 GB. 3 share links will stop working immediately.
   4 people currently have access."
2. **Given** the route **when** it renders **then** the room monogram, colour and full name are shown at
   the top, so the user can see which room this is without reading the sentence.
3. **Given** the route **when** the user must confirm **then** they type the room name (case-insensitive,
   paste permitted) into a field, and only then does the destructive "Delete room" button enable; "Keep
   this room" is the visually dominant button and sits in the thumb zone.
4. **Given** deletion is confirmed **when** it commits **then** the room enters `trashed` with a
   retention period of 30 days (BR-014), all share links for it are revoked immediately, every request
   from a recipient returns 404, and the room disappears from every list except Trash.
5. **Given** the commit **when** the toast appears **then** it reads "Acme HVAC deleted. Undo" and Undo
   is available for 10 seconds, restoring the room and its shares' revoked state (links stay revoked,
   and the toast copy says "Links stay revoked").
6. **Given** the Trash screen (account level) **when** it lists trashed rooms **then** each row shows the
   room, the deletion date, the days remaining and a "Restore" action, and restoring returns the room to
   `active` with all content intact.
7. **Given** the retention period elapses **when** the purge job runs **then** all content, thumbnails,
   previews and derived artefacts are destroyed within 7 days, the activity log for the room is retained
   in anonymised form per E11 retention, and the room can no longer be restored.
8. **Given** the deletion **when** it is recorded **then** `room_deleted` is written to the audit log
   with the counts that were displayed, so the warning shown can be proved after the fact.
9. **Given** an in-flight upload to the room **when** deletion commits **then** the upload fails with 404,
   the client shows "Acme HVAC was deleted. 3 uploads were cancelled." and the local queue for that room
   is cleared.
10. **Given** the user is offline **when** they attempt deletion **then** it is refused, not queued:
    "You need a connection to delete a room."

**Mobile acceptance criteria**

- The confirmation is a route, not a sheet, so Android system back and the iOS in-app back both cancel it
  and can never commit it.
- The destructive button is placed above the safe "Keep this room" button, so the easiest thumb target is
  the non-destructive one; both are at least 48 CSS px tall with at least 16 CSS px between them.
- The counts block is fully visible at 360 x 640 without scrolling for the common case, and never
  truncates at 200 percent text size. If counts push the layout beyond one screen, the counts stay above
  the fold and the explanatory text scrolls.
- Commit occurs on the up-event of the button (SC 2.5.2), never on touchstart, and the button can be
  aborted by sliding off it.
- The typed-confirmation field works with the keyboard open, with the button visible above the keyboard
  inset, and accepts paste.
- Counts are fetched fresh when the route opens; if the count request fails, the route shows "We could
  not confirm what this will delete. Try again." and the delete button stays disabled. A delete without
  a count is a defect.
- The undo toast persists for a full 10 seconds even if the user navigates, is anchored above
  `env(safe-area-inset-bottom)`, and its Undo target is at least 48 x 48 CSS px.
- Screen reader announces the route as a dialog, reads the count sentence in full, and announces the
  result assertively.

**Edge cases & negative paths**

- Counts change between opening the route and confirming (another user uploaded): the API validates the
  displayed count token and returns 409 with "This room changed. Review what will be deleted." then
  re-renders fresh counts.
- Room contains items shared individually (E07): those shares are revoked too and the count sentence
  says "3 share links, including 1 on a single file".
- Two owners' devices delete the same room concurrently: second request returns 409 `ALREADY_TRASHED`
  and the UI reflects the trashed state.
- Restore after the room-count ceiling has since been reached: refused with "Restoring would exceed the
  20 active rooms this workspace allows."
- Trash purge partially fails: the room stays in `purging`, an operational alert fires, and the user is
  never told it is gone before it is.

---

### US-E02-14 — Duplicate a room

**As a** P4 Ashley Kim setting up the fourth mandate this month **I want** to duplicate an existing
room's structure **so that** a new room takes five minutes instead of thirty.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E02-01, US-E02-11 |
| Traces to | FR-ROOM-004, FR-ROOM-014, NFR-SCALE-001, NFR-MOB-007, NFR-A11Y-004, BR-008, BR-012, BR-018 |

**Acceptance criteria**

1. **Given** an owner in room settings **when** they tap "Duplicate room" **then** a sheet offers two
   explicit options with counts: "Folders only (14 folders, no files)" and "Folders and files (14
   folders, 412 files, 2.1 GB)", plus an editable name prefilled as "Acme HVAC (copy)".
2. **Given** "Folders only" **when** confirmed **then** the new room is created synchronously if the
   folder count is under 200, the user is navigated into it, and no share, grant, activity history or
   file is copied.
3. **Given** "Folders and files" **when** confirmed **then** the copy runs as a server-side background
   job, the new room appears immediately in the list with a "Copying 18%" progress chip, and it becomes
   fully usable only when the job completes.
4. **Given** a duplicate job **when** it runs **then** shares, grants, activity logs, viewer analytics
   and trash contents are never copied, and the sheet says so explicitly: "Share links and access are
   not copied."
5. **Given** the source room is larger than the account's remaining quota **when** duplication is
   requested **then** it is refused before starting with "Copying needs 2.1 GB. You have 800 MB left."
   and a link to E12 (BR-018).
6. **Given** a duplicate job fails partway **when** the failure is detected **then** the partial room is
   marked `copy_failed`, the user is offered "Retry" or "Delete the partial copy", and no partial room is
   silently left looking complete.
7. **Given** a name collision with an existing room **when** the copy is created **then** the
   deterministic suffix rule from BR-008 applies ("Acme HVAC (copy)", "Acme HVAC (copy 2)").
8. **Given** duplication completes **when** the user is notified **then** an in-app notification and (if
   enabled) a push says "Acme HVAC (copy) is ready", because the job may outlive the session.

**Mobile acceptance criteria**

- The two options are presented as a radio group in a single sheet with the byte and count implications
  shown on each option, at 48 CSS px per row; no hidden accordion.
- Progress is visible from the home list row and from inside the room as a determinate bar with a
  percentage and an estimated remaining time, updated at most once per second to avoid layout thrash.
- Because the copy runs server-side, closing the app does not stop it, and the copy explicitly says
  "Copying continues even if you close the app." This is a genuine server job, so the claim is honest,
  unlike a client-side upload.
- On a flaky connection the progress chip falls back to "Copying..." without a percentage rather than
  showing a stalled number.
- Live region announces completion once.

**Edge cases & negative paths**

- Source room modified during the copy: the copy is a point-in-time snapshot taken at job start, and the
  completion notice says "Copied as of 14:32".
- Source room deleted during the copy: the job completes if it had already read the manifest, otherwise it
  fails with "The original room was deleted before copying finished."
- Depth limit: a source tree at the maximum depth (BR-012) copies without change; a copy that would
  exceed the path-length limit (BR-011) is refused per-item with a report listing the affected paths.
- Duplicate at the room-count ceiling: refused before starting, naming the ceiling and who set it.

---

### US-E02-15 — Room templates and a starting folder structure

**As a** P1 Marcy Doyle creating her ninth room this quarter **I want** a ready-made folder structure
for a business sale **so that** I do not build the same eleven folders on a phone every time.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E02-01, US-E03-01 |
| Traces to | FR-ROOM-014, FR-FLDR-001, NFR-MOB-001, NFR-A11Y-002, BR-008, BR-012 |

**Acceptance criteria**

1. **Given** the create-room sheet **when** templates are available **then** a template selector offers
   "Empty room" (default), at least three built-in templates (SMB Business Sale, Commercial Real Estate
   Offering, Startup Fundraising), and "From one of my rooms" which lists the user's rooms.
2. **Given** a built-in template is selected **when** the sheet shows its preview **then** it lists the
   folders it will create as a scrollable outline with the count ("Creates 11 folders"), before the user
   commits.
3. **Given** a template is applied **when** the room is created **then** all folders exist immediately,
   the room root shows them in template order (not alphabetical), and no files are created.
4. **Given** "From one of my rooms" **when** a source room is chosen **then** it behaves as
   US-E02-14 "Folders only" and does not copy files, shares or history.
5. **Given** an owner **when** they open room settings on an existing room **then** "Apply a folder
   template" is available and is additive: existing folders are untouched, template folders that already
   exist by name are skipped, and the confirmation states "Adds 6 folders. Skips 5 that already exist."
6. **Given** a template application **when** any folder name collides case-insensitively with an existing
   folder **then** the existing folder is kept and reused rather than a duplicate being created (BR-009).
7. **Given** a template **when** it would exceed the depth limit or path-length limit **then** the
   offending folders are not created and the user is told which ones and why.
8. **Given** a user-defined template (saving a room's structure as a reusable template) **when** it is
   requested in R2 **then** it is out of scope and the sheet's "From one of my rooms" option is the
   supported path, recorded as OQ14.

**Mobile acceptance criteria**

- The template selector is a single sheet with the preview inline, at the large detent if the outline
  exceeds five rows; it never opens a second sheet on top of the create sheet.
- Each template row is at least 56 CSS px tall with the name, a one-line description and the folder count.
- The outline preview is indented at most two levels at 360 px width, with deeper levels shown as
  "+ 3 more inside" so no horizontal scrolling occurs (SC 1.4.10).
- Applying a template must not block the user: folder creation completes within 2 seconds at p75 for an
  11-folder template, and the room opens with the folders present, not with a spinner.
- Screen reader reads the preview as a nested list with level information.

**Edge cases & negative paths**

- Template contains a folder name that violates BR-010 in the user's locale: sanitised at authoring time,
  never at apply time, so a template can never fail validation for the user.
- Applying the same template twice: all folders are skipped and the confirmation says "Nothing to add.
  All 11 folders already exist."
- Offline: template application is queued as folder-create operations and reconciled per E08; the room
  shows "Waiting to sync" until complete.
- Localised folder names: R2 ships English template names only; localisation recorded as OQ15.

---

### US-E02-16 — Empty states across the workspace home

**As a** P1 Marcy Doyle on her first day, and P2 Dev Raman with nothing shared yet **I want** the
empty screen to tell me exactly what to do next **so that** I am not staring at a blank list wondering
whether the app is broken.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E02-04, US-E02-05 |
| Traces to | FR-ROOM-007, FR-ROOM-008, NFR-MOB-001, NFR-A11Y-001, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** a subject who owns no rooms **when** My rooms renders **then** it shows one heading
   ("Create your first Data Room"), one line of body text ("A Data Room is a private folder you share
   with a buyer. Only people you invite can see it."), and one primary button "New room", with no
   illustration larger than 96 CSS px.
2. **Given** a subject with no shared rooms **when** Shared with me renders **then** it shows "Nothing
   shared with you yet. When someone shares a Data Room, it appears here and you will get an email."
   with no primary action, because there is nothing the user can do.
3. **Given** a subject with no recents **when** Recents renders **then** it shows "Rooms and folders you
   open will show up here." and no action.
4. **Given** a newly created empty room **when** its root folder renders **then** it shows "This room is
   empty" plus two clearly separated primary actions, "Upload files" and "New folder", both in the thumb
   zone.
5. **Given** a search with no results (E06) **when** it renders inside home **then** it shows the query
   back to the user and one action, "Clear search".
6. **Given** an error rather than emptiness **when** the list fails to load **then** the error state is
   visually distinct from the empty state, names the problem ("We could not load your rooms"), and
   offers Retry; an error must never be rendered as an empty list.
7. **Given** an offline empty state **when** it renders **then** it says "You are offline. Rooms you have
   opened before will appear here." so emptiness is not mistaken for data loss.

**Mobile acceptance criteria**

- Every empty state fits within a 360 x 640 viewport without scrolling, with the primary action inside
  the bottom third.
- Body copy is at most 160 characters so it is readable at a glance and does not wrap past four lines at
  200 percent text size.
- Empty states never contain a hidden action: no "tap the icon above" instructions, because the icon may
  be off screen at large text sizes.
- Screen reader announces the empty state heading and body once when the segment becomes active, through
  a polite live region, and focus is placed on the primary action if one exists.

**Edge cases & negative paths**

- Zero rooms because everything was archived: the empty state adds "You have 3 archived rooms. Show
  archived."
- Zero rooms because everything is in trash: adds "3 rooms are in Trash. Restore one."
- Guest with a revoked share landing on home: sees the standard "no longer available" screen from
  US-E02-03, not the empty home.
- First-run for a user who signed up via a share invite: Shared with me is the default segment, with the
  inviting room already listed.

---

### US-E02-17 — Room list at scale: search, filter and offline cache

**As a** P4 Ashley Kim supporting three brokers across 60 rooms **I want** to find a room by typing
three letters **so that** I never scroll a list of sixty on a phone.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E02-04, US-E02-07 |
| Traces to | FR-ROOM-017, FR-SRCH-001, NFR-PERF-002, NFR-SCALE-001, NFR-MOB-007, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** the workspace home **when** the user taps the search affordance **then** a search field
   opens with the keyboard raised and the scope fixed to "Rooms", and results filter as the user types
   with a 250 ms debounce.
2. **Given** a query **when** results return **then** matching rooms are listed with the matched
   substring highlighted, and the result count is announced ("4 rooms").
3. **Given** a query with no matches **when** it settles **then** the zero-result state names the query
   and offers "Search all files instead", handing off to E06.
4. **Given** filters **when** the filter control is opened **then** the available filters are Owned by me,
   Shared with me, Archived, Pinned, and Has unread activity, applied as one sheet with an explicit
   "Apply" and a visible count of active filters.
5. **Given** 60 or more rooms **when** the list is scrolled **then** cursor pagination fetches the next
   page before the user reaches the end, and the list keeps a stable total count in the header.
6. **Given** the network is slow **when** the user types **then** each keystroke does not fire a request:
   requests are debounced and the previous in-flight request is cancelled, so no out-of-order result
   overwrites a newer one.
7. **Given** the offline state **when** search runs **then** it searches the cached room list only and
   labels the results "Offline results, from your cached rooms".
8. **Given** the search field **when** the user dismisses it **then** the previous list state and scroll
   position are restored exactly.

**Mobile acceptance criteria**

- The search affordance is reachable one-handed: either in the bottom action bar or as a sticky control
  at the top of the list that remains visible while scrolling; it is at least 48 x 48 CSS px.
- With the keyboard open at 360 x 640, at least three result rows are visible above the keyboard.
- Typing on a slow connection never blocks input: the field remains responsive with INP under 200 ms, and
  results arrive behind a visible "Searching..." state, not a blocked UI.
- A cancel or clear control inside the field is at least 48 x 48 CSS px and does not sit within 24 CSS px
  of the screen edge where the Android back gesture lives.
- Screen reader: the result count is announced through a polite live region after the debounce settles,
  once per settled query, not per keystroke.

**Edge cases & negative paths**

- Query matching an archived room the user filtered out: the zero-result state says "1 match is hidden by
  your Archived filter. Show it."
- Non-ASCII query: matching is case and diacritic insensitive, so "Sorensen" finds "Sørensen".
- Query longer than 128 characters: truncated with a notice, never sent as an unbounded string.
- Search while a room list mutation is queued offline: locally queued rooms are included in offline
  results with their "Waiting to sync" chip.

---

### US-E02-18 — Room storage and item counts on the room card

**As a** P6 Ray Okonkwo uploading large survey PDFs from the field **I want** to see how big a room is
and how close I am to my limit **so that** an upload does not fail at a client site.

| | |
|---|---|
| Priority | Could |
| Release | R2 |
| Estimate | 3 |
| Depends on | US-E02-04, US-E02-11 |
| Traces to | FR-ROOM-016, FR-ACCT-004, NFR-PERF-001, NFR-OBS-001, BR-018 |

**Acceptance criteria**

1. **Given** the room row **when** it renders **then** the secondary line includes item count and size
   ("412 files · 2.1 GB"), computed server-side and cached, with `formatBytes` from
   `@dataroom/shared` used for formatting so the client and API agree.
2. **Given** usage crosses a threshold in BR-196 **when** home renders **then** a single dismissible
   banner reads "You have used 8.2 GB of 10 GB. Uploads stop at the limit." with "Free up space" and
   "Request more space", and it reappears at each of the 75, 90 and 100 percent crossings (see E12).
3. **Given** the room is at its ceiling **when** the user attempts an upload **then** the upload is
   blocked before any bytes leave the device with "You are out of storage. Free space, or ask an
   administrator to raise the limit." and nothing already stored is deleted or degraded (BR-205).
4. **Given** counts are stale **when** a room has been mutated within the last 60 seconds **then** the
   card shows the last known figure with a subtle "updating" indicator rather than a wrong number
   presented as fact.
5. **Given** the room settings Storage section **when** it renders **then** it breaks the total into
   files, versions and trash, so a user can see why a room is larger than the files they can see.
6. **Given** a guest or a Viewer **when** they see a room **then** storage figures are hidden, because
   the storage position is internal and a recipient must not learn the shape of our workspace.
7. **Given** the figures **when** they are computed **then** the computation is incremental (maintained on
   write) rather than a full scan per request, and a 10,000-item folder does not slow the home list.

**Mobile acceptance criteria**

- The secondary line fits on one line at 360 px width for values up to "9,999 files · 999.9 GB", and
  wraps rather than truncating at 200 percent text size.
- The quota banner occupies at most 72 CSS px, is dismissible per session, and never covers the primary
  "New room" action.
- The at-limit refusal happens client-side before file selection where possible (so the user is not asked
  to pick a 40 MB survey and then told no), and is also enforced server-side on the first chunk.
- Screen reader announces the quota banner once, politely, and the "Request more space" control has
  an accessible name containing its visible text.

**Edge cases & negative paths**

- Counts disagree between the card and settings: settings is authoritative and shows its "as of" time;
  the card refreshes on next load.
- Room in trash: its storage still counts toward quota during the 30-day retention, and this is stated in
  the Trash screen ("Trashed rooms still use your storage until they are purged").
- Very large room (over 100 GB): figures render with one decimal place and no layout change.
- Quota exceeded by a background duplicate job: the job is refused at start (US-E02-14 criterion 5), never
  mid-flight leaving a partial room.

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| Creating, configuring, expiring, password-protecting or revoking a share; the role model; inheritance and override; ownership transfer mechanics | [E07](./epic-07-sharing-and-access-control.md) |
| Folder creation, nesting, rename, move, delete-with-cascade, breadcrumbs, tree view | [E03](./epic-03-folder-hierarchy-and-navigation.md) |
| File upload, download, copy, move, multi-select and the bulk action bar | [E04](./epic-04-file-operations.md) |
| List versus tiles view, thumbnails, preview, file details sheet | [E05](./epic-05-viewing-preview-and-file-details.md) |
| Search across files and content, saved searches, filters beyond the room list | [E06](./epic-06-search-and-discovery.md) |
| Duplicate-name policy details, Unicode normalisation, optimistic concurrency mechanics, offline mutation queue | [E08](./epic-08-conflict-resolution-and-data-integrity.md) |
| Sheets, action bars, toasts, haptics, theming, breakpoints and the accessibility system itself | [E09](./epic-09-mobile-ux-foundations.md) |
| Virtualisation, pagination internals, caching strategy, performance telemetry | [E10](./epic-10-performance-offline-and-scale.md) |
| Activity log, viewer analytics, notification centre, per-room notification preferences | [E11](./epic-11-trust-audit-and-notifications.md) |
| Who sets the quota and the room-count ceiling, the enforcement policy at the limit, retention settings, provisioning and deprovisioning | [E12](./epic-12-account-storage-and-governance.md) |
| Multi-room bulk operations (archive 5 rooms at once) | Not in R1 to R3. Recorded as OQ16. |

## Open questions

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ09 | Does a room switcher navigate to the room root or to the last folder visited in that room? R1 ships root for predictability; brokers may prefer resume. | Product + design partners | R2 planning |
| OQ10 | Is 30 days the right trash retention for a deleted room, given deal timelines that can restart months later? | Product + Legal | Before R1 code freeze |
| OQ11 | Do archived rooms count against the room-count ceiling of BR-236? R2 assumes no for rooms and yes for storage; confirm with whoever will hold the administrator role. | Product + IT operations | Before R2 launch |
| OQ12 | Should a recipient be able to undo "Leave room" within a window, or must the owner re-share? Currently owner-only. | Product | R2 |
| OQ13 | Should a room support more than one owner (co-ownership) rather than a single owner plus Managers? | Product + Engineering | Before E07 build |
| OQ14 | Do users need to save their own room structure as a named, reusable template, or is "From one of my rooms" sufficient? | Product + P4-class design partners | R2 |
| OQ15 | Which locales need translated built-in template folder names first? | Product | R3 |
| OQ16 | Is multi-select on the room list (bulk archive, bulk pin) worth the touch complexity, given the 10-room realistic maximum for the beachhead? | Product | R3 |
