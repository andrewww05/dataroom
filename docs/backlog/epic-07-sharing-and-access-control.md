# Epic E07 — Sharing & Access Control

## Purpose

This epic is the product. Every comparable tool in the prior art lets a recipient read on a phone;
not one lets a room owner run the room from one, and that gap is documented in the vendors' own
words. E07 makes grant, scope, downgrade and revoke first-class touch operations, enforces every one
of them on the server rather than by hiding a button, and guarantees that an external recipient can
open a shared link on a phone and be reading the document in two taps with no account. It also
answers, on one screen and at a glance, the question that decides whether a colleague trusts the
tool with a confidential document set: who can see what right now.

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
  [E08 Conflict Resolution & Data Integrity](./epic-08-conflict-resolution-and-data-integrity.md),
  [E09 Mobile UX Foundations](./epic-09-mobile-ux-foundations.md),
  [E11 Trust, Audit & Notifications](./epic-11-trust-audit-and-notifications.md),
  [E12 Account, Storage & Governance](./epic-12-account-storage-and-governance.md)

## Epic summary

| Field | Value |
| --- | --- |
| Epic ID | E07 |
| Goal | Let a room owner grant, scope, downgrade and instantly revoke access to a room, a folder or a single file entirely from a phone; enforce every permission decision on the server; and let an invited or linked external recipient reach readable content in two taps with no account, no install and no interstitial beyond a configured password or email gate. |
| Primary personas | P1 Marcy Doyle (engagement lead, iPhone-primary, the staff sharer whose whole job this is), P6 Ray Okonkwo (field staff sharing from a client site on one bar of LTE), P2 Dev Raman (external recipient with no account, Android, opens the link on a commuter train), P3 Tomás Ferreira (external adviser acting for a counterparty, invited into somebody else's room and who must not see more or less than he was given), P5 Ingrid Sørensen (senior external decision-maker, zero patience budget for a gate) |
| Release span | R1 (stories 01 to 16, less the clauses tagged otherwise below), R1.1 (story 17 and the expiry controls inside story 06, per FR-SHARE-009 and FR-SHARE-012), R2 (story 18, the email-capture gate in story 10 and the active-link ceiling in story 04). Release tags are derived from [05](../05-functional-requirements.md), which owns them. |
| Story count | 18 |
| Total points | 97 |
| Depends on | E01 (subject and recipient identity, step-up re-auth), E02 (room, ownership, the invisibility rule), E03 (node tree and breadcrumb), E04 (files exist to share), E09 (sheet system, bottom action bar, destructive confirmation pattern, status announcer) |
| Blocks | E11 (activity log and viewer analytics report on grants and links; access-request notifications need grants to exist), E12 (the account-level recipient ceilings in BR-236 are counted from grants) |

## Mobile-first design stance

- **Three taps to share, three taps to revoke, both inside the thumb zone.** From a folder listing at
  360 px, Share is reachable in one tap (bottom action bar) plus one tap in the sheet plus one tap to
  confirm. Revoke is reachable from the share-management screen, from the recipient row in that
  screen, and from the item's access sheet. This is the specific thing the prior art cannot do, so
  it is written as a measurable acceptance criterion (tap counts, not adjectives) in US-E07-04 and
  US-E07-11.
- **One sheet, one scope, one explicit Apply, and a plain-language summary before commit.** Inline
  accordions are banned in every permission surface: Baymard's research found users could not tell
  which fields were in scope for submission, and in an access-control sheet that ambiguity is a
  security defect. Every share sheet ends with a sentence a colleague can read aloud, for example
  "Dev Raman will be able to view 12 files in Financials. He will not be able to download them."
- **Effective permission is printed on the item, never hidden behind a menu.** Each folder and file
  row carries a shared-state indicator, and the details sheet states the effective role and the
  download flag. The answer to "can the recipient see this folder?" must never require navigation,
  because navigating to check is exactly what a person in a client car park does not do.
- **The desktop primitive here is a permission matrix table, and it is hostile to touch.** A grid of
  principals crossed with folders cannot be rendered at 320 CSS px without two-dimensional scrolling,
  which SC 1.4.10 Reflow forbids. The touch-first replacement is a per-principal card list
  ("Dev Raman — Viewer, no download, 3 folders") with a per-item access sheet as the inverse view;
  the matrix returns as a desktop enhancement at the `expanded` class and above on the size-class
  ladder in [03](../03-product-overview.md), never as the baseline.
- **Revocation is designed as an emergency action and reports completion rather than assuming it.**
  It commits on the up-event, confirms with the recipient's name and the scope, and shows a result
  state that names what was revoked. A silent revoke on a phone is indistinguishable from a failed
  tap, and believing you revoked when you did not is a leak. There is no undo on a revoke; the
  recovery path is "share again", which is stated in the confirmation.
- **The recipient path carries the strictest budget in the product.** Tap the link, land on readable
  content, two taps maximum, no signup, no install, no interstitial other than a configured password
  or email gate, on both platforms. The recipient entry route is server-rendered where that buys
  first paint, and it is measured at p75 on the reference device and reference network defined in
  [03](../03-product-overview.md).
- **Hover is not an enforcement surface and neither is a hidden button.** Read-only is enforced by the
  API for every mutating verb, verified by a QA suite that calls each one with a Viewer token. In the
  interface, unavailable commands are hidden rather than dimmed, per Apple's context-menu rule, so a
  Viewer never taps something that then fails.
- **Typing an email address twice is a defect.** Share sheets use platform autofill and offer
  previously invited addresses for selection, satisfying SC 3.3.7 Redundant Entry. On a phone the
  email field is the single highest-abandonment control in this epic.

---

## User stories

### US-E07-01 — The role model and the server-side authorisation kernel

**As a** platform engineer building for P1 Marcy Doyle **I want** one server-side capability matrix
that maps role plus flags to permitted operations **so that** every screen, endpoint and test in the
product asks the same question in the same place and cannot drift.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E01-01, US-E02-02 |
| Traces to | FR-SHARE-006, FR-SHARE-007, FR-SHARE-008, FR-SHARE-017, NFR-SEC-001, NFR-SEC-003, NFR-MAINT-001, BR-013, BR-014, BR-015, BR-016, BR-017, BR-121, BR-233, BR-235 |

**Acceptance criteria**

1. **Given** the shared contract in `packages/shared` **when** a developer imports the sharing types
   **then** `ShareRole` is exported as the union `'owner' | 'manager' | 'contributor' | 'viewer'`
   with a total order `viewer < contributor < manager < owner`, and `canDownload` and `canReshare`
   are exported as independent booleans that are never folded into the role name.
2. **Given** the capability matrix **when** it is consulted **then** it resolves exactly this table,
   and a unit test asserts every cell:

   | Operation | Viewer | Contributor | Manager | Owner |
   | --- | --- | --- | --- | --- |
   | List a folder, open a preview | yes | yes | yes | yes |
   | Download content | only if `canDownload` | only if `canDownload` | only if `canDownload` | yes |
   | Upload a file, create a folder | no | yes | yes | yes |
   | Rename an item | no | own uploads only | yes | yes |
   | Move or copy an item | no | no | yes | yes |
   | Delete to trash | no | no | yes | yes |
   | Restore from trash | no | no | yes | yes |
   | Permanently delete | no | no | no | yes (with step-up) |
   | Create or edit a share | no | only if `canReshare` | yes | yes |
   | Revoke a share it created itself | yes, its own only | yes, its own only | yes | yes |
   | Revoke a share created by someone else | no | no | yes, at or above the grant's scope | yes |
   | View the activity log | no | no | yes | yes |
   | Rename, archive or delete the room | no | no | rename and archive | all |
   | Transfer ownership | no | no | no | yes (with step-up) |

3. **Given** any role **when** a grant is created **then** `canDownload` defaults to `false` for
   `viewer` and `contributor` and `true` for `manager` and `owner`, `canReshare` defaults to `false`
   for `viewer` and `contributor`, and a request that sets `canReshare: true` on a `viewer` is
   accepted (the flags are orthogonal by design) and recorded in the activity log as a widening.
   The revoke row of the table above is the conditional case in BR-235: the principal that created a
   grant or a link may always revoke that grant or link and nothing else, whatever its own role.
4. **Given** a `ShareLink` **when** it is minted **then** its role is `viewer` and only `viewer`
   (FR-SHARE-004); a request for `contributor`, `manager` or `owner` on a link is rejected with HTTP
   400 and code `VALIDATION_FAILED`, because no anonymous holder of a URL may ever write and because
   owner and manager authority is never grantable by a URL. The orthogonal download-allowed flag
   (FR-SHARE-007) is the only variable a link carries.
5. **Given** a room with exactly one `owner` **when** an API call attempts to remove or downgrade
   that owner **then** the call is rejected with HTTP 409 and the message "A room must always have an
   owner. Transfer ownership first.", and a database constraint makes an owner-less room
   unrepresentable.
6. **Given** any mutating endpoint in the API surface **when** it executes **then** it calls the
   single authorisation service with `(subjectId, roomId, nodeId, operation)` and no controller
   contains its own role comparison; a CI lint rule fails the build on a literal role-string
   comparison outside the authorisation module.
7. **Given** a caller with no grant at all on the target **when** any endpoint is called **then** the
   response is HTTP 404 `NOT_FOUND` with no discriminating detail and response timing within 10 ms of
   the timing for an id that genuinely does not exist, so the id space cannot be enumerated (BR-049,
   BR-233). This is the only refusal such a caller can ever receive: there is no code path on which a
   principal holding no grant on the target learns that the target exists.
8. **Given** a caller that already holds a grant **on that exact target** and is exceeding it **when**
   the operation is refused **then** and only then is the response HTTP 403, carrying the specific
   code from the catalogue in [09](../09-domain-model-and-glossary.md) (`READ_ONLY_SHARE`,
   `DOWNLOAD_NOT_PERMITTED`, `ROOM_ARCHIVED`, `STORAGE_QUOTA_EXCEEDED`) and never a generic 403. A
   parameterised test asserts that every 403 the API can emit satisfies the precondition "the caller
   holds a grant on this target"; a 403 that can reach a grantless caller is a security defect,
   because it discloses existence.
9. **Given** the data room is at its administrator-set storage quota (BR-199) or the room is archived
   **then** the effective capability set is intersected with read-only for every role except the
   owner's ability to fix the cause, and the API returns the specific reason code
   (`STORAGE_QUOTA_EXCEEDED`, `ROOM_ARCHIVED`) rather than an undifferentiated refusal.

**Mobile acceptance criteria**

- No user-visible surface of its own, but every client capability check reads from the
  `capabilities` object returned with each room and node payload, so the phone never computes a
  permission locally. QA test: with a Viewer session, patch the local store to claim `canDelete`,
  tap Delete, and confirm the API returns 403 `READ_ONLY_SHARE`, the optimistic removal reverts
  within one animation frame, and a toast reads "You have view-only access to this room."
- The `capabilities` object for a folder listing adds no more than 400 bytes per page of 50 rows, so
  the listing payload stays inside the mobile budget in [E10](./epic-10-performance-offline-and-scale.md).
- With a screen reader on, a row whose capabilities exclude editing announces "Lease.pdf, PDF,
  1.4 megabytes, view only" rather than exposing disabled controls.

**Edge cases & negative paths**

- Role changed while a request is in flight: the request is authorised against the grant state at
  execution time, not at token issue time; a Contributor demoted to Viewer mid-upload receives 403
  `READ_ONLY_SHARE` on the next chunk and the tray entry moves to blocked with "You no longer have
  permission to add files here."
- Two grants for the same principal at the same scope: forbidden by a unique constraint on
  `(roomId, scopeNodeId, principalType, principalId)` where `state = 'active'`; a second create
  returns 409 `ALREADY_EXISTS` with a "go to it" action.
- An invited recipient holding a Viewer grant **on that exact target** attempts a Manager operation:
  403 with the read-only code, copy "Only the room's owner or a manager can do that." The same
  recipient attempting the same operation on a target it holds no grant on gets 404, not 403, because
  otherwise the refusal is an existence oracle.
- A role string arrives that the server does not recognise (client from a future release): 400
  `VALIDATION_FAILED`, never coerced to a default.

---

### US-E07-02 — Permission resolution: inheritance, override and effective permission

**As a** P1 Marcy Doyle scoping one subfolder to one external recipient **I want** a single,
predictable rule for how a grant on a parent reaches a child and how a grant on a child overrides its
parent **so that** I can scope Financials to one external adviser without accidentally exposing the
whole room.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E07-01 |
| Traces to | FR-SHARE-002, FR-SHARE-024, FR-SHARE-025, NFR-SEC-001, NFR-PERF-001, BR-061, BR-078, BR-079, BR-080 |

**Acceptance criteria**

1. **Given** a principal and a target node **when** effective permission is resolved **then** the
   algorithm is exactly: (a) collect every active grant for that principal whose `scopeNodeId` is
   null or is an ancestor-or-self of the target; (b) walk from the target upward and stop at the first
   grant whose `inheritMode` is `override`, which alone determines role and flags; (c) if no override
   is found, the effective role is the most permissive collected role and `canDownload` and
   `canReshare` are true if any collected grant sets them true; (d) if nothing is collected, there is
   no access and the API returns 404.
2. **Given** an override grant at a folder **when** a descendant of that folder is resolved **then**
   resolution stops at the override, so a Viewer override on `Financials` beats a Manager grant on the
   room, and a unit test proves that widening the room grant does not widen the overridden subtree.
3. **Given** a share link scoped to a folder **when** the recipient resolves any node **then** the
   link principal can only ever resolve nodes at or below its `scopeNodeId`, the breadcrumb returned
   to that recipient is rooted at the link scope (never showing ancestor names), and a request for the
   parent returns 404, not 403.
4. **Given** a folder is moved under a differently-shared parent **when** resolution runs afterwards
   **then** grants scoped to the moved folder travel with it unchanged, grants inherited from the old
   parent cease to apply, and the mover is shown, before commit, a summary in the form "Moving
   Financials into Counterparty A changes who can see it: 1 person gains access, 2 people lose access.
   Review" with a tappable review list.
5. **Given** any node **when** `GET /rooms/:roomId/nodes/:nodeId/access` is called by a Manager
   **then** the response lists every principal with an effective role at that node, each row stating
   whether the permission is inherited (naming the ancestor it comes from) or set here, and the
   response is computed in a single query with p95 server time <= 150 ms for a tree of depth 32.
6. **Given** a node whose ancestor is trashed **when** any principal resolves it **then** access is
   refused with 404 `SHARE_TARGET_UNAVAILABLE` for recipients and the item appears only in the room's
   Trash for Managers, so a trashed folder can never leak through a link into its own subtree.
7. **Given** a grant with `expiresAt` in the past **when** resolution runs **then** it is excluded at
   request time by comparison, not by a background sweeper, and a test that freezes the sweeper still
   sees the expiry honoured.
8. **Given** an override is about to be created that is wider than the inherited permission **when**
   the sheet is confirmed **then** the pre-commit summary names the widening explicitly ("This gives
   Tomás Ferreira download access he does not have on the rest of the room") and requires the second,
   distinct confirmation tap defined in [US-E09-13](./epic-09-mobile-ux-foundations.md).

**Mobile acceptance criteria**

- The access sheet opens at the medium detent so the folder list stays partly visible behind it, and
  lists principals as cards, not as a matrix. At 360 x 640 with the keyboard closed, at least three
  principal cards are visible without scrolling and each card's primary target is >= 48 CSS px tall.
- Each card shows one line of inheritance provenance ("Inherited from Acme HVAC") that wraps rather
  than truncates at 200 percent text size.
- The move-changes-access summary appears in the same sheet as the move confirmation, never as a
  second stacked sheet, and its Review list is reachable without dismissing the sheet.
- On a flaky 4G connection, if the access resolution request has not returned within 800 ms the sheet
  shows skeleton principal cards matching the final row height, so no layout shift occurs when data
  arrives (CLS contribution 0).
- With a screen reader on, each card announces name, effective role, download state and provenance in
  that order as a single accessible label.

**Edge cases & negative paths**

- Conflicting same-scope grants after a data migration: resolution is deterministic (most permissive
  wins in the absence of an override), and an integrity check reports duplicates to telemetry as a
  defect rather than resolving silently.
- Cycle in the ancestor chain (corrupt data): resolution aborts, returns 500 `INTERNAL_ERROR` with a
  `requestId`, and raises an alert; it never falls back to granting access.
- Principal has an override that denies nothing but grants less: the narrower override still wins,
  and the share-management screen labels the row "Limited here" so the owner is not surprised.
- Deep tree performance: a node at depth 32 with 8 ancestor grants resolves within the same p95 target
  as depth 1; verified by a seeded fixture in CI.

---

### US-E07-03 — Read-only enforcement, proven verb by verb

**As a** P3 Tomás Ferreira invited as a Viewer **I want** the product to physically refuse my writes
rather than merely hide the buttons **so that** neither I nor a compromised client can alter a seller's
document set.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E07-01 |
| Traces to | FR-SHARE-011, FR-SHARE-017, FR-SHARE-018, NFR-SEC-001, NFR-SEC-004, BR-121, BR-133 |

**Acceptance criteria**

1. **Given** a Viewer token **when** each of these endpoints is called directly, bypassing the client
   **then** every one returns HTTP 403 with code `READ_ONLY_SHARE` and no state changes:
   `POST /rooms/:roomId/nodes`, `PATCH /rooms/:roomId/nodes/:nodeId`,
   `POST /rooms/:roomId/nodes/:nodeId/move`, `POST /rooms/:roomId/nodes/:nodeId/copy`,
   `DELETE /rooms/:roomId/nodes/:nodeId`, `POST /rooms/:roomId/nodes/:nodeId/restore`,
   `POST /rooms/:roomId/nodes/batch`, `POST /rooms/:roomId/uploads`, `PATCH /uploads/:uploadId`,
   `POST /uploads/:uploadId/commit`, `POST /rooms/:roomId/share-links`, `PATCH /share-links/:id`,
   `DELETE /share-links/:id`, `POST /rooms/:roomId/invites`, `PUT /rooms/:roomId/nodes/:nodeId/access`,
   `PATCH /rooms/:roomId`. This list is a checked-in parameterised test, not prose.
2. **Given** a Viewer without `canDownload` **when** `GET /rooms/:roomId/nodes/:nodeId/content` is
   called **then** the response is 403 `DOWNLOAD_NOT_PERMITTED`, no signed URL is issued, and the
   preview endpoints continue to work, so reading is unaffected by the download refusal.
3. **Given** a Viewer without `canDownload` **when** the preview manifest is served **then** it
   contains page-image URLs only, no original-asset URL, and the served page images carry
   `Cache-Control: private, no-store` so the original bytes are never reachable from the client.
4. **Given** a Viewer in the interface **when** any listing, details sheet or action sheet renders
   **then** write commands are absent from the sheet rather than dimmed, a persistent "View only" chip
   is present in the room header, and the bottom action bar shows only Search, Sort and Details.
5. **Given** an optimistic client change that the server then rejects **when** the 403 arrives
   **then** the client reverts the change, restores the prior scroll position and selection, and shows
   the server's message verbatim from the error catalogue; the reverted state is announced politely to
   assistive technology.
6. **Given** a room that becomes archived, or a data room that reaches its administrator-set storage
   quota (BR-199), while a Contributor is working **when** the next mutating request is made **then**
   the refusal names the actual reason (`ROOM_ARCHIVED`, `STORAGE_QUOTA_EXCEEDED`) rather than
   `READ_ONLY_SHARE`, so the user is not told they lack permission when they lack storage, and the
   quota message names the administrator to ask.
7. **Given** any 403 from this story **when** it is emitted **then** an `ActivityEvent` of kind
   `access.denied` is written with subject, operation and scope, and a spike in denials for one
   subject raises a security signal in [E11](./epic-11-trust-audit-and-notifications.md).

**Mobile acceptance criteria**

- The "View only" chip is visible in the sticky header at 360 px width without displacing the
  breadcrumb, has a >= 44 x 44 CSS px hit area, and on tap opens a sheet explaining "The owner gave
  you view-only access. You can read and preview files. You cannot add, rename or delete anything."
- QA test on a phone: with a Viewer link open, tap the file row's overflow button (long-press enters
  selection mode and never opens the sheet, per FR-MOB-001 and FR-FILE-035). The action sheet contains
  at most Preview, Details and Copy link (if resharing is allowed) and contains no destructive item at
  all, so the sheet stays within the four-button platform cap without scrolling.
- With airplane mode on, a Viewer who previously cached a room sees the same read-only affordances;
  no write control appears while offline, and the offline banner states "View only. You cannot make
  changes to this room."
- A rejected optimistic change on a 4G connection with 100 ms RTT reverts within 400 ms of the
  response and the toast does not obscure the bottom action bar or any focused element.

**Edge cases & negative paths**

- Replayed request with a stale idempotency key from a since-demoted Contributor: the idempotency
  cache is scoped per subject and the operation is re-authorised, so a replay after demotion returns
  403 rather than the cached success.
- Viewer attempts an upload via a share-target intent on Android: the intent is accepted by the OS,
  the app shows "You cannot add files to this room" and nothing is queued.
- Read-only enforced but preview generation needs a write to the render cache: the render cache write
  is performed by the service identity, never by the caller's grant, and a Viewer request never
  triggers a `READ_ONLY_SHARE` from an internal write.

---

### US-E07-04 — Mint a public link for a room, folder or file in three taps

**As a** P1 Marcy Doyle standing in a client's car park **I want** to create a shareable link to a
room, a folder or a single file in three taps **so that** an external recipient has the documents
while the request is still live.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E07-01, US-E07-02 |
| Traces to | FR-SHARE-001, FR-SHARE-002, FR-SHARE-003, FR-SHARE-004, FR-SHARE-026, FR-SHARE-027, NFR-SEC-002, NFR-MOB-001, BR-096, BR-101 |

**Acceptance criteria**

1. **Given** a room, folder or file **when** the sharer taps Share in the bottom action bar or in the
   row's action sheet **then** a single modal bottom sheet opens showing the scope name at the top,
   two clearly separated options ("Anyone with the link" and "Invite specific people"), and a Create
   button, and the total tap count from the listing to a created link is at most three.
2. **Given** the public-link option is confirmed **when** the API mints the link **then**
   `POST /rooms/:roomId/share-links` returns the plaintext token exactly once, only the SHA-256 hash
   and a six-character prefix are stored, and the response includes the full URL ready to copy.
3. **Given** a created link **when** the sheet updates **then** it shows the URL with the token prefix
   visible ("…/s/A7f3Qz"), the role, the download state, the expiry if set, and a one-line summary of
   what a holder can do, and the link is immediately usable.
4. **Given** the link's scope is a folder **when** a holder opens it **then** they see that folder and
   its descendants only, with the breadcrumb rooted at that folder, and a request for any ancestor or
   sibling returns 404.
5. **Given** any public link page **when** it is served **then** the response carries
   `X-Robots-Tag: noindex, nofollow`, a meta robots noindex tag,
   `Referrer-Policy: no-referrer`, and the token is never placed in a query string that could leak in
   a Referer header or a server log with default settings.
6. **Given** an existing link **when** the sharer chooses Rotate **then** a new token is minted, the
   old token stops working on the next request, the link's settings and its view history are
   preserved, and the sheet warns "Anyone using the old link will lose access immediately."
7. **Given** the per-item active-link ceiling in BR-101 is reached — 20 concurrently active public
   links by default, administrator-set under BR-231 — **when** Create is tapped **then** the API
   returns a typed limit error, and the sheet states the ceiling, the current count and the
   administrator to ask, and lists the existing links so one can be revoked instead. This clause is
   R2 with FR-SHARE-034; in R1 the ceiling is enforced server-side and reported as a plain refusal.
8. **Given** a sharer whose email is unverified **when** Create is tapped **then** the API returns 403
   `EMAIL_VERIFICATION_REQUIRED`, the sheet shows the address so a typo is visible and offers one-tap
   resend, and no link is minted.
9. **Given** a link is created **when** the transaction commits **then** an `ActivityEvent`
   `share.created` records scope, role, download flag, expiry, password presence and the creating
   subject.

**Mobile acceptance criteria**

- The Share sheet opens at the medium detent, has a >= 48 CSS px grabber that cycles detents on tap
  (the non-dragging alternative required by SC 2.5.7), dismisses on swipe-down, and preserves the
  underlying list's scroll position exactly on dismiss.
- On a 360 x 640 viewport, the Create button sits within the bottom 25 percent of the sheet, its hit
  area is >= 48 CSS px tall, and `env(safe-area-inset-bottom)` padding is applied so it never lands
  under the home indicator.
- Measured tap counts on a physical phone from the folder listing: Share (1), "Anyone with the link"
  (2), Create (3). QA fails the story if any default path needs a fourth tap.
- On a connection with 100 ms RTT the sheet shows a determinate progress state on Create and the link
  appears within 1.5 s p75; if the request has not returned in 5 s the sheet keeps the spinner,
  disables Create to prevent a double mint, and offers Cancel.
- If the app is backgrounded between tapping Create and the response, the pending creation is
  reconstructed on next open from the persisted idempotency key, and exactly one link exists.
- With a screen reader on, the created link is announced once politely as "Link created, view only,
  downloads off", and the URL field is reachable in the focus order immediately after.

**Edge cases & negative paths**

- Scope is trashed between opening the sheet and tapping Create: 404 `SHARE_TARGET_UNAVAILABLE`, copy
  "That item was deleted. Nothing was shared."
- Duplicate Create taps: the same `Idempotency-Key` returns the original link, so a double tap never
  mints two links.
- Room archived: 403 `ROOM_ARCHIVED`, copy "This room is archived and read-only. Unarchive it to share."
- Token prefix collides visually with another link: the share-management screen also shows creation
  time and scope, so two links are always distinguishable without exposing the secret.

---

### US-E07-05 — Distribute the link: clipboard first, share sheet second

**As a** P6 Ray Okonkwo standing on a client site **I want** to hand a created link to an external
recipient through whatever app I am already using **so that** I do not have to email myself the URL
from the phone.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 2 |
| Depends on | US-E07-04 |
| Traces to | FR-SHARE-032, NFR-MOB-006, NFR-A11Y-002 |

**Acceptance criteria**

1. **Given** a created link **when** the sheet renders **then** exactly two distribution controls are
   present, "Copy link" first and "Share…" second, both with visible text labels and both >= 48 CSS px
   tall.
2. **Given** Copy link is tapped **then** the URL is written to the clipboard using the async
   Clipboard API, a toast confirms "Link copied", and the toast is announced politely to assistive
   technology.
3. **Given** the Clipboard API is unavailable or permission is refused **then** the URL is presented
   in a selectable, pre-focused read-only field with the text already selected, and the copy is never
   reported as successful when it did not happen.
4. **Given** Share… is tapped and `navigator.share` is available **then** the platform share sheet
   opens with the URL and a title of the form "Acme HVAC — Financials", and cancelling the OS sheet
   returns to the app with the link still present.
5. **Given** `navigator.share` is unavailable (most desktop browsers) **then** the Share… control is
   not rendered at all rather than rendered and inert.
6. **Given** a link with a password **when** it is copied or shared **then** the password is never
   included in the URL or in the share payload, and the sheet reminds the sharer "Send the password
   separately" with a Copy password control that is a distinct action.

**Mobile acceptance criteria**

- On iOS Safari and Chrome for Android, tapping Share… opens the OS sheet within 300 ms of the tap and
  requires no additional permission prompt.
- The toast appears above the bottom action bar plus `env(safe-area-inset-bottom)` and does not cover
  the Copy link control, so a failed copy can be retried immediately.
- The read-only URL fallback field does not trigger the software keyboard on focus (`readonly` plus
  `inputmode="none"`), because raising the keyboard would hide the field on a 360 x 640 viewport.
- With the app installed to the Home Screen on iOS, clipboard write succeeds without the browser
  chrome, verified as an explicit device test.

**Edge cases & negative paths**

- Clipboard write silently fails on an older WebView: the toast is not shown; instead the fallback
  field appears with copy "Copy this link manually."
- User shares to an app that strips the token fragment: the token is a path segment, not a fragment,
  so it survives; a regression test asserts the URL shape `/s/<token>`.
- Link revoked between copy and paste: the recipient sees the revoked state from US-E07-12, not a
  broken page.

---

### US-E07-06 — Link controls: expiry, password, download and view cap

**As a** P1 Marcy Doyle sharing a confidential document set **I want** to put an expiry, a password and
a download switch on a link **so that** a forwarded URL does not become a permanent, untraceable copy
of our client's business.

| | |
|---|---|
| Priority | Must |
| Release | R1 for password and the download switch (FR-SHARE-010, FR-SHARE-011); R1.1 for expiry (FR-SHARE-009); R2 for the view limit (FR-SHARE-034) |
| Estimate | 5 |
| Depends on | US-E07-04 |
| Traces to | FR-SHARE-004, FR-SHARE-009, FR-SHARE-010, FR-SHARE-011, FR-SHARE-034, NFR-SEC-002, NFR-A11Y-004, BR-088, BR-089, BR-101, BR-108 |

**Acceptance criteria**

1. **Given** the link sheet **when** the sharer opens Link settings **then** the controls are a flat,
   labelled list in one sheet with one Apply button: Allow download (off by default), Expires (Never,
   24 hours, 7 days, 30 days, Custom date), Password (off by default), and View limit (Off, or a
   number). No inline accordion is used. **There is no role control on this sheet and there never will
   be**: a public-link holder is always a Viewer (FR-SHARE-004), the download-allowed flag is the only
   variable a link carries (FR-SHARE-007), and role selection belongs solely to the invite path in
   US-E07-07. The sheet states this in one line — "Anyone with this link can only read" — so the
   absence of the control reads as a decision rather than a missing feature.
2. **Given** Apply is tapped **then** `PATCH /share-links/:id` is sent with `If-Match`, the policy
   takes effect on the next request with no session grace period, and the sheet shows the resulting
   state as a sentence: "Anyone with this link can view 12 files until 4 September. Downloads are off.
   A password is required." That sentence is shown to the sharer only; nothing about the expiry is
   ever disclosed to an unauthenticated visitor (FR-SHARE-009, FR-SHARE-028).
3. **Given** a password is set **when** any recipient calls `GET /s/:token` **then** the API returns
   401 `SHARE_PASSWORD_REQUIRED` and serves no listing, no metadata, no thumbnail and no page image
   until `POST /s/:token/unlock` succeeds (BR-088); the password is stored as an argon2id hash and is
   never returned by any endpoint.
4. **Given** a password is changed or cleared **then** every unlocked session on that link loses access
   within the propagation target in BR-108 — 5 s at p95, 60 s absolute — and must unlock again, and the
   sheet says so before Apply.
5. **Given** Allow download is off **then** `GET .../content` returns 403 `DOWNLOAD_NOT_PERMITTED`
   for that link's principal, the preview keeps working, and no original-asset URL appears in any
   payload served to that principal (BR-090).
6. **Given** an expiry passes or the view limit is exhausted **when** the next request arrives
   **then** access is refused at request time, independently of whether a background sweeper has
   updated the stored state, and what the visitor receives is the single generic dead-link state of
   FR-SHARE-028 — "This link is no longer active." — carried on a `404 NOT_FOUND`. The reason class
   (expired, view limit reached) is recorded in the activity log for the Owner and Managers and is
   never present in the response to the visitor, because "expired" tells an unauthenticated stranger
   that a real link once existed here.
7. **Given** an expired link **when** the owner taps Extend **then** the same token becomes active
   again with the new expiry, an `ActivityEvent` `share.extended` is written, and the sheet warns that
   everyone who previously held the URL regains access.
8. **Given** any policy change **then** `ActivityEvent` `share.policy_changed` records a before-and-
   after diff, so the activity log can answer "who turned downloads back on".
9. **Given** the unlock endpoint **when** it is called repeatedly **then** attempts are limited to at
   most 10 failed attempts per link, per source address, per 15 minutes, after which that
   link-and-address pair is locked for 15 minutes (BR-089, restated by BR-214 with no second number).
   The endpoint returns 429 `RATE_LIMITED` with `retryAfterSeconds`, the locked response is
   indistinguishable from an ordinary wrong-password response, and each lock raises a security event
   and notifies every principal holding Owner or Manager on the scope.

**Mobile acceptance criteria**

- Every switch row is >= 48 CSS px tall with >= 8 CSS px separation, and the whole settings list is
  operable one-handed: at 360 x 640 the Apply button is pinned to the sheet's bottom edge above
  `env(safe-area-inset-bottom)` and remains visible while the list scrolls.
- The password field allows paste and platform autofill (`autocomplete="new-password"`), satisfying
  SC 3.3.8, and a Show-password toggle with a 48 x 48 CSS px hit area is present.
- With the software keyboard open on the password field, the field and the Apply button are both
  visible (SC 2.4.11): verified at 360 x 640 with a 300 px keyboard, using `keyboard-inset-bottom`
  with a `visualViewport` fallback.
- The Custom date picker uses the platform native date input so no custom calendar is rendered at
  360 px, and the chosen date is echoed in plain language ("Expires Thursday 4 September, 11:59 pm
  your time").
- If the app is backgrounded while the settings sheet has unsaved changes, the sheet state is
  persisted on `visibilitychange` to hidden and restored on next open with a "You have unsaved share
  settings" notice; nothing is applied without an explicit Apply.
- Screen reader announces the resulting policy sentence once, politely, after Apply succeeds.

**Edge cases & negative paths**

- Expiry set in the past: rejected inline with "Choose a date in the future"; Apply stays disabled.
- Password shorter than 8 characters: rejected inline with "Use at least 8 characters"; no request
  sent.
- View limit reduced below the current view count: allowed, and the sheet states "This link has
  already been opened 14 times, so it will stop working immediately."
- Clock skew between phone and server: expiry is evaluated server-side in UTC; the client only
  formats it, and a test with the device clock set 6 hours ahead still expires correctly.
- Simultaneous policy edits from two devices: the second Apply gets 412 `STALE_VERSION` and the
  409/412 experience from [US-E08-11](./epic-08-conflict-resolution-and-data-integrity.md) applies.
- A client from a future release sends a `role` field on a link-settings PATCH: the field is rejected
  with 400 `VALIDATION_FAILED` rather than ignored, so the "a link can never grant write" rule is
  enforced at the contract boundary and not merely by the absence of a control.

---

### US-E07-07 — Invite specific people by email

**As a** P1 Marcy Doyle who has just taken a confidentiality undertaking from a counterparty **I want**
to invite that person's email address to a room or a folder with a role and a download flag **so that**
access is bound to the person, not to a forwardable URL. This is also the only path on which a role is
chosen at all.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E07-01, US-E07-02 |
| Traces to | FR-SHARE-005, FR-SHARE-006, FR-SHARE-007, FR-SHARE-025, NFR-SEC-001, NFR-A11Y-005, BR-013, BR-014 |

**Acceptance criteria**

1. **Given** the Share sheet **when** "Invite specific people" is chosen **then** a single sheet
   collects one or more email addresses, one role, the download flag, and an optional plain-text
   message capped at 500 characters, with a plain-language summary above Apply.
2. **Given** addresses are entered **when** Invite is tapped **then** `POST /rooms/:roomId/invites`
   creates one `Invite` per address in state `pending` with a single-use token carrying the
   invitation-acceptance lifetime in BR-022 — 30 days — and
   the response reports per-address success or failure rather than failing the whole batch.
3. **Given** an invited address opens its emailed link **when** the token is valid **then**
   `POST /invites/accept` binds the invite to a user (creating a guest user with no password if none
   exists), materialises the `RoleAssignment`, and lands the recipient directly on the shared content
   with no signup wall.
4. **Given** an invite token is forwarded to a different address **when** it is opened **then** access
   is granted only after the opener proves control of the invited address (the token is single-use and
   binds on first acceptance); a second, different person opening the same token after acceptance
   receives 409 `INVITE_ALREADY_ACCEPTED` with a route to sign in as the invited address.
5. **Given** the same address is invited twice to the same scope **then** the existing pending invite
   is updated rather than duplicated, and the response reports "Already invited, invitation updated".
6. **Given** the room has reached its ceiling on concurrently active invited recipients — 500 by
   default, administrator-set under BR-231 (BR-236) — **then** the API returns a typed refusal naming
   the ceiling, the current count and the administrator to ask, the sheet shows the same, and no
   invite is sent and nothing is silently dropped.
7. **Given** an invite is created **then** the pre-commit summary in the sheet states exactly what the
   recipient will be able to do, in the form "Tomás Ferreira will be able to view and download 47
   files in Financials", and the invite email repeats that sentence so the recipient knows their own
   scope.
8. **Given** any invite is sent **then** `ActivityEvent` `invite.sent` records address, scope, role,
   download flag and inviting subject, and the address is stored lowercased.

**Mobile acceptance criteria**

- The email field uses `type="email"`, `inputmode="email"`, `autocomplete="email"`,
  `autocapitalize="off"` and `spellcheck="false"`, and previously invited addresses for this room are
  offered as tappable chips above the field so an address is never retyped (SC 3.3.7).
- Multiple addresses are entered as chips committed on space, comma or Enter, each chip carrying a
  >= 44 x 44 CSS px remove control; at 360 px width chips wrap onto new lines rather than scrolling
  horizontally.
- With the keyboard open, the address field, the role control and the Invite button are all reachable
  without the keyboard covering them; the summary sentence is allowed to scroll but Invite is not.
- On a flaky connection, Invite disables on tap, shows determinate progress, and on timeout keeps the
  typed addresses so nothing is retyped; the request carries an idempotency key so a retry sends one
  invitation, not two.
- Screen reader announces per-address results as a single polite message: "3 invitations sent, 1
  failed: not a valid address."

**Edge cases & negative paths**

- Malformed address: rejected inline per chip with "That does not look like an email address"; the
  valid chips are still sent.
- Address belongs to an existing member with a wider grant: the sheet says "Ashley Kim already has
  Manager access to this room" and offers to change the existing grant instead of creating a second.
- Invited address is the sharer's own: allowed but flagged with "That is you", because colleagues test
  their own links before sending them and must not be blocked from doing so.
- Email delivery fails hard (bounce): the invite row in share management shows "Not delivered" with a
  Resend action and the reason class (mailbox full, domain not found); the grant does not activate.
- Message field containing HTML: stored and rendered as plain text; a test asserts no markup reaches
  the email body.

---

### US-E07-08 — Pending invitations: list, resend, cancel

**As a** P1 Marcy Doyle chasing four external recipients **I want** to see which invitations are still
unaccepted and resend or cancel them from my phone **so that** I know who has actually been let in.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E07-07 |
| Traces to | FR-SHARE-019, FR-SHARE-020, NFR-A11Y-004, NFR-OBS-001 |

**Acceptance criteria**

1. **Given** the share-management screen **when** it renders **then** pending invitations appear in
   their own labelled section, each row showing the invited address, the scope, the role, the download
   flag, who invited them, when it was sent, and how many times it has been resent.
2. **Given** a pending invitation **when** Resend is tapped **then** `POST /invites/:id/resend` mints a
   new token, invalidates the previous one, increments `resendCount`, and the row updates to show the
   new send time.
3. **Given** the invitation-resend limit in BR-213 is reached — 3 resends per 15 minutes per email
   address, and 20 per hour per source address — **then** the API returns 429 `RATE_LIMITED` with
   `retryAfterSeconds`, and the row offers "Copy the invitation link and send it yourself" instead of
   a dead control. No second resend figure appears anywhere in this epic.
4. **Given** a pending invitation **when** Cancel is tapped **then** a confirmation names the address
   and the scope, and on confirm the invite moves to `revoked`, its token stops working immediately,
   and the row moves out of Pending with the standard 10-second undo (BR-176) that re-issues an
   equivalent invitation.
5. **Given** an invitation expires **then** its row shows "Expired" with a one-tap "Send a new one".
   A person opening a dead invitation link sees the same single generic state as any other dead link
   (FR-SHARE-028): "This link is no longer active." The row in share management is where the owner
   learns it expired; the visitor learns nothing, because an invitation token that names its own fate
   confirms to whoever holds it that the address it was issued to is a real address in a real room.
6. **Given** an invitation is accepted **then** it leaves the Pending section within one refresh of the
   screen and appears in the People section with its acceptance time and the account it bound to.

**Mobile acceptance criteria**

- Each invitation row is >= 56 CSS px tall with a >= 48 CSS px overflow control that opens an action
  sheet containing Resend, Copy link, Change role and Cancel invitation, with Cancel invitation last
  and styled destructive; the sheet holds at most four buttons including Cancel so it never scrolls.
- Long addresses truncate in the middle (`dev.raman.contact@…example.com`) rather than at the end, so
  the domain remains visible at 360 px, and the full address is the row's accessible name.
- Pull-to-refresh updates the section, and a Refresh item also exists in the screen's overflow so the
  gesture is never the only route.
- The undo toast for a cancelled invitation persists 10 seconds, sits above the bottom bar plus safe
  inset, and its Undo control is >= 48 CSS px.
- Resend cooldown is shown as a live countdown on the control ("Resend in 42 s"), not a static
  disabled state.

**Edge cases & negative paths**

- Two Managers resend the same invitation simultaneously: the second gets the cooldown error; only one
  new token exists.
- Invitation cancelled while the recipient is mid-acceptance: acceptance returns 404 `NOT_FOUND` and
  the recipient sees the generic "This link is no longer active." state, never a code naming
  revocation, because at that moment they hold no grant on anything.
- Address later signs up independently: the pending invitation still binds on acceptance; no automatic
  linkage happens before that, per US-E01-17.
- Email provider outage: rows show "Sending" for up to 5 minutes, then "Not delivered — retrying",
  never a false "Sent".

---

### US-E07-09 — Recipient opens a shared link on a phone with no account

**As a** P2 Dev Raman on a commuter train **I want** to tap a link in my email and be reading the
document within two taps, with no signup, no install and no interstitial **so that** I can decide in 90
seconds whether this engagement is worth my weekend.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E07-04, US-E07-06, US-E01-14 |
| Traces to | FR-SHARE-021, FR-SHARE-027, NFR-PERF-001, NFR-PERF-002, NFR-MOB-001, NFR-A11Y-001, NFR-COMPAT-001 |

**Acceptance criteria**

1. **Given** a valid public link scoped to a single file **when** the recipient opens the URL on a
   phone **then** the first screen is the readable document itself, reached in zero additional taps,
   with no account creation, no application install and no interstitial other than a configured
   password or email gate.
2. **Given** a valid link scoped to a folder or a room **when** the recipient opens the URL **then**
   the first screen is a listing of that scope with the most useful items surfaced first (files before
   folders at the scope root, ordered by the sharer's chosen sort), and the first document is readable
   after exactly one tap.
3. **Given** the recipient path **when** it is measured on the reference device and reference network
   defined in [03](../03-product-overview.md) **then** p75 LCP for the recipient entry screen is
   <= 2.5 s, p75 INP <= 200 ms, CLS <= 0.1, and the first page of a PDF is painted within 2.5 s of the
   tap that opened it, per the budgets in [07](../07-non-functional-requirements.md).
4. **Given** a recipient with no session **when** they browse within the link scope **then** every
   request carries the share token, the server issues a scoped, opaque recipient session bound to the
   token, and no cookie or storage entry grants access beyond that scope.
5. **Given** the recipient **when** they attempt any action outside the link's role **then** the
   affordance is absent and the API refuses with the specific typed error; there is no path from a
   recipient session to any other room, and `GET /rooms` for a recipient session returns 404.
6. **Given** the recipient **when** they leave and return within the link's validity **then** they
   resume at the same document and the same page or scroll position, restored from local storage keyed
   by token and node, so six interrupted two-minute sessions add up to one review.
7. **Given** an account-holder opens a link for a room they already have a grant on **then** they are
   recognised and see their own richer permissions rather than the link's, and the header states
   "You already have access to this room as Manager".
8. **Given** the recipient is on iOS in a Safari tab **when** the page loads **then** no
   install prompt, no push permission prompt and no add-to-home-screen interstitial is shown; the
   installation invitation appears only after a second visit and only as a dismissible inline row.
9. **Given** any recipient screen **then** it is served `noindex, nofollow` and `no-referrer`, and a
   crawler fetch of a valid link URL returns the same headers.

**Mobile acceptance criteria**

- Verified at 360 x 640 and at 390 x 844: no horizontal scrolling anywhere on the recipient path, and
  document text reflows to viewport width rather than rendering a shrunken A4 page (the abandonment
  failure Adobe measured at 45 percent).
- The recipient's primary controls (next page, page jump, Details, Download when permitted) sit in a
  bottom bar within the thumb zone, each >= 48 CSS px, above `env(safe-area-inset-bottom)`.
- On a throttled Slow-4G profile (1,638 Kbps down, 150 ms RTT, 4x CPU) the first document page is
  legible within 5 s and a skeleton matching the final layout is shown from 200 ms, so nothing shifts
  when content lands.
- Backgrounding the browser mid-read and returning restores the same page and scroll offset; state is
  written on `visibilitychange` to hidden and on `pagehide`, because `unload` does not fire when a tab
  is closed from the mobile tab switcher.
- With airplane mode enabled after the first read, previously opened pages of that document remain
  viewable from cache and a banner states "Offline. Showing pages you already opened."; unopened pages
  show "Not available offline" rather than a spinner.
- With VoiceOver or TalkBack on, the recipient entry screen announces the scope name, the number of
  items and the read-only state, and the first document is reachable with two swipe-right gestures
  from the top of the page.

**Edge cases & negative paths**

- Link opened in an in-app WebView (LinkedIn, Gmail): the page works, but File System Access and
  share-target are absent; download uses a plain link and the copy says "Saved to your Downloads
  folder (Files app)" on iOS rather than claiming a path.
- Unsupported file type: 415 `UNSUPPORTED_PREVIEW_TYPE`, copy "We cannot preview this file type yet."
  with Download and Open-in options if permitted, never a dead end.
- Link scope trashed after the recipient loaded the listing: the next tap returns 404 and the screen
  renders the single generic dead-link state of FR-SHARE-028, "This link is no longer active.",
  because a message that distinguishes "deleted" from "never existed" is the same oracle by another
  name.
- Recipient's device has a cracked screen area in the lower right: the primary read control is
  duplicated as a full-width tap zone on the page body, so no single corner is load-bearing.
- Extremely large document (200 MB PDF, 800 pages): pages are server-rendered and streamed one at a
  time; the client never fetches the original into memory, respecting the ~100-200 MB mobile Safari
  ceiling.

---

### US-E07-10 — The recipient gates: link password and email capture

**As a** P1 Marcy Doyle sharing a confidential document set **I want** a password gate now and an
email-capture gate later **so that** a forwarded link does not open for a stranger and I learn who
actually looked.

| | |
|---|---|
| Priority | Must |
| Release | R1 for the password gate (FR-SHARE-010); R2 for the email-capture gate (FR-SHARE-013) |
| Estimate | 3 |
| Depends on | US-E07-06, US-E07-09 |
| Traces to | FR-SHARE-010, FR-SHARE-013, FR-AUTH-022, NFR-SEC-002, NFR-PRIV-001, NFR-A11Y-005, BR-088, BR-089 |

**Acceptance criteria**

1. **Given** a password-protected link **when** the recipient opens it **then** the only content
   rendered is an unlock sheet naming the scope in generic terms ("This item is password protected")
   and revealing nothing about the room, the owner or the file names.
2. **Given** the unlock sheet **when** the correct password is submitted **then**
   `POST /s/:token/unlock` issues the scoped recipient session, the recipient lands directly on the
   content they were originally going to see, and the password is not re-requested for the life of
   that session unless the password is changed.
3. **Given** an incorrect password **then** 401 `SHARE_PASSWORD_INCORRECT`, copy "That password did
   not work.", the field is retained, and on the tenth failed attempt within 15 minutes from that
   source address the endpoint returns 429 with a live countdown and locks that link-and-address pair
   for 15 minutes (BR-089). The locked response is byte-identical to an ordinary wrong-password
   response, so the lock is not a signal either.
4. **Given** the email-capture gate is on (R2, FR-SHARE-013) **when** the recipient opens the link
   **then** a single field asks for an email address with a one-line statement of what it is used for,
   submission is recorded against the view session, and the recipient proceeds without verification.
5. **Given** both gates are on **then** they are presented in one sheet in one step, never as two
   stacked sheets, and the recipient reaches content after a single Continue.
6. **Given** a captured email **then** it is stored with a lawful-basis marker and the retention period
   in force, is visible to the room's Owner and Managers in the activity log, and is used for nothing
   other than the audit record of that room — there is no other consumer of it in the system, and the
   privacy notice says so.

**Mobile acceptance criteria**

- The password field allows paste and platform autofill, has `autocomplete="current-password"`, and a
  Show-password toggle with a 48 x 48 CSS px hit area (SC 3.3.8).
- With the keyboard open at 360 x 640, the field, the Continue button and the error text are all
  visible simultaneously; the sheet uses `keyboard-inset-bottom` with a `visualViewport` fallback.
- The gate sheet has no dismiss affordance that leaves the recipient on a blank page: swipe-down
  returns to a state that explains "You need the password to see this" with a request-access option.
- Autofilled one-time password managers work: the field is a single `input`, never split into
  character boxes.
- Screen reader announces the error assertively (it blocks the task) and the success politely.

**Edge cases & negative paths**

- Password contains a trailing space pasted from a message: the server compares after trimming
  trailing whitespace, and the sheet states "Spaces at the start and end are ignored."
- Password changed by the owner while a recipient is reading: the next request 401s with
  `SHARE_PASSWORD_REQUIRED` and the reader is shown the unlock sheet with their page position
  preserved.
- Email-capture field left empty: Continue stays disabled with inline "Enter an email address to
  continue", and the gate cannot be bypassed by an API call without the field.
- Recipient in a jurisdiction requiring consent for the capture: the notice text is locale-aware and
  the capture is refusable, in which case the sharer sees the view as "Anonymous visitor".

---

### US-E07-11 — Revoke any share at any time, with a measured immediacy contract

**As a** P1 Marcy Doyle whose external recipient has started behaving badly **I want** to kill that
recipient's access in three taps from my phone without touching anyone else's link **so that** I
control confidential engagement material without going back to the office.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E07-04, US-E07-07, US-E07-13 |
| Traces to | FR-SHARE-014, FR-SHARE-015, FR-SHARE-016, NFR-SEC-001, NFR-SEC-004, NFR-AVAIL-001, BR-106, BR-108, BR-110, BR-111, BR-112, BR-117, BR-120, BR-235 |

**Revoke authority, stated once before the criteria because every criterion below assumes it.**
Exactly three classes of principal may revoke a grant or a link, and no other (FR-SHARE-014, BR-235):
the **Owner** of the room containing the shared scope; a **Manager** whose grant scope is at or above
the grant being revoked; and the **principal that created** that grant or link, whatever its own role.
The creator's authority extends to its own grants and links and to nothing else — it confers no
authority to see, change or revoke anyone else's grant — which is what lets a Contributor with
`canReshare` withdraw its own reshare, and what stops a Manager scoped to one subtree revoking a grant
on a sibling subtree. The interface offers Revoke to exactly this set; a request from anyone else is
refused by the API independently of what the interface offered (BR-121), and the matching conditional
row is in the permission matrix in [06](../06-business-rules-and-permissions.md).

**Acceptance criteria**

1. **Given** any grant, invitation or link **when** a principal from the authority set above taps
   Revoke **then** a confirmation names the principal or the link prefix and the exact scope ("Remove
   Dev Raman from Financials — 47 files"), states that it cannot be undone and that a new share can be
   created, states plainly that bytes already downloaded cannot be recalled (BR-117), and commits only
   on the up-event of a second, distinct tap.
2. **Given** the revoke is confirmed **then** the `RoleAssignment` is revoked in the same database
   transaction as the link or invite state change, the state transition is durable before the response
   is sent (BR-106), and the API responds only after that transaction commits, so a 204 is a promise
   that has already been kept.
3. **Given** the revoke response has returned **then** every subsequent request by that principal is
   refused on every path **within 5 seconds at the 95th percentile and within 60 seconds absolutely
   (BR-108)**, and this is verified by an automated test that fires a continuous read loop from a
   second client and measures the interval between the revoke response timestamp and the last
   successful response. These two figures are the only revocation-latency numbers this epic states;
   nothing here introduces a third.
4. **Given** a signed asset URL was already issued to the revoked principal **then** it stops working
   immediately, because every signed URL carries the 60-second lifetime of BR-110 and is bound to the
   grant's epoch counter, which the revocation increments; a test that captures a signed page-image URL
   before the revoke and replays it afterwards is refused.
5. **Given** a live view session on the revoked share **then** it loses access on its next grant
   re-check, which a loaded page performs at least every 30 seconds for exactly this purpose (BR-112),
   and the reader's screen replaces the document with the dead-link state from US-E07-12 rather than
   continuing to render. The 30-second re-check interval is what makes the 60-second absolute bound in
   BR-108 achievable rather than aspirational.
6. **Given** a download that is already streaming when the revocation commits **then** it is
   re-authorised on every byte-range request and is cut at the next range boundary, and **in no case
   more than 30 seconds after the revocation commits (BR-111)**; where a client holds a long range
   open, the server closes the response at that bound whether or not a natural boundary has been
   reached, and the client reports the download as failed rather than complete.
7. **Given** revocation of one grant **then** no other grant, link or invitation on the same scope is
   affected, verified by a test with twelve concurrent recipients where revoking one leaves eleven
   working. Revoking a grant on an ancestor does not revoke a direct grant on a descendant, and the
   confirmation states with counts who retains access through a surviving direct grant and offers to
   revoke those in the same operation (BR-118).
8. **Given** revocation is measured in production **then** it is measured against the
   **revocation-latency metric owned by [10](../10-success-metrics-and-analytics.md)** — 10 owns every
   metric ID, and this criterion cites that metric rather than naming an ID of its own; the previously
   cited M16 measures documents per recipient session and was never the right measure. The measurement
   is the elapsed time from the acknowledged revoke to the last successful authorised request under
   that grant, and it is judged against the single pair of figures in BR-108: 5 s at p95, 60 s
   absolute, on every path including any cached or edge-served one. It is monitored continuously as a
   production service-level objective with the synthetic revoke-then-probe canary in
   [06](../06-business-rules-and-permissions.md).
9. **Given** the revoke succeeds **then** the result surface names what was revoked ("Dev Raman no
   longer has access to Financials") rather than silently dismissing, and an `ActivityEvent`
   `share.revoked` or `invite.revoked` is written with actor, principal, scope, timestamp and the count
   of sessions that were active at the time, and every Owner and Manager on the scope is notified
   (BR-120).
10. **Given** a revoked link **then** it is terminal: it can never be reactivated, and the interface
    offers "Create a new link" instead of an Undo.

**Mobile acceptance criteria**

- Revoke is reachable in three taps from the room home: Share management (1), the principal's row
  overflow (2), Revoke (3), plus the confirmation tap. Each of those targets is >= 48 CSS px and sits
  outside the top 20 percent of the screen so it is reachable one-handed.
- Revoke appears last in the row's action sheet, styled destructive, and never adjacent to Copy link,
  because a mis-tap there is the worst outcome in the product.
- The confirmation is a sheet, not a native dialog, so it inherits safe-area padding, and its
  destructive button is on the opposite side of the sheet from the position the thumb rests in after
  opening it.
- On a flaky connection the Revoke button enters a determinate pending state and never optimistically
  reports success; if the request times out the sheet says "We could not confirm the revoke. Check
  your connection and try again." and the row stays in its previous state.
- If the app is backgrounded mid-revoke, the pending revoke is replayed with its idempotency key on
  next open and the result is shown as a persistent notice, not a transient toast.
- With a screen reader on, the revoke result is announced assertively, because it is the one status
  message a user must not miss.

**Edge cases & negative paths**

- Revoking the last remaining access of an external recipient who is also counted against the room's
  active-recipient ceiling (BR-236): the grant is revoked and the count in share management decreases
  in the same refresh, so the ceiling and the visible list never disagree.
- Revoking an owner: refused with 409 and "Transfer ownership before removing the owner." (BR-013)
- A Contributor with `canReshare` attempting to revoke a grant it did not create: refused, because the
  creator's authority in BR-235 covers its own grants only. A Manager attempting to revoke a grant
  scoped above its own grant scope: refused for the same structural reason.
- Network partition where the API commits but the response is lost: the client's replayed
  idempotent revoke returns the original 204, so the user is not told it failed.
- Revoked principal holds an offline cache: the client clears cached content for that scope on the
  first refused response, and QA verifies that reopening the app offline after a revoke shows the
  revoked state rather than the cached document.
- Bulk revoke of 200 grants: processed as a batch with per-item results and a progress state; partial
  failure is reported per principal, never as a single "some failed".

---

### US-E07-12 — What a revoked or expired recipient sees, mid-session and later

**As a** P2 Dev Raman who has just lost access mid-read **I want** a clear, non-alarming screen that
tells me the link no longer works and offers a way to ask **so that** I do not conclude the product is
broken.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E07-11 |
| Traces to | FR-SHARE-028, FR-SHARE-035, NFR-SEC-001, NFR-PRIV-002, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** a revoked, expired, rotated or view-limit-exhausted link **when** the recipient makes any
   request **then** a full-screen state is rendered (not a toast, not a raw error) stating that the
   link is no longer valid, with the reason class only ("This link expired" / "This link no longer
   works") and no information about the item, the room, the owner or whether it ever existed.
2. **Given** that state **when** it renders **then** it offers exactly one primary action, "Ask for
   access", which sends a request to the room's Owner and Managers (R2 delivers it as an actionable
   notification; R1 delivers it as an email), and a secondary "Done" that closes the tab.
3. **Given** the recipient was mid-document **then** the transition happens at the next request or the
   next heartbeat, whichever is sooner, the current page image is removed from the screen, and any
   cached pages for that scope are purged from local storage before the state renders.
4. **Given** a revoked recipient **when** they re-open the same URL later **then** they see the same
   state with identical wording and identical response timing to a URL that never existed, so
   revocation is indistinguishable from non-existence.
5. **Given** an expired link **then** the state may state the expiry date, because the owner chose to
   set one and the date reveals nothing sensitive; a revoked link never explains why.
6. **Given** an access request is submitted **then** the requester sees "We passed your request on"
   with no confirmation of whether the room or the owner exists, and repeated requests are rate
   limited to one per link per hour.

**Mobile acceptance criteria**

- The state fits a 360 x 640 viewport with no scrolling, uses no illustration larger than 120 CSS px
  tall, and its primary action is >= 48 CSS px and within the thumb zone.
- The transition from document to revoked state is announced assertively to a screen reader ("This
  link no longer works") and moves focus to the state's heading, because the previous focus target no
  longer exists.
- With reduced motion enabled, the transition is an immediate replacement with no cross-fade.
- Offline: if the device is offline when the heartbeat fails, the app shows the offline banner rather
  than the revoked state, and only shows the revoked state once a server response confirms it, so a
  tunnel is never mistaken for a revoke.

**Edge cases & negative paths**

- Recipient has two tabs open on the same link: both transition within 15 seconds; the second tab does
  not show stale content because the heartbeat is per tab.
- Recipient is an account holder who also has a separate grant: they do not see the revoked state;
  they fall back to their own grant and the header explains "This link was revoked, but you still have
  access as Viewer."
- Password-protected link revoked before unlock: the unlock sheet is replaced by the revoked state,
  and unlock attempts return the same generic refusal.
- Screen-reader user in the middle of reading a page when revocation lands: the announcement is queued
  after the current utterance rather than interrupting mid-word.

---

### US-E07-13 — The share-management screen: who can see what

**As a** P1 Marcy Doyle running eight live mandates **I want** one screen per room that lists every
person and every link with their scope, role and flags **so that** I can answer "who can see this
right now" without navigating the tree.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E07-04, US-E07-07, US-E07-02 |
| Traces to | FR-SHARE-022, FR-SHARE-019, FR-SHARE-029, NFR-PERF-002, NFR-SCALE-001, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** a room **when** a Manager opens Share management **then** the screen has three labelled
   sections in this order: People (accepted grants), Pending invitations, and Links, each with a count
   in its header, and it is reachable in two taps from the room home.
2. **Given** the People section **when** it renders **then** each row shows name or email, effective
   role, download state, the scope in human terms ("Whole room" or "Financials"), and last access
   ("Opened 2 days ago" or "Never opened").
3. **Given** the Links section **when** it renders **then** each row shows the token prefix, the
   scope, the role, download state, password state, expiry, view count and unique-visitor count, and
   an unmistakable badge for links that are password-protected or expiring within 48 hours.
4. **Given** more than 25 rows in any section **then** the list is cursor-paged with an explicit
   "Load more" plus a persistent "n of N" count, and scroll position is restored exactly when
   returning from a row's sheet.
5. **Given** a search field at the top of the screen **when** the Manager types **then** rows filter
   by name, email or token prefix with a 250 ms debounce, and a scope filter chip row offers "Whole
   room" and each folder that has its own grants.
6. **Given** any row **when** its overflow is opened **then** the sheet offers Change role, Change
   download, Copy link (links only), Resend (pending only) and Revoke, with Revoke last and
   destructive.
7. **Given** a Viewer or Contributor opens the room **then** Share management is absent from
   navigation and `GET /rooms/:roomId/share-links` returns 403 `FORBIDDEN` for them, so the screen is
   not merely hidden.
8. **Given** the screen is loaded **then** the server returns all three sections in one request with
   p95 <= 400 ms for a room with 200 principals and 50 links, and the payload for the first page is
   <= 40 KB gzipped.

**Mobile acceptance criteria**

- Every row is a card, not a table row: no horizontal scrolling at 320 CSS px, and secondary metadata
  moves into the row's details sheet rather than into extra columns (SC 1.4.10 Reflow).
- Each card carries a single tap target for the whole card (opens the details sheet) plus one
  >= 48 CSS px overflow control, with >= 8 CSS px separation between them; the two targets never
  overlap, per the disclosure-indicator conflict rule.
- Section headers stick to the top of the scroll container so the Manager always knows whether they
  are looking at People, Pending or Links.
- The search field does not auto-focus on entry, so the keyboard does not consume half the screen
  before the Manager has seen the list.
- At 200 percent text size the role and download state wrap to a second line rather than truncating,
  and no control is clipped off-screen.
- With a screen reader on, each section is a landmark region with an accessible name that includes its
  count ("Links, 4 items").

**Edge cases & negative paths**

- Room with zero shares: an empty state states "Nobody outside your account can see this room" with a
  primary Share action, which is also the invisibility rule made visible.
- A principal with grants at five different folders: they appear once per scope with the scope named,
  not merged, because merging would hide an override.
- Stale counts after a revoke on another device: the screen refreshes on focus and on pull-to-refresh,
  and a row whose state changed under the user animates its change with a "Updated" marker rather than
  silently reordering.
- Guest whose account was deleted: the row shows the historical email with "(account deleted)" so the
  audit trail stays readable, and Revoke still works.

---

### US-E07-14 — Per-item shared indicator and the "who can see this" sheet

**As a** P1 Marcy Doyle looking at a folder listing **I want** every row to tell me whether it is shared
and with whom **so that** I never have to guess whether the buyer can see this folder.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E07-02, US-E07-13 |
| Traces to | FR-SHARE-023, FR-SHARE-024, NFR-PERF-002, NFR-A11Y-002, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** any folder or file row **when** it renders **then** it carries a shared-state indicator
   with three distinguishable states: not shared, shared (this item or an ancestor), and shared
   publicly by link, using both an icon and a text label or accessible name, never colour alone.
2. **Given** the indicator **when** it is activated **then** the item's access sheet opens directly at
   the medium detent, listing every principal with an effective role at that item, each labelled
   inherited (naming the ancestor) or set here.
3. **Given** the access sheet **when** the item is shared publicly **then** the public link is listed
   first with its policy summary, because a public link is the widest exposure and must be the first
   thing a sharer sees.
4. **Given** the details sheet for an item (E05) **then** it contains the same effective-permission
   summary as one line ("Shared with 3 people · 1 public link · downloads off"), so the fact is
   available from two places.
5. **Given** a listing of 50 rows **then** the shared-state for all rows arrives with the listing
   payload in the same request (no per-row fetch), and the indicator is present at first paint so no
   layout shift occurs.
6. **Given** an item shared only through an ancestor **then** the indicator states "Shared via Acme
   HVAC" in its accessible name, and the sheet offers "Limit access here", which creates an override
   per US-E07-15.

**Mobile acceptance criteria**

- The indicator's hit area is >= 44 x 44 CSS px, is separated from the row's own navigation target by
  >= 8 CSS px, and sits on the row's trailing edge but before the overflow control so the two are not
  confused.
- At 360 px width, a row shows name, size or item count, and the indicator without truncating the
  indicator; the name truncates instead, in the middle.
- The access sheet retains the listing's scroll position on dismiss and is a popable history entry, so
  the Android system back and the in-app back both close it.
- With a screen reader on, the row announces "Financials, folder, 47 items, shared with 3 people",
  and the indicator is a separate focusable control with the accessible name "Who can see Financials".
- Tiles/grid view carries the same indicator in the tile footer at the same minimum hit size.

**Edge cases & negative paths**

- Item shared with a principal whose grant expires in an hour: the indicator does not change, but the
  access sheet shows "Access ends in 1 hour" on that row.
- Item inside a folder shared by a link the current user cannot see (created by another Manager): it
  is shown, because Managers see all shares in their room; a Contributor with `canReshare` sees only
  their own and a count of others ("2 other shares").
- Very wide sharing (100 principals): the sheet shows the first 10 with "and 90 others" opening the
  filtered share-management list, never rendering 100 rows in a sheet.
- Trashed item: the indicator shows "Sharing suspended" and the sheet explains that shares stop
  working while the item is in trash and resume on restore.

---

### US-E07-15 — Change a grant, and never widen access without saying so

**As a** P1 Marcy Doyle promoting an accountant from Viewer to Contributor **I want** to change a role or
a download flag in place, with a plain summary of the consequence **so that** I never widen access by
accident on a small screen.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E07-13, US-E07-02 |
| Traces to | FR-SHARE-033, FR-SHARE-025, FR-SHARE-008, NFR-SEC-001, NFR-A11Y-004, BR-121 |

**Acceptance criteria**

1. **Given** an existing grant **when** the Manager changes the role or a flag **then** the same grant
   row is updated (`PATCH` with `If-Match`) rather than deleted and recreated, so the grant's audit
   history is continuous and the recipient's link keeps working.
2. **Given** any change **when** Apply is tapped **then** a pre-commit summary states the delta in
   plain language, in the form "Tomás Ferreira will be able to add and rename files in Financials. He
   will still not be able to delete anything.", and Apply is the only committing control.
3. **Given** a change that widens access (higher role, download turned on, reshare turned on, or a
   wider scope) **then** the summary is prefixed "This gives more access than before" and a second,
   distinct confirmation tap is required, using the destructive-confirmation pattern in
   [US-E09-13](./epic-09-mobile-ux-foundations.md) with neutral rather than destructive styling.
4. **Given** a change that narrows access **then** one confirmation suffices, and any live session
   affected is downgraded on its next request, with the recipient shown "Your access to this room
   changed" rather than an error.
5. **Given** the change is applied **then** an `ActivityEvent` `grant.changed` records the before and
   after role and flags, the actor and the scope.
6. **Given** an attempt to set a role the actor may not grant (a Contributor with `canReshare` trying
   to grant Manager) **then** the API returns 403 and the interface never offers roles above the
   actor's own.
7. **Given** a grant at an ancestor and a new narrower grant here **when** the Manager chooses "Limit
   access here" **then** an override grant is created with `inheritMode: 'override'`, and the sheet
   explains "People who can see Acme HVAC will no longer see Financials unless they are listed here."

**Mobile acceptance criteria**

- The role control is a segmented list of full-width rows with a checkmark on the current value, not a
  native `select`, so each option has a >= 48 CSS px target and its label is fully readable at 360 px.
- The download flag is a switch row with a description line underneath, and the description changes
  live as the switch is toggled, so the consequence is legible before Apply.
- The summary sentence is rendered in the sheet above Apply, is not collapsed behind a disclosure, and
  is announced politely when it changes.
- No inline accordion appears anywhere in this sheet; one sheet equals one scope, with one Apply.
- With the keyboard closed the whole sheet fits 360 x 640 without scrolling for the common case of
  role plus two flags; with more options it scrolls but Apply stays pinned.

**Edge cases & negative paths**

- Concurrent change by another Manager: 412 `STALE_VERSION` with the current state, and the sheet
  shows "Ashley Kim changed this to Contributor a moment ago. Apply your change on top?" with the
  option to discard.
- Downgrading yourself out of Manager: allowed only if another Manager or the Owner remains, otherwise
  409 with "You would lock yourself out of managing this room."
- Turning download on for a room whose Owner has disabled downloads at room level: 403 with the room
  setting named, so the Manager knows which switch to ask about.
- Grant changed for a principal currently mid-download: the in-flight signed URL is bound to the old
  grant version and stops working; the recipient sees "The owner changed your access" rather than a
  corrupt file.

---

### US-E07-16 — Revoke everything on a room in one action

**As a** P1 Marcy Doyle whose mandate has just closed **I want** one action that cuts every share on the
room, with the count shown first **so that** I can close a deal down from my phone in seconds.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E07-11, US-E07-13 |
| Traces to | FR-SHARE-031, NFR-SEC-001, NFR-A11Y-004, BR-108 |

**Acceptance criteria**

1. **Given** the share-management screen **when** the Owner or a Manager opens its overflow **then**
   "Revoke all access" is present, and it is the only item in a separated destructive group.
2. **Given** the action is chosen **then** a confirmation states the exact counts from the server
   ("This will remove 7 people, cancel 3 pending invitations and switch off 4 links. Nobody outside
   your account will be able to open anything in Acme HVAC.") and requires a second distinct tap.
3. **Given** the confirmation **then** it names what is not affected: the Owner's own access, other
   Managers' access if the actor chooses "Recipients only", and nothing is deleted.
4. **Given** the action commits **then** it is executed as one batch with per-item results, the
   response reports how many succeeded and how many failed, and each failure is individually
   retryable from a result list.
5. **Given** the counts change between opening the confirmation and confirming **then** the request is
   rejected with 409 and the confirmation is re-rendered with the new counts, so a user never confirms
   a number that is no longer true.
6. **Given** the batch completes **then** a single `ActivityEvent` `share.revoked_all` is written with
   the counts, plus individual events per grant, so the log is both summarised and complete.

**Mobile acceptance criteria**

- The confirmation is a sheet with the counts as the largest text on the screen, so the blast radius
  is legible at arm's length in sunlight.
- The destructive button is at the end of the sheet, styled destructive, at least 48 CSS px tall, and
  is not the control nearest the thumb's resting position after the sheet opens.
- Progress is determinate ("Revoking 9 of 14") and announced politely at most once every 2 seconds.
- If the app is backgrounded mid-batch, the batch continues server-side and its result is shown as a
  persistent notice on next open, never lost as a transient toast.
- On failure of the whole batch (network loss), nothing is revoked, the sheet says "We could not
  revoke anything. Check your connection and try again.", and no partial state is implied.

**Edge cases & negative paths**

- Room with no shares: the action is hidden rather than shown and refused.
- Partial failure (2 of 14 fail): the result list names the two, offers Retry on each, and the toast
  says "12 revoked, 2 failed" rather than "Done".
- Actor is a Manager whose own grant is included in "everyone": their own grant is excluded and the
  confirmation says so.
- Undo: there is none, and the confirmation states "You will need to share again to give anyone
  access."

---

### US-E07-17 — Watermarked previews through a share

**As a** P1 Marcy Doyle sharing a CIM with fourteen buyers **I want** each buyer's own identity burned
into every page they view **so that** a leaked screenshot points at whoever leaked it.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E07-06, US-E07-09 |
| Traces to | FR-SHARE-012, FR-VIEW-035, NFR-SEC-002, NFR-PERF-001, NFR-A11Y-001 |

**Acceptance criteria**

1. **Given** a share with `watermarkMode` set to `viewer_email` or `custom` **when** any page image is
   served through that share **then** the watermark is composited server-side into the rendered image
   before it leaves the server, and no client-side overlay is used anywhere in the pipeline.
2. **Given** a watermarked share **when** the recipient inspects the network responses **then** there
   is no un-watermarked variant of any page reachable with their token, including thumbnails and the
   first-page preview.
3. **Given** `viewer_email` mode **then** the watermark contains the recipient's identifier (invited
   email, captured email, or "Link visitor" plus a short visitor id), the date and time in UTC, and
   the room name, at an opacity that keeps body text legible (measured: the page still passes a
   4.5:1 contrast check for its own text).
4. **Given** downloads are allowed on a watermarked share **then** the downloaded PDF is the
   watermarked rendition, not the original, and the file name states it ("Lease (watermarked).pdf").
5. **Given** watermarking is on **then** it cannot be turned off by the recipient, by a query
   parameter, or by requesting an older version, and a test asserts each of those attempts returns the
   watermarked asset or a 403.
6. **Given** a watermarked page is requested **then** p75 time-to-first-page on the reference network
   stays within 500 ms of the un-watermarked path, achieved by caching per (page, watermark identity)
   rather than re-rendering on every request.
7. **Given** watermarking is not yet delivered in the release in force **then** the control is shown
   with its release stated inline (R1.1 per the trust-hardening increment) rather than the control being
   absent and the capability being invisible.

**Mobile acceptance criteria**

- The watermark remains legible and does not obscure body text at 360 px width and at pinch-zoom
  levels up to 400 percent; a QA screenshot test covers 360, 390 and 414 px.
- Rendering a watermarked page never allocates the whole document in the tab: pages are fetched as
  images one at a time, the canvas backing store is capped at viewport multiplied by
  `min(devicePixelRatio, 2)`, and a single canvas is reused and released, keeping the tab inside the
  ~100-200 MB mobile Safari memory ceiling.
- With reduced motion enabled, page transitions do not animate; the watermark does not shimmer or
  animate in any setting.
- A screen reader reads the document's extracted text, not the watermark; the watermark is exposed
  once as "Watermarked for dev.raman@example.com" in the viewer's details sheet.
- On a 4G connection, a watermarked page arrives in <= 2.5 s p75; if it takes longer than 5 s a
  skeleton page frame is shown rather than a blank viewer.

**Edge cases & negative paths**

- Anonymous public-link visitor: the watermark shows "Link visitor · <short id>" and the same id
  appears in the activity log, so a leak is still traceable to a session.
- Watermark text longer than the page width: it wraps and is tiled rather than clipped.
- Watermark turned on while a recipient is mid-read: the next page they open is watermarked; the
  currently displayed page is refreshed within 15 seconds so no un-watermarked page remains on screen.
- Screenshot prevention is explicitly not claimed: the interface must never state that screenshots are
  blocked, because the web platform cannot prevent them. Copy: "Pages show the viewer's email, so
  copies can be traced."

---

### US-E07-18 — Transfer room ownership

**As a** P1 Marcy Doyle handing a mandate to a colleague **I want** to transfer a room's ownership with
the recipient's explicit acceptance **so that** the room does not become orphaned when I leave the deal.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E07-01, US-E01-13 |
| Traces to | FR-SHARE-030, NFR-SEC-001, NFR-COMPL-001, BR-029 |

**Acceptance criteria**

1. **Given** a room **when** the Owner starts a transfer **then** they choose one existing member of
   the account, step-up re-authentication is required, and the request is created in state `pending`
   with a 7-day expiry.
2. **Given** a pending transfer **then** the nominated user receives an in-app notification and an
   email stating exactly what they will become responsible for (item count, storage size, number of
   active shares, and that storage will count against their account if the account differs), and
   nothing changes until they accept.
3. **Given** acceptance **then** in one transaction the new owner's grant becomes `owner`, the previous
   owner becomes `manager`, storage attribution moves if the accounts differ, every existing share and
   link continues to work unchanged, and `ActivityEvent` `room.ownership_transferred` is written.
4. **Given** the nominee declines or the request expires **then** nothing changes, the initiator is
   notified with the reason, and the room's ownership is untouched.
5. **Given** the initiator cancels before acceptance **then** the request is void immediately and the
   nominee's notification is withdrawn from the notification centre.
6. **Given** the transfer would take the receiving scope over its storage ceiling or room-count ceiling
   **then** the transfer is refused at initiation with the specific shortfall and the breached scope
   stated (BR-199, BR-236), not at acceptance time.
7. **Given** the transfer completes **then** the previous owner is told, in one sentence, exactly what
   they can no longer do ("You can still manage this room. You can no longer delete it or transfer
   it.").

**Mobile acceptance criteria**

- Both the initiation and the acceptance flows fit a 360 x 640 viewport with a single scroll, and the
  accept and decline controls are equal in size (>= 48 CSS px) with decline not styled as the primary
  path.
- The consequence summary is the largest text block in the acceptance sheet and states the numbers, so
  a person accepting from a phone in a taxi cannot miss the storage implication.
- Step-up re-authentication uses a passkey where available, so the transfer does not require typing a
  password on a phone.
- The pending state is visible in room settings on both sides ("Transfer to Ashley Kim pending, expires
  in 6 days") with a >= 48 CSS px Cancel control.
- Screen reader announces the pending state and the completion politely, and the acceptance sheet's
  heading receives focus on open.

**Edge cases & negative paths**

- Nominee's account is deleted before acceptance: the request is voided and the initiator is told
  "That person's account no longer exists."
- Original owner's account is deleted while a transfer is pending: the transfer is auto-accepted only
  if the nominee already has Manager access; otherwise the room follows the account-deletion path in
  E12 and the nominee is notified.
- Two transfers initiated concurrently: the second returns 409 with "A transfer is already pending."
- Transfer across accounts where the nominee is a guest: refused, because a guest cannot own a room
  (BR-001); copy "Ask them to create a free account first."

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| Authentication, session lifetime, guest identity creation, step-up re-auth mechanics | [E01](./epic-01-access-and-identity.md) |
| Room creation, archive, delete, the room-level invisibility rule and the home screen | [E02](./epic-02-data-rooms-and-workspace-home.md) |
| Folder create, rename, move, cascade delete and breadcrumb navigation | [E03](./epic-03-folder-hierarchy-and-navigation.md) |
| Upload, download, bulk operations and the upload tray | [E04](./epic-04-file-operations.md) |
| The preview pipeline itself, the details sheet layout and the preview support matrix | [E05](./epic-05-viewing-preview-and-file-details.md) |
| Optimistic concurrency mechanics, the 412 experience, name conflicts and trash retention | [E08](./epic-08-conflict-resolution-and-data-integrity.md) |
| Sheets, action bars, confirmation patterns, toasts, focus management and the a11y system | [E09](./epic-09-mobile-ux-foundations.md) |
| Signed-URL caching strategy, edge behaviour and performance telemetry | [E10](./epic-10-performance-offline-and-scale.md) |
| The activity log, per-viewer page analytics, download tracking, notification centre and access-request notifications | [E11](./epic-11-trust-audit-and-notifications.md) |
| The guest-count and room-count ceilings, who sets them, and the storage quota this epic's shares are read against | [E12](./epic-12-account-storage-and-governance.md) |
| NDA click-through gating before access | Not in R1 to R2. Recorded as OQ62. |
| Structured Q&A with recipients inside the room | R3, tracked in E11's scope-out list. |
| Per-bidder document indexing and bulk permission templates across many folders | R3. Recorded as OQ63. |

## Open questions

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ58 | Is "most permissive wins in the absence of an override" the right default, or should the product default to most restrictive and require an explicit widen? Most-permissive matches Drive and Box and is what users expect; most-restrictive is safer for a leak-averse broker. | Product + Security + design partners | Before US-E07-02 build |
| OQ59 | Public-link expiry is R1 for permissioned invites but the domain model marks public-link expiry as R1.1. The persona research says brokers demand expiry, watermark and per-viewer logging the first time a CIM leaks. Do we pull all three into R1? | Product | Before R1 code freeze |
| OQ60 | What is the correct revocation propagation target to publish contractually: zero successful requests after acknowledgement (current spec) or a stated p95 in seconds? The first is stronger but constrains any future edge caching. | Engineering + Product | Before R1 launch |
| OQ61 | Should a Contributor with `canReshare` be able to create public links, or only invite named people? Public links are the leak vector; named invites are traceable. | Product + Security | Before US-E07-15 build |
| OQ62 | Is an NDA click-through gate required to win the beachhead, or is a password plus email capture sufficient? Brokers describe NDA-then-access as their actual workflow. | Product + Legal + design partners | R2 planning |
| OQ63 | Do owners need bulk permission editing across many folders on mobile, or is that legitimately a desktop-only enhancement? P4 does 30 to 40 percent of her touches on a phone. | Product + design partners | R2 planning |
| OQ64 | For email capture, what lawful basis and retention period do we apply per region, and who is the controller of a captured recipient email: us or the room owner? | Legal + Product | Before US-E07-10 R2 build |
