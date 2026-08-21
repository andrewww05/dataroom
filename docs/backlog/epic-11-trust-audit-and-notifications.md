# Epic E11 — Trust, Audit & Notifications

## Purpose

This epic proves what happened in a Data Room and makes the phone the place where an owner triages
what just happened, rather than a dashboard they visit at a desk. It owns the append-only activity
log at room, folder and file scope; viewer analytics including page-level dwell, which is the reason an
owner sends a link instead of an attachment; download tracking kept strictly separate from previewing; the
in-app notification centre and the push, email and digest channels around it; per-room notification
preferences and mute; CSV export; and the retention and privacy boundary that makes all of it lawful
and defensible.

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
  [E10 Performance, Offline & Scale](./epic-10-performance-offline-and-scale.md),
  [E12 Account, Storage & Governance](./epic-12-account-storage-and-governance.md)

## Epic summary

| Field | Value |
| --- | --- |
| Epic ID | E11 |
| Goal | Record every consequential act in a room in an append-only log that survives the deletion of what it describes; tell an owner who read which document and for how long, page by page, on a phone; and replace the desktop analytics dashboard with a push-first, one-tap-actionable notification inbox that works honestly on every surface, including a Safari tab where web push does not exist. |
| Primary personas | P1 Marcy Doyle (solo broker, wants to know a buyer opened the CIM and to revoke a tyre-kicker from the same screen), P6 Ray Okonkwo (CRE broker, needs to know which of 30 NDA'd buyers is actually engaged), P3 Tomás Ferreira (buy-side CPA, generates the events and needs to know what is tracked about him), P5 Ingrid Sørensen (recipient whose open event is the product's most valuable signal), P4 Ashley Kim (coordinator who audits room hygiene) |
| Release span | R1 (stories 01 to 08, 11 to 15), R2 (stories 09, 10, 16, 17, 18) |
| Story count | 18 |
| Total points | 101 |
| Depends on | [E01](./epic-01-access-and-identity.md) for a stable actor id and the new-device security event, [E04](./epic-04-file-operations.md) and [E03](./epic-03-folder-hierarchy-and-navigation.md) for the mutations that emit events, [E07](./epic-07-sharing-and-access-control.md) for share, role and revoke semantics, [E05](./epic-05-viewing-preview-and-file-details.md) for the viewer that reports page dwell, [E09](./epic-09-mobile-ux-foundations.md) for sheets, chips, live regions and the install-teaching flow, [E10](./epic-10-performance-offline-and-scale.md) for cursor pagination and virtualisation of the log |
| Blocks | [E12](./epic-12-account-storage-and-governance.md) (quota warnings and governance notifications use this epic's channels) |
| Business rules applied | This epic owns no rule block of its own. It is judged against BR-042 (only Owner and Manager on the scope may read the log, viewer analytics and download tracking), BR-046 and BR-049 (nothing in a log, notification or count may reveal an item the reader has no grant on, and a refusal is indistinguishable from a non-existent id), BR-040 (preview authority is independent of download authority), BR-110 and BR-111 (signed URL lifetime and per-range re-authorisation, which is what makes download tracking meaningful), BR-105 (first-access notification), BR-120 (every revocation writes an activity entry), BR-187 and BR-188 (purge, version expiry and room deletion still write and retain the log), BR-192 (tombstone identity after account deletion), BR-195 (activity retention), BR-217 (outbound notification email limits), BR-224 (export rate limit) and BR-232 (every limit rejection is logged). |

## Mobile-first design stance

- **The notification is the surface; the dashboard is the desktop enhancement.** The highest-frequency
  real mobile job in dealmaking is responding, not browsing: a question arrived, someone requested
  access, a document was viewed. Incumbents put all of that behind a desktop dashboard, and DocSend,
  whose entire proposition is page-level viewer analytics, has no mobile app at all by Dropbox's own
  documentation. Each notification here states actor, object and consequence in one line and carries
  exactly one primary action reachable in one tap.
- **A log is not a table on a 360 px screen.** A fixed-width table of actor, action, object, time and
  location cannot satisfy WCAG 2.2 SC 1.4.10 Reflow at 320 px, so the log is a reverse-chronological
  virtualised list of two-line rows with a horizontally scrollable filter-chip rail. The table with
  sortable columns is the Expanded-width enhancement, not the baseline.
- **Push capability is stated per surface, never implied.** Web push on iOS arrived in 16.4 and works
  only for Home Screen web apps, not for pages in a Safari tab; Safari 26 removed the installability
  requirements for becoming a web app but the site still has to be on the Home Screen
  ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/),
  [WebKit Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)). There is no
  `beforeinstallprompt` on iOS. Therefore email is the guaranteed channel for anything an owner must
  not miss, push is an accelerant, and the settings screen shows the true state of this device rather
  than a toggle that silently does nothing.
- **Dwell measured on a phone must be honest or it is worse than nothing.** Foreground time only,
  paused on `visibilitychange` to hidden, heartbeat every 15 seconds, and a session whose heartbeat
  stopped is labelled truncated with dwell presented as a lower bound. The benchmark for what a real
  read looks like on a phone is short: an average full pitch-deck review is 3.2 minutes with 23
  seconds on page one and about 15 seconds per page thereafter
  ([Papermark pitch deck metrics](https://www.papermark.com/pitch-deck-metrics)), so the analytics UI
  is designed to make a 40-second session legible rather than to fill a chart.
- **Right-click, hover and marquee have no place here.** A log row's actions live behind a 48 CSS px
  overflow button that is always rendered, with the same items available on long-press; per Apple's
  rule, context-menu items must also exist in the main interface. Filters are chips, not a hover
  dropdown. A chart is never the only representation of a number: every chart has a text equivalent
  in the DOM.
- **Privacy is a product surface, not a policy page.** Viewer tracking is personal data. Recipients
  are told what is recorded about them at the point of access, the log never stores a password, a
  token, a link secret, a session credential or file contents, and "from where" is an HMAC of the IP
  plus a country code rather than a stored IP address.
- **The log write must never block the act it describes.** Event writes are enqueued inside the same
  transaction as the mutation where correctness demands it and flushed asynchronously where it does
  not, and a logging outage never fails a user's upload, rename or revoke.
- **Everything destructive or consequential in this epic still obeys the touch safety rules.** Export
  is a two-step with a stated cost, mute is reversible with a visible state, and there is no
  interface and no endpoint that edits or deletes an individual log entry, for anyone, ever.

---

## User stories

### US-E11-01 — Activity event contract and append-only write path

**As a** platform engineer serving P1 Marcy Doyle **I want** one closed action taxonomy and an
append-only write path that captures actor, action, target, time, source and share **so that**
"prove who downloaded the CIM" is answerable months later, even after the CIM is deleted.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | none |
| Traces to | FR-AUDIT-001, FR-AUDIT-002, FR-AUDIT-010, FR-AUDIT-011, FR-AUDIT-025, NFR-COMPL-001, NFR-COMPL-002, NFR-COMPL-003, NFR-OBS-011, NFR-PRIV-001, NFR-SEC-026, NFR-AVAIL-001, BR-120, BR-187, BR-192, BR-232 |

**Acceptance criteria**

1. **Given** `packages/shared` **when** a developer imports the audit contract **then** an
   `ActivityAction` closed enum is exported covering create, rename, move, copy, delete, restore,
   purge, upload, download, preview-open, share-create, share-edit, share-revoke, invite-send,
   invite-accept, role-change, access-denied, sign-in, sign-in-new-device and version-expiry, with a
   per-action `metadata` shape validated on write. Free-text actions are impossible by construction.
2. **Given** any of those acts succeeding **when** the request completes **then** exactly one
   `ActivityEvent` row is written carrying `actorType`, `actorId`, `actorLabel` (a snapshot of the
   display name or email at event time), `action`, `roomId`, `nodeId`, `targetName` and
   `targetPathLabel` snapshots, `occurredAt` and `recordedAt`, `ipHash`, `countryCode`, `deviceClass`,
   `userAgentFamily`, and the `shareLinkId` or `inviteId` the access came through where applicable.
3. **Given** the node the event describes is later purged **when** the log is read **then** the entry
   still resolves and still displays the name and path it had at the time, because they are snapshots
   and there is no FK cascade from the log to the node.
4. **Given** the application database role **when** it is provisioned **then** it holds `INSERT` and
   `SELECT` on the activity table and no `UPDATE` or `DELETE`, verified by an integration test that
   asserts an update attempt fails at the database level, not merely in application code.
5. **Given** any event **when** it is written **then** it contains no password, no token, no link
   secret, no session credential, no file contents and no raw IP address; a contract test asserts that
   the serialised metadata of every action type matches an allow-list of keys.
6. **Given** an offline mutation that reconciles later **when** its event is written **then**
   `occurredAt` is the client-asserted time (clamped to a sane skew window) and `recordedAt` is the
   server time, and the log displays the recorded time with the occurred time available in the entry
   detail, so a late-arriving event is never presented as having happened now.
7. **Given** a purge from trash or the expiry of a file version **when** it happens **then** an event
   is written, so the disappearance of an item is always explained by the log rather than looking like
   data loss (FR-AUDIT-025).
8. **Given** the logging subsystem is degraded **when** a user performs a mutation **then** the
   mutation still succeeds, the event is queued durably for retry, and a queue depth above threshold
   raises an operational alert. A logging failure never surfaces as a user-facing error on the action
   itself.
9. **Given** the room's `seq` counter **when** events are written **then** `seq` is monotonic per
   `roomId`, so a client can fetch "everything after seq N" for an incremental feed without paging
   from the top.

**Mobile acceptance criteria**

- Writing an event adds no more than 15 ms to the p95 server time of the mutation it accompanies,
  measured through `Server-Timing` per [E10](./epic-10-performance-offline-and-scale.md).
- The client sends no audit payload of its own beyond what the request already carries: device class
  and user-agent family are derived server-side, so an audit write costs zero extra bytes on a 3 Mbps
  uplink.
- An event emitted by an action performed offline and synced later carries the device class of the
  device that performed it, not of the device that happened to be online at sync time.

**Edge cases & negative paths**

- Two identical actions in the same second (double tap): idempotency keys at the API layer mean one
  mutation and therefore one event; a duplicate event is a defect and is caught by a uniqueness
  assertion on `(roomId, action, nodeId, actorId, occurredAt, requestId)` in tests.
- Actor is the system (a retention job, a reconciliation): `actorType: 'system'` with
  `actorLabel: 'System'`, and the entry explains itself ("Version 3 expired under the room's retention
  policy").
- Actor's account is later deleted: the row is anonymised in place (actor id nulled, `actorLabel`
  replaced with "deleted user") rather than removed, so a counterparty's audit trail is not silently
  rewritten.
- Event metadata exceeding the 4 KB serialised cap: the write truncates the largest field, records
  `metadata_truncated: true`, and never drops the event.

---

### US-E11-02 — Room activity log on a 360 px screen

**As a** P1 Marcy Doyle **I want** to read the room's activity as a scrollable list of plain-English
lines on my phone **so that** I can see what happened overnight before I get to the first appointment.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E11-01 |
| Traces to | FR-AUDIT-003, FR-AUDIT-013, FR-AUDIT-014, FR-AUDIT-016, NFR-A11Y-007, NFR-A11Y-011, NFR-A11Y-017, NFR-I18N-007, NFR-SCALE-014, NFR-PERF-002, BR-042, BR-195 |

**Acceptance criteria**

1. **Given** `GET /api/rooms/:roomId/activity` **when** it is called **then** it returns events in
   reverse chronological order, cursor-paged per
   [E10 US-E10-01](./epic-10-performance-offline-and-scale.md), with filters for actor, action type,
   node and date range, and it never returns a `total` requiring a count scan.
2. **Given** the log screen **when** it renders at 360 px **then** each entry is a two-line row of
   fixed height: line one is a plain-English sentence ("Dev Raman opened Lease 2025.pdf"), line two is
   the relative time, the location and the access path ("14 minutes ago, United States, via link
   Buyer A").
3. **Given** the filter rail **when** it renders **then** it is a horizontally scrollable chip row
   (All, Views, Downloads, Uploads, Changes, Sharing, Denied) with each chip at least 48 CSS px tall,
   the active chip visually and programmatically marked (`aria-pressed`), and the rail sticky under the
   header.
4. **Given** 4,000 events in a room **when** the log is scrolled **then** it is virtualised with a
   bounded mounted-row count and no long task over 50 ms, per E10's list rules.
5. **Given** timestamps **when** they are displayed **then** they use the viewing principal's device
   timezone with the timezone named on the entry detail ("21 Aug 2026, 09:14 (GMT+3)"), and relative
   times switch to absolute after 7 days.
6. **Given** the retention period **when** the log is shown **then** the screen states it in place
   ("Activity is kept for 24 months on your plan") per FR-AUDIT-016 and BR-195, with the free tier's
   shorter minimum of 12 months stated on that plan (NFR-PRIV-005), and the oldest available entry is
   reachable by scroll or by a date filter.
7. **Given** a tap on an entry **then** a details sheet opens at the medium detent showing the full
   path snapshot, the exact timestamp, the actor's identity or unverified label, the access path and,
   where the target still exists, a "Go to item" action.
8. **Given** a date-range filter with no matches **when** results are empty **then** the empty state
   names the filter and offers a one-tap "Clear filters", not a bare "No results".
9. **Given** the log is opened offline **when** cached entries exist **then** they render with the
   cached-copy label from E10 and the screen states "Offline: showing activity up to 09:14".

**Mobile acceptance criteria**

- No horizontal scrolling of content at 320 CSS px width; the only horizontally scrollable element is
  the filter chip rail, which is a deliberate, discoverable pattern with a visible partial chip at the
  right edge (SC 1.4.10).
- At 200% text size an entry grows to three or four lines rather than clipping, and the timestamp never
  truncates to the point of ambiguity ("14 min" is acceptable, "1..." is not) (SC 1.4.4).
- A screen reader reads the entry as one coherent sentence including the time, rather than as five
  disconnected fragments; the row has a single accessible name composed server-side.
- The log is reachable from the room header in one tap on a phone (an "Activity" item in the room
  overflow is not sufficient as the only path, per the visible-primary-navigation rule).
- Pull-to-refresh works on the log, and a Refresh item also exists in the screen overflow (SC 2.5.1
  and the shortcut-not-mechanism rule).
- Filter chips are operable with a keyboard and an external keyboard on a tablet, with a visible focus
  ring that is never obscured by the sticky rail (SC 2.4.11).

**Edge cases & negative paths**

- A room with zero activity beyond its creation: the log shows the single creation entry and an
  explanatory line, not an empty screen.
- An entry whose target was deleted: "Go to item" is absent and the sheet says "This item was deleted
  on 3 Aug 2026", with a link to the trash entry if it is still restorable.
- Filter combination that would scan the whole partition (no room filter, 12-month range, no action
  filter, on a room with 100,000 events): the API caps the range at 90 days per request and the UI
  states "Showing the last 90 days. Narrow the filters or export to CSV for more."
- Clock skew on the device making an event appear in the future: the UI clamps display to "just now"
  and never renders a future relative time.

---

### US-E11-03 — Scoped log for a folder or a single file

**As a** P4 Ashley Kim who suspects a file was moved by mistake **I want** the activity for just that
folder or file **so that** I can answer "what happened to this" without reading the whole room.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E11-02 |
| Traces to | FR-AUDIT-003, FR-AUDIT-013, NFR-PERF-026, NFR-SCALE-014, BR-042, BR-046 |

**Acceptance criteria**

1. **Given** a file's details sheet **when** the user taps "Activity" **then** the log opens filtered
   to that node id, with the filter shown as a removable chip naming the file.
2. **Given** a folder's details sheet **when** the user taps "Activity" **then** the log opens filtered
   to that folder **and** its descendants, and the chip states "In Financials and subfolders" with a
   toggle for "This folder only".
3. **Given** the descendant-scoped query **when** it runs **then** it uses the materialised path prefix
   rather than a recursive walk, its p95 server time is <= 250 ms for a subtree of 2,000 nodes per the
   read class of NFR-PERF-026, and a filtered query on a room at the NFR-SCALE-014 ceiling stays within
   p95 <= 800 ms.
4. **Given** a scoped log **when** the user removes the chip **then** the screen becomes the full room
   log at the same date range, without a full page reload.
5. **Given** a node the caller cannot see **when** they request its scoped log by id **then** the
   response is `404 NOT_FOUND` with no discriminating detail, identical in body and timing to a
   genuinely missing id.
6. **Given** a scoped log **when** it is deep-linked (shared internally between two Managers) **then**
   the link resolves to the same filtered view for a caller with sufficient rights and to a 404 for
   anyone else.

**Mobile acceptance criteria**

- The "Activity" entry point exists in the row overflow and in the details sheet, both at least 48 CSS
  px tall; long-press alone is never the only route.
- Opening a scoped log from a details sheet closes the sheet first and pushes a new history entry, so
  Android back returns to the file rather than to a stacked sheet (one sheet at a time).
- The scope chip is truncated in the middle to keep the file extension visible and carries the full
  name as its accessible name.
- Returning from the scoped log to the folder restores the folder's scroll position per E10's place
  restoration.

**Edge cases & negative paths**

- Node moved between rooms (not supported in R1) or renamed several times: the scoped log shows entries
  under every historical name, each entry displaying the name at the time, with a one-line note "This
  item was renamed twice".
- Node purged: the scoped log is still reachable from the trash entry and from a notification deep
  link, and states "This item was permanently deleted on 3 Aug 2026".
- 0 events for a just-created file: the log shows the upload entry only.

---

### US-E11-04 — Who may read the log, enforced on the server

**As a** P1 Marcy Doyle **I want** only me and my Managers to see who read what **so that** a buyer can
never learn which other buyers are in the process.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E11-02 |
| Traces to | FR-AUDIT-012, NFR-SEC-015, NFR-SEC-016, NFR-SEC-017, BR-042, BR-046, BR-049, BR-121, BR-122 |

**Acceptance criteria**

1. **Given** any activity or analytics endpoint **when** it is called **then** authorisation is
   evaluated server-side per request against the caller's role on the scope, and only Owner and Manager
   roles receive data; Contributors, Viewers, invited guests and anonymous link visitors receive `404`
   for a scope they hold no manager grant on and `403 FORBIDDEN` where they hold some grant but not
   enough.
2. **Given** a Viewer or guest **when** the client renders a room **then** no Activity or Analytics
   affordance is shown, and hiding the affordance is explicitly **not** the enforcement: an API call
   crafted by hand returns the same refusal.
3. **Given** a Manager scoped to a subtree (folder-level manager) **when** they read the log **then**
   they see events for that subtree only, and events for sibling branches are absent rather than
   redacted, because a redacted row still leaks the existence of activity.
4. **Given** a share is revoked **when** the revoked principal's client requests the log mid-session
   **then** the request fails with `403 SHARE_REVOKED` within one request cycle, and the client
   replaces the screen with the revoked full-screen state rather than continuing to show cached rows.
5. **Given** an ownership transfer **when** it completes **then** the new owner sees the full historical
   log including events from before the transfer, and the previous owner loses access to it at the same
   instant.
6. **Given** an account-level security event (a sign-in from a new device) **when** it is read **then**
   it is visible only to the account holder, never to Managers of a room, because it is account data and
   not room data.
7. **Given** a penetration test scenario **when** a Viewer's session token is used against every
   activity and analytics endpoint including CSV export **then** every call is refused, and the refusals
   themselves are recorded as `access-denied` events (US-E11-06).

**Mobile acceptance criteria**

- A recipient's room screen has no dead Analytics tab, no greyed-out Activity row and no lock icon
  teasing an upsell; the surface simply is not there, so a 360 px screen is not spent on unavailable
  features.
- If a role changes while the log is open (Manager demoted to Viewer), the next scroll page returns 403
  and the screen shows "Your access to this room changed." with a single "Go to room" action, not a
  console error or a stuck spinner.
- The refusal path is verified with a screen reader: the state change is announced once assertively,
  because the user needs to know their view is no longer available.

**Edge cases & negative paths**

- Manager of room A guessing an activity URL for room B: `404`, identical timing, and a security event
  is recorded on room B's log naming the actor.
- A share link with a `manager` role (not offered in the product): impossible by contract; the role
  enum for link-based access excludes manager, asserted in a contract test.
- A Manager reading the log of a room whose owner deleted their account: the log remains readable during
  the retention window with anonymised actor labels for the deleted owner.

---

### US-E11-05 — Attribution for anonymous link visitors, labelled unverified

**As a** P6 Ray Okonkwo who publishes an offering package by public link **I want** to distinguish
"someone via link" from "the CPA I invited" **so that** I do not treat an anonymous open as a
verified identity.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E11-01 |
| Traces to | FR-AUDIT-007, FR-AUDIT-002, NFR-PRIV-001, NFR-PRIV-009, NFR-PRIV-011, BR-042, BR-117 |

**Acceptance criteria**

1. **Given** activity by an anonymous public-link visitor **when** it is recorded **then** it is
   attributed to the link token id, to the captured email address if an email-capture gate collected
   one, and to a stable pseudonymous visitor id derived per (link, device) so repeated visits by the
   same device group together.
2. **Given** such an entry **when** it is displayed **then** it is explicitly labelled unverified:
   "Unverified visitor via link Buyer A" or "dev@example.com (unverified) via link Buyer A", and the
   word unverified is never omitted for brevity.
3. **Given** an invited guest with an email-bound magic link **when** their activity is recorded **then**
   it is attributed to the invited email address and is **not** labelled unverified, because the invite
   proved control of the mailbox.
4. **Given** an anonymous visitor who later signs up with the same verified email **when** the claim
   completes (per [E01](./epic-01-access-and-identity.md) US-E01-17) **then** historical entries keep
   their original unverified label and a note "later verified as Dev Raman" is added to the entry
   detail; history is never rewritten.
5. **Given** the pseudonymous visitor id **when** it is derived **then** it uses an HMAC over a
   rotating salt and stable client signals, contains no IP address and no raw fingerprint, and cannot
   be reversed by anyone reading the log.
6. **Given** the same public link opened by two different people on two devices **when** the log is
   read **then** they appear as two distinct pseudonymous visitors, and the UI states plainly in the
   analytics help text that a link can be forwarded and that visitor counts are device-based, not
   person-based.
7. **Given** an email-capture gate **when** the visitor supplies an address **then** the address is
   recorded and displayed but is never treated as verified for any authorisation decision.

**Mobile acceptance criteria**

- The unverified label renders as a distinct chip on line one of the log row at 360 px, does not push
  the actor label off screen, and is part of the row's accessible name rather than a colour cue.
- At 200% text size the label wraps below the actor name rather than being truncated away, because
  losing "unverified" changes the meaning of the row.
- The analytics help text explaining forwarded links is reachable in one tap from the analytics screen
  header and opens in a sheet, not an external page.

**Edge cases & negative paths**

- A visitor using a privacy browser that suppresses the signals used for the pseudonymous id: each
  visit appears as a new visitor, and the help text says so ("Some visitors cannot be grouped across
  visits").
- Captured email that is obviously fake ("a@a.a"): recorded verbatim, displayed with the unverified
  label, never validated into legitimacy. The gate is an accountability speed bump, not authentication.
- Link password entered correctly by an anonymous visitor: still unverified. A password proves knowledge
  of a secret, not identity.

---

### US-E11-06 — Denials and permission changes in the log, with before and after

**As a** P1 Marcy Doyle **I want** to see refused attempts and every permission change with its old and
new value **so that** I can reconstruct exactly who could see what on any given day.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E11-01 |
| Traces to | FR-AUDIT-008, FR-AUDIT-009, NFR-COMPL-001, NFR-SEC-026, NFR-OBS-011, BR-049, BR-120, BR-232 |

**Acceptance criteria**

1. **Given** any refused access to a room or item **when** the refusal happens **then** an
   `access-denied` event is written carrying the refusal reason code (`SHARE_REVOKED`, `SHARE_EXPIRED`,
   `SHARE_PASSWORD_INCORRECT`, `DOWNLOAD_NOT_PERMITTED`, `READ_ONLY_SHARE`, `NOT_FOUND`,
   `SHARE_VIEW_LIMIT_REACHED`), the attempted scope where it is safe to name it, and the actor or
   pseudonymous visitor.
2. **Given** a refusal on a scope the caller has no grant on **when** the event is written **then** the
   event is attached to the **owner's** view of the room and names the attempted token or link rather
   than confirming to the caller that the scope exists; the refusal shown to the caller stays a
   featureless `404`.
3. **Given** any permission change (role assignment, download flag, link policy edit, expiry change,
   password set or cleared, revoke) **when** it commits **then** an event records the value before and
   the value after as structured metadata, so a role change is reconstructible without reading code.
4. **Given** the log row for a permission change **when** it renders **then** it reads in plain English:
   "Marcy Doyle changed Buyer A link from Viewer, downloads on to Viewer, downloads off".
5. **Given** a bulk permission change over 12 recipients **when** it commits **then** one event per
   affected grant is written and the log groups them under a single collapsed row ("Marcy Doyle changed
   access for 12 recipients") that expands to the individual entries.
6. **Given** five failed link-password attempts from one visitor within 10 minutes **when** they occur
   **then** each is recorded, the log collapses them into one row with a count, and a notification is
   raised to the owner per US-E11-13.
7. **Given** a share revocation **when** it is recorded **then** the event states whether any session
   was active at the time and how many, so an owner can tell whether the revocation interrupted a read
   in progress.

**Mobile acceptance criteria**

- A before/after change renders on two lines at 360 px using an arrow glyph with an accessible name of
  "changed to", never as a raw JSON diff.
- The collapsed group row is expandable by tap on a 48 CSS px control with `aria-expanded`, and
  expanding it does not lose the scroll position of the log.
- The "Denied" filter chip is present in the rail on the first screen, because refused attempts are
  what an owner actually goes looking for after a scare.
- Screen reader announces the denial reason as part of the row, not as a colour or icon only.

**Edge cases & negative paths**

- A denial storm (a bot hammering a revoked link 500 times): events are rate-collapsed into windowed
  rows with counts, retaining the first and last timestamp, and never allowed to bury real activity.
- A permission change that fails midway through a bulk apply: only the grants that actually changed are
  logged, and the failure is logged as a separate system event with the partial-failure counts.
- A refusal caused by our own outage (`503 DEPENDENCY_UNAVAILABLE`): recorded as a system event, not as
  an `access-denied`, because it is not a permission fact and must not read like one in an audit.

---

### US-E11-07 — View sessions and honest dwell measurement

**As a** P1 Marcy Doyle **I want** to know a buyer actually read the CIM rather than just opened it
**so that** I can judge real interest and follow up at the right moment.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E11-01 |
| Traces to | FR-AUDIT-004, FR-AUDIT-002, NFR-PRIV-010, NFR-COMPL-001, NFR-PERF-030, NFR-SEC-012, NFR-AVAIL-001, BR-042, BR-108 |

**Acceptance criteria**

1. **Given** a file preview is opened **when** the viewer mounts **then** the client calls
   `POST /api/rooms/:roomId/view-sessions` with the node id, the version id and an idempotency key, and
   the server creates a `ViewSession` pinned to the version so analytics survive a version bump.
2. **Given** an open view session **when** the document is in the foreground **then** the client sends a
   heartbeat every 15 seconds carrying `activeMs` deltas, and it stops immediately on `visibilitychange`
   to hidden, so background time is never counted as reading time.
3. **Given** the app is backgrounded or the tab is discarded **when** the last heartbeat ages beyond 45
   seconds **then** the server closes the session with `endReason: 'heartbeat_timeout'`, sets
   `isTruncated: true`, and every display of its dwell is prefixed "at least" because it is a lower
   bound.
4. **Given** a clean close **when** the user leaves the viewer **then** the client sends a final
   heartbeat with `endReason: 'closed'` or `'navigated'` using `sendBeacon` on `pagehide`, so a normal
   mobile exit produces an accurate session rather than a truncated one.
5. **Given** dwell values **when** they are computed **then** only foreground time counts, the maximum
   single heartbeat delta accepted is 20 seconds (rejecting a client claiming 4 hours), and total
   `activeMs` cannot exceed wall-clock time between `startedAt` and `endedAt`.
6. **Given** a share is revoked mid-read **when** the next request or heartbeat arrives **then** the
   server refuses it, and every subsequent request is refused within 5 seconds of the revocation
   committing (NFR-SEC-012, BR-108); the open viewer therefore closes to the revoked state on its next
   heartbeat, at most 15 seconds later, and the session is closed with the reason recorded.
7. **Given** a `document_opened` event **when** it is written **then** it is a distinct log entry from
   the view session record, so the log reads chronologically while the analytics aggregate reads by
   viewer and document.
8. **Given** an anonymous link visitor **when** they read **then** the view session records
   `viewerType: 'anonymous_link'` with the pseudonymous visitor id and the captured email if any, per
   US-E11-05.
9. **Given** the reference device on a flaky 4G link **when** heartbeats fail **then** they are queued
   (max 10) and flushed on the next successful request, and a queued heartbeat older than 5 minutes is
   dropped rather than inflating a later session.

**Mobile acceptance criteria**

- Heartbeats cost <= 400 bytes each and are never sent while the document is hidden, so a phone in a
  pocket generates no traffic and no dwell is recorded.
- Opening a document, locking the phone for 5 minutes, unlocking and reading for 30 more seconds
  produces a session whose `activeMs` is approximately 30 seconds plus the pre-lock time, verifiable by
  a QA engineer with a stopwatch and the analytics screen.
- Switching apps to answer a call and returning within 45 seconds resumes the same session rather than
  starting a second one; beyond 45 seconds a new session starts and the analytics UI shows two sessions
  rather than merging them silently.
- Heartbeats never delay a page render or a scroll; they are sent from an idle callback and use
  `keepalive`.
- With a screen reader on, nothing about view-session tracking is announced to the reader; it is
  invisible instrumentation, and the disclosure is handled once by US-E11-11.

**Edge cases & negative paths**

- Client with a manipulated clock or a hand-crafted heartbeat: server-side clamping rejects impossible
  deltas and records `clock_skew_ms`; an account producing repeated impossible values is flagged
  internally, and its analytics are marked as suspect rather than silently trusted.
- Document opened in two tabs simultaneously: two sessions, both counted, and the analytics screen shows
  them separately with a note in the help text ("A viewer with two tabs open appears twice").
- Preview fails to render (unsupported type): a `document_opened` event is still written with
  `preview_path: 'unsupported'` and no view session is created, so an unsupported type never appears as
  a zero-second read.
- Offline read of a cached preview: dwell is captured locally, capped at 30 minutes per document, and
  submitted on reconnection with `occurredAt` preserved and a "recorded offline" flag on the session.

---

### US-E11-08 — Download tracking, never conflated with previewing

**As a** P6 Ray Okonkwo **I want** downloads recorded separately from views **so that** "who took a copy
of the rent roll" is a question with an exact answer.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E11-01, US-E11-07 |
| Traces to | FR-AUDIT-006, FR-AUDIT-002, NFR-COMPL-001, NFR-SEC-014, NFR-MOB-022, BR-040, BR-110, BR-111 |

**Acceptance criteria**

1. **Given** a download of a file **when** the signed URL is minted **then** a `download` event is
   written at mint time carrying the node id, version id, actor, access path and byte size, and the
   preview and download counters are separate fields that are never summed into a single "accesses"
   number anywhere in the product.
2. **Given** a bulk zip download **when** it is requested **then** one `download` event per included
   file is written plus one grouping event naming the selection size, so per-file accountability is
   preserved.
3. **Given** a download attempt by a principal whose share has `canDownload: false` **when** the
   request is made **then** the server refuses with `403 DOWNLOAD_NOT_PERMITTED`, writes an
   `access-denied` event with that reason, and the client keeps the viewer open and offers "ask the
   owner", which raises a notification.
4. **Given** the log **when** it displays a download **then** the row reads "Dev Raman downloaded
   Lease 2025.pdf (2.4 MB)" and is visually distinct from a view row, with the distinction carried in
   text rather than by icon alone.
5. **Given** a signed URL is minted but the transfer never completes **when** the log is read **then**
   the event states that a download was started, because the server cannot observe completion; the
   copy is "downloaded" only where a completion signal exists and "download started" otherwise, and
   this distinction is documented in the analytics help text.
6. **Given** a re-download of the same file by the same principal **when** it happens **then** it is a
   separate event with its own timestamp; downloads are never deduplicated, because "they took a second
   copy after we told them the deal was off" is exactly the fact an owner needs.

**Mobile acceptance criteria**

- On iOS the app never claims to know where the file landed; the copy is "Saved to your Downloads
  folder (Files app)", because the page is never told the path and Safari routes downloads to a
  Downloads folder that defaults to iCloud Drive
  ([Apple Support](https://support.apple.com/en-us/102440)).
- The download row's byte size is formatted with `formatBytes` from `@dataroom/shared` and fits on one
  line at 360 px.
- The "Downloads" filter chip is available in the log rail on the first screen at compact width.
- A download refusal is announced once assertively by a screen reader with the reason, not merely
  visually.

**Edge cases & negative paths**

- A download link forwarded to a third party: the signed URL is short-lived and single-scope, and the
  event names the principal who minted it, with a note that a signed URL is bound to that grant. The
  help text states that a downloaded file itself cannot be tracked further, because that is the truth.
- Download during a revocation race: if the revoke commits before the mint, the mint fails and the
  denial is logged; if the mint already happened, the URL's remaining lifetime is capped at 60 seconds
  and the event records that the grant was revoked after minting.
- Malware-blocked file: no download event, an explicit `MALWARE_DETECTED` system event, and the owner is
  notified.

---

### US-E11-09 — Per-file viewer analytics on a phone

**As a** P1 Marcy Doyle **I want** one screen per document telling me who opened it and for how long
**so that** I can rank my buyers by real engagement from a car park.

| | |
|---|---|
| Priority | Must |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E11-07, US-E11-04 |
| Traces to | FR-AUDIT-004, FR-AUDIT-012, NFR-A11Y-011, NFR-PERF-026, NFR-PRIV-010, BR-042, BR-117 |

**Acceptance criteria**

1. **Given** a file **when** a Manager opens its Analytics screen **then** it shows total distinct
   viewers, total sessions, total active time, the last opened time, and a ranked list of viewers by
   active time descending, each row showing identity or unverified label, session count, total active
   time and completion percentage.
2. **Given** a viewer row **when** it is tapped **then** a sheet lists that viewer's individual
   sessions with start time, active time, completion percentage, truncation flag, device class and
   network class.
3. **Given** completion percentage **when** it is computed **then** it is `pages with >= 2 s dwell /
   page count` and its definition is stated in the UI on the same screen, because an undefined
   percentage is a number nobody can act on.
4. **Given** viewer analytics is an R2 capability **when** it is requested in a build that does not yet
   have it **then** the client states plainly that it is not available yet, with no fake data behind a
   blur and no gate implying it could be unlocked by anything other than shipping it.
5. **Given** a room with 12 recipients and 300 sessions **when** the screen loads **then** it loads in
   under 1.5 s at p75 on the reference device, using pre-aggregated rollups rather than scanning raw
   sessions at request time.
6. **Given** an owner comparing recipients **when** they sort **then** sort options are active time,
   last opened, completion and download count, and the current sort is stated in text in the header.
7. **Given** a truncated session **when** it contributes to a total **then** the total is labelled "at
   least 6m 20s" and a footnote explains that phone sessions that end without a clean close are
   measured as a lower bound.
8. **Given** a revoked recipient **when** analytics are read **then** their historical sessions remain
   visible with a "access revoked 3 Aug" marker, because revoking access does not erase what happened.

**Mobile acceptance criteria**

- The screen is a list, never a table: at 360 px each viewer row is at least 64 CSS px tall with the
  identity on line one and the three numbers on line two, with no horizontal scroll (SC 1.4.10).
- Any chart present has a text equivalent adjacent to it in the DOM (a definition list of the same
  values), and the chart itself is `aria-hidden`; a chart is never the only representation.
- Numbers use short mobile formats ("6m 20s", "78%") and remain unambiguous at 200% text size.
- The sort control is a bottom sheet with at most six options, each at least 48 CSS px tall, opened from
  a visible button in the header rather than from a hidden gesture.
- The screen is reachable in two taps from the file row (overflow, then Analytics) and one tap from a
  "document viewed" notification.

**Edge cases & negative paths**

- File never opened: an empty state reading "No one has opened this yet. Share it or send a reminder."
  with the share action inline, rather than a chart with zero bars.
- 500 distinct anonymous visitors on a public link: the list is cursor-paged and the header states
  "500 visitors, mostly unverified", and the help text explains link forwarding.
- Analytics requested for a folder rather than a file in R2: not supported; the folder details sheet
  links to the room-level analytics summary instead, and the limitation is stated rather than silently
  missing.
- A single session of 4 hours from a desktop left open: flagged as an outlier in the row ("session left
  open") and excluded from median-based summaries, with the exclusion stated.

---

### US-E11-10 — Page-level dwell for documents

**As a** P6 Ray Okonkwo **I want** to know which pages a buyer actually spent time on **so that** I can
tell whether they read the financials or only looked at the photos.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E11-09 |
| Traces to | FR-AUDIT-005, FR-AUDIT-004, NFR-A11Y-007, NFR-A11Y-011, NFR-PRIV-010, NFR-SCALE-014, BR-042 |

**Acceptance criteria**

1. **Given** a paginated document preview **when** a page is visible in the foreground for at least 1
   second **then** the client accumulates dwell against that page number and reports it in the
   heartbeat as a `pageDwell` delta map.
2. **Given** `pageDwell` **when** it is stored **then** it is capped at 2,000 keys per session so one
   pathological document cannot bloat a row, and `maxPageReached` is recorded separately.
3. **Given** the page analytics view **when** it renders on a phone **then** it shows a compact
   per-page bar strip plus a ranked list of the top pages by dwell, each list row naming the page
   number, the dwell and the share of the session.
4. **Given** the strip **when** a screen reader is active **then** the strip is `aria-hidden` and the
   ranked list is the accessible representation, with a summary sentence ("Most time on page 9, 1m 12s
   of 3m 20s") in a live region on load.
5. **Given** two viewers **when** the owner compares them **then** each viewer's page profile is
   reachable from their row in US-E11-09, and no cross-viewer average is presented as an individual
   fact.
6. **Given** a document with a single page or an image **when** analytics are shown **then** the page
   strip is suppressed and only session-level dwell is shown, rather than a one-bar chart.
7. **Given** page dwell **when** it is measured on a phone **then** only the page occupying the majority
   of the viewport counts at any moment, so a fast scroll through 40 pages does not credit dwell to all
   of them.
8. **Given** the reference session shape in this market (about 23 seconds on page one and roughly 15
   seconds per page thereafter) **when** the UI scales its bars **then** the scale is chosen so a 15
   second bar is clearly visible rather than being flattened by one 5-minute outlier; the outlier is
   labelled instead.

**Mobile acceptance criteria**

- The page strip is at most 96 CSS px tall at 360 px width, scrolls horizontally only within its own
  container, and never causes the page body to scroll horizontally.
- Each bar has a minimum touch target of 24 CSS px with the spacing exception applied, and tapping a
  bar opens the ranked-list row for that page rather than requiring precise selection of a thin bar
  (SC 2.5.8).
- Pinch-zoom on the strip is not required for any information; every value is available in the ranked
  list (SC 2.5.1).
- At 200% text size the strip degrades to the ranked list only, and nothing is lost.

**Edge cases & negative paths**

- Client reports dwell for a page number beyond the document's page count: rejected server-side and
  recorded as a suspect payload; the session is retained without that key.
- Document re-versioned with a different page count: page dwell is version-pinned, and the analytics UI
  states which version each session read.
- Offline reading of pinned pages: page dwell is captured locally with the same 1-second rule and
  submitted on reconnect, flagged as recorded offline.
- A recipient who requests deletion of their viewing data: handled through the disclosure and rights
  path in US-E11-11, not by silently editing the log.

---

### US-E11-11 — Recipient disclosure: what is tracked about you

**As a** P3 Tomás Ferreira opening someone else's room **I want** to be told plainly what is recorded
about my reading **so that** I am not surprised later and the owner is not exposed to a complaint.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E11-07 |
| Traces to | FR-AUDIT-004, FR-AUDIT-007, NFR-PRIV-010, NFR-PRIV-002, NFR-PRIV-003, NFR-I18N-001, BR-042 |

**Acceptance criteria**

1. **Given** a recipient opens a shared room or file for the first time on a device **when** the first
   screen renders **then a** one-line disclosure is visible without scrolling: "The owner can see when
   you open documents and for how long." with a "What is recorded" link.
2. **Given** the "What is recorded" sheet **when** it opens **then** it states in plain language exactly
   what is captured (which documents were opened, when, for how long, page-level time, downloads, your
   country and device type) and exactly what is not (your precise location, your IP address as stored
   text, your other activity outside this room, anything about your device beyond its class and
   browser family).
3. **Given** the disclosure **when** the recipient dismisses it **then** it is not shown again on that
   device for that room, but the "What is recorded" link remains permanently available in the room
   header overflow.
4. **Given** an email-capture gate **when** the visitor supplies an address **then** the same disclosure
   is shown before the address is submitted, not after, and it states that the owner will see the
   address alongside their activity.
5. **Given** a data-subject request **when** a recipient asks what is held about them **then** the
   product has a documented path (support-mediated in R1) that can produce the recipient's own view
   sessions and events for that room, without exposing anyone else's.
6. **Given** the room owner **when** they view analytics **then** the same disclosure text is visible to
   them in the analytics help so they know what their recipients were told, which is what makes the
   feature defensible for them too.
7. **Given** a locale **when** the disclosure renders **then** it is a translatable string in the shared
   contract, not baked into a component, so it can be localised without a code change.

**Mobile acceptance criteria**

- The disclosure occupies at most 48 CSS px at 360 px width, sits below the header and above the
  content, and never blocks the first document from being tapped.
- It does not present as a consent gate: there is no OK button required to read, because a gate is the
  documented reason recipients abandon (P5 will simply pass).
- The "What is recorded" sheet opens at the medium detent, is dismissible by swipe-down, and preserves
  the reading position behind it.
- Screen reader announces the disclosure once politely on first render and does not repeat it on every
  navigation within the room.

**Edge cases & negative paths**

- A jurisdiction requiring explicit consent for analytics (recorded as OQ83): the design point is a
  per-room owner setting that turns the disclosure into a gate; R1 ships disclosure only and the gap is
  documented rather than assumed away.
- Recipient with JavaScript-blocked analytics: the disclosure still renders (it is server-rendered
  copy), and the absence of tracking data is shown to the owner as "not measured" rather than as zero
  seconds.
- Owner disables viewer analytics for a room (R2 setting): the disclosure text changes accordingly and
  the change is itself logged.

---

### US-E11-12 — Notification centre with unread state

**As a** P1 Marcy Doyle **I want** one inbox on my phone that tells me what happened across my rooms
**so that** the room becomes a habit rather than something I remember to check.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E11-01 |
| Traces to | FR-AUDIT-017, FR-AUDIT-022, FR-AUTH-027, NFR-PERF-002, NFR-A11Y-002, NFR-A11Y-011, NFR-SCALE-014, BR-046, BR-105 |

**Acceptance criteria**

1. **Given** `GET /api/notifications` **when** it is called **then** it returns cursor-paged
   notifications for the signed-in user across all their rooms, each with `kind`, server-rendered
   `title` and `body`, `deepLinkPath`, `collapseCount`, `state` and `createdAt`.
2. **Given** the notification kinds in R1 **when** they are enumerated **then** they include
   `access_requested`, `share_link_opened_first_time`, `document_viewed`, `download_taken`,
   `upload_by_other`, `invite_accepted`, `permission_denied_repeated`, `new_device_signin`,
   `quota_warning` and `governance_change`, with the last three sourced from
   [E01](./epic-01-access-and-identity.md) and
   [E12](./epic-12-account-storage-and-governance.md) respectively. `governance_change` covers a ceiling
   or retention window being changed, and a deprovisioning affecting rooms the recipient owns.
3. **Given** notifications are generated **when** more than one similar event occurs for the same user
   and room within 15 minutes **then** they collapse under a `dedupeKey` into one row with a
   `collapseCount` ("14 documents viewed in Riverside HVAC"), rather than producing 14 rows.
4. **Given** the notification centre **when** it renders **then** unread items are marked with a
   non-colour-only indicator, the tab bar badge shows the unread count, and `POST /notifications/read`
   marks one or all read.
5. **Given** a notification **when** it is rendered **then** its body never reveals content the
   recipient of the notification may not see: a `document_viewed` notification to an owner names the
   document, while any notification to a Contributor names only scopes they hold a grant on (BR-046).
6. **Given** a notification whose target has been deleted **when** it is tapped **then** the deep link
   resolves to the nearest surviving ancestor (the room) with an inline explanation, never to a dead
   screen.
7. **Given** a security event such as a sign-in from a new device **when** it is delivered **then** it
   appears in the centre, is delivered by email regardless of preferences, and cannot be muted (see
   US-E11-15).
8. **Given** 20,000 notifications over an account's life **when** the centre is opened **then** it is
   virtualised and cursor-paged with a bounded mounted-row count, and notifications older than 90 days
   (or 30 days after being read) are pruned per the retention model.

**Mobile acceptance criteria**

- The notification centre is a top-level destination in the bottom navigation bar (within the Material
  cap of three to five destinations), reachable with one thumb, not buried in a hamburger; hidden
  navigation costs a measured >20% drop in discoverability.
- Each row is at least 64 CSS px tall with the primary action as a distinct 48 x 48 CSS px control, so
  tapping the row (open) and tapping the action (approve, revoke) are not the same target.
- The unread badge is announced by a screen reader as "Notifications, 4 unread", and marking all read
  announces "All notifications marked read" once politely.
- At 360 px a collapsed row shows the count inline ("14 documents viewed") without truncating the room
  name to fewer than 12 characters.
- Pull-to-refresh is supported and a Refresh action also exists in the overflow.
- Opening the centre while offline shows cached notifications with the cached-copy label and no error.

**Edge cases & negative paths**

- 200 notifications generated by a bulk upload by a collaborator: collapsed to one row by dedupe key;
  the underlying events remain individually visible in the activity log, which is the correct place for
  granularity.
- A notification for a room the user has since left: the row remains but its deep link resolves to
  "You no longer have access to this room."
- Two devices marking the same notification read: idempotent; the second call is a no-op returning 204.
- Notification generation failure: the event is still in the activity log, so no information is lost;
  the failure is alerted internally.

---

### US-E11-13 — One-tap actionable notifications

**As a** P1 Marcy Doyle standing in a parking lot **I want** to approve, open or revoke straight from
the notification **so that** triage takes one tap instead of four screens.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E11-12 |
| Traces to | FR-AUDIT-018, FR-AUDIT-022, NFR-A11Y-005, NFR-A11Y-022, NFR-SEC-012, NFR-SEC-029, BR-045, BR-106, BR-108, BR-121 |

**Acceptance criteria**

1. **Given** a notification with an available action **when** it renders **then** it carries exactly one
   primary action button: `access_requested` gets Approve (with Deny in the row overflow),
   `document_viewed` gets Open document, `permission_denied_repeated` gets Revoke link,
   `quota_warning` gets Request more space, `governance_change` gets See what changed.
2. **Given** the primary action is tapped **when** it executes **then** the action completes without
   leaving the notification centre where it is safe to do so, the row updates in place to its resolved
   state ("Approved, Dev Raman can now view Financials"), and a toast with Undo appears where the
   action is reversible.
3. **Given** Approve on an access request **when** it executes **then** the server re-evaluates the
   caller's authority at execution time; a notification is never a bearer of authority, and a stale
   notification whose grant the user no longer holds fails with `403 FORBIDDEN` and an explanatory row
   state.
4. **Given** Revoke from a notification **when** it is tapped **then** it is a consequential action, so
   a confirmation sheet states the exact consequence ("Buyer A link will stop working immediately for
   everyone who has it. 1 person is reading right now.") with Revoke and Cancel, and the destructive
   option is styled destructive.
5. **Given** a revocation executed from a notification **when** it commits **then** it takes effect in
   the authoritative store inside the request that performs it (BR-106), every subsequent request is
   refused within 5 seconds (NFR-SEC-012, BR-108), an in-flight streamed download terminates within 30
   seconds, an active reader sees the "This link no longer works." full-screen state on its next
   heartbeat, and the revocation is logged with the active-session count (BR-120).
6. **Given** an action requires step-up authentication **when** it is tapped **then** the step-up
   prompt appears, and on success the original action is retried once automatically, so the user is not
   made to find the notification again.
7. **Given** a notification whose action has already been taken elsewhere **when** the user taps it
   **then** the row shows "Already approved by you on another device" rather than performing the action
   twice.
8. **Given** telemetry **when** an action is completed from a notification **then** it records the
   surface, feeding the share-of-revocations-initiated-from-a-notification measure that tells us
   whether triage-first works.

**Mobile acceptance criteria**

- The primary action control is at least 48 x 48 CSS px with 8 CSS px separation from the row's own tap
  target, positioned on the trailing edge within one-handed reach at 360 px.
- The confirmation sheet for a destructive action follows the action-sheet constraints: at most four
  buttons including Cancel, no scrolling, destructive option visually prominent, Cancel at the bottom.
- Executing an action while offline queues nothing for permission changes: the row shows "You need to
  be online to change access" and the action stays available. Non-permission actions (mark read) queue
  normally.
- After executing an action, focus stays on the row and the resolved state is announced once
  assertively; focus is never dumped to the top of the list.
- Haptic feedback fires on a committed destructive action where the platform exposes vibration.

**Edge cases & negative paths**

- Approve tapped twice quickly: idempotency key means one grant, one event, and the second tap resolves
  to the same result rather than creating a duplicate grant.
- The requester's account was deleted between the request and the approval: "That person's account no
  longer exists." and the row is archived.
- Revoke tapped on a link that already expired: "This link had already expired." and the row resolves
  without an error toast.
- A notification action that would exceed an administrator-set ceiling (approving a guest beyond the
  guest-count ceiling of BR-236): `403 ACCOUNT_LIMIT_REACHED` with the figure and its source named and an
  Request more space action, and no partial grant is created.

---

### US-E11-14 — First-open notification to the owner

**As a** P1 Marcy Doyle who just sent a link **I want** to know the moment the buyer opens it **so
that** I can call them while the document is still on their screen.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E11-12, US-E11-07 |
| Traces to | FR-AUDIT-022, FR-AUDIT-017, NFR-PRIV-010, NFR-AVAIL-001, BR-105, BR-046 |

**Acceptance criteria**

1. **Given** a share is opened for the first time by a principal **when** the access is authorised
   **then** a notification is generated for the Owner and every Manager of the shared scope within 60
   seconds of the open, stating who (or "an unverified visitor via link Buyer A") and what.
2. **Given** subsequent opens by the same principal **when** they occur **then** they do not generate a
   first-open notification; they collapse into the periodic `document_viewed` notifications instead.
3. **Given** the notification **when** it renders **then** it carries the elapsed time since the share
   was created ("opened 6 minutes after you shared it"), because that latency is the signal a broker
   acts on.
4. **Given** multiple Managers **when** the notification is delivered **then** each receives their own
   copy with their own read state, and one Manager reading it does not mark it read for the others.
5. **Given** the room is muted by a given Manager **when** the notification is generated **then** it
   still appears in that Manager's notification centre but produces no push and no email, per the mute
   semantics in US-E11-15.
6. **Given** the open happened while the owner was offline **when** the owner next opens the app
   **then** the notification is present with its original timestamp, not the sync timestamp.

**Mobile acceptance criteria**

- The notification body fits within 120 characters for the title and 300 for the body so it renders
  fully in an OS push banner without truncation losing the actor or the object.
- The row's primary action is "Open document", which lands directly in the document the recipient
  opened, not on the room home.
- Delivery latency from open to visible notification is <= 60 seconds at p95 measured end to end,
  reported as an operational metric.

**Edge cases & negative paths**

- A crawler or link preview bot fetching the URL: bot requests are classified and excluded from
  first-open notifications and from analytics, and the classification rule is documented; a
  misclassified open is recoverable because the raw event is still in the log.
- Owner opens their own share link: no notification, because self-views are excluded from viewer
  analytics and from notifications, and the exclusion is stated in the analytics help text.
- 30 recipients opening within a minute of a bulk send: collapsed into one notification with a count
  and a "See who" action that opens the room analytics.

---

### US-E11-15 — Per-room notification preferences and mute

**As a** P4 Ashley Kim supporting three brokers **I want** to mute the noisy room and keep the two that
matter **so that** I can keep notifications on at all instead of turning them off entirely.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E11-12 |
| Traces to | FR-AUDIT-021, FR-AUDIT-017, NFR-A11Y-002, NFR-A11Y-011, NFR-MOB-019, BR-196, BR-217 |

**Acceptance criteria**

1. **Given** `PUT /api/rooms/:roomId/notification-prefs` **when** it is called **then** it sets, per
   room and per user, the enabled event classes and the per-channel delivery (in-app, push, email) plus
   an all-off mute, and the same preferences apply to every channel consistently.
2. **Given** a muted room **when** events occur **then** in-app notifications are still recorded (so the
   centre remains a complete record) but are marked muted and excluded from the unread badge, and no
   push or email is sent.
3. **Given** account-level defaults **when** a new room is created or joined **then** it inherits the
   account default, and the room-level setting overrides it; the settings screen states which value is
   inherited and which is overridden.
4. **Given** security and governance notifications **when** preferences are applied **then**
   `new_device_signin`, `governance_change` and `quota_warning` at the blocking threshold are **not
   mutable** and are always delivered by email; the settings UI shows them as always-on with a stated
   reason rather than as a toggle that silently does nothing.
5. **Given** the mute control **when** it is used from the room overflow **then** it offers Mute for 8
   hours, Mute for a week and Mute until I turn it back on, and the current mute state with its expiry
   is visible on the room card and in room settings.
6. **Given** a mute expires **when** the next event occurs **then** delivery resumes with no summary
   backfill of the muted period beyond what is already in the notification centre.
7. **Given** the opt-out rate **when** it is monitored **then** users muting a room or disabling a
   channel divided by users receiving at least one notification is tracked as M53 with a ceiling of
   12%, because burning notification permission to move an engagement number destroys the channel
   permanently and on iOS it cannot be re-requested without the user going into settings.

**Mobile acceptance criteria**

- Every toggle is at least 48 CSS px tall with 8 CSS px separation and is labelled with visible text
  whose wording is contained in its accessible name (SC 2.5.3).
- The preferences screen is one scope per sheet with an explicit Apply, not a set of inline accordions
  whose submission scope is ambiguous; grouped sections carry headers.
- Changing a toggle announces the new state once politely and does not move focus (SC 4.1.3).
- The mute control is reachable from the room header overflow in one tap and from the room settings
  screen, so it is not a gesture-only capability.
- At 200% text size no toggle label truncates and no row's control moves off screen.

**Edge cases & negative paths**

- Preferences changed on one device: propagate to others within 60 seconds, and a conflicting
  simultaneous change resolves last-write-wins with the resulting state shown, never silently merged.
- User mutes every room and then complains about missing an access request: the always-on classes and
  the email guarantee are stated on the mute confirmation ("Security and storage alerts still come by
  email").
- Push disabled at the OS level while the app toggle says on: the settings screen reads the true
  permission state and displays "Blocked in your browser or system settings" with platform-specific
  guidance, never a toggle that lies.

---

### US-E11-16 — Web push, stated honestly per surface

**As a** P1 Marcy Doyle **I want** a push on my lock screen when something needs me **so that** I do not
have to remember to open the app, and **I want** to be told plainly when my phone cannot do that.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E11-12, US-E11-15 |
| Traces to | FR-AUDIT-019, FR-MOB-045, FR-MOB-042, FR-MOB-043, NFR-MOB-019, NFR-MOB-009, NFR-MOB-010, NFR-COMPAT-001, NFR-PRIV-012 |

**Acceptance criteria**

1. **Given** `PUT /api/me/push-subscriptions` **when** a subscription is registered **then** it is
   stored against the `DeviceSession` with its `installSource`, and a per-device delivery result is
   recorded for every notification attempt including the reason for non-delivery.
2. **Given** permission is requested **when** the prompt appears **then** it is triggered only in
   response to a deliberate user action (tapping "Turn on notifications"), never on page load, and a
   pre-prompt explains what will be sent and how to turn it off.
3. **Given** an iOS device **when** the app is running in a Safari tab **then** the push toggle is
   shown as unavailable with the exact reason and the exact remedy ("Add this app to your Home Screen
   to get notifications on iPhone. Tap Share, then Add to Home Screen."), because web push on iOS works
   only for Home Screen web apps.
4. **Given** an iOS Home Screen web app **when** push is enabled **then** notifications are delivered
   and the app badge is updated with the unread count using the Badging API.
5. **Given** an Android or desktop browser supporting web push **when** push is enabled **then**
   delivery works in a browser tab without installation, and the settings screen states that difference
   rather than presenting one universal claim.
6. **Given** a push payload **when** it is composed **then** it contains only what the notification
   centre would show, never document content beyond the title, and it deep-links to the same
   `deepLinkPath` so tapping it lands on the actionable row.
7. **Given** a push subscription becomes invalid (`410 Gone` from the push service) **when** delivery
   fails **then** the subscription is deleted, the device row updates to "notifications off on this
   device", and the user is not left believing they are covered.
8. **Given** any notification class an owner must not miss **when** push is unavailable on their surface
   **then** email is sent instead, so a capability gap never becomes a missed access request.

**Mobile acceptance criteria**

- The install-teaching flow is in-product and platform-specific, and no install button is shown on a
  platform that provides no install prompt; on iOS the steps name the Share menu explicitly.
- The permission prompt is preceded by a sheet whose primary button is within thumb reach at 360 px and
  whose Cancel is equally reachable, and declining never re-prompts automatically in the same session.
- The settings screen lists this device's true state ("iPhone, Home Screen app: on", "iPhone, Safari
  tab: not available", "Pixel, Chrome: on") so a user with several devices can see where they will and
  will not get alerts.
- A delivered push tapped from the lock screen opens directly to the actionable notification row with
  its primary action visible without scrolling.
- With a screen reader on, the unavailable toggle is announced as "Notifications, unavailable on this
  surface, button, double tap to learn how" rather than as a disabled control with no explanation.

**Edge cases & negative paths**

- User adds the site to the Home Screen but never opens it from there: push cannot be enabled; the app
  detects `display-mode: browser` and keeps the explanation accurate.
- OS-level Do Not Disturb or focus mode: delivery is the OS's decision; the product records the send
  attempt and does not claim delivery.
- Home Screen web app whose storage was evicted after seven days of no interaction: the push
  subscription may be lost; on next open the app re-registers silently and, if it cannot, shows the
  toggle as off with the reason.
- Push service outage: notifications remain in the centre, email fallback covers must-not-miss classes,
  and the operational alert names the affected provider.

---

### US-E11-17 — Email digests and the guaranteed channel

**As a** P1 Marcy Doyle who reads email at 6am **I want** a once-a-day summary per room **so that** I
start the day knowing what moved without opening the app.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E11-15 |
| Traces to | FR-AUDIT-020, FR-AUDIT-021, NFR-COMPAT-008, NFR-I18N-007, NFR-I18N-010, NFR-AVAIL-001, BR-217 |

**Acceptance criteria**

1. **Given** per-room notification preferences **when** the user chooses a digest **then** the options
   are immediate, hourly, daily, weekly and off, and the chosen frequency applies to email only;
   in-app notifications remain immediate.
2. **Given** a digest bucket **when** it is assembled **then** it groups by room and then by class
   ("4 documents viewed, 1 download, 2 uploads"), names the top three items, and links each to its
   deep link; it never includes document contents or thumbnails of documents the recipient could not
   otherwise see.
3. **Given** a digest with nothing in it **when** the schedule fires **then** no email is sent, because
   an empty digest teaches people to ignore the sender.
4. **Given** digest send times **when** they are chosen **then** the user picks a local delivery hour
   with a default of 07:00 in their timezone (Assumption: chosen because the target personas are online
   early, with the 6am and 10pm windows documented in Microsoft's 2025 Work Trend Index), and the
   timezone used is stated in the email footer.
5. **Given** any email in this epic **when** it is sent **then** it renders legibly on a 360 px phone
   screen in a single column with a tappable primary link at least 48 CSS px tall, has a plain-text
   alternative, and carries a working one-tap unsubscribe for non-essential classes.
6. **Given** security and governance classes **when** digest settings are applied **then** they bypass
   the digest and are sent immediately, because they are the guaranteed channel.
7. **Given** the outbound email limits **when** digests and notifications are sent **then** they respect
   BR-217 (100 recipient addresses per day per account, and no more than 3 emails to the same recipient
   per room per day), and a suppressed send is visible in the notification centre rather than silently
   dropped.
8. **Given** email delivery failure (bounce, complaint) **when** it occurs **then** the address is
   marked, the in-app centre states "We could not email you at m@example.com", and repeated hard
   bounces suspend email for that address without suspending the account.

**Mobile acceptance criteria**

- The digest email's first 90 characters (the mobile preview line) carry the room name and the headline
  count, because that is all a phone shows in the inbox list.
- Every link in the email resolves into the app on a phone, opening the installed PWA where the platform
  supports it and the browser otherwise, landing on the exact deep link with no interstitial.
- The email renders with a 16 px minimum body font and no fixed-width table wider than 320 px.
- No image is required to understand the email; images are decorative and the content survives image
  blocking.

**Edge cases & negative paths**

- Timezone change while travelling: the next digest uses the current device timezone, and the footer
  states which timezone was used so a 07:00 email arriving at 11:00 local is explainable.
- A room generating 4,000 events in a day: the digest caps its itemisation at ten lines and links to
  the full log, rather than sending a 4,000-line email.
- Corporate mail filter stripping links: the plain-text alternative includes the full URL, and the
  in-app centre remains the complete record.
- User with digest set to weekly who is then invited to a time-critical room: the invite itself is
  immediate and is not subject to the digest, because an invitation is not activity.

---

### US-E11-18 — Audit CSV export, retention statement and rate limit

**As a** P1 Marcy Doyle closing a deal **I want** to export the room's activity as a CSV **so that** I
can hand a complete record to my client's lawyer.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E11-02, US-E11-04 |
| Traces to | FR-AUDIT-015, FR-AUDIT-016, FR-AUDIT-024, NFR-COMPL-004, NFR-COMPL-005, NFR-SCALE-014, NFR-MOB-022, BR-042, BR-188, BR-195, BR-224 |

**Acceptance criteria**

1. **Given** `POST /api/rooms/:roomId/activity/export` **when** it is called by the room Owner **then**
   it accepts the currently active filters, returns `202` with a job id, and delivers a notification and
   an email with a time-limited download link when the file is ready.
2. **Given** the CSV **when** it is generated **then** it is streamed server-side with no server-side
   buffering, uses UTF-8 with a BOM so Excel opens non-ASCII names correctly, quotes every field, and
   has a stable documented column set: `occurred_at_utc`, `occurred_at_local`, `timezone`, `actor_type`,
   `actor_label`, `actor_verified`, `action`, `target_kind`, `target_name`, `target_path`, `share_label`,
   `country`, `device_class`, `bytes`, `reason_code`, `event_id`.
3. **Given** the export **when** it completes **then** an activity event records who exported what
   filters and how many rows, because an audit export is itself an auditable act.
4. **Given** the retention period **when** the export screen renders **then** it states the plan's
   retention ("Activity is kept for 24 months on your plan; export before then to keep it longer") and
   the export includes only rows inside retention, with the range stated in the file's first comment
   line and in the email.
5. **Given** the rate limit **when** another export is requested **then** the limit of 10 exports per
   account per day with 1 concurrent export job (BR-224) is enforced server-side, the response is `429`
   with `retryAfterSeconds` and a code naming which limit was hit (BR-222), and the UI states the limit
   and the time the next export becomes available rather than showing a bare spinner.
6. **Given** a large export (500,000 rows) **when** it runs **then** it completes as a background job
   with progress visible in the notification centre, and the download link is valid for 24 hours and
   single-account scoped.
7. **Given** a Manager rather than an Owner **when** they request an export **then** it is refused with
   `403 FORBIDDEN`, because export is owner-only, and the refusal is logged.
8. **Given** the exported file **when** it is downloaded on iOS **then** the UI says "Saved to your
   Downloads folder (Files app)" and does not claim to know or verify the path, because the page is
   never told where a download landed.

**Mobile acceptance criteria**

- The export flow is two taps from the log header (Export, then Confirm) with a confirmation sheet
  stating the row count, the date range and the filters in words before commit.
- No CSV is ever assembled in the browser: on a phone the memory ceiling is roughly 100 to 200 MB with
  no catchable exception, so a client-side export of 500,000 rows is a crash generator and is not
  implemented.
- Progress is shown in the notification centre and in an in-place status line, and backgrounding the app
  does not cancel the job because it runs on the server.
- The download link email is legible on a 360 px screen and its primary button is at least 48 CSS px
  tall.
- With a screen reader on, the completion notification announces "Activity export ready, 12,480 rows"
  once politely.

**Edge cases & negative paths**

- Export requested for a room with zero matching rows: refused before the job starts with "No activity
  matches those filters." rather than delivering an empty file.
- Download link opened after expiry: "This download link expired. Request the export again." with a
  one-tap re-request that does not consume an extra rate-limit slot if within 10 minutes of expiry.
- Export requested during a retention purge: the job pins its range at request time and the file's
  header states the exact window covered, so a purge cannot silently shrink a delivered export.
- Account read-only after a quota reduction, or placed on hold by an administrator: export remains
  available throughout (BR-204), because taking away someone's audit record over a storage or governance
  event is not acceptable.

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| Emission of the mutations themselves (create, rename, move, delete, upload, download); this epic defines the contract and consumes it | [E03](./epic-03-folder-hierarchy-and-navigation.md), [E04](./epic-04-file-operations.md) |
| Share semantics: link policy, roles, expiry, password, watermark, revocation mechanics and inheritance | [E07](./epic-07-sharing-and-access-control.md) |
| The document viewer itself, page rendering and the preview support matrix that page dwell is measured against | [E05](./epic-05-viewing-preview-and-file-details.md) |
| New-device detection, session listing and sign-out everywhere; this epic only surfaces the resulting event | [E01](./epic-01-access-and-identity.md) |
| Quota thresholds, the administrator-set ceilings and the governance events themselves; this epic carries them as notification classes | [E12](./epic-12-account-storage-and-governance.md) |
| Product analytics for our own decisions (funnels, activation, retention), which is a different concern from customer-facing audit | [Success metrics & analytics](../10-success-metrics-and-analytics.md) |
| Sheets, chips, live regions, toasts, haptics and the install-teaching flow as components | [E09](./epic-09-mobile-ux-foundations.md) |
| Virtualisation, cursor pagination and caching mechanics used by the log | [E10](./epic-10-performance-offline-and-scale.md) |
| Structured question-and-answer workflow with counterparties | Deferred to R3; recorded as OQ86 |
| Live "who is in the room right now" presence (FR-AUDIT-023, Could, R3) | Deferred within this epic; recorded as OQ87 |
| Watermarking and screenshot deterrence (they are share controls, not audit) | [E07](./epic-07-sharing-and-access-control.md), R2 |

## Open questions

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ81 | BR-195 sets activity retention at 24 months by default, administrator-configurable within 6 to 84 months. What figure should an administrator actually start from, given that an engagement can reopen 18 months later and that this table is the largest in the system? | Product + IT operations + Legal | Before R1 launch |
| OQ82 | Should viewer analytics be an R1 feature rather than R2? A10 in the product overview flags this as the sharpest assumption in the document: an engagement lead may not be willing to send documents outward at all without per-viewer analytics and watermarking. | Product + the staff who will use it | Sprint 4 |
| OQ83 | Which jurisdictions require explicit consent (not just disclosure) before recording per-page reading behaviour of a named recipient, and does that force a per-room consent gate that harms recipient conversion? | Legal + Product | Before R2 launch |
| OQ84 | Do owners want a per-recipient engagement score (a single ranked number) or is the raw dwell list sufficient? A score is easy to sell and easy to be wrong about. | Product + design partners | R2 planning |
| OQ85 | What is the acceptable ceiling on first-open notification latency before it stops being actionable? R1 assumes 60 seconds at p95; an engagement lead waiting on a counterparty may need 10. | Product + Engineering | R2 planning |
| OQ86 | Is a structured question-and-answer module (the workflow every enterprise VDR sells) required for the beachhead, or is it upmarket scope we should refuse? | Product | R3 planning |
| OQ87 | Does live presence ("2 people reading now") create more anxiety than value for recipients, and does it need a recipient-visible disclosure of its own? | Product + Legal | R3 planning |
| OQ88 | Should the audit CSV be accompanied by a signed manifest (hash chain) so a third party can verify it was not edited after export? This is a real defensibility differentiator and a real scope increase. | Product + Engineering + Legal | R2 planning |
