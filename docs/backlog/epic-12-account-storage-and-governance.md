# Epic E12 — Account, Storage & Governance

## Purpose

This epic shows a user exactly where they stand on storage, guarantees that the product never silently
drops data at a limit, and gives an internal administrator the controls an internal tool cannot run
without. It owns profile and account settings, the used-storage indicator and its warning thresholds,
the exact behaviour at the quota limit, the administrator-set quota itself, the retention and limit
configuration, the joiner and leaver flows, the administrator role, data export and portability, and
the storage side of account deletion.

Two things make this epic strategic rather than plumbing. First, the behaviour at the limit is a
data-integrity question: a tool that accepts an upload it cannot store loses a document whose only
other copy may be on a phone at a site visit. Every rule here is written so that "we are out of
space" is a refusal the user understands, never a silent truncation and never a deletion.

Second, an internal tool has a lifecycle the product must serve. Colleagues join, change teams and
leave; somebody has to be able to say how much storage a room gets and how long the activity log is
kept; and on the day someone leaves, the interesting question is not their profile but the rooms they
owned and the links they created. That person is the internal administrator, and this epic is the
whole of their surface. **Every limit in the product is a value that role sets, with an explicit
default stated in [06-business-rules-and-permissions.md](../06-business-rules-and-permissions.md);
no limit is ever derived from a purchase, a head count or any other computed value** (I03).

**There is no commerce in this epic.** No plan, no price, no seat, no invoice, no payment and no
trial exists anywhere in the product. The stories that used to carry them are tombstoned at the end
of the story list rather than renumbered away.

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
  [E11 Trust, Audit & Notifications](./epic-11-trust-audit-and-notifications.md)

## Epic summary

| Field | Value |
| --- | --- |
| Epic ID | E12 |
| Goal | Make the storage position always visible and always correct, make the at-limit behaviour a refusal that loses nothing and states the shortfall, and give the internal administrator the joiner, leaver, quota and retention controls the tool needs — without ever answering a governance event with data loss. |
| Primary personas | Administrator (the account-level governance role of BR-044, in practice held by P4 Ashley Kim, document operations coordinator and workspace administrator), P1 Marcy Doyle (engagement lead running five to eight live engagements, whose rooms carry the storage), P6 Ray Okonkwo (field staff uploading from client sites, who meets the limit first), P2 Dev Raman and P3 Tomás Ferreira (external recipients who hold no account and must never be affected by the owner's storage position) |
| Release span | R1 (stories 01 to 08, 18, 19, 20, 21, 22, 24), R2 (stories 17, 23, 25) |
| Story count | 17 |
| Total points | 92 |
| Depends on | [E01](./epic-01-access-and-identity.md) for account identity, step-up re-authentication, the sign-out-everywhere semantics deprovisioning relies on, and the deletion request flow; [E02](./epic-02-data-rooms-and-workspace-home.md) for rooms and the workspace home surface; [E04](./epic-04-file-operations.md) for the upload pipeline that quota gates; [E07](./epic-07-sharing-and-access-control.md) for the ownership-transfer machinery the leaver flow reuses; [E10](./epic-10-performance-offline-and-scale.md) for the storage accounting it presents; [E11](./epic-11-trust-audit-and-notifications.md) for the channels that deliver warnings |
| Blocks | Nothing downstream in this doc set. Operationally it gates go-live: without provisioning and deprovisioning there is no way to onboard a colleague or end a leaver's access except by hand. |
| Business rules applied | The administrator capability **BR-044** with the step-up rule **BR-045**; the quota block **BR-196 to BR-206** (what consumes quota and what does not, the ceilings and their sources, the 10-second freshness of the figure, the 75/90/100 warning thresholds, refusal at initiation, reservation, in-flight abort, the never-truncate rule, and the quota-reduction grace); the read-only state rules **BR-127** (room) and **BR-129** (account); the retention rules **BR-190 to BR-195**; the provisioning and deprovisioning rule **BR-237** with **BR-013** (one Owner per room), **BR-029** (acceptance) and **BR-108** (sign-out propagation); the trash and version rules **BR-177, BR-179, BR-182 to BR-187**; and the administrator-set-limit rule **BR-231**. **BR-207 is withdrawn** and is cited nowhere in this epic. |

## Mobile-first design stance

- **The at-limit experience is designed for a phone in a car park, not a settings page on a desktop.**
  The refusal states the shortfall in bytes, names the one action that fixes it, keeps the blocked
  upload visible in the tray rather than discarding it, and completes in one thumb-reachable tap.
  `507 STORAGE_QUOTA_EXCEEDED` is the only quota status and its message is "You are out of storage
  (10 GB of 10 GB used). Nothing was lost."
- **Every number the user sees names its source.** A quota is a value a named administrator set, so
  the screen says which of the three sources is in force — this room, this room's team, or the default
  (FR-ACCT-027, BR-199). "You have 40 GB" without "because Ashley set it on 3 March" is a number the
  user cannot act on and cannot argue with.
- **Storage is a text value first and a bar second.** The indicator is announced as a status message
  per SC 4.1.3 and never signalled by colour alone. At 200% text size the number stays legible because
  the number is the thing the user is making a decision on.
- **Recipients are unmetered and never told anything.** External recipients hold no account, consume
  no allowance, and see nothing about the owner's storage position — no banner, no degraded preview,
  no hint that a limit exists. A counterparty reading a document is not an audience for our internal
  housekeeping.
- **The administrator console is a phone surface, not a desktop console with a mobile fallback.**
  Setting a quota, provisioning a colleague and running a leaver flow all happen on a 360 px screen,
  because the day someone leaves is exactly the day nobody is at a desk. Each is a single-scope sheet
  with one primary action and an explicit before-and-after summary; none is an inline accordion whose
  submission scope is ambiguous.
- **Every governance action states its blast radius before it commits, and is logged after.** Lowering
  a quota names the rooms it will affect. Deprovisioning names the rooms that need an Owner and the
  links that will end. Shortening retention names what will stop being kept. Each writes the actor and
  the previous and new values to the activity log (BR-044).
- **Nothing in this epic deletes anything.** A quota reduction makes the affected scope read-only and
  explains it (BR-206). Deprovisioning ends access without destroying content (BR-237). Deletion has a
  retention window and a cancel path. Every destructive-looking state is reversible and every warning
  names counts.
- **Administration is not a read-everything back door.** The administrator role sets limits and
  manages accounts; it never confers the right to read a room's contents it holds no grant on
  (FR-ACCT-034, BR-044). This is the story that gets penetration-tested.
- **Desktop adds density, not capability.** At Expanded width the storage breakdown becomes an
  itemised sortable table and the account list becomes a bulk-editable list. Nothing an administrator
  needs is desktop-only.

---

## User stories

### US-E12-01 — Account, limits and capability payload

**As a** client engineer building every gated affordance in the product **I want** one authoritative
payload describing the account, the limits in force, where each came from, and current usage **so
that** no screen has to guess what the user is allowed to do.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | none |
| Traces to | FR-ACCT-004, FR-ACCT-027, FR-ACCT-034, NFR-SEC-015, NFR-SEC-016, NFR-MAINT-003, NFR-PERF-026, BR-044, BR-121, BR-122, BR-199, BR-231 |

**Acceptance criteria**

1. **Given** `GET /api/me` **when** it is called by a signed-in user **then** it returns the user, the
   account, the **limits in force** (quota bytes with the source that set them, max file size, the
   configurable ceilings of BR-231, retention windows), the current `StorageUsage` summary, and a
   `capabilities` object of booleans the client uses to render affordances.
2. **Given** the `capabilities` object **when** it is computed **then** it is derived server-side from
   the principal's roles plus the administrator capability of BR-044, and it is advisory only: every
   mutating endpoint re-checks authority independently, so a tampered client gains nothing.
3. **Given** each limit in the payload **when** it is serialised **then** it carries `value` and
   `source` — `room`, `team` or `default` for a quota (BR-199), `account` or `default` for every other
   configurable limit (BR-231) — because a screen that shows a limit must be able to say where it came
   from, and a limit with no source is a bug rather than a display choice.
4. **Given** `isAdministrator` **when** it is resolved **then** it is a single named capability
   independent of every room role: holding it confers no room access, and being the Owner of a room
   confers none of it (FR-ACCT-034).
5. **Given** a principal without the administrator capability **when** the payload is built **then**
   they still receive every limit in force, because the interface needs the numbers to explain a
   refusal, but they receive no administrator-only field and no other account's data.
6. **Given** the payload **when** it is serialised **then** it contains no commercial field of any
   kind: no plan, no subscription, no seat count, no price and no payment identifier, because none of
   those entities exists in the domain model.
7. **Given** the payload **when** it is fetched **then** its p95 server time is <= 120 ms and it is
   never served from the offline cache, because it is authority-adjacent
   ([E10](./epic-10-performance-offline-and-scale.md), BR-121 and BR-134).
8. **Given** an administrator changes a limit, a retention window or the administrator capability
   itself **when** the change commits **then** connected clients refetch `/me` within 60 seconds or on
   next navigation, so a raised quota takes effect without a manual reload and a revoked capability
   disappears.

**Mobile acceptance criteria**

- The payload is <= 4 KB gzipped so it costs nothing meaningful on a 3 Mbps uplink, and it is fetched
  once per app start plus on limit-change events, never per screen.
- Affordances the principal does not hold are absent rather than disabled-and-teasing at compact
  width, so a 360 px screen is not spent on things the user cannot do.
- A screen reader never encounters a control whose accessible name promises an action the principal's
  capabilities do not allow.

**Edge cases & negative paths**

- Limit service unreachable at fetch time: the last known limits are served with `stale: true` and the
  product behaves according to them, never by locking a colleague out and never by treating an unknown
  limit as zero.
- Account for which no explicit quota was ever set: the default of BR-199 is resolved explicitly with
  `source: "default"` rather than by null-checking, so a limit is always a number.
- Two ceilings apply and disagree: the payload carries the **lowest** one as the value in force and
  names which scope it came from, matching the server's enforcement exactly (BR-199).
- User belongs to two accounts (not supported in R1): the contract carries a single `accountId`, and a
  second membership is rejected at the API with a typed error rather than silently picking one.

---

### US-E12-02 — Profile and account settings on a phone

**As a** P1 Marcy Doyle **I want** to set my name and photo and find my account controls quickly **so
that** the room I share looks like it belongs to a professional and I can change things without
hunting.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E12-01 |
| Traces to | FR-ACCT-001, FR-ACCT-002, FR-ACCT-003, FR-MOB-018, NFR-A11Y-001, NFR-A11Y-002, NFR-MOB-004, NFR-MOB-020 |

**Acceptance criteria**

1. **Given** the account screen **when** it renders **then** it shows display name, profile image,
   email address and the storage summary, and grouped sections for Notifications, Security, Storage,
   Data and privacy, plus **Administration** for a principal holding the administrator capability,
   each row at least 48 CSS px tall with a visible label.
2. **Given** display name **when** it is edited **then** the change is saved through `PATCH /api/me`
   with optimistic UI and a typed rollback, and the new name appears on the next log entry and share
   invitation without a reload.
3. **Given** a profile image **when** it is set **then** it can be taken with the camera or chosen from
   the photo library, is resized client-side by streaming through a canvas capped to 512 px (never by
   reading the whole file into memory), and a HEIC input is normalised server-side.
4. **Given** email change and password change **when** the user taps them **then** they route to the
   flows owned by [E01](./epic-01-access-and-identity.md) (US-E01-16) rather than being duplicated here,
   and the rows state the security requirement ("requires confirming it is you").
5. **Given** the storage row **when** it renders **then** it shows the value inline ("4.2 GB of 40 GB")
   so the most-consulted number is visible without navigating.
6. **Given** any settings change **when** it saves **then** a toast confirms it and a screen reader
   announces it once politely; a failed save reverts the control and states the reason.
7. **Given** the account screen **when** it is opened by a colleague without the administrator
   capability **then** the Administration section is absent rather than disabled, and the Storage row
   states who to ask to change a limit ("Storage limits are set by ashley@example.com"), so the user
   has a next step instead of a dead control.

**Mobile acceptance criteria**

- Every settings row is reachable one-handed on a 360 x 640 viewport with the primary destinations in
  the lower two-thirds of the screen; the account screen is a bottom-navigation destination, not a
  hamburger item.
- Editing the display name opens a sheet whose text field and Save button remain visible above the
  software keyboard using `env(keyboard-inset-bottom)` with a `visualViewport` fallback (SC 2.4.11).
- The photo picker is invoked with `accept="image/*"` plus `capture` where appropriate so "take a photo"
  is one tap on a phone, and the flow never assumes library enumeration because photo pickers are
  permissionless and selection-scoped by design on both platforms.
- At 200% text size no settings row truncates its label; values wrap to a second line.
- With a screen reader on, section headers are exposed as headings so a user can jump between groups
  rather than swiping through every row.

**Edge cases & negative paths**

- Image upload fails mid-flight on a flaky link: the previous image remains, the error says "We could
  not save that photo. Try again." and no partial asset is stored.
- Display name set to whitespace or 300 characters: rejected with "Enter a name between 1 and 60
  characters." and the typed text is preserved.
- Settings opened offline: values render from the last fetch with the cached-copy label, and every
  editable control is disabled with a single explanatory line, because account changes are never queued
  offline.

---

### US-E12-03 — Used storage with a per-room breakdown

**As a** P1 Marcy Doyle running eight mandates **I want** to see which room is eating my storage **so
that** I can clear the right one instead of guessing.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E12-01 |
| Traces to | FR-ACCT-004, FR-ACCT-005, FR-ACCT-027, FR-PERF-025, NFR-A11Y-011, NFR-I18N-002, NFR-PERF-026, BR-179, BR-186, BR-197, BR-198, BR-199, BR-200 |

**Acceptance criteria**

1. **Given** the storage screen **when** it renders **then** it shows the account total as a value and a
   proportion ("4.2 GB of 40 GB, 11%"), a per-room list ordered by size descending, and a breakdown of
   the total into current files, previous versions and trash.
2. **Given** the per-room list **when** it renders **then** each row shows the room name, its size, and
   its file count, and tapping a row opens that room's storage detail with the same three-way breakdown.
3. **Given** the figures **when** they are read **then** they come from the maintained `StorageUsage`
   rows (never a request-time scan), are current within **10 seconds** of an upload completing or a
   permanent deletion committing (BR-200), state when they were last computed, and a figure older than
   that is shown as the last known value with an "updating" indicator and its "as of" time rather than
   as a fact.
4. **Given** the accounting rule **when** the screen explains itself **then** it states in one line that
   quota is consumed by the committed bytes of current versions, retained previous versions and items in
   trash (BR-197), that it is not consumed by folder records, thumbnails, rendered preview pages, search
   indexes or activity entries (BR-198), and that trashed rooms still use storage until they are
   purged, because this is the thing users argue with.
5. **Given** the ceiling in force **when** the screen renders **then** it names both the figure and its
   source — this room, this room's team, or the account default (BR-199, FR-ACCT-027) — together with
   the administrator who last changed it and when, and where more than one ceiling applies it says
   which one is governing because it is the lowest.
6. **Given** the workspace home **when** it renders **then** the same total appears in a compact form so
   the user does not have to visit settings to know where they stand.
7. **Given** a Viewer, a guest or an anonymous link visitor **when** they request storage figures
   **then** the server omits or refuses them, because the storage position is internal and a recipient
   must not learn the shape of our workspace.
8. **Given** an account with 28 rooms **when** the list loads **then** it is cursor-paged at 50 rooms and
   loads in under 800 ms at p75 on the reference device.

**Mobile acceptance criteria**

- The screen is a list, never a table: at 360 px each room row is one line of name plus a right-aligned
  value with a thin bar beneath, at least 48 CSS px tall, with no horizontal scrolling (SC 1.4.10).
- The total renders on one line for values up to "9,999 files, 999.9 GB" and wraps rather than
  truncating at 200% text size.
- Bars are never the only representation: every bar has its numeric value adjacent in text, and the
  colour of a bar carries no information that the text does not.
- When the total changes materially (an upload commits while the screen is open) the new value is
  announced once as a polite status message (SC 4.1.3).
- On a flaky link the screen shows the cached figure with its "as of" time instead of a spinner.

**Edge cases & negative paths**

- Reconciliation corrects a drift while the user is looking: the value updates with a one-line note
  "Storage figures were recalculated" and the correction is written to the activity log as a system
  event, so a jump in the number is explainable.
- A room shared with the user but owned by someone else: it appears in their rooms list but not in their
  storage breakdown, because it does not count against their quota, and the screen says so.
- Version history dominating the total (versions larger than current files): the breakdown makes it
  visible and offers a link to the room's version retention setting rather than leaving the user to
  wonder.
- Storage service unavailable: the last known figure is served and no read, share or revoke operation is
  blocked on it.

---

### US-E12-04 — Quota warning thresholds

**As a** P1 Marcy Doyle **I want** to be warned before I hit the wall **so that** I never discover the
limit while a buyer is waiting for a document.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E12-03 |
| Traces to | FR-ACCT-006, FR-AUDIT-017, FR-AUDIT-021, NFR-A11Y-011, NFR-MOB-019, NFR-COMPAT-008, BR-196, BR-200, BR-231 |

**Acceptance criteria**

1. **Given** usage crosses a threshold **when** the crossing is detected **then** a warning is raised at
   75%, 90% and 100% of the applicable quota (BR-196 owns these three thresholds and they are the only
   storage warning thresholds in the document set), each raised once per crossing unless usage drops
   below it and crosses again.
2. **Given** a warning **when** it is delivered **then** it appears in the notification centre, is sent
   by email (the guaranteed channel) to the account holder **and to the administrator** per BR-196, and
   is shown as an in-product banner, and the 100% warning cannot be muted per
   [E11](./epic-11-trust-audit-and-notifications.md) US-E11-15.
3. **Given** the warning copy **when** it renders **then** it states the exact remaining allowance in
   bytes and in a human unit ("You have 2.5 GB left of 40 GB"), not a percentage alone, **names which
   ceiling is being approached** — room, team or account (BR-196, BR-199) — and names the two actions
   that resolve it: Free up space, and Request more space.
4. **Given** the in-product banner **when** it is shown **then** it is dismissible for the session at 75%
   and 90%, and persistent at 100%, and it never covers the primary action on any screen.
5. **Given** the user frees space below a threshold **when** the recomputation completes **then** the
   banner disappears within 60 seconds without a reload and the notification is marked resolved.
6. **Given** the 100% state **when** the user taps Request more space **then** a one-tap request is
   sent to the administrator naming the room, the ceiling in force, the source that set it, the current
   usage and the shortfall, so the administrator can act without a conversation; the requester sees the
   request in their notification centre so they know it went somewhere.
7. **Given** telemetry **when** a warning is shown **then** `quota_warning_shown` records the threshold,
   the governing ceiling's scope and the device class, feeding M55 (quota block resolution time).
8. **Given** a colleague who is not an administrator **when** they see the warning **then** the copy
   names who can raise the limit ("Ashley Kim sets storage limits") and offers the request action of
   AC6, instead of an action they cannot perform.

**Mobile acceptance criteria**

- The banner occupies at most 72 CSS px at 360 px width, sits below the header, and never overlaps the
  bottom action bar or the safe-area inset.
- The banner's action control is at least 48 CSS px tall and within one-handed reach; the dismiss
  control is a separate 48 x 48 CSS px target with an accessible name of "Dismiss storage warning".
- The warning is announced once politely by a screen reader when it first appears and is not re-announced
  on every navigation.
- At 200% text size the banner grows to three lines rather than truncating the remaining-allowance
  figure, which is the actionable part.
- The email version renders in one column on a 360 px screen with a 48 CSS px primary link.

**Edge cases & negative paths**

- Usage oscillating around 90% due to an upload-and-delete pattern: the warning is rate-limited to once
  per 24 hours per threshold to avoid becoming noise.
- A single upload that crosses two thresholds at once: only the highest crossed threshold is delivered,
  so the user gets one message, not two.
- Warning generated while the user is mid-upload: the banner appears without interrupting the transfer,
  and the tray is not modified.
- Two ceilings crossed by the same upload (a room ceiling at 90% and the account ceiling at 75%): the
  warning names the **lowest** governing ceiling, because that is the one that will refuse the next
  upload, and mentions the other in the detail sheet rather than sending two messages.
- A newly provisioned room whose first upload immediately crosses 75% because an administrator set a
  deliberately small ceiling: the warning still fires and still names the source, because a small
  ceiling that nobody mentioned is exactly the case the source line exists for (Assumption: recorded
  as OQ90).

---

### US-E12-05 — Refuse an upload that would exceed quota, before any bytes move

**As a** P6 Ray Okonkwo about to upload a 40 MB survey from a lot **I want** to be told up front if it
will not fit **so that** I do not spend four minutes of cellular data to be refused at the end.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E12-03 |
| Traces to | FR-ACCT-007, FR-ACCT-009, FR-FILE-045, FR-ACCT-010, NFR-SEC-015, NFR-AVAIL-009, NFR-SCALE-006, BR-201, BR-202, BR-204, BR-205 |

**Acceptance criteria**

1. **Given** `POST /api/rooms/:roomId/uploads` **when** the declared size would take the account over
   quota **then** the server refuses with `507 STORAGE_QUOTA_EXCEEDED` before minting an upload URL,
   returning a `limit` object with `usedBytes`, `limitBytes`, `requiredBytes` and `shortfallBytes`.
2. **Given** the refusal **when** the client renders it **then** the message is "You are out of storage
   (10 GB of 10 GB used). Nothing was lost." plus the exact shortfall ("This file needs 40 MB more"), and
   the item remains visible in the upload tray in a `blocked` state rather than being discarded.
3. **Given** a multi-file selection where some files fit and some do not **when** the batch is created
   **then** the files that fit proceed, the files that do not are individually marked blocked with their
   own shortfall, and the tray header states "9 of 12 queued, 3 blocked by storage" (a partial-failure
   report, never an all-or-nothing silent drop).
4. **Given** the client knows the current usage **when** the user picks files **then** the client
   pre-checks locally and warns before the picker result is submitted where it can, so the user is not
   asked to choose a file and then refused; the server check remains authoritative and is never skipped.
5. **Given** the account is at or over quota **when** the user performs any read or governance action
   **then** listing, preview, download, search, share creation, share revocation, delete and trash all
   continue to work (BR-204), because punishing an owner's ability to control access over a storage
   condition is unacceptable.
6. **Given** the blocked item **when** the user frees space or an administrator raises the ceiling
   **then** a single "Retry blocked uploads" action in the tray requeues them, and each resumes from
   zero (no bytes were sent) with the same target folder and the same conflict-resolution choice.
7. **Given** a file larger than the configured maximum file size (BR-231, administrator-set with the
   default stated in its own rule) **when** the upload is created **then** the refusal is
   `413 FILE_TOO_LARGE` naming the actual limit and the administrator who can change it, which is a
   different condition from being out of storage and must never be reported with the quota copy.
8. **Given** the refusal **when** it happens **then** `quota_block_hit` is recorded with the attempted
   bytes, the shortfall and the device class, and the event is written to the activity log as a system
   event so the owner's log explains why nothing appeared.

**Mobile acceptance criteria**

- The refusal is delivered before the file picker's selection is uploaded, so on a metered connection
  zero bytes of file data are spent on a doomed upload.
- The blocked-item row in the tray is at least 48 CSS px tall, states the shortfall inline, and carries a
  48 x 48 CSS px overflow with Retry, Remove and Request more space.
- The tray's "3 blocked" summary sits above `env(safe-area-inset-bottom)` and never covers the folder's
  primary action.
- On a 360 x 640 viewport the refusal sheet fits without scrolling and has at most four buttons including
  Cancel, per the action-sheet constraints.
- A screen reader announces the refusal once assertively including the shortfall, because the user must
  act.

**Edge cases & negative paths**

- Declared size is understated by a buggy or malicious client: the in-flight overshoot path in US-E12-06
  catches it, so a false declaration cannot smuggle bytes past the quota.
- Two devices starting large uploads simultaneously with room for only one: quota reservation in
  US-E12-06 means the second is refused at creation, not after both have transferred.
- Quota freed by another device while an item sits blocked: the tray revalidates on foreground and moves
  the item from blocked to queued automatically, announcing it once.
- Offline at the moment of upload creation: the item is queued locally and the quota check happens on
  reconnection; the tray says "Waiting for connection" and never says "queued and will upload in the
  background", because there is no background upload on iOS.

---

### US-E12-06 — Quota reservation and the in-flight overshoot abort

**As a** P1 Marcy Doyle **I want** an upload that turns out to be too big to fail cleanly **so that** I
am never left with a half-loaded file in a live deal's folder.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E12-05 |
| Traces to | FR-ACCT-008, FR-ACCT-009, FR-FILE-045, NFR-AVAIL-005, NFR-MOB-005, NFR-MOB-006, NFR-SCALE-007, NFR-SCALE-008, BR-202, BR-203, BR-205, BR-210 |

**Acceptance criteria**

1. **Given** an upload session is created **when** it is accepted **then** the declared size is
   **reserved** against the account quota as a pending reservation, and concurrent upload creations see
   the reserved bytes as used, so two simultaneous uploads cannot both fit into the same free space.
2. **Given** a reservation **when** the upload commits, is cancelled or fails terminally **then** the
   reservation is released in the same transaction as the state change; and **when** a session has had no
   activity for 24 hours **then** a scheduled job deletes its parts, releases its reservation and records
   the abandonment so the client can explain it (BR-210), with the session record itself expiring at 7
   days.
3. **Given** an in-flight upload whose actual bytes exceed the declared size **when** the overshoot is
   detected on a chunk append **then** the server rejects the chunk with `413`, aborts the multipart
   upload, discards every uploaded part, releases the reservation, and leaves **no** node and no partial
   version in the folder.
4. **Given** that abort **when** the client is informed **then** the tray shows "This upload was stopped:
   the file is larger than expected and there is not enough storage. Nothing was added to the folder."
   with Retry and Remove, and the folder listing is unchanged.
5. **Given** any quota condition **when** it occurs anywhere in the pipeline **then** no file is ever
   truncated, no file is ever silently dropped, and no partial file is ever committed as a version; a
   test asserts that after every simulated failure point the folder contains either the complete file or
   nothing.
6. **Given** the reservation ledger **when** it is reconciled nightly **then** reserved-but-not-committed
   bytes are compared against live sessions, drift raises an alert, and stale reservations are released,
   because a leaked reservation silently shrinks a colleague's allowance and nothing outside the product
   will notice for us.
7. **Given** a commit that would exceed quota because another upload committed first **when** the commit
   is attempted **then** it fails with `507` before the version is created, the parts are discarded, and
   the item returns to the tray as blocked with its shortfall.
8. **Given** the race between a quota check and a multi-chunk upload **when** it is tested **then** an
   explicit concurrency test exercises: two devices uploading 1 GB each into 1.5 GB of free space; a
   delete freeing space mid-upload; and an administrator lowering the ceiling mid-upload (US-E12-20).
   All three end with complete files or clean refusals, never partial data.

**Mobile acceptance criteria**

- The abort is detected within one chunk (256 KiB to 8 MiB depending on the adaptive chunk size), so a
  runaway upload on cellular wastes at most one chunk of the user's data.
- The tray state after an abort is unambiguous on a 360 px screen in one line plus an action row; the
  words "failed" and "nothing was added" both appear.
- Backgrounding the app during the abort still results in a clean server-side state, because the abort is
  server-driven and does not depend on client code running.
- A screen reader announces the abort once assertively; a silent failure is the specific defect this
  story exists to prevent.
- Haptic feedback fires on the failed action where the platform exposes vibration.

**Edge cases & negative paths**

- Reservation held by a session on a device the user no longer has: the 24-hour inactivity sweeper
  releases it (BR-210), and the tray on any device shows the pending session so the user can cancel it
  explicitly ("queued on your iPhone").
- Storage backend reports a successful part upload the application did not record: reconciliation finds
  the orphaned parts and aborts them, releasing the bytes.
- Ceiling raised mid-abort (an administrator grants more space while the abort is running): the abort
  still completes, and the retry succeeds; the product does not attempt to rescue an aborted transfer
  mid-flight.
- A 3 GB upload aborted at 2.9 GB: all parts discarded, reservation released, and the tray states the
  bytes that were transferred and lost so the user understands the data cost before retrying.

---

### US-E12-07 — What still works at the limit

**As a** P1 Marcy Doyle who is out of storage on a Friday **I want** to still be able to revoke a
buyer's access and let people read **so that** a storage problem never becomes a security problem.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E12-05 |
| Traces to | FR-ACCT-010, FR-ACCT-009, NFR-SEC-015, NFR-AVAIL-009, BR-179, BR-204, BR-129 |

**Acceptance criteria**

1. **Given** the account is at or over quota **when** any of these is attempted **then** it succeeds:
   listing a folder, previewing a file, downloading a file, searching, creating a share, editing a share
   policy, revoking a share, renaming, moving, deleting, restoring from trash within retention, and
   reading the activity log.
2. **Given** the account is at or over quota **when** an upload, a copy that duplicates bytes, or a room
   duplication with files is attempted **then** it is refused with `507` and the shortfall, and the
   refusal names the operation.
3. **Given** a recipient of a share **when** the room is over its ceiling **then** the recipient's read
   experience is completely unaffected: no banner, no degraded preview, no mention of the storage state,
   because our internal housekeeping is not a counterparty's business.
4. **Given** the over-quota state **when** it is displayed to the owner **then** the persistent banner
   states what is blocked ("New uploads are paused") and what is not ("Everything else works normally"),
   because vague warnings cause users to assume the worst and leave.
5. **Given** a copy operation **when** the source and destination are in the same account and the
   underlying blob is deduplicated **then** the copy is permitted if it adds no committed bytes, and the
   rule is stated in the help text so the behaviour is not mysterious.
6. **Given** the over-quota state **when** it persists for 30 days or for a year **then** nothing is
   deleted and no room becomes read-only for reads; only new bytes remain blocked (BR-204, BR-205), and
   this is stated explicitly in the banner's detail sheet, because the fear the sheet exists to answer
   is "will it start deleting my files".

**Mobile acceptance criteria**

- The banner's detail sheet lists blocked and allowed operations as two labelled groups at the medium
  detent, dismissible by swipe-down, with the list readable without horizontal scrolling at 320 px.
- Every still-available action retains its normal affordance and its normal tap target; nothing is
  visually disabled that still works.
- The banner text is announced once politely and the detail sheet is reachable in one tap from it.

**Edge cases & negative paths**

- Trash restore that would exceed quota: refused with `507` and a message naming the bytes needed, and
  the trashed item remains restorable until its purge date, so the refusal costs nothing permanent.
- Version restore while over quota: permitted, because restoring a version creates a new version and may
  add bytes; if it would exceed quota it is refused with the same copy and the version remains intact.
- Camera capture attempted while over quota: the camera does not open; the refusal comes first, so the
  user does not photograph a document and then lose it. The copy explicitly says the photo was not taken.

---

### US-E12-08 — Reclaim space: trash, versions and the byte savings shown before the tap

**As a** P4 Ashley Kim asked to fix a storage problem in five minutes **I want** to see exactly how many
bytes each cleanup option frees **so that** I clear the right thing once instead of hunting.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E12-03 |
| Traces to | FR-ACCT-004, FR-ACCT-005, FR-ACCT-009, NFR-A11Y-005, NFR-A11Y-022, NFR-SEC-029, NFR-SCALE-011, BR-045, BR-172, BR-174, BR-176, BR-177, BR-182, BR-183, BR-186, BR-187 |

**Acceptance criteria**

1. **Given** the storage screen **when** it renders **then** it offers a "Free up space" section listing,
   with exact byte figures: Empty trash (per room and account-wide), Remove old versions (per room), and
   the largest rooms and largest files as candidates.
2. **Given** "Empty trash" **when** the user taps it **then** a confirmation states the exact blast
   radius: "Permanently delete 3 folders and 47 files (2.4 GB)? This cannot be undone." with the
   destructive option styled destructive and Cancel at the bottom.
3. **Given** the confirmation **when** the user confirms **then** the purge requires step-up
   re-authentication (per the two-step permanent-delete rule in
   [E08](./epic-08-conflict-resolution-and-data-integrity.md)), commits server-side, writes an activity
   event per purged subtree, and the reclaimed bytes appear in the storage total within 10 seconds of
   the purge committing (BR-200).
4. **Given** the purge **when** it commits **then** the underlying blobs are released only after their
   documented 7-day grace so support can recover an accidental purge, and the storage figure reflects the
   release at purge time with the grace period explained in the help text.
5. **Given** "Remove old versions" **when** the user taps it **then** the sheet states the policy in
   force ("Previous versions are kept for 90 days, and the 3 most recent are always kept", BR-186) and
   how many versions and bytes would be removed, and the action never removes a current version.
6. **Given** any reclaim action **when** it is irreversible **then** there is no Undo and the
   confirmation says so in words; where it is reversible (moving to trash rather than purging) an Undo
   toast is provided for 10 seconds.
7. **Given** the largest-files list **when** it renders **then** each row offers Open, Move to trash and
   Download, so the user can act without leaving the storage screen.
8. **Given** a purge larger than the 500-item interactive bulk cap (BR-219, NFR-SCALE-011) **when** it
   runs **then** it is accepted as a server-side job with progress in the notification centre, is
   idempotent under retry, and reports partial failure per item with each item's reason rather than
   claiming a clean sweep.

**Mobile acceptance criteria**

- Every reclaim row shows the byte figure right-aligned and readable at 200% text size; the number is the
  decision input and must never be the thing that truncates.
- The confirmation sheet complies with the action-sheet limits: at most four buttons including Cancel, no
  scrolling, destructive action visually prominent, Cancel at the bottom.
- The destructive commit fires on the up-event with an abort path (sliding off the control cancels), per
  SC 2.5.2; nothing destructive ever fires on touchstart.
- A screen reader reads the full blast-radius sentence including both counts and the byte figure before
  the confirm control is reached.
- Haptics fire on the destructive commit where the platform exposes vibration, respecting reduced-motion
  and system settings.

**Edge cases & negative paths**

- Trash contains an item another user restored a second ago: the counts are re-fetched at confirmation
  time and a mismatch returns `409` with "The trash changed while you were looking. Review it again." so
  the user never confirms a stale blast radius.
- Purge of a room whose share links are still active: the links break, and the confirmation says so
  explicitly ("2 active links point into this content and will stop working").
- Purge attempted by a Manager rather than the Owner: refused with `403`, because permanent deletion is
  owner-plus-step-up only.
- Reclaim shows 2.4 GB available but only 2.1 GB is freed (dedup with another room): the difference is
  explained in a one-line note rather than leaving the user to notice the discrepancy.

---

### US-E12-19 — Administrator-set storage quota with an explicit default

**As an** administrator **I want** to set how much storage a data room gets, and to have every room I
never touched governed by a stated default **so that** no room is unbounded and no room has a limit
nobody can name.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E12-01, US-E12-03 |
| Traces to | FR-ACCT-027, FR-ACCT-034, NFR-SEC-015, NFR-SEC-016, NFR-OBS-011, NFR-COMPL-001, NFR-A11Y-019, BR-044, BR-196, BR-199, BR-231, BR-236 |

**Acceptance criteria**

1. **Given** `PATCH /api/account/governance` **when** it is called by a principal holding the
   administrator capability **then** it sets the account-level ceiling, an optional per-room ceiling, or
   any of the configurable limits of BR-231, and returns the new value together with the scope it was
   set on.
2. **Given** a room for which no explicit ceiling was ever set **when** its limit is resolved **then**
   the **account-level default of BR-199 applies automatically**, so there is no unset state, no
   unbounded room and no code path that computes a limit from anything else.
3. **Given** more than one ceiling applies to a room **when** an operation would increase stored bytes
   **then** the **lowest** applicable ceiling governs, the refusal names which one it breached, and the
   room's storage screen names the same one, so enforcement and explanation cannot disagree (BR-199).
4. **Given** the quota screen **when** it renders for any colleague **then** it states the figure in
   force, which of the three sources set it — this room, this room's team, or the default — and, where a
   person set it, that person's name and the date, because "who decided this" is the first question.
5. **Given** an administrator changes a ceiling **when** the change commits **then** it takes effect
   without a deployment, is written to the activity log with the actor and the previous and new values
   (BR-044), and is notified to the account holder and to every affected room Owner.
6. **Given** the same endpoint **when** it is called by a principal without the administrator capability
   — including the Owner of the room in question — **then** it returns `403` and records an
   `access-denied` event, because a room role never confers governance authority (FR-ACCT-034).
7. **Given** an administrator raises a ceiling **when** the change commits **then** every upload blocked
   by the previous ceiling becomes retryable within 60 seconds, and the affected users' trays revalidate
   without a reload (US-E12-05 AC6).
8. **Given** a ceiling value **when** it is submitted **then** it is validated against a stated floor and
   ceiling for the field, a value below current usage is accepted but routed through the
   never-delete path of US-E12-20 rather than being silently refused, and a non-numeric or negative value
   is rejected with a typed error naming the permitted range.

**Mobile acceptance criteria**

- Setting a ceiling is a single-scope sheet at 360 px: the current value, the new value, the affected
  scope named in words, and one Apply control at least 48 CSS px tall. There is no multi-step wizard and
  no inline accordion whose submission scope is ambiguous.
- The value field uses `inputmode="numeric"` with an adjacent unit selector, permits paste, and keeps
  both the field and Apply visible above the software keyboard (SC 2.4.11).
- The before-and-after summary is text ("40 GB → 100 GB for Riverside HVAC") and is announced once
  politely on change; the change is never signalled by colour alone.
- At 200% text size neither figure truncates; the numbers are the decision input.

**Edge cases & negative paths**

- Two administrators setting the same ceiling concurrently: optimistic concurrency on the governance
  record means the second receives `412` with the current value and re-confirms against it, so one
  administrator's change is never silently overwritten by the other's stale form.
- A ceiling set on a team that has no rooms yet: accepted and stored, applies to the first room the team
  owns, and the screen says so rather than reporting a value that appears to do nothing.
- A per-room ceiling set above the account ceiling: accepted and stored, with an explicit line stating
  that the account ceiling still governs because it is lower, so the administrator is not misled into
  thinking they granted space they did not.
- Governance record unreadable at enforcement time: the upload path fails closed on the last known
  ceiling rather than open on an unbounded default, and the incident alerts.

---

### US-E12-20 — Lowering a quota below current usage never deletes anything

**As an** administrator who has to reduce a room's allowance **I want** the reduction to make the room
read-only for new bytes and tell everyone affected **so that** I never destroy a colleague's documents by
typing a smaller number.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E12-19 |
| Traces to | FR-ACCT-029, FR-ACCT-009, FR-ACCT-010, NFR-AVAIL-009, NFR-SEC-015, NFR-A11Y-022, NFR-COMPL-001, BR-044, BR-129, BR-199, BR-204, BR-205, BR-206 |

**Acceptance criteria**

1. **Given** an administrator lowers a ceiling below the storage the scope already uses **when** the
   change is submitted **then** a pre-commit summary names every affected room, its current usage, the
   new ceiling and the shortfall, and states in words that **nothing will be deleted**.
2. **Given** the reduction commits **when** it takes effect **then** the affected scope enters a state
   that refuses new bytes and nothing else: listing, preview, download, search, share creation, share
   editing, **share revocation**, rename, move, delete, trash, restore within retention and export all
   continue to work (BR-204, FR-ACCT-010).
3. **Given** the reduction commits **when** notifications are sent **then** the account holder and every
   affected room Owner are notified with the shortfall, the deadline and the name of the administrator
   who made the change, and the change is written to the activity log with the previous and new values
   (BR-044, BR-206).
4. **Given** the 30-day grace period of BR-206 **when** it is running **then** nothing is deleted by the
   system at any point, and the room banner states the exact end date and what happens at it.
5. **Given** the grace period elapses **when** the scope is still over its ceiling **then** it remains
   read-only for new bytes **indefinitely** and **nothing is deleted**; the only routes out are an
   administrator raising the ceiling again or a principal deleting content, and the banner says exactly
   that (BR-206).
6. **Given** a write refused because of a quota reduction **when** the server responds **then** the
   reason is typed and distinct from a permission refusal, so the client can say "This room is read-only
   because its storage limit was lowered on 3 March" rather than "You do not have permission".
7. **Given** the condition is resolved **when** the ceiling is raised or content is deleted **then**
   write access returns within 60 seconds, every banner clears, and the restoration is written to the
   activity log.
8. **Given** a test suite **when** it exercises this story **then** it asserts that after a reduction to
   1 byte, with an upload in flight and a share being revoked concurrently, every file still exists, the
   revocation still succeeded, and no node was deleted or truncated.

**Mobile acceptance criteria**

- The pre-commit summary is one sheet at 360 px listing affected rooms in a region that scrolls inside
  the sheet, with counts and byte figures readable without horizontal scrolling.
- A screen reader reads the whole affected-rooms list and the "nothing will be deleted" sentence before
  the confirm control is reachable, so the blast radius cannot be skipped.
- The read-only banner is at most 72 CSS px, states the reason and the date on one line each, and offers
  "Request more space" as a 48 CSS px action (US-E12-04 AC6).
- The confirm control fires on the up-event with an abort path (SC 2.5.2).

**Edge cases & negative paths**

- Reduction applied while an upload is in flight: the in-flight upload is aborted cleanly by US-E12-06's
  path with no partial node left behind, and the tray states that the limit changed rather than blaming
  the network.
- Reduction that would put the scope below the storage its trash occupies: the summary offers "Empty
  trash to free 2.4 GB" inline as the cheapest resolution, because trash counts against quota (BR-197).
- Administrator raises the ceiling again during the grace period: the read-only state lifts immediately,
  the notification is marked resolved, and the grace clock is discarded rather than remembered.
- The administrator who made the reduction is themselves deprovisioned before the grace ends: the state
  and its audit trail survive, because the record names the actor at the time and does not depend on the
  actor still existing.

---

### US-E12-21 — Provision a colleague's account

**As an** administrator onboarding a new colleague **I want** to create their account and place them in
the right teams myself **so that** they can work on their first day without a self-service sign-up and
without a database operation.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E12-24 |
| Traces to | FR-ACCT-030, FR-ACCT-034, NFR-SEC-007, NFR-SEC-015, NFR-A11Y-019, NFR-COMPL-001, BR-044, BR-237 |

**Acceptance criteria**

1. **Given** `POST /api/account/provisioning` **when** it is called by an administrator with a
   colleague's name, work email address and team membership **then** the account is created, the
   colleague receives an activation link, and no self-service sign-up is required of them.
2. **Given** provisioning **when** the administrator submits it **then** they may set whether the new
   account holds the administrator capability, and the form states in one line what that capability does
   and does not confer (BR-044) rather than presenting it as an unexplained switch.
3. **Given** the activation link **when** it is redeemed **then** the colleague sets their own
   credential — a passkey by preference — and the administrator never learns or sets it, so no
   administrator ever holds a colleague's password.
4. **Given** the activation link **when** it is not redeemed **then** it expires on the schedule owned by
   [E01](./epic-01-access-and-identity.md), the pending account is listed separately as "invited, not yet
   activated" with a resend action, and an unactivated account can authenticate nothing.
5. **Given** provisioning **when** it commits **then** it is written to the activity log with the
   administrator as the actor, the new account's identity, its team placement and whether the
   administrator capability was granted (BR-044).
6. **Given** the joiner event originates in the company identity provider **when** that integration
   exists **then** provisioning is idempotent on the external subject identifier, so a replayed joiner
   event creates one account rather than two (Assumption: the identity-provider integration is recorded
   in the FR-AUTH notes and is not scoped by this story).
7. **Given** a non-administrator **when** they call the endpoint **then** they receive `403` and the
   attempt is recorded as an `access-denied` event.
8. **Given** an email address that already belongs to an account or to an external recipient identity
   **when** provisioning is attempted **then** it is refused with a typed error naming the conflict, and
   an existing recipient identity is never silently converted into a colleague's account.

**Mobile acceptance criteria**

- Provisioning is completable one-handed at 360 x 640: one sheet, fields for name, email and team, one
  administrator-capability control with its explanation, and one Create control at least 48 CSS px tall.
- Email entry uses `inputmode="email"`, permits paste, and never asks the administrator to retype
  anything the app already holds (SC 3.3.7).
- The account list is a vertical list of rows at least 64 CSS px tall, each with a 48 x 48 CSS px
  overflow carrying Resend activation, Change teams and Deprovision; no control is hover-revealed.
- With a screen reader on, each row's accessible name reads name, then state, then role, as one phrase.

**Edge cases & negative paths**

- Provisioning submitted twice by a double tap: the idempotency key means one account, and the second
  tap resolves to the same result.
- Colleague activates from a device that does not support passkeys: the password fallback of
  [E01](./epic-01-access-and-identity.md) applies, and the copy does not promise biometrics the device
  cannot provide.
- Team named in the request does not exist: refused with a typed error listing the teams that do, rather
  than creating a team as a side effect of provisioning a person.
- Administrator provisions an account and is themselves deprovisioned before activation: the activation
  link still works, because it is bound to the invited subject and not to the inviting one.

---

### US-E12-22 — Deprovision a colleague: the leaver flow

**As an** administrator on the day a colleague leaves **I want** one flow that ends their access, forces
the ownership question and destroys nothing **so that** a departure never leaves live credentials behind
or a room without an owner.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E12-21 |
| Traces to | FR-ACCT-031, FR-ACCT-032, FR-ACCT-022, NFR-SEC-007, NFR-SEC-015, NFR-SEC-017, NFR-COMPL-001, NFR-OBS-011, BR-013, BR-029, BR-044, BR-108, BR-237 |

**Acceptance criteria**

1. **Given** `DELETE /api/account/provisioning/:userId` **when** it is called by an administrator **then**
   deprovisioning happens as **one atomic operation** that signs the account out everywhere with the full
   semantics of BR-108, invalidates every credential, passkey and refresh chain on it, and marks the
   identity retired so it can never authenticate again (BR-237).
2. **Given** deprovisioning **when** it commits **then** every share the account created is revoked, and
   the pre-commit summary states how many links and grants will stop working and who holds them, because
   ending a colleague's access must not quietly end a counterparty's read without anyone knowing.
3. **Given** the account owns rooms **when** deprovisioning is attempted **then** it is **refused** until
   every one of those rooms has been transferred to a named colleague or archived, and the refusal
   **enumerates the rooms** (BR-013, BR-237); the flow offers the transfer inline rather than sending the
   administrator elsewhere to find it.
4. **Given** an administrator initiates a transfer on the leaver's behalf **when** it is offered **then**
   it proceeds without the leaver's acceptance — the single documented exception to BR-029 — and the
   **transferee must still accept**, so no colleague silently becomes responsible for a room they have
   not seen.
5. **Given** deprovisioning **when** it commits **then** **no content is deleted**: rooms, files,
   versions, trash and activity all survive intact, and the summary says so in words, because
   deprovisioning a person is not deleting a deal (BR-237).
6. **Given** the propagation target of BR-108 **when** deprovisioning commits **then** every live session
   on every device is invalid within that target, and a test asserts that a refresh token captured one
   second before the commit is refused after it.
7. **Given** deprovisioning **when** it commits **then** every step is written to the activity log with
   the administrator as the actor, and the retired identity is retained rather than deleted so historical
   activity still resolves a name (BR-237).
8. **Given** the leaver's own data **when** the administrator needs it **then** the export path of
   US-E12-17 covers a deprovisioned colleague's data (FR-ACCT-022), so a handover is a data operation
   rather than a request to reactivate an account.

**Mobile acceptance criteria**

- The refusal listing rooms that need an Owner is readable at 360 px in a region that scrolls inside the
  sheet, and each row offers Transfer and Archive as 48 CSS px actions, so the blocking condition is
  resolvable from the same screen that reported it.
- The pre-commit summary states the three counts — sessions ended, shares revoked, rooms needing an
  Owner — as text, and a screen reader reads all three plus the "nothing is deleted" sentence before the
  confirm control is reachable.
- The confirm control is styled destructive, sits at the top of the action group, with Cancel at the
  bottom, and fires on the up-event with an abort path (SC 2.5.2).
- The whole flow is completable one-handed on a 360 px device, because the day someone leaves is exactly
  the day nobody is at a desk.

**Edge cases & negative paths**

- The leaver has an upload in flight: it is aborted server-side, its parts are discarded, no partial file
  appears, and the tray on their device states that account access ended.
- The leaver is the only administrator: deprovisioning is refused until the capability is granted to
  another account, because an account with no administrator has no way to set a limit or run the next
  leaver flow.
- A room the leaver owned is transferred, and the transferee has not accepted when the deprovisioning
  commits: the sign-out and revocation still complete, the room is held in a pending-acceptance state
  named in the summary, and no content is at risk in the meantime.
- The leaver returns as a contractor later: a new account is provisioned, and the copy makes clear it is
  a new identity; a retired identity is never reactivated.
- Deprovisioning attempted by a room Owner rather than an administrator: `403`, recorded as an
  `access-denied` event, because seniority in a room is not governance authority.

---

### US-E12-23 — Retention and limit settings an administrator can actually change

**As an** administrator **I want** to set the trash window, the version window and the activity-log
window, and to adjust the numeric limits **so that** the tool matches our retention policy without a
deployment.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E12-19 |
| Traces to | FR-ACCT-033, FR-ACCT-034, NFR-COMPL-005, NFR-PRIV-005, NFR-COMPL-001, NFR-OBS-011, BR-044, BR-177, BR-186, BR-195, BR-231 |

**Acceptance criteria**

1. **Given** the Administration section **when** it renders **then** it exposes the trash window
   (BR-177), the version window and its always-keep-3 rule (BR-186), and the activity-log window
   (BR-195), each showing the value in force, its default, and its permitted floor and ceiling.
2. **Given** the activity-log window **when** it is changed **then** the new period must fall within the
   floor of 6 months and the ceiling of 84 months (BR-195), and the change **applies forward only**:
   entries already retained under a longer setting are never retroactively deleted (FR-ACCT-033).
3. **Given** any retention change **when** it commits **then** it is written to the activity log with the
   previous and new values and the actor (BR-195), and the period in force is stated in the interface
   wherever the log is shown and in every export the log produces.
4. **Given** a shortened window **when** it is submitted **then** the pre-commit summary states what will
   stop being kept and from when, because a retention change is a data-loss decision made by typing a
   smaller number.
5. **Given** the configurable numeric limits of BR-231 **when** they are exposed **then** each shows the
   value in force and its default, each may be raised or lowered per data room and per team, and each
   change takes effect without a deployment and is logged.
6. **Given** the version window **when** it is shortened **then** the always-keep-3 guarantee of BR-186
   still holds: the three most recent versions survive regardless of age, and the summary says so.
7. **Given** a non-administrator **when** they call the endpoint **then** `403`, recorded as an
   `access-denied` event; **and given** any colleague opens the screen read-only **then** they still see
   the periods in force, because a user is entitled to know how long their data is kept.
8. **Given** a room under legal hold (NFR-COMPL-006) **when** a retention change would shorten its
   window **then** the hold wins, the room is named as exempt in the summary, and the exemption is
   recorded.

**Mobile acceptance criteria**

- Each setting is one row at least 48 CSS px tall showing label, value and source; tapping it opens a
  single-scope sheet with the permitted range stated as text before the field.
- Period entry is a numeric field plus a unit control, not a free-text string, and both stay visible
  above the software keyboard (SC 2.4.11).
- The pre-commit summary of a shortening is announced assertively, because it is the one change in this
  story that can lose data on a schedule.
- At 200% text size no row truncates its value; labels wrap to a second line.

**Edge cases & negative paths**

- A period submitted outside the BR-195 bounds: rejected with a typed error naming both bounds and the
  value in force, with the typed value preserved.
- A shortening submitted while a purge job for the old window is mid-run: the running job completes
  against the old policy, the new policy applies to entries created after the change, and the summary
  states the changeover date rather than implying an immediate effect.
- Two administrators changing the same window concurrently: `412` with the current value and a
  re-confirmation, as in US-E12-19.
- A lengthened window: applied immediately to future entries, with an explicit line stating that
  entries already purged cannot be recovered by lengthening the window.

---

### US-E12-24 — The administrator role, enforced on the server

**As a** security reviewer **I want** the administrator capability to be one named, logged, revocable
grant that confers no room access **so that** governance authority can never become a read-everything
back door.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E12-01 |
| Traces to | FR-ACCT-034, NFR-SEC-007, NFR-SEC-008, NFR-SEC-015, NFR-SEC-016, NFR-SEC-017, NFR-COMPL-001, NFR-OBS-011, BR-044, BR-045, BR-121 |

**Acceptance criteria**

1. **Given** every governance endpoint — quota, retention, configurable limits, provisioning,
   deprovisioning — **when** it is called **then** authority is checked server-side against the
   administrator capability of BR-044, and a caller without it receives `403` regardless of what the
   client rendered.
2. **Given** the administrator capability **when** it is resolved **then** it is a **separate named
   capability, not a role tier**: no room role confers it, it confers no room role, and being the Owner
   of a room grants none of it (FR-ACCT-034).
3. **Given** an administrator **when** they request a room they hold no grant on **then** they receive
   the same `404` any stranger receives, byte-identical and with identical timing (NFR-SEC-017), because
   administration is not a read-everything back door.
4. **Given** a consequential governance action — lowering a quota, shortening retention, deprovisioning
   an account, granting or revoking the administrator capability — **when** it is committed **then**
   step-up re-authentication is required if the device's last successful step-up is older than the window
   in BR-045.
5. **Given** the capability **when** it is granted or revoked **then** the change is written to the
   activity log with the previous and new values and notifies both the affected account and the account
   holder, so nobody gains or loses governance authority silently.
6. **Given** a penetration test **when** every governance endpoint is called with a non-administrator
   session, including a room Owner's session and a recipient's share token **then** every call is refused
   and each refusal is recorded as an `access-denied` event.
7. **Given** an administrator's own actions **when** they are reviewed **then** they are visible in the
   activity log to another administrator, so the role is reviewable by a peer rather than only by itself
   (FR-ACCT-034).
8. **Given** the last remaining administrator **when** revocation of their capability is attempted
   **then** it is refused with a typed error, because an account with no administrator cannot set a
   limit or run a leaver flow.

**Mobile acceptance criteria**

- Step-up on a phone prefers a passkey assertion (Face ID, Touch ID or Android biometrics) over a typed
  password, and the copy says "Confirm it is you" rather than implying the operating system locked the
  app, because no web API can force an OS biometric check on resume.
- The refusal state for a non-administrator fits on one line at 360 px and names an actual person, so the
  user knows who to ask.
- With a screen reader on, the step-up prompt announces its purpose once ("Confirm it is you to change
  the storage limit") and focus lands on the confirm control.

**Edge cases & negative paths**

- An administrator grants themselves a room role to read a room: permitted only through the normal grant
  path, which is logged as a grant like any other and visible to the room's Owner — the point is that
  it leaves a trace, not that it is impossible.
- Administrator capability granted to an account that is then deprovisioned: the capability is revoked in
  the same transaction as the deprovisioning, and the last-administrator check of AC8 runs first.
- A client caches `isAdministrator: true` after the capability is revoked: the next mutating call is
  refused server-side, the client refetches `/me` and the affordances disappear (US-E12-01 AC8).
- Step-up unavailable on the device (no passkey, password manager blocked): the password fallback of
  [E01](./epic-01-access-and-identity.md) applies; the action is never silently permitted without a
  step-up.

---

### US-E12-25 — Optional team-level storage ceiling

**As an** administrator running several teams **I want** to set one ceiling a whole team shares **so
that** I can govern a department's footprint without touching every room it owns.

| | |
|---|---|
| Priority | Could |
| Release | R2 |
| Estimate | 3 |
| Depends on | US-E12-19 |
| Traces to | FR-ACCT-028, FR-ACCT-027, FR-ACCT-034, NFR-SEC-015, NFR-A11Y-019, BR-044, BR-199 |

**Acceptance criteria**

1. **Given** `PATCH /api/account/governance` with a team scope **when** an administrator sets a team
   ceiling **then** it applies to every room that team owns as a **shared** ceiling, and the team's usage
   is the sum of its rooms' usage (BR-199).
2. **Given** a room with an explicit room-level ceiling **when** a team ceiling also applies **then** the
   room-level value **takes precedence** for that room while the team total still governs the team
   (FR-ACCT-028), and both are named on the room's storage screen.
3. **Given** the team ceiling **when** it is reached **then** the refusal names the team as the breached
   scope, not the room, because a colleague otherwise cannot understand why a room showing free space
   refuses an upload.
4. **Given** a team ceiling lowered below the team's current usage **when** it commits **then** the
   never-delete path of US-E12-20 applies unchanged at team scope.
5. **Given** a room moved between teams **when** the move commits **then** both teams' totals are
   recomputed within the 10-second freshness window of BR-200, and the room's storage screen names its
   new governing scope.
6. **Given** the team screen **when** it renders **then** it lists the team's rooms ordered by size with
   the team total against its ceiling, so an administrator can see which room to talk to somebody about.

**Mobile acceptance criteria**

- The team storage screen is a list, never a table, at 360 px: one room per row with a right-aligned
  value, at least 48 CSS px tall, no horizontal scrolling (SC 1.4.10).
- The governing-scope line is text, at most two lines at 200% text size, and never conveyed by colour or
  by position alone.
- Setting a team ceiling reuses the same single-scope sheet as US-E12-19, with the scope named in words
  in the sheet's title.

**Edge cases & negative paths**

- A team ceiling set below the sum of its rooms' explicit ceilings: accepted, with an explicit line
  stating that the team total will refuse writes before the room ceilings do.
- A team with no ceiling set: only the account ceiling and any room ceilings apply, and the team screen
  says "no team limit set" rather than showing an invented number.
- Team deleted while a ceiling is set on it: the ceiling is discarded with the team, its rooms fall back
  to the account ceiling, and every affected room Owner is notified of the change in governing scope.

---

### US-E12-17 — Data export and portability

**As a** P1 Marcy Doyle leaving or archiving a year of work **I want** a complete copy of my rooms in a
usable structure **so that** I am never locked in and can hand a client their own documents.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E12-24 |
| Traces to | FR-ACCT-022, FR-ACCT-023, NFR-COMPL-004, NFR-COMPL-009, NFR-SEC-014, NFR-MOB-023, NFR-PRIV-004, BR-045, BR-129, BR-237 |

**Acceptance criteria**

1. **Given** `POST /api/account/export` **when** it is called by the owner with step-up **then** it returns
   `202` and runs asynchronously, and a notification plus an email deliver a time-limited download link on
   completion; it is never a blocking request.
2. **Given** the export **when** it is produced **then** it contains a folder-structured archive mirroring
   the room and folder hierarchy with original filenames, plus a machine-readable manifest (JSON) of
   accounts, rooms, folders, files with checksums and sizes, shares with their policies, invites, roles,
   and the activity log within retention.
3. **Given** filename collisions or characters unsupported by a target filesystem **when** the archive is
   built **then** names are deterministically disambiguated, the mapping is recorded in the manifest, and
   nothing is silently renamed without a record.
4. **Given** the archive **when** it exceeds the 10 GB or 20,000-file archive ceiling (NFR-SCALE-012)
   **then** it is split into parts with a stated part size and an index, so a phone or a modest laptop can
   fetch it, and the download page lists the parts with their checksums.
5. **Given** the export link **when** it is issued **then** it is single-account scoped, expires in 7 days,
   and requires an authenticated session to redeem, so a forwarded link does not leak an entire account.
6. **Given** the export **when** it completes **then** an activity event records who exported what and when,
   because a full-account export is the single most sensitive read operation in the product.
7. **Given** rate limiting **when** exports are requested **then** the limit is one full export per account
   per 24 hours, and the refusal states the limit and the time remaining.
8. **Given** a room-scoped export **when** the owner requests one **then** the same machinery produces a
   single room's archive, because that is the realistic request when handing documents to a client at
   engagement close.
9. **Given** a colleague who has been deprovisioned (US-E12-22) **when** an administrator requests their
   export **then** the same machinery produces it under the administrator's authority (FR-ACCT-022), the
   export is logged with the administrator as the actor and the leaver as the subject, and the
   deprovisioned account is not reactivated to make it possible.

**Mobile acceptance criteria**

- The export is requested in two taps with a confirmation stating the total size and the number of files,
  and the job runs server-side so backgrounding the app cannot cancel it.
- Nothing is zipped in the browser: on a phone the memory ceiling is roughly 100 to 200 MB with no
  catchable exception, and iOS has no save-file picker to stream into, so client-side archiving is not
  implemented at all.
- Progress appears in the notification centre and as a status line, and the completion notification is
  actionable with a 48 CSS px download control.
- On iOS the copy names the Files app and the Downloads folder for where the parts will land, and the app
  keeps an in-app list of re-fetchable links rather than pretending to track local files.

**Edge cases & negative paths**

- Export requested while the account is over quota or read-only after a quota reduction: permitted,
  because withholding someone's own data over a storage condition is not acceptable (BR-204).
- Export requested during an account-deletion retention window: permitted and encouraged, with the copy
  stating the deletion date so the user knows their deadline.
- Job fails midway: no partial link is delivered; the notification says "Your export failed. Nothing
  changed. Try again." and the failure is alerted internally.
- Export containing files still being scanned for malware: those files are excluded, listed explicitly in
  the manifest as excluded with the reason, and the summary states the count so the user is not misled
  about completeness.

---

### US-E12-18 — Account deletion: storage reclamation and the retention window

**As a** P1 Marcy Doyle whose engagements have all closed **I want** to delete my account and know
exactly what happens to my storage and to the links my counterparties hold **so that** I can leave
cleanly without a support ticket.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E12-03, US-E12-24 |
| Traces to | FR-ACCT-024, FR-ACCT-025, FR-AUTH-028, NFR-PRIV-004, NFR-COMPL-005, NFR-COMPL-006, NFR-SEC-029, BR-045, BR-190, BR-191, BR-193, BR-194 |

**Acceptance criteria**

1. **Given** the deletion request flow owned by [E01](./epic-01-access-and-identity.md) (US-E01-18)
   **when** the user reaches the storage side of it **then** this epic supplies: the current storage
   figure that will be destroyed, the number of rooms and files, the reclamation schedule, and a
   prominent offer to export first (US-E12-17).
2. **Given** the confirmation **when** it renders **then** it states the exact blast radius in counts and
   bytes ("8 rooms, 2,140 files, 26.4 GB will be permanently deleted after 30 days") and the exact purge
   date, and the "Keep my account" option is the visually dominant, thumb-reachable choice.
3. **Given** deletion is confirmed **when** it commits **then** the storage the account occupied is
   marked for reclamation on the schedule in AC5 rather than freed immediately, the figure remains
   visible to an administrator during the retention window so the account's footprint is never
   unaccounted for, and no quota condition anywhere else in the workspace is resolved by the deletion
   until the purge actually completes.
4. **Given** the retention window (30 days per BR-190) **when** it is active **then** all sessions and
   shares are already revoked, every principal who held a grant has been notified that their access has
   ended (BR-191), content is inaccessible to everyone including the owner except through the recovery
   flow, and storage still counts internally but no quota condition can arise because no writes are
   possible.
5. **Given** the window elapses **when** the purge job runs **then** all room content, files, thumbnails,
   preview assets and derived data are destroyed, blobs are released, storage figures go to zero,
   encrypted backups are rotated out within a further 35 days which is the stated backup horizon
   (BR-194), activity records are anonymised in place with a tombstone identity rather than deleted
   (BR-192), and a deletion receipt is emailed before the mailbox link is severed.
6. **Given** the request is cancelled within the window **when** the user cancels it **then** full access
   is restored (BR-193), previously revoked share links are **not** automatically restored and must be
   granted again explicitly (BR-193), and the quota in force is whatever an administrator has set for the
   account at that moment rather than whatever was in force when deletion was requested.
7. **Given** recipients holding links **when** deletion is confirmed **then** their next request returns the
   server-enforced "This Data Room is no longer available." state, no cached copy survives the next
   successful validation, and they are notified once by email that their access has ended.
8. **Given** an account that owns rooms **when** deletion is requested **then** the same
   ownership decision as in US-E12-22 is forced before the request can be confirmed — every room is
   transferred to a named colleague or explicitly included in the deletion — and no colleague's own
   account is affected (BR-013).

**Mobile acceptance criteria**

- The blast-radius sentence is fully readable at 360 px and at 200% text size without truncating either
  count or the byte figure; a screen reader reads it in full before the confirm control is reachable.
- The confirmation requires typing the word DELETE or a step-up assertion (Assumption: step-up on mobile,
  because typing a word on a phone keyboard is friction without safety value), and the control fires on the
  up-event with an abort path (SC 2.5.2).
- The "Export my data first" action is offered inside the same sheet as a secondary control at least 48 CSS
  px tall, so the safe path is one tap away from the dangerous one without being confusable with it.
- During the retention window, opening the app shows a persistent state with the purge date and a single
  "Cancel deletion" action within thumb reach.
- Haptic feedback fires on the destructive commit where the platform exposes vibration.

**Edge cases & negative paths**

- Deletion requested while an upload is in flight: the upload is aborted server-side, its parts are
  discarded, no partial file appears, and the confirmation states that queued uploads will not complete.
- Deletion requested for an account that holds the last administrator capability: refused with the same
  typed error as US-E12-24 AC8, because an account with no administrator cannot run the next leaver flow.
- Purge job partially fails: it is idempotent and retried, and the account is not marked deleted until every
  object is confirmed destroyed; a stuck purge alerts internally rather than reporting success.
- User re-signs up with the same email during the window: the new signup is a new account and the copy makes
  that explicit; the pending deletion is not silently cancelled by a new signup.
- Legal hold on an account: purge is suspended, the account holder is told that a legal obligation delays
  deletion, and the suspension is recorded.

---

## Withdrawn in the internal-tool rework

The product's nature changed: this is an internal tool, so the entire commercial surface of this epic is
withdrawn rather than deferred. The story IDs below are retired permanently. They are listed here, rather
than renumbered away, so that any surviving cross-reference in a sprint plan, a test name or a commit
message resolves to an explicit tombstone. **Surviving stories were not renumbered, the replacement
stories take fresh numbers (US-E12-19 to US-E12-25), and no withdrawn number will ever be reused.**

| Withdrawn ID | Was | Why it is gone |
| --- | --- | --- |
| US-E12-09 | Published plan catalogue with real prices and real limits | There are no plans and no prices. The limits it would have published are administrator-set values whose source is named on the screen that shows them (US-E12-19) |
| US-E12-10 | Buy a plan on a phone with a card | No purchase path exists in an internal tool. Nothing about checkout, wallets, 3-D Secure or payment providers survives |
| US-E12-11 | Trials without a card | Nothing to trial |
| US-E12-12 | Downgrade and cancel without contacting support | Nothing to downgrade or cancel. The one behaviour worth keeping — over-limit content becomes read-only and is never deleted — is now the quota-reduction path of US-E12-20 |
| US-E12-13 | Failed payment dunning that degrades to read-only, never deletes | No payment, so no dunning. BR-207 is withdrawn with it. The only routes into a read-only state are now an administrator setting it, a quota reduction (US-E12-20) and suspension for abuse (BR-229), all enumerated in BR-129 |
| US-E12-14 | Seats and team members | No seats. Colleagues are provisioned and deprovisioned by an administrator (US-E12-21, US-E12-22); external recipients are never accounts and were never metered |
| US-E12-15 | Billing authority, enforced on the server | Replaced in full by the administrator capability of US-E12-24, which is the same server-side-authority story with governance as its subject instead of money |
| US-E12-16 | Invoices and receipts on a phone | No invoices exist. NFR-I18N-012 (currency and invoice locale formatting) is withdrawn with it |

Two behaviours these stories used to carry are deliberately **kept** elsewhere, because they were never
really commercial: never losing data when a limit changes (US-E12-20) and never losing the ability to
revoke a share in any degraded state (US-E12-07, BR-204).

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| Sign-up, sign-in, sessions, passkeys, step-up mechanics, email and password change, and the account-deletion request and recovery flow itself | [E01](./epic-01-access-and-identity.md) |
| Storage measurement itself: incremental accounting, reconciliation, drift alerting and the `/account/storage` computation | [E10 US-E10-17](./epic-10-performance-offline-and-scale.md) |
| Room creation, archive, room-level trash and the room card that shows the storage figure | [E02](./epic-02-data-rooms-and-workspace-home.md) |
| Upload pipeline, resumable chunking, the upload tray's interaction design and partial-failure reporting | [E04](./epic-04-file-operations.md) |
| Trash, versioning, retention mechanics and permanent-delete confirmation patterns | [E08](./epic-08-conflict-resolution-and-data-integrity.md) |
| Notification delivery channels, push capability per surface, digests and mute; this epic supplies the quota and governance classes | [E11](./epic-11-trust-audit-and-notifications.md) |
| Share roles, watermarking, link policies and read-only share enforcement (distinct from the storage-driven read-only of US-E12-20) | [E07](./epic-07-sharing-and-access-control.md) |
| Sheets, toasts, banners, safe areas and the accessibility system | [E09](./epic-09-mobile-ux-foundations.md) |
| The company identity provider itself, and SSO or SCIM as the source of joiner and leaver events | Assumed rather than built. The FR-AUTH notes record the assumption; this epic's provisioning endpoints are idempotent on the external subject id so that an integration can drive them later (US-E12-21 AC6). |
| Anything commercial: plans, prices, seats, invoices, payments, trials, checkout, metering-as-revenue | Deliberately out, and not deferred. There is no commerce in this product. See the tombstone table above for the story IDs that carried it. |
| Team and org-chart modelling beyond the flat team placement provisioning needs | Not in R1 to R2. Recorded as OQ96. |

## Open questions

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ89 | What are the real default figures an administrator should start from — the 1 TiB account ceiling of BR-199 and the per-field defaults of BR-231 — measured against how our own teams actually use storage rather than reasoned from first principles? | Product + IT operations | Before R1 launch |
| OQ90 | Should the 75% storage warning be suppressed for the first 24 hours of a newly provisioned room whose administrator set a deliberately small ceiling, or is the source line (US-E12-19 AC4) enough to make the warning useful rather than noisy? | Product | R1 launch |
| OQ91 | Do trash and previous versions count against quota? R1 assumes yes for both, shown as separate lines (BR-197). This is the decision users will argue with most, and the alternative — current files only — is more generous and less honest about what we are actually storing. | Product + IT operations | Before R1 code freeze |
| OQ92 | Should the administrator capability be splittable — one person for quota and retention, another for joiner and leaver flows — or does one undivided capability match how a team of our size actually works? | Product + Security | Before R1 code freeze |
| OQ93 | Who is the second administrator? US-E12-24 AC8 refuses to leave the account with none, which means go-live needs at least two named people and a documented handover. | IT operations | Before R1 launch |
| OQ94 | Does the leaver flow need a scheduled variant — deprovision at 18:00 on someone's last day — or is manual execution on the day acceptable for the volume of departures we actually have? | Product + IT operations | R2 planning |
| OQ95 | Is `PATCH /api/account/governance` the right shape for every limit in BR-231, or do the rate-limit ceilings deserve their own endpoint so that a mistyped storage figure can never be applied to a rate limit? | Engineering | Sprint before R1 governance work |
| OQ96 | Do we need team and org-chart modelling beyond the flat team placement that provisioning requires, given that the team-level ceiling of US-E12-25 is the only feature that reads it? | Product | R2 planning |
