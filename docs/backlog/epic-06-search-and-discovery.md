# Epic E06 — Search & Discovery

## Purpose

On a phone, search is not a convenience bolted onto navigation, it *is* navigation. Walking four
levels of folder hierarchy with one thumb is the failure mode this epic exists to remove, and it is
simultaneously the touch replacement for two desktop primitives the brief assumes: type-to-jump in a
list and the persistent folder tree. This epic owns the built-in search box, its scope and filters,
the result row that answers "where is this file", and the honest behaviour of all of it on a slow
cellular link, offline, and with a keyboard covering half the screen.

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
  [E05 Viewing, Preview & File Details](./epic-05-viewing-preview-and-file-details.md),
  [E07 Sharing & Access Control](./epic-07-sharing-and-access-control.md),
  [E08 Conflict Resolution & Data Integrity](./epic-08-conflict-resolution-and-data-integrity.md),
  [E09 Mobile UX Foundations](./epic-09-mobile-ux-foundations.md),
  [E10 Performance, Offline & Scale](./epic-10-performance-offline-and-scale.md),
  [E11 Trust, Audit & Notifications](./epic-11-trust-audit-and-notifications.md),
  [E12 Account, Storage & Governance](./epic-12-account-storage-and-governance.md)

## Epic summary

| Field | Value |
| --- | --- |
| Epic ID | E06 |
| Goal | Let a thumb find a named file on the first attempt: a reachable search field on every screen, results as you type that never flicker or arrive out of order, every result showing the folder that holds it and jumping there, and honest states for zero results, errors, cancellation and offline. |
| Primary personas | P3 Tomás Ferreira (buy-side CPA whose fifteen-second question is "is the AR ageing in here yet"), P4 Ashley Kim (transaction coordinator finding one file out of sixty from a train), P1 Marcy Doyle (checking whether she has already uploaded the lease), P2 Dev Raman (recipient who must never see a result he has no grant on), P5 Ingrid Sørensen (finds the deck rather than browsing for it) |
| Release span | R1 (stories 01 to 12), R2 (stories 13 to 15 and 17), R3 (story 16) |
| Story count | 17 |
| Total points | 83 |
| Depends on | [E03](./epic-03-folder-hierarchy-and-navigation.md) (the node tree, breadcrumbs and paths that results reference), [E04](./epic-04-file-operations.md) (there must be files to find), [E10](./epic-10-performance-offline-and-scale.md) (cursor pagination, virtualised lists, cancellation, cached reads), [E09](./epic-09-mobile-ux-foundations.md) (bottom bar placement, keyboard insets, live regions), [E07](./epic-07-sharing-and-access-control.md) (the effective-permission resolution search consumes) |
| Blocks | [E02](./epic-02-data-rooms-and-workspace-home.md) all-rooms and room-name search surface, [E11](./epic-11-trust-audit-and-notifications.md) activity-log search reuses these controls and this result-row anatomy |

## Mobile-first design stance

- **Search is a permanent, thumb-reachable affordance, not a tertiary command.** It appears in the
  bottom bar of every room screen and in the workspace home header, never only behind an overflow.
  Hidden navigation measurably reduces discoverability and slows users, and search is the mobile
  substitute for type-to-jump, so burying it removes the only fast path a phone has.
- **The keyboard owns half the screen, so the layout is designed around it.** At 360 x 640 with the
  software keyboard open there are roughly 360 x 300 usable pixels. The field pins to the top of the
  search surface, the first three result rows must remain visible, and the layout uses
  `keyboard-inset-*` with a `visualViewport` fallback so nothing that receives focus is obscured
  (WCAG 2.2 SC 2.4.11).
- **Results as you type must never flicker.** Input is debounced at 250 ms with a two-character
  minimum, every superseded request is aborted, and the previous result set stays on screen marked
  stale rather than being replaced by an empty state. On a 100 ms round trip a naive per-keystroke
  fetch reads as breakage and burns the radio.
- **A result is useless without its location.** Every row shows the containing folder path, truncated
  from the middle so both the room and the leaf folder remain visible, and activating a result
  navigates to that folder with the item scrolled into view and briefly highlighted, not merely
  opening the file. That is what lets P3 see what else is in the folder and what is still missing.
- **Filters are one sheet with one Apply, never inline accordions.** A collapsed filter section whose
  scope is ambiguous is a correctness problem in a permissioned product: a reader who cannot tell
  whether a filter is still applied will misread the result set. One sheet, an explicit Apply, and a
  visible summary chip row of what is currently in force.
- **The server decides what exists.** Results are filtered by effective permission before they leave
  the API, with identical timing and no count leakage, because search is the most obvious oracle for
  the invisibility rule. Client-side filtering of a wider result set is a security defect, not an
  optimisation.
- **Offline and slow states are stated, never implied.** Offline search covers only locally cached
  items and says exactly that; a partial result set is never presented as complete.
- **Filename search first, content and OCR later, and the gap is measured.** R1 matches names because
  the stated job is "find one specific file out of sixty from a phone". The zero-result rate is
  instrumented from day one, because a room full of `Scan_2026-08-21_001.pdf` is precisely the corpus
  that filename search cannot serve, and that measurement is what promotes content search.
- **Desktop adds keyboard invocation and a filter rail, and changes nothing about the model.** `/`
  focuses the field, arrow keys traverse results, Enter opens, and filters expand from a sheet into a
  persistent rail at expanded width.

---

## User stories

### US-E06-01 — Search API: filename matching, normalisation and permission filtering

**As a** platform engineer building for P3 Tomás Ferreira **I want** one search endpoint that matches
names the way users expect and can never return an item the caller has no grant on **so that** search
is fast, predictable and cannot leak the existence of a document.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | none |
| Traces to | FR-SRCH-002, FR-SRCH-013, FR-SRCH-014, FR-ROOM-019, FR-ROOM-020, NFR-SEC-001, NFR-PRIV-001, NFR-I18N-001, NFR-SCALE-001, BR-046, BR-049 |

**Acceptance criteria**

1. **Given** `GET /rooms/:roomId/search?q=lease` **when** the caller holds at least `viewer` on the
   room **then** the API returns a cursor page of results, each carrying node id, name, kind, size,
   modified timestamp, the containing folder id and the human-readable containing path.
2. **Given** a query **when** it is matched **then** matching is case-insensitive, diacritic-insensitive,
   Unicode NFC-normalised substring matching on the file or folder name, using the same `nameKey`
   normalisation that governs uniqueness in [E08](./epic-08-conflict-resolution-and-data-integrity.md),
   so what collides and what matches never disagree.
3. **Given** a caller with a grant on a subtree only **when** they search the room **then** results are
   restricted to that subtree and its descendants, computed server-side, and a test that seeds a
   sibling folder the caller cannot see proves it never appears.
4. **Given** a caller with no grant on the room **when** they call the endpoint **then** the response is
   `404 NOT_FOUND` with no discriminating detail and timing indistinguishable from a room that does not
   exist, per the 403-versus-404 rule.
5. **Given** any result set **when** it is returned **then** trashed and purged nodes are excluded, and a
   node in `scanning` or `blocked` state is excluded until it is available.
6. **Given** a room with 100,000 nodes **when** a two-character query is issued **then** the p95
   server-side query time is under 150 ms and the endpoint is backed by an index; an unindexed path is
   a failing performance test rather than a slow response.
7. **Given** pagination **when** a second page is requested **then** it uses an opaque cursor with a
   stable total order (score or name plus id tie-breaker), so no result is duplicated or skipped while
   the corpus is being mutated.
8. **Given** a query containing only punctuation, whitespace or fewer than two characters **when** it is
   received **then** the API returns `400` with a typed reason and the client does not issue such a
   request in the first place.
9. **Given** non-Latin queries (Cyrillic, Chinese, Arabic) **when** they are matched **then** substring
   matching works on normalised text, verified by a fixture suite covering each script and a
   right-to-left name.

**Mobile acceptance criteria**

- No user-visible surface. Verifiable from a phone: with a guest session scoped to one folder, calling
  the room search endpoint directly returns only that folder's descendants, and a room the guest has no
  grant on returns 404.
- Response payload for a 20-result page stays under 12 KB gzipped (Estimate: about 400 bytes of JSON per
  row including the path), so a result page arrives inside one round trip on the reference network.
- Server timing headers separate database time from application time so slow searches can be diagnosed
  from real mobile sessions rather than reproduced locally.

**Edge cases & negative paths**

- A caller whose grant is revoked between the request and the response: authorisation is evaluated at
  query time, so the result set reflects the revocation; a revoked caller receives 404.
- Query matching 50,000 items: the first page is returned with `approximateTotal` and the interface
  states "about 50,000 results" rather than an exact count that would cost a second index scan.
- Emoji and combining characters in a query: normalised, matched, and never cause a 500.
- SQL or index-injection attempts in `q`: parameterised, no error detail returned, and the attempt is
  recorded as a security event.
- Cursor from a different room or a different sort: `400 CURSOR_SCOPE_MISMATCH` or
  `CURSOR_SORT_MISMATCH`, never shown to the user, logged as a client bug and, for scope mismatch, a
  security event because it can indicate cursor forgery.

---

### US-E06-02 — A search affordance a thumb can always reach

**As a** P4 Ashley Kim on a train **I want** search one tap away from wherever I am **so that** I never
navigate four folder levels with my thumb.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E06-01 |
| Traces to | FR-SRCH-001, FR-SRCH-020, FR-MOB-007, FR-MOB-011, FR-MOB-028, NFR-A11Y-001 |

**Acceptance criteria**

1. **Given** any room or folder screen at compact width **when** it renders **then** a labelled Search
   destination is present in the bottom navigation bar within the thumb zone, and it is never inside an
   overflow.
2. **Given** the workspace home **when** it renders **then** a search affordance is present in the
   header and defaults its scope to all rooms.
3. **Given** the search affordance **when** it is activated **then** the search surface opens as its own
   history entry with the field focused and the software keyboard raised, and the scope pre-set per
   US-E06-04.
4. **Given** the search surface **when** the principal dismisses it with the single visible close
   control, the system back, or a swipe-down **then** they return to the exact screen and scroll
   position they came from.
5. **Given** the search affordance **when** it renders **then** it is at least 48 x 48 CSS px with at
   least 8 px separation from adjacent targets, and its accessible name contains its visible label.
6. **Given** a hardware keyboard at any width **when** `/` is pressed outside a text field **then** the
   search surface opens with the field focused.

**Mobile acceptance criteria**

- The Search destination is one of at most five items in the bottom bar, each with a visible text label,
  and it stays visible with 200 percent text size by wrapping labels rather than dropping them.
- Opening search does not unmount the underlying folder screen: returning restores its scroll position
  from memory, not from a refetch, verified by a network assertion.
- The field is focused and the keyboard raised within 300 ms of the tap on the reference device, so the
  first keystroke is never lost.
- With a screen reader, activating Search announces the surface, the current scope and the field's
  purpose.
- The affordance respects `env(safe-area-inset-bottom)` and is never under the home indicator.

**Edge cases & negative paths**

- Search opened inside a room the principal has just lost access to: the surface opens, the query
  returns 404, and the state says "This room is not available" with a route back to the workspace home.
- Search opened with no rooms at all: the surface explains that there is nothing to search yet and
  offers Create a room.
- Search opened while a bulk operation or upload is running: both continue, and the global tray
  collapses to its bar above the results.
- Device with a physical keyboard and no touch: identical behaviour, with a visible focus ring on the
  field.

---

### US-E06-03 — Type-ahead: debounce, cancellation and no flicker

**As a** P3 Tomás Ferreira on hotel wifi **I want** results to settle rather than flash **so that** I
trust what I am reading after two seconds of typing.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E06-01, US-E06-02 |
| Traces to | FR-SRCH-005, FR-SRCH-006, FR-SRCH-007, FR-PERF-015, NFR-PERF-002, NFR-A11Y-003 |

**Acceptance criteria**

1. **Given** the search field **when** the principal types **then** no request is issued below two
   characters, and input is debounced by 250 ms so a fast typist produces one request rather than one
   per keystroke.
2. **Given** an in-flight request **when** a newer keystroke supersedes it **then** the older request is
   aborted client-side and its response, if it arrives, is discarded; a test that delays the first
   response proves stale results are never rendered.
3. **Given** a new query in flight **when** results from the previous query are on screen **then** they
   remain visible with a stale indicator (a subtle progress line and reduced opacity on the count, not
   on the rows) rather than being cleared to an empty state or a full-screen spinner.
4. **Given** a result set arrives **when** it replaces a stale set **then** the list's scroll position
   resets to the top and the change is announced politely with the new count.
5. **Given** a query typed and then fully deleted **when** the field is empty **then** any in-flight
   request is cancelled and the surface returns to the recent-searches state, not an empty result list
   reading "no results".
6. **Given** a slow response (over 1 second) **when** it is still pending **then** an inline progress
   indicator appears in the field's trailing edge only, with no layout shift, and the measured CLS for
   the search route stays at or below 0.1.
7. **Given** the interaction budget **when** a keystroke is processed **then** no main-thread task
   exceeds 50 ms and INP for the search route stays at or below 200 ms at the 75th percentile of mobile
   sessions.

**Mobile acceptance criteria**

- On a throttled 1.6 Mbps / 150 ms RTT / 4x CPU profile, typing "lease agreement" (15 characters at
  normal speed) issues at most four requests, verified by a network trace.
- No result row is ever rendered for a query the field no longer contains; QA reproduces this by typing
  quickly on a deliberately slowed network and watching for a mismatched row set.
- The keyboard never dismisses itself on a result arrival, so typing can continue uninterrupted.
- Rapid deletion back to one character cancels in flight requests without leaving a spinner running.
- With a screen reader, only the settled count is announced, not each intermediate set, so the reader is
  not flooded.

**Edge cases & negative paths**

- Autocorrect rewrites the query after the request was sent: the corrected text triggers a new
  debounced request and the earlier response is discarded.
- Paste of a 300-character string: truncated to the maximum query length with the field showing the
  truncation, and a single request is issued.
- Airplane mode toggled mid-query: the pending request fails and the offline state from US-E06-07 is
  shown, with the previous results kept and labelled as cached.
- Device clock or connection stall producing a 30-second hang: the request times out at 10 seconds
  (Assumption) and the error state offers Retry.
- IME composition (Japanese, Chinese): requests are issued on composition end rather than per composing
  keystroke.

---

### US-E06-04 — Scope: this folder or this room, with the right default

**As a** P1 Marcy Doyle **I want** search to default to the room I am in **so that** I never see another
deal's documents while looking for this one's.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E06-02 |
| Traces to | FR-SRCH-003, FR-SRCH-004, FR-ROOM-016, NFR-SEC-001, NFR-A11Y-003, BR-046 |

**Acceptance criteria**

1. **Given** the search surface **when** it opens **then** a scope control is visible without an extra
   tap, showing the active scope as text, with the values This folder and This room in R1 (All rooms
   arrives with US-E06-13).
2. **Given** search opened from inside a folder **when** the scope initialises **then** it defaults to
   This room, because the stated job is finding a file in the deal, not in the folder the user happens
   to be standing in.
3. **Given** search opened from the workspace home **when** the scope initialises **then** it defaults
   to the widest scope available in the current release and the control states it.
4. **Given** the scope is This folder **when** results are returned **then** they are restricted to that
   folder and its descendants, computed server-side, and the empty state names the folder.
5. **Given** the scope changes **when** a query is present **then** the query is re-run immediately in
   the new scope, the previous results are marked stale rather than cleared, and the change is announced
   politely with the new count.
6. **Given** the current room **when** the search surface is open **then** the room's name and its
   colour-plus-monogram marker are visible in the surface header, so the scope is never ambiguous on a
   360 px screen.
7. **Given** a scope the principal is not permitted to search **when** it is requested **then** the
   control does not offer it, and a direct API call returns 404 rather than an empty result set.

**Mobile acceptance criteria**

- The scope control is a segmented control at the top of the results area, at least 48 CSS px tall, and
  remains visible with the keyboard up at 360 x 640.
- At 200 percent text size the scope control wraps to two rows rather than truncating a scope name to an
  unreadable stub.
- Changing scope does not dismiss the keyboard or lose the query text.
- With a screen reader, the control is announced as a group with the selected value, and each option
  states what it covers ("This room, Riverside HVAC sale").
- The room marker in the header uses colour *and* a monogram, so scope identity does not depend on
  colour perception alone.

**Edge cases & negative paths**

- Scope This folder while standing at the room root: identical to This room; the control states that
  and does not offer a redundant choice.
- Room archived: search still works read-only and the header shows the archived state.
- Scope This folder after the folder is deleted by another principal: the scope falls back to This room
  with the inline notice "That folder was deleted, searching the whole room".
- Deep link into search with a scope parameter the principal cannot use: falls back to the widest
  permitted scope and says so.

---

### US-E06-05 — Result rows that show the path and jump to it

**As a** P3 Tomás Ferreira **I want** each result to tell me which folder holds it and take me there
**so that** I can see what else is in that folder and what is still missing.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E06-01, US-E06-03 |
| Traces to | FR-SRCH-008, FR-SRCH-009, FR-SRCH-010, FR-VIEW-001, FR-PERF-014, NFR-A11Y-001, NFR-A11Y-002 |

**Acceptance criteria**

1. **Given** a result set **when** rows render **then** each row shows the item name, a type indicator,
   and the containing folder path on a second line, at a fixed 64 CSS px row height.
2. **Given** a long path **when** it renders at 360 CSS px **then** it is truncated from the middle so
   the room and the immediate parent folder both remain visible ("Riverside HVAC … / Leases"), and the
   full path is available in the details sheet.
3. **Given** a matched substring **when** the name renders **then** the match is highlighted with a
   contrast ratio that meets the accessibility requirement and is not conveyed by colour alone (the
   match is also emboldened).
4. **Given** a result row **when** it is activated **then** the product navigates to the containing
   folder, scrolls the item into view, and highlights it for 1.5 seconds, rather than only opening the
   item.
5. **Given** the row's overflow control **when** it is activated **then** the same action set as a
   folder-list row is offered (open, details, share, rename, move, download, delete), each subject to
   the server-resolved capabilities on that node.
6. **Given** the principal returns with the system back after a jump-to **then** the result list is
   restored with its query, scope, filters, scroll position and the previously activated row still
   identifiable.
7. **Given** a result that is a folder **when** it is activated **then** the product navigates into that
   folder directly.
8. **Given** a result whose containing folder the principal may not open (a file shared individually)
   **when** the row renders **then** the path line reads "Shared with you" instead of a path, and
   activation opens the file in the viewer.

**Mobile acceptance criteria**

- Jump-to pushes a history entry, so the Android system back and the iOS in-app back both return to the
  results rather than exiting search.
- Row and overflow targets never overlap, verified at 320, 360 and 390 CSS px.
- At 200 percent text size the row grows to accommodate a wrapped name and a truncated path; the
  overflow control is never pushed off-screen.
- The highlight-on-arrival uses a background flash that respects reduced motion (no movement, no
  pulsing).
- With a screen reader, the row announces "name, kind, in folder path", and after a jump-to the target
  row is announced on arrival through a polite live region.

**Edge cases & negative paths**

- The item was moved between the search and the activation: the product navigates to its current
  containing folder and notes "This file has moved to Leases".
- The item was deleted: the result row activation shows "We could not find that. It may have been moved
  or deleted." and removes the row from the list.
- Two results with the same name in different folders: distinguished by the path line, which is why the
  path is never omitted.
- A result whose path is longer than the display allows even middle-truncated: the room and leaf are
  kept and the middle is a single ellipsis, never a truncation that hides the leaf.
- A file at the room root: the path line reads the room name alone.

---

### US-E06-06 — Typing with the keyboard up, one-handed

**As a** P2 Dev Raman standing in a queue **I want** to see results while I am still typing **so that** I
do not have to dismiss the keyboard to know whether to keep going.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E06-02, US-E06-03 |
| Traces to | FR-SRCH-019, FR-MOB-018, FR-MOB-034, NFR-A11Y-001, NFR-MOB-005 |

**Acceptance criteria**

1. **Given** the search surface with the software keyboard open at 360 x 640 **when** results are
   present **then** the field and at least three result rows are visible above the keyboard, computed
   from `keyboard-inset-*` with a `visualViewport` fallback.
2. **Given** the keyboard is open **when** the principal scrolls the results **then** the field remains
   pinned and visible, and scrolling does not dismiss the keyboard.
3. **Given** a focused element **when** the keyboard is open **then** no focusable element is entirely
   obscured by the keyboard, a sticky bar or a toast, satisfying WCAG 2.2 SC 2.4.11.
4. **Given** the field **when** it renders **then** it carries `inputmode="search"`, `enterkeyhint`
   set to search, `autocapitalize="off"`, `autocorrect="off"` and `spellcheck="false"`, so filenames are
   not mangled by the platform.
5. **Given** the field **when** the principal presses the keyboard's search key **then** the keyboard
   dismisses, the current query is committed and recorded in recents, and the results remain.
6. **Given** the field has content **when** it renders **then** a clear control is present at 48 x 48
   CSS px inside the field, and clearing returns to the recent-searches state.
7. **Given** a device with a physical keyboard attached to a phone **when** the field is focused **then**
   arrow keys traverse results, Enter activates, Escape clears then closes, and a visible focus ring is
   shown on the focused row.

**Mobile acceptance criteria**

- Verified on a real iPhone SE 3rd generation and a Galaxy A24 with the default keyboard and with a
  third-party keyboard of a different height; the three-visible-rows rule must hold in both.
- Rotating to landscape on a phone (compact height) keeps the field and at least one result visible; the
  layout does not stack the scope control and filter chips into the entire remaining space.
- Paste is permitted in the field and paste of a filename with an extension is not autocorrected.
- The clear control is reachable one-handed on a 6-inch phone, at the trailing edge of the field rather
  than at the top of the screen.
- With VoiceOver and TalkBack, the field announces the result count as a polite update while typing,
  without moving focus out of the field.

**Edge cases & negative paths**

- Keyboard height changes mid-session (emoji panel, predictive bar toggled): the layout re-measures and
  the three-row rule still holds.
- Accessory bar covering the last row: accounted for by measuring the visual viewport rather than
  assuming a fixed keyboard height.
- Voice dictation into the field: works, and the debounce applies to the dictated text as a whole
  rather than mid-utterance.
- Hardware keyboard attached mid-session: shortcuts light up without a reload.

---

### US-E06-07 — Zero results, errors, cancellation and offline

**As a** P1 Marcy Doyle **I want** to know why I see nothing **so that** I can tell "not in this room"
from "the search failed" and from "you are offline".

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E06-03, US-E06-04 |
| Traces to | FR-SRCH-017, FR-SRCH-018, FR-SRCH-025, FR-MOB-022, NFR-A11Y-003, NFR-AVAIL-001 |

**Acceptance criteria**

1. **Given** a query returning no results **when** the zero-result state renders **then** it repeats the
   query in quotes, names the active scope and every active filter, and offers three actions: widen the
   scope, clear filters, and upload or create here.
2. **Given** the zero-result state with a narrower scope available to widen **when** Widen is activated
   **then** the same query re-runs at the next wider scope in one tap, without retyping.
3. **Given** a request that fails with a server or network error **when** the error state renders **then**
   it is visually and textually distinct from zero results, states "Search is not working right now"
   with the request id available behind a copy-details affordance, and offers Retry.
4. **Given** the device is offline **when** a search is attempted **then** the surface states "You are
   offline. Showing only files you have already opened." and the result set is explicitly labelled as
   covering the local cache only; a partial set is never presented as complete.
5. **Given** an offline search **when** the connection returns **then** the query re-runs automatically
   once and the label is removed, with the count announced politely.
6. **Given** a cancelled search (the principal clears the field or closes the surface) **when** it is
   cancelled **then** in-flight requests are aborted, no error is shown, and no analytics event records a
   failure.
7. **Given** a rate-limited search **when** `429 RATE_LIMITED` is returned **then** the state shows "Too
   many searches. Try again in 30 seconds." with a live countdown and the field disabled for that
   period only.
8. **Given** any of these states **when** they render **then** they are announced through a polite live
   region with their full meaning, so a screen-reader user is never left in silence after typing.

**Mobile acceptance criteria**

- Every state fits at 360 x 640 with the keyboard open, requiring no scrolling to reach its primary
  action.
- Actions in these states are at least 48 CSS px tall and sit above the keyboard inset.
- The offline label is a persistent inline banner within the results area, not a toast that disappears
  before it is read.
- At 200 percent text size the state copy wraps and the query echo is truncated in the middle rather
  than dropping the search term entirely.
- QA can force each state from a phone: airplane mode for offline, a nonsense query for zero results, a
  test header for a forced 500, and a scripted burst for the rate limit.

**Edge cases & negative paths**

- Zero results at the widest available scope: the widen action is absent and the copy says "This is the
  widest search available here" where relevant, or simply omits the option.
- Zero results caused entirely by filters: the state names the filters and Clear filters is the primary
  action.
- Error followed by a successful retry: the error state is replaced without a page reload and the retry
  count is not shown to the user.
- Offline with an empty local cache: the state says so plainly rather than showing a zero-result state
  that implies the file does not exist.
- Repeated failures (three in a row): the state offers "Report a problem" which pre-fills the request
  ids.

---

### US-E06-08 — Result counts, paging and a virtualised result list

**As a** P4 Ashley Kim **I want** to know how many results there are and get more without losing my place
**so that** a broad query is still usable on a phone.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E06-01, US-E06-05 |
| Traces to | FR-SRCH-013, FR-MOB-016, FR-PERF-002, FR-PERF-004, NFR-SCALE-001, NFR-PERF-002 |

**Acceptance criteria**

1. **Given** a result set **when** it renders **then** a sticky header states the loaded range and the
   approximate total ("1 to 20 of about 312 results") and the count is described as approximate when it
   is.
2. **Given** a long result list **when** the principal scrolls **then** the next page is fetched when the
   last rendered row is within 15 rows of the loaded tail, with at most one page request in flight.
3. **Given** ten automatically loaded pages **when** the principal continues **then** an explicit "Load
   more results" control appears, so infinite scroll is never the only mechanism.
4. **Given** the result list **when** it exceeds the virtualisation threshold **then** it is virtualised
   with a fixed row height and at most three pages of rows retained in the DOM.
5. **Given** paging **when** a page arrives **then** no layout shift occurs, because skeleton rows are the
   same height as real rows.
6. **Given** the maximum result set in BR-057 (Assumption: 1,000 rows) **when** it is reached **then** the
   header states "Showing the first 1,000 results. Narrow your search with filters." rather than paging
   forever.
7. **Given** the principal jumps to a result and returns **when** the list is restored **then** the loaded
   pages, the scroll position and the count header are all restored, re-anchored by key rather than by
   pixel offset.

**Mobile acceptance criteria**

- Scrolling 1,000 results on the reference device produces no main-thread task over 50 ms and no memory
  growth beyond the three-page window, verified by a trace and a heap sample.
- The count header is readable at 360 CSS px and 200 percent text size, truncating the word "results"
  before the numbers.
- "Load more results" is at least 48 CSS px tall, full width, and inside the thumb zone when reached.
- Pull-to-refresh on the result list re-runs the current query and is duplicated by a Refresh action in
  the overflow.
- Page arrivals are announced politely as a count update, not as a new list.

**Edge cases & negative paths**

- The corpus changes between pages (a file is uploaded or deleted): the keyset cursor prevents duplicates
  and skips; a deleted result that is still on screen shows the not-found state on activation.
- A page request fails mid-scroll: an inline retry row appears at the tail instead of an empty gap.
- Exactly one result: the count header states "1 result" and no paging affordance renders.
- Cursor expired after a long pause: the list silently restarts from page 1 with a one-line notice, per
  the `INVALID_CURSOR` recovery.

---

### US-E06-09 — Filters in one sheet with an explicit Apply

**As a** P3 Tomás Ferreira **I want** to narrow by type and date without wondering what is still applied
**so that** I can trust an empty result set.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E06-05, US-E06-07 |
| Traces to | FR-SRCH-011, FR-SRCH-012, FR-MOB-005, FR-MOB-006, NFR-A11Y-001, NFR-A11Y-003 |

**Acceptance criteria**

1. **Given** the search surface **when** the Filters control is activated **then** a single modal bottom
   sheet opens with labelled sections for type, modified date, size, owner and shared status, with an
   explicit Apply button and a Clear all control.
2. **Given** the filter sheet **when** it renders **then** it uses grouped sections with visible headers
   rather than inline accordions, so no filter's scope is ambiguous and nothing is hidden inside a
   collapsed region.
3. **Given** filters are applied **when** the sheet closes **then** a chip row above the results
   summarises exactly what is in force ("PDF", "Last 30 days", "Shared"), each chip removable with a
   single tap at a 48 x 48 CSS px target.
4. **Given** filters and a text query **when** both are present **then** they combine with AND semantics
   and the count header reflects the combination.
5. **Given** the date filter **when** it renders **then** it offers relative presets (last 7 days, last
   30 days, last 90 days, any time) before any custom range picker, because a date picker is the most
   expensive control on a phone.
6. **Given** the sheet **when** the principal dismisses it without applying **then** no filter change
   takes effect, and the chip row is unchanged.
7. **Given** applied filters **when** the principal closes and reopens the search surface within the
   session **then** the filters persist for that session and are visible in the chip row; they do not
   silently persist into a new session.
8. **Given** the owner filter **when** it renders **then** it lists only principals the caller may see in
   this scope, computed server-side, so the filter itself cannot enumerate people.

**Mobile acceptance criteria**

- The sheet is a single sheet: choosing a custom date range happens inline within it, never in a second
  stacked sheet, so dismissing always returns to the search surface.
- Apply is a full-width button in the thumb zone, pinned above the keyboard inset if a filter field is
  focused.
- The sheet's content scrolls internally while Apply stays pinned; the page itself never scrolls
  horizontally at 320 CSS px.
- The chip row scrolls horizontally as a chip rail and never wraps into two rows that push results off
  screen; the chip rail itself has an accessible label listing the active filters.
- With a screen reader, applying filters announces the new count and the active filter summary.

**Edge cases & negative paths**

- A filter combination that can never match (type PDF plus size over 5 GB with a 2 GB per-file ceiling): zero
  results with the filters named, and the state suggests clearing filters.
- Owner filter after that principal's access is revoked: the filter still matches historic authorship;
  the chip states the name as recorded.
- Size filter with a locale using comma decimals: parsed per locale and echoed back formatted.
- Filters applied while offline: refused with "Filters need a connection. Showing cached files by name."
- Tag filter: not in R1 (there are no tags yet); the section is absent rather than present-and-empty.
  Recorded as OQ54.

---

### US-E06-10 — Recent searches

**As a** P1 Marcy Doyle running eight mandates **I want** my last searches offered **so that** I do not
retype "estoppel" on a phone keyboard three times a day.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E06-03 |
| Traces to | FR-SRCH-015, FR-AUTH-024, NFR-PRIV-001, NFR-A11Y-001 |

**Acceptance criteria**

1. **Given** the search surface with an empty field **when** it opens **then** the most recent searches
   are listed (Assumption: 10), each showing the query text and the scope it was run in, ordered most
   recent first.
2. **Given** a recent search **when** it is activated **then** the query, scope and filters are restored
   and executed in one tap.
3. **Given** a recent search row **when** its remove control is activated **then** that entry is deleted
   with no confirmation and no undo, because it is a convenience, not data.
4. **Given** the recent list **when** the Clear control is activated **then** all recents are removed
   after a confirmation stating the count ("Clear 10 recent searches?").
5. **Given** recents **when** they are stored **then** they are scoped to the account, synchronised across
   the principal's devices, and never shared with any other principal.
6. **Given** a query that returned zero results **when** it is recorded **then** it is still recorded,
   because a repeated zero-result query is a signal, not noise (and feeds US-E06-12).
7. **Given** a guest or anonymous link session **when** search is used **then** recents are held for that
   session only and are not persisted to any durable server record, because a link visitor has not
   consented to a stored history.

**Mobile acceptance criteria**

- Recent rows are 56 CSS px tall with a 48 x 48 CSS px remove target at least 8 px from the row's own
  activation area.
- The recent list is visible above the keyboard at 360 x 640 showing at least four entries.
- Long queries are truncated at the end with the full text available on activation, never truncated in
  the middle.
- With a screen reader, each recent row announces the query and its scope, and the remove control
  announces which query it removes.
- Recents render instantly from local storage on surface open, then reconcile with the server, so the
  surface is never empty for a moment on a slow link.

**Edge cases & negative paths**

- The same query run twice: recorded once and moved to the top rather than duplicated.
- A recent search referencing a room the principal has lost access to: shown, and on activation it falls
  back to the widest permitted scope with the notice "That room is no longer available".
- Sync conflict between devices: union of both lists, trimmed to the cap by recency.
- Privacy request to purge search history: covered by account deletion and by Clear; recents are
  included in the data export.

---

### US-E06-11 — Search-in-folder, the touch substitute for type-to-jump

**As a** P4 Ashley Kim in a folder of 400 scans **I want** to filter this folder as I type **so that** I
get the desktop's type-to-jump behaviour with a thumb.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E06-01 |
| Traces to | FR-SRCH-001, FR-SRCH-002, FR-MOB-016, FR-PERF-002, NFR-SCALE-001, NFR-A11Y-003 |

**Acceptance criteria**

1. **Given** a folder with more items than one page **when** the folder screen renders at compact width
   **then** a persistent search-in-folder field is available in the sticky header area, distinct from the
   global search surface.
2. **Given** the field **when** the principal types **then** the listing is filtered server-side through
   the `q` parameter of the children endpoint, preserving the active sort and the cursor semantics.
3. **Given** an active in-folder filter **when** it is applied **then** the count header states the
   filtered count against the total ("6 of about 412 items") and a clear control removes the filter in
   one tap.
4. **Given** an in-folder filter **when** the principal navigates into a subfolder and returns **then**
   the filter is cleared, because a persistent invisible filter is how users conclude that files have
   vanished.
5. **Given** a filtered listing **when** an item is acted on (moved, renamed, deleted) **then** the action
   behaves identically to the unfiltered list, including the count-bearing confirmations.
6. **Given** the field **when** it is empty **then** no request is issued and the unfiltered listing is
   shown from cache without a refetch.
7. **Given** a filtered listing with zero matches **when** it renders **then** the empty state says "No
   items in this folder match \"lease\"" and offers Search the whole room in one tap, which hands the
   query to the global search surface with room scope.

**Mobile acceptance criteria**

- The field appears only when the folder has more than one page of items, so small folders are not
  cluttered; the threshold is stated in the interface behaviour, not hidden.
- The field is inside the sticky header and does not add a second sticky bar over the content; total
  sticky height stays under 112 CSS px at 360 x 640.
- Typing in the field does not enter selection mode, and long-press on a filtered row behaves exactly as
  in the unfiltered list.
- The jump-to-letter rail is not shown at compact width (it would fight the row's own tap target) and
  appears only at medium width and above.
- The filtered count is announced politely on each settled query.

**Edge cases & negative paths**

- Filter matching a folder and a file with the same name: both shown, ordered by the active sort.
- Filter active while another principal uploads a matching file: it appears on the next page fetch or
  refresh, and the count updates.
- Filter plus grouping (E05 US-E05-15): groups reflect the filtered set and the header says so.
- Very fast typing on a 10,000-item folder: debounced identically to global search and every superseded
  request aborted.

---

### US-E06-12 — Search analytics and the zero-result feedback loop

**As a** product manager **I want** to know what people search for and when they find nothing **so that**
the decision to build content search is made from our own data rather than a guess.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E06-03, US-E06-05, US-E06-07 |
| Traces to | FR-SRCH-022, FR-PERF-021, FR-PERF-023, NFR-OBS-001, NFR-PRIV-001 |

**Acceptance criteria**

1. **Given** a settled search **when** results are rendered **then** `search_performed` is emitted with
   scope, filter set, result count, server latency, client latency, device class, connection class and
   whether the session is an installed web app; the raw query string is not sent.
2. **Given** a result activation **when** it occurs **then** `search_result_opened` is emitted with the
   result position, the item kind and the time from settle to activation.
3. **Given** a zero-result search **when** it settles **then** `search_zero_result` is emitted with a
   hashed query token and the query length, so repeated zero-result patterns are countable without
   storing confidential filenames in the analytics store.
4. **Given** these events **when** they arrive in the warehouse **then** they populate M13 search
   zero-result rate and M14 search-to-open rate, and both are visible on the R1 launch dashboard.
5. **Given** a search error **when** it occurs **then** `search_failed` is emitted with the error code and
   the connection class, distinguished from a cancellation, which emits nothing.
6. **Given** any analytics event **when** it is emitted **then** it contains no file name, no folder path
   and no room name, only opaque identifiers, because the analytics pipeline is not inside the
   confidentiality boundary the product promises.
7. **Given** the zero-result rate crosses the threshold in the assumption register (Assumption: 25
   percent of searches over a rolling week) **when** the weekly review runs **then** the content-search
   story US-E06-15 is promoted in priority, which is the pre-agreed trigger rather than a debate.

**Mobile acceptance criteria**

- Events are batched and sent through the same telemetry endpoint used for Core Web Vitals, are flushed
  on `visibilitychange` to hidden, and never block a keystroke or a navigation.
- No analytics request is issued while the device is offline; events are queued locally with a cap and
  dropped oldest-first rather than growing without bound.
- Client latency is measured from the keystroke that settled the debounce to the first painted result
  row, which is the number the user actually feels.
- Telemetry is disabled for anonymous link visitors beyond an aggregate count, per the privacy stance.

**Edge cases & negative paths**

- A user typing a filename that is itself confidential: never transmitted, per criterion 6; only a hash
  and a length.
- Analytics endpoint unavailable: events are dropped after the local cap with a counter, and no user-
  visible error occurs.
- A single user generating thousands of searches (a script): rate-limited and flagged, so the metric is
  not distorted.
- Zero-result rate inflated by two-character prefix searches: the metric excludes queries under three
  characters and states that exclusion in its definition.

---

### US-E06-13 — All-rooms search

**As a** P1 Marcy Doyle **I want** to search across every room I can see **so that** I can find the
document when I cannot remember which deal it belongs to.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E06-04, US-E06-08 |
| Traces to | FR-SRCH-003, FR-SRCH-004, FR-ROOM-027, NFR-SEC-001, NFR-SCALE-001, BR-046 |

**Acceptance criteria**

1. **Given** the scope control **when** All rooms is selected **then** `GET /search` returns results
   across every room the principal holds a grant on, each row carrying its room name and marker in
   addition to its folder path.
2. **Given** all-rooms results **when** they render **then** they are grouped by room with sticky room
   headers, or sorted by relevance with the room stated per row, and the choice is consistent and stated
   in the header.
3. **Given** a principal with grants on a subtree of one room and full access to another **when** they
   search all rooms **then** each room's results are restricted to that room's effective grant,
   computed server-side per room in one query.
4. **Given** an archived room **when** all-rooms search runs **then** its results are included and
   labelled archived, because a closed deal is exactly what a broker is trying to find.
5. **Given** all-rooms search **when** the principal is an invited guest or an anonymous link visitor
   **then** the scope is not offered and a direct call returns only the shared scope, never a list of
   rooms.
6. **Given** all-rooms search over 200 rooms **when** the query runs **then** p95 server time stays under
   400 ms, and the endpoint's cost is bounded by a per-room result cap stated in the response.
7. **Given** the workspace home **when** search is opened from it **then** All rooms is the default scope
   and room names are also matched, so typing a deal name finds the room itself.

**Mobile acceptance criteria**

- Every all-rooms result row shows the room marker (colour plus monogram) so two deals are never
  confused on a 360 px screen, which is the highest-cost error in the beachhead segment.
- Room headers are sticky and 40 CSS px tall, and the total sticky height with the field and scope
  control stays under 160 CSS px at 360 x 640.
- Switching from This room to All rooms keeps the query and re-runs it, marking the previous results
  stale rather than clearing them.
- The result list remains virtualised across room groups with a fixed row height.
- With a screen reader, room headers are announced as group headings and each row announces its room.

**Edge cases & negative paths**

- A principal with one room only: the All rooms scope is offered and behaves identically to This room,
  with no empty grouping.
- A room whose access is revoked mid-query: its results are omitted from the response; a cached row for
  it fails with 404 on activation and is removed.
- Results dominated by one room: the per-room cap ensures other rooms still appear, and the header states
  "showing up to 50 per room".
- Cross-room duplicate filenames (every deal has `NDA.pdf`): the room marker and path are the
  disambiguator, which is why neither is optional.

---

### US-E06-14 — Saved searches

**As a** P3 Tomás Ferreira pulled into twenty deals a year **I want** to save "bank statements in this
room" **so that** I can re-run my diligence checklist in one tap.

| | |
|---|---|
| Priority | Could |
| Release | R2 |
| Estimate | 3 |
| Depends on | US-E06-09, US-E06-10 |
| Traces to | FR-SRCH-016, NFR-PRIV-001, NFR-A11Y-001 |

**Acceptance criteria**

1. **Given** a query with its scope and filters **when Save** this search is activated **then** the
   principal names it and it is stored per account, appearing above recents in the search surface.
2. **Given** a saved search **when** it is activated **then** the query, scope and filters are restored
   and executed in one tap, and the surface header states which saved search is active.
3. **Given** a saved search **when** it is edited (renamed, or its filters changed and re-saved) **then**
   the change is explicit; a re-run with different filters does not silently modify the saved definition.
4. **Given** a saved search **when** it is deleted **then** a confirmation states its name and no undo is
   offered, because it holds no data.
5. **Given** saved searches **when** they are listed **then** they are scoped to the principal, never
   shared with the room, and are included in a data export.
6. **Given** a saved search referencing a room the principal has lost access to **when** it is activated
   **then** it runs at the widest permitted scope with the notice "That room is no longer available".

**Mobile acceptance criteria**

- Save is offered from the search surface overflow, not as a permanent button, so it does not compete
  with the primary actions at 360 CSS px.
- The naming sheet keeps its Save control above the keyboard inset and pre-fills a sensible default from
  the query and filters.
- Saved-search rows are 56 CSS px tall with a 48 px overflow target for rename and delete.
- With a screen reader, a saved-search row announces its name and its scope summary.

**Edge cases & negative paths**

- Duplicate name: allowed but flagged inline ("You already have a saved search with this name"), because
  a hard uniqueness rule here helps nobody.
- Saved search whose filters reference a removed owner: the filter is retained and the row notes "1
  filter no longer applies".
- Cap on saved searches (Assumption: 20): stated when reached with the oldest offered for removal.

---

### US-E06-15 — Search inside document text

**As a** P3 Tomás Ferreira **I want** to find the lease by a clause I remember **so that** I am not
dependent on whoever named the file.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E06-01, US-E06-08 |
| Traces to | FR-SRCH-023, FR-SRCH-014, NFR-SEC-001, NFR-PRIV-001, NFR-SCALE-001 |

**Acceptance criteria**

1. **Given** a room with content search enabled **when** a query runs **then** results include matches in
   extracted document text as well as names, and each content match row shows a short surrounding
   snippet with the match highlighted.
2. **Given** a content match **when** the row is activated **then** the product opens the file in the
   viewer at the page containing the match, with the match highlighted where the renderer supports it,
   and offers next-match and previous-match controls.
3. **Given** extraction **when** a file is committed **then** text extraction runs asynchronously, the
   file is searchable by name immediately and by content once extraction completes, and the details sheet
   states the content-search state per file.
4. **Given** a room's content index **when** it is queried **then** permission filtering is applied to
   the same effective grant as name search, so a snippet can never reveal text from an item the caller
   cannot open.
5. **Given** snippets **when** they are returned **then** they are generated server-side from the stored
   extraction and never include text from outside the caller's permitted scope.
6. **Given** content search **when** it is unavailable for a file (an image-only PDF before OCR exists)
   **then** the file is excluded from content matches and the interface states "Some scanned documents
   cannot be searched by content yet" once per session, not per file.
7. **Given** content search **when** it is enabled or disabled for a room **then** the setting is
   room-level, visible in room settings with its storage and cost implications, and the change is
   recorded in the activity log.
8. **Given** the extraction pipeline **when** it processes a file **then** the processor is named in the
   privacy documentation and has no network egress, because document text is the most sensitive data in
   the product.

**Mobile acceptance criteria**

- A content result row is at most 96 CSS px tall (name, path, one snippet line) and the snippet is
  truncated at the end so the match remains visible; the match is emboldened as well as highlighted.
- Jumping to a match opens the viewer at the correct page within the same first-page budget as any other
  preview.
- On a slow connection, content results and name results arrive in the same response so the list does not
  reflow twice.
- The one-per-session notice about unsearchable scans is dismissible and announced politely.
- Next-match and previous-match controls are 48 CSS px targets in the viewer's action row, in the thumb
  zone.

**Edge cases & negative paths**

- A 2,000-page document with 400 matches: the row states "412 matches" and the viewer's match navigation
  pages through them without loading all pages.
- Extraction fails for a file: it remains name-searchable and the details sheet says content search is
  unavailable for it, with a Retry available to a Manager.
- Query matching text inside a file whose grant excludes download: content search still works because it
  is a read, and the snippet respects the watermark and read-only rules.
- Encrypted or password-protected file: excluded from extraction, and the exclusion is visible per file.
- A room where content search is disabled: content matches are absent and the scope control does not
  imply otherwise.

---

### US-E06-16 — OCR so scanned documents are findable

**As a** P1 Marcy Doyle whose corpus is photographs **I want** my scans to be searchable **so that** the
capture workflow does not create a folder of unfindable files.

| | |
|---|---|
| Priority | Could |
| Release | R3 |
| Estimate | 13 |
| Depends on | US-E06-15 |
| Traces to | FR-SRCH-024, FR-FILE-003, NFR-PRIV-001, NFR-SCALE-002, NFR-OBS-001 |

**Acceptance criteria**

1. **Given** an image-only PDF or a photograph **when** it is committed **then** an OCR job extracts text
   asynchronously and the file becomes content-searchable, with its OCR state visible in the details
   sheet.
2. **Given** OCR output **when** it is stored **then** it carries per-word bounding boxes and page
   numbers so a content match can be highlighted on the rendered page.
3. **Given** OCR confidence below the threshold **when** results are returned **then** matches from
   low-confidence text are marked "approximate match" rather than presented as certain.
4. **Given** an OCR job **when** it runs **then** its compute per room is measured and reported, because
   OCR is the most expensive operation in the product and must not be an unbounded bill.
5. **Given** OCR **when** it is applied to a scan produced by the in-app scanner (E04 US-E04-17) **then**
   the text is attached at commit time where possible, so the capture-to-findable loop closes.
6. **Given** the OCR processor **when** the architecture is reviewed **then** it runs inside our
   processing boundary or a named processor with no egress, documented in the privacy policy.

**Mobile acceptance criteria**

- No OCR runs on the device by default: the phone's memory and thermal budget cannot carry it, and
  claiming on-device OCR while doing it server-side would be dishonest. If an on-device path is ever
  added it is stated explicitly.
- The details sheet shows OCR state in plain words ("Searchable", "Being processed", "Could not read
  this scan"), never a technical status.
- Highlighting an OCR match on a rendered page works at 360 CSS px with pinch-zoom, and the highlight
  survives a page turn and a rotation.
- A room with 5,000 scans queued for OCR reports progress in room settings rather than per file, so the
  interface is not flooded.

**Edge cases & negative paths**

- Handwriting: attempted, marked low confidence, and the interface does not claim handwriting support.
- A scan in a language the model does not support: OCR is skipped with the reason stated per file.
- A 200-page scan: processed page by page, with partial searchability as pages complete.
- OCR queue backlog: the state says "queued" with no invented completion estimate.
- This story is estimated at 13 points, which by convention means it must be split before sprint
  planning; the natural split is extraction pipeline, bounding-box storage and match highlighting, and
  cost metering.

---

### US-E06-17 — Desktop search enhancements

**As a** P3 Tomás Ferreira at a desk **I want** keyboard-first search and a persistent filter rail
**so that** the desktop is genuinely faster, not just wider.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 3 |
| Depends on | US-E06-05, US-E06-09 |
| Traces to | FR-MOB-010, FR-MOB-038, FR-MOB-039, FR-SRCH-012, NFR-A11Y-001, NFR-COMPAT-001 |

**Acceptance criteria**

1. **Given** a hardware keyboard at any width **when** `/` or `Ctrl/Cmd+K` is pressed **then** the search
   surface opens with the field focused, and Escape closes it returning focus to the element that opened
   it.
2. **Given** the result list **when** the arrow keys are used **then** focus moves row by row with a
   visible focus indicator, Enter activates the focused result, and `Ctrl/Cmd+Enter` opens the containing
   folder instead of the item.
3. **Given** expanded width (1200 CSS px and above) **when** the search surface renders **then** filters
   expand from the sheet into a persistent left rail using the same controls and the same Apply
   semantics, with no separate implementation.
4. **Given** the docked inspector from [E05](./epic-05-viewing-preview-and-file-details.md) US-E05-15
   **when** a result row is focused at expanded width **then** the inspector shows that item's details.
5. **Given** the shortcut sheet **when** it is opened **then** it lists the search shortcuts alongside the
   file-operation shortcuts, and every listed shortcut works.
6. **Given** any desktop enhancement in this story **when** it is evaluated at compact width **then** it
   is absent and no capability is lost, because every function remains reachable by touch.

**Mobile acceptance criteria**

- On a phone with a Bluetooth keyboard attached, `/` and the arrow-key traversal work, because SC 2.1.1
  is not a desktop-only obligation.
- No shortcut fires while a soft keyboard is composing text in the search field.
- The filter rail never renders below 1200 CSS px, asserted by an automated test at 360, 600, 840 and
  1200.
- Focus order in the search surface is field, scope, filter chips, results, and it does not trap.

**Edge cases & negative paths**

- Browser-level shortcut collision (`Ctrl+K` focuses the browser address bar in some browsers): the
  product registers `/` as the primary and treats `Ctrl/Cmd+K` as best-effort, documenting which works
  where.
- Screen-reader virtual cursor versus arrow-key traversal: the list uses a roving tabindex with grid
  semantics so both work.
- A user with reduced motion: focus movement is instant with no scroll animation.

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| Folder navigation, breadcrumbs, the mobile tree sheet and the desktop tree rail | [E03](./epic-03-folder-hierarchy-and-navigation.md) |
| The row anatomy, thumbnails, the details sheet and the viewer that a result opens | [E05](./epic-05-viewing-preview-and-file-details.md) |
| Effective-permission resolution, roles, inheritance and revocation semantics | [E07](./epic-07-sharing-and-access-control.md) (search consumes the resolution) |
| Name normalisation, forbidden characters and the collision rules search matching must agree with | [E08](./epic-08-conflict-resolution-and-data-integrity.md) |
| Cursor pagination internals, virtualisation, request cancellation plumbing and the offline read cache | [E10](./epic-10-performance-offline-and-scale.md) |
| Activity-log search and viewer-analytics filtering (which reuse these controls) | [E11](./epic-11-trust-audit-and-notifications.md) |
| Tags and tagging as a feature (the tag filter has nothing to filter until tags exist) | Not in R1. Recorded as OQ54. |
| Natural-language or semantic search, and AI question-answering over a room | Not in R1 to R3. It is the enterprise cohort's differentiator and an explicit non-goal for the beachhead. |
| Search across the activity log for compliance export | [E11](./epic-11-trust-audit-and-notifications.md) |
| Global search over other principals' rooms or any cross-account discovery | Never. It would breach the invisibility rule. |

## Open questions

Open-question IDs in this file come from the block reserved for E06 (OQ51 to OQ60), so that epics
authored in parallel cannot collide.

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ51 | [04-epics.md](../04-epics.md) tags filters, recent searches and the All-rooms scope as R2, while [05-functional-requirements.md](../05-functional-requirements.md) tags FR-SRCH-011, FR-SRCH-015 and FR-SRCH-003 as R1. This backlog follows the functional requirements for filters and recents and defers All rooms to R2 to match the API surface (`GET /search` is listed as R2). The three documents must be reconciled. | Product + BA | Before R1 sprint planning |
| OQ52 | Is 250 ms the right debounce for the reference network, or does 350 ms measurably reduce wasted requests without feeling slower? Needs a field experiment, not an opinion. | Engineering + Design | 2 weeks after R1 launch |
| OQ53 | What is the maximum result set (BR-057)? The current Assumption is 1,000 rows with a "narrow your search" prompt, which shapes both cost and the zero-result metric. | Engineering | Before R1 code freeze |
| OQ54 | Do we ship tags at all, and if so in which release? The tag filter named in the brief has nothing to filter until tags exist, and capture-time tagging is the mitigation for filename-only search (risk R10). | Product + design partners | R2 planning |
| OQ55 | Is content search a room-level setting an administrator enables per room, or on by default for every room? The index has a real storage and compute cost, so this is an operational decision as much as a product one. | Product + IT operations | Before R2 start |
| OQ56 | Should all-rooms results be grouped by room or ranked purely by relevance? Grouping is safer against the wrong-deal error; ranking is faster when the user has forgotten which deal it was. | Product + design partners | Before R2 launch |
| OQ57 | Is a hashed query token sufficient for the zero-result metric, or do we need query text from consenting design partners to tune matching? Storing filenames in analytics would breach the confidentiality stance. | Product + Legal + Data | Before R1 launch |
