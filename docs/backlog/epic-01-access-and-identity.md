# Epic E01 — Access & Identity

## Purpose

This epic establishes who a person is, how they prove it on a phone, how long that proof lasts,
and how it is taken away. Owner identity is the root of every access decision in the tool, so
nothing in E02 to E12 can be built or tested until the subject model, session model and guest
model in here exist. It covers two populations with opposite needs: **colleagues** (staff of this
company), who normally arrive through the company identity provider and whose sessions must survive
weeks of phone use; and **external recipients**, who hold no account at all and must reach a shared
document without ever seeing a sign-in screen. The most load-bearing screen in this epic is the one
a recipient never sees, because a shared link opens the document with no account wall.

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
- Sibling backlogs: [E02 Data Rooms & Workspace Home](./epic-02-data-rooms-and-workspace-home.md),
  [E03 Folder Hierarchy & Navigation](./epic-03-folder-hierarchy-and-navigation.md),
  [E04 File Operations](./epic-04-file-operations.md),
  [E07 Sharing & Access Control](./epic-07-sharing-and-access-control.md),
  [E09 Mobile UX Foundations](./epic-09-mobile-ux-foundations.md),
  [E11 Trust, Audit & Notifications](./epic-11-trust-audit-and-notifications.md),
  [E12 Account, Storage & Governance](./epic-12-account-storage-and-governance.md)

## Epic summary

| Field | Value |
| --- | --- |
| Epic ID | E01 |
| Goal | Give every actor, staff or not, a server-verified identity that access control can hang off; make signing in on a phone a sub-30-second act; make signing out everywhere provable and bounded by BR-108; and let an external recipient read a shared document with no account at all. |
| Primary personas | P1 Marcy Doyle (engagement lead, staff, iPhone-primary, room owner), P2 Dev Raman (external recipient with no account, Android), P5 Ingrid Sørensen (senior external decision-maker, iPhone, reads between meetings), P4 Ashley Kim (document operations coordinator and workspace administrator, multi-device) |
| Release span | R1 (stories 01 to 12, 15, 16, 18), R2 (stories 13, 14, 17). Release tags are derived from the Release column in [05](../05-functional-requirements.md), which owns them (D03, D04) |
| Story count | 18 |
| Total points | 87 |
| Depends on | Nothing inside this doc set. External prerequisites: the company identity provider tenant (assumption A-IDP in [06](../06-business-rules-and-permissions.md); open question OQ08), a transactional email provider, `packages/shared` auth contract types, NestJS global `ValidationPipe` already in `apps/api`. |
| Blocks | E02 (room ownership needs a subject), E07 (sharing needs both a grantor identity and a guest identity), E11 (audit needs a stable actor id), E12 (account governance, provisioning and deprovisioning need an account) |

## Mobile-first design stance

- **Assumption A-IDP: the company identity provider is the primary sign-in path for colleagues.**
  Staff are expected to reach the tool through the company's own SSO (OIDC) tenant, so joiner and
  leaver events originate in the directory rather than in this tool's own account list
  ([E12](./epic-12-account-storage-and-governance.md), FR-ACCT-030 to FR-ACCT-032). **This pass
  deliberately does not build out an SSO requirement set.** Everything specified below stands exactly
  as written and is now labelled for what it is: the fallback and break-glass path for colleagues,
  and the only path available to external recipients. Email and password (US-E01-02, US-E01-04),
  magic link (US-E01-10), passkeys (US-E01-12) and step-up (US-E01-13) therefore all stay in scope,
  and an external recipient must always be able to open a share link with **no account and no
  identity provider at all** (US-E01-08, FR-AUTH-020, FR-AUTH-021, BR-009, BR-081). The assumption
  is recorded normatively as A-IDP in [06](../06-business-rules-and-permissions.md); the open
  question of *which* provider, and whether SCIM provisioning is available from it, is OQ08 below
  and in [12](../12-risks-and-open-questions.md).
- **The 360 px screen is the design surface, and the keyboard eats half of it.** Every auth form is
  specified for a 360 x 640 viewport with the software keyboard open, which leaves roughly 360 x 300
  of usable area. That means one visible field group at a time, the primary button pinned above the
  keyboard using `env(keyboard-inset-bottom)` with a `visualViewport` fallback, and never a form that
  requires scrolling to find the submit control. WCAG 2.2 SC 2.4.11 Focus Not Obscured is the pass
  gate, not a nicety.
- **Typing is the enemy; the phone's own credential store is the ally.** The fastest sign-in on a
  phone involves no typing. Order of preference is passkey (WebAuthn, backed by Face ID / Touch ID /
  Android biometrics), then magic link, then autofilled password, then typed password. Correct
  `autocomplete` tokens, `inputmode="email"`, paste permitted everywhere including one-time codes,
  and `webauthn` autofill hints are functional requirements, not polish. This is also how WCAG 2.2
  SC 3.3.8 Accessible Authentication is satisfied.
- **"Biometric unlock" on the web is a re-authentication ceremony, not an OS screen lock.** There is
  no web API that forces a biometric check when a page returns to the foreground, and no web
  equivalent of iOS LocalAuthentication. The product therefore ships a short server-side session TTL
  plus a step-up WebAuthn assertion triggered on `visibilitychange`, and the UI says "Confirm it is
  you" rather than implying the operating system has locked the app. Claiming otherwise is banned
  copy (see [E09](./epic-09-mobile-ux-foundations.md) honesty rules).
- **The recipient path has no gate.** P2 and P5 both abandon silently rather than complain. A
  permissioned share therefore resolves to a *guest session* bound to the invited email and the
  share token, with no password, no account, and no interstitial. An account is never required of a
  recipient at any point; the only account-shaped prompt a recipient may see is the optional,
  dismissible claim offer in US-E01-17.
- **Desktop-only auth primitives get named touch replacements.** There is no hover, so nothing is
  explained by a tooltip. There is no right-click, so the session list exposes a **visible per-row
  overflow button of at least 48 x 48 CSS px on the row's trailing edge**, and that button is what
  opens the contextual sheet (FR-MOB-001, resolved by D01). Long-press is **not** a second route to
  that sheet: product-wide it carries exactly one meaning, enter multi-select and select the pressed
  row (FR-FILE-035). Keyboard navigation and shortcuts remain in full because SC 2.1.1 is Level A,
  and they light up as a genuine desktop enhancement when a fine pointer or hardware keyboard is
  detected.
- **Sessions are long on phones and revocable in seconds.** A colleague in a car park cannot re-enter
  a password every day. The numbers are owned by [06](../06-business-rules-and-permissions.md) and
  cited, never restated: an access credential lives at most **5 minutes (BR-023)**, a refresh
  credential at most **90 days, rotated on every use (BR-023)**, a loaded page re-checks its grant
  every **30 seconds (BR-112)**, and a revocation or a sign-out-everywhere is effective within
  **5 s at p95 and 60 s absolutely (BR-108)**. Every mutating request re-checks authorisation
  server-side regardless of what the client believes (BR-077); a valid access credential is never
  standing authorisation.
- **Event names come from [10](../10-success-metrics-and-analytics.md), not from here.** The event
  dictionary in 10 is the build gate (D13). This epic requires these names to exist there and cites
  them verbatim: `account_signup_started`, `account_signup_completed`, `email_verification_sent`,
  `email_verification_completed`, `session_signed_in`, `session_signed_out`,
  `session_step_up_completed`, `auth_rate_limited`, `share_link_opened`, `share_link_rejected`,
  `share_invite_accepted`, `access_denied`, `account_deletion_requested` and
  `account_deletion_completed`. Any new event is added to that dictionary first and cited here
  second, never the reverse.
- **Backgrounding is assumed to be fatal to in-flight work.** A frozen page cannot run timers or
  fetch callbacks and a discarded page cannot run code at all, and `unload` does not fire when a tab
  is closed from the mobile tab switcher. Every auth flow therefore persists its resumable state
  (pending verification, pending OAuth nonce, partially typed room name) on `visibilitychange` to
  hidden and on `pagehide`, and reconstructs it on next open.
- **Progressive enhancement direction is fixed, and it uses the one size-class ladder.** The ladder is
  owned by [03](../03-product-overview.md) (D10) and named here, never re-measured: **compact** ships
  the bottom-sheet, bottom-button, single-column form; **medium** adds a two-column settings layout
  and a navigation rail; **expanded** and **large** add the sessions table with sortable columns and
  keyboard shortcuts. No requirement in this epic is specified desktop-first and retrofitted, and no
  requirement in this epic introduces a breakpoint number of its own.

---

## User stories

### US-E01-01 — Identity, subject and actor model

**As a** platform engineer building for P1 Marcy Doyle **I want** one server-side subject model that
covers colleagues with accounts and account-less external recipients **so that** every access
decision, audit entry and share grant in the tool can name exactly one actor and be tested against
it.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | none |
| Traces to | FR-AUTH-020, FR-AUTH-021, FR-ROOM-002, FR-ROOM-020, FR-AUDIT-002, NFR-SEC-016, NFR-SEC-017, NFR-COMPL-001, BR-001, BR-002, BR-003, BR-005, BR-008, BR-009, BR-010, BR-020, BR-077, BR-233 |

**Acceptance criteria**

1. **Given** the shared contract in `packages/shared` **when** a developer imports the auth types
   **then** a `Subject` discriminated union is exported with exactly two variants, `{ kind: 'user',
   userId, email, emailVerified }` and `{ kind: 'guest', guestId, email, shareTokenId }`, and both
   carry a stable opaque `subjectId` string that never changes for the life of the subject.
2. **Given** any authenticated request reaching `apps/api` **when** the request is handled **then**
   the resolved `Subject` is attached by a guard before any controller runs, and a request with no
   valid credential resolves to no subject and is rejected with HTTP 401 and body
   `{ error: { code: 'UNAUTHENTICATED' } }`.
3. **Given** a resource read or mutation **when** the handler executes **then** the authorisation
   check is performed server-side against the stored grant for that `subjectId` on every request
   (BR-077), never against a cached decision, and the status code follows BR-233 exactly: a subject
   holding **no** grant on the target receives HTTP 404 `NOT_FOUND` on every verb, byte-identical and
   timing-equivalent to the response for an identifier that never existed (BR-049, BR-050); HTTP 403
   is returned **only** where the subject already holds an active grant on that exact target and is
   exceeding it, the canonical case being a Viewer attempting a write (BR-017).
4. **Given** a guest subject **when** a write endpoint is called **then** the response depends on
   whether the guest holds a grant on that exact target: with a grant, HTTP 403 `FORBIDDEN` naming
   the action and never the internal role string; **without** a grant, HTTP 404 `NOT_FOUND`
   indistinguishable from a non-existent target (BR-233). No code path may return 403 to a principal
   holding no grant on the target; a test asserts 404 for every verb of every route in that case
   (D02).
5. **Given** an audit-relevant event **when** it is written **then** the record contains
   `subjectId`, `subjectKind`, `email at time of event`, `ip`, `userAgent`, `deviceLabel` and
   `sessionId`, and remains resolvable after the subject is deleted (email replaced by
   `deleted-user-<hash>`), so the E11 activity log never shows a blank actor.
6. **Given** a user account is created **when** the first Data Room is created by that account
   **then** the room's `ownerSubjectId` is that user's `subjectId` (FR-ROOM-002), and BR-010 and
   BR-013 are enforced by database constraints: exactly one Owner per room at all times, and never an
   Owner of kind `guest`.
7. **Given** two subjects with the same email, one user and one guest **when** the user signs in
   **then** the guest grants bound to that email are listed as claimable and the API exposes a
   deterministic merge operation (see US-E01-17) rather than silently linking them.
8. **Given** a `subjectId` **when** it is logged, emitted in an analytics event or returned in an
   API response **then** it is an opaque identifier that cannot be used to enumerate other subjects
   (no sequential integers, no email in the identifier).

**Mobile acceptance criteria**

- No user-visible surface. Verifiable from a phone via the API only: with the app installed to the
  Home Screen and a valid session, calling a room endpoint the subject has no grant for returns 404
  and the app renders the standard "This Data Room is not available" screen at 360 x 640 with no
  horizontal scrolling.
- The client stores no authorisation decisions it enforces locally (BR-134). QA test: enable airplane
  mode, open a cached room the user was just revoked from, and confirm the first successful network
  call after reconnect clears the cached view and shows the access-removed state, inside the
  propagation bound of 5 s p95 / 60 s absolute (BR-108).

**Edge cases & negative paths**

- Guest email later registers an account: the grants transfer per BR-011 and FR-AUTH-026, surfaced as
  the claim flow in US-E01-17. There is no silent linkage of two live identities.
- Subject deleted or deprovisioned while a request is in flight: handler must re-resolve and return
  401 with `SUBJECT_REVOKED`; the client signs out and shows "You have been signed out. Sign in again
  to continue." (BR-237).
- Attempt to create a room as a guest: refused, because only an account holder may own a room
  (BR-010). Copy: "Only colleagues with an account can create Data Rooms."
- Clock skew between API instances must not resurrect a revoked session: revocation is checked
  against a stored session record, not only token expiry (BR-106, BR-108).

---

### US-E01-02 — Sign up with email and password on a phone (the fallback path)

**As a** P1 Marcy Doyle standing at a client's site **I want** to create an account in under 45
seconds on my phone **so that** I can get a Data Room in front of a counterparty the same afternoon,
even when the company identity provider is not reachable from where I am.

This is the **fallback and break-glass path**, not the expected one: colleagues normally arrive
through the company identity provider (assumption A-IDP in the design stance above). It is
nevertheless R1 Must, because it is the only path a recipient who chooses to claim their grants
(US-E01-17) can use, and the only path available when the provider is down.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E01-01 |
| Traces to | FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, FR-AUTH-004, FR-AUTH-005, FR-AUTH-018, FR-AUTH-019, NFR-MOB-001, NFR-MOB-002, NFR-MOB-004, NFR-SEC-004, NFR-A11Y-011, NFR-A11Y-020, NFR-A11Y-021, BR-018, BR-020, BR-021, BR-054, BR-212 |

**Acceptance criteria**

1. **Given** the sign-up screen **when** it renders **then** it contains exactly three inputs (full
   name, email, password), one primary button labelled "Create account", a single "Sign in instead"
   link, and no other field, and the whole form is reachable without scrolling on a 360 x 640
   viewport with the software keyboard closed.
2. **Given** the email field **when** it is focused **then** `type="email"`,
   `inputmode="email"`, `autocomplete="email"`, `autocapitalize="off"` and `spellcheck="false"` are
   set, and the OS email autofill suggestion appears in the keyboard accessory bar.
3. **Given** the password field **when** it is focused **then** `autocomplete="new-password"` is set
   so the platform password manager offers to generate and save, pasting into the field is permitted,
   and a "Show password" toggle with a 48 x 48 CSS px hit area is present.
4. **Given** a password shorter than the 12-character minimum in BR-018, or one present in the
   configured breached-credential corpus **when** the user submits **then** the field shows inline
   error text "Use at least 12 characters" or "This password has appeared in a data breach. Choose
   another." the submit is not sent, and focus moves to the password field. No composition rule is
   applied, every Unicode character including spaces and emoji is accepted, and the accepted maximum
   is 256 characters (BR-018).
5. **Given** a valid submission **when** the API accepts it **then** the account is created in state
   `pending_verification`, a session is issued immediately so the user is never blocked at the door,
   the verification email is queued, and the client navigates to the workspace home with a persistent
   verification banner (see US-E01-03).
6. **Given** an email that already has an account **when** the user submits **then** the API returns
   HTTP 200 with a neutral body and the same "Check your email" screen is shown, an existing-account
   notice email is sent instead of a verification email, and neither the body nor the response-time
   envelope distinguishes the two cases (BR-054, FR-AUTH-018).
7. **Given** the sign-up rate limit in BR-213 is reached for an address or a source address **when** a
   further attempt is submitted **then** the API returns HTTP 429 with `Retry-After`, and the client
   shows "Too many attempts. Try again in 4 minutes." with a live countdown (see US-E01-07). The
   figures are the defaults in BR-213 and are administrator-configurable under BR-231.
8. **Given** the account is created **when** the analytics pipeline receives the event **then**
   `account_signup_completed` is emitted with the payload the dictionary in
   [10](../10-success-metrics-and-analytics.md) specifies, and `account_signup_started` was emitted
   when the form was first focused. Event names and payloads are owned by 10 (D13); this story names
   them and defines neither.
9. **Given** a screen reader is active **when** validation fails **then** the error text is
   associated with its input via `aria-describedby`, the form-level status is announced through a
   polite live region, and focus is not stolen mid-typing (SC 4.1.3).

**Mobile acceptance criteria**

- On a 360 x 640 viewport with the keyboard open, the "Create account" button remains fully visible
  and is not overlapped, using `env(keyboard-inset-bottom)` with a `visualViewport` resize fallback;
  QA verifies by focusing each field in turn on both iOS Safari and Chrome Android.
- All interactive targets are at least 48 x 48 CSS px with at least 8 CSS px between them. The
  "Show password" toggle sits inside the field but keeps its own 48 px target and does not overlap
  the text caret area.
- The primary button sits within the bottom third of the screen so it is reachable one-handed on a
  6.1 inch device; the form is operable with the thumb of the hand holding the phone.
- On the Lighthouse mobile preset (150 ms RTT, 1,638.4 Kbps down, 4x CPU), the sign-up route reaches
  interactive within 3 seconds and ships no more than 300 KiB of JavaScript and 1.2 MiB total on the
  critical path.
- If the app is backgrounded mid-form, the typed name and email (never the password) are persisted on
  `visibilitychange` to hidden and restored on next open; a QA engineer can verify by switching apps
  and killing the tab from the mobile tab switcher.
- On a flaky 4G connection, submitting once produces exactly one account: the request carries an
  idempotency key, the button enters a disabled busy state within 100 ms, and a retry after timeout
  returns the same result rather than a duplicate-email error.
- With the OS text size at 200 percent, no label is clipped and no control leaves the viewport
  (SC 1.4.4).

**Edge cases & negative paths**

- Offline submit: no request is attempted; the banner reads "You are offline. Your details are saved
  and will be submitted when you reconnect." and the submit retries once connectivity returns.
- Email with leading/trailing whitespace or mixed case: trimmed and lower-cased for the unique key,
  displayed as typed.
- Disposable-domain email: permitted in R1, flagged for abuse review under BR-229. Recorded as OQ04.
- Password manager fills a password into the name field: server rejects a name longer than 100 chars
  with "Enter your name, up to 100 characters."
- User taps "Create account" twice quickly: the second tap is swallowed by the busy state, not by a
  server error.

---

### US-E01-03 — Verify the email address

**As a** P1 Marcy Doyle **I want** to confirm my email in one tap from my phone **so that** I can
send share links that recipients will actually trust and that will not bounce.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E01-02 |
| Traces to | FR-AUTH-005, FR-AUTH-006, NFR-A11Y-011, NFR-COMPAT-008, BR-021, BR-022, BR-213 |

**Acceptance criteria**

1. **Given** an account in `pending_verification` **when** the user opens the app **then** a
   dismissible-per-session banner reads "Confirm your email to share Data Rooms. Resend email." with
   a 48 px "Resend" target, and the banner is announced once by a polite live region.
2. **Given** the verification email **when** the user taps its link on the same phone **then** the
   app opens (installed Home Screen web app if present, browser otherwise), the account moves to
   `active`, and a success toast reads "Email confirmed."
3. **Given** the verification token **when** it is validated **then** it is single-use, carries at
   least 128 bits of entropy from a cryptographically secure source, expires 24 hours after issue, is
   bound to the account (BR-022), and a second use returns "This link has already been used. You are
   all set." rather than an error.
4. **Given** an expired token **when** it is opened **then** the screen offers a single "Send a new
   link" button and sends to the address on file only.
5. **Given** an unverified account **when** the user attempts to create a share (E07) **then** the
   API refuses with a typed error naming email verification as the blocker — a 403 is correct here
   because the principal holds a grant on the target and is exceeding a state gate, not probing for
   existence (BR-021, BR-233) — and the client shows a bottom sheet: "Confirm your email before
   sharing. We sent a link to marcy@ourcompany.example." with "Resend" and "Change email" actions.
6. **Given** an unverified account **when** the user creates rooms, folders and uploads **then**
   those actions all succeed, because verification gates outbound sharing only (BR-021).
7. **Given** the resend limit in BR-213 (3 per 15 minutes per address, default) **when** it is
   exceeded **then** the API returns 429 and the button shows "You can resend in 6 minutes."
8. **Given** the verification link is opened on a different device from the one that signed up
   **when** it is validated **then** verification still succeeds and the originating device reflects
   the new state within 60 seconds or on next foreground, whichever is sooner.

**Mobile acceptance criteria**

- The banner occupies at most 96 CSS px in height at 360 px width, never covers the bottom action
  bar, and pushes content rather than overlapping it so nothing is obscured (SC 2.4.11).
- Tapping the emailed link while the installed iOS web app exists must land in the web app; QA
  verifies both the installed and non-installed cases, and the copy never claims the app will open
  when it cannot.
- On a flaky connection the verification screen shows a determinate spinner for at most 10 seconds
  then "Still working. Check your connection and tap Retry." with a 48 px Retry.
- With a screen reader, the banner's "Resend" control has an accessible name containing the visible
  text "Resend" (SC 2.5.3).

**Edge cases & negative paths**

- Email never arrives: after two resends the sheet adds "Not arriving? Check spam, or use a different
  address." linking to change-email (US-E01-16).
- Link opened in an in-app WebView (LinkedIn, Gmail): verification still completes; the page then
  shows "Open in your browser to continue" with copy-link, because WebViews lack Web Share Target and
  installability.
- User changes email before verifying: the old token is invalidated immediately and a new one issued.
- Token in a URL logged by a mail scanner: single-use plus the 24-hour expiry of BR-022 limits
  exposure; the API records `email_verification_completed` with the requesting address for E11.

---

### US-E01-04 — Sign in with email and password

**As a** P1 Marcy Doyle returning after a week **I want** to sign in with one tap of my saved
password **so that** I am inside a room in seconds rather than fighting a form on a phone.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E01-01, US-E01-02 |
| Traces to | FR-AUTH-008, FR-AUTH-003, FR-AUTH-004, FR-AUTH-019, FR-AUTH-023, NFR-MOB-002, NFR-MOB-004, NFR-A11Y-020, NFR-SEC-004, NFR-PERF-007, BR-018, BR-054, BR-212, BR-233 |

**Acceptance criteria**

1. **Given** the sign-in screen **when** it renders **then** it shows email, password,
   "Sign in", "Email me a link instead" and "Forgot password", and nothing else above the fold at
   360 x 640.
2. **Given** the password field **when** it renders **then** `autocomplete="current-password"` is
   set, paste is permitted, and the platform password manager offers the saved credential.
3. **Given** correct credentials **when** submitted **then** a session is created (US-E01-05), the
   user lands on the workspace home, and `session_signed_in` is emitted with the payload the
   dictionary in [10](../10-success-metrics-and-analytics.md) specifies.
4. **Given** incorrect credentials **when** submitted **then** the response is a generic "That email
   or password is not right." with HTTP 401, identical timing characteristics regardless of whether
   the email exists (BR-054), and the password field is cleared while the email field is kept.
5. **Given** an account locked by the progressive lockout in BR-212 **when** correct credentials are
   submitted **then** the API returns 423 with `lockedUntil`, and the screen shows "Too many attempts.
   Try again in 12 minutes, or reset your password." with a working reset link and a live countdown
   (FR-AUTH-019).
6. **Given** an account in `pending_deletion` (US-E01-18) **when** the user signs in **then** sign-in
   succeeds and a sheet offers "Cancel deletion and keep my account" with the exact date the data is
   destroyed.
7. **Given** a successful sign-in from a device with no prior session **when** it completes **then**
   a `security_event` of type `new_device_sign_in` is recorded for US-E01-15.
8. **Given** the user has a registered passkey **when** the sign-in screen renders **then** the
   passkey option is presented first and the password fields are still available below it, never
   removed (FR-AUTH-009, and SC 3.3.8 requires the alternative to remain).
9. **Given** the company identity provider is configured **when** the sign-in screen renders for a
   colleague **then** the provider button is the first and visually primary control, and the email,
   magic-link and passkey controls remain present below it as the fallback path. No requirement in
   this story is removed by the presence of the provider; the SSO requirement set itself is out of
   scope for this pass (see the design stance and OQ08).

**Mobile acceptance criteria**

- Keyboard-open layout: the "Sign in" button remains visible and tappable with the keyboard up at
  360 x 640 on iOS Safari 17+ and Chrome Android; the field with focus is never behind the keyboard.
- Autofill from the OS keychain must complete sign-in with zero characters typed; QA performs the
  full flow without touching the keyboard.
- Round-trip budget: on the Lighthouse mobile preset, from tapping "Sign in" to the workspace home
  first contentful paint is at most 3 seconds at p75; the button shows a busy state within 100 ms of
  tap so INP stays under 200 ms.
- With the OS in dark mode the screen renders dark without a flash of light background; with the OS
  in landscape on a phone (compact height) the form remains operable with no orientation lock
  (SC 1.3.4).
- If the connection drops between submit and response the client retries once with the same
  idempotency key and otherwise shows "We could not reach the server. Check your connection and tap
  Sign in again."

**Edge cases & negative paths**

- Caps-lock or a trailing space in the password: no silent trimming of the password; the error copy
  adds "Passwords are case sensitive."
- Session already valid on this device: opening the sign-in URL redirects to home rather than showing
  the form.
- Deep link into a room while signed out: the copy is always "Sign in to continue." The room name is
  never shown before authentication, because the visitor is by definition a principal holding no
  grant at that moment and the name would be an existence oracle (BR-233, BR-052). After a successful
  sign-in the user lands on the requested destination (FR-AUTH-023) or on the indistinguishable
  not-found response.
- Two tabs signing in as different users: the second sign-in wins; the first tab detects the subject
  change on next request and shows "You are now signed in as another account. Reload to continue."

---

### US-E01-05 — Session issuance, refresh and mobile session longevity

**As a** P1 Marcy Doyle who works from her phone all week **I want** to stay signed in for months on
my own device **so that** I never lose a buyer because I was locked out in a parking lot.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E01-01, US-E01-04 |
| Traces to | FR-AUTH-011, FR-AUTH-012, FR-AUTH-023, NFR-SEC-005, NFR-SEC-006, NFR-MOB-014, NFR-AVAIL-001, BR-023, BR-024, BR-077, BR-108, BR-112, BR-134 |

**Acceptance criteria**

1. **Given** a successful authentication **when** a session is created **then** the server persists a
   session row containing `sessionId`, `subjectId`, `deviceLabel`, `createdAt`, `lastSeenAt`,
   `ipFirstSeen`, `userAgent`, `trusted` and `revokedAt`, and issues an access credential of at most
   **5 minutes (BR-023)** plus a refresh credential.
2. **Given** the client is a browser **when** credentials are transported **then** the refresh
   credential is an `HttpOnly`, `Secure`, `SameSite=Lax` cookie scoped to the API path, and no
   long-lived credential is ever written to `localStorage` or `sessionStorage`.
3. **Given** a session marked `trusted` on a mobile device **when** it is refreshed **then** the
   refresh credential is rotated on every use and its lifetime is at most **90 days (BR-023)**, after
   which full re-authentication is required. A colleague who keeps using the same device is not asked
   for a credential inside that window (FR-AUTH-012 sets the floor at 30 days of continued activity).
4. **Given** an access token expires mid-session **when** the client makes its next request **then**
   the refresh happens transparently in a single round trip, the original request is replayed once,
   and the user sees no interruption and no re-authentication prompt.
5. **Given** a refresh credential is presented **when** the server detects it has already been
   exchanged (replay) **then** the entire session family is revoked, all tokens for that session are
   rejected, a `security_event` of type `refresh_replay_detected` is written, and the client is signed
   out with "For your security we signed you out. Please sign in again."
6. **Given** a session is revoked server-side **when** the client next calls the API **then** the
   call fails with 401 `SESSION_REVOKED` inside the propagation bound of **5 s at p95 and 60 s
   absolutely (BR-108)**, which the 5-minute credential ceiling (BR-023) and the 30-second
   loaded-page re-check (BR-112) together make achievable, and the client discards all cached room
   data for that subject before showing the sign-in screen (BR-113).
7. **Given** the page is frozen or discarded by the browser **when** it is restored **then** the
   client re-validates the session on `visibilitychange` to visible before rendering any room content
   from cache, and shows cached content only after a successful validation or an explicit offline
   state.
8. **Given** a guest or anonymous link-visitor session (US-E01-08) **when** it is issued **then** it
   may never outlive the grant or link that authorised it and carries an absolute ceiling of **12
   hours (BR-024)**, after which the recipient must present the invitation or link again. It is never
   marked `trusted`.
9. **Given** the API is scaled to multiple instances **when** a session is revoked on one **then**
   revocation is authoritative from the shared store, not from instance memory, and a QA engineer can
   verify by revoking on one device and failing a request from another inside the BR-108 bound.

**Mobile acceptance criteria**

- Cold-start from an installed Home Screen web app with a valid session reaches the workspace home
  with no auth screen flash; measured p75 on the baseline device class (Galaxy A24 4G class) at at
  most 2.5 seconds LCP on the reference network.
- Returning to the app after 30 days of not opening it, on the same device, requires no password
  (FR-AUTH-012, verifiable by clock manipulation in a test build) unless the step-up policy in
  US-E01-13 triggers.
- Storage honesty: any client-side cache that holds session-adjacent data is treated as evictable.
  The client calls `navigator.storage.persist()` once, never asserts "saved on your device", and shows
  "Cached copy, may be cleared by your browser" wherever cached content is surfaced. On WebKit,
  storage for an origin with no user interaction in the last seven days of browser use is deleted
  wholesale, so no flow may depend on it.
- Backgrounding mid-refresh must not corrupt state: the refresh is idempotent, and a page frozen
  during refresh resumes by retrying from a clean state on next foreground.
- Screen reader: no session event announces itself unless it changes what the user can do; forced
  sign-out is announced assertively.

**Edge cases & negative paths**

- Device clock wrong by hours: token validation uses server time; the client never gates on local
  time.
- User clears browser storage: the refresh cookie survives or does not; if it does not, the user sees
  the sign-in screen with the email prefilled from nothing (no PII recovery) and the copy "Signed out.
  Sign in to continue."
- Private/incognito browsing: session works for the tab lifetime; the app shows "This browsing mode
  clears your session when you close it."
- In-app WebView (embedded browser in a mail client): third-party cookie and storage restrictions may
  break refresh. The app detects standalone-vs-WebView and shows "Open in Safari or Chrome to stay
  signed in."

---

### US-E01-06 — Reset a forgotten password

**As a** P1 Marcy Doyle who has forgotten which password she used **I want** to reset it from my
phone in two taps and one paste **so that** I am not locked out of a live deal.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 3 |
| Depends on | US-E01-04 |
| Traces to | FR-AUTH-017, FR-AUTH-018, NFR-SEC-004, NFR-SEC-009, NFR-A11Y-021, BR-022, BR-054, BR-213 |

**Acceptance criteria**

1. **Given** the "Forgot password" screen **when** the user submits an email **then** the response is
   always HTTP 200 and always the same screen ("If that address has an account, we have sent a reset
   link."), regardless of whether the account exists.
2. **Given** a reset link **when** it is opened **then** it is single-use, expires in 60 minutes, and
   opens a screen with one password field (`autocomplete="new-password"`) and a "Set new password"
   button.
3. **Given** the new password is accepted **when** the change is committed **then** every other
   session for that subject is revoked, the current device is signed in with a fresh session, and an
   email "Your password was changed" is sent with the device label and approximate location.
4. **Given** three reset requests for the same address within 15 minutes **when** a fourth is
   requested **then** the API returns 429 and no additional email is sent.
5. **Given** a reset link is used **when** the same link is opened again **then** the screen reads
   "This link has already been used. Sign in, or request a new link."
6. **Given** an account with a passkey registered **when** the password is reset **then** existing
   passkeys remain valid and are not silently removed, and the confirmation screen states that.
7. **Given** the account was locked by US-E01-07 **when** the password is reset successfully **then**
   the lock is cleared and the failure counter is reset to zero.
8. **Given** a screen reader **when** the new password fails policy **then** the specific rule that
   failed is announced, not a generic "invalid".

**Mobile acceptance criteria**

- The reset screen is a single field plus one button, fully visible with the keyboard up at 360 x 640,
  with the button above `env(keyboard-inset-bottom)`.
- Pasting a generated password from a password manager is permitted; a paste of up to 128 characters
  is accepted.
- Opening the reset link from the phone's mail app must land in the installed web app when present,
  otherwise the browser, and must not lose the token through a redirect chain; QA verifies on iOS
  Mail, Gmail iOS and Gmail Android.
- On a flaky connection, submitting the new password shows a busy button within 100 ms and, on
  timeout, "We could not confirm the change. Tap again; your link is still valid for 42 minutes."

**Edge cases & negative paths**

- Reset requested for an unverified account: allowed, and completing the reset also verifies the
  email, because possession of the mailbox has been proved.
- Reset while another session is mid-upload (E04): that session is revoked; the upload queue is
  preserved locally and resumes after the next sign-in, with the banner "Sign in to resume 3 uploads."
- Reset link forwarded to someone else: single-use plus 60-minute expiry; the change-notification
  email gives the real owner a recovery path and a "Secure my account" link that signs out everywhere.
- Same password reused: rejected with "Choose a password you have not used on this account before."

---

### US-E01-07 — Rate limiting, lockout, and the lockout experience

**As a** P1 Marcy Doyle **I want** attack protection that tells me plainly what happened and when I
can try again **so that** a fat-thumbed password on a phone does not feel like being banned.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E01-04, US-E01-06 |
| Traces to | FR-AUTH-013, NFR-SEC-003, NFR-A11Y-004, NFR-OBS-001, BR-021, BR-027 |

**Acceptance criteria**

1. **Given** the auth endpoints **when** requests arrive **then** limits are enforced server-side on
   three independent keys: per IP, per account, and per (IP, account) pair, and exceeding any one
   returns HTTP 429 with a `Retry-After` header.
2. **Given** the published limits (Estimate, tunable per BR-027): sign-in 10 attempts per account per
   15 minutes, 30 per IP per 15 minutes; password reset 3 per address per 15 minutes; magic link 5 per
   address per hour; verification resend 3 per 15 minutes **when** any is exceeded **then** the limit
   that was hit is recorded in telemetry with its key type, and no limit is enforced only on the
   client.
3. **Given** 10 consecutive failed sign-ins for one account **when** the 11th is attempted **then**
   the account enters a soft lock for 15 minutes, the API returns HTTP 423 with `lockedUntil`, and
   correct credentials during the lock still return 423.
4. **Given** a soft lock **when** the user views the screen **then** the copy is "Too many attempts.
   Try again in 14:32, or reset your password to get in now." with a live countdown updated at most
   once per second and announced through a polite live region at 60-second intervals, not every tick.
5. **Given** repeated soft locks (three within 24 hours) **when** the third clears **then** the
   account requires a successful password reset or magic link before password sign-in is accepted
   again, and the user is told exactly that.
6. **Given** a rate-limited request **when** the client receives 429 **then** the client does not
   retry automatically before `Retry-After`, and the submit button is disabled with the remaining time
   as its label.
7. **Given** a lockout or limit event **when** it occurs **then** a `security_event` is written for
   E11 with type `auth_rate_limited` or `account_locked`, including key type and count, and an email
   is sent to the account on lock (not on every 429).
8. **Given** a guest opening a share link **when** the guest's email fails the share's email-capture
   gate repeatedly **then** the same limiter applies per share token, and the copy is "Too many
   attempts on this link. Ask the sender to re-send it." without disclosing whether the email is on
   the invite list.

**Mobile acceptance criteria**

- The countdown never causes layout shift: the timer occupies a fixed-width slot so CLS contribution
  is 0 at 360 px width.
- The disabled button retains a 48 x 48 CSS px target and a contrast ratio of at least 3:1 against
  its background in both themes so it is visibly present but clearly inactive.
- On a flaky connection a 429 must not be mistaken for an offline state: the offline banner and the
  rate-limit message are mutually exclusive, and QA can verify by throttling to offline (shows
  offline) versus triggering 429 online (shows countdown).
- With a screen reader, the lock state is announced once when it appears, and the "Reset password"
  alternative is the next focusable control.

**Edge cases & negative paths**

- Shared IP (office, carrier NAT): per-IP limits are set high enough that a 30-person office cannot
  be locked out by normal use; per-account limits do the real work. Recorded as OQ02 for tuning with
  real traffic.
- Client clock drift makes the countdown wrong: the countdown is derived from `Retry-After` seconds
  plus a monotonic timer, never from wall-clock comparison.
- User force-quits during a lock: on reopen, the app re-derives the remaining time from the server on
  first request rather than trusting local state.
- Credential-stuffing wave: limits are per key so a single attacker IP cannot lock every account it
  touches; account lock requires failures against that specific account.

---

### US-E01-08 — Guest access to a share without creating an account

**As a** P2 Dev Raman on a commuter train **I want** to tap a broker's link and be reading the
document within two taps **so that** I can decide in 90 seconds whether this deal is worth my
weekend, without signing up for anything.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 8 |
| Depends on | US-E01-01, US-E01-05 |
| Traces to | FR-AUTH-014, FR-AUTH-017, NFR-SEC-001, NFR-PRIV-001, NFR-MOB-001, NFR-A11Y-001, BR-001, BR-002, BR-004, BR-005, BR-020 |

**Acceptance criteria**

1. **Given** a valid permissioned share link **when** a recipient opens it on a phone **then** the
   destination content (folder listing or document viewer) is rendered without any account creation,
   password, app install or interstitial, and the tap count from link to visible content is at most
   two including the email-capture step when the share requires it.
2. **Given** a share configured as public link with no email capture **when** it is opened **then**
   an anonymous guest session is created bound to the share token, and the content renders with zero
   taps beyond opening the link.
3. **Given** a share configured with email capture or invite-by-email **when** it is opened **then**
   one screen asks for the email address only, with `type="email"`, `autocomplete="email"` and a
   single "Continue" button, and a one-time code or link is used to bind the guest to that address
   when the share is invite-only.
4. **Given** a guest session **when** the guest calls any API endpoint **then** the server derives
   permissions from the share grant alone, ignores any client-supplied role, and returns 403
   `READ_ONLY` for every mutation when the share is read-only, including download when the
   download-allowed flag is false.
5. **Given** the owner revokes the share while the guest is mid-session **when** the guest's next
   request is made **then** the request fails with 403 `SHARE_REVOKED` within at most 10 seconds of
   the revocation for a foregrounded client (client polls or receives a push, whichever is available),
   the current view is replaced by "This link is no longer available. Contact the person who shared
   it." and any locally cached content for that share is purged from the client cache.
6. **Given** a guest session **when** the guest tries to reach a sibling folder, another room, or any
   resource outside the share's scope **then** the API returns 404, never 403, so the existence of
   out-of-scope content is not disclosed (BR-002).
7. **Given** a guest identity **when** it is created **then** the only personal data stored is the
   email (when captured), the coarse location derived from IP, the user agent and the access
   timestamps, and the guest record is deleted with the share or at the share retention limit,
   whichever is first (NFR-PRIV-001).
8. **Given** a guest who returns to the same link on the same device within the guest session
   lifetime **when** they open it **then** they are not re-challenged for email, and their last read
   position is restored (see [E05](./epic-05-viewing-preview-and-file-details.md)).
9. **Given** a share with an expiry **when** it lapses **then** the guest session is invalid from the
   expiry instant server-side, and the guest sees "This link expired on 12 Sep 2026." with a "Request
   access" button that notifies the owner.
10. **Given** a guest action **when** it is recorded **then** the E11 activity log shows the guest's
    email (or "Anonymous via public link"), the share it came through, and the action, so the owner can
    answer "who saw what".

**Mobile acceptance criteria**

- On a 360 x 640 viewport over the Lighthouse mobile preset, the shared-content first contentful paint
  is at most 2.5 seconds at p75, and the recipient route ships at most 200 KiB of JavaScript because
  it must not pull in the owner-side application shell.
- The email-capture screen is a single field plus one 48 px button, fully visible with the keyboard
  open, and pasting an email is permitted.
- No modal appears over the content on first open. No "install our app" prompt, no cookie wall beyond
  what law requires, no newsletter capture. QA fails the story if any interstitial precedes content.
- Android hardware and gesture back from the document viewer returns to the shared folder listing, and
  from the listing exits the app rather than looping; every viewer and sheet is its own history entry.
- iOS has no system back, so an in-app back control of at least 48 x 48 CSS px is present at the top
  leading edge of every guest screen.
- On a dropped connection mid-read, already-rendered pages remain visible with a "You are offline"
  banner, and no already-visible content disappears.
- With a screen reader, the guest lands with focus on the document title heading, and the read-only
  state is exposed as static text ("Read-only") rather than as a disabled control the user hunts for.

**Edge cases & negative paths**

- Link opened in an in-app WebView with third-party storage blocked: the guest session falls back to a
  token in the URL fragment for the tab lifetime, and the screen offers "Open in your browser to keep
  your place."
- Guest email typo on an invite-only share: "We cannot find an invitation for that address. Check the
  address, or ask the sender to invite it." with no disclosure of which addresses are invited.
- Guest forwards the link to a colleague on an invite-only share: the colleague's email fails the
  check; the owner sees an `access_denied` event naming the attempted address.
- Guest attempts a download when the download flag is off: server returns 403; the UI shows no
  download control at all and, if a stale client shows one, the tap produces "Downloads are turned off
  for this link."
- Concurrent revocation and download: an in-flight download stream is terminated server-side on
  revocation, and the partially written file is not resumable.
- Guest quota abuse (thousands of requests): per-share rate limit from US-E01-07 applies.

---

### US-E01-09 — Sign out on this device, and sign out everywhere

**As a** P1 Marcy Doyle whose phone was left in a client's office **I want** to end every session
everywhere from any device **so that** confidential deal material is not sitting unlocked in someone
else's building.

| | |
|---|---|
| Priority | Must |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E01-05 |
| Traces to | FR-AUTH-009, FR-AUTH-020, NFR-SEC-001, NFR-SEC-002, NFR-A11Y-004, BR-005, BR-019 |

**Acceptance criteria**

1. **Given** the account screen **when** the user taps "Sign out" **then** the current session is
   revoked server-side before the client clears local state, all cached room content for that subject
   is deleted from the client cache, and the user lands on the sign-in screen.
2. **Given** the account screen **when** the user taps "Sign out of all devices" **then** a
   confirmation sheet states exactly what will happen: "This signs out 4 devices, including this one.
   Uploads in progress will stop." with "Sign out everywhere" (destructive style) and "Cancel".
3. **Given** confirmation **when** the request succeeds **then** every session row for the subject is
   marked revoked, all refresh credentials are invalidated, and any access token issued before the
   revocation instant is rejected on its next use.
4. **Given** another device with an open app **when** its next API call is made **then** it receives
   401 `SESSION_REVOKED` within at most one access-token lifetime (Assumption: 10 minutes worst case,
   under 10 seconds when the device is foregrounded and receives the revocation push), it purges
   cached content, and it shows "You were signed out on all devices."
5. **Given** an in-flight upload on a revoked session **when** the next chunk is sent **then** the
   server rejects it with 401, the client marks the upload "Signed out. Sign in to resume." and
   preserves the local queue so no user data is lost.
6. **Given** sign-out-everywhere **when** it completes **then** guest sessions issued by that owner's
   shares are unaffected, because they belong to the recipients, and the confirmation copy says so:
   "Share links keep working. Revoke a share from Sharing."
7. **Given** the action **when** it completes **then** a `security_event` of type
   `signed_out_everywhere` is written with the initiating device, and an email is sent to the account.
8. **Given** the network fails mid-request **when** the client cannot confirm **then** the client
   still clears local state and shows "Signed out on this device. We could not reach the server to
   sign out your other devices. Try again from Security when you are back online." and it queues the
   retry.

**Mobile acceptance criteria**

- The confirmation is a modal bottom sheet, not an iOS action sheet, because it carries explanatory
  text; it has at most three buttons, a 48 px minimum drag handle, dismisses on swipe-down, and the
  destructive button is visually distinguished and placed so it is not the nearest target to the
  thumb's resting position.
- "Sign out" is never the first item in the account list and is never adjacent to a frequently used
  control; there is at least 16 CSS px of separation from the nearest other action.
- Only one sheet is presented at a time; the confirmation replaces any open sheet rather than stacking
  on it.
- On a 360 x 640 viewport the sheet content fits at the medium detent without scrolling for the
  standard four-device case, and grows to large only when the device list exceeds five.
- The result is announced through an assertive live region because it changes what the user can do.

**Edge cases & negative paths**

- Only one session exists: the "all devices" copy reads "This signs out 1 device, this one."
- Revocation succeeds but the response is lost: idempotent, so the retry is harmless.
- The user signs out everywhere from a device that then goes offline: local state is cleared
  immediately regardless of the response, so the device cannot be used to read cached content.
- Password change (US-E01-06 and US-E01-16) implies sign-out everywhere and says so on the
  confirmation screen.

---

### US-E01-10 — Magic-link sign-in

**As a** P1 Marcy Doyle who cannot remember which password she used **I want** to sign in by tapping
a link in my email **so that** I never lose access to a live deal because of a password.

| | |
|---|---|
| Priority | Should |
| Release | R1 |
| Estimate | 5 |
| Depends on | US-E01-04, US-E01-07 |
| Traces to | FR-AUTH-004, NFR-SEC-002, NFR-SEC-003, NFR-A11Y-005, BR-019, BR-027 |

**Acceptance criteria**

1. **Given** the sign-in screen **when** the user taps "Email me a link instead" **then** one email
   field is shown and submitting it always returns the same neutral confirmation screen.
2. **Given** a magic link **when** it is opened **then** it is single-use, expires in 15 minutes, is
   bound to the requesting browser by a paired cookie when available, and signs the user in directly
   to the workspace home.
3. **Given** the link is opened in a different browser from the one that requested it **when** the
   paired cookie is absent **then** the user is asked to enter the 6-digit code shown in the same
   email, pasting is permitted, and only then is the session issued.
4. **Given** the 6-digit code path **when** the code field renders **then** it accepts a paste of the
   whole code, uses `autocomplete="one-time-code"`, `inputmode="numeric"`, and does not split the
   code into six separate inputs that break paste and screen readers.
5. **Given** five link requests for one address within an hour **when** a sixth is requested **then**
   the API returns 429 and no email is sent.
6. **Given** a used or expired link **when** it is opened **then** the screen reads "This link is no
   longer valid. Request a new one." with a single button.
7. **Given** a successful magic-link sign-in **when** the session is created **then** it is marked
   `trusted` only after a second successful sign-in from the same device, so a one-off email access
   does not create a 90-day session on a borrowed phone.
8. **Given** the account has no password set (created by magic link only) **when** the user visits
   Security **then** "Set a password" and "Add a passkey" are offered and neither is mandatory.

**Mobile acceptance criteria**

- The whole flow is operable one-handed: email field, one button, then a code field with a 48 px
  submit; nothing requires two hands or a second device.
- Tapping the link from the phone's mail app while the installed Home Screen web app exists opens the
  web app, not a second browser tab, and the copy never promises which app will open.
- The code screen fits above the keyboard at 360 x 640 with the code field focused; the keyboard is
  numeric.
- If the app is backgrounded while the user goes to the mail app, returning does not lose the pending
  state: the code screen is restored with the address still displayed.
- With a screen reader, the code field has an accessible name "6-digit sign-in code" and errors are
  announced politely.

**Edge cases & negative paths**

- Mail scanner pre-fetches the link and consumes it: the link is consumed only on a POST from the
  confirmation screen ("Yes, sign me in"), so a GET pre-fetch cannot burn it.
- Corporate mail rewrites the URL: the code fallback always works.
- Link opened on a desktop while the phone requested it: code path handles it, and the desktop session
  is not marked trusted.
- Account locked by US-E01-07: magic link is still permitted, because it proves mailbox possession,
  and using it clears the lock. This is stated in the lock copy.

---

### US-E01-11 — Active sessions and devices screen

**As a** P4 Ashley Kim working across a MacBook, an iPhone and an iPad **I want** to see every place
I am signed in and end any one of them **so that** I can clean up a device I no longer use without
signing out of everything.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E01-05, US-E01-09 |
| Traces to | FR-AUTH-008, FR-AUTH-009, NFR-SEC-001, NFR-A11Y-002, NFR-A11Y-004, BR-005 |

**Acceptance criteria**

1. **Given** the Security screen **when** it loads **then** it lists every non-revoked session for the
   subject as a row showing device label, browser, approximate location from IP, "Last active" as a
   relative time, and a "This device" marker on the current one.
2. **Given** a session row **when** the user taps its overflow button **then** a sheet offers "Sign
   out this device" and "Details", and the same items are available from a long-press on the row.
3. **Given** "Sign out this device" on another session **when** confirmed **then** that session alone
   is revoked, the row disappears with an undoable-for-10-seconds toast "Signed out iPhone 14. Undo",
   and undo re-issues nothing but cancels the pending revocation if tapped inside the window.
4. **Given** the current session's row **when** the user attempts to sign it out **then** the copy is
   "This will sign you out here" and it behaves as US-E01-09 sign-out.
5. **Given** more than 20 sessions **when** the list renders **then** it pages with a "Load more"
   control and a count "24 active sessions", never an unbounded infinite scroll.
6. **Given** any session row **when** it is rendered **then** no full IP address is shown by default,
   only city and country plus "Show details" to reveal the IP, because the list may be shown on a
   phone in public.
7. **Given** a session is revoked from another device **when** this screen is next foregrounded
   **then** the list refreshes and the removed row is gone without a manual reload.
8. **Given** the device label is unknown **when** it renders **then** it falls back to "Unrecognised
   browser" plus the user-agent family, never to an empty cell.

**Mobile acceptance criteria**

- Each row is at least 56 CSS px tall; the overflow button is 48 x 48 CSS px with at least 8 px from
  the row's own tap target, and the row's primary tap opens Details rather than triggering a
  destructive action.
- Swipe on a row is not the only route to sign-out; if a swipe action is implemented it is limited to
  one action in one direction, pairs with the 10-second undo, does not start within 24 CSS px of
  either screen edge (the Android system back gesture owns both edges), and is duplicated in the
  overflow.
- Long-press opens the context menu and does not also enter a selection mode; the choice is consistent
  with every other list in the product.
- The list is readable at 360 px width with no horizontal scrolling and with 200 percent text size:
  location and last-active wrap to a second line rather than truncating the overflow button off
  screen.
- Pull-to-refresh is available and a visible "Refresh" item also exists in the screen's overflow,
  because a gesture may never be the only mechanism.
- Live region announces "Signed out iPhone 14, 3 active sessions remain."

**Edge cases & negative paths**

- The same physical device appears twice (browser plus installed web app): both are listed with
  distinct labels and a hint "Installed app" so the user is not confused into revoking the wrong one.
- Offline: the screen shows the last cached list greyed with "Showing last known devices. Reconnect to
  manage." and all destructive controls disabled.
- Revoking the session that is currently uploading from another device: that device shows the paused
  upload state from US-E01-09 criterion 5.
- A session revoked while its row is being tapped: the API returns 409 `ALREADY_REVOKED` and the row
  is removed with "That device was already signed out."

---

### US-E01-12 — Passkey registration and passkey sign-in

**As a** P1 Marcy Doyle **I want** to sign in with Face ID **so that** I never type a password on a
phone again.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E01-04, US-E01-11 |
| Traces to | FR-AUTH-006, NFR-SEC-002, NFR-A11Y-005, NFR-COMPAT-001, BR-019 |

**Acceptance criteria**

1. **Given** a signed-in user on a supporting browser **when** they open Security **then** "Add a
   passkey" is offered, and on an unsupporting browser the option is hidden with a one-line
   explanation rather than a broken button.
2. **Given** "Add a passkey" is tapped **when** the WebAuthn ceremony runs **then** the credential is
   created with `residentKey: 'required'` and `userVerification: 'preferred'`, the platform
   authenticator is preferred, and the resulting credential is stored against the subject with a
   user-editable label defaulting to the device name.
3. **Given** at least one passkey exists **when** the user opens the sign-in screen **then** a
   "Sign in with a passkey" button is shown first and conditional UI (autofill-driven passkey
   selection) is offered on browsers that support it.
4. **Given** a passkey assertion succeeds **when** the server validates it **then** the challenge is
   verified as single-use and origin-bound, the session is created exactly as in US-E01-05, and
   `sign_in_completed` carries `method: 'passkey'`.
5. **Given** a passkey assertion is cancelled by the user **when** the ceremony aborts **then** the
   screen returns to its prior state with no error toast, because cancellation is not a failure.
6. **Given** the Security screen **when** a passkey row is present **then** it can be renamed and
   removed, removal requires a step-up (password, magic link or another passkey), and the last passkey
   may be removed only if a password or magic-link path still exists.
7. **Given** a user with a passkey **when** they still choose password sign-in **then** it continues
   to work; passkeys never become the only route (SC 3.3.8 alternative requirement).
8. **Given** a passkey is used **when** the session is created **then** it is eligible to be marked
   `trusted` immediately, because the ceremony included user verification.

**Mobile acceptance criteria**

- The registration ceremony completes without leaving the app: on iOS the Face ID sheet is presented
  by the browser, and on cancel the app is still on the Security screen with no half-created
  credential.
- Support matrix is stated in the UI, not assumed: passkeys are available on Chrome 67+, Chrome
  Android 70+, Safari 13+ (so iOS 13+) and Firefox 60+ / Firefox Android 92+; on anything older the
  option is absent.
- Copy honesty: the button says "Sign in with a passkey" and the Security screen says "Uses Face ID,
  Touch ID or your device passcode to prove it is you." It never says "the app is locked", because no
  web API locks the app.
- The passkey button is at least 48 CSS px tall and positioned in the lower third of the sign-in
  screen for one-handed reach.
- If the ceremony is interrupted by a call or by backgrounding, returning to the app shows the
  sign-in screen unchanged with no spinner stuck on screen.

**Edge cases & negative paths**

- No platform authenticator (older Android, desktop without Windows Hello): the button is hidden and
  Security shows "Your browser or device does not support passkeys yet."
- Passkey synced from another platform account and used on a new device: works, because
  `residentKey: 'required'` plus discoverable credentials.
- User removes the passkey from the OS keychain but the server still lists it: assertion fails, and
  Security shows "This passkey no longer works on this device. Remove it?"
- Enterprise device policy blocks WebAuthn: fall back to magic link, and record the failure as a
  telemetry event so support can see the pattern.

---

### US-E01-13 — Step-up re-authentication when returning to the app

**As a** P1 Marcy Doyle whose phone is handed round a client's office **I want** the app to ask me to
confirm it is me before it reveals a Data Room after a long absence **so that** confidential material
is not exposed by an unlocked phone, and my lawyer believes mobile is safe.

| | |
|---|---|
| Priority | Must |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E01-05, US-E01-12 |
| Traces to | FR-AUTH-010, NFR-SEC-002, NFR-MOB-006, NFR-A11Y-005, BR-019 |

**Acceptance criteria**

1. **Given** an account-level setting "Require confirmation after inactivity" with options Off, 15
   minutes, 1 hour, 8 hours (default: 1 hour for owners, Off for guests) **when** it is set **then**
   the policy is stored server-side against the subject, not in client storage.
2. **Given** the policy interval has elapsed since the last verified interaction **when** the app
   returns to the foreground (`visibilitychange` to visible) or the app is cold-started **then** a
   full-screen lock view is shown before any room content renders, and no room names, file names or
   thumbnails are visible behind or around it.
3. **Given** the lock view **when** it renders **then** it offers the strongest available ceremony
   first: passkey assertion where registered, otherwise password, otherwise magic link, and it always
   offers "Sign out" as an alternative.
4. **Given** a successful step-up **when** it completes **then** the server records a fresh
   `lastVerifiedAt` on the session, the previous screen is restored exactly including scroll position
   and any open sheet, and no work in progress is lost.
5. **Given** a failed step-up **when** attempts exceed the US-E01-07 limits **then** the session is
   revoked and the user is signed out with "For your security we signed you out."
6. **Given** the step-up is required **when** the client is offline **then** the lock view still
   appears and content stays hidden, because the gate is client-enforced for display but the session
   remains unusable for API calls until the server verifies; the copy is "Reconnect to confirm it is
   you."
7. **Given** a mutating request arrives with a session whose `lastVerifiedAt` is older than the policy
   **when** the endpoint is a high-risk one (share creation, share revocation, room delete, account
   settings) **then** the server returns 401 `STEP_UP_REQUIRED` regardless of what the client did, so
   the gate is not cosmetic.
8. **Given** the setting is Off **when** the app resumes **then** no lock view appears and the session
   rules of US-E01-05 alone apply.

**Mobile acceptance criteria**

- The lock view covers the full viewport including the safe areas, paints within 200 ms of the
  `visibilitychange` event so no content is visible in the app switcher preview, and hides content
  from screenshots taken by the OS app switcher to the extent the web platform permits (documented
  limitation: the web cannot suppress the OS snapshot; the mitigation is painting the lock view on
  `visibilitychange` to hidden as well, before the snapshot is taken).
- The primary ceremony button is at least 48 CSS px tall, centred in the lower third for one-handed
  reach, and labelled "Confirm with Face ID" only when a platform authenticator is actually present.
- After a successful step-up, the restored screen retains list scroll position within 1 row and any
  in-progress upload continues from its persisted offset.
- Copy is honest about the mechanism: "Confirm it is you" and never "App locked by Face ID", because
  this is a re-authentication ceremony rather than an OS-level lock.
- With a screen reader, the lock view is announced as a modal, focus is trapped inside it, and the
  page behind is `aria-hidden`.

**Edge cases & negative paths**

- Phone call interrupts the ceremony: the lock view is still in place on return, and no partial state
  is committed.
- Policy changed on another device: the new interval applies from the next foreground, and the change
  is written to the E11 activity log as a security event.
- Guest sessions: step-up never applies, because guests have no credentials; the share's own expiry
  and revocation are the controls.
- Public terminal: the lock view plus a 15-minute policy is the recommended configuration, and the
  Security screen says so in one line.

---

### US-E01-14 — Social sign-in with Google, Apple and Microsoft

**As a** P2 Dev Raman who does not want another password **I want** to continue with the account I
already have **so that** joining takes one tap when I decide to become a real user.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 5 |
| Depends on | US-E01-04, US-E01-05 |
| Traces to | FR-AUTH-005, NFR-SEC-002, NFR-PRIV-001, NFR-COMPAT-001, BR-020, BR-028 |

**Acceptance criteria**

1. **Given** the sign-in and sign-up screens **when** they render **then** "Continue with Google",
   "Continue with Apple" and "Continue with Microsoft" are shown above the password fields, each at
   least 48 CSS px tall, with vendor-compliant labels and marks.
2. **Given** an OAuth flow **when** it runs **then** it uses the authorisation-code flow with PKCE,
   `state` and `nonce`, both validated server-side, and the provider redirect returns to a single
   registered callback path.
3. **Given** a provider returns a verified email that matches an existing password account **when**
   the callback is processed **then** the provider identity is linked to the existing account after an
   explicit confirmation screen ("An account already exists for marcy@example.com. Link Google to it?
   You will be able to use either."), never silently.
4. **Given** a provider returns an unverified email **when** the callback is processed **then** no
   linking occurs, an account is created in `pending_verification`, and the product's own verification
   email is sent.
5. **Given** Apple's private relay address **when** an account is created with it **then** the app
   functions fully, and the account screen explains "Apple hides your address. Share notifications go
   to your relay address."
6. **Given** the provider flow is cancelled **when** the user returns **then** the sign-in screen is
   restored with no error banner and no partial account.
7. **Given** a linked provider **when** the user opens Security **then** each linked provider is
   listed and can be unlinked, and the last authentication method cannot be removed (copy: "Add a
   password or a passkey before removing Google.").
8. **Given** only the minimum scopes **when** the request is built **then** it asks for identity and
   email only, never contacts, calendar or drive scopes, and the consent screen reflects that.

**Mobile acceptance criteria**

- The flow completes inside the browser or the installed web app without dropping the user into a
  different browser and losing the session; on iOS, `ASWebAuthenticationSession`-style behaviour is
  not available to a PWA, so the redirect flow must survive a full page navigation and restore the
  intended destination (a deep-linked room) after the callback.
- The pending destination and any typed form state are persisted before the redirect on
  `visibilitychange` to hidden, and restored after the callback, verified by starting the flow from a
  deep link into a shared folder.
- Buttons stack vertically at 360 px width with 8 CSS px gaps and never truncate their labels at 200
  percent text size.
- The provider buttons are in the lower half of the screen for thumb reach, with the least-used
  provider last.
- On a flaky connection, a callback that times out shows "Sign-in did not complete. Tap to try again."
  and does not create a duplicate account on retry.

**Edge cases & negative paths**

- Provider outage: the buttons remain but a failed callback shows "Google sign-in is unavailable right
  now. Use your email instead." and the password path is still on screen.
- Same person with Google and Microsoft on the same email: second provider links to the same account
  after the confirmation screen.
- Email changed at the provider: identity is keyed on the provider subject id, not the email, so the
  link survives; the app updates the display email and writes a security event.
- Provider returns no email at all: account creation is blocked with "We need an email address to
  create your account. Use email sign-up instead."

---

### US-E01-15 — New-device and security-event notification

**As a** P1 Marcy Doyle **I want** to be told when my account is used from a device I have not used
before **so that** I can shut it down from my phone the moment it happens.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 3 |
| Depends on | US-E01-05, US-E01-11 |
| Traces to | FR-AUTH-018, NFR-SEC-004, NFR-OBS-001, BR-005 |

**Acceptance criteria**

1. **Given** a successful sign-in from a device fingerprint not seen for this subject in the last 90
   days **when** the session is created **then** a `security_event` of type `new_device_sign_in` is
   written and an email is sent within 2 minutes containing device, browser, approximate location and
   time, plus a "This was not me" link.
2. **Given** "This was not me" is opened **when** the user confirms **then** all sessions are revoked
   (US-E01-09), the account is put into password-reset-required state, and the user is walked into the
   reset flow.
3. **Given** the in-app notification centre (E11) **when** a security event exists **then** it appears
   there as well as by email, so email deliverability is not the only channel.
4. **Given** the user has installed the web app and granted permission **when** a security event
   occurs **then** a web push notification is sent; on iOS this requires a Home Screen web app, and
   the app never promises push before permission is granted and installation exists.
5. **Given** repeated sign-ins from the same new device within an hour **when** events fire **then**
   they are coalesced into one notification, not one per sign-in.
6. **Given** the security events list **when** it renders **then** it includes sign-in, sign-out
   everywhere, password change, email change, passkey added or removed, and lockouts, each with time
   and device, retained for at least 12 months (see E11 retention).
7. **Given** a guest session **when** it is created **then** no security email is sent to the guest,
   but the share owner sees the access in the room activity log (E11).

**Mobile acceptance criteria**

- The push permission prompt is requested only in response to a direct tap on an explicit "Turn on
  security alerts" control, never on page load, because iOS requires a user gesture and unprompted
  requests are refused.
- The in-app notification row is at least 56 CSS px tall with a 48 px action target, and "This was not
  me" is never the primary tap of the row (it is in the row's actions) so it cannot be hit by accident.
- The email renders legibly at 360 px width in a mobile mail client with no horizontal scrolling and
  a single-column layout.
- Announced politely by a screen reader when it arrives in-app; never assertively, unless the user is
  on the Security screen.

**Edge cases & negative paths**

- Travelling user gets a new-device email for their own laptop in a hotel: copy is calm and explicit,
  "If this was you, no action is needed."
- Carrier IP geolocation is wrong by hundreds of miles: the email says "Approximate location, based on
  IP" so the user does not panic.
- Email address compromised as well: the in-app notification centre and the sessions list are the
  independent path, which is why criterion 3 exists.
- Notification for a guest link opening is suppressed here and handled as viewer analytics in E11.

---

### US-E01-16 — Change email and change password

**As a** P4 Ashley Kim moving from an old firm address to a new one **I want** to change my email and
password from my phone **so that** my account follows me without support intervention.

| | |
|---|---|
| Priority | Should |
| Release | R2 |
| Estimate | 3 |
| Depends on | US-E01-03, US-E01-06, US-E01-09 |
| Traces to | FR-AUTH-012, FR-AUTH-019, NFR-SEC-002, NFR-A11Y-005, BR-019, BR-028 |

**Acceptance criteria**

1. **Given** the Security screen **when** the user taps "Change password" **then** a sheet asks for
   the current password and the new password, with correct `autocomplete` tokens, and the sheet
   states "This signs you out on your other devices."
2. **Given** a successful password change **when** it commits **then** all other sessions are revoked,
   the current one is renewed, and a confirmation email is sent.
3. **Given** the user taps "Change email" **when** the flow starts **then** the new address is
   entered, a verification link is sent to the new address, and the change takes effect only when that
   link is used.
4. **Given** a pending email change **when** the user views Security **then** it shows "Pending:
   new@example.com. Resend or cancel." and the old address continues to receive all notifications
   until the change completes.
5. **Given** the email change completes **when** it commits **then** a notification is sent to both
   the old and the new address, and a `security_event` of type `email_changed` is written.
6. **Given** the new address is already used by another account **when** it is submitted **then** the
   response is neutral ("If that address can be used, we have sent it a link.") and no linkage occurs.
7. **Given** the account signs in only through a social provider **when** the user opens Security
   **then** "Set a password" is offered instead of "Change password", and the account email cannot be
   changed to an address that breaks the provider link without an explicit warning.
8. **Given** step-up policy is enabled **when** either change is attempted **then** the server
   requires a fresh verification per US-E01-13 criterion 7.

**Mobile acceptance criteria**

- Each change is a single modal bottom sheet with at most three inputs, fully usable with the keyboard
  open at 360 x 640, and only one sheet is on screen at a time.
- The sheet's primary button is disabled until the form is valid, keeps its 48 px target, and shows a
  busy state within 100 ms of tap.
- Backgrounding mid-flow preserves the entered new email (never the password) and restores it on next
  open.
- Screen reader announces the pending-change state once, and the "Resend" and "Cancel" controls have
  accessible names containing their visible labels.

**Edge cases & negative paths**

- User changes email to an address they cannot access: the change never completes, the pending state
  expires after 7 days, and the copy says so.
- Guest grants addressed to the old email do not migrate automatically; the account screen warns
  "Invitations sent to your old address stay with that address" and links to US-E01-17.
- Current password wrong three times inside the sheet: the sheet closes and the US-E01-07 limiter
  applies.
- Email change during a pending account deletion: blocked with "Cancel the scheduled deletion first."

---

### US-E01-17 — Claim guest access into a registered account

**As a** P3 Tomás Ferreira who has been invited to nine rooms as a guest **I want** to create an
account that inherits every room I was invited to **so that** I stop juggling nine emailed links.

| | |
|---|---|
| Priority | Could |
| Release | R2 |
| Estimate | 3 |
| Depends on | US-E01-01, US-E01-08 |
| Traces to | FR-AUTH-014, FR-AUTH-015, NFR-SEC-001, NFR-PRIV-001, BR-002, BR-020 |

**Acceptance criteria**

1. **Given** a guest session bound to a verified email **when** the guest taps "Save these rooms to an
   account" **then** account creation runs with the email prefilled and read-only, and on success every
   share grant bound to that email is attached to the new user subject.
2. **Given** the claim completes **when** the user opens the workspace home **then** the claimed rooms
   appear under "Shared with me" with the same permissions as the guest grants had, no more and no
   less, verified server-side.
3. **Given** a share grant bound to an email **when** the account for that email is created later
   **then** the grants attach on first sign-in and the room owner sees the change reflected in the
   share-management screen as "Guest, now a registered user" without any change in permission.
4. **Given** anonymous public-link access with no captured email **when** the visitor creates an
   account **then** nothing is claimed, because there is no email to bind to, and the copy explains
   "Only invitations sent to your email can be saved."
5. **Given** a claim **when** it commits **then** the guest records are retained as audit history
   (E11) with a pointer to the new user subject, so the activity log does not lose the earlier views.
6. **Given** a claim **when** the owner has revoked one of the shares in the meantime **then** that
   room is not claimed and is not listed, and no error names it (BR-002).
7. **Given** the claim flow **when** it is presented **then** it is never a wall: the guest can
   dismiss it and keep reading, and it is not shown more than once per share per 30 days.

**Mobile acceptance criteria**

- The prompt is a dismissible banner or a single sheet, never a blocking interstitial over content;
  QA fails the story if reading is interrupted.
- At 360 x 640 the claim sheet shows the count of rooms that will be saved ("Save 9 rooms to your
  account") so the value is concrete before the user commits.
- The dismiss control is at least 48 x 48 CSS px and is not adjacent to the primary button.
- If the app is backgrounded mid-claim, the flow resumes at the same step on next open.

**Edge cases & negative paths**

- Two guests share a mailbox: the claim attaches all grants for that address, which is the documented
  behaviour, and the owner-side share list makes it visible.
- Guest email differs in case or has a plus-alias: normalised on the unique key, so
  `dev+deal@example.com` and `dev+deal@Example.com` claim the same grants; a plus-alias is treated as a
  distinct address (Assumption, recorded as OQ06).
- Claim during an active read: the reading position is preserved through the account creation.
- Claim attempted by a different person on the same device after the first guest: email verification
  is required before grants attach.

---

### US-E01-18 — Delete my account with a retention window

**As a** P1 Marcy Doyle who has stopped brokering **I want** to delete my account and know exactly
what happens to the rooms my buyers still have links to **so that** I can leave without a support
ticket and without stranding a live deal.

| | |
|---|---|
| Priority | Must |
| Release | R2 |
| Estimate | 8 |
| Depends on | US-E01-09, US-E01-11 |
| Traces to | FR-AUTH-016, FR-ACCT-010, NFR-PRIV-002, NFR-SEC-004, NFR-A11Y-004, BR-005, BR-014, BR-022, BR-023 |

**Acceptance criteria**

1. **Given** the Account screen **when** the user taps "Delete account" **then** a full-screen
   confirmation route (not a small sheet) states the exact blast radius: "This will permanently delete
   6 Data Rooms, 412 files, 2.1 GB of storage and revoke 23 share links. 4 people currently have
   access." with counts computed server-side at render time.
2. **Given** the confirmation route **when** it renders **then** the user must type the word DELETE
   into a field (paste permitted) and tap a destructive-styled "Delete my account" button, and a
   "Keep my account" button is the visually dominant, thumb-reachable option.
3. **Given** deletion is confirmed **when** it commits **then** the account enters `pending_deletion`
   with a retention window of 30 days (BR-022), all sessions are revoked immediately, every share link
   owned by the account is revoked immediately, and rooms become inaccessible to everyone including
   the owner except through the recovery flow.
4. **Given** `pending_deletion` **when** the user signs in during the window **then** they are shown
   "Your account is scheduled for deletion on 20 Sep 2026. Cancel deletion?" and cancelling restores
   full access, but does not automatically re-enable the revoked share links; those must be re-shared,
   and the copy says so.
5. **Given** the retention window elapses **when** the purge job runs **then** all room content,
   files, thumbnails, previews and derived data are destroyed within 7 days of the window closing,
   audit records are anonymised rather than deleted (email replaced by `deleted-user-<hash>`), and a
   deletion receipt is emailed to the address on file before the mailbox link is severed.
6. **Given** the account owns a room shared with others **when** deletion is confirmed **then**
   recipients see "This Data Room is no longer available." on their next request, served by the server,
   and no cached copy in a recipient's client survives the next successful validation.
7. **Given** an account being deleted **when** deletion is confirmed **then** the storage side of the
   deletion is owned by [E12](./epic-12-account-storage-and-governance.md) (US-E12-18): the
   confirmation states the exact bytes, room count and file count that will be destroyed and the exact
   purge date, and nothing is freed before that date.
8. **Given** the ownership-transfer option exists (E02, E07) **when** the user reaches the deletion
   route **then** "Transfer these rooms to someone else instead" is offered above the destructive
   action.
9. **Given** deletion is confirmed **when** the event is recorded **then** `account_deletion_requested`
   is written with actor, counts and timestamp, and `account_deletion_completed` on purge, both
   retained beyond the purge for compliance.

**Mobile acceptance criteria**

- The confirmation is a dedicated route with its own history entry, so the Android system back and the
  iOS in-app back both cancel it safely and cannot commit the deletion.
- The destructive button is placed at the top of the action group and the safe "Keep my account"
  button in the thumb zone at the bottom, so the easiest target on a phone is the non-destructive one.
- The typed-confirmation field works with the on-screen keyboard up at 360 x 640, with the button
  visible above the keyboard inset, and accepts paste.
- The counts block wraps and remains fully readable at 360 px width and 200 percent text size; nothing
  is truncated, because truncating a blast-radius count is a defect.
- Commit happens on the up-event of the button, with a 10-second undo toast "Account deletion
  scheduled. Undo" that cancels the pending state (SC 2.5.2 plus the destructive-action undo rule).
- The result is announced assertively by a screen reader, including the scheduled date.
- If the request is made offline it is refused, not queued: "You need a connection to delete your
  account." Destructive irreversible actions are never queued for later replay.

**Edge cases & negative paths**

- Deletion requested while an upload is running on another device: uploads stop with 401 and the local
  queue is preserved on that device but cannot be resumed after the purge; the confirmation route
  states "Uploads in progress will be lost."
- Sole owner of a room with active guests mid-read: guests lose access at confirmation time, not at
  purge time, and see the message in criterion 6.
- User requests deletion twice: idempotent; the second request shows the existing scheduled date.
- Legal hold or an open compliance request on the account: purge is deferred, the user is told
  "Deletion is on hold while a legal request is open" and the case reference is shown. Recorded as
  OQ07.
- Storage purge partially fails: the job is retried, the account stays in `purging`, and an operational
  alert fires; the user-visible state never claims completion before it is true.

---

## Out of scope for this epic

| Topic | Where it lives |
| --- | --- |
| Role model (Owner, Manager, Contributor, Viewer) and the download-allowed flag | [E07](./epic-07-sharing-and-access-control.md) |
| Creating, configuring, expiring or revoking a share; email-capture gate configuration; watermarking | [E07](./epic-07-sharing-and-access-control.md) |
| Room-level and folder-level permission inheritance and override | [E07](./epic-07-sharing-and-access-control.md) |
| The room list, room switcher, and the invisibility rule as a product surface | [E02](./epic-02-data-rooms-and-workspace-home.md) |
| Activity log, viewer analytics, notification centre, web push infrastructure, audit export | [E11](./epic-11-trust-audit-and-notifications.md) |
| Storage quota and its administrator, retention settings, provisioning and deprovisioning, and the storage side of account deletion | [E12](./epic-12-account-storage-and-governance.md) |
| SSO / SAML / SCIM and enterprise directory integration | Not in R1 to R3. Recorded as OQ08. |
| Two-factor authentication by TOTP or SMS | R3 candidate. Passkeys are the R2 answer; recorded as OQ05. |
| The interaction primitives themselves (sheets, action bars, toasts, haptics, theming) | [E09](./epic-09-mobile-ux-foundations.md) |
| Offline mutation queue mechanics and reconciliation | [E08](./epic-08-conflict-resolution-and-data-integrity.md), [E10](./epic-10-performance-offline-and-scale.md) |

## Open questions

| ID | Question | Owner | Needed by |
| --- | --- | --- | --- |
| OQ01 | Is a 90-day rolling / 180-day absolute refresh lifetime acceptable to the first design-partner brokers, or does their professional-liability insurer require shorter? The Assumption in US-E01-05 is unvalidated. | Product + first 5 design partners | Before R1 code freeze |
| OQ02 | What are the real per-IP limits once we see carrier NAT and shared office traffic? The figures in US-E01-07 are an Estimate and will produce false lockouts if wrong. | Engineering + Support | 2 weeks after R1 launch |
| OQ03 | Do we require email verification before a user can create a room, or only before they can share? The current answer is share-only (BR-028). Confirm against abuse risk. | Product + Security | Before R1 code freeze |
| OQ04 | Do we block disposable email domains at sign-up? Blocking reduces abuse but also blocks legitimate privacy-conscious recipients who later claim access (US-E01-17). | Product | R2 |
| OQ05 | Is TOTP two-factor needed for the beachhead segment, or do passkeys plus step-up satisfy the "my lawyer must believe this" bar? | Product + design partners | R2 planning |
| OQ06 | Are plus-aliases (`dev+deal@example.com`) treated as distinct addresses for guest grants and claims? Current Assumption is yes. | Engineering | Before E07 build |
| OQ07 | What is the legal-hold process that defers an account purge, and who can set it? | Legal + Engineering | Before R2 launch |
| OQ08 | Does the company identity provider require SAML rather than OIDC, which would pull SAML forward from "not planned"? | IT operations + Product | Ongoing |
