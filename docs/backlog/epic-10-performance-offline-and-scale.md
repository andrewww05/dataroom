# Epic E10 — Performance, Offline & Scale

## Purpose

This epic makes a room with 10,000-plus items and files of several gigabytes behave correctly and
feel fast on a mid-range Android phone over a poor 4G link, and be honest whenever it cannot. It
owns the listing contract every other screen consumes (cursor pagination, virtualisation, lazy
thumbnails, prefetch, scroll restoration), the client and server performance budgets and the CI gate
that defends them, the offline read cache and its honest labelling, the storage accounting that E12
presents, and the real-user monitoring that tells us whether any of it worked on real phones. It is
a parallel track that E03, E04, E05 and E06 consume rather than a feature users ask for by name.

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
  [E06 Search & Discovery](./epic-06-search-and-discovery.md),
  [E07 Sharing & Access Control](./epic-07-sharing-and-access-control.md),
  [E08 Conflict Resolution & Data Integrity](./epic-08-conflict-resolution-and-data-integrity.md),
  [E09 Mobile UX Foundations](./epic-09-mobile-ux-foundations.md),
  [E11 Trust, Audit & Notifications](./epic-11-trust-audit-and-notifications.md),
  [E12 Account, Storage & Governance](./epic-12-account-storage-and-governance.md)

## Epic summary

| Field | Value |
| --- | --- |
| Epic ID | E10 |
| Goal | Make a 10,000-item folder and a several-gigabyte file behave correctly and feel fast on the reference device over the reference network, keep the initial route inside a byte and blocking budget enforced by CI, serve previously visited content when the device is offline while never claiming durability the platform cannot give, and measure all of it from real phone sessions. |
| Primary personas | P6 Ray Okonkwo (CRE broker, one bar of LTE in a mechanical room, cracked screen), P2 Dev Raman (Android recipient, 20 to 40 second commuter bursts), P5 Ingrid Sørensen (seed-fund partner, taxi and hotel wifi, zero patience budget), P4 Ashley Kim (transaction coordinator, 10,000-item folders and bulk hygiene), P3 Tomás Ferreira (buy-side CPA triaging on a phone, escalating to desktop) |
| Release span | R1 (stories 01 to 15, 17, 18), R2 (stories 16 and the R2 halves of 05 and 11) |
| Story count | 18 |
| Total points | 102 |
| Depends on | [E09](./epic-09-mobile-ux-foundations.md) for the interaction system (skeletons, offline banner, toasts, safe areas, row geometry). [E01](./epic-01-access-and-identity.md) for a resolved `Subject` on every request so cache keys can be grant-scoped. A real persistence layer replacing the in-memory seed in `documents.service.ts`. |
| Blocks | [E03](./epic-03-folder-hierarchy-and-navigation.md) (the children listing contract), [E05](./epic-05-viewing-preview-and-file-details.md) (thumbnails, streamed preview, memory ceiling), [E06](./epic-06-search-and-discovery.md) (cursor-paged results and offline search honesty), [E04](./epic-04-file-operations.md) (streaming upload and download paths), [E12](./epic-12-account-storage-and-governance.md) (the storage accounting and the administrator-set ceilings it presents) |
| Business rules applied | This epic owns no rule block of its own. It is judged against the enforcement rules BR-121 (the API is the sole enforcement point), BR-122 (the interface is a hint) and BR-134 (the client never caches an authorisation result); the purge-on-refusal rule BR-113; the visibility rule BR-046; the optimistic-rollback rule BR-133 and the typed-error rule BR-132; the offline-queue rules BR-130 and BR-131; the upload rules BR-208, BR-209 and BR-210; and the quota-composition rules BR-197 to BR-200 that its storage accounting must satisfy. |

## Mobile-first design stance

- **The budget is written against a phone a quarter of users are worse than, not a flagship.** The
  reference device is a Samsung Galaxy A24 4G class handset on 9 Mbps down / 3 Mbps up / 100 ms RTT,
  chosen deliberately as a 75th-percentile experience
  ([Alex Russell, The Performance Inequality Gap, 2026](https://infrequently.org/2025/11/performance-inequality-gap-2026/)).
  Two gates exist and every story says which one it is measured against: the **CI gate** uses the
  Lighthouse mobile preset (150 ms RTT, 1,638.4 Kbps down, 750 Kbps up, 4x CPU multiplier,
  [Lighthouse throttling docs](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md))
  as a regression guard, and the **release gate** is p75 mobile field data for LCP <= 2.5 s, INP
  <= 200 ms and CLS <= 0.1 ([web.dev Web Vitals](https://web.dev/articles/vitals)).
- **The desktop file tree is not the mobile navigation model, so pagination is not a nicety.** A
  360 px column cannot show a tree, so the primary model is a virtualised flat child list plus
  breadcrumb drill-down, which means the child list is the one screen that must survive 10,000 rows.
  Row height is fixed at 64 CSS px before any content arrives (48 px of content plus 16 px of
  padding, which clears the 48 dp Android minimum and the 44 pt iOS minimum simultaneously), so a
  late thumbnail cannot shift layout. CLS is scored as the worst five-second burst
  ([web.dev CLS](https://web.dev/articles/cls)), and a list that measures rows lazily is a burst
  generator.
- **Infinite scroll is never the only mechanism.** Hidden navigation and landmark-free streams are
  measured usability losses (NN/g records a >20% drop in content discoverability behind hidden
  navigation and calls infinite scroll "downright harmful" on mobile and for search). The folder
  header therefore always states "1 to 50 of about 10,240", an explicit **Load more** control appears
  after ten auto-loaded pages, sort and search-in-folder are permanently visible, and scroll position
  is restored by key rather than by pixel.
- **Hover, right-click and marquee selection have no touch equivalent, so nothing performance-related
  hides behind them.** Thumbnails load on `IntersectionObserver` intersection, not on hover. The
  per-row overflow button is a real 48 CSS px control in the resting state, so no data is fetched to
  service a hover. Desktop adds larger page sizes, more aggressive prefetch, multi-column virtualised
  grids and a jump-to-letter rail at Medium width and above, where it does not fight the row's own tap
  target.
- **Backgrounding is assumed fatal, and every cache write happens before the risky operation, not
  after.** A frozen page cannot run timers or fetch callbacks, a discarded page cannot run code at
  all, and `unload` does not fire when a tab is closed from the mobile tab switcher
  ([Page Lifecycle API](https://developer.chrome.com/docs/web-platform/page-lifecycle-api)).
  Scroll anchors, resume offsets and queued telemetry are therefore committed on `visibilitychange`
  to hidden and on `pagehide`, and every one of those moments is treated as "we may never run again".
- **Offline is a read cache and the copy says exactly that.** WebKit deletes script-created storage
  for an origin with no user interaction in the last seven days, eviction is all-or-nothing across
  IndexedDB, Cache API and OPFS together, and `navigator.storage.estimate()` is deliberately
  imprecise ([MDN storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria),
  [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)). There is no
  Background Fetch and no Background Sync on iOS, so "uploading in the background" is banned copy and
  the honest state is "Paused, reopen the app to continue".
- **Memory, not bytes, is what kills a phone tab.** A published measurement crashed mobile Safari at
  roughly 100 MB of allocated JavaScript array data on an iPhone SE 3 and roughly 200 MB on an
  8th-generation iPad, with no catchable JavaScript exception
  ([lapcatsoftware, Jan 2026](https://lapcatsoftware.com/articles/2026/1/7.html)). Every file path is
  therefore a stream: `File.slice()` for upload, HTTP range or HLS for media, server-rendered page
  images for documents, and at most one chunk plus one decoded page held at a time.
- **Prefetch is bounded and cellular-aware because the user pays for it.** Prefetching a folder of
  thumbnails on a metered connection spends someone else's money. At most one page request is in
  flight, thumbnail concurrency is capped at six, and the data-saver path degrades to a text-only
  listing rather than silently spending data.
- **Optimistic UI is allowed only where a rollback is visible and safe.** Rename, move, delete,
  restore and view-preference changes are optimistic with a typed rollback. Anything a permission
  decision depends on is never optimistic and is never served from cache: the server is the sole
  source of truth (BR-121 and BR-122), the client never caches an authorisation result (BR-134), and a
  cache key incorporates the grant version so a revocation can never be served from a stale entry, with
  a full purge of the revoked scope on next application start (BR-113).

---

## User stories

### US-E10-01 — Cursor-paginated children listing contract

**As a** platform engineer serving P4 Ashley Kim's 10,000-item `Financials` folder **I want** one
keyset-paginated listing endpoint with an opaque signed cursor **so that** page latency does not grow
with scroll depth and a concurrent upload cannot make a reader skip or repeat a row.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | none |
| Traces to | FR-PERF-001, FR-PERF-002, FR-PERF-003, NFR-PERF-005, NFR-PERF-026, NFR-SCALE-001, NFR-SCALE-016, NFR-SEC-016, BR-046, BR-121 |

**Acceptance criteria**

1. **Given** `GET /api/rooms/:roomId/nodes/:nodeId/children` **when** it is called without a cursor
   **then** it returns at most `limit` rows (default 50, server-capped at 200 per NFR-SCALE-016, with the
   phone client never asking for more than 100), an `approximateTotal`
   read from the denormalised `childCount` column, a `nextCursor` when more rows exist, and
   `hasMore` computed from a `LIMIT :limit + 1` probe rather than a `COUNT(*)`.
2. **Given** the default sort **when** rows are ordered **then** the SQL ordering is
   `kind_rank ASC, name_key ASC, id ASC` and the `id` tie-breaker is present in every supported
   sort (`kind_then_name`, `modified_desc`, `size_desc`, `name_asc`), because a keyset cursor is only
   correct over a total order.
3. **Given** a request for a sort with no covering index **when** it is handled **then** it is
   rejected with `400 UNSUPPORTED_SORT` and the client reverts its sort control to the previous
   value, rather than the server performing a heap scan on a 10,000-row folder.
4. **Given** a cursor **when** it is minted **then** it is `base64url(payload) + "." +
   base64url(hmacSha256(serverKey, payload))` over `{ s, k, n, i, p, v }`, and a cursor the server
   did not mint is rejected with `400 INVALID_CURSOR`; a cursor whose `sortId` disagrees with the
   `sort` parameter returns `400 CURSOR_SORT_MISMATCH`; a cursor whose `parentNodeId` disagrees with
   the path parameter returns `400 CURSOR_SCOPE_MISMATCH` and additionally writes a security event,
   because it can indicate cursor forgery across a scope the caller has no grant on.
5. **Given** a folder with exactly 10,000 active children on the reference dataset **when** page 1
   and page 200 are each requested 20 times **then** the p95 server time for page 200 is within 20%
   of the p95 for page 1, proving the cost is a constant-cost index seek and not offset walking
   (verified by the harness in US-E10-18, reported as M45).
6. **Given** a client that includes `include=breadcrumb,capabilities` **when** the response is built
   **then** the ancestor trail is resolved in one query using the ids parsed from the node's
   materialised `path`, with no recursive CTE and no N+1, and the breadcrumb arrives in the same
   response as the first page so the sticky breadcrumb is present in the first paint.
7. **Given** 11 files are uploaded by P4 while P3 is paging **when** P3 fetches the next page
   **then** no row already returned is returned again and no pre-existing row is skipped; newly
   created rows may appear, and the client shows a "3 new items" pill rather than silently reordering
   under the thumb.
8. **Given** the requesting device reports a viewport height **when** the first page is sized **then**
   the server honours a client-provided `limit` between 20 and 200 chosen to fill approximately 1.5
   viewport heights, and a missing or invalid hint falls back to 50 rather than erroring.
9. **Given** any caller **when** the listing is authorised **then** the grant is evaluated
   server-side per request and a caller with no grant on the node receives `404 NOT_FOUND` with no
   discriminating detail and the same timing envelope as a real 404.

**Mobile acceptance criteria**

- On a 360 x 640 viewport the first page response is <= 20 KB gzipped for 50 rows (about 320 bytes of
  JSON per row), verified with a response-size assertion in the API test suite; a payload over 24 KB
  fails the test.
- Time to first byte for the listing API is <= 0.8 s at p75 (NFR-PERF-005), and on the CI throttling
  profile (150 ms RTT, 1,638.4 Kbps down) the first page arrives within 800 ms of request start at p75
  for a 50-row page, measured as server timing plus transfer.
- No thumbnail, preview URL or file byte is included in a listing payload; a row carries name, kind,
  size, modified, `etag`, capability flags and a thumbnail *availability* boolean only.
- With the software keyboard open (search-in-folder focused) the listing request is unaffected: the
  page size is computed from the pre-keyboard `visualViewport.height` so the keyboard opening does not
  trigger a second, differently-sized fetch.
- On a flaky 4G link a request that fails with a network error is retried once with 250 ms of jitter,
  and a second failure surfaces the offline or degraded banner from
  [E09](./epic-09-mobile-ux-foundations.md) rather than an empty folder.

**Edge cases & negative paths**

- Cursor older than 24 hours: still accepted. It is a position, not a snapshot. No snapshot isolation
  is implemented across pages and this is deliberate.
- Anchor row deleted between pages: paging continues from the next key in order. No error is shown for
  this case; the "3 new items" pill and pull-to-refresh are the honest recovery.
- `INVALID_CURSOR`: user sees "We lost your place in this folder." The client silently refetches page
  1 and shows a one-line "back to the top of this folder" notice.
- `CURSOR_SORT_MISMATCH` and `CURSOR_SCOPE_MISMATCH` are never shown to a user. They are client bugs
  or attacks: discard the cursor, refetch page 1, report to telemetry, and in the scope case raise a
  security event visible in [E11](./epic-11-trust-audit-and-notifications.md).
- Node is a file, not a folder: `400 VALIDATION_FAILED` naming the parameter, not a silent empty page.
- Room archived: listing still succeeds (read is permitted); mutation affordances are absent and the
  header carries the "Archived, read-only" chip.

---

### US-E10-02 — Virtualised folder list that survives 10,000 items

**As a** P4 Ashley Kim opening a mandate folder holding every bank statement for three years **I
want** the list to scroll smoothly and let me select an item at any depth **so that** a large room is
usable from a phone instead of being the reason I wait until I am at a desk.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E10-01 |
| Traces to | FR-PERF-004, FR-PERF-005, FR-PERF-019, FR-MOB-016, FR-MOB-028, NFR-PERF-002, NFR-PERF-022, NFR-PERF-023, NFR-PERF-024, NFR-SCALE-001, NFR-A11Y-002, NFR-A11Y-017 |

**Acceptance criteria**

1. **Given** any list that can exceed one screen of data **when** it renders **then** it is
   virtualised, and the count of mounted row elements is bounded at approximately three pages (about
   150 rows) regardless of whether the folder holds 60 items or 10,000, asserted by a DOM-node-count
   test at 200 and at 10,000 items. The supported ceiling is 10,000 children with a hard cap of 50,000
   per NFR-SCALE-001; above 10,000 the folder header recommends subfoldering rather than silently
   degrading.
2. **Given** a row **when** it is measured **then** its height is a fixed 64 CSS px declared in CSS
   before content arrives, total scroll height is computed as `approximateTotal x 64`, and the
   scrollbar thumb does not resize or jump as pages load.
3. **Given** a scroll gesture on the reference device in a 10,000-item folder **when** the list is
   scrolled continuously for 10 seconds **then** no single main-thread task exceeds 50 ms, verified
   from a Performance trace with `PerformanceLongTaskTiming`, and directory-load work yields using
   `scheduler.yield()` where available with an `isInputPending`-driven fallback.
4. **Given** selection mode is toggled in a 10,000-item folder **when** the user long-presses a row
   **then** the p75 INP for that interaction is <= 200 ms on the reference device under the CI
   throttling profile, and selection state is held in a map keyed by node id rather than by row index
   so recycling a row cannot move a checkmark to the wrong file.
5. **Given** rows are recycled **when** a row scrolls out of the retained window **then** its
   thumbnail request is cancelled (US-E10-06) and its DOM node is reused, so heap growth over a
   full 10,000-row scroll is under 20 MB, inside the 60 MB peak-heap ceiling of NFR-PERF-024, measured
   by `performance.measureUserAgentSpecificMemory()`
   where available and by a DevTools heap snapshot delta otherwise.
6. **Given** the list is scrolled to the tail **when** the last loaded index is within 15 rows of the
   loaded tail **then** exactly one next-page request is issued and no second request is issued until
   it settles.
7. **Given** a screen reader is active **when** the user swipes through rows **then** the list
   exposes `role="grid"` with `aria-rowcount` set to `approximateTotal` and each row carries
   `aria-rowindex`, so a virtualised window does not report "list, 50 items" for a 10,000-item folder.
8. **Given** the tiles/grid view at compact width **when** it virtualises **then** it uses a fixed
   cell height and a two-column layout at 360 px, with the same bounded mounted-cell count and the
   same 50 ms task rule.

**Mobile acceptance criteria**

- Every row's primary tap target is at least 48 CSS px tall with 8 CSS px of separation from the
  trailing overflow button, and the overflow button itself is at least 48 x 48 CSS px, so the row and
  its secondary control never compete for the same thumb (the documented index-versus-disclosure
  failure mode).
- At 360 x 640 the list shows at least 8 complete rows plus the sticky header and the bottom action
  bar, with the bottom bar padded by `env(safe-area-inset-bottom)`.
- At 200% text size a row grows or wraps to two lines rather than clipping, and the overflow button
  stays fully on screen and fully tappable (SC 1.4.4, SC 2.5.8).
- With one thumb on a 360 px device the user can scroll from item 1 to item 10,000 using flicks only;
  no pinch, no two-finger gesture and no horizontal scroll is required at any point (SC 1.4.10,
  SC 2.5.1).
- Rotating to landscape on a phone (compact height) keeps the list usable with the sticky header
  collapsed to one line; the layout does not switch to a two-pane split, because a landscape phone can
  be medium width and compact height.
- Backgrounding the app mid-scroll and returning restores the same visual position per US-E10-07,
  with no blank frame longer than one animation frame after the app shell paints.

**Edge cases & negative paths**

- Folder with exactly 0 children: the empty state from [E03](./epic-03-folder-hierarchy-and-navigation.md)
  renders instead of an empty virtual scroller with a 0 px height container.
- Folder with 1 child: no virtualisation overhead is visible and the container height matches the row.
- `approximateTotal` disagrees with the number of rows actually paged (a counter drift): the scroll
  height re-anchors on the last page without a visible jump, and the header switches from "about
  10,240" to the exact count once the tail is reached.
- Extremely long filename (255 characters): the name truncates in the middle with an ellipsis so the
  extension stays visible, and the full name is available in the details sheet and in the accessible
  name.
- A device with `prefers-reduced-motion`: scroll-anchoring animations are removed, position changes
  are instant, and the 50 ms task rule still holds.

---

### US-E10-03 — Skeleton-first folder screen with no layout shift

**As a** P5 Ingrid Sørensen opening a link in a taxi **I want** the screen to show me where I am
immediately **so that** I know the app is working before the data arrives instead of staring at a
white rectangle and deciding to pass.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E10-01 |
| Traces to | FR-PERF-024, FR-MOB-020, NFR-PERF-003, NFR-PERF-006, NFR-PERF-009, NFR-A11Y-011 |

**Acceptance criteria**

1. **Given** navigation to a folder route **when** the listing response has not arrived within 200 ms
   **then** the screen paints the app shell, the sticky breadcrumb (from cached ancestor data or the
   route parameters), the folder header and skeleton rows.
2. **Given** skeleton rows **when** they render **then** each is exactly 64 CSS px tall with the same
   internal geometry as a real row, so replacing a skeleton with real content produces a measured CLS
   contribution of 0 for that region.
3. **Given** the folder screen on the reference device under the CI throttling profile **when** it is
   measured in Lighthouse **then** FCP is <= 1.8 s and LCP is <= 2.5 s, with the LCP element being the
   first row block or the folder title rather than a late-arriving thumbnail.
4. **Given** the response arrives **when** skeletons are replaced **then** no scroll position change
   occurs and the total CLS for the route is <= 0.1 at p75 in field data.
5. **Given** a screen reader is active **when** skeletons are shown **then** a single polite live
   region announces "Loading folder contents" once, and the skeleton rows themselves are
   `aria-hidden` so the reader does not enumerate placeholder rows (SC 4.1.3).
6. **Given** the response fails **when** the error is typed **then** the skeleton is replaced by an
   inline error state with a Retry button that is at least 48 CSS px tall, not by an indefinite
   skeleton, and the error copy is the mobile message from the error catalogue.
7. **Given** the same folder is opened again within the cache freshness window **when** it renders
   **then** the cached listing paints immediately with no skeleton, and a revalidation runs in the
   background per US-E10-08.

**Mobile acceptance criteria**

- At 360 x 640 the skeleton fills the viewport with 8 rows so the screen never looks empty; a single
  centred spinner is a defect.
- The breadcrumb is present in the first paint and does not change height when the real name arrives;
  a name longer than the available width collapses to a tappable path chip rather than wrapping.
- No skeleton animation runs when `prefers-reduced-motion: reduce` is set; a static tint is used
  instead.
- On a 4G link that stalls entirely (request pending beyond 10 s) the skeleton is replaced by the
  degraded-connection state and a Retry, and the pending request is aborted so it cannot resolve into
  a screen the user has left.

**Edge cases & negative paths**

- Deep link into a folder with no cached ancestors: the breadcrumb shows the room name plus an
  ellipsis chip, and resolves to the full trail when the response lands, without changing height.
- App launched offline directly into a folder route: the cached listing is used if present, otherwise
  the offline empty state from US-E10-15 explains exactly what is available.
- Route changed while the request is in flight: the request is aborted (US-E10-08) and the skeleton is
  never replaced on the abandoned screen.

---

### US-E10-04 — Landmarks in a long list: counts, load more, and new-item pill

**As a** P3 Tomás Ferreira checking whether the AR ageing has been uploaded yet **I want** to know
where I am in a long folder and to be told when new items arrive **so that** I can answer a business
question in fifteen seconds instead of scrolling into an unmarked stream.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E10-01, US-E10-02 |
| Traces to | FR-MOB-016, FR-PERF-002, NFR-PERF-010, NFR-A11Y-009, NFR-A11Y-011, NFR-MOB-032 |

**Acceptance criteria**

1. **Given** a folder listing **when** the sticky header renders **then** it shows the visible range
   and the approximate total in the form "1 to 50 of about 10,240 items", updating as the user scrolls,
   with "about" omitted once the exact count is known.
2. **Given** ten pages have auto-loaded on scroll **when** the eleventh page is due **then**
   auto-loading stops and an explicit "Load more" button appears at the tail, at least 48 CSS px tall,
   and auto-loading resumes for another ten pages after it is tapped.
3. **Given** the list is refreshed by pull-to-refresh **when** new items exist above the current
   position **then** a "3 new items" pill appears below the sticky header, tapping it scrolls to the
   first new item, and the list never reorders under the user's thumb without that explicit tap.
4. **Given** the sticky header **when** the user scrolls **then** the sort control and the
   search-in-folder affordance remain visible at all times at compact width, because search is the
   touch substitute for type-to-jump in a list.
5. **Given** a screen reader **when** the range changes by a full page **then** the change is
   announced once through a polite live region ("showing 101 to 150 of about 10,240"), not on every
   scroll frame.
6. **Given** a folder with fewer than 51 items **when** it renders **then** no "Load more" control and
   no range indicator with "about" appear; the header shows the exact count ("24 items").
7. **Given** the user has scrolled 40 pages deep **when** they tap the breadcrumb to go up and then
   return **then** the range indicator and the loaded window are restored per US-E10-07 rather than
   restarting at page 1.

**Mobile acceptance criteria**

- The header occupies at most 88 CSS px at compact width including the range line, and collapses the
  range line first when the software keyboard opens.
- The "Load more" control sits above the bottom action bar with at least 8 CSS px of separation and is
  never covered by the safe-area inset or the upload progress bar.
- At 200% text size the range line truncates to "1-50 of ~10,240" rather than wrapping to three lines
  or clipping the sort control.
- The "new items" pill is dismissible by tap and auto-dismisses after 10 seconds; it never covers the
  first row's tap target while visible.
- With a screen reader on, "Load more" has an accessible name containing its visible label, so voice
  control ("tap Load more") works (SC 2.5.3).

**Edge cases & negative paths**

- 500 new items arrive while the user is reading: the pill caps its number at "99+ new items" and the
  refresh is still a single request for page 1.
- Items removed rather than added: the pill does not appear; the affected rows disappear on the next
  successful revalidation and a one-line inline notice explains "2 items were moved or deleted" if the
  user's anchor row was among them.
- Load more tapped while offline: the button shows "Offline, cannot load more" inline and remains
  tappable for retry; nothing is silently discarded.

---

### US-E10-05 — Bounded, cellular-aware prefetch and the data-saver path

**As a** P2 Dev Raman on a metered Android data plan **I want** the app to feel fast without spending my
data allowance behind my back **so that** I keep using it instead of uninstalling it after a bill.

| | |
|---|---|
| Priority | Should |
| Release | R1 (prefetch), R2 (data saver) |
| Estimate | 5 |
| Depends on | US-E10-01, US-E10-02 |
| Traces to | FR-PERF-007, FR-PERF-026, FR-PERF-006, NFR-PERF-010, NFR-PERF-027, NFR-PERF-030, NFR-MOB-016, NFR-MOB-017 |

**Acceptance criteria**

1. **Given** a listing **when** the last rendered row index is within 15 rows of the loaded tail
   **then** the next page is prefetched, and at most one prefetch request is in flight per list at any
   time.
2. **Given** the client can read `navigator.connection` **when** `effectiveType` is `2g` or `slow-2g`,
   or `saveData` is true **then** page prefetch is disabled entirely and pages load only on explicit
   scroll arrival or a "Load more" tap.
3. **Given** the user opens a folder **when** prefetch decides what else to warm **then** it may warm
   at most the next page of the current list and the child listing of at most one folder the user is
   hovering on with a fine pointer; it never walks the tree speculatively and never prefetches file
   bytes.
4. **Given** the user navigates away from a list **when** a prefetch is in flight **then** it is
   aborted (US-E10-08) and its result is discarded rather than written to cache for a screen the user
   left.
5. **Given** data saving is enabled by the user in settings or reported by the platform **when** a
   listing renders **then** thumbnails are not requested at all, a type glyph is shown in their place,
   and a one-line explanatory chip states "Data saver on, thumbnails off" with a control to turn it
   off.
6. **Given** prefetch is enabled **when** measured over a 10-minute realistic session on the reference
   device **then** total prefetched bytes that were never displayed do not exceed 15% of total
   transferred bytes for that session, asserted in the performance harness.
7. **Given** the account is on a metered connection **when** an offline pin is requested (US-E10-16)
   **then** the pin download is deferred with an explicit "Will download on Wi-Fi" state and a manual
   "Download now on cellular" override, so the user chooses to spend the data.

**Mobile acceptance criteria**

- On a 360 px viewport the data-saver chip occupies one line, is dismissible for the session, and never
  covers the first row.
- With prefetch enabled, the next page is painted within 600 ms at p95 of the scroll threshold being
  crossed (NFR-PERF-010), with a skeleton visible in the meantime.
- Switching from Wi-Fi to cellular mid-session takes effect on the next request without a reload; the
  change is reflected in the chip within 2 seconds of the `change` event on `navigator.connection`.
- The prefetch behaviour is identical in a browser tab and in an installed PWA; nothing about prefetch
  depends on installation.
- With a screen reader on, turning data saver on or off announces the new state once as a status
  message, and does not move focus.

**Edge cases & negative paths**

- `navigator.connection` unavailable (Safari): treat `effectiveType` as unknown, keep prefetch enabled
  at the bounded default, and rely on the user-set data-saver toggle. Never guess a connection class
  from timing alone and never label a session "cellular" without evidence.
- Prefetch response arrives after a mutation invalidated the list: the response is dropped, not merged,
  because the cache generation token no longer matches (US-E10-08).
- User toggles data saver while 6 thumbnail requests are in flight: all are aborted immediately and
  the glyphs replace them without a layout shift.

---

### US-E10-06 — Lazy thumbnails with reserved boxes and hard cancellation

**As a** P1 Marcy Doyle scanning a folder of photographed documents **I want** thumbnails to appear as
I reach them and never to shift the row I am about to tap **so that** I do not mis-tap and open the
wrong buyer's file.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E10-02 |
| Traces to | FR-PERF-006, FR-PERF-017, FR-VIEW-006, FR-MOB-020, NFR-PERF-003, NFR-PERF-027, NFR-SEC-014, NFR-SEC-015, BR-135 |

**Acceptance criteria**

1. **Given** a row with a thumbnail-capable file **when** the row mounts **then** a fixed 40 x 40
   CSS px thumbnail box is reserved immediately and the image is requested only when the row
   intersects an `IntersectionObserver` with a 200 px root margin.
2. **Given** thumbnail requests **when** several rows intersect at once **then** at most 6 requests
   are in flight per list, queued in visual order, with rows nearest the viewport centre served first.
3. **Given** a row scrolls more than 200 px outside the viewport **when** its thumbnail request has not
   completed **then** the request is aborted via `AbortController` and removed from the queue, verified
   by asserting the count of pending requests after a fast scroll from row 1 to row 5,000 is <= 6.
4. **Given** the client sends `Accept: image/avif,image/webp` **when** the server responds **then** it
   serves a modern format where advertised and falls back automatically otherwise, and the response
   carries `Cache-Control: private, max-age=86400` with an `ETag`.
5. **Given** a thumbnail is unavailable, still rendering (`202`) or errors **when** the row renders
   **then** a file-type glyph is shown in the reserved box, the row remains fully interactive, and no
   retry storm occurs (at most one retry after 5 seconds for a `202`, then the glyph stays).
6. **Given** thumbnails arrive **when** they are painted **then** the measured CLS contribution from
   the list region is 0, because the box was reserved before the request.
7. **Given** a read-only recipient with `canDownload: false` **when** thumbnails are served **then**
   the thumbnail endpoint enforces the same server-side grant check as the content endpoint, and a
   revoked share returns `403 SHARE_REVOKED` for thumbnails as well as for bytes, so an image preview
   is never a hole in read-only enforcement.

**Mobile acceptance criteria**

- Thumbnail transferred size is <= 20 KiB at list density and <= 45 KiB at tile density per
  NFR-PERF-027; the server caps the rendered dimension
  at `40 x min(devicePixelRatio, 2)`.
- Scrolling 2,000 rows on the reference device over the CI throttling profile produces no long task
  over 50 ms attributable to image decode, verified by trace.
- On a 360 px viewport the thumbnail never pushes the filename into a second line at default text size,
  and at 200% text size the thumbnail box shrinks to 32 px rather than the name clipping.
- In tiles view at compact width, cells reserve a fixed 1:1 image area and use the same cancellation
  rules; a folder of 300 photos does not exceed the six-concurrent cap.
- With data saver on (US-E10-05) no thumbnail request is made at all.

**Edge cases & negative paths**

- HEIC source from an iPhone: the server normalises to a web format for the thumbnail; the client never
  infers type from the extension, because Safari can hand the page a HEIC file when `image/heic` is in
  `accept`.
- A file whose thumbnail render fails permanently: the server returns `404` for the thumbnail and the
  glyph is permanent; the failure is recorded server-side and never blocks the row.
- 10,000 rows of images scrolled at maximum speed: heap growth stays under the US-E10-02 budget because
  decoded images for recycled rows are released and no `Blob` URLs are retained.
- Thumbnail served from cache after a share revocation: impossible by construction, because the cache
  key includes the grant version (BR-134) and revocation bumps it, and BR-113 purges the revoked scope.

---

### US-E10-07 — Place restoration across navigation, freeze and discard

**As a** P2 Dev Raman doing six interrupted 40-second sessions on a train **I want** to come back to
exactly where I was **so that** my interrupted sessions add up to one real review instead of six
restarts.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E10-01, US-E10-02 |
| Traces to | FR-PERF-014, FR-FLDR-026, FR-PERF-009, NFR-MOB-027, NFR-MOB-028, NFR-MOB-029, NFR-PERF-002 |

**Acceptance criteria**

1. **Given** a scrolled list **when** the user navigates into a child folder, opens a preview, opens a
   sheet, or backgrounds the app **then** the client persists
   `{ routeKey, cursorOfFirstVisibleRow, nodeIdOfFirstVisibleRow, pixelOffsetWithinRow, sortId,
   loadedPageCount }` to IndexedDB, and it does so on `visibilitychange` to hidden and on `pagehide`,
   not on an interval.
2. **Given** the user returns to the list **when** it re-renders **then** the anchor is resolved by
   **key** (the stored node id, falling back to the stored cursor) and not by pixel offset, and the
   restored first visible row is the same file the user was looking at.
3. **Given** the anchor row has been moved or deleted while away **when** restoration runs **then**
   the list lands on the nearest following key and shows a dismissible inline notice: "The item you
   were viewing was moved or deleted."
4. **Given** the tab was discarded by the OS **when** the app is reopened from the tab switcher or the
   home screen **then** restoration uses the persisted anchor, because `unload` does not fire when a
   tab is closed from the mobile tab switcher and no in-memory state survives.
5. **Given** a full-screen document preview **when** the user leaves and returns within the retention
   window **then** the page number and scroll offset inside the document are restored as well as the
   list position behind it (page-level restore is verified with a 200-page PDF).
6. **Given** restoration **when** it occurs **then** it does not refetch every previously loaded page:
   the anchor page is fetched, plus one page either side, and further pages load on scroll.
7. **Given** the browser's own scroll restoration **when** the app initialises **then**
   `history.scrollRestoration` is set to `manual`, so the app's key-based restoration is the only
   mechanism and the two do not fight.
8. **Given** restoration data older than 7 days **when** the app starts **then** it is discarded, so a
   stale anchor cannot send a user to a position in a folder they no longer recognise.

**Mobile acceptance criteria**

- On the reference device, returning from a preview to a list scrolled to row 4,300 paints the restored
  position within 400 ms of the route transition, to within +/- 40 px of the previous offset
  (NFR-MOB-029), with no visible jump after the first paint.
- Restoration works identically in a browser tab and in an installed PWA on both iOS and Android, and
  is verified with the app force-quit between the two halves of the test.
- Android system back (button or edge gesture) and the in-app Back affordance both restore the same
  position; a preview, a sheet and selection mode are each a popable history entry, so predictive back
  animates to a sane place.
- When the software keyboard is open at the moment of backgrounding, the restored view accounts for the
  keyboard being closed on return: the anchor row is visible, not scrolled under a phantom inset.
- With a screen reader on, restoration moves focus to the anchor row and announces its name once,
  rather than dumping focus at the top of the document.

**Edge cases & negative paths**

- IndexedDB unavailable or full: restoration degrades to top-of-list, and the failure is recorded in
  telemetry; the user is never shown a storage error for a scroll position.
- Sort changed while away: the stored `sortId` no longer matches, so the list restarts at the top and a
  one-line notice says "Sort changed, showing from the top."
- The whole origin's storage was evicted (7-day rule): restoration silently falls back to top-of-list;
  no claim about persistence is displayed.
- Two tabs open on the same folder: the last-written anchor wins per route key; this is acceptable and
  documented, not a bug to fix in R1.

---

### US-E10-08 — Request cancellation, cache generations and post-mutation freshness

**As a** P1 Marcy Doyle renaming a file and immediately backing out to the folder list **I want** the
list to show the new name **so that** I never doubt whether my change was saved.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E10-01 |
| Traces to | FR-PERF-015, FR-PERF-016, FR-PERF-008, NFR-PERF-026, NFR-SEC-012, NFR-SEC-015, BR-113, BR-121, BR-134 |

**Acceptance criteria**

1. **Given** any screen with in-flight requests **when** the user navigates away **then** every request
   belonging to that screen is aborted via a per-screen `AbortController`, and no aborted response is
   written to any cache.
2. **Given** a successful mutation (create, rename, move, copy, delete, restore, share change) **when**
   the response commits **then** every cached listing whose scope includes the affected parent, the old
   parent and the new parent is invalidated immediately, so a back navigation never shows a stale item.
3. **Given** cache entries **when** they are keyed **then** the key includes `roomId`, `nodeId`,
   `sortId`, the client cache-schema version, and the **grant version** for the requesting subject, so
   a permission change or revocation cannot be served from a stale entry (BR-134).
4. **Given** a share is revoked for a principal **when** that principal's client next reads any cached
   listing or preview **then** the grant version mismatch forces a network revalidation, the server
   refuses every subsequent request within 5 seconds of the revocation committing (NFR-SEC-012, BR-108),
   the response (`403 SHARE_REVOKED`) replaces the cached content with the revoked full-screen state, and
   the cached listings, thumbnails, preview pages and pinned files for that scope are purged on next
   application start (BR-113).
5. **Given** a mutation fails **when** the failure is typed **then** the invalidation is not applied,
   the optimistic change is rolled back per US-E10-09, and the previously cached listing remains valid.
6. **Given** revalidation **when** a cached listing is displayed **then** a conditional request using
   the stored `ETag` is sent, a `304` keeps the cached body and refreshes its freshness stamp, and a
   `200` replaces it without changing scroll position.
7. **Given** any resource a permission decision depends on **when** the client considers using cache
   **then** it does not: room capability payloads, node `access` payloads and share state are always
   fetched from the server and are never served from the offline cache (BR-121, BR-134).

**Mobile acceptance criteria**

- Backing out of a rename sheet on a 360 px screen shows the new name in the list within 300 ms on the
  reference device, without a visible list reload or scroll jump.
- On a flaky connection where the mutation response is slow, the optimistic row shows a subtle
  in-progress indicator inside the row (not a blocking spinner over the list), and the row stays
  tappable.
- Aborting requests on navigation is observable: the network panel shows zero pending requests for the
  abandoned route within 100 ms of the transition.
- With a screen reader on, a completed mutation announces its outcome once through the toast live region
  ("Renamed to Lease 2025.pdf"), and focus stays on the row.

**Edge cases & negative paths**

- Mutation succeeds server-side but the response is lost to a dropped connection: the idempotency key
  makes a retry safe, the retry returns the original result, and the client reconciles without creating
  a duplicate (see [E08](./epic-08-conflict-resolution-and-data-integrity.md)).
- Cache schema version bump on app update: all cached listings are dropped on first run of the new
  version rather than being migrated, and the drop is silent.
- A cached preview exists for a file whose share was revoked while the device was offline: on
  reconnection the grant-version check fails and the cached preview is purged before it can be shown.
  While still offline, the app shows "Access to this file must be re-checked online" instead of the
  cached page.

---

### US-E10-09 — Optimistic UI with a visible, typed rollback

**As a** P1 Marcy Doyle moving a file in a car park on one bar **I want** the change to appear
instantly and to be told plainly if it did not stick **so that** I never drive away believing
something happened that did not.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E10-08 |
| Traces to | FR-PERF-008, FR-SHARE-018, FR-MOB-021, NFR-PERF-028, NFR-AVAIL-009, NFR-A11Y-011, BR-130, BR-131, BR-132, BR-133 |

**Acceptance criteria**

1. **Given** rename, move, delete, restore, pin and view-preference changes **when** the user commits
   one **then** the client reflects it within 100 ms of the tap, before the server responds, reconciling
   or rolling back within 400 ms of the response (NFR-PERF-028), and shows a toast with
   the outcome and, where the action is reversible, an Undo control.
2. **Given** an optimistic change **when** the server rejects it **then** the client reverts the exact
   change (not a full refetch of the screen), keeps the user's scroll position, and shows the typed
   mobile message from the error catalogue: `412 STALE_VERSION` becomes "Someone changed this while you
   were looking. Reload to see the latest.", `409 NAME_CONFLICT` opens the conflict sheet,
   `403 READ_ONLY_SHARE` becomes "You have view-only access to this room."
3. **Given** a rejection **when** the revert happens **then** any dependent optimistic changes queued
   behind it are also reverted, in reverse order, and the user sees one consolidated message rather than
   a stack of toasts.
4. **Given** a permission or sharing change **when** the user commits it **then** it is **never**
   optimistic: the affordance shows a pending state until the server confirms, because a share that
   appears revoked but is not is a security defect (BR-121).
5. **Given** a quota-related refusal (`507 STORAGE_QUOTA_EXCEEDED`) **when** an upload was optimistically
   shown in the list **then** the placeholder row is removed, the item stays visible in the upload tray
   as blocked rather than being discarded, and the message is "You are out of storage (10 GB of 10 GB
   used). Nothing was lost." (see [E12](./epic-12-account-storage-and-governance.md)).
6. **Given** an optimistic delete **when** the undo window (10 seconds) is still open **then** Undo
   restores the row without a server round trip if the delete has not yet been sent, and issues a
   restore call if it has; either way the row returns to its original position in the sort order.
7. **Given** the device goes offline mid-commit **when** the mutation cannot be sent **then** the change
   is queued by [E08](./epic-08-conflict-resolution-and-data-integrity.md)'s offline mutation queue, the
   row shows a "waiting to sync" indicator, and the copy never says "saved".
8. **Given** telemetry **when** any optimistic change is reverted **then** an event records the action,
   the error code and the device class, so the revert rate is a monitored number rather than an
   anecdote.

**Mobile acceptance criteria**

- The Undo toast sits above the bottom action bar plus `env(safe-area-inset-bottom)`, is at least 48
  CSS px tall in its tappable region, and never covers the row it refers to (SC 2.4.11).
- On a 360 x 640 viewport the toast text wraps to at most two lines at 200% text size and the Undo
  control stays fully visible.
- A revert announces itself once through an assertive live region, because the user needs to know their
  action did not take effect (SC 4.1.3).
- Backgrounding the app during the undo window commits the pending mutation immediately on
  `visibilitychange` to hidden rather than losing it, and the toast does not reappear on return.
- Haptic feedback fires on a failed action where the platform exposes vibration, respecting
  `prefers-reduced-motion` and the OS setting.

**Edge cases & negative paths**

- Two rapid optimistic renames of the same node: the second is queued behind the first and both carry
  `If-Match`; a `412` on the second reverts only the second.
- Undo tapped after the row has been recycled out of the DOM: the restore still applies and the list
  scrolls to the restored row with a brief highlight.
- Server returns `428 IF_MATCH_REQUIRED`: never shown to the user. It is a client bug, fails the CI
  contract test, and is reported to telemetry.
- Optimistic move into a folder the user turns out not to have `contributor` on: reverted with
  "You do not have permission to do that." and the destination picker refetches capabilities, because
  the UI was out of date.

---

### US-E10-10 — Initial-route byte and blocking budget, enforced by CI

**As a** engineering lead defending the mobile claim **I want** a pull request that pushes the initial
route over budget to fail **so that** performance is a gate rather than a quarterly clean-up project.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | none |
| Traces to | FR-PERF-018, FR-PERF-019, NFR-PERF-019, NFR-PERF-020, NFR-PERF-021, NFR-PERF-022, NFR-OBS-014, NFR-MAINT-008 |

**Acceptance criteria**

1. **Given** the `apps/web` build **when** CI runs **then** it measures the transferred bytes and the
   JavaScript bytes of each of the six key routes (workspace home, room home, folder, preview,
   share-recipient entry, account) and fails the pull request when any route exceeds its budget.
2. **Given** the budgets **when** they are set **then** the initial route (share-recipient entry) is
   capped at **900 KiB total transferred and 300 KiB JavaScript** (NFR-PERF-021), the app shell plus
   Rooms home at **600 KiB total / 250 KiB JavaScript** (NFR-PERF-019), and no single lazily loaded route
   chunk exceeds **120 KiB** compressed, with the preview engine exempt up to **400 KiB** and forbidden
   from the initial graph (NFR-PERF-020). Rationale, labelled as reasoning: the published 3-second
   interactive budget for the reference device is 1.2 MiB total / 0.62 MiB JS for a JS-heavy page, and
   the median mobile page (2.56 MB / 697 KB JS) already fails it, so the budget is set well below the
   median rather than at it.
3. **Given** a Lighthouse run under the CI mobile preset **when** it completes **then** Total Blocking
   Time <= 300 ms and no single long task exceeds 200 ms on the folder route; TBT is used as the
   sanctioned lab proxy for INP.
4. **Given** the CI report **when** a budget is exceeded **then** the failure names the route, the
   budget, the actual value, the delta, and the three largest contributing modules, so the author can
   act without asking anyone.
5. **Given** a legitimate budget increase **when** it is needed **then** the budget file change is a
   reviewable diff in the repository requiring an explicit approval, and the pull request description
   must state the user-visible benefit bought with the bytes.
6. **Given** dependencies **when** they are added **then** CI reports the added transfer size of the
   dependency on the affected routes in the pull request comment, whether or not the budget is
   breached.
7. **Given** the CI gate **when** it is calibrated **then** it uses simulated Lighthouse throttling for
   speed with a documented note that CPU throttling is relative to the host, and a nightly job runs the
   same routes on a real reference-class device (or the calibrated DevTools preset) so a drifting CI
   host cannot mask a regression.
8. **Given** the release process **when** a release is cut **then** the release gate is p75 mobile field
   data (US-E10-12), and a green CI run alone never constitutes acceptance.

**Mobile acceptance criteria**

- The share-recipient entry route is interactive on the reference device within 3 seconds on the CI
  preset, verified as Lighthouse Time to Interactive plus a manual tap test on a real device.
- Fonts are subset and self-hosted with `font-display: swap`; no route requests more than two font
  files, and no font blocks first paint.
- The folder route ships no polyfill that is not required by a supported browser, and no
  drag-and-drop touch polyfill is loaded at compact width, because the touch move flow is
  "Move to..." rather than dragging (SC 2.5.7).
- Route-level code splitting means opening the account screen or the analytics screen does not load
  their JavaScript on the folder route; verified by asserting the module graph per route in CI.
- Every image in the app shell is served in a modern format with explicit `width` and `height`, so no
  shell asset contributes to CLS.

**Edge cases & negative paths**

- CI host slower than usual, causing a marginal TBT failure: the gate reruns once automatically; two
  consecutive failures block, and the flake is recorded so the threshold can be examined rather than
  quietly widened.
- A vendor dependency ships a size regression in a patch release: the gate catches it and the fix is to
  pin or replace, not to raise the budget.
- Third-party analytics or a session-replay script is proposed: it is evaluated against the budget like
  any other bytes, and a script that cannot fit is not shipped. There is no budget exemption for
  measurement tooling.

---

### US-E10-11 — Cold start, warm start and the app shell

**As a** P1 Marcy Doyle opening the app between two site visits **I want** it to be usable almost
immediately **so that** a 90-second window is enough to do the job.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E10-10 |
| Traces to | FR-PERF-024, FR-PERF-018, NFR-PERF-007, NFR-PERF-008, NFR-MOB-009, NFR-MOB-010, NFR-MOB-026, NFR-MOB-027, NFR-COMPAT-001 |

**Acceptance criteria**

1. **Given** a cold start (no service worker cache, no warm connection) on the reference device under
   the CI preset **when** the app is opened at the workspace home **then** FCP <= 1.8 s
   (NFR-PERF-006) and the app is interactive within 3.0 s at p75 with a hard ceiling of 5.0 s
   (NFR-PERF-007).
2. **Given** a warm start (service worker installed, app shell cached) **when** the app is opened
   **then** the app is interactive on the last-viewed route within 1.2 s at p75 on the reference device
   (NFR-PERF-008), measured on device with the CI preset applied.
3. **Given** the service worker **when** it is designed **then** it caches only the app shell (HTML
   entry, JS, CSS, fonts, icons) with a versioned cache name and a cache-first strategy, and it never
   caches room content, listings, previews or file bytes at the HTTP layer, because room content is
   `Cache-Control: private, no-store` and the offline read cache is an explicit, grant-keyed store
   (US-E10-15).
4. **Given** a new deployment **when** the user next opens the app **then** the new shell is fetched in
   the background, and the update is applied on the next navigation with a non-blocking "Updated"
   indication; the app never reloads under the user's thumb mid-task.
5. **Given** the service worker lifetime **when** work is scheduled in it **then** no logic assumes more
   than 30 seconds of guaranteed runtime and no single event handler runs longer than 30 seconds
   (Assumption: 30 s is the engineering figure derived from Chrome's documented extension
   service-worker idle termination and Firefox's roughly 1-minute idle timeout; no equivalent
   web-platform guarantee is published for page service workers, so nothing load-bearing depends on it).
6. **Given** an installed PWA launch **when** it starts **then** the standalone launch is measured
   separately from the browser-tab launch in telemetry (`installSource`), because they are materially
   different products.
7. **Given** the app is opened offline **when** the shell is cached **then** the shell renders, the
   offline banner appears, and the user reaches cached content within the same warm-start budget rather
   than seeing a browser error page.

**Mobile acceptance criteria**

- On a 360 x 640 viewport the first paint contains the app shell with the bottom navigation bar in the
  thumb zone; the user's first possible tap target is within 88 CSS px of the bottom edge including the
  safe-area inset.
- The install path is taught in-product on iOS (Share, then Add to Home Screen) because there is no
  `beforeinstallprompt` on iOS, and a non-functional install button is never shown
  ([WebKit, Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)).
- Warm start after the OS discarded the tab restores the last route and its scroll anchor (US-E10-07),
  not the workspace home.
- With a screen reader on, the "Updated" indication is a polite status message and does not move focus.
- The measured cold-start and warm-start numbers are reported per device class in the RUM dashboard, not
  only from lab runs.

**Edge cases & negative paths**

- Service worker registration fails or is blocked (private browsing on some engines): the app works
  fully online with no offline cache, and the offline features are shown as unavailable with the reason,
  never as broken buttons.
- Storage evicted between sessions (7-day WebKit rule): the next start is a cold start. This is expected
  and is not surfaced as an error.
- A stuck service worker serving a stale shell: a version skew check compares the shell build id against
  the API's advertised minimum client version and forces a one-time hard update with an explicit
  "Reloading to update" message.

---

### US-E10-12 — Real-user monitoring for LCP, INP, CLS and session context

**As a** engineering lead **I want** field vitals from real phones attributed to route and device class
**so that** we accept releases on evidence rather than on a laptop's Lighthouse score, and so that we
own the mobile-share number nobody in this market publishes.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E10-10 |
| Traces to | FR-PERF-021, FR-PERF-023, NFR-OBS-001, NFR-OBS-002, NFR-OBS-003, NFR-OBS-009, NFR-OBS-010, NFR-PRIV-009, NFR-PRIV-012 |

**Acceptance criteria**

1. **Given** a session **when** it ends or the page is hidden **then** the client reports LCP, INP and
   CLS to `POST /api/telemetry/vitals` in a single batched beacon sent with `navigator.sendBeacon` on
   `visibilitychange` to hidden and on `pagehide`, so a discarded tab still delivers its data.
2. **Given** each vitals report **when** it is recorded **then** it carries `route` (templated, never a
   real node name or id in the route label), `device_class`, `network_class`, `viewport_width`,
   `installSource` (`browser_tab` or `installed_pwa`), `app_version` and an anonymous `install_id`, per
   FR-PERF-023.
3. **Given** INP reporting **when** it is computed **then** it is taken from the client library's p98
   handling of the interaction set (ignoring the worst interaction per 50 for long sessions) and the
   `interaction_type` and `element_hint` are recorded, so a bad INP can be traced to a specific control
   rather than to a route.
4. **Given** the dashboard **when** it renders **then** it shows p75 LCP, INP and CLS for phone sessions
   per route with a week-over-week delta, and the mobile Core Web Vitals pass rate (all three in the
   good band) as M39.
5. **Given** privacy **when** telemetry is collected **then** no file name, folder name, room name,
   search query, email address or raw IP is transmitted; the route is templated and any identifier is a
   pseudonymous install id, consistent with the audit-log privacy boundary in
   [E11](./epic-11-trust-audit-and-notifications.md).
6. **Given** a release candidate **when** it is assessed **then** the release gate is p75 phone field
   data of LCP <= 2,500 ms, INP <= 200 ms, CLS <= 0.1 on the six key routes over the trailing 7 days,
   and a release that regresses INP by more than 15 ms week over week is blocked (M37 guardrail).
7. **Given** the beacon fails **when** the device is offline **then** the report is queued in IndexedDB
   with a cap of 50 reports and flushed on the next successful start; queued reports older than 72 hours
   are dropped rather than distorting a later week.
8. **Given** client errors **when** one is thrown **then** it is reported with an error class, the
   templated route and the device class as `client_error_thrown`, feeding M43, and unrecoverable
   sessions (missing session-end beacon plus a fresh cold start on the same install) are counted as M44.

**Mobile acceptance criteria**

- The telemetry client adds no more than 6 KiB gzipped to the initial route and registers no
  `scroll` or `mousemove` listeners on the main thread.
- Reporting never delays a user interaction: all serialisation happens in an idle callback or a worker,
  and the beacon is fire-and-forget.
- Sessions from a device with `Save-Data` set are still reported, because dropping them would bias the
  sample toward fast devices; the beacon is under 2 KiB.
- The dashboard explicitly reports the phone share of sessions split by role (owner and recipient) as
  M20 with **no target**, because no credible published figure for mobile share of data-room sessions
  exists and the product will not assert one.
- On a 360 px viewport the internal performance dashboard is readable without horizontal scrolling
  (it is an internal tool but is still subject to SC 1.4.10).

**Edge cases & negative paths**

- Consent not granted where a consent regime applies: only strictly necessary diagnostic reporting is
  sent, `consent_state` is recorded, and the dashboard shows the sampled share so a reader knows the
  denominator.
- A single pathological session reporting 400 interactions: the batch is capped and the outlier handling
  documented, so one user cannot move a p75.
- Clock skew on the device: `clock_skew_ms` is recorded and server receive time is authoritative for
  bucketing.
- Ad blocker or extension blocks the beacon endpoint: reports are lost silently for that session; the
  dashboard shows a beacon-delivery ratio so a sudden drop is visible rather than being read as an
  improvement.

---

### US-E10-13 — Server timing, slow-query visibility and API latency budgets

**As a** engineer diagnosing a slow folder in production **I want** per-route server timing split by
database, storage and application time **so that** I can tell whether the phone or the server is at
fault without guessing.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E10-01 |
| Traces to | FR-PERF-022, NFR-OBS-004, NFR-OBS-005, NFR-OBS-006, NFR-OBS-008, NFR-PERF-026 |

**Acceptance criteria**

1. **Given** any API response **when** it is returned **then** it carries a `Server-Timing` header with
   `db`, `storage`, `app` and `total` durations, and a `request_id` that appears in the structured log
   line for the same request.
2. **Given** the listing endpoint **when** its latency is measured **then** the read-class target of
   NFR-PERF-026 applies: p95 <= 250 ms server time for
   `GET /rooms/:roomId/nodes/:nodeId/children` at every folder-size bucket up to 10,000 children, and
   mutations stay within p95 <= 400 ms. Latency must not degrade with scroll depth, which is what cursor
   pagination buys (M45).
3. **Given** a query that exceeds 100 ms **when** it completes **then** it is logged with its templated
   SQL, its row count and its plan hash, sampled at a rate that keeps log volume bounded.
4. **Given** an endpoint's latency budget is breached at p95 for 15 minutes **when** the alert fires
   **then** it names the endpoint template, the affected folder-size bucket and the change in traffic
   mix, so a regression is distinguishable from a shift in load.
5. **Given** the client **when** it reports a slow request **then** it attaches the server-provided
   `request_id`, so a client-side p75 outlier can be joined to the exact server trace.
6. **Given** the storage backend **when** a signed-URL mint or a range read is slow **then** the
   `storage` timing segment isolates it, so preview slowness is attributable to object storage rather
   than to the application.
7. **Given** an error response **when** it is `500 INTERNAL_ERROR` **then** the response body carries the
   `requestId` and the client exposes it behind a "copy details" affordance, never a stack trace.

**Mobile acceptance criteria**

- `Server-Timing` is emitted for share-token (recipient) requests too, because the recipient path on a
  phone is the one with the strictest latency expectation (M10: p75 <= 2,500 ms from link open to first
  rendered page).
- The header adds under 150 bytes per response, so it does not measurably affect a 3 Mbps uplink or a
  9 Mbps downlink.
- No timing detail that reveals room structure (row counts of folders the caller cannot see, other
  tenants' timings) is exposed to a client.

**Edge cases & negative paths**

- A proxy strips `Server-Timing`: server-side traces remain authoritative and the client falls back to
  wall-clock measurement, flagged as such.
- Database connection pool saturation: the alert distinguishes queue time from execution time so the
  fix is capacity rather than query tuning.
- A single room with 1M nodes (beyond the modelled ceiling): the alert fires, and the documented action
  is partitioning by `roomId` per the domain model, not a client-side workaround.

---

### US-E10-14 — Stream everything: several-gigabyte files without hitting the memory ceiling

**As a** P6 Ray Okonkwo uploading a 40 MB survey from a lot and, later, a 3 GB video walk-through
**I want** large files to move and open without the tab dying **so that** I am not left with a
half-loaded folder and a crashed browser.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E10-02 |
| Traces to | FR-PERF-020, FR-FILE-011, FR-FILE-016, FR-VIEW-015, FR-VIEW-022, NFR-PERF-011, NFR-PERF-013, NFR-PERF-018, NFR-PERF-024, NFR-PERF-025, NFR-MOB-006, NFR-MOB-018, NFR-SCALE-006, NFR-SCALE-007, NFR-SCALE-012, BR-208, BR-209 |

**Acceptance criteria**

1. **Given** an upload of any size **when** the client reads the file **then** it reads only through
   `File.slice()` into a stream, holds at most one chunk in memory at a time, and never calls
   `FileReader.readAsArrayBuffer` on a whole file or constructs a `data:` URL from file bytes.
2. **Given** chunk sizing **when** it is chosen **then** it is a multiple of 256 KiB between 256 KiB and
   8 MiB, defaulting to **1 MiB** on a connection reported as cellular or slow and **8 MiB** on an
   unmetered fast connection, adapting within those bounds on observed throughput and failure rate
   (BR-209, NFR-SCALE-007), and only one chunk is ever held in memory. It respects the constraint that
   S3 multipart parts are 5 MiB minimum (except the last) with a 10,000-part cap, and that GCS resumable
   chunks must be multiples of 256 KiB. Uplink is the governing figure: sizing targets an effective 1 to
   3 Mbps uplink, not a download headline.
3. **Given** a chunk is about to be sent **when** the client updates state **then** the confirmed byte
   offset is committed to IndexedDB or OPFS **before** the request is issued, per BR-208, so a freeze
   or discard mid-chunk loses at most one chunk of work.
4. **Given** resume **when** the app reopens **then** the authoritative resume point is the server's
   `HEAD /uploads/:uploadId` `Upload-Offset`, not the client's local belief, and the client seeks the
   file handle to that offset.
5. **Given** a document preview of a large PDF **when** it renders **then** pages are server-rendered
   images fetched one page at a time (with the adjacent page prefetched), a single canvas is reused and
   explicitly released (resized to 1x1 and cleared) on close, and the client never parses the whole
   document into the tab. The backing store is capped at `viewport x min(devicePixelRatio, 2)` so a
   single canvas stays well under the 16,777,216-pixel iOS cap.
6. **Given** video or audio **when** it plays **then** it is delivered through HTTP range requests or an
   adaptive manifest via a media element and is never fetched into a `Blob` first.
7. **Given** a folder download **when** the user requests one **then** the zip is streamed by the
   server with `Content-Disposition: attachment` and no server-side buffering, the first byte arrives
   within 2.0 s at p75 of confirming the download (NFR-PERF-018), and the archive is capped at 10 GB or
   20,000 files with a split-archive path above it (NFR-SCALE-012); client-side zipping is used only for
   a small explicit selection under a stated cap and only where a real file handle is available, which
   excludes iOS entirely (no `showSaveFilePicker`).
8. **Given** a 5 GB file upload on the reference device, the R1 maximum single file size per
   NFR-SCALE-006 **when** it runs to completion across at least
   one background/foreground cycle **then** peak JavaScript heap stays under the 60 MB ceiling of
   NFR-PERF-024 and the tab does not
   crash, verified on a real low-memory iPhone and a real mid-tier Android.
9. **Given** memory pressure **when** it occurs **then** the client cannot catch it: there is no
   JavaScript exception to handle, so the design constraint is prevention, and any code path that could
   hold a whole file in memory fails a lint rule and a code review checklist item.

**Mobile acceptance criteria**

- On iOS, a long foreground upload requests a Screen Wake Lock where available so the screen does not
  sleep and freeze the page mid-transfer, and it is released on completion or cancel.
- Upload progress is shown per file and in aggregate in a persistent tray that is at least 48 CSS px
  tall, sits above `env(safe-area-inset-bottom)`, and never covers the primary action.
- When the app is backgrounded, the tray state on return says exactly one of "Uploading",
  "Paused, reopen the app to continue" (the honest state where the platform froze the page) or
  "Failed, tap to retry". The words "uploading in the background" are banned copy.
- A 200 MB PDF opens to a rendered first page within the M42 target of p75 <= 2,500 ms on cellular, and
  the page-image request for page 1 is prioritised over the manifest's remaining metadata.
- With a screen reader on, upload progress is announced at 0%, 25%, 50%, 75% and completion only, not on
  every percentage tick, and every announcement is polite (SC 4.1.3).

**Edge cases & negative paths**

- Upload session expired (`410 UPLOAD_SESSION_EXPIRED`): "This upload timed out. Tap to start it again."
  The file handle is reused if still held; otherwise the picker reopens. No partial node is ever visible
  in the folder.
- Checksum mismatch on commit (`422 CHECKSUM_MISMATCH`): "The upload was corrupted. Retrying." One
  automatic retry from offset 0, then a manual Retry button.
- A file larger than the administrator-set per-file ceiling (BR-231): `413 FILE_TOO_LARGE` with the
  actual limit named ("This file is larger than this workspace allows (5 GB)") before any bytes are
  sent.
- iOS tab discarded during a 5 GB upload: on reopen the tray shows the paused session with its exact
  resume offset, and the resume probe reconciles with the server. Nothing is silently lost, and M41
  (eventual upload success) is the tracked guardrail with a floor of 99.0%.
- Canvas memory error on an older iPad ("Total canvas memory use exceeds the maximum limit"): the
  viewer drops to a single lower-resolution page image and logs the event; it never leaves a blank page.

---

### US-E10-15 — Offline read cache for visited folders and opened files, honestly labelled

**As a** P6 Ray Okonkwo standing in a mechanical room with no bars **I want** the documents I already
opened to still be there **so that** I can show a prospect the rent roll instead of apologising for the
building.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E10-07, US-E10-08 |
| Traces to | FR-PERF-009, FR-PERF-011, FR-PERF-012, FR-PERF-013, FR-MOB-022, FR-SRCH-025, NFR-MOB-013, NFR-MOB-014, NFR-MOB-015, NFR-MOB-016, NFR-SEC-015, BR-113, BR-121, BR-134 |

**Acceptance criteria**

1. **Given** the device goes offline **when** the user navigates to a folder they have previously
   visited in this room **then** the cached listing is served from IndexedDB for every room opened in
   the last 7 days, per the offline read scope in NFR-MOB-013, the offline banner from
   [E09](./epic-09-mobile-ux-foundations.md) is shown naming what remains available, and the banner is
   removed automatically on reconnection.
2. **Given** a file among the last 20 documents the user viewed, or an explicitly pinned file
   (NFR-MOB-013) **when** they open it offline **then** the cached
   preview pages that were fetched are shown, with a persistent chip reading "Cached copy, may be
   cleared by your browser", and pages that were never fetched show "Not available offline" rather than
   a blank page.
3. **Given** cached content **when** it is written **then** the cache stores only listings, preview page
   images, thumbnails and file metadata, and never stores capability payloads, share state or anything a
   permission decision depends on (BR-121, BR-134).
4. **Given** the cache **when** an entry is keyed **then** the key includes the subject id and the grant
   version, so one user's cached content on a shared device is never served to another subject, and a
   revocation invalidates on the next online check, and BR-113 purges the revoked scope on next start.
5. **Given** cache size **when** it is bounded **then** the cache holds at most the lesser of 250 MB or
   20% of the value reported by `navigator.storage.estimate()`, evicts by least-recently-used, and
   `estimate()` is treated as deliberately imprecise rather than as an exact budget.
6. **Given** app start **when** the cache is initialised **then** `navigator.storage.persist()` is
   requested once, the outcome is recorded, and the product degrades with no data loss beyond the cache
   itself if the request is denied or the storage is evicted (FR-PERF-012).
7. **Given** the cache **when** anything is stored **then** it is by construction a disposable replica:
   no user data exists only on the device at any point, including a queued offline mutation, whose
   payload is small and separately journalled by
   [E08](./epic-08-conflict-resolution-and-data-integrity.md) (FR-PERF-013).
8. **Given** the user searches while offline **when** results are shown **then** the result screen states
   plainly "Offline: searching cached items only" and never presents a partial result set as complete
   (FR-SRCH-025).
9. **Given** the user signs out **when** the sign-out completes **then** all cached room content for that
   subject is purged from the device before the sign-out confirmation is shown, and the purge is verified
   by an integration test asserting empty object stores.

**Mobile acceptance criteria**

- The offline banner occupies at most 56 CSS px at 360 px width, does not cover the bottom action bar,
  and names the state in one line: "Offline. Showing content you have already opened."
- Every cached surface carries the cached-copy label; the label is text, not colour alone, and is
  announced once by a screen reader when the surface is opened.
- The words "Available offline" are only used for explicitly pinned items (US-E10-16); everything else
  says "Cached copy". "Saved to your device" and "Downloaded" are banned copy for the cache.
- Going offline mid-scroll shows the banner within 1 second of the `offline` event and keeps already
  rendered rows; it does not clear the list.
- Coming back online revalidates the visible listing and removes the banner without changing scroll
  position.
- Storage settings show "Cached content: 142 MB" with a "Clear cached content" control at least 48 CSS
  px tall, and clearing it never touches anything on the server.

**Edge cases & negative paths**

- Origin storage evicted by WebKit's seven-day no-interaction rule: on next open the app finds an empty
  cache, shows normal online loading, and never displays an error about lost data, because nothing was
  lost.
- Cache write fails with a quota error: the write is abandoned, the LRU eviction runs, and the user is
  not shown a browser storage error. Repeated failures disable caching for the session and record it.
- User is offline and taps something that requires the server (rename, share, revoke): the action is
  queued or refused per [E08](./epic-08-conflict-resolution-and-data-integrity.md), and permission
  changes are always refused offline with "You need to be online to change who can see this."
- Shared device: a second subject signing in on the same browser profile never sees the first subject's
  cached content, because keys are subject-scoped and sign-out purges.
- A cached preview of a file that was deleted server-side: on reconnection the revalidation returns
  `404` and the cached copy is purged with an inline "This file was deleted" notice.

---

### US-E10-16 — Explicit offline pinning with visible space accounting

**As a** P6 Ray Okonkwo before a site visit **I want** to choose the four documents I will need
underground **so that** I am not relying on what happens to be cached.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E10-15 |
| Traces to | FR-PERF-010, FR-PERF-011, FR-PERF-012, FR-PERF-013, NFR-MOB-013, NFR-MOB-014, NFR-MOB-015, NFR-MOB-024, NFR-MOB-025, BR-113 |

**Acceptance criteria**

1. **Given** a file or a folder **when** the user chooses "Keep available offline" from the row overflow
   or the details sheet **then** its content is fetched and stored, a pin badge appears on the row, and
   the pinned set is listed on one screen with each item's size and the total.
2. **Given** a pinned folder **when** it is pinned **then** the scope is stated explicitly before commit:
   "Keep 24 files (312 MB) in this folder available offline?" with a confirm and cancel, and subfolders
   are included only if the user opts in.
3. **Given** pinning **when** the download runs **then** it is a foreground, resumable operation with
   visible progress in the same tray as uploads, it defers to Wi-Fi by default on a metered connection
   with an explicit "Download now on cellular" override, and it survives backgrounding by resuming on
   next open (there is no background fetch on iOS).
4. **Given** the pinned set **when** it exceeds the cache cap **then** the pin is refused before download
   with "Not enough room on this device for that. Free up 180 MB or unpin something." and a list of the
   largest pinned items with unpin controls.
5. **Given** pinned content **when** it is displayed offline **then** it is labelled "Kept offline" and
   is exempt from LRU eviction by the app; the label still states that the browser may clear storage,
   because the platform can evict the whole origin regardless of the app's intent.
6. **Given** a pinned item **when** the user's access to it is revoked **then** on the next successful
   online check the pinned content is purged from the device within the same request cycle, the pin is
   removed, and the item shows "You no longer have access to this file."
7. **Given** pinned content **when** the underlying file gains a new version **then** the pin refreshes on
   the next online check and the row states "Updated 12 minutes ago"; a stale pinned copy is never shown
   without its age.
8. **Given** unpinning **when** the user unpins **then** the local bytes are deleted immediately, the
   space figure updates, and nothing on the server changes.

**Mobile acceptance criteria**

- The pin control is reachable from the row overflow (48 x 48 CSS px) and from the details sheet at the
  medium detent; it is never only a long-press action, because context-menu items must also exist in the
  main interface.
- The pin screen shows total pinned size against the app's cache cap as a bar plus a text value, and the
  value is announced as a status message when it changes.
- Pinning 24 files on a flaky 4G link shows per-file state and an aggregate "18 of 24 kept offline";
  interrupting it leaves the completed files pinned and the rest clearly pending, never a silent partial.
- On iOS in a browser tab, pinning still works (it is IndexedDB, not a file download), and the copy does
  not promise a file in the Files app.
- At 200% text size the pin list rows wrap rather than truncating the size value, which is the number the
  user is making a decision on.

**Edge cases & negative paths**

- User pins a folder, then a new file is added to it: the new file is not pinned automatically; the pin
  screen shows "3 new files in a pinned folder" with a one-tap "Keep these too".
- Pinned file exceeds the per-file cache limit (Assumption: 100 MB per file for pinning in R2): the pin
  is refused with the limit named and a suggestion to open it online instead.
- Storage evicted while offline: the pinned content is gone and the app says "Your offline copies were
  cleared by the browser. Reconnect to restore them." No claim is made that the data was lost, because
  the server still holds it.
- Device shared with a colleague: pinned content is subject-scoped and purged on sign-out, exactly as the
  cache is.

---

### US-E10-17 — Storage accounting: incremental usage, per-room breakdown and drift reconciliation

**As a** P1 Marcy Doyle who has to trust the number the app shows me **I want** used storage to be
correct and to break down per room **so that** a quota decision is never made on a wrong figure.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E10-01 |
| Traces to | FR-PERF-025, FR-ACCT-004, FR-ACCT-005, NFR-PERF-026, NFR-OBS-008, NFR-SCALE-005, BR-179, BR-186, BR-197, BR-198, BR-199, BR-200 |

**Acceptance criteria**

1. **Given** any commit that changes stored bytes (upload commit, version prune, restore, purge,
   permanent delete) **when** it completes **then** `StorageUsage` rows for the affected room and the
   account are updated in the same transaction, so no listing or account request ever triggers a scan.
2. **Given** `GET /api/account/storage` **when** it is called **then** it returns `bytesUsed`,
   `bytesInVersions`, `bytesInTrash`, `fileCount`, `folderCount` and `computedAt` for the account, plus
   the same shape per room ordered by size descending, in a single response, in under 150 ms server time
   at p95.
3. **Given** the freshness window **when** a figure is read **then** it is current within **10 seconds**
   of an upload completing or a permanent deletion committing (BR-200, FR-PERF-025), and the interface
   states when the figure was last computed; where a figure is older than that, the response includes
   `stale: true` and the UI shows the last known figure with an "updating" indicator rather than a wrong
   number presented as fact.
4. **Given** a nightly reconciliation job **when** it runs **then** it recomputes usage from the blob
   ledger, records `driftBytes` and sets `method: 'reconciled'`, and any non-zero drift raises an alert
   rather than being logged quietly, because a wrong quota number either blocks a colleague who has room
   to spare or lets a room quietly exceed a limit nobody set.
5. **Given** deduplicated blobs **when** usage is computed **then** the accounting rule is stated once and
   applied consistently: an account is accounted the logical bytes of its current versions plus its
   version history plus its trash, and cross-account dedup savings are never counted twice
   (Assumption: logical accounting rather than physical; recorded as OQ73).
6. **Given** a room is trashed **when** its storage is counted **then** it still counts against the
   account quota until purge, and the Trash screen states "Trashed rooms still use your storage until
   they are purged."
7. **Given** a guest or a Viewer **when** they request storage figures **then** the server returns `403`
   or omits the fields entirely, because the storage position is internal and a recipient must not learn the
   owner's account shape.
8. **Given** an account with 28 rooms and 7,700 nodes **when** the storage screen loads **then** the
   per-room breakdown is cursor-paged at 50 rooms per page and does not perform a per-room aggregate at
   request time.

**Mobile acceptance criteria**

- The account storage figure renders on one line at 360 px for values up to "9,999 files, 999.9 GB", and
  wraps rather than truncating at 200% text size.
- The per-room breakdown is a list, not a table: room name, bar, value on one row of at least 48 CSS px,
  with no horizontal scrolling (SC 1.4.10).
- The figure is announced as a status message when it changes materially, never signalled by colour alone
  (SC 4.1.3).
- On a flaky link the screen shows the cached figure with its "as of" time rather than a spinner, and
  refreshes in place.

**Edge cases & negative paths**

- Concurrent upload commits into the same room: the counter update is transactional, so two 500 MB commits
  cannot both read the pre-update value; verified with a concurrency test asserting the final figure.
- Reconciliation finds drift larger than 1% of account usage: an alert fires, the incremental value is
  replaced by the reconciled one, and the change is written to the activity log as a system event so a
  jump in the number is explainable.
- A blob whose `refCount` reaches 0 during the 7-day grace: bytes are released from the account figure at
  purge, not at delete, and the Trash screen explains the difference.
- Storage service unavailable when the figure is requested: the last known figure is served with
  `stale: true` and the UI does not block any read or share operation on it.

---

### US-E10-18 — Scale and soak acceptance harness

**As a** QA engineer holding a phone **I want** a repeatable harness and a seeded 10,000-item room
**so that** every performance claim in this epic is something I can verify without asking an engineer.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E10-01, US-E10-02, US-E10-12 |
| Traces to | FR-PERF-005, FR-PERF-019, FR-PERF-020, NFR-PERF-004, NFR-SCALE-001, NFR-SCALE-004, NFR-MAINT-016, NFR-OBS-013, NFR-A11Y-016 |

**Acceptance criteria**

1. **Given** a seeding script **when** it is run against a test environment **then** it creates a
   deterministic fixture room containing: one folder with 10,000 children (mixed folders and files, mixed
   names including Unicode and 255-character names), a 32-level deep path, a 200 MB PDF, a 5 GB binary,
   300 image files for the tiles view, and one folder with 0 children.
2. **Given** the fixture **when** the documented manual test plan is executed on a real reference-class
   Android and a real low-memory iPhone **then** each of these is recorded pass or fail with a measured
   number: folder open time, scroll smoothness (no long task over 50 ms), selection-mode INP, thumbnail
   cancellation count, memory delta over a full scroll, first-page render of the 200 MB PDF on cellular,
   5 GB upload with one background cycle, and place restoration after a force-quit.
3. **Given** the automated harness **when** it runs nightly **then** it executes the same measurements in
   a lab profile and publishes a trend line per metric, so a regression is visible before a release
   candidate is cut.
4. **Given** a release candidate **when** it is assessed **then** the acceptance record must contain both
   the lab harness result and the p75 field data for the trailing 7 days, and a candidate with a green lab
   result and a failing field result is not accepted.
5. **Given** the harness **when** it reports **then** every number is labelled with the device, the OS
   version, the throttling profile and whether it was simulated or packet-level throttling, because a
   number without its conditions is not evidence.
6. **Given** the 10,000-item folder **when** a QA engineer performs one-handed navigation to item 10,000
   and back **then** the task is completable without pinch, horizontal scroll or two-handed use, and the
   result feeds M46 (one-handed task success).
7. **Given** an intentionally injected regression (a synthetic 400 ms task on scroll) **when** the harness
   runs **then** it fails, proving the harness detects what it claims to detect.

**Mobile acceptance criteria**

- The manual plan is written for a phone in one hand with no laptop present: every step is an on-device
  observation with a stated pass threshold, and no step requires reading a DevTools panel except the two
  explicitly labelled "requires tethered DevTools".
- Test devices are named, not described: reference-class Android (Galaxy A24 4G or the stated equivalents)
  and a low-memory iPhone (SE 3rd generation class), with the DevTools calibrated CPU presets used for
  emulated runs rather than the hard-coded 4x and 6x multipliers.
- The harness runs the recipient path (share link opened cold, no account) as a first-class scenario,
  because that is the highest-probability mobile moment in the market.
- Screen-reader passes are part of the plan: VoiceOver on iOS and TalkBack on Android traverse the
  10,000-item list, and `aria-rowcount` is verified to report the approximate total.

**Edge cases & negative paths**

- Fixture generation timing out in CI: the fixture is generated once and snapshotted, with a checksum, so
  a slow seed does not block the pipeline.
- Device thermal throttling during a soak: the harness records device temperature where available and
  marks a run as thermally affected rather than reporting a false regression.
- A test environment with a faster database than production: the harness records the environment class,
  and server-side numbers from a non-production-like environment are never used for the release gate.

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| The offline mutation queue for writes, its reconciliation and conflict resolution on reconnect | [E08](./epic-08-conflict-resolution-and-data-integrity.md) |
| Preview rendering itself: the support matrix, pinch-zoom, page jump, rotation, unsupported-type fallback | [E05](./epic-05-viewing-preview-and-file-details.md) |
| Upload UX: pickers, camera capture, the share sheet, the tray's interaction design, partial-failure reporting | [E04](./epic-04-file-operations.md) |
| Quota policy, warning thresholds, at-limit behaviour, the administrator-set ceilings and the storage screens users see | [E12](./epic-12-account-storage-and-governance.md) |
| Skeletons, toasts, offline banner styling, haptics, safe areas, breakpoints, theming and the a11y system itself | [E09](./epic-09-mobile-ux-foundations.md) |
| Breadcrumb collapse behaviour, drill-down, tree at expanded width, deep links | [E03](./epic-03-folder-hierarchy-and-navigation.md) |
| Search relevance, filters, saved searches and content/OCR search | [E06](./epic-06-search-and-discovery.md) |
| Activity log, viewer analytics and notification delivery (this epic only guarantees log writes do not block the user action) | [E11](./epic-11-trust-audit-and-notifications.md) |
| Product analytics event taxonomy and metric definitions | [Success metrics & analytics](../10-success-metrics-and-analytics.md) |
| Native app shells, true background upload and OS-level share targets on iOS | Not in R1 to R3. Revisited only if A04 fails. |
| Multi-region data residency and CDN edge strategy | Deferred; recorded as OQ80. |

## Open questions

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ73 | Is storage accounted on logical bytes (counting each account's own copy) or physical bytes after cross-account dedup? R1 assumes logical, which is simpler to explain and slightly generous to the user. | Product + IT operations | Before R1 code freeze |
| OQ74 | Are the R1 budgets (900 KiB / 350 KiB JS on the recipient route, 1.1 MiB / 450 KiB on the folder route) achievable with React 19 plus the chosen router and data layer, or does the recipient path need a separate, smaller entry bundle? | Engineering | Sprint 2 |
| OQ75 | Should the offline read cache be opt-in at first run rather than ambient, given that it leaves room content on a possibly shared device? R1 assumes ambient plus subject-scoping plus purge-on-sign-out. | Product + Security | Before R1 launch |
| OQ76 | What is the right per-file and total cap for offline pinning on a phone, and is it one of the administrator-set limits of BR-231 or a fixed client constant? R2 assumes 100 MB per file and 250 MB total, fixed. | Product + Engineering | R2 planning |
| OQ77 | Do we need a "jump to letter" or "jump to date" landmark on compact widths for 10,000-item folders, or is search-in-folder sufficient? Field data from R1 should decide. | Product + design partners | R2 planning |
| OQ78 | Is a 60-second storage freshness window tight enough for the at-limit experience in [E12](./epic-12-account-storage-and-governance.md), or does quota need a synchronous reservation read on every upload start? | Engineering + Product | Before R1 code freeze |
| OQ79 | Should we sample RUM at 100% in R1 (small user base, maximum learning) and reduce later, and what is the sampling policy that keeps M36 to M39 statistically usable at low volume? | Engineering + Data | Sprint 3 |
| OQ80 | Which region do we deploy first, and does any engagement we run require EU data residency in R1? This affects TTFB and therefore LCP for a material share of recipients. | Product + Legal | Before R1 launch |
