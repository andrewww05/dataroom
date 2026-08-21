# Epic E08 — Conflict Resolution & Data Integrity

## Purpose

This epic guarantees that no document is lost, silently overwritten or spuriously duplicated,
including when the phone that was uploading it was frozen, discarded, backgrounded or offline. The
brief lists duplicate-name conflict resolution as a derivative requirement; mobile turns it into a
much larger problem, because an interrupted upload is retried and a retry that is not idempotent
manufactures a `Lease (2).pdf` that nobody asked for. E08 owns the naming rules, the conflict
sheet, the concurrency token, the trash, versioning and the offline mutation queue, and it owns
them in exactly one place so that create, upload, copy, move and rename cannot disagree.

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
  [E03 Folder Hierarchy & Navigation](./epic-03-folder-hierarchy-and-navigation.md),
  [E04 File Operations](./epic-04-file-operations.md),
  [E05 Viewing, Preview & File Details](./epic-05-viewing-preview-and-file-details.md),
  [E07 Sharing & Access Control](./epic-07-sharing-and-access-control.md),
  [E09 Mobile UX Foundations](./epic-09-mobile-ux-foundations.md),
  [E10 Performance, Offline & Scale](./epic-10-performance-offline-and-scale.md),
  [E11 Trust, Audit & Notifications](./epic-11-trust-audit-and-notifications.md)

## Epic summary

| Field | Value |
| --- | --- |
| Epic ID | E08 |
| Goal | Make every naming, collision, concurrency and deletion rule deterministic, server-enforced and identically implemented on the client, so that a mobile client which is interrupted at any point produces exactly one correct outcome and the user is always told which outcome it was. |
| Primary personas | P4 Ashley Kim (transaction coordinator, builds and repairs the rooms, the persona whose highest-stakes interaction is a cascade delete), P1 Marcy Doyle (solo broker who photographs documents into folders between appointments), P6 Ray Okonkwo (uploads a 40 MB survey from a basement on one bar of LTE), P3 Tomás Ferreira (reads a lease that must not silently change under him) |
| Release span | R1 (stories 01 to 15), R2 (stories 16 to 18) |
| Story count | 18 |
| Total points | 92 |
| Depends on | E03 (nodes, parents, the tree), E04 (the operations that produce conflicts), E09 (sheet system, destructive confirmation pattern, toast plus undo, status announcer) |
| Blocks | E04 (upload, copy, move and delete cannot be signed off without these rules), E03 (create and rename), E10 (the offline read cache and background sync consume the mutation queue), E12 (trash bytes count against quota) |

## Mobile-first design stance

- **Conflict resolution happens in the same sheet as the action that caused it.** It is never a toast,
  never a background decision, never a dialog stacked on an open sheet. The prompt has exactly three
  outcomes: Keep both, Replace, Cancel. That is three buttons including Cancel, which fits inside the
  four-button platform cap for an action sheet and means the sheet never scrolls; a fourth option
  would break the platform shape, which is a useful constraint to keep rather than an accident.
- **Silent resolution is a defect, in both directions.** A silent auto-rename produces
  `Lease (2).pdf` that nobody asked for; a silent overwrite destroys a version a buyer is already
  relying on. P4's words are the acceptance criterion: "I never silently overwrite a version of a
  lease that a buyer is already relying on."
- **Batch conflicts are resolved once, with a per-item review.** Answering eighteen modal questions
  with a thumb on LTE is not a product. The conflict sheet offers "Apply to all remaining", scoped to
  that operation and to conflicts of that same kind, and the result screen lists every item and what
  happened to it.
- **Backgrounding is assumed to be fatal, so durability comes before optimism.** A frozen page cannot
  run timers or fetch callbacks, a discarded page cannot run code at all, and `unload` does not fire
  when a tab is closed from the mobile tab switcher. The resume offset is therefore committed to
  durable local storage *before* each chunk is sent, and the last reliable save point is the
  transition to hidden.
- **Idempotency is the mobile-specific requirement, not a nicety.** Every mutating request carries a
  client-generated key; the server returns the original result for a repeated key without repeating
  the effect. Upload commit additionally deduplicates on (folder, canonical name, content hash), so
  `UPLOAD_ALREADY_COMMITTED` is treated as success rather than as an error, which is precisely why a
  retry after a page freeze does not create a second file.
- **The desktop primitive here is a two-pane diff and a spreadsheet-style conflict list, and neither
  survives 320 CSS px.** The touch-first replacement is a single-column comparison card ("Yours:
  renamed to Lease v2 · Theirs: renamed to Lease final by Ashley Kim, 2 minutes ago") with two
  buttons. The conflict list view and keyboard resolution return as desktop enhancements at expanded
  width.
- **Delete is soft, warned with real counts, and undoable.** Mis-taps are the norm on touch, not the
  exception, and the competitor research records an incumbent where folder moves happen with no
  confirmation at all. Every destructive path in this epic states the exact counts, keeps a trash
  entry with a stated retention window, and offers a time-boxed undo that does not require finding
  the trash screen.
- **Rename protects the extension.** Only the basename is preselected, extensions are hidden by
  default per the platform file-management convention, and the rename field cannot silently destroy an
  extension. The remaining character allowance is shown live, because a 255-byte limit hit at the
  moment of Save on a phone is a lost edit.

---

## User stories

### US-E08-01 — The canonical name: normalisation, case folding and the collision key

**As a** platform engineer building for P4 Ashley Kim **I want** one canonical form of every item name,
computed identically on the client and the server **so that** two names that look the same to a human
can never both exist in one folder and the client can predict the server's answer before sending.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | none |
| Traces to | FR-CONF-009, FR-CONF-011, FR-CONF-013, NFR-I18N-001, NFR-MAINT-001, BR-140, BR-141, BR-142, BR-143 |

**Acceptance criteria**

1. **Given** a submitted name **when** it is processed **then** the canonical display form is produced
   by: Unicode NFC normalisation, then removal of leading and trailing whitespace (including
   U+00A0, U+2000 to U+200A, U+3000), then removal of trailing full stops, and this display form is
   what is stored and returned.
2. **Given** the display form **when** the collision key is computed **then** it is the display form
   after Unicode default case folding (not ASCII `toLowerCase`), and the uniqueness constraint in the
   database is on `(parentId, nameKey)`, so `Lease.pdf`, `lease.pdf` and `LEASE.PDF` collide.
3. **Given** both a client and a server implementation **when** the same 200-case fixture table is run
   **then** both produce byte-identical display forms and collision keys; the fixture is checked in
   under `packages/shared` and is executed by both the Jest and the Vitest suites.
4. **Given** names in non-Latin scripts **when** they are processed **then** the fixture covers at
   minimum: Turkish dotted and dotless i (`İstanbul` / `istanbul`), German sharp s (`Straße` /
   `STRASSE` — which must NOT collide, because case folding is not transliteration), Greek final sigma,
   Cyrillic look-alikes (`А` U+0410 versus `A` U+0041 — which must NOT collide), Arabic and Hebrew
   right-to-left names, Japanese full-width versus half-width forms, and decomposed versus composed
   accented Latin (`é` as U+00E9 versus U+0065 U+0301 — which MUST collide).
5. **Given** a name whose canonicalisation changes it **when** the create or rename sheet is open
   **then** the field shows the canonical result before commit (for example the trailing space is
   visibly removed as the user types past it), so no user is surprised by a name they did not type.
6. **Given** a canonicalisation that produces an empty string **then** the submission is rejected with
   400 `VALIDATION_FAILED` and the message "Enter a name", and no item is created.
7. **Given** an existing item created before a normalisation rule change **when** a migration runs
   **then** the migration reports collisions it would create rather than resolving them, and each is
   resolved by applying the deterministic suffix rule with an activity-log entry, never by deletion.
8. **Given** the collision key **then** it is never displayed to a user and never used in a URL; item
   addressing is by opaque id, so a rename never breaks a link.

**Mobile acceptance criteria**

- The create and rename fields set `autocapitalize="off"` for file names and `autocapitalize="words"`
  for folder names, `spellcheck="false"`, and `enterkeyhint="done"`, so the software keyboard does not
  fight the user.
- Right-to-left names render with correct bidirectional isolation in list rows, breadcrumbs and
  sheets; a QA test with an Arabic file name inside an English folder name confirms the path reads
  correctly at 360 px and does not reorder the separators.
- The live canonical preview updates within one animation frame of each keystroke on the reference
  device, and no keystroke handler exceeds 50 ms of main-thread work.
- With a screen reader on, a canonicalisation that alters the typed text is announced politely once
  ("Trailing space removed") rather than on every keystroke.

**Edge cases & negative paths**

- Name consisting only of combining marks: rejected with "Enter a name we can display."
- Name containing a zero-width joiner used legitimately (emoji sequences, Indic scripts): preserved,
  not stripped; only whitespace and trailing dots are removed.
- Bidirectional override characters (U+202A to U+202E, U+2066 to U+2069): rejected as forbidden per
  US-E08-02, because they enable file-name spoofing (`annexpdf.exe` rendered as `annexexe.pdf`).
- Two clients race to create the same canonical name: the database constraint makes one of them fail
  with 409 `NAME_CONFLICT` and the conflict sheet opens for the loser; the constraint, not the
  application check, is the guarantee.

---

### US-E08-02 — Forbidden characters, reserved names and trailing forms

**As a** P4 Ashley Kim filing documents a seller sent by text message **I want** the product to reject
names it cannot store, and say exactly which character is the problem **so that** I fix it in one edit
instead of guessing.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E08-01 |
| Traces to | FR-CONF-010, FR-CONF-013, FR-CONF-014, NFR-SEC-003, NFR-I18N-001, BR-137, BR-144 |

**Acceptance criteria**

1. **Given** a name containing any of `/ \ : * ? " < > |`, any C0 control character (U+0000 to
   U+001F), U+007F, any C1 control character, U+2028, U+2029, or any bidirectional override or
   isolate character (U+202A to U+202E, U+2066 to U+2069) **when** it is submitted **then** the API
   returns 400 `INVALID_NODE_NAME` and the error names the specific offending characters.
2. **Given** a reserved name **when** it is submitted **then** it is rejected case-insensitively, with
   or without an extension: `.`, `..`, `CON`, `PRN`, `AUX`, `NUL`, `COM1` to `COM9`, `LPT1` to `LPT9`.
   The message is "That name is reserved by some operating systems. Try another."
3. **Given** a name that is only whitespace, or begins with a full stop and has no other characters
   **then** it is rejected; a name that legitimately begins with a full stop and has more characters
   (`.env-example`) is allowed, because the product is not a filesystem and hiding is not a concept
   here.
4. **Given** a name whose canonical form ends in a full stop or whitespace **then** those characters
   are stripped rather than rejected, and the stripped result is shown before commit.
5. **Given** any rejection from this story **then** the sheet stays open, the typed text is preserved,
   the offending characters are selected in the field where the platform supports selection, and focus
   remains in the field.
6. **Given** an upload whose original file name violates any rule **then** the client proposes a
   sanitised name (offending characters replaced with `-`, reserved names suffixed with `-file`) in the
   conflict sheet with the original shown as read-only, and the upload does not start until the user
   accepts or edits it.
7. **Given** the server **then** it validates independently of the client: a direct API call with a
   forbidden name is rejected with the same code, and a contract test asserts client and server reject
   the same fixture set.

**Mobile acceptance criteria**

- Rejection is inline in the sheet, never a separate dialog, and the error text sits directly under
  the field so it is visible with the software keyboard open at 360 x 640.
- The error names at most three offending characters and then says "and 2 more", so the message stays
  within two lines at 200 percent text size.
- The sanitised-name proposal for an upload appears once per batch with "Apply to all remaining"
  available, because a seller's 40 texted photos frequently share the same bad naming pattern.
- Screen reader announces the error assertively (it blocks the task) with the field's label included,
  and focus is not moved away from the field.

**Edge cases & negative paths**

- Paste of a full path (`C:\Users\me\Lease.pdf`) into the rename field: the backslashes are rejected
  and the sheet offers "Use just the file name: Lease.pdf" as a one-tap fix.
- Name containing an emoji or an astral-plane character: allowed, and counted correctly against the
  length limit in US-E08-03 (bytes, not code units).
- Name that becomes reserved after stripping (`CON.` becomes `CON`): rejected after stripping, with
  the reserved-name message.
- A locale where the offending character is on the primary keyboard (for example `:` in a time-stamped
  name): the error suggests a replacement (`10-30` instead of `10:30`) rather than only stating the
  rule.

---

### US-E08-03 — Name length and total path length limits

**As a** P4 Ashley Kim building a deep folder skeleton **I want** to be warned about a length limit while
I am typing, not when I press Save **so that** I never lose an edit on a phone.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E08-01 |
| Traces to | FR-CONF-012, FR-FLDR-005, NFR-A11Y-004, NFR-I18N-001, BR-158, BR-159, BR-160 |

**Acceptance criteria**

1. **Given** a name **when** it is validated **then** the limit is 255 UTF-8 bytes for the canonical
   display form, and the error names the limit in characters remaining rather than bytes for names in
   the Latin script and in "characters" generally, while the enforcement is on bytes.
2. **Given** a create, rename, move or copy **when** the resulting full path (the concatenation of
   ancestor names and separators from the room root) would exceed 1024 UTF-8 bytes **then** the
   operation is rejected with 400 `PATH_LENGTH_EXCEEDED`, the error states the resulting length and
   the limit, and the sheet shows the current path length against 1024.
3. **Given** a folder create or move **when** the resulting depth would exceed 32 **then** the
   operation is rejected with 400 `FOLDER_DEPTH_EXCEEDED` and the message "Folders can go 32 levels
   deep. This one is already at the limit.", with an offer to create alongside at the parent level
   instead.
4. **Given** a rename field **when** the user types **then** a live counter appears once the name
   passes 80 percent of the limit, showing characters remaining, and typing past the limit is
   prevented by the field rather than accepted and then rejected.
5. **Given** a keep-both suffix would push a name past 255 bytes **then** the basename is truncated
   from its end (never the extension) by whole grapheme clusters until the suffixed name fits, and the
   resulting name is shown in the conflict sheet before commit.
6. **Given** a move of a subtree **when** any descendant would exceed the path limit **then** the whole
   move is refused before any change is made, and the error lists up to five offending paths with a
   count of the rest, so the operation is never applied partly.
7. **Given** a copy of a subtree **when** some descendants would exceed the limit **then** the copy is
   refused per item with a result list, consistent with the batch semantics in E04, and the successful
   items are reported explicitly.

**Mobile acceptance criteria**

- The character counter is at least 12 CSS px and sits inside the field's trailing edge, not in a
  tooltip, because tooltips require hover.
- The path-length message shows the path as a middle-truncated single line at 360 px
  (`Acme HVAC / … / Environmental / Phase II`) and the full path is available in the sheet's details
  disclosure without leaving the sheet.
- Typing prevention does not fight predictive text: if the platform inserts a word that exceeds the
  limit, the excess is trimmed and announced politely once rather than silently discarded.
- At 200 percent text size the counter and the error text stack rather than overlap, and Save remains
  visible above the keyboard.

**Edge cases & negative paths**

- CJK or emoji names where 255 bytes is far fewer than 255 characters: the counter counts down in
  characters but reflects the byte cost, and QA verifies a Japanese name of 85 characters is rejected
  with a message that does not claim 255 characters are available.
- Room renamed to a much longer name, pushing existing descendants over the path limit: the room
  rename is refused with the offending count, because retroactively invalidating stored paths is worse
  than refusing the rename.
- Path limit hit during a template instantiation: the template is refused at validation time with the
  offending folder named, before any folder is created.

---

### US-E08-04 — The deterministic keep-both suffix

**As a** P4 Ashley Kim keeping both copies of a lease **I want** the second copy's name to be predictable
and to preserve the extension **so that** I can find it later and the buyer's viewer still opens it.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E08-01, US-E08-03 |
| Traces to | FR-CONF-007, NFR-MAINT-001, NFR-I18N-001, BR-146 |

**Acceptance criteria**

1. **Given** a collision on the canonical name `Lease.pdf` **when** Keep both is chosen **then** the
   new name is `Lease (2).pdf`: the suffix is a space, an opening parenthesis, the smallest integer
   >= 2 not already taken by the collision-key set in that folder, a closing parenthesis, inserted
   before the final extension.
2. **Given** a name with no extension **then** the suffix is appended at the end (`Financials` becomes
   `Financials (2)`).
3. **Given** a name with multiple dots (`report.2026.final.pdf`) **then** only the final extension is
   preserved (`report.2026.final (2).pdf`), and the extension is defined as the substring after the
   last full stop when that substring is 1 to 10 characters and contains no whitespace.
4. **Given** a name that already ends in a suffix of this shape (`Lease (2).pdf`) **then** the next
   name is `Lease (3).pdf`, not `Lease (2) (2).pdf`, and the integer search continues from the
   existing highest value plus one while still choosing the smallest unused value.
5. **Given** the same inputs (folder collision-key set, proposed name) **when** the algorithm runs on
   the client and on the server **then** both produce the identical result, verified by a shared
   fixture table of at least 40 cases including gaps in the sequence (2 and 4 taken, so 3 is chosen).
6. **Given** the suffixed name is shown in the conflict sheet **then** it is the exact name that will
   be created, not a placeholder, so what the user reads is what appears in the folder.
7. **Given** a folder already containing 999 suffixed variants **then** the operation is refused with
   400 and the message "There are too many copies of this name here. Rename it instead."

**Mobile acceptance criteria**

- The suggested name is rendered on its own line in the conflict sheet, at body text size, with
  middle truncation only if it exceeds the sheet width at 360 px; the extension is always visible.
- The Keep both button's accessible name contains the resulting name, so a voice-control user can say
  "tap Keep both" and a screen-reader user hears what will be created.
- The suffix computation runs on the client without a network round trip, so the sheet shows the
  suggested name immediately even on a 3G connection.

**Edge cases & negative paths**

- Extension longer than 10 characters (`archive.verylongextension`): treated as having no extension,
  so the suffix goes at the end; documented so QA does not file it as a bug.
- Concurrent Keep both from two devices: both compute `(2)`; the database constraint makes one fail,
  the loser recomputes and gets `(3)` automatically without re-prompting the user, and the result
  screen states the actual name.
- Case-only difference (`lease.pdf` colliding with `Lease.pdf`): Keep both produces `lease (2).pdf`,
  preserving the user's typed casing in the display form while the collision key remains folded.
- Name in a right-to-left script: the suffix is inserted with bidirectional isolation so the rendered
  name reads correctly and the stored bytes remain unambiguous.

---

### US-E08-05 — The conflict sheet: three choices, never silent

**As a** P1 Marcy Doyle uploading a second copy of a lease **I want** to be told there is already
something with that name and be given three clear choices **so that** I never overwrite a document a
buyer is relying on.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E08-04, US-E09-06 |
| Traces to | FR-CONF-006, FR-CONF-008, NFR-A11Y-004, NFR-MOB-001, BR-150 |

**Acceptance criteria**

1. **Given** any detected collision **when** the sheet opens **then** it contains the colliding name,
   a one-line description of the existing item (type, size, modified date, modified by), and exactly
   three controls: "Keep both" (showing the resulting name), "Replace" (stating the consequence), and
   "Cancel this item".
2. **Given** the sheet **then** no fourth committing option is offered, the sheet does not scroll at
   360 x 640, and no choice is preselected as a default that could be triggered by an accidental tap.
3. **Given** "Replace" in R1 **then** the copy states exactly what happens: "The current file moves to
   Trash and can be restored for 30 days." In R2, once versioning ships (US-E08-16), the copy changes
   to "The current file becomes version 2 and stays in the version history."
4. **Given** a multi-item operation with more than one conflict **then** the sheet shows "Conflict 1 of
   7" and offers "Apply to all remaining", which applies only to conflicts of the same kind within the
   same operation and is never remembered across operations.
5. **Given** "Apply to all remaining" is chosen **then** a result screen lists every affected item and
   the outcome for each ("Kept both as Lease (2).pdf", "Replaced", "Cancelled"), and that list is
   available from the toast for at least 60 seconds.
6. **Given** "Cancel this item" in a batch **then** the remaining items continue, the cancelled item is
   reported in the result list, and the operation as a whole is not aborted.
7. **Given** any resolution **then** an `ActivityEvent` `conflict.resolved` records the operation kind,
   the choice, the resulting name and whether "Apply to all" was used, so the conflict-abandonment
   metric M17 can be computed.
8. **Given** the sheet is dismissed by swipe-down or system back **then** it is treated as "Cancel this
   item", the item is not created and nothing is overwritten, and the toast states "Nothing was
   changed."

**Mobile acceptance criteria**

- Every control is >= 48 CSS px tall with >= 8 CSS px separation; "Replace" is styled as destructive
  and is positioned so it is not the control nearest the thumb's resting position after the sheet
  opens.
- The sheet is a popable history entry, so the Android system back and the iOS in-app Back both close
  it, and dismissing it returns to the operation's origin screen with scroll position intact.
- Only one sheet is ever open: if the conflict arises while the upload tray sheet is open, the tray
  sheet closes first and the conflict sheet takes its place, and dismissing the conflict sheet returns
  to the underlying screen, never to the tray sheet.
- On a flaky 4G connection, the sheet's data (existing item's size and modified-by) is optional: if it
  has not arrived within 500 ms the sheet renders with the name and the three choices and fills the
  detail line in place without shifting the buttons.
- If the app is backgrounded with the conflict sheet open, the pending conflict is persisted on
  `visibilitychange` to hidden and re-presented on next open with a "You have 1 unresolved conflict"
  row in the upload tray; nothing is resolved by default.
- Screen reader announces the sheet's heading on open, reads the existing item's description, and each
  button's accessible name contains its full consequence ("Replace, the current file moves to Trash").

**Edge cases & negative paths**

- Collision resolved by another user before the choice is made: the chosen action is re-validated; if
  the collision has gone, Keep both silently becomes a plain create with the original name and the
  result screen says "The name was free by the time we saved it."
- Existing item is a folder and the incoming item is a file with the same name: Replace is not offered
  (a folder cannot become a file); the sheet shows only Keep both and Cancel with an explanatory line.
- 40 conflicts in one batch: the sheet appears once, "Apply to all remaining" is offered immediately
  rather than after the first, and the result list is paginated.
- User has no permission to replace (Contributor without manager rights on the existing item): Replace
  is hidden, not dimmed, and the line reads "You can add a copy, but you cannot replace this file."

---

### US-E08-06 — Collision on folder create and on rename

**As a** P4 Ashley Kim building a folder skeleton **I want** create and rename to refuse a colliding name
with a usable next step **so that** two folders that look identical never coexist in one parent.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E08-05 |
| Traces to | FR-CONF-001, FR-CONF-005, FR-FLDR-002, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** a folder create whose canonical name collides with an existing sibling (folder or file)
   **when** it is submitted **then** the API returns 409 `NAME_CONFLICT` with a `ConflictDetail` naming
   the existing item, and the conflict sheet opens with Keep both and Cancel; Replace is not offered
   for a folder create.
2. **Given** a rename whose canonical name collides **when** it is submitted **then** the rename is
   refused with 409 and the sheet offers Keep both (renaming to the suffixed form) and Cancel; a rename
   never replaces another item.
3. **Given** a rename to the same canonical name with different casing (`lease.pdf` to `Lease.pdf`)
   **then** it is allowed and treated as a display-form change on the same item, not a collision, and
   the activity log records it as a rename.
4. **Given** a rename sheet **when** it opens for a file **then** only the basename is preselected, the
   extension is displayed but outside the selection, and if the user deletes the extension entirely the
   sheet warns "Without .pdf, some apps may not open this file" and still allows it.
5. **Given** the client already holds the folder's collision-key set for the current page **then** it
   detects the collision before sending and shows the sheet immediately; when the set is incomplete
   (paged folder), the server's 409 is the authority and the sheet opens on the response.
6. **Given** a collision is detected client-side **then** the client still sends the request when the
   user chooses Keep both, so the server remains the single point of truth and a stale client cannot
   create a duplicate.

**Mobile acceptance criteria**

- The rename field is pre-focused with the software keyboard raised, and the field plus the Save button
  are both visible at 360 x 640 with a 300 px keyboard (SC 2.4.11).
- The basename selection is verified on a physical device on both platforms, because selection ranges
  behave differently in iOS Safari and Chrome for Android; the QA step is explicit.
- Save is disabled while the field is empty or unchanged, and its disabled state is conveyed by
  `aria-disabled` plus a visible style, never by colour alone.
- Round trip on a 100 ms RTT connection: the sheet closes optimistically, the row updates immediately,
  and on a 409 the row reverts and the conflict sheet opens within 400 ms of the response.

**Edge cases & negative paths**

- Folder create where the existing sibling is in trash: no collision, because trashed items do not
  occupy their name; if the trashed item is later restored, the restore path in US-E08-14 resolves the
  conflict.
- Rename of an item that another user just deleted: 404 `NOT_FOUND`, copy "We could not find that. It
  may have been moved or deleted.", and the listing refreshes to the nearest surviving ancestor.
- Rename that trips both a collision and a length limit: the length error is shown first, because the
  user cannot act on the collision until the name is valid.
- Two users rename two different items to the same name simultaneously: the database constraint makes
  one fail; the loser's conflict sheet names the winner's item and its new modified-by.

---

### US-E08-07 — Collision on upload, resolved before the item becomes visible

**As a** P1 Marcy Doyle photographing a P&L in a car park **I want** a name collision handled before the
file appears in the folder **so that** a buyer never sees a half-decided duplicate.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E08-05, US-E04-04 |
| Traces to | FR-CONF-002, FR-CONF-006, FR-FILE-015, NFR-MOB-005, NFR-AVAIL-001, BR-152 |

**Acceptance criteria**

1. **Given** an upload whose target name collides **when** the client creates the upload session
   **then** the API reports the collision at session creation where it can (`POST /rooms/:id/uploads`
   returns the conflict detail alongside the session), so the user resolves it before bytes are spent
   on a metered connection.
2. **Given** the collision was not detectable at session creation (the colliding item was created
   during the upload) **when** `POST /uploads/:uploadId/commit` runs **then** commit returns 409
   `NAME_CONFLICT` with a `ConflictDetail`, the uploaded bytes are retained for the session's TTL, and
   resolving the conflict commits without re-uploading a single byte.
3. **Given** the user chooses Keep both at commit **then** the node is created with the suffixed name
   and the already-uploaded bytes; given Replace, the existing node's content is replaced per the R1
   or R2 semantics in US-E08-05 criterion 3; given Cancel, the upload session is aborted and its parts
   are deleted server-side.
4. **Given** a multi-file upload with several collisions **then** the tray shows each conflicting item
   as "Needs your decision" rather than as a failure, uploading of the non-conflicting files continues
   in parallel, and the conflict sheet is presented once with "Apply to all remaining".
5. **Given** an unresolved upload conflict **when** the user leaves the screen **then** the item stays
   in the upload tray in state `needs_decision` with a badge count, and the folder listing does not
   show the item at all until it is resolved.
6. **Given** an upload session expires while a conflict is unresolved **then** the tray entry becomes
   "This upload timed out. Tap to start it again.", the parts are cleaned up by the server's orphan
   sweeper, and no partial item exists in the folder.
7. **Given** a retried commit after a page freeze **then** the same `Idempotency-Key` and the same
   `(folderId, nameKey, contentHash)` produce `UPLOAD_ALREADY_COMMITTED`, the client treats it as
   success, and no second item is created.

**Mobile acceptance criteria**

- The conflict is surfaced within the upload tray sheet as a row with a >= 48 CSS px "Decide" control,
  and tapping it opens the conflict sheet after closing the tray sheet, never on top of it.
- On a metered connection the collision check at session creation costs one request of <= 2 KB, and the
  client does not begin transferring bytes until the decision is made when the collision is known up
  front.
- Backgrounding with an unresolved conflict: the decision state and the resume offset are both
  persisted before the app is hidden, and reopening shows "1 upload needs your decision" as a
  persistent tray badge, not a toast.
- With the device offline, the conflict sheet still opens using the cached folder collision-key set,
  the decision is queued, and the tray states "Waiting for a connection to finish this upload."
- Screen reader announces the tray badge count on change ("1 upload needs your decision") politely,
  once.

**Edge cases & negative paths**

- Same file uploaded twice from two devices simultaneously: content-hash deduplication means the second
  commit resolves to the same node and reports "Already uploaded" rather than creating a duplicate.
- Camera capture producing `IMG_0001.jpg` for the fortieth time: the collision sheet appears once with
  "Apply to all remaining", and the suggested names are `IMG_0001 (2).jpg` and upward.
- Quota exceeded during the upload: 507 `STORAGE_QUOTA_EXCEEDED` takes precedence over the conflict,
  the tray entry becomes blocked rather than discarded, and the copy states "Nothing was lost."
- Malware scan fails after commit: the item is removed, the uploader is notified, and no conflict
  resolution is left dangling.

---

### US-E08-08 — Collision on copy and move, including batches

**As a** P4 Ashley Kim fixing a misfiled batch from a train **I want** copy and move to tell me about
collisions and let me resolve them once **so that** I can repair room hygiene with a thumb.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E08-05, US-E08-12 |
| Traces to | FR-CONF-003, FR-CONF-004, FR-CONF-008, FR-FILE-038, NFR-A11Y-004, BR-150 |

**Acceptance criteria**

1. **Given** a move into a destination that already holds an item with the same canonical name **when**
   the move is submitted **then** it is refused with 409 `NAME_CONFLICT` before anything is moved, and
   the conflict sheet offers Keep both, Replace and Cancel this item.
2. **Given** a copy or duplicate-in-place **when** the source name is already present **then** the
   default proposal is the suffixed name and the sheet is still shown, because duplicate-in-place is
   the one case where Keep both is obviously intended and must still be visible rather than silent.
3. **Given** a batch move or copy of 30 items with 7 collisions **when** the batch runs **then**
   `POST /rooms/:roomId/nodes/batch` returns 207 with per-item results, the 23 clean items are
   completed, and the 7 conflicts are presented as one sheet sequence with "Apply to all remaining".
4. **Given** a folder move where a descendant name collides inside the destination subtree **then**
   only the top-level collision is prompted; descendants move with their parent and cannot collide,
   because they keep their parent.
5. **Given** Replace on a move **then** the destination's existing item is trashed (R1) or versioned
   (R2) and the moved item takes its place; the source is removed only after the destination write
   commits, so no state exists where the item is in neither place.
6. **Given** any batch result **then** the result screen lists every item with its outcome, is reachable
   from the toast for at least 60 seconds and from the room's activity log permanently, and partial
   failure is reported per item, never as a single "some items failed".
7. **Given** a move that would change who can see the item (destination has different shares) **then**
   the access-change summary from [US-E07-02](./epic-07-sharing-and-access-control.md) is shown in the
   same confirmation as the conflict resolution, in one sheet, and both are confirmed by one Apply.

**Mobile acceptance criteria**

- The batch progress state is determinate ("Moving 12 of 30") and announced politely at most once every
  2 seconds; the acted-on rows remain visible in the listing with a per-row progress indicator rather
  than disappearing.
- The conflict sequence never presents more than one sheet at a time; advancing from conflict 1 to
  conflict 2 replaces the sheet's content in place rather than opening a second sheet.
- "Apply to all remaining" is a full-width row above the three choices, >= 48 CSS px, with an
  accessible name that states the scope ("Apply Keep both to the remaining 6 conflicts").
- Backgrounding mid-batch: the server continues, the client reconnects to the batch's result on next
  open, and the result screen is shown as a persistent notice.
- On a 4G connection with 100 ms RTT, a batch of 30 items reports its first per-item result within
  1.5 s so the user sees progress rather than a spinner.

**Edge cases & negative paths**

- Destination folder deleted mid-batch: remaining items fail with 404 and the result screen says "The
  destination folder was deleted. 12 items were moved before that happened, and they are in Trash's
  originating folder" with a link to each.
- Move into own descendant: refused per US-E08-12 before the conflict check runs.
- Copy that would exceed quota part-way: the batch stops at the first 507, reports which items were
  copied, and states the shortfall, never leaving a half-copied folder without saying so.
- Two users move the same item to two destinations simultaneously: the second gets 412
  `STALE_VERSION`, and the 412 experience in US-E08-11 explains where the item actually went.

---

### US-E08-09 — Idempotency: a retried mutation never happens twice

**As a** P6 Ray Okonkwo uploading from a basement **I want** every retry to be treated as the same
request **so that** a dropped connection never leaves me with two copies of a 40 MB survey.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E08-01 |
| Traces to | FR-CONF-029, FR-FILE-015, NFR-AVAIL-001, NFR-SEC-001, NFR-OBS-001, BR-152 |

**Acceptance criteria**

1. **Given** every mutating request the client sends **then** it carries an `Idempotency-Key` header
   containing a client-generated ULID, generated once per user intent and reused across every retry of
   that intent.
2. **Given** a repeated `Idempotency-Key` within 24 hours **when** the server receives it **then** it
   returns the original response status and body without repeating the effect, and a test that fires
   the same create twice concurrently results in exactly one item.
3. **Given** a repeated key with a *different* request body **then** the server returns 409
   `IDEMPOTENCY_KEY_REUSED`, which is never shown to the user; the client regenerates the key, logs a
   defect to telemetry and retries once.
4. **Given** an upload commit **then** deduplication is additionally on `(folderId, nameKey,
   contentHash)`: a commit for content already present under that name in that folder returns 409
   `UPLOAD_ALREADY_COMMITTED`, which the client treats as success and reports as "Already uploaded".
5. **Given** the idempotency record **then** it is scoped per subject, so a key from one user cannot
   return another user's result, and the record stores the response body, the status and a hash of the
   request body.
6. **Given** an idempotency key is reused after the 24-hour window **then** the request is treated as
   new; the client's key generation is tied to a persisted intent record so a queued mutation older
   than 24 hours is re-presented to the user rather than silently replayed.
7. **Given** the page freeze scenario **when** QA forces a discard mid-upload (Chrome DevTools "Discard
   tab" on Android, or the memory-pressure simulator) and reopens the app **then** exactly one file
   exists in the folder, with the correct name, and the activity log contains exactly one
   `node.created` event.

**Mobile acceptance criteria**

- Intent records (key plus request shape) are written to IndexedDB before the first network attempt,
  because the transition to hidden is the last point at which code is guaranteed to run.
- The resume offset for a chunked upload is committed to durable storage *before* each chunk is sent,
  not after, and a QA test that kills the app between two chunks resumes from the correct offset with
  no duplicated bytes.
- Zero use of `localStorage` for any of this: the 5 MiB cap and the synchronous main-thread cost make
  it unsuitable; IndexedDB or OPFS only.
- The upload tray shows "Retrying (2 of 5)" rather than a bare spinner, and the retry schedule uses
  exponential backoff with jitter, capped at 5 attempts before offering a manual Retry.
- With the screen off during a long upload, Screen Wake Lock is requested where available and the
  copy states honestly what happens on iOS: "Keep this screen on to finish the upload."

**Edge cases & negative paths**

- Client clock jumps (timezone change in an airport): keys are ULIDs, not timestamps, so ordering is
  preserved by the queue's own sequence number, not by wall-clock time.
- Two devices submit the same intent (the same photo, uploaded from phone and tablet): different keys,
  same content hash, so the second is reported as "Already uploaded" and no duplicate exists.
- Server-side idempotency store unavailable: the request is refused with 503
  `DEPENDENCY_UNAVAILABLE` and retried, rather than executed without idempotency protection.
- Key collision across users (astronomically unlikely, but tested): scoping per subject makes it
  harmless, and a test asserts cross-subject isolation.

---

### US-E08-10 — Optimistic concurrency: the version token contract

**As a** platform engineer building for P4 Ashley Kim **I want** every mutable resource to carry a
version token that mutations must present **so that** two people editing the same room never produce a
silent last-write-wins.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E08-01 |
| Traces to | FR-CONF-015, FR-CONF-016, NFR-SEC-001, NFR-MAINT-001, BR-125 |

**Acceptance criteria**

1. **Given** any mutable resource representation (room, node, share link, invite, grant) **when** it is
   returned **then** the response carries an `ETag` header and a `version` field in the body, derived
   from a monotonically increasing per-resource version counter, not from a content hash.
2. **Given** any mutating request against such a resource **then** it must carry `If-Match` with that
   token; a request without it is refused with 428 `IF_MATCH_REQUIRED`, which is never shown to a user
   and which fails a CI contract test if any client path can produce it.
3. **Given** an `If-Match` that does not match the current version **then** the response is 412
   `STALE_VERSION` and the body includes `currentEtag`, the current representation, and a `changedBy`
   plus `changedAt` summary, so the client can render the comparison without a second request.
4. **Given** a successful mutation **then** the response returns the new `ETag`, and the client updates
   its cached token without refetching.
5. **Given** a subtree operation (move, copy, delete) **then** the token checked is the operated node's
   own version, and the operation additionally validates that the counts it was confirmed against still
   match, returning 409 when they have moved (see US-E08-14 criterion 4).
6. **Given** a batch request **then** each item carries its own token and each item's result reports
   its own 412 independently; one stale item does not fail the batch.
7. **Given** concurrent mutations in a load test (50 clients, same node, 500 requests) **then** exactly
   the expected number succeed, no update is lost, and no request corrupts the version sequence.

**Mobile acceptance criteria**

- No user-visible surface. Verifiable from a phone by making a change on device A, then attempting a
  change on device B whose listing is stale: device B shows the comparison from US-E08-11 rather than
  overwriting.
- Tokens add no more than 32 bytes per row to a listing payload, keeping the 50-row listing inside the
  mobile payload budget.
- The client never invents a token: a mutation attempted for a row it has no token for triggers a
  refetch of that row first, and the user sees no error.

**Edge cases & negative paths**

- Version counter overflow: the counter is a 64-bit integer; a test documents that overflow is not
  reachable within the product's lifetime.
- Resource deleted between read and write: 404, not 412, and the client shows the deleted-item state
  from US-E08-13.
- Client caches an ETag across a sign-out and back in: tokens are resource-scoped, not
  session-scoped, so this is safe, and a test asserts it.
- Proxy strips the `ETag` header: the `version` field in the body is the fallback the client uses, and
  a synthetic monitor asserts both are present in production responses.

---

### US-E08-11 — The stale-version experience on a phone

**As a** P4 Ashley Kim who just discovered a broker changed a folder under me **I want** to see what I
changed, what they changed, and choose **so that** I never silently overwrite someone else's work or
lose my own.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E08-10 |
| Traces to | FR-CONF-017, FR-SHARE-018, NFR-A11Y-004, NFR-MOB-002, BR-133 |

**Acceptance criteria**

1. **Given** a 412 `STALE_VERSION` **when** the client receives it **then** the optimistic change is
   reverted, the row returns to the server's current state, and a comparison sheet opens stating three
   things: what the user attempted, what the item is now, and who changed it and when.
2. **Given** the comparison sheet **then** it offers exactly two committing choices: "Apply my change
   anyway" (which retries against the current version) and "Keep theirs" (which discards the attempt),
   plus Cancel.
3. **Given** "Apply my change anyway" **then** the retry carries the fresh token and the same
   idempotency key intent id with a new attempt counter, and if it collides again the sheet reappears
   with the newer state rather than looping silently.
4. **Given** "Keep theirs" **then** the user's attempted value is offered as a copy-to-clipboard action
   before the sheet closes, so a typed name is never simply lost.
5. **Given** the conflicting change was a delete **then** the sheet says so explicitly ("Ashley Kim
   deleted this 2 minutes ago") and offers "Restore it from Trash" instead of "Apply my change
   anyway".
6. **Given** the conflicting change was a rename **then** the sheet shows both names on separate lines
   with the actor and time, at body text size, with no diff highlighting that depends on colour alone.
7. **Given** any 412 **then** a telemetry event records the operation kind, the resource kind and the
   choice made, because the 412 rate and the share of 412s resolved without loss are release-gating
   metrics.

**Mobile acceptance criteria**

- The comparison is a single-column card at 360 px: "Yours" then "Theirs", never side-by-side, because
  two columns of names at 320 CSS px force horizontal scrolling (SC 1.4.10).
- Both committing controls are >= 48 CSS px, are the same size as each other, and "Apply my change
  anyway" is not styled as the safe default, because it is the one that can overwrite.
- The sheet replaces any currently open sheet rather than stacking, and it is a popable history entry.
- With the software keyboard open (the user was mid-rename), the keyboard is dismissed before the sheet
  opens so the whole comparison is visible at 360 x 640.
- The comparison text is announced politely in full on open, and focus moves to the sheet heading.
- On a flaky connection, the retry shows determinate progress and, on a second 412, does not clear the
  user's attempted value.

**Edge cases & negative paths**

- Three-way conflict (two other people changed it): the sheet shows the latest state and a count
  ("changed twice in the last 5 minutes"), not a merge attempt; merge is explicitly out of scope.
- The other change made the user's intended change impossible (item moved to a folder the user cannot
  write to): "Apply my change anyway" is hidden and the sheet explains why.
- Repeated 412 loop caused by a hot resource (a busy room root): after two failures the client stops
  auto-retrying and the sheet says "This folder is busy. Try again in a moment."
- User is offline when the 412 arrives from a queued mutation: the mutation stays in the queue as
  `needs_attention` and the comparison sheet is presented when the app is next opened online.

---

### US-E08-12 — A folder can never be moved into its own descendant

**As a** P4 Ashley Kim moving folders with a thumb **I want** invalid destinations to be impossible to
choose **so that** I cannot detach a subtree from the room by accident.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E08-10 |
| Traces to | FR-CONF-018, FR-FLDR-008, NFR-SEC-001, NFR-A11Y-004 |

**Acceptance criteria**

1. **Given** a move request whose destination is the source itself or any descendant of the source
   **then** the API refuses with 400 `MOVE_INTO_DESCENDANT` and the message "You cannot move a folder
   inside itself.", and the refusal is enforced server-side regardless of client state.
2. **Given** the destination-picker sheet **when** it renders while moving a folder **then** the source
   folder and its entire subtree are shown but not selectable, with a one-line explanation on the
   source row ("Cannot move into itself"), so the user learns the rule before committing.
3. **Given** a batch move where one item's destination is inside another selected item **then** the
   whole batch is refused with the offending pair named, because partially applying such a batch could
   orphan a subtree.
4. **Given** a concurrent move by another user that would create a cycle (A into B while B moves into
   A) **then** the second move is refused by a server-side cycle check performed inside the same
   transaction as the parent update, and a load test with 20 concurrent interleaved moves produces no
   cycle.
5. **Given** any move **then** the server recomputes ancestor counters and the materialised path for the
   whole subtree in one transaction, and an integrity check job verifies no node is its own ancestor.
6. **Given** the picker is showing a large tree **then** the descendant set is determined from the
   materialised path prefix rather than by walking children, so disabling the subtree costs no extra
   requests.

**Mobile acceptance criteria**

- Disabled rows in the picker are visibly distinct (reduced opacity plus an explanatory line) and are
  not focusable by the screen reader as selectable destinations; their accessible name includes "not
  available, cannot move into itself".
- The picker's "Move here" button is disabled when the current folder is an invalid destination, with
  `aria-disabled` and a visible reason line above it, so the user is never told "no" only after
  tapping.
- The rule is explained once at the moment of relevance, not in a help page; the explanation line
  wraps at 200 percent text size rather than truncating.
- On a flaky connection, the picker uses the cached tree to disable the subtree immediately and does
  not wait for a network response to apply the rule.

**Edge cases & negative paths**

- Move to the same parent (a no-op): accepted and reported as "Nothing to move", not an error.
- Source folder deleted while the picker is open: on Move, 404 with "That folder was deleted."
- Deep subtree (depth 32) where the destination is at depth 30: refused for path length per US-E08-03
  before the descendant check, and the message names the actual reason.
- Client with a stale tree offers an invalid destination: the server refuses, the picker refreshes, and
  the invalid row becomes disabled without losing the user's place.

---

### US-E08-13 — The item you are viewing changed under you

**As a** P3 Tomás Ferreira reading a lease in a client's reception **I want** to be told clearly when the
document I am looking at is renamed, moved or deleted by someone else **so that** I do not stare at a
blank screen or a generic error.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E08-10 |
| Traces to | FR-CONF-019, FR-CONF-020, NFR-A11Y-004, NFR-PERF-003, NFR-AVAIL-001 |

**Acceptance criteria**

1. **Given** an open viewer **when** the underlying item is renamed by another principal **then** the
   viewer's title updates in place within the staleness window (Assumption: 30 s poll, or immediately
   on the next interaction), and a one-line inline notice states "Renamed to Lease final by Ashley
   Kim" for 10 seconds; reading is not interrupted.
2. **Given** an open viewer **when** the item is moved **then** the breadcrumb updates and the notice
   states the new location; the currently rendered page remains visible.
3. **Given** an open viewer **when** the item is trashed by another principal **then** the viewer is
   replaced by an explicit state: "Ashley Kim deleted this file 1 minute ago", with primary action "Go
   to Financials" and, for principals with permission, secondary action "Restore from Trash". A blank
   view or a raw 404 is a defect.
4. **Given** a folder listing that is open **when** another principal adds, removes or renames items in
   it **then** the listing refreshes within the staleness window without losing the user's scroll
   position or their active selection, and newly arrived rows are marked "New" for 5 seconds rather
   than silently reordering under the thumb.
5. **Given** a listing refresh **when** an item the user has selected has been deleted **then** it is
   removed from the selection, the selection count updates, and a polite announcement states "1
   selected item is no longer available."
6. **Given** the item is deleted while the user has an unsaved rename in the sheet **then** the sheet
   closes, the typed value is offered as a copy action, and the deleted-item state is shown.
7. **Given** any of these transitions **then** they never occur while the user is mid-gesture: a
   refresh is deferred until the current scroll or drag has settled, verified by a test that scrolls
   continuously while a background update lands.

**Mobile acceptance criteria**

- Scroll position is preserved to the exact row (not the exact pixel) across a refresh, measured by a
  test that scrolls to row 300 of 1,000, triggers a remote change, and asserts row 300 is still the
  first visible row.
- The inline notice occupies at most 48 CSS px, sits below the sticky breadcrumb, does not cover the
  page content or the bottom bar, and is dismissible.
- The deleted-item state fits 360 x 640 without scrolling and its primary action is within the thumb
  zone.
- Transitions are announced politely except the deletion of the item currently being viewed, which is
  announced assertively and moves focus to the state's heading.
- With reduced motion enabled, refreshes replace content with no animation and no cross-fade.
- Offline: no state change is inferred from a failed request; the offline banner is shown instead, and
  the deleted state appears only after a server response confirms it.

**Edge cases & negative paths**

- Item deleted and a new item created with the same name: the viewer shows the deleted state for the
  old id and does not silently swap to the new item, because they are different documents.
- Rapid successive changes by another user: notices coalesce into one ("Changed 3 times by Ashley
  Kim") rather than stacking three notices.
- Recipient on a share link whose scope is trashed: they get `SHARE_TARGET_UNAVAILABLE` from E07,
  which reveals nothing, rather than this story's named-actor state.
- Screen reader user mid-utterance when the item is deleted: the assertive announcement is queued to
  the end of the current utterance rather than cutting a word in half.

---

### US-E08-14 — Trash: soft delete, stated retention and restore

**As a** P4 Ashley Kim who mis-tapped Delete on a folder **I want** the deletion to be recoverable, with
the retention window stated **so that** a thumb on a small screen cannot destroy a live deal's document
set.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E08-06, US-E09-13 |
| Traces to | FR-CONF-030, FR-FILE-033, FR-FLDR-010, FR-FLDR-013, NFR-SEC-001, NFR-A11Y-004, BR-172, BR-174, BR-176, BR-177, BR-181 |

**Acceptance criteria**

1. **Given** a delete of any item **then** it is a soft delete: the node moves to `trashed`, the whole
   subtree is marked in one transaction, exactly one `TrashEntry` is created on the subtree root
   carrying a blast-radius snapshot (folder count, file count, total bytes, active share count), and
   nothing is destroyed.
2. **Given** the delete confirmation **then** it states the exact counts from the server before commit:
   "Delete Financials? This will move 3 folders and 47 files (1.2 GB) to Trash and stop 2 share links
   from working. You can restore it for 30 days." The counts come from the server, not from the
   client's page.
3. **Given** the counts change between the confirmation being shown and confirmed **then** the request
   is rejected with 409, and the confirmation re-renders with the new counts, so a user never confirms
   a number that is no longer true.
4. **Given** the delete would destroy more than the threshold in BR-174 (Assumption: 25 items) or would
   break any active share **then** a second, explicitly distinct confirmation gesture is required, per
   the pattern in [US-E09-13](./epic-09-mobile-ux-foundations.md).
5. **Given** a completed delete **then** a toast with Undo is shown for 10 seconds, and Undo restores
   the subtree without opening the Trash screen; after the toast, restore is available from the room's
   Trash screen for the retention window.
6. **Given** a trashed item **then** it is invisible in listings and in search, returns 404 to anyone
   without manager rights, and its bytes move from `bytesUsed` to `bytesInTrash` while still counting
   against the account quota, which is stated in the Trash screen: "Trashed items still use your
   storage until they are purged."
7. **Given** a restore **when** the original parent still exists **then** the subtree is restored to
   its original path; **when** the original parent is gone **then** it is restored to the room root and
   the result states "Restored to the top of Acme HVAC because its original folder no longer exists."
8. **Given** a restore whose name now collides **then** the conflict sheet from US-E08-05 is presented,
   and the chosen resolution is recorded in the activity log.
9. **Given** active shares whose scope was inside the trashed subtree **then** they return
   `SHARE_TARGET_UNAVAILABLE` while trashed and resume working on restore, and the Trash screen states
   which shares are currently suspended.
10. **Given** the Trash screen **then** each entry shows the item name, its original path, who deleted
    it, when, its size, and the exact purge date.

**Mobile acceptance criteria**

- The confirmation's counts are the largest text in the sheet, legible at arm's length in sunlight
  (contrast >= 4.5:1 and >= 20 CSS px), because this is the single highest-stakes read in the product.
- The destructive button is at the end of the sheet, styled destructive, >= 48 CSS px, and never the
  control nearest the thumb's resting position after the sheet opens; the delete commits on the
  up-event with an abort path if the finger slides off (SC 2.5.2).
- The Undo toast lasts 10 seconds, sits above the bottom bar plus `env(safe-area-inset-bottom)`, its
  Undo control is >= 48 CSS px, and its timer pauses while the toast has focus or while the screen is
  being interacted with.
- The counts request is made when the confirmation opens and must return within 1.5 s on the reference
  network; if it has not, the sheet shows a skeleton count line and the destructive button stays
  disabled until real counts arrive, because a confirmation without counts is not a confirmation.
- Backgrounding after confirming but before the response: the delete completes server-side and the
  result (plus a still-valid Undo, extended to 30 seconds in this path) is shown on next open as a
  persistent notice.
- With a screen reader on, the confirmation reads the counts as part of the destructive button's
  accessible name ("Delete 3 folders and 47 files"), so a user who navigates straight to the button
  still hears the blast radius.

**Edge cases & negative paths**

- Delete of an empty folder: single confirmation, counts read "This folder is empty", no second
  gesture.
- Delete while another user is uploading into the folder: the upload's commit fails with 404 and its
  tray entry states "The destination folder was deleted", and its bytes are cleaned up.
- Undo tapped after the server already began the purge (impossible within 10 s, but tested): the undo
  returns 410 and the toast becomes "Too late to undo. Restore it from Trash instead."
- Quota exceeded so the user deletes to free space: the Trash screen shows how much emptying it would
  free, and the copy is explicit that deleting alone does not free storage until purge or permanent
  delete.
- Trashed item's parent is itself trashed later: the child inherits the parent's entry; restoring the
  parent restores the child, and restoring the child alone restores it to the room root with the
  explanation.

---

### US-E08-15 — Permanent deletion, two-step and irreversible

**As a** P1 Marcy Doyle closing out a mandate **I want** to permanently destroy a document set, with the
irreversibility stated plainly **so that** a seller's confidential material is genuinely gone when I say
it is.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E08-14, US-E01-13 |
| Traces to | FR-CONF-030, NFR-SEC-001, NFR-PRIV-002, NFR-COMPL-001, BR-177 |

**Acceptance criteria**

1. **Given** the Trash screen **when** the room Owner chooses Delete permanently on an entry **then**
   step-up re-authentication is required, followed by a confirmation that states the counts, the total
   bytes, and the sentence "This cannot be undone. The files will be gone."
2. **Given** the confirmation **then** it requires two distinct deliberate actions: the destructive
   button plus a second confirmation surface that echoes the item name and counts; press-and-hold is
   explicitly NOT used, because a timed down-event action conflicts with SC 2.5.2 Pointer
   Cancellation.
3. **Given** the purge commits **then** the node rows are replaced by tombstones (id, name snapshot,
   timestamps) so the activity log stays readable, `FileVersion` rows are purged, `Blob.refCount` is
   decremented, blobs reaching zero references are deleted after a 7-day grace, and `bytesInTrash` is
   released immediately.
4. **Given** retention elapses (Assumption: 30 days) **then** the same purge runs automatically, an
   `ActivityEvent` `node.purged` is written, and the room's Managers are notified in the daily digest
   with the counts.
5. **Given** the purge is running for a large subtree **then** it is asynchronous with a visible state
   in the Trash screen ("Deleting permanently, 1,240 of 8,000 items"), and the entry cannot be
   restored once the purge has begun.
6. **Given** a purged item **then** a subsequent restore attempt returns 410 with "That item was
   permanently deleted", and no endpoint can recover it, verified by a test that asserts the blob is
   unreachable after the grace window.
7. **Given** a Manager rather than an Owner **then** Delete permanently is absent from their sheet and
   the endpoint returns 403 for them, so permanent destruction is an Owner-only authority.
8. **Given** "Empty Trash" **then** it states the total counts and bytes across all entries and follows
   the identical two-step path, with per-entry results reported.

**Mobile acceptance criteria**

- Step-up uses a passkey where available so no password is typed on a phone; where unavailable, the
  password field allows paste and autofill.
- The second confirmation surface is a separate sheet section, not a stacked sheet, and its destructive
  control is at the opposite end of the sheet from the first, so a double-tap cannot complete both
  steps.
- The irreversibility sentence is the largest text after the counts and is not truncated at 200 percent
  text size.
- Progress for a long purge is determinate and survives backgrounding: reopening the app shows the
  current progress from the server, not a restarted spinner.
- With a screen reader on, the destructive button's accessible name contains "permanently delete 47
  files, cannot be undone".

**Edge cases & negative paths**

- Purge attempted while a legal-hold or retention policy applies (R3 concept): refused with a stated
  reason rather than silently skipped.
- Blob shared by two nodes (deduplicated content): reference counting means the bytes survive until
  the last reference is purged; a test asserts the surviving node still downloads correctly.
- Network loss mid-confirmation: nothing is purged; the confirmation must be completed against a live
  connection, and the copy says "You need a connection to delete permanently."
- Purge of an item that a recipient is currently viewing: the recipient's viewer transitions to the
  unavailable state within 15 seconds, and the purge does not wait for them.

---

### US-E08-16 — File versioning and version restore

**As a** P4 Ashley Kim replacing a lease with a corrected copy **I want** the previous copy kept as a
version I can inspect and restore **so that** a buyer relying on the old figures can still be shown what
they saw.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E08-07, US-E08-14 |
| Traces to | FR-CONF-021, FR-CONF-022, FR-CONF-023, FR-CONF-024, NFR-SEC-001, NFR-SCALE-001, BR-186 |

**Acceptance criteria**

1. **Given** a Replace resolution or an explicit "Upload new version" **then** a new `FileVersion` is
   created with an incrementing number, the previous version is retained, and the node's current
   version pointer moves; the node id, its shares and its links are unchanged, so every existing link
   now serves the new version.
2. **Given** the version list **when** it is opened **then** it shows, per version, the number, size,
   created time, the principal who created it, and a badge on the current version, newest first.
3. **Given** a specific version **then** it can be previewed and, subject to the same grant and
   download-flag checks as the current version, downloaded; a Viewer without `canDownload` gets 403 on
   a version download exactly as on the current one.
4. **Given** Restore on an older version **then** a new version is created whose content is that older
   version's content; no history is deleted, and the activity log records `version.restored` with the
   source version number.
5. **Given** the version-retention policy of BR-186 — the window is administrator-configurable with the
   default stated in the rule, and **the 3 most recent versions are always kept regardless of age** —
   **then** the version list states the window in force and when the oldest retained version will
   expire, and expiry removes only the version, never the current file and never one of the last three.
6. **Given** versioning **then** storage accounting includes version bytes in the room's total and the
   room's storage breakdown shows "files / versions / trash" separately, so a user can see why a room
   is larger than its visible files.
7. **Given** a version is created **then** the recipient-facing behaviour is stated: anyone with an
   active link sees the new version on their next request, and the activity log lets a Manager see who
   had already downloaded the previous one.

**Mobile acceptance criteria**

- The version list is reachable from the file's details sheet in one tap, renders as a card list (never
  a table) with no horizontal scrolling at 320 CSS px, and each card is >= 56 CSS px tall.
- Restore requires a confirmation naming the version and the consequence ("Version 2 becomes the
  current file. Version 5 stays in the history."), commits on the up-event, and is followed by a
  10-second Undo.
- A version preview reuses the standard viewer with a persistent "Version 2 of 5" chip in the header
  so the reader always knows they are not looking at the current file.
- On a flaky connection, the version list is cached and shown from cache with a "last updated" line
  rather than a spinner.
- Screen reader announces each version card as "Version 3, 1.4 megabytes, uploaded by Ashley Kim on 12
  August, current version".

**Edge cases & negative paths**

- Replace with identical content: no new version is created; the result states "That file is identical
  to the current version" rather than inflating the history.
- Version count at the retention cap: the oldest is expired at the moment the new one is created, and
  the interface states which version was dropped.
- Restore of a version whose blob was purged (retention elapsed mid-session): 410 with "That version is
  no longer available", and the list refreshes.
- A file converted to a different type (PDF replacing a DOCX under the same name): allowed, and the
  version card shows the type per version so the change is visible.

---

### US-E08-17 — The offline mutation queue: capture and visibility

**As a** P6 Ray Okonkwo in a basement with no signal **I want** my renames, folder creations and deletes
to be captured and visibly queued **so that** I know exactly what has not happened yet.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E08-09, US-E08-10 |
| Traces to | FR-CONF-025, FR-CONF-028, NFR-AVAIL-001, NFR-MOB-005, NFR-A11Y-004, BR-130 |

**Acceptance criteria**

1. **Given** the device is offline **when** the user performs a queueable mutation **then** it is
   written to a durable IndexedDB queue with its sequence number, idempotency key, captured `If-Match`
   token, target id and full request body, before any optimistic UI change is applied.
2. **Given** the queueable set **then** it is exactly: create folder, rename, move within the same
   room, delete to trash, restore from trash, and enqueue upload. Every other mutation is refused
   offline with a plain statement: "You need a connection to change sharing" (share create, policy
   edit, revoke, permission change, permanent delete, version restore, ownership transfer).
3. **Given** a queued mutation **then** the affected row shows a persistent "Waiting to sync" marker
   (not a spinner), and a queue screen reachable from the offline banner lists every pending item with
   its action, target, and the time it was made.
4. **Given** the queue screen **then** each entry can be individually cancelled before it is sent, and
   cancelling reverts its optimistic change with an explanation.
5. **Given** a queued mutation whose optimistic effect is visible **then** the local view is internally
   consistent: renaming a folder offline and then creating a file inside it works locally, and both
   mutations are queued in dependency order.
6. **Given** the app is closed and reopened while offline **then** the queue and every optimistic change
   are reconstructed from durable storage, and the queue screen shows the same entries in the same
   order.
7. **Given** the queue exceeds a size cap (Assumption: 200 entries or 10 MB of bodies) **then** further
   queueable mutations are refused with "You have too many unsent changes. Connect to finish them
   first.", rather than silently dropping the oldest.
8. **Given** browser storage is evicted (Safari's seven-day no-interaction rule, or pressure eviction)
   **then** the app detects the loss on next open, states plainly "Some unsent changes were lost
   because your browser cleared local data", and lists what it can reconstruct from the server rather
   than pretending nothing happened.

**Mobile acceptance criteria**

- The offline banner states what still works ("You can read cached files and queue changes") and
  carries a >= 48 CSS px control to the queue screen; it is removed automatically on reconnection.
- Copy honesty rules apply: nothing claims background upload on iOS. A queued upload says "Paused —
  reopen the app to continue", never "Uploading in the background".
- `navigator.storage.persist()` is requested at first meaningful use, its result is recorded, and the
  queue screen states "Your browser may clear these if you do not open the app for 7 days" when
  persistence was not granted.
- Each queued row is >= 56 CSS px with a >= 48 CSS px cancel control, and the count appears as a badge
  on the offline banner.
- Screen reader announces the queue count on change, politely, at most once every 2 seconds.

**Edge cases & negative paths**

- Airplane mode toggled repeatedly: the queue is not flushed on every transition; a debounce of 2 s and
  a real connectivity probe prevent thrash.
- Two tabs open with the same queue: the queue is guarded by a Web Lock so only one tab drains it, and
  the other tab reflects the same state.
- Storage full on the device: enqueue fails, the user is told "There is not enough space on your device
  to save this change", and no optimistic change is applied.
- User signs out with a non-empty queue: sign-out warns "You have 4 unsent changes. Signing out will
  discard them." and requires explicit confirmation.

---

### US-E08-18 — Reconciling the queue on reconnect

**As a** P6 Ray Okonkwo back in signal **I want** my queued changes to be replayed in order, and any that
conflict to be shown to me individually **so that** nothing is force-applied and nothing is silently
thrown away.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E08-17, US-E08-11 |
| Traces to | FR-CONF-026, FR-CONF-027, NFR-AVAIL-001, NFR-SEC-001, NFR-OBS-001, BR-131 |

**Acceptance criteria**

1. **Given** connectivity returns **when** the queue drains **then** entries are replayed in sequence
   order, each carrying its original idempotency key and its captured `If-Match` token, one dependency
   chain at a time, with a determinate progress state.
2. **Given** an entry succeeds **then** it is removed from the queue only after the server response is
   persisted, so a crash mid-drain cannot lose or double-apply it.
3. **Given** an entry fails with 412 `STALE_VERSION` **then** replay of that entry's dependency chain
   stops, the entry moves to `needs_attention`, independent chains continue, and the user is presented
   the comparison sheet from US-E08-11 for that entry.
4. **Given** an entry fails with 409 `NAME_CONFLICT` **then** the conflict sheet from US-E08-05 is
   presented for that entry, with the queue paused for its chain.
5. **Given** an entry fails with 403 or 404 (permission removed, target deleted while offline) **then**
   it moves to `needs_attention` with a plain explanation ("You no longer have permission to rename
   this" / "This folder was deleted while you were offline") and an option to discard it, which the
   user must take explicitly.
6. **Given** any entry in `needs_attention` **then** it is never discarded automatically, is listed on
   the queue screen with a badge, and survives app restarts until the user resolves it.
7. **Given** the drain completes **then** a single summary is shown ("6 changes applied, 1 needs your
   attention") with a link to the detail list, and every outcome is written to telemetry so the
   offline-conflict rate is measurable.
8. **Given** an entry has been retried 5 times with transport errors **then** it stops auto-retrying,
   moves to `needs_attention` with "We could not send this. Try again?", and offers a manual retry.
9. **Given** a queued upload **then** its resume offset is probed with `HEAD /uploads/:id` before any
   bytes are sent, so the client resumes from the server's authoritative offset rather than its own
   belief.

**Mobile acceptance criteria**

- The drain runs only in the foreground and the copy says so: "Keep the app open to finish sending 6
  changes." There is no Background Sync on iOS and no Background Fetch outside Chrome, so no background
  claim is made anywhere.
- Drain progress is a single non-blocking bar under the sticky header, never a modal, so the user can
  keep reading while it runs.
- Conflict sheets from the drain are presented one at a time, queued behind each other, and never
  stacked; dismissing one advances to the next with a "1 of 3" counter.
- If the app is backgrounded mid-drain, the current entry's state is persisted before hiding and the
  drain resumes from that point on next open; a QA test kills the app mid-drain and asserts no entry is
  applied twice.
- Screen reader announces the drain summary politely once, and each `needs_attention` item is reachable
  in the focus order from the summary.
- On a degraded connection (high latency, low throughput) the drain serialises rather than parallelises
  and adapts chunk size downward for queued uploads.

**Edge cases & negative paths**

- The user made a rename offline and someone else deleted the item: the entry fails 404, the sheet
  offers "Restore from Trash and apply my rename" where the user has permission, otherwise "Discard my
  change".
- Chain where the first entry fails: dependent entries are held, not attempted, and the queue screen
  shows them as "Waiting on an earlier change".
- Clock skew makes a captured token look newer than the server's: tokens are opaque server-issued
  values, never compared by time, so this cannot occur; a test asserts token opacity.
- Reconnect on a captive-portal Wi-Fi that returns HTTP 200 with a login page: the drain detects a
  non-JSON response, treats the network as unusable, and keeps the queue intact with the copy "This
  network needs you to sign in first."

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| The interface of create, rename, move, copy, upload and delete that triggers these rules | [E03](./epic-03-folder-hierarchy-and-navigation.md), [E04](./epic-04-file-operations.md) |
| The destination-picker sheet, the conflict sheet's component behaviour, toast and undo mechanics, the destructive-confirmation pattern | [E09](./epic-09-mobile-ux-foundations.md) |
| Permission checks that decide whether a mutation is allowed at all, and read-only enforcement | [E07](./epic-07-sharing-and-access-control.md) |
| Cursor pagination, list virtualisation, offline read cache and prefetch | [E10](./epic-10-performance-offline-and-scale.md) |
| The activity log surface that displays conflict and purge events, and the notification digest | [E11](./epic-11-trust-audit-and-notifications.md) |
| Quota policy, what happens at the storage limit, and who configures the version-retention window | [E12](./epic-12-account-storage-and-governance.md) |
| Real-time collaborative editing or automatic merge of two edits to the same document | Out of scope for the product entirely, at every release. |
| Content-aware duplicate detection across folders ("you already have this file elsewhere") | R3. Recorded as OQ70. |
| Legal hold and immutable retention policies | R3, dependent on the compliance programme. Recorded as OQ71. |

## Open questions

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ65 | Is 30 days the right trash retention for an item, and should it be configurable per room? Deal timelines restart months later, but retained bytes count against quota. | Product + Legal | Before R1 code freeze |
| OQ66 | In R1, Replace moves the old file to Trash. Does that satisfy the "never silently overwrite" promise for design partners, or must versioning be pulled into R1? | Product + design partners | Before R1 code freeze |
| OQ67 | Do we case-fold aggressively (so `Lease.pdf` and `lease.pdf` collide) or preserve case as distinct? Case-folding matches user expectation from Windows and macOS; distinct matches Linux and avoids surprising rejections in some locales. | Product + Engineering | Before US-E08-01 build |
| OQ68 | What is the correct maximum name length: 255 UTF-8 bytes (filesystem-compatible) or 255 characters (user-comprehensible)? The two differ sharply for CJK and emoji names. | Engineering + I18N review | Before US-E08-03 build |
| OQ69 | Should the offline mutation queue include move across rooms, or is same-room-only a permanent restriction? Cross-room move touches two permission scopes and two quota scopes. | Product + Engineering | R2 planning |
| OQ70 | Is content-hash duplicate detection across the whole room valuable to P4, or is it noise? It would let us say "this file is already in Financials". | Product + design partners | R3 |
| OQ71 | Do any beachhead customers need legal hold or immutable retention, and if so does that block permanent delete entirely for those rooms? | Product + Legal | R3 |
