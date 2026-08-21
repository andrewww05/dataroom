# Epic E04 — File Operations

## Purpose

This epic turns the phone from a reader into a document *source* and a complete file manager. It
owns every operation that moves bytes or moves items: upload from camera, photo library, files
picker and the OS share sheet; resumable chunked transfer that survives a tunnel, a freeze and a
discard; download in a way that does not lie about where the file went; and create, copy, rename,
cut, paste, delete, restore and bulk actions specified for a thumb before a mouse. It is the
epic where the product's central claim is either true or false, because owner-side administration
on a phone is the whitespace no incumbent occupies.

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
  [E05 Viewing, Preview & File Details](./epic-05-viewing-preview-and-file-details.md),
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
| Epic ID | E04 |
| Goal | Make every file operation completable from a phone in the field: a photograph reaches the right nested folder in under three taps, a 40 MB upload survives a lost signal and resumes itself, a misfiled batch of nine files is moved with one thumb, and nothing is ever deleted, overwritten or half-uploaded without the user being told in counts and given a way back. |
| Primary personas | P1 Marcy Doyle (solo broker, iPhone-primary, photographs a P&L in a car park), P6 Ray Okonkwo (CRE broker, one bar of LTE in a mechanical room, cracked screen, gloves), P4 Ashley Kim (transaction coordinator, 30 to 40 percent of her touches on a phone, bulk operations and room hygiene), P3 Tomás Ferreira (buy-side CPA who downloads what he needs), P2 Dev Raman (recipient who may download but must never mutate) |
| Release span | R1 (stories 01 to 14), R2 (stories 15 to 18) |
| Story count | 18 |
| Total points | 101 |
| Depends on | [E09](./epic-09-mobile-ux-foundations.md) (sheets, action bars, toasts, selection mode primitives, safe area, live regions), [E03](./epic-03-folder-hierarchy-and-navigation.md) US-E03 folder tree and breadcrumb (a file needs a folder), [E02](./epic-02-data-rooms-and-workspace-home.md) (a folder needs a room), [E08](./epic-08-conflict-resolution-and-data-integrity.md) (naming rules, idempotency keys, ETag concurrency), [E10](./epic-10-performance-offline-and-scale.md) (virtualised lists, cursor pagination, streaming budgets) |
| Blocks | [E05](./epic-05-viewing-preview-and-file-details.md) (nothing to preview until something is uploaded), [E06](./epic-06-search-and-discovery.md) (nothing to find), [E07](./epic-07-sharing-and-access-control.md) (nothing to share), [E11](./epic-11-trust-audit-and-notifications.md) (upload, download and delete are the activity log's highest-volume events), [E12](./epic-12-account-storage-and-governance.md) (committed file bytes are what quota is accounted on) |

## Mobile-first design stance

- **The 360 px folder screen has exactly three permanent affordances and one of them is Add.** At
  360 x 640 the folder screen is a virtualised list of 64 CSS px rows, a sticky breadcrumb header,
  and a bottom action bar in the thumb zone carrying Add (upload or capture), New folder, Select and
  an overflow. Nothing in that set may move behind a menu: hidden navigation measurably reduces
  discoverability, and Add is the reason the user opened the app.
- **Right-click becomes long-press *plus* a visible per-row overflow, and the overflow is the
  contract.** Every row carries a 48 x 48 CSS px overflow button on its trailing edge. Long-press on
  the row opens the same menu. No file action in this epic is reachable only by gesture, unavailable
  actions are hidden rather than dimmed, and destructive items sit last and styled destructive.
- **Drag-and-drop is a desktop enhancement, never the mechanism.** A finger does not fire drag
  events on Chrome for Android, Firefox for Android or Samsung Internet, and WCAG 2.2 SC 2.5.7
  requires a non-dragging single-pointer path regardless. Move and copy are therefore a destination
  picker (one sheet, in-sheet drill-down, its own breadcrumb) plus a persistent staging tray, and
  HTML5 drag-and-drop lights up only under `(pointer: fine)`.
- **Cut and paste becomes a visible clipboard.** Touch has no clipboard the user can see, so the
  staging tray is a slim persistent bar reading "3 items ready to move" that survives navigation to
  any folder in the room and offers "Paste here". It is also the compact-width answer to the brief's
  split view, and it is named as such in the interface.
- **Rubber-band selection becomes an explicit selection mode.** Long-press or the visible Select
  control enters selection mode, every row gains a 48 px checkbox, the bottom bar is replaced by a
  count-bearing contextual action bar ("4 selected"), and range selection is "Select from here
  to…", never a drag.
- **Upload is specified against what the platform actually guarantees, and the copy never
  overstates it.** There is no Background Fetch on iOS or in any WebView, no Background Sync on iOS,
  a frozen page cannot run timers or fetch callbacks, a discarded page runs no code, and `unload`
  does not fire when a tab is closed from the mobile tab switcher. So the resume offset is committed
  before each chunk, the queue is rebuilt from durable storage on next open, and the state reads
  "Paused, reopen the app to continue" rather than implying background progress. Claiming background
  upload is a defect, not a copy nit.
- **Memory is a hard ceiling, not a tuning parameter.** Mobile Safari was measured crashing at
  roughly 100 MB of allocated JavaScript data on an iPhone SE 3rd generation with no catchable
  exception. Nothing in this epic reads a whole file into memory: uploads stream through
  `File.slice()`, one chunk at a time; archives are streamed by the server; downloads are handed to
  the platform.
- **Download is fire-and-forget, and the interface says so.** Safari routes downloads through its
  own manager into a user-configured Downloads folder; the page is never told the path, gets no
  completion callback and cannot verify the bytes landed. So the product names the Files app and the
  Downloads folder in its copy and keeps a list of re-fetchable server links instead of pretending
  to track a local file.
- **Every destructive action states its blast radius in counts, commits on the up-event, and leaves
  an undo.** Deleting is a soft delete to the room trash with a server-computed count in the
  confirmation, a 10-second undo toast, and a Trash screen with the exact purge date. A mis-tap on a
  cracked screen with a gloved thumb is the assumed input, not the exception.
- **Desktop adds power to the same model.** At expanded width: real drag-and-drop, a marquee over
  rows, Shift+click ranges, `Ctrl/Cmd+X`/`C`/`V` bound to the same staging tray, a real folder-upload
  input, and a horizontal toolbar. None of it introduces a capability the phone lacks.

---

## User stories

### US-E04-01 — Resumable upload session and chunk transport

**As a** platform engineer building for P6 Ray Okonkwo **I want** an upload protocol whose resume
point is owned by the server and re-derivable after the browser has thrown the page away **so that**
a 40 MB survey PDF started on one bar of LTE finishes without the user ever re-selecting the file.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | none |
| Traces to | FR-FILE-008, FR-FILE-009, FR-FILE-011, FR-FILE-016, FR-CONF-029, NFR-AVAIL-001, NFR-AVAIL-002, NFR-MOB-002, NFR-SCALE-002, BR-208, BR-209 |

**Acceptance criteria**

1. **Given** a caller with `capabilities.canUploadInto === true` on the target folder **when** it
   posts `POST /rooms/:roomId/uploads` with `clientRequestId`, `targetName`, `declaredSizeBytes` and
   `declaredMimeType` **then** the API returns `201` with an `UploadSession` carrying `id`,
   `protocol`, `chunkSizeBytes`, `uploadUrl` and `expiresAt` (default 7 days), and the session is in
   state `queued`.
2. **Given** the same `clientRequestId` is posted again by the same account **when** the request body
   hashes identically **then** the API returns the *existing* session rather than creating a second
   one, so a retry after a page freeze cannot manufacture a duplicate file (see US-E08 idempotency).
3. **Given** an in-progress upload **when** a chunk is `PATCH`ed to `/uploads/:uploadId` with
   `Upload-Offset` **then** the server persists `receivedBytes` **before** acknowledging the chunk,
   and a `HEAD /uploads/:uploadId` immediately afterwards reports exactly that offset.
4. **Given** a client whose local offset disagrees with the server **when** it resumes **then** the
   server's `Upload-Offset` from the `HEAD` probe wins, the client discards its own belief, and no
   confirmed byte is re-sent (asserted by byte-count instrumentation in an integration test).
5. **Given** a chunk arrives at the wrong offset **when** the server processes it **then** it
   responds `409` with the authoritative offset and does not append, and the client re-probes rather
   than retrying blindly.
6. **Given** the connection class reported by the client **when** the session is created **then**
   `chunkSizeBytes` is selected within 256 KiB to 8 MiB, small on cellular and large on unmetered
   Wi-Fi, and the selection is recorded in `networkClassAtStart` for telemetry.
7. **Given** a file of several gigabytes **when** it is uploaded on the reference device **then**
   peak JavaScript heap attributable to the upload stays under 32 MB, verified by a Chrome DevTools
   memory sample, because the client holds at most one chunk plus its digest state at a time.
8. **Given** all bytes are received **when** the computed SHA-256 matches `expectedChecksumSha256`
   **then** the session moves to `scanning` and no `Node` is visible in the folder until
   US-E04-06 commits it; a mismatch returns `422 CHECKSUM_MISMATCH` and the session retries from
   offset 0 exactly once before failing.
9. **Given** `attemptCount` exceeds 50 or a non-retryable 4xx is returned **when** the client
   evaluates the response **then** the session moves to `failed` with `lastError` set to the
   machine-readable `ApiErrorCode`, which the tray renders verbatim per the error catalogue.

**Mobile acceptance criteria**

- Chunk boundaries are read with `File.slice()`; a test that calls `FileReader.readAsArrayBuffer` on
  a whole file fails code review and the CI lint rule that forbids it.
- On a throttled profile of 1.6 Mbps down / 750 Kbps up / 150 ms RTT with 4x CPU, a 40 MB upload
  completes without the main thread exceeding a 50 ms task, verified with a performance trace.
- Toggling airplane mode mid-upload moves the item to `paused` within 3 seconds and no error dialog
  is shown; restoring the connection with the app in the foreground resumes within 5 seconds.
- Killing the app from the mobile tab switcher mid-upload loses no confirmed bytes: reopening the app
  shows the item in the tray at the same percentage ±1 chunk.
- The resume offset is flushed to IndexedDB or OPFS on every `visibilitychange` to hidden and on
  `pagehide`, because those are the last moments code is guaranteed to run.
- Screen Wake Lock is requested while a foreground upload is running on browsers that expose it, and
  released on completion, cancellation or failure.

**Edge cases & negative paths**

- Session expired (`expiresAt` passed): `410 UPLOAD_SESSION_EXPIRED`, copy "This upload timed out.
  Tap to start it again." The pending blob is marked orphaned for the sweeper; no partial item ever
  appears in the folder.
- Same content uploaded twice: checksum pre-check hits an existing blob and the commit is instant
  ("instant upload"); storage is not double-counted.
- Clock skew or a replayed `Idempotency-Key` with a different body: `409 IDEMPOTENCY_KEY_REUSED`,
  never shown to the user, logged as a client bug.
- Storage backend unavailable: `503 DEPENDENCY_UNAVAILABLE`, copy "Something on our side is down. We
  will retry.", automatic retry with jitter, manual Retry offered after three failures.
- Malicious client declaring 1 KB and sending 4 GB: the server enforces `declaredSizeBytes` and
  aborts at the boundary with `413 FILE_TOO_LARGE`; nothing is committed.

---

### US-E04-02 — Add files from the device picker with a visible upload tray

**As a** P1 Marcy Doyle standing in a client's car park **I want** to pick several files and watch
them land in this folder **so that** I can send a buyer a link before their interest cools.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E04-01 |
| Traces to | FR-FILE-001, FR-FILE-007, FR-MOB-008, FR-MOB-011, FR-MOB-035, NFR-A11Y-003, NFR-MOB-001, BR-033 |

**Acceptance criteria**

1. **Given** a folder screen where the principal may upload **when** the screen renders **then** an
   Add control is present in the bottom action bar with a visible text label, and activating it opens
   a single sheet offering Take photo, Choose from library, Choose files and (Android only) the
   platform share hint.
2. **Given** a principal without `canUploadInto` **when** the folder screen renders **then** the Add
   control is absent rather than disabled, and a direct `POST /rooms/:roomId/uploads` from that
   principal returns `403 READ_ONLY_SHARE` with the message "You have view-only access to this
   room."
3. **Given** the files picker returns 12 files **when** the selection is confirmed **then** 12 rows
   appear in the upload tray immediately, before any bytes move, each showing name, size and state,
   and the tray header shows an aggregate "Uploading 3 of 12 · 41%".
4. **Given** uploads are running **when** the principal navigates to another folder or another room
   **then** the tray persists as a collapsed bar with aggregate progress and the uploads continue,
   because the tray is global to the session and not owned by one screen.
5. **Given** a file finishes **when** its node is committed **then** it appears in the folder listing
   in the correct sort position without a manual refresh, and the tray row shows Done for 3 seconds
   before it is removed.
6. **Given** a tray with mixed outcomes **when** the batch ends **then** the tray header states the
   split explicitly, for example "10 uploaded, 2 failed", and never reports success while any item
   failed.
7. **Given** a screen reader is active **when** progress crosses each 10 percent boundary and on
   every state change **then** a polite live region announces the aggregate, and no announcement
   steals focus from the list.
8. **Given** the account has storage remaining **when** the picker is opened **then** the sheet
   states the remaining allowance in the same units the account screen uses, so a 900 MB selection
   against 400 MB free is visibly doomed before it starts.

**Mobile acceptance criteria**

- Every tray row is at least 48 CSS px tall with a 48 x 48 CSS px cancel target, separated by at
  least 8 px from the retry target.
- The collapsed tray bar sits above the bottom action bar with `env(safe-area-inset-bottom)` padding
  and never covers the last list row: the list gets `scroll-padding-bottom` equal to both bars.
- At 360 x 640 with the tray expanded, at least four tray rows are visible and the sheet is
  dismissible by swipe-down; dismissing the sheet does not cancel any upload, and the collapsed bar
  remains.
- The tray is a sheet, so it is its own history entry: Android system back and the iOS in-app back
  both close it and return to the folder at its previous scroll position.
- With 200 percent text size, tray rows wrap rather than truncate the percentage, and no control is
  clipped at 320 CSS px.
- `accept` is not used to fake a filter the platform will not honour: any accepted file type
  may be selected, and rejection happens server-side with a named reason (US-E04-06).

**Edge cases & negative paths**

- Picker returns zero files (user cancelled): no tray row, no toast, no state change.
- A selected file is deleted from the device before its turn: row fails with "This file is no longer
  on your device." and offers Remove, not Retry.
- 500 files selected at once: the queue accepts them, uploads at most 3 concurrently, and states
  "Large batch, this will take a while on cellular" once, not per file.
- Duplicate selection of the same file within one batch: deduplicated by `(name, size, lastModified)`
  before enqueue, with a single note "1 duplicate skipped".
- Tab closed from the tab switcher: on next open the tray is reconstructed from durable storage with
  the honest paused copy (US-E04-04).

---

### US-E04-03 — Capture a document with the camera or pick from the photo library

**As a** P1 Marcy Doyle holding a P&L the seller just handed me **I want** to photograph it straight
into the right subfolder **so that** it never gets lost in my camera roll.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E04-02 |
| Traces to | FR-FILE-002, FR-FILE-004, FR-MOB-043, NFR-COMPAT-001, NFR-MOB-003, NFR-PRIV-001, BR-034 |

**Acceptance criteria**

1. **Given** a browser that supports the `capture` attribute **when** Take photo is activated
   **then** the OS camera opens directly and the resulting image is enqueued into the current folder
   with no intermediate screen.
2. **Given** a browser without `capture` support (desktop Chrome, Safari and Firefox) **when** the
   Add sheet renders **then** Take photo is absent rather than present-and-broken, and Choose files
   is offered in its place.
3. **Given** a captured photograph **when** it is enqueued **then** the proposed name follows the
   capture naming rule (`Scan <yyyy-mm-dd> <hh:mm>.jpg`, Assumption: locale-formatted), is shown in
   an editable field in the tray row before the first chunk is sent, and can be renamed without
   cancelling the upload.
4. **Given** the platform photo picker **when** the principal selects images **then** only the
   selected items are received, the product never requests library-wide permission, and no copy
   implies a camera-roll sync.
5. **Given** a HEIC or HEIF capture on iOS **when** it is committed **then** the server sniffs the
   real type, normalises it to a web-deliverable format for preview, retains the original bytes as
   the stored file, and the file's stated type in the details sheet is the original.
6. **Given** camera permission is denied at the OS level **when** Take photo is activated **then**
   the product shows "Your browser does not have camera access. Turn it on in Settings to take
   photos here." with a Choose files fallback, and does not retry the prompt in a loop.
7. **Given** a capture on a metered connection **when** the image exceeds the client compression
   threshold (Assumption: 4 MB) **then** the principal is offered "Send full quality" or "Send
   smaller (about 1.2 MB)" with the byte estimate stated, and the choice is remembered per session.
8. **Given** any capture **when** the file is committed **then** an `ActivityEvent` records the
   source as `camera` so that E11 can report how much of the corpus originates on a phone.

**Mobile acceptance criteria**

- Take photo to file visible in the target folder is at most three taps from the folder screen (Add,
  Take photo, shutter plus the OS Use Photo confirmation), measured on both iOS Safari and Chrome
  Android.
- The name field in the tray row keeps its Save control visible above the on-screen keyboard using
  `keyboard-inset-*` with a `visualViewport` fallback, at 360 x 640.
- Returning from the OS camera does not remount the folder screen or lose scroll position; the state
  is restored from the persisted route state because the page may have been frozen while the camera
  was open.
- The Add sheet has at most six labelled rows in two grouped sections and does not scroll at 360 x
  640 with 200 percent text size; it is a modal bottom sheet, not a flat action sheet, precisely
  because an action sheet is capped at four buttons.
- With a screen reader on, each Add row announces its label and role, and the camera row announces
  that it opens the device camera.
- Gloved or cracked-screen tolerance: all Add sheet rows are at least 56 CSS px tall (above the 48 px
  floor) because this flow is used one-handed in the field.

**Edge cases & negative paths**

- Camera returns a 0-byte file (a known OS failure): the row fails immediately with "That photo did
  not save. Try again." and nothing is committed.
- The app is backgrounded by an incoming call during capture: on return the tray shows the queued
  item, or nothing if the OS discarded the capture, and never a phantom row.
- Photo library selection includes a video type the workspace does not accept: the video row fails with
  `415 UNSUPPORTED_MEDIA_TYPE` and the accepted list, while the image rows continue.
- Storage full on the device so the OS cannot save the capture: the OS error surfaces; the product
  adds no second error of its own.
- A principal with only `canRead` reaches this flow by deep link: the sheet is not rendered and the
  API refuses with `403 READ_ONLY_SHARE`.

---

### US-E04-04 — Honest upload state across backgrounding, freeze and discard

**As a** P6 Ray Okonkwo walking out of a basement **I want** the app to tell me the truth about
whether my upload is still going **so that** I do not drive away believing a half-loaded folder is
complete.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E04-01, US-E04-02 |
| Traces to | FR-FILE-010, FR-FILE-012, FR-MOB-022, FR-PERF-011, NFR-MOB-003, NFR-COMPAT-001 |

**Acceptance criteria**

1. **Given** an upload is running **when** the page transitions to hidden **then** the session state
   becomes `paused` on both client and server, and the tray copy becomes exactly "Paused, reopen the
   app to continue".
2. **Given** any platform **when** an upload is not actively progressing in the foreground **then**
   no interface element states or implies background progress; the words "uploading in the
   background" appear nowhere in the product, and a review checklist item asserts this per release.
3. **Given** an installed Android web app where Background Fetch is available **when** the platform
   genuinely continues the transfer **then** and only then may the tray say "Continuing in the
   background", gated on a runtime capability check rather than a user-agent string.
4. **Given** the app is reopened with paused sessions **when** the folder or tray is shown **then**
   the tray lists them with their percentage and a single Resume all control, and resumption begins
   automatically if the connection is unmetered.
5. **Given** the device goes offline **when** an upload is in flight **then** a persistent banner
   states "No connection. Uploads are paused." and disappears automatically on reconnect without a
   manual refresh.
6. **Given** a paused session on another device **when** the principal opens `GET /uploads` on this
   device **then** the tray shows it labelled with its origin device ("queued on your iPhone") and
   does not offer to resume it here, because the file bytes are not on this device.

**Mobile acceptance criteria**

- QA script: start a 100 MB upload on iOS Safari, switch to another app for two minutes, return. The
  tray must show paused, then resume, and the final file must be byte-identical to the source
  (checksum compared).
- QA script: start the same upload, close the tab from the tab switcher, reopen the installed web
  app. The tray must be reconstructed with the same percentage ±1 chunk.
- The offline banner respects `env(safe-area-inset-top)` and does not push the sticky breadcrumb off
  screen at 360 x 640.
- The paused state is announced once through a polite live region, not repeatedly on every retry
  tick.
- Wake Lock is not requested when the upload is paused, so the screen is not held awake pointlessly.

**Edge cases & negative paths**

- iOS with the site in a browser tab rather than on the Home Screen: identical behaviour, and the
  install teaching card (E09) states what installing does and does not change, explicitly noting it
  does not enable background upload.
- Connection flips from Wi-Fi to cellular mid-upload: the session continues, chunk size is
  re-selected downward at the next boundary, and the tray notes "Switched to cellular" once.
- Battery saver mode throttles timers: progress may stall without an error; after 60 seconds without
  a confirmed chunk the tray states "Waiting for a better connection" rather than showing a frozen
  percentage.
- The user believes the upload is done because the folder shows the file: impossible by construction,
  because the node is not created until commit.

---

### US-E04-05 — Resume, retry and cancel an upload

**As a** P4 Ashley Kim on a train **I want** to resume, retry or abandon each stuck upload
individually **so that** one bad file does not force me to redo a batch of forty.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E04-01, US-E04-04 |
| Traces to | FR-FILE-009, FR-FILE-013, FR-FILE-014, FR-FILE-015, FR-CONF-029, NFR-AVAIL-001, NFR-AVAIL-002, BR-035 |

**Acceptance criteria**

1. **Given** a paused session **when** Resume is activated **then** the client issues
   `HEAD /uploads/:uploadId`, resumes from the returned offset, and the tray shows continuing
   progress within 3 seconds on a working connection.
2. **Given** a failed session **when** Retry is activated **then** the same `clientRequestId` is
   reused, `attemptCount` is preserved and displayed after the third attempt ("Attempt 4 of 50"),
   and no duplicate file is created.
3. **Given** more than one failure in the tray **when** the tray renders **then** a single "Retry all
   failed" control is present, and it retries only failed items, never those in progress.
4. **Given** an in-progress or queued session **when** Cancel is activated **then** the API receives
   `DELETE /uploads/:uploadId`, the multipart upload is aborted, the pending blob is marked orphaned,
   the row disappears, and no node exists in the folder.
5. **Given** a session was already committed but the client never saw the response **when** the
   client retries the commit **then** the API returns `409 UPLOAD_ALREADY_COMMITTED`, which the
   client treats as success and shows the file, so a lost response cannot create "Lease (2).pdf".
6. **Given** a cancelled or expired session **when** the sweeper runs **then** orphaned parts are
   aborted within the TTL in BR-035 (Assumption: 24 hours) and no storage is billed for them, proven
   by a reconciliation test.
7. **Given** an upload that failed for a reason the user can fix **when** the row renders **then** the
   row shows the specific catalogue message (for example "You are out of storage (10 GB of 10 GB
   used). Nothing was lost.") and the recovery action from the catalogue, not a generic "Failed".

**Mobile acceptance criteria**

- Cancel and Retry are separate 48 x 48 CSS px targets at least 8 px apart, and Cancel is not placed
  under the thumb's resting position on a 6-inch phone.
- Cancel commits on the pointer up-event and can be aborted by sliding off the control before
  release (WCAG 2.2 SC 2.5.2).
- Cancelling an upload shows a 10-second undo toast "Upload cancelled. Undo" which re-enqueues the
  file if the file handle is still held; if the handle is gone the toast says "Upload cancelled" with
  no undo, because a false undo is worse than none.
- Row swipe is not used for cancel: swipe on a tray row does nothing, because the tray is a
  short-lived list where an accidental destructive swipe is the documented failure mode.
- With TalkBack and VoiceOver, each tray row announces name, percentage, state and the actions
  available on it.
- On a 360 px viewport the failure reason wraps to at most three lines and the Retry control stays
  visible without horizontal scrolling.

**Edge cases & negative paths**

- Resume attempted while offline: the control is present but shows "No connection" on activation
  rather than being hidden, so the user is not left wondering where it went.
- File handle lost after an app restart (the common iOS case): the row states "Reselect this file to
  finish uploading" and opens the picker pre-filtered to nothing, because the platform gives no way
  to re-open a previous selection.
- Cancel raced against commit: the API returns `204` and the committed node is then trashed as part
  of the same operation, with the tray stating "Cancelled after upload finished, moved to Trash" so
  the outcome is never ambiguous.
- Server reports a smaller offset than the client sent (partial write): the client rewinds and
  re-sends from the server's offset without user involvement.

---

### US-E04-06 — Commit gates: quota, size ceiling, type sniffing and malware scan

**As a** P1 Marcy Doyle **I want** the product to refuse an upload loudly rather than accept it
partially **so that** I never believe a document is in the room when it is not.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E04-01 |
| Traces to | FR-FILE-045, FR-ACCT-007, FR-ACCT-008, FR-ACCT-009, FR-AUDIT-001, NFR-SEC-003, BR-036, BR-201, BR-202, BR-203 |

**Acceptance criteria**

1. **Given** an account whose remaining quota is smaller than `declaredSizeBytes` **when**
   `POST /rooms/:roomId/uploads` is called **then** the API returns `507 STORAGE_QUOTA_EXCEEDED`
   before any bytes move, with a `limit` object, and the tray row shows "You are out of storage (10
   GB of 10 GB used). Nothing was lost." with Upgrade and Empty trash actions that state how much
   each frees.
2. **Given** an upload whose actual size exceeds the declared size and crosses the quota **when** the
   overflow chunk arrives **then** the upload is aborted, all uploaded parts are discarded, no
   partial item appears in the folder, and the abort is reported explicitly in the tray.
3. **Given** a file above the administrator-set per-file ceiling (BR-231) **when** the session is
   requested **then** the API returns `413 FILE_TOO_LARGE` naming the actual limit and who can raise it,
   and the message reads "This file is larger than this workspace allows (2 GB)."
4. **Given** any committed file **when** the type is recorded **then** it is determined by
   server-side content sniffing, never from the client-declared MIME type or the filename extension,
   and a test that uploads a ZIP named `report.pdf` proves the stored `mimeType` is the sniffed one.
5. **Given** a file in state `scanning` **when** the folder listing is requested **then** the file is
   not yet listed, and the tray row states "Checking for viruses"; the node becomes visible only on
   a clean result.
6. **Given** the scanner returns a detection **when** the session resolves **then** no node is
   created, the blob is quarantined for 30 days rather than deleted, the room owner is notified, the
   tray shows "This file failed our security scan and was not added.", and no retry of the same bytes
   is offered.
7. **Given** the scanner is unavailable **when** a commit is attempted **then** the session stays in
   `scanning` with the copy "We cannot check this file for viruses right now. It is queued.", retries
   with backoff, and never silently publishes an unscanned file.
8. **Given** any of these refusals **when** they occur **then** an activity entry records the attempt,
   the reason and the actor, so an owner can explain a missing document later.

**Mobile acceptance criteria**

- The quota refusal is a tray row state plus one toast, not a modal that blocks the folder screen,
  because the principal may still need to revoke a share while over quota.
- The "Request more space" action sends the one-tap request of US-E12-04 without leaving the tray,
  and the tray survives the round trip.
- All refusal copy fits three lines at 360 CSS px and 200 percent text size without truncation; the
  numbers in it (used, limit, shortfall) are never truncated, because a truncated number is a defect.
- Refusals are announced through a polite live region with the reason, so a screen-reader user is not
  left with a silent stalled row.
- QA can force each path from a phone: a test configuration caps the quota at 1 MB, a fixture file exceeds
  the per-file cap, and an EICAR test file triggers the scanner path.

**Edge cases & negative paths**

- Quota freed by another device mid-block: the blocked row offers Retry and succeeds without
  re-selecting the file, provided the handle is still held.
- Two devices upload simultaneously into the last 100 MB: the second receives `507` at commit, not at
  session creation, and the message is identical; nothing is corrupted.
- An administrator lowers the ceiling while an upload runs: the session completes if it was already
  within the old allowance and the scope enters the never-delete read-only state of US-E12-20 rather
  than losing bytes.
- Zero-byte file: accepted, stored, and listed with size 0 B; it is a legitimate artefact and not an
  error.
- Extension mismatch after sniffing (a `.pdf` that is really a `.docx`): the file is stored with its
  given name, the details sheet shows the real type, and preview uses the real type.

---

### US-E04-07 — Duplicate-name resolution at commit, with apply-to-all

**As a** P4 Ashley Kim who has just photographed eighteen pages into a folder that already holds
last month's batch **I want** to be asked once and answer once **so that** I never silently overwrite
a lease a buyer is already relying on.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E04-01, US-E04-02 |
| Traces to | FR-CONF-002, FR-CONF-006, FR-CONF-007, FR-CONF-008, FR-FILE-043, FR-FILE-015, NFR-I18N-001, BR-146, BR-150 |

**Acceptance criteria**

1. **Given** a commit whose `targetName` collides with an active sibling under the case-insensitive,
   NFC-normalised, whitespace-trimmed `nameKey` **when** `conflictResolution` is null **then** the
   API returns `409 NAME_CONFLICT` with a `ConflictDetail` carrying `attemptedName`, `suggestedName`,
   `existingNodeId`, `existingSizeBytes`, `existingUpdatedAt` and `allowedResolutions`.
2. **Given** that response **when** the conflict sheet renders **then** it offers exactly Keep both
   (showing the literal suggested name, for example `Lease (2).pdf`), Replace as a new version, and
   Cancel this file, and it never resolves silently.
3. **Given** Keep both **when** the commit is repeated with `conflictResolution: 'keep_both'` **then**
   the created node's name equals the `suggestedName` the sheet displayed, proven by a shared fixture
   suite that runs the same deterministic algorithm on client and server.
4. **Given** Replace **when** the commit is repeated with `conflictResolution: 'replace'` **then** a
   new `FileVersion` is created on the existing node, the node id and every share link pointing at it
   keep working, the previous version remains listed in version history, and the activity log records
   a replacement rather than a creation.
5. **Given** a multi-file operation with more than one conflict **when** the sheet renders **then** an
   "Apply to all remaining conflicts" checkbox is offered, scoped to this operation and this conflict
   kind only, and its state is not remembered across operations.
6. **Given** Cancel this file **when** it is chosen **then** only that item is cancelled, the rest of
   the batch continues, and the tray reports the cancellation as a distinct outcome from a failure.
7. **Given** the bytes are already uploaded when the conflict is detected **when** the principal
   resolves it **then** resolution completes without re-uploading, in under 2 seconds at the 75th
   percentile.
8. **Given** the colliding sibling is a folder and the incoming item is a file **when** the conflict
   is evaluated **then** `merge_folders` is not offered, and `allowedResolutions` excludes it.

**Mobile acceptance criteria**

- The conflict sheet is a single sheet with no stacked child sheet; renaming inside it happens in the
  same sheet, because dismissing a sheet must always return to the folder screen.
- The suggested name is shown as editable text with only the base name pre-selected and the extension
  preserved.
- At 360 x 640 the sheet shows the existing file's size and modified date without scrolling, so the
  principal can tell which copy is newer before choosing.
- The destructive-adjacent choice (Replace) is visually separated from Keep both by at least 16 px
  and is not the default focus target.
- With the keyboard open for a rename, the Save control stays visible above the keyboard inset.
- Answering 18 conflicts with "Apply to all" is one tap plus one checkbox, and QA measures the whole
  18-file resolution at under 15 seconds on a 4G link.

**Edge cases & negative paths**

- Name already ends in a parenthesised number (`Lease (2).pdf`): the algorithm produces
  `Lease (3).pdf`, not `Lease (2) (2).pdf`.
- Unicode near-duplicates (`Café.pdf` NFC versus NFD): treated as a collision, because `nameKey` is
  normalised.
- The existing sibling is trashed: no collision, because trashed nodes do not occupy a name.
- Another principal creates the same name between the 409 and the resolution: the resolution returns
  a fresh `409` with the new detail rather than overwriting an item the user never saw.
- Replace attempted by a principal with `canUploadInto` but not `canRename` on the existing node:
  refused with `403 FORBIDDEN`, and only Keep both and Cancel are offered.

---

### US-E04-08 — Selection mode and the contextual bulk action bar

**As a** P4 Ashley Kim **I want** to select nine files with my thumb and see exactly what will happen
to them **so that** I can fix a misfiled batch from a train instead of waiting for a desk.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | none |
| Traces to | FR-FILE-035, FR-FILE-036, FR-FILE-037, FR-MOB-009, FR-MOB-036, NFR-A11Y-001, NFR-A11Y-004, BR-219 |

**Acceptance criteria**

1. **Given** a folder listing **when** the principal long-presses a row or activates the visible
   Select control **then** selection mode is entered, a checkbox appears on every row, and that same
   long-press meaning is used in every list in the product (folder, search results, trash).
2. **Given** selection mode **when** it is active **then** the bottom action bar is replaced by a
   contextual bar whose title states the count ("4 selected") and which exposes Move, Copy, Download,
   Share, Delete and an overflow, each with a visible text label.
3. **Given** selection mode **when** Select all is activated **then** every item loaded *and*
   unloaded in the current folder is selected up to the cap in BR-219 (Assumption: 500), and the bar
   states "All 312 items selected" or "First 500 of about 10,240 selected" so the scope is never
   ambiguous.
4. **Given** two selected rows far apart **when** "Select from here to…" is used **then** the range
   between the anchor and the target is selected without any dragging gesture, satisfying WCAG 2.2 SC
   2.5.7.
5. **Given** a mixed selection of folders and files **when** the bar renders **then** actions invalid
   for the mixture are hidden rather than disabled, and the overflow explains nothing about hidden
   items because unavailable items are not shown.
6. **Given** a selection containing an item the principal may not delete **when** Delete is activated
   **then** the confirmation states the split ("You can delete 7 of 9 items") before commit, and the
   two ineligible items are named.
7. **Given** selection mode **when** the principal navigates into a folder, opens a preview or
   dismisses via the system back **then** selection mode exits as its own history entry and the
   selection is cleared, with no phantom selection surviving navigation.
8. **Given** any selection **when** the server executes the operation **then** eligibility is
   re-evaluated per item server-side, so a client that submits an item it should not have offered
   receives a per-item `403` in the batch result (US-E04-13).

**Mobile acceptance criteria**

- Checkboxes and the row's own tap target do not compete: the checkbox is a 48 x 48 CSS px target on
  the leading edge, the rest of the row toggles selection, and no navigation occurs in selection mode.
- The contextual bar is within the thumb zone (bottom 45 percent of viewport height) with
  `env(safe-area-inset-bottom)` padding, and shows at most five actions plus an overflow at 360 px.
- Entering selection mode fires one haptic pulse where vibration is exposed, suppressed under
  reduced-motion or when system haptics are off.
- Long-press commits on the up-event and can be aborted by sliding off the row before release; a
  long-press that becomes a scroll is treated as a scroll.
- With a screen reader on, each row announces "selected" or "not selected" and the bar announces the
  count on every change through a polite live region.
- At 200 percent text size the bar labels wrap to two lines rather than being replaced by unlabelled
  icons, and each label remains the control's accessible name (SC 2.5.3).

**Edge cases & negative paths**

- Selection exceeds the cap: "You can act on 500 items at a time. 500 of 812 are selected." with no
  silent truncation.
- An item in the selection is deleted by another principal: the batch reports that item as
  `404 NOT_FOUND` in its per-item result and the rest proceeds.
- Rotation while in selection mode: selection survives (no orientation lock is permitted), and the
  bar re-lays out without losing the count.
- Selection mode entered on an empty folder: the Select control is absent, because there is nothing
  to select.
- A hardware keyboard is attached: Shift+arrow extends the selection, `Ctrl/Cmd+A` selects all, and
  Escape exits selection mode.

---

### US-E04-09 — Move a file or a selection with the destination picker

**As a** P4 Ashley Kim **I want** to move items into a nested folder by choosing a destination, not
by dragging **so that** the operation is possible at all on a phone and safe from a mis-swipe.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E04-08 |
| Traces to | FR-FILE-024, FR-FILE-025, FR-FILE-042, FR-FLDR-008, FR-FLDR-030, FR-CONF-004, FR-CONF-018, NFR-A11Y-004, BR-039 |

**Acceptance criteria**

1. **Given** one item or a selection **when** Move is activated **then** a single destination-picker
   sheet opens showing the room root and its children, with its own internal breadcrumb, in-sheet
   drill-down, and a primary "Move here" button that names the destination ("Move 4 items to
   Financials").
2. **Given** the picker **when** the destination is the item's current parent **then** "Move here" is
   disabled with the inline reason "Already in this folder", and no request is sent.
3. **Given** a folder being moved **when** the picker renders **then** the folder itself and its
   entire descendant subtree are shown non-selectable with the reason "You cannot move a folder
   inside itself", so `400 MOVE_INTO_DESCENDANT` is never reached through the interface.
4. **Given** a valid destination **when** Move is confirmed **then** `POST /nodes/:nodeId/move` (or
   the batch endpoint for a selection) is called with `If-Match`, the list updates optimistically, and
   a toast reports "Moved 4 items to Financials · Undo" for 10 seconds.
5. **Given** the undo is activated **when** it is within the window **then** every moved item returns
   to its original parent, including items that had a name conflict resolved on the way in, and the
   activity log records the undo as its own event.
6. **Given** a name collision in the destination **when** the move is executed **then** the conflict
   sheet from US-E04-07 is presented with Keep both, Replace and Cancel, with apply-to-all for the
   remainder of the batch.
7. **Given** the principal lacks `canMove` on the source or `canUploadInto` on the destination
   **when** the request reaches the API **then** it is refused with `403 FORBIDDEN` or
   `403 READ_ONLY_SHARE`, the optimistic change is reverted, and the item visibly returns to its
   original position with the message shown once.
8. **Given** the item is inside the scope of an active share **when** the move takes it outside that
   scope **then** the confirmation states "This will remove 2 people's access to this file" with the
   count before commit, per the sharing rules in E07.
9. **Given** a new folder is needed **when** the principal activates New folder inside the picker
   **then** it is created inline within the same sheet, without stacking a second sheet, and becomes
   the selected destination.

**Mobile acceptance criteria**

- The picker is one sheet at the large detent; no action inside it opens another sheet, so dismissing
  always returns to the folder screen.
- "Move here" is a full-width button in the thumb zone, at least 48 CSS px tall, with the destination
  name truncated from the middle so both the room and the leaf folder remain visible.
- The picker list is virtualised and loads children on demand, so a room with 10,000 folders opens in
  under 1 second at the 75th percentile on the reference device.
- Drag-and-drop is not offered at compact width and its absence costs nothing: every move is reachable
  from the overflow, the contextual bar and the keyboard.
- Swipe on a row never triggers a move.
- With a screen reader on, the picker announces the current in-sheet location on each drill-down, and
  the confirm button's accessible name contains the destination name.
- On a flaky connection the picker keeps its rendered tree and shows a stale marker rather than
  emptying itself.

**Edge cases & negative paths**

- Destination deleted by another principal between selection and confirm: `404 NOT_FOUND`, copy "We
  could not find that. It may have been moved or deleted.", the picker returns to the nearest
  surviving ancestor.
- Destination would breach depth 32 or path length 1024: refused with `FOLDER_DEPTH_EXCEEDED` or
  `PATH_LENGTH_EXCEEDED`, stating the limit and the resulting value; the offending branch is disabled
  in the picker where the depth is known in advance.
- Subtree too large to move synchronously: `400 MOVE_SUBTREE_TOO_LARGE` with the offer to move
  subfolders, or the asynchronous batch path with progress.
- Stale ETag because another principal renamed the item: `412 STALE_VERSION` with "Someone changed
  this while you were looking. Reload to see the latest." and a "reapply my change" action.
- Offline: Move is refused with "You need a connection to move files." rather than queued, because
  R1's offline queue covers uploads only.
- Move across rooms: not offered anywhere in R1 and refused server-side; recorded as OQ33.

---

### US-E04-10 — The staging tray: cut, copy and paste on touch

**As a** P4 Ashley Kim **I want** to hold items while I browse to the right folder **so that** I can
find the destination the way I would on a desktop, without a modal picker deciding for me.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E04-08, US-E04-09 |
| Traces to | FR-FILE-026, FR-FILE-027, FR-VIEW-030, FR-MOB-011, NFR-A11Y-001, NFR-MOB-001, BR-039 |

**Acceptance criteria**

1. **Given** a selection **when** Cut or Copy is activated **then** a slim staging tray appears above
   the bottom bar reading "3 items ready to move" or "3 items ready to copy", with Paste here, View
   items and Clear controls.
2. **Given** items are staged **when** the principal navigates to any folder in the same room, opens a
   preview, or backgrounds and reopens the app **then** the tray and its contents survive, because
   staged state is persisted per session.
3. **Given** the tray **when** Paste here is activated in a valid destination **then** the move or
   copy executes exactly as US-E04-09 specifies, including conflict handling, the count-bearing toast
   and the 10-second undo.
4. **Given** the tray **when** the current folder is the source of a cut **then** Paste here is
   disabled with the reason "Already in this folder".
5. **Given** the tray **when** View items is activated **then** a sheet lists the staged items with
   their original paths and per-item remove controls, so a mistaken inclusion can be dropped without
   restarting.
6. **Given** a cut that is never pasted **when** the session ends **then** nothing has changed on the
   server: a cut stages intent only and never removes the source item.
7. **Given** a hardware keyboard **when** `Ctrl/Cmd+X`, `Ctrl/Cmd+C` and `Ctrl/Cmd+V` are pressed
   **then** they map to exactly the same tray, so the desktop shortcut and the touch mechanism share
   one implementation and one server call.
8. **Given** the tray is present **when** a screen reader is active **then** it is announced as a
   status region with its count, and its controls are reachable in tab order immediately after the
   list.

**Mobile acceptance criteria**

- The tray is at most 56 CSS px tall, sits above the bottom action bar, respects
  `env(safe-area-inset-bottom)`, and the list's `scroll-padding-bottom` accounts for both so the last
  row is never hidden.
- The tray is documented in the interface as the phone equivalent of split view: the empty-state help
  text under Paste here reads "Browse to a folder, then paste. This is the phone version of a split
  view."
- Clear requires a single tap and shows a 10-second undo toast, because clearing a 40-item staging
  set by accident is a real loss of work.
- At 200 percent text size the tray count and Paste here remain on one line by truncating the label
  before the count; the count is never truncated.
- Rotating the device or resizing to tablet width preserves the tray, and at expanded width it becomes
  the second pane's source list rather than disappearing.

**Edge cases & negative paths**

- Staged item deleted by another principal: the tray shows it struck through with "no longer
  available" and excludes it from the paste, reporting the exclusion in the result.
- Staged items from a room the principal loses access to mid-session: the tray drops them and states
  "1 item was removed because your access changed."
- Paste attempted into a read-only room (archived, or view-only share): `403 ROOM_ARCHIVED` or
  `403 READ_ONLY_SHARE`, tray contents preserved so the principal can paste elsewhere.
- Both a cut and a copy attempted at once: the tray holds one intent at a time; starting a copy while
  a cut is staged asks "Replace the 3 items you were moving?" rather than merging silently.
- Paste of 500 items: proceeds via the batch endpoint with progress and per-item results.

---

### US-E04-11 — Copy, duplicate and rename a file

**As a** P1 Marcy Doyle **I want** to duplicate a file and fix a filename from my phone **so that**
the room reads professionally to a buyer without me opening a laptop.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E04-09 |
| Traces to | FR-FILE-027, FR-FILE-028, FR-FILE-029, FR-CONF-003, FR-CONF-005, FR-CONF-010, FR-CONF-012, FR-CONF-013, NFR-I18N-001, BR-137, BR-146, BR-158 |

**Acceptance criteria**

1. **Given** a file row **when** Copy to… is activated **then** the destination picker opens and a
   confirmed copy leaves the source untouched, creating a new node with its own id, its own share
   state (none inherited from the source's direct shares) and a fresh activity entry.
2. **Given** a file row **when** Duplicate is activated **then** a copy is created in the same folder
   named by the deterministic algorithm (`Lease.pdf` becomes `Lease (2).pdf`), with no conflict sheet,
   because the name is generated rather than chosen.
3. **Given** a file row **when** Rename is activated **then** a single-field sheet opens with the
   current name pre-filled, only the base name pre-selected, and the extension preserved unless the
   principal deliberately edits it.
4. **Given** a rename field **when** the principal types **then** a live character counter shows the
   remaining allowance against 255, forbidden characters are rejected inline with the message "That
   name uses characters we cannot store. Try without / \\ : * ? \" < > |" and the offending characters
   are selected.
5. **Given** a name with leading or trailing whitespace or a trailing full stop **when** Save is
   activated **then** the trimmed result is shown in the field before commit, so the stored name is
   never a surprise.
6. **Given** a rename that would collide **when** Save is activated **then** the API refuses with
   `409 NAME_CONFLICT` and the sheet offers Keep both (with the literal suggested name) or Cancel;
   Replace is not offered for a rename because a rename cannot become a version.
7. **Given** a successful rename **when** the response returns **then** the new name appears
   immediately everywhere it is displayed (list row, breadcrumb if applicable, staging tray, search
   result cache) within one request cycle, and any share link to the file keeps working because the
   node id has not changed.
8. **Given** the principal lacks `canRename` **when** the row overflow renders **then** Rename is
   absent, and a direct `PATCH` returns `403 READ_ONLY_SHARE` with the optimistic change reverted.

**Mobile acceptance criteria**

- The rename sheet keeps the field and the Save button above the on-screen keyboard at 360 x 640 using
  `keyboard-inset-*` with a `visualViewport` fallback; nothing that receives focus is obscured (SC
  2.4.11).
- No double-tap-to-edit anywhere: rename is reached only from the row overflow, the long-press sheet
  or the details sheet.
- The extension is not shown in the editable region by default (per the extension-display setting in
  [E05](./epic-05-viewing-preview-and-file-details.md) US-E05-17); when hidden, saving cannot destroy
  it, proven by a test that renames `Lease.pdf` to `Lease 2026` and asserts the stored name is
  `Lease 2026.pdf`.
- Paste into the rename field is permitted, and autocorrect and autocapitalisation are disabled for
  filenames.
- With a screen reader, the sheet announces its purpose and the field announces the character
  allowance; the error announcement is polite and does not move focus away from the field.
- Duplicate on a 2 GB file returns within 2 seconds because the copy is a metadata operation over a
  refcounted blob, not a byte copy.

**Edge cases & negative paths**

- Rename to a reserved name (`CON`, `NUL`, `.`): refused with `400 INVALID_NODE_NAME` naming the
  reason.
- Rename to a name differing only by case from a sibling (`lease.pdf` versus `Lease.pdf`): treated as
  a collision, because uniqueness is on the case-folded `nameKey`.
- Copy into a destination that pushes the account over quota: `507 STORAGE_QUOTA_EXCEEDED`, nothing
  created, tray-free because copy is synchronous.
- Duplicate of a file currently in `scanning`: refused with "This file is still being checked. Try
  again in a moment."
- Concurrent rename by two principals: the second receives `412 STALE_VERSION` with the current name
  shown, and the choice to reapply.
- Right-to-left or emoji filenames: stored NFC-normalised, displayed with correct bidirectional
  isolation so the extension does not visually jump.

---

### US-E04-12 — Delete to trash with undo, restore and permanent delete

**As a** P1 Marcy Doyle with a thumb on a cracked screen **I want** to be told exactly what a delete
destroys and to be able to take it back **so that** a mis-tap cannot end a live deal.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E04-08 |
| Traces to | FR-FILE-031, FR-FILE-032, FR-FILE-033, FR-FILE-034, FR-FLDR-010, FR-FLDR-012, FR-FLDR-013, FR-CONF-030, FR-AUDIT-025, NFR-A11Y-001, BR-172, BR-174, BR-176, BR-177, BR-181 |

**Acceptance criteria**

1. **Given** a file **when** Delete is activated **then** a confirmation states the item name and size
   and the sentence "This moves 1 file (2.4 MB) to Trash. You can restore it for 30 days."; on
   confirm the node moves to `trashed`, disappears from listings and search, and a toast offers Undo
   for 10 seconds.
2. **Given** a folder **when** Delete is activated **then** the confirmation states server-computed
   counts exactly: "This deletes 3 folders, 47 files and 812 MB. 2 people will lose access." Counts
   come from `descendantFolderCount`, `descendantFileCount`, rolled-up `sizeBytes` and the active
   share count, never from a client-side walk.
3. **Given** a cascade above the threshold in BR-174 (Assumption: 25 files or any active share)
   **when** the principal confirms **then** a second, distinct confirmation is required (typing the
   folder name), and the request carries `?confirmFiles=&confirmFolders=` which the server compares
   with its own counts, returning `409` if they have moved.
4. **Given** the undo toast **when** Undo is activated **then** the entire subtree returns to its
   original parent with its original names, any share links inside it resume working, and the activity
   log records both the delete and the undo.
5. **Given** the trash screen **when** it renders **then** each entry shows the item name, its
   original path, who deleted it, when, the item count for a folder, and the exact purge date.
6. **Given** a trash entry **when** Restore is activated **then** the subtree returns to its original
   path; if the original parent no longer exists it is restored to the room root and the result states
   "Restored to the room root because the original folder no longer exists."
7. **Given** a restore whose name now collides **when** it is executed **then** the conflict sheet is
   shown with Keep both and Cancel, and the resolution is recorded in the activity log.
8. **Given** a room owner **when** Permanent delete is activated on a trash entry **then** a
   two-step confirmation states "This cannot be undone. 47 files and 812 MB will be destroyed." and
   requires a step-up assertion; after commit the audit log retains a tombstone so the disappearance
   is still explained.
9. **Given** retention elapses **when** the purge job runs **then** the entry is purged, an activity
   entry is written, storage is released from `bytesInTrash`, and blobs whose refcount reaches zero are
   deleted after the 7-day grace.
10. **Given** a principal without `canDelete` **when** the row renders **then** Delete is absent, and a
    direct `DELETE` returns `403 READ_ONLY_SHARE`.

**Mobile acceptance criteria**

- The counts block is never truncated at 360 CSS px or at 200 percent text size; it wraps. Truncating
  a blast-radius count is a defect.
- The destructive button is placed at the top of the confirmation's action group and the safe Cancel
  in the thumb zone at the bottom, so the easiest one-handed target is the non-destructive one.
- Commit happens on the pointer up-event and can be aborted by sliding off the control before release
  (SC 2.5.2).
- Swipe-to-delete is offered on at most one direction of a row, is paired with the same 10-second undo,
  keeps the acted-on row visible while the undo is available, and is duplicated in the row overflow.
  A horizontal drag beginning within 24 CSS px of either screen edge is not treated as a swipe.
- The undo toast is positioned above the bottom action bar and the staging tray, does not obscure the
  focused element, and is announced assertively with the count.
- The trash screen is reachable in at most two taps from the folder screen (overflow, Trash) and its
  rows are 64 CSS px tall with a 48 px overflow target.
- Deleting offline is refused with "You need a connection to delete." rather than queued.

**Edge cases & negative paths**

- Undo tapped after the window closed: the toast is gone; Restore from Trash is the path, and the
  toast copy already said "restore it for 30 days".
- Counts change between rendering and confirming (another principal uploads into the folder):
  `409 STALE_VERSION`, the sheet re-renders with the new counts, and the typed confirmation is
  required again.
- Deleting an item inside an active share: the share continues to exist but returns
  `404 SHARE_TARGET_UNAVAILABLE` to recipients, whose screen reads "The shared item is no longer
  available." with no leak of what it was.
- Deleting a file with an upload in flight into the same folder: the upload completes and the new
  file is unaffected.
- Trash across a room delete: deleting the room takes its trash with it, and the room's own retention
  window governs, per E02.
- Two principals delete the same item concurrently: the second receives `404` and the interface shows
  "Already deleted" rather than an error.

---

### US-E04-13 — Bulk operations with per-item results and mid-flight cancel

**As a** P4 Ashley Kim moving forty files **I want** to be told precisely which items failed and why
**so that** I never believe a batch succeeded when it did not.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E04-08, US-E04-09, US-E04-12 |
| Traces to | FR-FILE-038, FR-FILE-039, FR-FILE-040, FR-MOB-035, NFR-SCALE-003, NFR-A11Y-003, NFR-OBS-001, BR-038, BR-219 |

**Acceptance criteria**

1. **Given** a selection **when** a bulk move, copy, delete, restore or download is submitted **then**
   it goes to `POST /rooms/:roomId/nodes/batch` with one entry per item and one `Idempotency-Key` for
   the batch, and the response is `207` with a per-item result containing item id, name, outcome and,
   on failure, the machine-readable error code.
2. **Given** a batch with any failure **when** the result renders **then** the summary states the
   split ("34 moved, 6 could not be moved") and never the word "Success" alone; a results sheet lists
   each failed item with the human message from the error catalogue.
3. **Given** a results sheet **when** the principal activates Retry failed **then** only the failed
   items are retried, with the same idempotency semantics, and already-succeeded items are not
   touched.
4. **Given** a long-running batch **when** Cancel is activated **then** items already processed stay
   processed, the remainder is untouched, and the report states the split explicitly ("21 of 40
   moved, cancelled the rest").
5. **Given** a batch that exceeds the cap in BR-219 **when** it is submitted **then** the API returns
   `400` naming the cap, and the interface prevents submission with the count-bearing message from
   US-E04-08 criterion 3.
6. **Given** a batch in progress **when** the principal navigates elsewhere **then** progress
   continues and is reported in the same global tray used for uploads, with a distinct icon and label.
7. **Given** a batch **when** each item is executed **then** authorisation is evaluated per item
   server-side, so a mixed-permission selection yields per-item `403` results rather than a whole-batch
   refusal.
8. **Given** any completed batch **when** it finishes **then** one activity entry per item is written
   plus one summary entry for the batch, and an analytics event `bulk_operation_completed` carries
   operation, item count, failure count, duration and network class.

**Mobile acceptance criteria**

- Batch progress is announced through a polite live region at each 10 percent boundary and at
  completion, with the final announcement including the failure count.
- The results sheet is scrollable, virtualised, and each failed row is 64 CSS px tall with the reason
  wrapped to at most three lines at 360 CSS px.
- Cancel is a 48 x 48 CSS px target in the tray, commits on the up-event, and is never adjacent to
  Retry.
- On a flaky 4G connection a dropped response does not double-apply the batch: the client re-sends with
  the same `Idempotency-Key` and receives the original result.
- A 500-item batch on the reference device does not block the main thread for more than 50 ms at a
  time; the results list is rendered incrementally.
- The tray distinguishes uploads from batch operations so a user with both running can tell what is
  happening.

**Edge cases & negative paths**

- Every item fails: the summary reads "None of the 9 items could be moved" and lists the reasons; no
  toast claims partial success.
- Server restarts mid-batch: the client re-submits with the same key; items already applied are
  reported as already-applied, not re-applied.
- The destination is deleted mid-batch: remaining items fail with `404` and the report names the
  destination.
- Quota exhausted mid-batch copy: remaining items fail with `507`, already-copied items remain, and
  the report states the split plus how much space is needed.
- A batch delete crossing the second-confirmation threshold: the typed confirmation is required once
  for the batch, with the aggregate counts.

---

### US-E04-14 — Download one file, honestly

**As a** P3 Tomás Ferreira triaging in a client's reception **I want** to download a spreadsheet and
know where it went **so that** I can open it in the app I actually model in.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | none |
| Traces to | FR-FILE-019, FR-FILE-021, FR-FILE-022, FR-SHARE-011, FR-AUDIT-006, NFR-SEC-002, NFR-MOB-003, BR-041 |

**Acceptance criteria**

1. **Given** a principal whose `capabilities.canDownload` is true **when** Download is activated
   **then** `GET /rooms/:roomId/nodes/:nodeId/content` returns `302` to a short-lived signed URL and
   the platform download begins.
2. **Given** a principal whose grant has the download flag off **when** Download is requested **then**
   the API returns `403 DOWNLOAD_NOT_PERMITTED` with the message "The owner turned off downloads for
   this file."; the control is also absent from the interface, but the API refusal is the enforcement
   point and is covered by a security test.
3. **Given** a completed download on iOS **when** the confirmation is shown **then** the copy names
   the platform location without claiming knowledge of the path: "Saved to your Downloads folder. Open
   the Files app to find it." and no progress or completion state is invented.
4. **Given** any download **when** it is initiated **then** an activity entry of type `download` is
   written, distinct from `preview`, carrying actor, file, version and the share it came through.
5. **Given** a signed URL **when** it is issued **then** its lifetime is at most 60 seconds
   (Assumption, per NFR-SEC-002), it is bound to the requesting principal, and replaying it after a
   revocation fails because the signing key version was rotated on revoke.
6. **Given** the recent-downloads list **when** it renders **then** each entry is a re-fetchable
   server link with the file name and timestamp, and the list explicitly does not claim to track local
   files.
7. **Given** a file in `scanning` or `blocked` **when** Download is requested **then** it is refused
   with the scan state's message and no bytes are served.

**Mobile acceptance criteria**

- The download control is in the row overflow and in the viewer's action bar, both at least 48 x 48
  CSS px, and never the primary tap target of a row.
- No download progress bar is shown on platforms that do not report progress to the page; instead the
  interface confirms the hand-off once.
- On iOS the confirmation is a toast, not a modal, because the OS download manager already owns the
  user's attention.
- With a screen reader on, the confirmation is announced politely and names the destination folder in
  the same words the toast uses.
- QA verifies on a real iPhone that the file appears under Files → Downloads (or the user's configured
  destination) and that the product never claims a specific path.

**Edge cases & negative paths**

- Download tapped offline: refused with "You need a connection to download." and no partial file.
- Share revoked while the platform download is running: the in-flight transfer may complete because
  the signed URL is already redeemed; the audit log records it, and the revocation propagation target
  in BR-108 is stated so an owner is not misled. Recorded as a known limitation, not hidden.
- Very large file on cellular: a one-time confirmation states the size ("This file is 1.8 GB. Download
  on cellular?") with Continue and Cancel.
- Platform blocks the download (pop-up or download restriction): the interface offers a second,
  explicit "Try again" and names the browser setting to check.
- Corrupted stored blob (checksum mismatch on read): the download is refused with `500`, the owner is
  notified, and the file is flagged for support rather than silently serving bad bytes.

---

### US-E04-15 — Bulk download as a server-streamed zip

**As a** P3 Tomás Ferreira **I want** to take a whole folder away in one file **so that** I can do the
quality-of-earnings work offline at my desk.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E04-13, US-E04-14 |
| Traces to | FR-FILE-020, FR-FILE-021, FR-AUDIT-006, NFR-MOB-002, NFR-SCALE-003, BR-041 |

**Acceptance criteria**

1. **Given** a folder or a selection **when** Download as zip is activated **then**
   `POST /rooms/:roomId/downloads` returns `202` with a job id, and the archive is streamed by the
   server with `Content-Disposition: attachment` and no server-side buffering of the whole archive.
2. **Given** a selection containing items the principal may not download **when** the job is prepared
   **then** those items are excluded, the interface states "3 of 12 files cannot be downloaded and are
   not included" before the job starts, and the exclusion is recorded in the audit log.
3. **Given** an archive job **when** it exceeds the request cap **then** the API returns
   `413 REQUEST_TOO_LARGE` with the message "That is too much to download at once." and states the
   cap.
4. **Given** a large archive **when** it is generated **then** the client never assembles it: no
   client-side zip is used above the small-selection cap (Assumption: 25 MB total), because there is
   no save-file picker on iOS to stream into and buffering reintroduces the memory ceiling.
5. **Given** the zip **when** it is opened **then** it reproduces the folder hierarchy of the
   selection with names normalised to NFC and duplicate names disambiguated deterministically.
6. **Given** a job that fails mid-stream **when** the client detects the truncation **then** the
   interface states "That download did not finish. Try again." and no partial archive is presented as
   complete.
7. **Given** any archive download **when** it completes on the server **then** one activity entry per
   included file is written, so viewer analytics cannot be defeated by zipping.

**Mobile acceptance criteria**

- The action states the total size and file count before starting ("Download 47 files, about 812 MB?")
  and warns once on a metered connection.
- The job is tracked in the same global tray, and its state survives navigation; the tray never claims
  background progress on iOS.
- The confirmation copy names the Files app and the Downloads folder, exactly as US-E04-14.
- At 360 CSS px the exclusion notice wraps and lists the excluded file names in a sheet rather than
  truncating them.
- Job progress is announced politely at start and completion only, not continuously.

**Edge cases & negative paths**

- Zero downloadable items in the selection: the action is refused before the job starts with "None of
  these files can be downloaded."
- Share revoked while the job is streaming: the stream is terminated at the next chunk boundary and
  the interface states the link no longer works.
- Two identical file names in different folders: preserved because the hierarchy is preserved; two
  identical names in the same folder cannot exist by construction.
- Job queued and the user leaves: the archive link is delivered as a notification with a time-limited
  URL (E11), not held in memory.
- Zip bomb protection: archives created by the product are bounded by the request cap; uploaded
  archives are only expanded through the explicit path in US-E04-18 with a decompression ratio limit.

---

### US-E04-16 — Open in, share to another app, and receive from the OS share sheet

**As a** P6 Ray Okonkwo standing on a vacant lot **I want** to push a survey into the app the surveyor
uses, and pull a PDF a client just texted me straight into the room **so that** the phone is a two-way
document device.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E04-02, US-E04-14 |
| Traces to | FR-FILE-005, FR-FILE-006, FR-FILE-023, FR-MOB-042, NFR-COMPAT-001, NFR-MOB-003 |

**Acceptance criteria**

1. **Given** a browser exposing the Web Share API with files **when** Share to app is activated on a
   file **then** the OS share sheet opens with the file attached, and the action is absent on browsers
   that do not support file sharing rather than present and failing.
2. **Given** a download-disabled grant **when** Share to app is evaluated **then** the action is
   absent and the underlying content request is refused with `403 DOWNLOAD_NOT_PERMITTED`, because
   sharing a file to another app is an egress equivalent to download.
3. **Given** an installed Android web app **when** the manifest declares `share_target` **then**
   sharing a file from another application offers this product as a destination, and the flow asks for
   the target room and folder before enqueueing the upload.
4. **Given** a platform without `share_target` (iOS Safari, Firefox) **when** the Add sheet renders
   **then** no share-to-app-in affordance is shown, and the help text states plainly "On iPhone and
   iPad, add files with Choose files or Take photo. Sharing into apps from other apps is not available
   in the browser."
5. **Given** a share-target hand-off **when** the product receives the file **then** the room and
   folder chooser defaults to the most recently used folder, and the upload follows exactly the
   US-E04-01 transport including conflict handling.
6. **Given** any share-target upload **when** it commits **then** the activity entry records the
   source as `share_target` for the same instrumentation reason as camera capture.

**Mobile acceptance criteria**

- The capability matrix is asserted by a test that runs the feature-detection logic and fails if any
  affordance renders on a platform without support.
- The room-and-folder chooser after a share-target hand-off is one sheet with in-sheet drill-down and
  a "Save here" button in the thumb zone.
- The hand-off survives a cold start: if the browser starts the app fresh for the share, the pending
  file is persisted before any navigation so a freeze cannot lose it.
- The chooser's Save control remains visible with the on-screen keyboard open when the principal
  renames the incoming file.
- With a screen reader, the chooser announces the incoming file name and size first.

**Edge cases & negative paths**

- Multiple files shared at once on Android: all are enqueued into the chosen folder as one batch with
  a single conflict apply-to-all.
- Share target invoked while signed out: the file is held, authentication is requested, and the file
  is enqueued after sign-in; nothing is dropped silently.
- Share target invoked into a room the principal can only read: the chooser marks that room as
  unavailable with the reason, rather than failing after selection.
- The receiving app rejects the shared file: the OS reports it; the product adds no second error.
- A file type the workspace does not accept: refused at commit with `415 UNSUPPORTED_MEDIA_TYPE` and
  the accepted list.

---

### US-E04-17 — Scan multiple pages into a single PDF

**As a** P1 Marcy Doyle handed eleven pages of a lease in a franchise back office **I want** to
photograph them into one PDF in the right folder **so that** the buyer receives a document, not a
camera roll.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E04-03 |
| Traces to | FR-FILE-003, FR-FILE-002, FR-SRCH-024, NFR-MOB-002, NFR-PERF-006, BR-034 |

**Acceptance criteria**

1. **Given** the Add sheet **when** Scan document is activated **then** a capture loop opens that
   accepts page after page without returning to the folder screen between shots, showing a running
   page count.
2. **Given** captured pages **when** the review screen renders **then** each page can be retaken,
   rotated, reordered and deleted before commit, and the page count and estimated output size are
   shown.
3. **Given** a captured page **when** it is processed **then** edge detection and deskew are applied
   on-device where the platform allows, with a visible "Original" toggle so a failed auto-crop is
   recoverable.
4. **Given** Commit **when** it is activated **then** the pages are assembled into one PDF, uploaded
   through the standard resumable transport, and named by the capture rule with an editable field
   before the first chunk.
5. **Given** assembly **when** it runs on the reference device **then** peak heap stays under 64 MB
   for a 20-page scan by writing pages to a streaming assembler rather than holding all images in
   memory, and no single main-thread task exceeds 50 ms.
6. **Given** the app is backgrounded mid-scan **when** it returns **then** already-captured pages are
   restored from durable storage, because the capture set is persisted on every page and on
   `visibilitychange`.
7. **Given** a committed scan **when** OCR is available (R3, FR-SRCH-024) **then** the extracted text
   is attached to the file for content search; until then the product does not claim the scan is
   searchable.

**Mobile acceptance criteria**

- The shutter control is at least 64 CSS px, centred in the thumb zone, and the page thumbnail strip
  is above it so a gloved thumb does not cover the preview.
- The review screen's reorder uses explicit move-up and move-down controls in addition to any drag, so
  reordering is possible with a single pointer (SC 2.5.7).
- Capture-to-commit for eleven pages is achievable in under 90 seconds on a mid-range Android,
  measured by QA script.
- Discarding a scan requires a confirmation stating the page count ("Discard 11 captured pages?") with
  a 10-second undo.
- With a screen reader on, each captured page announces its index and total, and the commit control
  announces the page count.
- At 200 percent text size the review controls remain reachable without two-dimensional scrolling at
  320 CSS px.

**Edge cases & negative paths**

- Camera denied mid-scan: captured pages are preserved and the interface offers Commit what I have.
- Device runs out of storage during capture: the capture loop stops with "Your device is out of space.
  Commit these 6 pages or free space to continue."
- A single page fails to process: it is kept as the original image and the commit proceeds, with the
  page marked in the review strip.
- Output PDF exceeds the per-file ceiling: the interface offers to split at a page boundary rather
  than failing at commit.
- Interruption by a phone call at page nine: nothing is lost, per criterion 6.

---

### US-E04-18 — Desktop enhancements: drag-and-drop, folder upload and zip expansion

**As a** P4 Ashley Kim at her MacBook building a new mandate **I want** real drag-and-drop and folder
upload **so that** the desktop is a genuine step up in power rather than a differently shaped phone.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E04-02, US-E04-09, US-E04-10 |
| Traces to | FR-FILE-017, FR-FILE-018, FR-FILE-041, FR-FILE-042, FR-MOB-010, FR-MOB-039, NFR-COMPAT-001, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** a viewport with `(pointer: fine)` and hover **when** files are dragged from the operating
   system onto the file list **then** the drop zone is highlighted, the drop uploads into the current
   folder, and the same transport and conflict rules apply.
2. **Given** the same environment **when** a row is dragged onto a folder row **then** the items move,
   with the identical server call, toast and undo as the destination picker path.
3. **Given** any drag-based capability **when** the accessibility audit runs **then** a non-dragging
   single-pointer equivalent exists and is documented for each: Move to… for moves, the picker for
   uploads, move-up and move-down for ordering, preset ratios for split dividers.
4. **Given** a browser supporting directory selection (`webkitdirectory`: iOS Safari 18.4+, Chrome
   Android 132+, desktop Chromium and Safari) **when** Upload folder is used **then** the hierarchy is
   reconstructed server-side from `webkitRelativePath`, creating folders as needed within the depth and
   path-length limits.
5. **Given** a browser without directory selection **when** the Add sheet renders **then** Upload
   folder is absent and the alternative is stated: multi-file selection into this folder, or upload a
   zip which the server expands.
6. **Given** a zip upload **when** the server expands it **then** entries are validated for path
   traversal, absolute paths, symlinks, depth, path length and a decompression ratio cap, and any
   rejected entry is reported per item with its reason while valid entries are still created.
7. **Given** a hardware keyboard at any width **when** the shortcut sheet is opened **then** it lists
   navigate, select, select range, rename, move, delete, search, new folder, upload and toggle view,
   and each shortcut works, including on a phone with a keyboard attached.

**Mobile acceptance criteria**

- No drag-and-drop affordance, drop-zone hint or "drag files here" copy renders at compact width or on
  a touch-only pointer; asserted by an automated test on the mobile emulation profile.
- Upload folder is feature-detected rather than user-agent sniffed, and on iOS Safari 18.4+ where it
  works, it works from the phone too.
- A zip expansion of 500 entries reports progress in the global tray and per-item results in the same
  sheet used by US-E04-13.
- Keyboard shortcuts do not fire while a soft keyboard is composing text in a rename field.
- At medium width and above, the bottom action bar promotes to a rail plus a horizontal toolbar without
  changing any server call.

**Edge cases & negative paths**

- Dragging a folder from the OS into a browser without directory support: the drop is refused with
  "Your browser cannot upload a folder. Try a zip file or select the files." rather than silently
  uploading nothing.
- A zip containing `../` entries: rejected per entry with "That archive contains unsafe file paths."
  and a security event is recorded.
- An encrypted zip: rejected with "We cannot open a password-protected archive."
- A zip whose expansion would breach quota: the expansion stops, already-created files remain, and the
  report states the split plus the shortfall.
- Drag started on a hybrid device with a touch screen and a mouse: the fine-pointer path is used only
  for the pointer that initiated the drag.

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| Folder create, rename, move and the cascade-delete warning content for folders as a navigation concern | [E03](./epic-03-folder-hierarchy-and-navigation.md) (E04 consumes the counts and honours the warning) |
| Naming rules, Unicode normalisation, the deterministic duplicate-suffix algorithm, ETag concurrency, the offline mutation queue, file version history and restore | [E08](./epic-08-conflict-resolution-and-data-integrity.md) |
| Thumbnails, preview, the details sheet and the viewer | [E05](./epic-05-viewing-preview-and-file-details.md) |
| Sharing a file, link controls, watermarking and revocation semantics | [E07](./epic-07-sharing-and-access-control.md) |
| Quota thresholds, the administrator-set ceilings, and the behaviour at the limit | [E12](./epic-12-account-storage-and-governance.md) (E04 honours them and never loses data) |
| Activity log presentation, viewer analytics, download reporting and notifications | [E11](./epic-11-trust-audit-and-notifications.md) |
| Sheets, action bars, toasts, haptics, safe area, live regions, breakpoints and theming | [E09](./epic-09-mobile-ux-foundations.md) |
| Virtualisation, cursor pagination, prefetch, offline read cache and performance telemetry | [E10](./epic-10-performance-offline-and-scale.md) |
| Editing document contents in the product (text editor, annotation, redaction) | Not in R1 to R3. FR-FILE-044 is a Could at R3; annotation and redaction are unscheduled. |
| Cross-room move and copy | Not in R1 to R3. Recorded as OQ33. |
| Camera-roll sync or background library ingest | Not expressible on the web platform and deliberately not offered. |

## Open questions

Open-question IDs in this file come from the block reserved for E04 (OQ31 to OQ40), so that epics
authored in parallel cannot collide.

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ31 | The NFR identifiers cited in this file (for example NFR-AVAIL-001 resumability, NFR-SCALE-003 batch size) must be reconciled against [07-non-functional-requirements.md](../07-non-functional-requirements.md) once it lands; the categories are normative, the numbers are provisional. | Product + Engineering | Before R1 sprint 1 |
| OQ32 | Is the orphaned-part TTL 24 hours (current Assumption in BR-035) or shorter? Shorter reduces storage waste but breaks a genuine multi-day resume for a field user on intermittent signal. | Engineering + Product | Before R1 code freeze |
| OQ33 | Do we ever allow move or copy across rooms? It is the most requested convenience and the most dangerous action in the product, because it moves confidential material between counterparties. Currently refused server-side. | Product + design partners | R2 planning |
| OQ34 | Is 500 the right per-operation bulk cap (BR-219)? P4's real batches are 40 to 200 files, but a zip expansion can be far larger. | Engineering | Before R1 code freeze |
| OQ35 | Do we compress captured photographs by default on cellular, and at what threshold? Compressing by default is faster and cheaper; a broker photographing a tax return may need full fidelity for a lender. | Product + design partners | Before R2 launch |
| OQ36 | Who is notified when a malware detection blocks an upload: the uploader only, or the room owner as well? Current answer is both, which tells the owner that a guest uploaded something malicious. | Product + Security | Before R1 launch |
| OQ37 | Should a copy inherit the source item's direct share grants? Current answer is no, which is safe but surprises users who duplicate a shared file expecting the share to follow. | Product + Legal | Before R2 launch |
| OQ38 | Is a 60-second signed-URL lifetime workable for a very large download on a slow link, given that a redeemed URL can outlive a revocation? Alternative is a streaming proxy with per-chunk authorisation, at a bandwidth cost. | Engineering + Security | Before R1 launch |
