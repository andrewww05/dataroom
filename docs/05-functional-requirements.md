# Functional Requirements

## Purpose

This document is the single authoritative list of what the Data Room must do. Every requirement
here is atomic, individually citable by its `FR-<DOMAIN>-<nnn>` identifier, and written so that a
QA engineer holding a phone can decide unaided whether it passes or fails. Requirements are
grouped into twelve domains and each is bound to exactly one epic, so the backlog, the test plan
and the traceability matrix all resolve against the same identifiers.

The Data Room is an **internal tool the company builds for its own staff**. Nothing in this document
is a commercial surface. The users are colleagues; external parties (clients, counterparties,
advisers) appear only as **recipients** reached through a share link or an emailed invite, and a
recipient on a phone with no account is the most demanding surface in the product. Everything that
protects an outward share — public link, permissioned share, revocation, read-only enforcement and
watermarking — is therefore load-bearing, because staff send sensitive documents outward and must be
able to pull them back.

The document deliberately does not contain rules, thresholds or precedence logic. Anything that
answers "who is allowed to, and what happens when two things conflict" lives in
[Business rules and permissions](./06-business-rules-and-permissions.md) as a `BR-<nnn>` rule and
is referenced from here. Anything that answers "how fast, how accessible, how available" lives in
[Non-functional requirements](./07-non-functional-requirements.md) as an `NFR-<CAT>-<nnn>`.

**What this document owns, and what it only cites.** This document owns every requirement
**Release** tag and every **Priority** in the set; where a scope table or a backlog column
disagrees with a tag here, this document wins and the other artefact is stale. It does not own the
numbers it refers to. Thresholds, limits, retention windows, timing guarantees and permission rules
belong to [06](./06-business-rules-and-permissions.md) as `BR-<nnn>`; metric IDs and analytics event
names belong to [10](./10-success-metrics-and-analytics.md); the responsive size-class ladder
belongs to [03](./03-product-overview.md); entity field names and error codes belong to
[09](./09-domain-model-and-glossary.md). Where a number appears below for readability it is written
with its owning identifier in parentheses, for example "60 seconds (BR-110)".

Two constraints shape every line below.

1. **Mobile-first is a specification constraint, not a design aspiration.** Every requirement is
   written for a 360 CSS pixel touch screen first. Where the stakeholder brief names a desktop
   file-manager primitive (tree view, split view, right-click context menu, dense toolbar,
   keyboard navigation, hover preview pane), this document specifies the touch-native equivalent
   as the baseline requirement and the desktop form as a separate, explicitly enhanced
   requirement. No primitive is dropped, and none is bolted on.
2. **The delivery vehicle is a responsive, installable PWA.** One codebase, instant updates, no
   app-store gate. That choice costs real capability: no background upload on iOS, no save-file
   picker on iOS, no OS share-target on iOS or Firefox, no OS-level biometric lock on any browser,
   and locally cached bytes that the browser may evict. Where a requirement brushes against one of
   those limits, the limit is stated in the requirement and the honest fallback is specified rather
   than implied. Native shells remain an explicitly scoped later option and are out of scope for
   R1 to R3 here.

## Related documents

- [Documentation index](./README.md)
- [Prior art and UX benchmark](./01-prior-art-and-ux-benchmark.md)
- [Personas and jobs-to-be-done](./02-personas-and-jtbd.md)
- [Product overview](./03-product-overview.md)
- [Epics](./04-epics.md)
- [Business rules, permissions and access control](./06-business-rules-and-permissions.md)
- [Non-functional requirements](./07-non-functional-requirements.md)
- [Mobile UX specification](./08-mobile-ux-spec.md)
- [Domain model and glossary](./09-domain-model-and-glossary.md)
- [Success metrics and analytics](./10-success-metrics-and-analytics.md)
- [Master backlog](./11-master-backlog.md)
- [Risks and open questions](./12-risks-and-open-questions.md)
- Backlog by epic:
  [Access and Identity](./backlog/epic-01-access-and-identity.md),
  [Data Rooms and Workspace Home](./backlog/epic-02-data-rooms-and-workspace-home.md),
  [Folder Hierarchy and Navigation](./backlog/epic-03-folder-hierarchy-and-navigation.md),
  [File Operations](./backlog/epic-04-file-operations.md),
  [Viewing, Preview and File Details](./backlog/epic-05-viewing-preview-and-file-details.md),
  [Search and Discovery](./backlog/epic-06-search-and-discovery.md),
  [Sharing and Access Control](./backlog/epic-07-sharing-and-access-control.md),
  [Conflict Resolution and Data Integrity](./backlog/epic-08-conflict-resolution-and-data-integrity.md),
  [Mobile UX Foundations](./backlog/epic-09-mobile-ux-foundations.md),
  [Performance, Offline and Scale](./backlog/epic-10-performance-offline-and-scale.md),
  [Trust, Audit and Notifications](./backlog/epic-11-trust-audit-and-notifications.md),
  [Account, Storage and Governance](./backlog/epic-12-account-storage-and-governance.md)

## How to read a requirement

Every row in every table below has six columns.

| Column | Meaning |
| --- | --- |
| **ID** | `FR-<DOMAIN>-<nnn>`. Stable forever. Cite it in commits, tickets, test names and design files. Never renumber, never reuse a retired number. Domains are AUTH, ROOM, FLDR, FILE, VIEW, SRCH, SHARE, CONF, MOB, PERF, AUDIT, ACCT. |
| **Requirement** | One testable statement in the form "The system shall …". One requirement per row. If a statement contains "and" joining two independently testable behaviours, it is a defect in this document and must be split. |
| **Priority** | MoSCoW. **Must** = the release named in the next column does not ship without it. **Should** = ships in that release unless it is the last thing standing between us and the date. **Could** = built if capacity appears. **Won't** = explicitly out of scope for the horizon of this document, recorded so nobody re-proposes it as new. |
| **Release** | Exactly four values, and no others: **R1** (MVP), **R1.1** (Trust hardening), **R2** (fast-follow), **R3** (later). R1.1 is a named increment, not a slip of R1: it carries the three trust features staff will demand the first time a shared document leaks — the dynamic per-viewer watermark (FR-VIEW-035, FR-SHARE-012), the per-viewer access log (FR-AUDIT-004) and share-link expiry (FR-SHARE-009) — plus the recipient tracking disclosure that must ship with them (NFR-PRIV-010). The release plan in [03](./03-product-overview.md) and the release columns in [04](./04-epics.md) are derived from this column, never the reverse. A `Won't` priority carries the release it would first be reconsidered in. |
| **Epic** | The single owning epic, `E01` to `E12`. A requirement with two plausible epics is assigned to the one that owns its acceptance criteria, and cross-referenced in the notes. |
| **Verification** | How a tester proves it. Codes below. More than one code means all of them must pass. |

### Verification codes

| Code | Method | Executed by |
| --- | --- | --- |
| `Unit` | Unit test. Vitest in `apps/web`, Jest in `apps/api`. | CI on every push |
| `API` | API integration test against the running NestJS app (Jest plus supertest), asserting status code, typed error body and persisted state. | CI on every push |
| `E2E` | Playwright end-to-end run against the emulated mobile profile: 360 x 640 CSS px, 3x device pixel ratio, touch-only, no hover, no fine pointer. | CI on every push |
| `E2E-D` | Playwright end-to-end run against the desktop profile: 1440 x 900, fine pointer, hover, hardware keyboard. | CI on every push |
| `Device` | Scripted manual pass on the reference hardware: Samsung Galaxy A24 4G class on Chrome and an iPhone SE 3rd generation on Safari, both as a browser tab and as an installed home-screen web app. Recorded in the release test report. | QA, per release candidate |
| `A11y` | Automated axe-core scan with zero serious or critical violations, plus a scripted screen-reader pass with VoiceOver on iOS and TalkBack on Android, plus a hardware-keyboard-only pass. | QA, per release candidate |
| `Lab` | Lighthouse CI on the default mobile preset (150 ms RTT, 1,638.4 Kbps down, 750 Kbps up, 4x CPU) as a regression guard, budget asserted in CI. | CI on every push to main |
| `Field` | Real-user monitoring at the 75th percentile of mobile sessions. The acceptance gate for anything with a latency number; `Lab` is never the acceptance gate. | Continuous, reviewed weekly |
| `Sec` | Named security test case: authorization bypass attempt, token enumeration, IDOR probe, or rate-limit exhaustion. Run in CI where automatable and in the pre-release penetration test otherwise. | CI plus per-release pen test |
| `Analytics` | The named analytics event appears in the event dictionary in [10-success-metrics-and-analytics.md](./10-success-metrics-and-analytics.md), fires with the documented payload, and is visible in the warehouse within the documented latency. | CI plus data QA |
| `Review` | Documented review against a checklist, signed off by a named role. Used only where behaviour is genuinely not machine-assertable (copy honesty, iconography, information architecture). | Design or tech lead |

### Conventions used in the requirement text

- "Compact", "medium", "expanded" and "large" are the four width classes of the single responsive
  size-class ladder owned by [03-product-overview.md](./03-product-overview.md), where compact is a
  viewport width below 600 CSS px. That ladder is the only place in this set where a breakpoint
  number is defined; this document names classes and never restates a second set of boundaries. The
  only vertical boundary any requirement here depends on is the split-view height floor stated in
  FR-VIEW-029.
- "Principal" means any authenticated or token-bearing actor: account holder, invited guest, or
  anonymous link visitor. Defined precisely in
  [06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md).
- "Thumb zone" means the bottom 45 percent of the viewport height, where a one-handed reach is
  comfortable on a 6-inch phone.
- Where a requirement depends on a rule, the rule is cited inline as `BR-nnn`. The rule is
  normative; this document only states that the system must obey it.
- Numbers presented without a citation and not derived from the research handed to us are marked
  `Assumption:` or `Estimate:` in the notes block for that domain.

---

## FR-AUTH: Authentication, identity, session and guest access

Owning epic: [E01 Access and Identity](./backlog/epic-01-access-and-identity.md).
Owner identity is the root of every access decision in the product, so this domain is a hard
prerequisite for FR-ROOM and FR-SHARE.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-AUTH-001 | The system shall allow a visitor to create an account with an email address and a password, requiring no other field before the first room can be created. | Must | R1 | E01 | `API` `E2E` |
| FR-AUTH-002 | The system shall reject a password shorter than 12 characters, shall accept any character including spaces and emoji, shall impose no composition rule, and shall reject a password found in the configured breached-credential corpus, per BR-018. | Must | R1 | E01 | `Unit` `API` |
| FR-AUTH-003 | The system shall allow paste into every password, one-time-code and invitation-code field, and shall not intercept or clear the clipboard. | Must | R1 | E01 | `E2E` `A11y` |
| FR-AUTH-004 | The system shall mark authentication fields with the correct `autocomplete` tokens (`email`, `current-password`, `new-password`, `one-time-code`) so that platform password managers and SMS autofill work without user intervention. | Must | R1 | E01 | `E2E` `Device` |
| FR-AUTH-005 | The system shall send a verification email on sign-up containing a single-use link valid for 24 hours, and shall mark the account verified on first use of that link. | Must | R1 | E01 | `API` `E2E` |
| FR-AUTH-006 | The system shall allow an unverified account to create rooms, folders and files, and shall refuse every share-creation request from an unverified account with a typed error naming email verification as the blocker, per BR-021. | Must | R1 | E01 | `API` `Sec` |
| FR-AUTH-007 | The system shall allow sign-in with a magic link sent to a registered email address, where the link is single-use, expires 15 minutes after issue, and is invalidated by a successful sign-in through any other method. | Must | R1 | E01 | `API` `E2E` |
| FR-AUTH-008 | The system shall allow sign-in with email and password. | Must | R1 | E01 | `API` `E2E` |
| FR-AUTH-009 | The system shall allow a signed-in user to register a passkey (WebAuthn platform authenticator) and to sign in with it subsequently, on every browser that exposes `PublicKeyCredential`. | Should | R1 | E01 | `E2E` `Device` |
| FR-AUTH-010 | The system shall offer social sign-in with Google and with Microsoft, binding the resulting identity to the verified email address returned by the provider. | Should | R2 | E01 | `API` `E2E` |
| FR-AUTH-011 | The system shall issue an access credential with a lifetime of at most 5 minutes and a refresh credential with a lifetime of at most 90 days, and shall rotate the refresh credential on every use, per BR-023. | Must | R1 | E01 | `API` `Sec` |
| FR-AUTH-012 | The system shall keep a user signed in across application restarts, device sleep and network loss for at least 30 days of continued activity on the same device without presenting an interactive credential prompt. | Must | R1 | E01 | `Device` |
| FR-AUTH-013 | The system shall re-authenticate the user with a WebAuthn assertion, or with a password if no passkey is registered, when the application returns to the foreground after the configured idle interval, and shall present this as a re-authentication prompt rather than as a device lock. | Should | R2 | E01 | `E2E` `Device` `Review` |
| FR-AUTH-014 | The system shall never claim to lock the application with a device biometric or passcode, because no web API can force an operating-system biometric check on resume. | Must | R1 | E01 | `Review` |
| FR-AUTH-015 | The system shall list every active session for the signed-in user, showing device class, browser, coarse location, first-seen and last-seen timestamps, and shall allow any single session to be revoked from that list. | Should | R1 | E01 | `API` `E2E` |
| FR-AUTH-016 | The system shall provide a single "Sign out on all devices" action that invalidates every refresh credential for the account within the propagation target in BR-108. | Must | R1 | E01 | `API` `Sec` |
| FR-AUTH-017 | The system shall allow a password reset initiated from an email address, using a single-use link valid for 60 minutes, and shall invalidate every existing session on successful reset. | Must | R1 | E01 | `API` `E2E` |
| FR-AUTH-018 | The system shall return an identical response and an identical response time envelope for a password-reset or magic-link request whether or not the email address is registered, per BR-054. | Must | R1 | E01 | `API` `Sec` |
| FR-AUTH-019 | The system shall apply the sign-in rate limits and progressive lockout in BR-212, and shall display the remaining lockout time as a live countdown rather than a static message. | Must | R1 | E01 | `API` `E2E` |
| FR-AUTH-020 | The system shall grant an invited guest access to the shared scope through an email-bound magic link without requiring account creation, password selection or application installation. | Must | R1 | E01 | `API` `E2E` |
| FR-AUTH-021 | The system shall establish an anonymous visitor session from a valid public link token without any credential, and shall scope that session to exactly the shared item and its descendants. | Must | R1 | E01 | `API` `Sec` |
| FR-AUTH-022 | The system shall, where a share is configured with an email-capture gate, collect and record a visitor email address before serving any file bytes or preview, and shall not treat that address as verified. | Should | R2 | E07 | `API` `E2E` |
| FR-AUTH-023 | The system shall preserve the requested destination across an authentication interruption and return the principal to the exact room, folder or file that triggered it, including scroll position where the destination is a list. | Must | R1 | E01 | `E2E` `Device` |
| FR-AUTH-024 | The system shall not require a principal to re-enter an email address it already holds within the same flow, in accordance with WCAG 2.2 SC 3.3.7. | Must | R1 | E01 | `E2E` `A11y` |
| FR-AUTH-025 | The system shall not present any authentication step that depends on transcription, recall of a puzzle answer, or a cognitive function test without an alternative, in accordance with WCAG 2.2 SC 3.3.8. | Must | R1 | E01 | `A11y` `Review` |
| FR-AUTH-026 | The system shall transfer every grant held by a guest identity to a full account when a person signs up with the same verified email address, without the sharer taking any action, per BR-011. | Should | R2 | E01 | `API` `E2E` |
| FR-AUTH-027 | The system shall notify the account owner by email and in the notification centre when a session is established from a device fingerprint not previously seen on that account. | Should | R1 | E11 | `API` `E2E` |
| FR-AUTH-028 | The system shall allow a user to request account deletion from the account settings screen, shall confirm the request by email, and shall honour the retention window and irreversibility rules in BR-190 to BR-194. | Must | R1 | E12 | `API` `E2E` |
| FR-AUTH-029 | The system shall offer time-based one-time-password second-factor authentication, with recovery codes, for account holders who enable it. | Could | R3 | E01 | `API` `E2E` |
| FR-AUTH-030 | The system shall allow a room owner to require every principal with access to that room to re-authenticate at an interval the owner sets, independent of the global session policy. | Could | R3 | E07 | `API` `E2E` |

### Notes and rationale

- **FR-AUTH-002, no composition rules.** Length plus a breach-corpus check is measurably stronger
  than character-class rules and is far less hostile on a phone keyboard, where switching to the
  symbol plane to satisfy a rule is a real abandonment cause. Composition rules also push users
  toward predictable substitutions.
- **FR-AUTH-006 is an anti-abuse decision, not a nag.** Allowing an unverified account to build a
  room means persona P1 can be productive in the first four minutes, which the persona research
  says is the survival window. Blocking share creation until verification means the product cannot
  be used as an anonymous malware or phishing distributor on day one. The blocker appears at the
  moment of sharing, with a one-tap resend, not as an interstitial on sign-up.
- **FR-AUTH-011 short access-credential lifetime is what makes revocation credible.** The
  five-minute ceiling (BR-023) bounds how long a credential issued before a revocation can still be
  presented, which is what lets FR-SHARE-015 promise near-immediate effect. It does not replace the
  per-request check: effective permission is computed server-side on every request (BR-077), a
  loaded page re-checks its grant on an interval (BR-112), and the propagation bound in BR-108 is
  met by those two mechanisms together. Any design that treats a valid access credential as
  standing authorisation, and therefore skips the grant lookup on a request path, is a defect
  against BR-077 and is the reason a revocation would appear to succeed and silently not work.
- **FR-AUTH-013 and FR-AUTH-014 are the honest version of "biometric unlock".** WebAuthn is an
  authentication ceremony, not a screen lock. There is no web API that forces a biometric check
  when a page returns to the foreground, and no web equivalent of `LocalAuthentication`. The
  product therefore implements the behaviour as a short server-side session policy with a step-up
  assertion on resume, and the copy says "Confirm it's you", never "Unlock with Face ID". Any copy
  anywhere in the product that promises an OS-level lock is a defect against FR-AUTH-014.
- **FR-AUTH-020, recipients without accounts, is not negotiable.** The persona research is explicit
  that external recipients (P2, P3, P5) abandon rather than create an account for a first look. An
  account wall on the recipient side means the document does not get read, which is the only reason
  the share existed. The recipient path is specified in
  [02-personas-and-jtbd.md](./02-personas-and-jtbd.md) and enforced here by FR-AUTH-020,
  FR-AUTH-021 and FR-SHARE-021.
- **FR-AUTH-021 anonymous sessions are scoped, not global.** An anonymous visitor session carries
  authority over exactly one share token's subtree. It is never a foothold for enumerating other
  rooms, which is enforced by the visibility rules BR-046 to BR-060.
- **Assumption: the company identity provider is the primary sign-in path for staff.** Staff are
  expected to reach the product through the company's own SSO (OIDC) tenant, so that joiner and
  leaver events are driven by the directory rather than by this product's own account list
  (FR-ACCT-029, FR-ACCT-030). This pass deliberately does **not** build out an SSO requirement set;
  it records the assumption and keeps the existing credential requirements as the fallback path.
  FR-AUTH-001 to FR-AUTH-008 (email and password, magic link), FR-AUTH-009 (passkey) and
  FR-AUTH-013 (step-up assertion) therefore remain in R1 as the break-glass path for staff and as
  the only path available to external recipients, who must still be able to open a link with no
  account at all (FR-AUTH-020, FR-AUTH-021). **Open question:** which identity provider is
  authoritative, and whether SCIM provisioning is available from it — recorded in
  [12-risks-and-open-questions.md](./12-risks-and-open-questions.md). FR-AUTH-010 (Google and
  Microsoft sign-in) is the nearest existing capability and is the likely first increment if the
  answer is a Microsoft or Google tenant.
- **Assumption:** the idle interval in FR-AUTH-013 defaults to 15 minutes for rooms with no
  elevated policy. This is an assumption to be validated with the first cohort of staff users in
  R1, recorded as an open question in
  [12-risks-and-open-questions.md](./12-risks-and-open-questions.md).

---

## FR-ROOM: Data rooms, workspace home and room lifecycle

Owning epic: [E02 Data Rooms and Workspace Home](./backlog/epic-02-data-rooms-and-workspace-home.md).
The Data Room is the top-level container and the unit of sharing, quota and audit.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-ROOM-001 | The system shall allow a signed-in user to create a Data Room by supplying a name only, with every other setting defaulted. | Must | R1 | E02 | `API` `E2E` |
| FR-ROOM-002 | The system shall record the creating account as the room Owner and shall guarantee that every room has exactly one Owner at all times, per BR-013. | Must | R1 | E02 | `API` `Unit` |
| FR-ROOM-003 | The system shall create a room and return the empty room screen ready for the first upload within 3 seconds at the 75th percentile of mobile sessions. | Must | R1 | E02 | `Field` `E2E` |
| FR-ROOM-004 | The system shall allow the Owner or a Manager to rename a room, and shall reflect the new name in every list, breadcrumb and share page within one request cycle. | Must | R1 | E02 | `API` `E2E` |
| FR-ROOM-005 | The system shall allow the Owner to duplicate a room, offering the explicit choice of duplicating the folder structure only or the structure together with all file contents. | Should | R2 | E02 | `API` `E2E` |
| FR-ROOM-006 | The system shall allow the Owner to archive a room, which places the room in a read-only state, suspends every active share, and removes the room from the default room list while keeping it retrievable. | Should | R2 | E02 | `API` `E2E` |
| FR-ROOM-007 | The system shall allow the Owner to restore an archived room to the active state, and shall leave every previously suspended share revoked rather than reinstating it, per BR-185. | Should | R2 | E02 | `API` `Sec` |
| FR-ROOM-008 | The system shall allow the Owner to delete a room, presenting the cascade warning content specified in BR-172 before the destructive action is committed. | Must | R1 | E02 | `E2E` `Device` |
| FR-ROOM-009 | The system shall present a workspace home screen listing the rooms the principal owns, reachable as the application's first screen after authentication. | Must | R1 | E02 | `E2E` |
| FR-ROOM-010 | The system shall present a distinct "Shared with me" collection listing every room, folder and file shared with the principal, showing the sharer and the principal's own role on each. | Must | R1 | E02 | `API` `E2E` |
| FR-ROOM-011 | The system shall present a "Recents" collection of the items the principal most recently opened, across all rooms, ordered by last access. | Should | R1 | E02 | `API` `E2E` |
| FR-ROOM-012 | The system shall allow a principal to pin a room to the top of the workspace home and to unpin it, with the pinned set stored per account and synchronised across devices. | Should | R1 | E02 | `API` `E2E` |
| FR-ROOM-013 | The system shall render a distinct empty state for each of: no rooms at all, no rooms shared with me, no recents, and an empty room, each offering the single most useful next action as a primary button. | Must | R1 | E02 | `E2E` `Review` |
| FR-ROOM-014 | The system shall provide a room switcher reachable with one thumb from any screen inside a room, opening a list of rooms without leaving the current context. | Must | R1 | E02 | `E2E` `Device` |
| FR-ROOM-015 | The system shall display, on every room row and in the room header, a per-room visual marker consisting of a user-selectable colour and an optional emoji, so that two rooms are distinguishable at a glance on a 360 px screen. | Must | R1 | E02 | `E2E` `Review` |
| FR-ROOM-016 | The system shall display the room name persistently in the header of every screen inside that room, including the file viewer, so that the current room is never ambiguous. | Must | R1 | E02 | `E2E` `Review` |
| FR-ROOM-017 | The system shall provide a room settings screen exposing name, visual marker, default share policy, notification preferences, storage usage and the destructive actions, grouped so that no destructive action is adjacent to a routine one. | Must | R1 | E02 | `E2E` `Review` |
| FR-ROOM-018 | The system shall allow the Owner to set a room-level default share policy covering download-allowed, link expiry default and watermark default, which pre-populates but does not lock the per-share controls. | Should | R2 | E07 | `API` `E2E` |
| FR-ROOM-019 | The system shall not enumerate, return in search, or make addressable any room to a principal holding no grant on that room or any of its descendants, per BR-046. | Must | R1 | E02 | `API` `Sec` |
| FR-ROOM-020 | The system shall return a response indistinguishable from that for a non-existent identifier when a principal without a grant requests a valid room, folder, file or share identifier, per BR-049. | Must | R1 | E02 | `API` `Sec` |
| FR-ROOM-021 | The system shall offer room templates that create a room with a predefined folder structure, including at minimum a Business Sale template and a Property Sale template. | Should | R2 | E02 | `API` `E2E` |
| FR-ROOM-022 | The system shall allow a user to save the folder structure of an existing room as a reusable personal template, excluding all file contents. | Should | R2 | E02 | `API` `E2E` |
| FR-ROOM-023 | The system shall display the total storage consumed by each room on the room row and in room settings, computed from committed file bytes only. | Should | R1 | E12 | `API` `E2E` |
| FR-ROOM-024 | The system shall display the total item count of each room, separating folders from files. | Could | R2 | E02 | `API` `E2E` |
| FR-ROOM-025 | The system shall allow the room list to be sorted by last activity, name or creation date, and shall persist the chosen order per account. | Should | R1 | E02 | `E2E` |
| FR-ROOM-026 | The system shall provide a filter on the room list for rooms shared by me, shared with me and archived. | Could | R2 | E02 | `E2E` |
| FR-ROOM-027 | The system shall provide a name search across the rooms a principal can see, returning results as the principal types. | Should | R1 | E06 | `API` `E2E` |
| FR-ROOM-028 | The system shall expose a stable, shareable deep link to a room that resolves to that room after authentication, or to the indistinguishable-not-found response for a principal with no grant. | Must | R1 | E02 | `API` `E2E` |
| FR-ROOM-029 | The system shall provide an entry point in room settings to transfer ownership of the room to another account, executing the transfer rules in BR-029. | Should | R2 | E07 | `API` `E2E` |
| FR-ROOM-030 | The system shall display, in the room header, a persistent indicator of how many principals currently have access to the room, which opens the share-management screen when activated. | Must | R1 | E07 | `E2E` `Review` |

### Notes and rationale

- **FR-ROOM-015 and FR-ROOM-016 exist because of a named job-to-be-done.** Persona P1 runs five to
  eight live mandates at once and her stated failure mode is sending Deal A's financials to Deal
  B's recipient. On a 360 px screen a room name alone truncates to a few words, so the product commits
  to a non-textual differentiator (colour plus emoji) and to never letting the room name leave the
  header, including inside the full-screen viewer. This is a mobile-specific safety requirement,
  not decoration.
- **FR-ROOM-019 and FR-ROOM-020 are the invisibility rule from the brief, split into two testable
  halves.** One half is about enumeration (you cannot list what you were not given), the other is
  about probing (a valid identifier must not confirm its own existence). Both are security tests,
  not UI tests, and both are enforced at the API.
- **FR-ROOM-006 archive rather than only delete.** A closed deal is not a deleted deal. Staff need
  the room to stop being reachable by recipients while remaining retrievable for their own records,
  which is exactly the shape of archive. FR-ROOM-007 deliberately does not reinstate shares on
  restore; silently re-opening a recipient's access months later is the single most dangerous thing
  this product could do.
- **FR-ROOM-030 answers "who can see this right now" from the room header.** The prior-art review
  finds no comparable tool with a permanently visible access indicator, and finds the same failure
  mode in all of them: this information lives only in a desktop dashboard. Putting the count in the
  header on every screen makes the answer one tap away on a phone, which is a known failure mode we
  are choosing not to repeat.
- **Estimate:** the 3-second room-creation budget in FR-ROOM-003 is derived from persona P1's
  stated four-minute abandonment threshold for the whole first-room flow, apportioned across
  create, upload and share. It is an estimate, not a measured figure.

---

## FR-FLDR: Folder hierarchy, navigation, cascade delete and limits

Owning epic: [E03 Folder Hierarchy and Navigation](./backlog/epic-03-folder-hierarchy-and-navigation.md).
This domain carries the four requested requirements from the stakeholder brief verbatim: create
and nest, view with breadcrumbs, rename, and delete with a warning of what will be destroyed.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-FLDR-001 | The system shall allow a principal with create authority to create a folder in the current location by supplying a name. | Must | R1 | E03 | `API` `E2E` |
| FR-FLDR-002 | The system shall expose folder creation as an always-visible primary affordance on the folder screen, never only inside an overflow menu. | Must | R1 | E03 | `E2E` `Review` |
| FR-FLDR-003 | The system shall allow a folder to be created inside another folder to the maximum depth defined in BR-160, with no restriction on breadth. | Must | R1 | E03 | `API` `Unit` |
| FR-FLDR-004 | The system shall reject a folder creation or move that would exceed the maximum depth, returning a typed error that names the limit and the current depth, and shall surface that text to the user without paraphrase. | Must | R1 | E03 | `API` `E2E` |
| FR-FLDR-005 | The system shall reject a create, rename or move that would exceed the maximum total path length defined in BR-159, returning a typed error stating the resulting length and the limit. | Must | R1 | E08 | `API` `E2E` |
| FR-FLDR-006 | The system shall allow a principal with manage authority to rename a folder, presenting the current name pre-filled and fully selected in a single-field sheet. | Must | R1 | E03 | `API` `E2E` |
| FR-FLDR-007 | The system shall allow a folder to be moved to a different parent within the same room, using the destination picker specified in FR-FILE-024. | Must | R1 | E03 | `API` `E2E` |
| FR-FLDR-008 | The system shall reject any attempt to move a folder into itself or into any of its own descendants, returning a typed error, and shall disable the offending destinations in the picker rather than allowing selection and then failing. | Must | R1 | E08 | `API` `E2E` `Unit` |
| FR-FLDR-009 | The system shall allow a principal with delete authority to delete a folder together with every nested folder and file it contains, as a single atomic operation. | Must | R1 | E03 | `API` `E2E` |
| FR-FLDR-010 | The system shall present, before any cascade delete is committed, a warning that states the exact count of subfolders, the exact count of files, the total byte size, and the number of active shares that will stop working, per BR-172. | Must | R1 | E03 | `E2E` `Device` `Unit` |
| FR-FLDR-011 | The system shall require a second, explicitly distinct confirmation gesture when a cascade delete would destroy more than the threshold in BR-174 or would break any active share. | Must | R1 | E03 | `E2E` `Device` |
| FR-FLDR-012 | The system shall commit a destructive action on the pointer up-event only, and shall allow the gesture to be aborted by moving off the control before release, in accordance with WCAG 2.2 SC 2.5.2. | Must | R1 | E09 | `E2E` `A11y` |
| FR-FLDR-013 | The system shall offer a time-boxed undo of a folder deletion in a toast for the duration defined in BR-176, which reverses the deletion without requiring the trash screen. | Must | R1 | E03 | `E2E` `API` |
| FR-FLDR-014 | The system shall display a breadcrumb showing the path from the room root to the current folder on every folder screen. | Must | R1 | E03 | `E2E` |
| FR-FLDR-015 | The system shall, at compact width, collapse a breadcrumb that does not fit on one line into the room root, an ellipsis affordance and the current folder, and shall never wrap the breadcrumb to a second line or scroll the page horizontally. | Must | R1 | E03 | `E2E` `Device` |
| FR-FLDR-016 | The system shall open, when the collapsed breadcrumb ellipsis is activated, a single sheet listing the full ancestor chain in order, where activating any ancestor navigates directly to it. | Must | R1 | E03 | `E2E` `A11y` |
| FR-FLDR-017 | The system shall keep the breadcrumb and the current folder name pinned to the top of the viewport while the folder contents scroll. | Must | R1 | E09 | `E2E` `Device` |
| FR-FLDR-018 | The system shall navigate into a folder on a single tap of its row at compact width, with drill-down as the primary navigation model. | Must | R1 | E03 | `E2E` |
| FR-FLDR-019 | The system shall provide an explicit up-one-level affordance in the header of every folder screen, independent of any system or gesture back. | Must | R1 | E03 | `E2E` `Device` |
| FR-FLDR-020 | The system shall register every folder navigation, every open sheet, every full-screen preview and every entry into selection mode as its own browser history entry, so that Android system back and the iOS in-app back each unwind exactly one level. | Must | R1 | E09 | `E2E` `Device` |
| FR-FLDR-021 | The system shall provide a mobile folder-tree equivalent: a sheet that presents the room's folder hierarchy as a lazily expanded, indentation-limited list with a jump-to action on every node, reachable from the breadcrumb through the same affordance as the ancestor sheet in FR-FLDR-016. | Must | R1 | E03 | `E2E` `A11y` `Device` |
| FR-FLDR-022 | The system shall present a persistent folder tree in a navigation rail or drawer at the expanded width class and above, as defined by the size-class ladder in [03-product-overview.md](./03-product-overview.md), with expand and collapse controls no smaller than the minimum target size in FR-MOB-028. | Should | R2 | E03 | `E2E-D` `A11y` |
| FR-FLDR-023 | The system shall not present an indented folder tree as the primary navigation at compact width. | Must | R1 | E03 | `Review` `E2E` |
| FR-FLDR-024 | The system shall display, on every folder row, the count of items the folder directly contains. | Should | R1 | E03 | `API` `E2E` |
| FR-FLDR-025 | The system shall present folder details on request, comprising name, full path, direct item count, recursive item count, total size, created timestamp, modified timestamp, creating principal, and the principals with access. | Should | R1 | E05 | `API` `E2E` |
| FR-FLDR-026 | The system shall restore the previous scroll position when the principal returns to a folder from a child folder, a preview or a sheet. | Must | R1 | E10 | `E2E` `Device` |
| FR-FLDR-027 | The system shall expose a stable deep link to any folder that resolves directly to that folder for a principal with a grant. | Must | R1 | E03 | `API` `E2E` |
| FR-FLDR-028 | The system shall offer a copy-path action that places the human-readable path of the current folder on the clipboard. | Could | R2 | E03 | `E2E` |
| FR-FLDR-029 | The system shall render an empty-folder state that offers upload and create-folder as primary actions and states plainly that the folder is empty. | Must | R1 | E03 | `E2E` `Review` |
| FR-FLDR-030 | The system shall allow a new folder to be created from inside the move or copy destination picker without opening a second stacked sheet, per FR-MOB-005. | Should | R1 | E04 | `E2E` `Device` |

### Notes and rationale

- **Desktop primitive translated: the folder tree.** The brief asks for a files tree view. An
  indented tree is actively hostile at 320 to 360 CSS px: indentation consumes the width that
  filenames need, WCAG 2.2 SC 1.4.10 forbids reflowing it away with horizontal scrolling, and
  expand-collapse twisties routinely fall below the 24 CSS px floor of SC 2.5.8 while sitting
  immediately beside the row's own navigate target. The resolution in this document is a three-part
  answer, not a drop: FR-FLDR-018 makes drill-down the compact primary, FR-FLDR-021 gives the tree
  a genuine mobile home as an on-demand sheet with a jump action (so "show me the whole shape of
  this room" is still answerable with one thumb), and FR-FLDR-022 reinstates the real persistent
  tree at the expanded width class where it belongs. FR-FLDR-023 states the prohibition explicitly
  so that nobody re-adds a shrunken tree as a "nice to have". The three requirements are the
  complete translation and are traced as a set: the mobile tree sheet is FR-FLDR-021 plus its
  breadcrumb entry point FR-FLDR-016 plus the prohibition FR-FLDR-023, and the desktop tree rail is
  FR-FLDR-022 alone.
- **Desktop primitive translated: breadcrumbs on a phone.** FR-FLDR-015 and FR-FLDR-016 turn the
  breadcrumb from a wide horizontal row into a fixed-height, three-slot control plus an ancestor
  sheet. The rule against wrapping is deliberate: a two-line breadcrumb that grows to three lines
  at 200 percent text size (WCAG 2.2 SC 1.4.4) pushes the content list off the screen.
- **FR-FLDR-020 is the single most-missed mobile requirement in this class of product.** Android
  has a system back that must pop in-app history; iOS in a standalone home-screen web app has no
  browser chrome at all, so it needs an in-app back affordance plus correct history depth. Treating
  sheets, previews and selection mode as history entries is what makes both platforms behave. It is
  listed here rather than only in FR-MOB because folder navigation is where the failure is most
  visible.
- **FR-FLDR-010 is the brief's "warn the user what will be deleted", made measurable.** A warning
  that says "This will delete the folder and its contents" is not verifiable. A warning that says
  "3 folders, 47 files, 812 MB, and 2 people will lose access" is. The counts are computed
  server-side so they cannot drift from reality, and the share count is included because losing a
  counterparty's access is a business consequence a broker must see before tapping.
- **FR-FLDR-011 second confirmation is scoped by blast radius, not applied everywhere.** Requiring
  a typed confirmation for every delete trains users to defeat it. Requiring it only above a
  threshold or when a live share breaks keeps the friction where the danger is.
- **FR-FLDR-008 disabling invalid destinations rather than failing after selection** is a
  mobile-specific choice. On a phone, a rejected operation after a multi-step picker flow means
  re-navigating the whole picker. Disabling the subtree in the picker costs one server-computed
  field and removes the failure entirely.

---

## FR-FILE: File operations, upload, download, move, trash and bulk actions

Owning epic: [E04 File Operations](./backlog/epic-04-file-operations.md).
This domain carries the base file-manager operations from the brief (create, delete, copy, rename,
cut, paste, download, upload) and re-specifies each of them for touch.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-FILE-001 | The system shall allow a principal with upload authority to select one or more files from the device file picker and upload them into the current folder. | Must | R1 | E04 | `API` `E2E` |
| FR-FILE-002 | The system shall offer a camera-capture upload path on devices whose browser supports the `capture` attribute, producing a file that lands directly in the current folder. | Must | R1 | E04 | `Device` `E2E` |
| FR-FILE-003 | The system shall assemble multiple captured pages into a single multi-page PDF before upload when the principal chooses the document-scan path, with per-page retake and reorder before commit. | Should | R2 | E04 | `Device` `E2E` |
| FR-FILE-004 | The system shall offer a photo-library upload path that works with the platform's permissionless, selection-scoped photo picker, and shall never require or imply library-wide access. | Must | R1 | E04 | `Device` `Review` |
| FR-FILE-005 | The system shall register as an OS share target on platforms that support `share_target`, accepting files shared from another application into a chosen room and folder. | Should | R2 | E04 | `Device` |
| FR-FILE-006 | The system shall state plainly, on platforms without `share_target` support, that files must be added through the in-application picker, and shall not display a non-functional share-to-app affordance. | Must | R2 | E04 | `Review` `Device` |
| FR-FILE-007 | The system shall accept a multi-file upload as a single queue with a visible aggregate progress indicator and a per-file row showing name, size, progress and state. | Must | R1 | E04 | `E2E` `Device` |
| FR-FILE-008 | The system shall upload every file in resumable chunks, committing the confirmed byte offset to durable local storage before each chunk is sent, per BR-208. | Must | R1 | E04 | `Unit` `API` `Device` |
| FR-FILE-009 | The system shall resume an interrupted upload from the last confirmed byte offset when the application is next opened, without re-sending confirmed bytes. | Must | R1 | E04 | `API` `Device` |
| FR-FILE-010 | The system shall label a suspended upload as paused and state that the application must be open for it to continue, and shall never present an upload as progressing in the background on a platform where it cannot. | Must | R1 | E04 | `Review` `Device` |
| FR-FILE-011 | The system shall adapt chunk size to the observed connection, using smaller chunks on a metered or slow connection and larger chunks on an unmetered fast connection, within the bounds in BR-209. | Should | R1 | E10 | `Unit` `Device` |
| FR-FILE-012 | The system shall request a screen wake lock while a foreground upload is in progress, on browsers that support it, and shall release it on completion, cancellation or failure. | Should | R2 | E04 | `Device` |
| FR-FILE-013 | The system shall allow an individual queued or in-progress upload to be cancelled, and shall discard any partially uploaded bytes for that file server-side. | Must | R1 | E04 | `API` `E2E` |
| FR-FILE-014 | The system shall allow a failed upload to be retried individually and shall offer a single "Retry all failed" action when more than one has failed. | Must | R1 | E04 | `E2E` `API` |
| FR-FILE-015 | The system shall treat a retried upload of the same content into the same folder under the same name as the same upload, and shall not create a duplicate item, per BR-152. | Must | R1 | E08 | `API` `Unit` |
| FR-FILE-016 | The system shall never hold an entire file in memory during upload, reading it only through sliced streams, so that a multi-gigabyte file can be uploaded from a device with a low browser memory ceiling. | Must | R1 | E10 | `Unit` `Device` |
| FR-FILE-017 | The system shall accept a folder selection for upload on browsers that support directory selection, reconstructing the folder hierarchy server-side from the supplied relative paths. | Should | R2 | E04 | `E2E-D` `API` |
| FR-FILE-018 | The system shall offer, on any platform where directory selection is unavailable, an explicit alternative of multi-file selection into the current folder plus an upload of a zip archive that the server expands into a folder tree. | Should | R2 | E04 | `API` `Device` |
| FR-FILE-019 | The system shall allow a single file to be downloaded by a principal whose grant permits download. | Must | R1 | E04 | `API` `E2E` |
| FR-FILE-020 | The system shall allow a folder or a multi-file selection to be downloaded as a single zip archive streamed by the server without server-side buffering of the whole archive. | Should | R1 | E04 | `API` `Device` |
| FR-FILE-021 | The system shall describe a completed download in terms the platform actually guarantees, naming the platform's own downloads location, and shall not claim to know or to verify the on-device path. | Must | R1 | E04 | `Review` `Device` |
| FR-FILE-022 | The system shall maintain a per-principal list of recently downloaded items as re-fetchable server links rather than as references to local files. | Should | R2 | E04 | `E2E` |
| FR-FILE-023 | The system shall offer, on browsers supporting the Web Share API with files, an "Open in" or "Share to app" action that hands a file to another application on the device. | Should | R1 | E04 | `Device` |
| FR-FILE-024 | The system shall provide a destination picker for move and copy that opens as a single sheet with its own internal breadcrumb and in-sheet drill-down, and shall not stack a second sheet on top of it. | Must | R1 | E04 | `E2E` `Device` |
| FR-FILE-025 | The system shall allow a file or a selection of files to be moved to another folder within the same room via the destination picker. | Must | R1 | E04 | `API` `E2E` |
| FR-FILE-026 | The system shall provide a cut-and-paste equivalent on touch as a persistent staging tray: a slim bar that reports the count of items held for transfer, survives navigation to another folder, and offers a paste action in the destination. | Must | R1 | E04 | `E2E` `Device` `Review` |
| FR-FILE-027 | The system shall allow a file or a selection to be copied to another folder within the same room, leaving the source untouched. | Must | R1 | E04 | `API` `E2E` |
| FR-FILE-028 | The system shall allow a file to be duplicated in place, producing a new item named by the deterministic duplicate-resolution algorithm in BR-146. | Must | R1 | E04 | `API` `Unit` |
| FR-FILE-029 | The system shall allow a file to be renamed through a single-field sheet in which only the base name is pre-selected and the extension is preserved unless the principal deliberately edits it. | Must | R1 | E04 | `E2E` `Unit` |
| FR-FILE-030 | The system shall hide file extensions in list and tile rows by default, shall provide a setting to show them, and shall apply that choice consistently in every list, detail sheet and rename field. | Should | R2 | E05 | `E2E` `Review` |
| FR-FILE-031 | The system shall delete a file to the room's trash rather than destroying it, and shall show a toast with a time-boxed undo. | Must | R1 | E04 | `API` `E2E` |
| FR-FILE-032 | The system shall present a trash screen per room listing deleted items with their original path, deletion timestamp, deleting principal and remaining retention time. | Must | R1 | E08 | `API` `E2E` |
| FR-FILE-033 | The system shall restore an item from trash to its original path, applying the fallback path rules in BR-181 when the original parent no longer exists. | Must | R1 | E08 | `API` `E2E` |
| FR-FILE-034 | The system shall allow a principal with delete authority to permanently delete an item from trash, behind an explicit confirmation that states the action cannot be undone. | Must | R1 | E08 | `API` `E2E` |
| FR-FILE-035 | The system shall enter multi-select mode on a long-press of any row, selecting that row, and shall also enter it from an always-visible "Select" control; long-press shall carry this single meaning in every list in the product and shall never open a contextual action sheet. | Must | R1 | E09 | `E2E` `Device` `Review` |
| FR-FILE-036 | The system shall display, in multi-select mode, a contextual bottom action bar that replaces the normal action bar, states the number of selected items, and exposes the bulk actions with visible text labels. | Must | R1 | E04 | `E2E` `A11y` |
| FR-FILE-037 | The system shall provide explicit "Select all" and "Select none" controls in multi-select mode, and shall provide a "Select from here to…" action as the non-dragging equivalent of a range selection. | Must | R1 | E04 | `E2E` `A11y` |
| FR-FILE-038 | The system shall support bulk move, bulk copy, bulk download, bulk delete and bulk share on a selection, with a per-operation cap defined in BR-219. | Must | R1 | E04 | `API` `E2E` |
| FR-FILE-039 | The system shall report the outcome of every bulk operation as a per-item result, naming each failed item and the reason, and shall never report an operation as successful when any item failed. | Must | R1 | E04 | `API` `E2E` |
| FR-FILE-040 | The system shall allow a long-running bulk operation to be cancelled, committing the items already processed and leaving the remainder untouched, and shall report the split explicitly. | Should | R1 | E04 | `API` `E2E` |
| FR-FILE-041 | The system shall support dragging files and folders onto a folder to move them, and dragging from the operating system onto the file list to upload, at widths with a fine pointer available. | Should | R2 | E04 | `E2E-D` |
| FR-FILE-042 | The system shall provide, for every drag-based operation, an equivalent single-pointer path that requires no dragging, in accordance with WCAG 2.2 SC 2.5.7. | Must | R1 | E09 | `A11y` `E2E` |
| FR-FILE-043 | The system shall allow a file to be replaced by a new upload of the same name as a new version rather than as a new item, when the principal chooses Replace in the conflict sheet. | Must | R1 | E08 | `API` `E2E` |
| FR-FILE-044 | The system shall allow the creation of an empty plain-text or Markdown file in the current folder and its subsequent editing in a full-screen editor. | Could | R3 | E04 | `API` `E2E` |
| FR-FILE-045 | The system shall reject an upload whose declared or actual size would take the destination room over its administrator-set storage quota (FR-ACCT-027), per BR-201 to BR-205, before any bytes are committed. | Must | R1 | E12 | `API` `E2E` |

### Notes and rationale

- **Desktop primitive translated: cut, copy and paste.** The brief lists cut and paste as base
  operations. On touch there is no persistent clipboard the user can see, and a modal
  "choose a destination" flow loses the ability to browse freely while holding items. FR-FILE-026
  therefore specifies a staging tray: the touch analogue of the clipboard made visible. It survives
  navigation, it reports its own contents ("3 items ready to move"), and it is dismissible. This is
  the mechanism the coordinator persona (P4) needs to fix a misfiled batch from a train.
  FR-FILE-024 keeps the alternative one-shot flow (pick destination now) for the common single-move
  case, and the single-sheet rule prevents the sheet-on-sheet pile-up that destroys back-navigation.
- **Desktop primitive translated: drag and drop.** Touch drag-and-drop is not a viable primary
  mechanism. Finger touches do not fire drag events on Chrome for Android, Firefox for Android or
  Samsung Internet, so touch DnD requires a fragile pointer-event shim; and WCAG 2.2 SC 2.5.7
  requires a non-dragging single-pointer alternative regardless. FR-FILE-025 and FR-FILE-026 are
  therefore the baseline, FR-FILE-041 adds real drag-and-drop only where a fine pointer exists, and
  FR-FILE-042 states the obligation as a standalone testable requirement so it cannot be lost in a
  sprint.
- **Desktop primitive translated: rubber-band multi-select.** There is no touch analogue to a
  marquee drag. FR-FILE-035 to FR-FILE-037 specify the platform-sanctioned model instead: an
  explicit selection mode, checkboxes on every row, a count-bearing contextual action bar, and
  "Select from here to…" as the range operation.
- **Long-press means selection, and nothing else (OQ89, RESOLVED by D01).** FR-FILE-035 gives
  long-press exactly one meaning product-wide: enter multi-select mode and select the row that was
  pressed. It never opens the action sheet. The action sheet has its own visible affordance, the
  per-row overflow button in FR-MOB-001. This matches iOS Files, Google Drive and Dropbox, so the
  gesture a colleague already has in their fingers does what they expect; it keeps the sheet
  discoverable, which satisfies WCAG 2.2 SC 2.5.1 without a separate fallback; and it removes the
  inconsistency between lists that made users believe selection was broken. Anything that opens a
  contextual sheet on long-press is a defect against FR-FILE-035 and FR-MOB-001.
- **The brief's "create" is two capabilities, and a third lesser one.** "Create" in the base
  file-manager list means create-folder (FR-FLDR-001) and upload (FR-FILE-001 onward); those two are
  R1 Must and are what a colleague means when they say they need to create something in a room.
  Creating an empty plain-text or Markdown file inside the application (FR-FILE-044) is a separate,
  lesser capability with its own editor surface, and it is deliberately left at Could / R3. R1 is
  not incomplete without it, and no scope table should read the brief's "create" as requiring it.
- **FR-FILE-008 to FR-FILE-010 are the honest upload story.** There is no Background Fetch on iOS
  and none inside in-app WebViews on any platform; a frozen page cannot run fetch callbacks, a
  discarded page cannot run any code, and `unload` does not fire when a tab is closed from the
  mobile tab switcher. The offset must therefore be committed before each chunk, not after, and the
  UI must say "Paused, reopen to continue" rather than implying background progress. Claiming
  background upload on iOS is a defect against FR-FILE-010, not a copy nit.
- **FR-FILE-021 is the honest download story.** Safari on iOS routes a download through its own
  download manager into a Downloads folder whose location the user configures; the page is never
  told the path, gets no completion callback and cannot verify the bytes landed. Download is
  therefore modelled as fire-and-forget, with FR-FILE-022 keeping a list of re-fetchable server
  links rather than pretending to track local files.
- **FR-FILE-020 zips on the server, not the client.** Client-side archiving must either buffer in
  memory (which crashes at the iOS memory ceiling) or stream to a file handle, and there is no
  save-file picker on iOS to stream into. A server-streamed archive with no server-side buffering is
  the only option that behaves the same on every platform.
- **FR-FILE-016 exists because the iOS browser memory ceiling is low, undocumented and
  uncatchable.** A published measurement puts a mobile Safari page crash at roughly 100 MB of
  allocated JavaScript array data on an iPhone SE 3rd generation, with no catchable JavaScript
  exception. Order of magnitude, not a byte budget, but it forbids reading a whole file into memory
  anywhere in the upload, preview or archive paths.
- **FR-FILE-039 partial-failure reporting is a trust requirement.** The prior-art review records
  repeated reports of stalling bulk uploads and silently unconfirmed folder moves. On a
  phone a silent partial failure is close to undetectable, so the requirement is written as a
  prohibition on reporting success when anything failed.

---

## FR-VIEW: Views, thumbnails, details, preview and viewer

Owning epic: [E05 Viewing, Preview and File Details](./backlog/epic-05-viewing-preview-and-file-details.md).
This domain carries the brief's list and tiles views, file preview pane with file information, and
split view, each re-specified for touch.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-VIEW-001 | The system shall present folder contents in a list view showing, per row, the item name, a type indicator, and one line of secondary metadata. | Must | R1 | E05 | `E2E` |
| FR-VIEW-002 | The system shall present folder contents in a tiles view with a thumbnail or type glyph per item, at a tile size that yields at least two columns at 360 CSS px width. | Must | R1 | E05 | `E2E` `Device` |
| FR-VIEW-003 | The system shall allow the principal to switch between list and tiles from an always-visible control on the folder screen. | Must | R1 | E05 | `E2E` |
| FR-VIEW-004 | The system shall persist the chosen view mode per account per room and apply it on every device. | Should | R1 | E05 | `API` `E2E` |
| FR-VIEW-005 | The system shall generate thumbnails server-side for image, PDF and video files, and shall serve a type glyph where no thumbnail can be produced. | Must | R1 | E05 | `API` `E2E` |
| FR-VIEW-006 | The system shall load thumbnails lazily as rows approach the viewport, and shall reserve the thumbnail's layout box before the image arrives so that no layout shift occurs. | Must | R1 | E10 | `Lab` `Field` |
| FR-VIEW-007 | The system shall present file details in a bottom sheet at a medium detent that leaves part of the underlying list visible, opened from an explicit details affordance on the row. | Must | R1 | E05 | `E2E` `Device` |
| FR-VIEW-008 | The system shall include in the file details sheet the name, extension, file size, MIME type, created timestamp, modified timestamp, creating principal, full path, current version number and the list of principals with access. | Must | R1 | E05 | `API` `E2E` |
| FR-VIEW-009 | The system shall make the details sheet resizable with a grabber that can also be activated by a single tap to cycle between detents, and shall support swipe-down to dismiss. | Must | R1 | E09 | `E2E` `A11y` |
| FR-VIEW-010 | The system shall open a file preview as a full-screen view that is its own history entry, so that system back and in-app back both close it and return to the list at its previous scroll position. | Must | R1 | E05 | `E2E` `Device` |
| FR-VIEW-011 | The system shall allow the full-screen viewer to be dismissed by a downward swipe as well as by a visible close control. | Must | R1 | E05 | `E2E` `A11y` |
| FR-VIEW-012 | The system shall allow horizontal swipe in the full-screen viewer to move to the previous and next file in the current folder's active sort order, and shall provide visible previous and next controls as the single-pointer equivalent. | Should | R1 | E05 | `E2E` `A11y` |
| FR-VIEW-013 | The system shall support pinch-to-zoom in the viewer and shall additionally provide zoom-in, zoom-out and fit-to-width controls operable with a single pointer, in accordance with WCAG 2.2 SC 2.5.1. | Must | R1 | E05 | `E2E` `A11y` `Device` |
| FR-VIEW-014 | The system shall render the first page of a PDF preview to a visible state within the budget in NFR-PERF, measured on the reference device over the reference network. | Must | R1 | E05 | `Field` `Device` |
| FR-VIEW-015 | The system shall render PDF previews one page at a time, reusing a single drawing surface and releasing it when the viewer closes, and shall not parse an entire document into the browser tab. | Must | R1 | E10 | `Unit` `Device` |
| FR-VIEW-016 | The system shall serve server-rendered page images instead of client-side rendering for any document larger than 25 MB. | Must | R1 | E05 | `API` `Device` |
| FR-VIEW-017 | The system shall provide a page-number indicator and a jump-to-page control in the PDF viewer. | Should | R1 | E05 | `E2E` |
| FR-VIEW-018 | The system shall provide a rotate control in the image and PDF viewer that rotates the displayed content without modifying the stored file. | Should | R2 | E05 | `E2E` |
| FR-VIEW-019 | The system shall preview PDF, JPEG, PNG, WebP, HEIC, GIF, SVG, MP4, MOV, MP3, WAV, plain text, Markdown and common source-code types in R1. | Must | R1 | E05 | `E2E` `Device` |
| FR-VIEW-020 | The system shall preview Microsoft Word, Excel and PowerPoint documents through a server-side conversion to a paginated image or PDF representation. | Should | R2 | E05 | `API` `Device` |
| FR-VIEW-021 | The system shall present, for a file type it cannot preview, a state that names the type, states that no preview is available, and offers download and open-in-another-app as the available actions. | Must | R1 | E05 | `E2E` `Review` |
| FR-VIEW-022 | The system shall stream video and audio through HTTP range requests or an adaptive streaming manifest, and shall never fetch a media file into memory as a whole before playback. | Must | R1 | E05 | `Unit` `Device` |
| FR-VIEW-023 | The system shall reflow text and Markdown previews to the viewport width, with no horizontal scrolling required at 320 CSS px. | Must | R1 | E05 | `E2E` `A11y` |
| FR-VIEW-024 | The system shall resume a document preview at the page and scroll offset the principal last viewed, per file per principal, retaining that position for at least 90 days. | Should | R1 | E05 | `API` `Device` |
| FR-VIEW-025 | The system shall allow folder contents to be sorted by name, size, type, modified date and created date, in ascending or descending order. | Must | R1 | E05 | `API` `E2E` |
| FR-VIEW-026 | The system shall persist the chosen sort per account per room. | Should | R1 | E05 | `API` `E2E` |
| FR-VIEW-027 | The system shall place folders before files in every sort order by default, with a setting to sort them together. | Should | R2 | E05 | `Unit` `E2E` |
| FR-VIEW-028 | The system shall offer grouping of folder contents by type or by modified date, rendered as sticky group headers. | Could | R2 | E05 | `E2E` |
| FR-VIEW-029 | The system shall present a two-pane split view for moving and copying files between two locations only at the expanded width class and above, as defined by the size-class ladder in [03-product-overview.md](./03-product-overview.md), and only where the viewport height is at least 480 CSS px. | Should | R2 | E05 | `E2E-D` `Device` |
| FR-VIEW-030 | The system shall provide the staging tray in FR-FILE-026 as the compact-width equivalent of split view, and shall document it as such in the interface. | Must | R1 | E05 | `Review` `Device` |
| FR-VIEW-031 | The system shall offer preset split ratios as a non-dragging alternative wherever a split divider can be dragged. | Must | R2 | E09 | `A11y` `E2E-D` |
| FR-VIEW-032 | The system shall dock the file-details component as a persistent inspector pane at the expanded width class and above, as defined by the size-class ladder in [03-product-overview.md](./03-product-overview.md), using the same component as the mobile details sheet. | Should | R2 | E05 | `E2E-D` |
| FR-VIEW-033 | The system shall not gate any information or action behind hover, and shall enable hover-revealed affordances only where the pointer is fine and hover is available. | Must | R1 | E09 | `E2E` `Review` |
| FR-VIEW-034 | The system shall operate in both portrait and landscape orientation on every screen, with no orientation lock and no instruction to rotate the device. | Must | R1 | E09 | `A11y` `Device` |
| FR-VIEW-035 | The system shall overlay a dynamic watermark carrying the viewer's identifier and the access timestamp on every rendered preview page of a file shared with watermarking enabled. | Should | R1.1 | E07 | `API` `Device` |

### Notes and rationale

- **Desktop primitive translated: the hover preview pane.** There is no hover on touch, so a pane
  that populates on hover simply does not exist on a phone. The brief's preview pane is split into
  two touch-native surfaces: FR-VIEW-007 gives file information a bottom sheet at a medium detent
  (so the list stays partly visible and the user keeps their place), and FR-VIEW-010 gives the
  content itself a full-screen viewer with its own history entry. FR-VIEW-032 then re-docks the same
  details component as a real inspector pane at expanded width, which means one component and two
  presentations rather than two implementations.
- **Desktop primitive translated: split view.** Split view is the brief's mechanism for moving files
  between two locations. At 360 CSS px, two panes each get 180 px, which fails WCAG 2.2 SC 1.4.10 as
  soon as filenames are involved. FR-VIEW-029 gates the real split view on both width class and
  height (a landscape phone can clear a width threshold while having almost no vertical room, which
  is precisely where a width-only rule breaks), and FR-VIEW-030 names the staging tray as the
  compact equivalent so the capability is never absent, only differently shaped. The width classes
  and the 480 CSS px height floor are the ladder in [03](./03-product-overview.md); no other
  breakpoint number appears in this domain.
- **FR-VIEW-014 to FR-VIEW-016 are the performance commitment.** Slow preview of large files is the
  most consistently reported failure across the prior art, from Ansarada's very long previews to
  Papermark's reviewers stating that most participants open documents from their phones. A budgeted
  first-page paint, page-at-a-time rendering and
  server-side rendering above a threshold is the only combination that survives the canvas and
  memory ceilings on iOS. The single-drawing-surface rule in FR-VIEW-015 exists because Safari
  enforces both a per-canvas pixel cap and a total canvas memory budget.
- **FR-VIEW-024 resume position is a persona requirement, not a nicety.** Recipient sessions
  observed in the prior art run 20 seconds to 4 minutes and are interrupted constantly; the research puts a complete
  investor deck review at roughly 3.2 minutes with about 15 seconds per page. Six interrupted
  sessions must add up to one review, which only works if position survives app switching. Note the
  interaction with the platform: the last guaranteed moment to persist it is the transition to
  hidden, so the position is written on `visibilitychange`, not on unload.
- **FR-VIEW-002 two-column minimum at 360 px** is what makes tiles worth having on a phone. A
  single-column tile view is a worse list view.
- **FR-VIEW-035 watermarking is R1.1, and it does not ship alone.** The research is explicit that
  staff will demand the watermark, the per-viewer access log and link expiry together, the first
  time a confidential document leaks. Those three are exactly the R1.1 trust increment: watermark
  here and in FR-SHARE-012, the per-viewer access log in FR-AUDIT-004, expiry in FR-SHARE-009, plus
  the recipient tracking disclosure (NFR-PRIV-010) that is a hard precondition of the access log.
  Watermarking sits after R1 rather than inside it only because it depends on server-side page
  rendering (FR-VIEW-016) being in place first. The sequencing risk is recorded in
  [12-risks-and-open-questions.md](./12-risks-and-open-questions.md).

---

## FR-SRCH: Search and discovery

Owning epic: [E06 Search and Discovery](./backlog/epic-06-search-and-discovery.md).
This domain carries the brief's built-in search box. Search is also the mobile substitute for
type-to-jump in a desktop list and, in a room with hundreds of folders, the primary navigation.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-SRCH-001 | The system shall provide a search affordance reachable with one thumb from every room and folder screen, without opening a menu. | Must | R1 | E06 | `E2E` `Device` |
| FR-SRCH-002 | The system shall match on file and folder names in R1, using case-insensitive, diacritic-insensitive, Unicode-normalised substring matching. | Must | R1 | E06 | `API` `Unit` |
| FR-SRCH-003 | The system shall offer a scope selector with the values "This folder", "This room" and "All rooms", visible in the search surface without an extra tap. | Must | R1 | E06 | `E2E` |
| FR-SRCH-004 | The system shall default the search scope to the current room when search is opened from inside a room, and to all rooms when opened from the workspace home. | Must | R1 | E06 | `E2E` `Unit` |
| FR-SRCH-005 | The system shall begin searching after a minimum query length of 2 characters and shall debounce input by 250 ms before issuing a request. | Must | R1 | E06 | `Unit` `E2E` |
| FR-SRCH-006 | The system shall cancel any in-flight search request that a newer keystroke supersedes, and shall never render results belonging to a superseded query. | Must | R1 | E06 | `Unit` `E2E` |
| FR-SRCH-007 | The system shall keep the previously rendered result set visible while a new query is in flight, marking it as stale rather than clearing the list. | Should | R1 | E06 | `E2E` `Device` |
| FR-SRCH-008 | The system shall show, on every result row, the item name, its type, and the path of the folder that contains it. | Must | R1 | E06 | `E2E` |
| FR-SRCH-009 | The system shall highlight the matched substring within the result name. | Should | R1 | E06 | `E2E` |
| FR-SRCH-010 | The system shall navigate, when a result is activated, to the folder that contains the item with that item scrolled into view and momentarily highlighted, rather than only opening the item. | Must | R1 | E06 | `E2E` `Device` |
| FR-SRCH-011 | The system shall offer filters for file type, modified date range, size range, owner and shared status, applied in combination with the text query. | Should | R1 | E06 | `API` `E2E` |
| FR-SRCH-012 | The system shall present the filter controls in a single sheet with an explicit Apply action and a summary of the filters currently in force, and shall not use inline accordions whose scope is ambiguous. | Must | R1 | E06 | `E2E` `Review` |
| FR-SRCH-013 | The system shall display the number of results returned and shall page further results on demand. | Should | R1 | E06 | `API` `E2E` |
| FR-SRCH-014 | The system shall exclude from every result set any item the requesting principal has no grant to see, and shall compute that exclusion server-side. | Must | R1 | E06 | `API` `Sec` |
| FR-SRCH-015 | The system shall record and offer the principal's most recent searches, scoped per account, with a control to clear them. | Should | R1 | E06 | `E2E` |
| FR-SRCH-016 | The system shall allow a query together with its filters and scope to be saved as a named saved search and re-run in one tap. | Could | R2 | E06 | `API` `E2E` |
| FR-SRCH-017 | The system shall present a zero-result state that repeats the query, names the active scope and filters, and offers to widen the scope in one tap. | Must | R1 | E06 | `E2E` `Review` |
| FR-SRCH-018 | The system shall present a search error state with a retry action, distinct from the zero-result state. | Must | R1 | E06 | `E2E` |
| FR-SRCH-019 | The system shall keep the search field and the first result row visible above the on-screen keyboard while typing, using the platform keyboard-inset information. | Must | R1 | E09 | `Device` `A11y` |
| FR-SRCH-020 | The system shall allow search to be dismissed with a single visible control that returns the principal to the exact screen and scroll position from which it was opened. | Must | R1 | E06 | `E2E` |
| FR-SRCH-021 | The system shall announce result count changes through a polite live region so that a screen-reader user learns the outcome without focus moving. | Must | R1 | E09 | `A11y` |
| FR-SRCH-022 | The system shall emit the search events defined in the event dictionary in [10-success-metrics-and-analytics.md](./10-success-metrics-and-analytics.md) — `search_submitted` on query execution, `search_results_returned` on render, and `search_result_opened` on activation — with the payloads that dictionary specifies, so that scope, filter set, result count, latency and device class are all recoverable. | Must | R1 | E06 | `Analytics` |
| FR-SRCH-023 | The system shall search the extracted text content of documents, in addition to names, when content search is enabled for the room. | Should | R2 | E06 | `API` `E2E` |
| FR-SRCH-024 | The system shall extract text from image-only PDFs and photographs through optical character recognition so that scanned documents are findable by their contents. | Could | R3 | E06 | `API` |
| FR-SRCH-025 | The system shall state plainly, when the device is offline, that search covers only the locally cached items, and shall not present a partial result set as complete. | Must | R1 | E10 | `Device` `Review` |

### Notes and rationale

- **Search is the mobile answer to two desktop primitives at once.** It replaces
  type-to-jump-in-a-list (there is no such interaction on a touch screen) and it replaces the tree
  as the way to reach a known item in a large room. That is why FR-SRCH-001 puts it in the thumb
  zone on every screen rather than behind a menu, and why FR-SRCH-010 navigates to the containing
  folder rather than only opening the file: the persona needs to land somewhere they can act, and
  the CPA persona P3 needs to see what else is in that folder.
- **FR-SRCH-002 filename-only in R1 is a deliberate scope cut,** matching the audience research
  finding that the immediate job is "find one specific file out of sixty from a phone", not
  full-text discovery. Content search (FR-SRCH-023) and OCR (FR-SRCH-024) follow, and OCR is
  explicitly the enabler for the capture-to-room workflow where the source document is a
  photograph.
- **FR-SRCH-007 and FR-SRCH-025 are slow-network honesty.** Clearing the list on every keystroke
  produces a flickering empty state on a 100 ms round trip, which reads as breakage. Marking the
  previous set stale is both calmer and more truthful. Offline, the only honest option is to say
  what the result set covers.
- **FR-SRCH-012 rejects inline accordions for the filter panel** because scope ambiguity in a
  collapsed section is a correctness problem, not a cosmetic one: a user who cannot tell whether a
  collapsed filter is still applied will misread the result set. One sheet, one scope, one Apply.
- **FR-SRCH-014 is a security requirement wearing a search costume.** Filtering results in the
  client would leak the existence of items through timing and result counts, which would defeat the
  invisibility rule.
- **FR-SRCH-022 names events, it does not define them.** Event names are owned by
  [10-success-metrics-and-analytics.md](./10-success-metrics-and-analytics.md) and its dictionary is
  the build gate. This requirement previously called for a `search_performed` event, which never
  existed in that dictionary; the name is retired here in favour of the dictionary's own
  `search_submitted`, `search_results_returned` and `search_result_opened`. Any future search event
  is added to the dictionary first and cited here second, never the reverse.

---

## FR-SHARE: Sharing, roles, link controls, revocation and read-only

Owning epic: [E07 Sharing and Access Control](./backlog/epic-07-sharing-and-access-control.md).
This domain carries four of the brief's derivative requirements: access control with roles and
permissions, public link versus permissioned share, access revocation at any time, and read-only
enforcement for shared content.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-SHARE-001 | The system shall allow a principal with share authority to share a whole room. | Must | R1 | E07 | `API` `E2E` |
| FR-SHARE-002 | The system shall allow a principal with share authority to share a single folder, granting access to that folder and its descendants only. | Must | R1 | E07 | `API` `E2E` |
| FR-SHARE-003 | The system shall allow a principal with share authority to share a single file. | Must | R1 | E07 | `API` `E2E` |
| FR-SHARE-004 | The system shall create a public link share that grants access to any holder of the link without authentication, subject to the link controls configured on it, and shall assign every anonymous public-link visitor the Viewer role with no configuration able to raise it, the orthogonal download-allowed flag in FR-SHARE-007 being the only variable. | Must | R1 | E07 | `API` `E2E` `Sec` |
| FR-SHARE-005 | The system shall create a permissioned share by inviting one or more email addresses, where access is bound to the invited address and is not transferable by forwarding the invitation. | Must | R1 | E07 | `API` `Sec` |
| FR-SHARE-006 | The system shall assign every permissioned grant exactly one of the roles Owner, Manager, Contributor or Viewer, as defined in BR-013 to BR-017. | Must | R1 | E07 | `API` `Unit` |
| FR-SHARE-007 | The system shall carry an independent download-allowed flag on every grant and every public link, orthogonal to the role. | Must | R1 | E07 | `API` `Sec` |
| FR-SHARE-008 | The system shall carry an independent can-reshare flag on every grant, orthogonal to the role, defaulting to false for Contributor and Viewer. | Must | R1 | E07 | `API` `Unit` |
| FR-SHARE-009 | The system shall allow an expiry date and time to be set on any public link, after which the link ceases to grant access without any further action by the sharer, and shall never disclose that expiry date to an unauthenticated visitor. | Must | R1.1 | E07 | `API` `E2E` |
| FR-SHARE-010 | The system shall allow a password to be set on any public link, required before any listing, preview or download is served, per BR-088. | Must | R1 | E07 | `API` `Sec` |
| FR-SHARE-011 | The system shall allow download to be turned off on a public link, in which case the API refuses every content-download request for that link while continuing to serve previews. | Must | R1 | E07 | `API` `Sec` |
| FR-SHARE-012 | The system shall allow watermarking to be turned on for a share, applying FR-VIEW-035 to every preview served through it. | Should | R1.1 | E07 | `API` `Device` |
| FR-SHARE-013 | The system shall allow an email-capture gate to be turned on for a public link, per FR-AUTH-022. | Should | R2 | E07 | `API` `E2E` |
| FR-SHARE-014 | The system shall allow any share, permissioned or public, to be revoked at any time by exactly three classes of principal and no other: the Owner of the room containing the shared scope, any Manager on that scope, and the principal that created the grant or link. | Must | R1 | E07 | `API` `E2E` `Sec` |
| FR-SHARE-015 | The system shall make a revocation effective within the propagation target in BR-108, measured from the acknowledged revoke request to the first refused request by the revoked principal. | Must | R1 | E07 | `API` `Sec` `Field` |
| FR-SHARE-016 | The system shall confirm a revocation with an explicit result that names the principal or link revoked and the scope affected, and shall not rely on the absence of an error as confirmation. | Must | R1 | E07 | `E2E` `Review` |
| FR-SHARE-017 | The system shall reject every mutating request from a principal whose effective role does not permit that mutation, at the API, independently of what the interface offered, per BR-121. | Must | R1 | E07 | `API` `Sec` |
| FR-SHARE-018 | The system shall revert an optimistically applied client change and surface the server's typed reason when a mutation is rejected, per BR-133. | Must | R1 | E07 | `E2E` `Unit` |
| FR-SHARE-019 | The system shall list pending invitations per scope, with the invited address, the role, the inviting principal and the send time. | Must | R1 | E07 | `API` `E2E` |
| FR-SHARE-020 | The system shall allow a pending invitation to be resent and to be cancelled. | Must | R1 | E07 | `API` `E2E` |
| FR-SHARE-021 | The system shall allow a recipient to open a shared link on a phone and reach readable content in no more than two taps from the link, with no account creation, no application installation and no interstitial other than a configured password or email gate. | Must | R1 | E07 | `E2E` `Device` |
| FR-SHARE-022 | The system shall present a share-management screen per room that lists every principal and every active link with their scope, role, flags, expiry and last access, answering "who can see what" in one screen. | Must | R1 | E07 | `API` `E2E` |
| FR-SHARE-023 | The system shall display, on every folder and file row and in every details sheet, an indicator of whether that item is currently shared, which opens its share settings when activated. | Must | R1 | E07 | `E2E` `Review` |
| FR-SHARE-024 | The system shall apply the inheritance and override rules in BR-061 to BR-080 when computing the effective permission for any item. | Must | R1 | E07 | `API` `Unit` `Sec` |
| FR-SHARE-025 | The system shall display, before a share is created on a nested item, a summary of exactly what the recipient will be able to see and do, including whether the grant is wider than the parent's. | Must | R1 | E07 | `E2E` `Review` |
| FR-SHARE-026 | The system shall allow a public link to be rotated, invalidating the previous token and issuing a new one while preserving the link's settings and its analytics history. | Should | R1 | E07 | `API` `E2E` |
| FR-SHARE-027 | The system shall serve every public link page with directives that prevent search-engine indexing and prevent referrer leakage, per BR-096. | Must | R1 | E07 | `API` `Sec` |
| FR-SHARE-028 | The system shall present, to a visitor arriving on an expired, revoked, rotated or never-existent link, one generic state carrying the words "This link is no longer active." and nothing else: no item name, no room name, no owner, no expiry date, and no signal distinguishing a link that once existed from a token that never did. | Must | R1 | E07 | `E2E` `Sec` |
| FR-SHARE-029 | The system shall display, per public link, the number of views, the number of unique visitors and the number of downloads. | Should | R1 | E11 | `API` `E2E` |
| FR-SHARE-030 | The system shall allow the transfer of room ownership to another account holder, requiring the recipient to accept before the transfer takes effect, per BR-029. | Should | R2 | E07 | `API` `E2E` |
| FR-SHARE-031 | The system shall provide a single action that revokes every active share on a room, presenting the count of grants and links that will be revoked before commit. | Should | R1 | E07 | `API` `E2E` |
| FR-SHARE-032 | The system shall offer copy-to-clipboard and the platform share sheet as the two ways to distribute a created link, in that priority order, from the sheet where the link was created. | Must | R1 | E07 | `E2E` `Device` |
| FR-SHARE-033 | The system shall allow a Manager or Owner to change the role or the flags on an existing grant without removing and recreating it, preserving the grant's audit history. | Must | R1 | E07 | `API` `E2E` |
| FR-SHARE-034 | The system shall limit the number of concurrently active public links per item to the ceiling in BR-101 and shall state the limit when it is reached. | Should | R2 | E07 | `API` |
| FR-SHARE-035 | The system shall allow a recipient without a grant to request access to an item they hold an identifier for, delivering the request to the Owner and Managers as an actionable notification, and shall return a response to the requester that is identical whether or not the identifier resolves to a real item. | Should | R2 | E07 | `API` `E2E` `Sec` |

### Notes and rationale

- **FR-SHARE-021 is the recipient path, stated as a requirement.** The prior-art review shows that
  the most common mobile moment in this class of tool is a recipient opening a link on a phone, and
  that every comparable product puts a signup, an install or a degraded viewer in the way. Two taps
  to readable content, no account, is the single most load-bearing requirement in this document: a
  document a recipient cannot read has not been shared. It is also the one most likely to be eroded
  by well-intentioned additions, which is why the requirement enumerates the only permitted
  interstitials.
- **FR-SHARE-004: an anonymous visitor is always a Viewer.** The role picker belongs to the invite
  path (FR-SHARE-005, FR-SHARE-006) and nowhere else. There is no configuration, and no future
  configuration, in which the holder of a public link can write into a room: anyone who may write is
  by definition someone we can name, and naming someone means inviting them. The only variable on a
  public link is whether the original bytes may leave (FR-SHARE-007, FR-SHARE-011).
- **FR-SHARE-014 revoke authority is narrow on purpose.** Three principals may revoke: the room
  Owner, a Manager on the scope, and whoever created the grant or link. "Anyone with share
  authority" was too wide, because the can-reshare flag (FR-SHARE-008) can put share authority in
  the hands of a Contributor who should not be able to cut off a colleague's recipient. The matching
  conditional row belongs in the permission matrix in
  [06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md), which is
  normative; this requirement states the behaviour the API must enforce.
- **FR-SHARE-028 renders one state for every dead link, and one only.** A page that distinguishes
  "expired" from "revoked" from "never existed" is an existence oracle: it tells an unauthenticated
  stranger that a room, a file and a share once existed, and an expiry date tells them when to try
  again. The single generic string is deliberately uninformative to a legitimate recipient too; the
  recipient's route back in is to ask the colleague who sent the link, or FR-SHARE-035, both of
  which answer identically whether or not the item exists. This is the same rule as FR-ROOM-020 and
  it is enforced at the API, not in the page.
- **FR-SHARE-007 and FR-SHARE-008 are flags, not roles, on purpose.** A Viewer who may download and
  a Viewer who may not are the same role with different data-egress authority; folding that into
  the role name produces a combinatorial mess (ViewerNoDownload, ContributorNoReshare) that leaks
  into every API and every screen. Keeping them orthogonal keeps the permission matrix in
  [06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md) legible.
- **FR-SHARE-015 and FR-SHARE-016 make revocation a promise with a number attached.** "Revoke at any
  time" from the brief is untestable without a propagation target and a confirmation surface. The
  target lives in BR-108; the requirement here is that the product meets it and says so.
  FR-SHARE-016 exists because a silent revoke on a phone is indistinguishable from a failed tap,
  and the consequence of believing you revoked when you did not is a leak.
- **FR-SHARE-017 and FR-SHARE-018 encode "the UI is a hint, the API is the enforcement point".**
  Read-only enforcement in the brief is meaningless if it is only a disabled button. Because the
  mobile client applies optimistic updates for latency reasons, the rejection path must be a
  first-class specified behaviour rather than an error boundary.
- **FR-SHARE-025 is the one-handed-safety rule.** The prior-art review records a complaint that
  folders can be moved unintentionally with no confirmation, and lists the absence of a visible
  confirmation surface for permission changes among the known failure modes we must not repeat. On a
  360 px screen with a thumb, an unconfirmed permission widening is the default outcome unless the
  product deliberately interposes a summary.
- **FR-SHARE-027 exists because a public link is a URL that leaks.** Search-engine indexing of a
  confidential document is an incident with the company's name on it, and referrer leakage hands the
  token to every third party the visitor's next click touches.
- **FR-SHARE-035 is deferred to R2 but shapes R1.** The notification-and-triage surface that no
  comparable tool provides depends on access requests existing. R1 ships the invisibility rule and
  the revoke; R2 ships the inbound request that makes the phone the primary administration surface.

---

## FR-CONF: Conflicts, concurrency, versioning and offline reconciliation

Owning epic: [E08 Conflict Resolution and Data Integrity](./backlog/epic-08-conflict-resolution-and-data-integrity.md).
This domain carries the brief's conflict-resolution-for-duplicate-names requirement and everything
adjacent to it that a mobile client makes unavoidable.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-CONF-001 | The system shall detect a name collision within the destination parent on folder creation and shall present the conflict sheet rather than creating a second item with the same effective name. | Must | R1 | E08 | `API` `E2E` |
| FR-CONF-002 | The system shall detect a name collision on upload, before or during the upload, and shall resolve it before the item becomes visible in the folder. | Must | R1 | E08 | `API` `E2E` |
| FR-CONF-003 | The system shall detect a name collision on copy and on duplicate-in-place. | Must | R1 | E08 | `API` `E2E` |
| FR-CONF-004 | The system shall detect a name collision on move into a destination that already holds an item with the same effective name. | Must | R1 | E08 | `API` `E2E` |
| FR-CONF-005 | The system shall detect a name collision on rename and shall refuse to commit a rename that would collide. | Must | R1 | E08 | `API` `E2E` |
| FR-CONF-006 | The system shall present, for every detected collision, exactly three choices: keep both, replace as a new version, and cancel this item, and shall never resolve a collision silently. | Must | R1 | E08 | `E2E` `Review` |
| FR-CONF-007 | The system shall name a kept-both item using the deterministic suffix algorithm in BR-146, producing the identical result for the identical inputs on the client and on the server. | Must | R1 | E08 | `Unit` `API` |
| FR-CONF-008 | The system shall offer an "Apply to all remaining conflicts" control in the conflict sheet during any multi-item operation, scoped to that operation and to conflicts of that same kind, per BR-150. | Must | R1 | E08 | `E2E` `Unit` |
| FR-CONF-009 | The system shall treat two names as colliding when they are equal after Unicode NFC normalisation, whitespace trimming and simple case folding, per BR-140 to BR-143. | Must | R1 | E08 | `Unit` `API` |
| FR-CONF-010 | The system shall reject a name containing any forbidden character, naming the specific offending character in the error, per BR-137. | Must | R1 | E08 | `API` `Unit` `E2E` |
| FR-CONF-011 | The system shall normalise every submitted name to Unicode NFC before storage, comparison and display. | Must | R1 | E08 | `Unit` `API` |
| FR-CONF-012 | The system shall reject a name that exceeds the maximum length in BR-158 and shall indicate the remaining character allowance live in the rename and create fields. | Must | R1 | E08 | `API` `E2E` |
| FR-CONF-013 | The system shall trim leading and trailing whitespace and trailing full stops from every submitted name and shall show the trimmed result before commit. | Must | R1 | E08 | `Unit` `E2E` |
| FR-CONF-014 | The system shall reject the reserved names listed in BR-144 case-insensitively, with or without an extension. | Must | R1 | E08 | `Unit` `API` |
| FR-CONF-015 | The system shall return a version token with every mutable resource representation and shall require that token on every mutating request against it, per BR-125. | Must | R1 | E08 | `API` `Unit` |
| FR-CONF-016 | The system shall reject a mutating request carrying a stale version token with a conflict response that includes the current server state of the resource. | Must | R1 | E08 | `API` |
| FR-CONF-017 | The system shall present a stale-token conflict to the user as a comparison of what they attempted and what the item is now, with the choices of retrying against the current state or discarding the attempt. | Must | R1 | E08 | `E2E` `Review` |
| FR-CONF-018 | The system shall refuse a move of a folder into itself or into any descendant, per FR-FLDR-008, and shall enforce that refusal server-side regardless of client state. | Must | R1 | E08 | `API` `Unit` |
| FR-CONF-019 | The system shall refresh the currently displayed folder listing when another principal changes its contents, within a staleness window of 60 seconds, without losing the principal's scroll position or selection. | Should | R1 | E08 | `E2E` |
| FR-CONF-020 | The system shall present, when the item currently open in the viewer is deleted or moved by another principal, an explicit state that says so and offers to return to the containing folder, rather than a blank view or a generic error. | Must | R1 | E08 | `E2E` `Review` |
| FR-CONF-021 | The system shall retain prior versions of a file whenever a replace occurs, and shall list them with size, timestamp and the principal who created each. | Must | R1 | E08 | `API` `E2E` |
| FR-CONF-022 | The system shall allow a prior version to be restored, which creates a new current version rather than deleting any history. | Must | R1 | E08 | `API` `E2E` |
| FR-CONF-023 | The system shall retain versions according to the policy in BR-186 and shall state, in the version list, when the oldest retained version will expire. | Should | R2 | E08 | `API` `E2E` |
| FR-CONF-024 | The system shall allow a specific version to be previewed and downloaded, subject to the same grant checks as the current version. | Should | R2 | E08 | `API` `Sec` |
| FR-CONF-025 | The system shall queue mutations attempted while the device is offline, in the order the principal made them, and shall present the queue as a visible, inspectable list. | Should | R2 | E08 | `E2E` `Device` |
| FR-CONF-026 | The system shall reconcile the offline queue on reconnect by replaying each mutation with its idempotency key and its captured version token, and shall stop and surface the conflict rather than force-applying, per BR-131. | Should | R2 | E08 | `API` `Unit` |
| FR-CONF-027 | The system shall present every offline mutation that failed reconciliation as an individually resolvable item, and shall not discard a failed mutation without the principal seeing it. | Should | R2 | E08 | `E2E` `Review` |
| FR-CONF-028 | The system shall restrict offline queueing to the mutation kinds listed in BR-130 and shall state plainly that other actions require a connection. | Should | R2 | E08 | `Review` |
| FR-CONF-029 | The system shall carry a client-generated idempotency key on every mutating request and shall return the original result, without repeating the effect, for a repeated key. | Must | R1 | E08 | `API` `Unit` |
| FR-CONF-030 | The system shall retain items in trash for the window in BR-177 and shall permanently delete them when it expires, recording the purge in the activity log. | Must | R1 | E08 | `API` `Unit` |

### Notes and rationale

- **FR-CONF-006 forbids silent resolution, and that is the whole point of the brief's bullet.** The
  named job-to-be-done is "I never silently overwrite a version of a lease a recipient is already
  relying on". A silent auto-rename is nearly as bad as a silent overwrite, because the sharer then
  sends the recipient a link to the wrong file. Three choices, always shown, is the rule.
- **FR-CONF-006 has exactly three choices, and a fourth is a defect.** Keep both, replace as a new
  version, cancel this item. There is no merge-folders resolution, no "skip silently", and no
  "always replace" default; the only multiplier permitted is the explicitly scoped apply-to-all in
  FR-CONF-008. A fourth option in an interface, an API enum, a story or an analytics payload
  contradicts this requirement and must be removed rather than documented.
- **FR-CONF-007 client and server must agree on the generated name.** The client shows the user what
  the kept-both name will be before they commit; if the server then picks a different name, the user
  has been lied to. The algorithm in BR-146 is therefore specified as pure and deterministic, and
  tested on both sides against the same fixture set, including the case where the incoming name
  already ends in a parenthesised number.
- **FR-CONF-008 apply-to-all is required, not optional, because of the capture workflow.** A
  colleague who has just photographed 18 pages and is uploading them into a folder that already holds
  a previous batch cannot answer 18 modal questions with a thumb on LTE. The scoping in BR-150 (this
  operation, this conflict kind) is what keeps it from becoming a footgun.
- **FR-CONF-015 to FR-CONF-017 exist because two people share this room by definition.** A data room
  with one user has no concurrency problem; a data room exists so that colleagues and people outside
  the company can read the same folder at the same time. Optimistic
  concurrency with a version token is chosen over last-write-wins because the failure mode of
  last-write-wins here is a silently reverted permission change or a silently reverted rename.
- **FR-CONF-029 idempotency keys are a mobile requirement, not a nicety.** On a flaky cellular link
  the client cannot distinguish a lost request from a lost response, so it must retry; without an
  idempotency key every retry manufactures a duplicate. This is the same mechanism that makes
  FR-FILE-015 possible.
- **FR-CONF-025 to FR-CONF-028 are deliberately R2 and deliberately narrow.** A general-purpose
  offline mutation queue over a permissioned hierarchy is a distributed-systems problem, and the
  honest R1 position is to be read-only offline (FR-PERF-009) and to queue only uploads
  (FR-FILE-009). R2 widens the queue to the mutation kinds where reconciliation is tractable.
  Anything else is stated as requiring a connection rather than accepted and lost.

---

## FR-MOB: Mobile interaction system, theming, keyboard and platform integration

Owning epic: [E09 Mobile UX Foundations](./backlog/epic-09-mobile-ux-foundations.md).
Every other domain depends on this one. This is where the brief's context menu, toolbar, keyboard
navigation and theming requirements are re-specified, and where the platform-integration limits are
made explicit.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-MOB-001 | The system shall open a contextual action sheet for an item from a visible overflow button present on every row, rendered on the row's trailing edge at no less than 48 by 48 CSS px, as the touch equivalent of the desktop right-click context menu. | Must | R1 | E09 | `E2E` `Device` `A11y` |
| FR-MOB-002 | The system shall make every action in that contextual sheet reachable without any gesture, and shall never make an action available only through a long-press, a swipe or a drag. | Must | R1 | E09 | `E2E` `A11y` `Review` |
| FR-MOB-003 | The system shall hide, not disable, actions that are unavailable to the principal in a contextual action sheet. | Must | R1 | E09 | `E2E` `Review` |
| FR-MOB-004 | The system shall place destructive actions visually separated at the end of a contextual sheet, styled as destructive, and shall never place a destructive action adjacent to the sheet's most likely tap target. | Must | R1 | E09 | `Review` `Device` |
| FR-MOB-005 | The system shall display at most one sheet at a time, closing an open sheet before presenting another, so that dismissing a sheet always returns to the underlying screen. | Must | R1 | E09 | `E2E` `Device` |
| FR-MOB-006 | The system shall present more than four grouped choices as a modal bottom sheet with labelled sections rather than as a flat scrolling list of buttons, and shall not allow a contextual action sheet to scroll. | Must | R1 | E09 | `Review` `Device` |
| FR-MOB-007 | The system shall provide a bottom navigation bar at compact width with between three and five destinations, positioned within the thumb zone. | Must | R1 | E09 | `E2E` `Device` |
| FR-MOB-008 | The system shall provide a bottom action bar on content screens exposing between three and five primary actions plus an overflow, with a visible text label on every item. | Must | R1 | E09 | `E2E` `A11y` |
| FR-MOB-009 | The system shall replace the bottom action bar with a contextual action bar while a selection is active, reporting the selection count. | Must | R1 | E09 | `E2E` |
| FR-MOB-010 | The system shall promote to a navigation rail at medium width and to a persistent rail or drawer plus a horizontal toolbar at expanded width and above. | Should | R2 | E09 | `E2E-D` |
| FR-MOB-011 | The system shall keep the current location, the breadcrumb, search, upload and create-folder permanently visible, and shall place only tertiary commands behind an overflow. | Must | R1 | E09 | `Review` `E2E` |
| FR-MOB-012 | The system shall provide at most one swipe action per direction on a list row, shall pair a destructive swipe with a time-boxed undo, and shall duplicate every swipe action in that row's overflow. | Should | R1 | E09 | `E2E` `Device` |
| FR-MOB-013 | The system shall not treat a horizontal drag that begins within 24 CSS pixels of the left or right screen edge as a row swipe, so that the platform back gesture is never intercepted. | Must | R1 | E09 | `Device` `Unit` |
| FR-MOB-014 | The system shall keep the acted-upon row visible while a swipe action is being performed and while its undo affordance is present. | Should | R1 | E09 | `Device` `Review` |
| FR-MOB-015 | The system shall support pull-to-refresh on every scrollable list and shall additionally expose a Refresh action in the overflow of that screen. | Should | R1 | E09 | `E2E` `A11y` |
| FR-MOB-016 | The system shall load further items in a long list on scroll and shall additionally provide an explicit "Load more" control and a persistent "n of N items" count. | Must | R1 | E10 | `E2E` `Review` |
| FR-MOB-017 | The system shall respect the display safe area on every edge, adding the platform safe-area inset to every fixed bottom bar, floating action control and progress bar. | Must | R1 | E09 | `Device` `Review` |
| FR-MOB-018 | The system shall keep the focused input and its primary action visible above the on-screen keyboard on every form, sheet and dialog. | Must | R1 | E09 | `Device` `A11y` |
| FR-MOB-019 | The system shall emit a haptic pulse on entering selection mode, on committing a destructive action and on a failed action, on platforms that expose vibration, and shall respect the platform reduced-motion and system haptic settings. | Could | R2 | E09 | `Device` |
| FR-MOB-020 | The system shall render skeleton placeholders that match the final layout for any list or sheet whose content has not arrived within 200 ms, so that no layout shift occurs when content replaces them. | Must | R1 | E10 | `Lab` `Field` |
| FR-MOB-021 | The system shall confirm every reversible action with a toast carrying an undo control, positioned so that it does not obscure the bottom action bar or the focused element. | Must | R1 | E09 | `E2E` `A11y` |
| FR-MOB-022 | The system shall display a persistent banner while the device is offline, naming what remains available, and shall remove it automatically on reconnection. | Must | R1 | E10 | `Device` `E2E` |
| FR-MOB-023 | The system shall display a distinct indicator when the connection is present but degraded, and shall not present a degraded connection as an outage. | Should | R2 | E10 | `Device` `Review` |
| FR-MOB-024 | The system shall follow the operating-system colour scheme by default, in both a browser tab and an installed web app. | Must | R1 | E09 | `E2E` `Device` |
| FR-MOB-025 | The system shall allow the principal to override the colour scheme to light or to dark independently of the system setting, persisted per account. | Must | R1 | E09 | `E2E` |
| FR-MOB-026 | The system shall express every colour as a design token, with the complete light palette defined unconditionally and only token values redefined for dark, so that a new theme requires no component changes. | Must | R1 | E09 | `Review` `Unit` |
| FR-MOB-027 | The system shall allow the principal to choose an accent colour from a curated set, applied consistently to interactive elements and validated for contrast in both schemes. | Should | R2 | E09 | `A11y` `E2E` |
| FR-MOB-028 | The system shall render every interactive target at no less than 48 CSS pixels in both dimensions with no less than 8 CSS pixels of separation from any adjacent target. | Must | R1 | E09 | `A11y` `E2E` |
| FR-MOB-029 | The system shall allow the principal to choose a comfortable or a compact list density, and shall keep every target compliant with FR-MOB-028 in both. | Could | R2 | E09 | `A11y` `E2E` |
| FR-MOB-030 | The system shall honour the platform text-size setting and shall remain fully usable with text scaled to 200 percent, with no clipped control, no lost action and no two-dimensional scrolling. | Must | R1 | E09 | `A11y` `Device` |
| FR-MOB-031 | The system shall present content without loss of information or functionality and without two-dimensional scrolling at a viewport width of 320 CSS pixels. | Must | R1 | E09 | `A11y` `E2E` |
| FR-MOB-032 | The system shall not set a viewport that disables user scaling. | Must | R1 | E09 | `Unit` `A11y` |
| FR-MOB-033 | The system shall reduce or remove non-essential motion and parallax when the platform reduced-motion preference is set. | Must | R1 | E09 | `A11y` `Device` |
| FR-MOB-034 | The system shall ensure that no element receiving keyboard focus is entirely hidden by a sticky bar, an open sheet, a toast or the on-screen keyboard. | Must | R1 | E09 | `A11y` `E2E` |
| FR-MOB-035 | The system shall announce every operation outcome and progress change through a polite live region, including upload progress, bulk operation results, move and delete outcomes, share revocation and storage warnings. | Must | R1 | E09 | `A11y` |
| FR-MOB-036 | The system shall give every icon-only control an accessible name that contains its visible label text, so that voice control can activate it by the name the user reads. | Must | R1 | E09 | `A11y` `Unit` |
| FR-MOB-037 | The system shall expose every list as a semantic structure in which each row announces its name, type, size, modified date and selection state to a screen reader. | Must | R1 | E09 | `A11y` |
| FR-MOB-038 | The system shall make every function operable from a keyboard alone, including on a phone with an attached keyboard. | Must | R1 | E09 | `A11y` `E2E-D` |
| FR-MOB-039 | The system shall provide keyboard shortcuts for navigate, select, select-range, rename, move, delete, search, new folder, upload and toggle view, activated only when a physical keyboard is present, and shall list all ten in a discoverable shortcut sheet. | Should | R1 | E09 | `E2E-D` |
| FR-MOB-040 | The system shall display a visible focus indicator on every focusable element that meets the contrast requirement in NFR-A11Y. | Must | R1 | E09 | `A11y` |
| FR-MOB-041 | The system shall provide a single-pointer, non-path-based alternative for every multipoint or path-based gesture in the product. | Must | R1 | E09 | `A11y` `Review` |
| FR-MOB-042 | The system shall be installable to the home screen as a web app with a name, icon set, standalone display mode and theme colour, on every platform that supports installation. | Must | R1 | E09 | `Device` |
| FR-MOB-043 | The system shall teach installation in-product on platforms that provide no install prompt, naming the exact platform steps, and shall not present a non-functional install button. | Should | R1 | E09 | `Device` `Review` |
| FR-MOB-044 | The system shall present a persistent in-application back affordance whenever it is running in standalone display mode without browser chrome. | Must | R1 | E09 | `Device` `E2E` |
| FR-MOB-045 | The system shall deliver web push notifications where the platform permits, requesting permission only in response to a deliberate user action, and shall state the installation prerequisite where one exists rather than failing silently. | Should | R2 | E11 | `Device` `Review` |
| FR-MOB-046 | The system shall define its responsive behaviour at the boundaries of the single size-class ladder in [03-product-overview.md](./03-product-overview.md) and at no other width, shall additionally branch on viewport height only where a layout depends on vertical space (FR-VIEW-029), and shall be verified at 360, 390 and 414 CSS px, all of which fall inside the compact class. | Must | R1 | E09 | `E2E` `Review` |

### Notes and rationale

- **Desktop primitive translated: the right-click context menu (OQ89, RESOLVED by D01).** The sheet
  is opened by a visible per-row overflow button, not by a gesture. FR-MOB-001 places that button on
  the trailing edge of every row at 48 by 48 CSS px, and FR-MOB-002 forbids any action existing only
  behind a gesture. This is the shape iOS Files, Google Drive and Dropbox all use, and it is the
  reason the product needs no separate "fallback" for the sheet: a discoverable button satisfies
  WCAG 2.2 SC 2.5.1 on its own, whereas a gesture-only menu is undiscoverable and the platform
  guidance is explicit that context-menu items must also exist in the main interface. Long-press is
  spent on the other meaning, selection (FR-FILE-035), and the two must never be swapped: an
  action sheet on long-press means a colleague trying to select three files keeps being offered
  "Delete" instead. FR-MOB-003 inverts the usual convention deliberately (hide rather than dim)
  because a contextual sheet on a phone has no room to explain why something is greyed out, and a
  dimmed row invites repeated tapping.
- **Desktop primitive translated: the dense toolbar.** A desktop file manager toolbar carries a
  dozen icon buttons. FR-MOB-008 replaces it with a labelled bottom action bar of three to five
  actions plus an overflow, inside the thumb zone; FR-MOB-009 swaps it for a contextual bar in
  selection mode; FR-MOB-010 expands it back into a real horizontal toolbar at expanded width.
  FR-MOB-011 then pins the specific controls that must never be hidden, because burying navigation
  and primary actions behind an overflow measurably reduces discoverability and slows users.
- **Desktop primitive translated: keyboard navigation.** It is kept in full rather than translated,
  because it is a WCAG level-A obligation that applies on a phone with an attached keyboard as much
  as on a desktop, and because the semantics that make it work (FR-MOB-037) are the same semantics a
  screen-reader user needs on touch. The genuinely mobile-native companions are specified alongside
  it: search as the substitute for type-to-jump (FR-SRCH-001), live regions for status
  (FR-MOB-035), and label-in-name for voice control (FR-MOB-036). FR-MOB-039 is **R1**, not a later
  desktop nicety: the shortcut set is what makes a colleague with a keyboard-and-phone or
  keyboard-and-tablet setup productive, and it is cheap once FR-MOB-038 is honest. All ten
  shortcuts — navigate, select, select-range, rename, **move**, delete, search, new folder, upload
  and **toggle view** — are named here so that the shortcut table in
  [08-mobile-ux-spec.md](./08-mobile-ux-spec.md) can be checked against the requirement rather than
  the other way round.
- **FR-MOB-012 to FR-MOB-014 keep swipe as a shortcut and never as a mechanism.** Swipe has no
  visual signifier, it often hides the very row being acted on, and mapping several actions to one
  gesture destroys learnability. FR-MOB-013 exists because the Android system back gesture owns both
  screen edges and an app can only carve out a limited region, so an edge-started row swipe is a
  coin toss.
- **FR-MOB-016 refuses to let infinite scroll stand alone.** Infinite scroll removes the landmarks a
  user needs to know where they are, which matters most in exactly this product's worst case: one
  specific file in a folder of ten thousand. A persistent count plus an explicit load control plus
  sort, filter and search is the mitigation set.
- **FR-MOB-024 to FR-MOB-027 are the brief's "light and dark themes, with easy customisation",
  made concrete.** "Easy customisation" is specified as a token-only change surface (FR-MOB-026)
  rather than as a theme editor, because that is the property an engineering team can actually
  verify, and it is what makes a per-account accent choice cheap.
- **FR-MOB-042 to FR-MOB-045 are the honest PWA boundary.** Installation is user-driven on iOS with
  no programmatic prompt, so FR-MOB-043 teaches rather than prompts. Web push on iOS requires the
  site to be on the home screen, so FR-MOB-045 states the prerequisite instead of silently failing.
  FR-MOB-044 exists because a standalone iOS web app has no browser back button and no system back
  gesture, which strands the user without an in-app affordance.
- **FR-MOB-028 chooses 48 CSS pixels, above the 24 CSS pixel WCAG floor.** iOS guidance asks for 44
  pt, Material asks for 48 dp, and WCAG 2.2 SC 2.5.8 sets an absolute AA floor of 24 by 24 CSS px
  with spacing exceptions. One web codebase cannot express three rules, so the product takes the
  strictest and specifies 48 with 8 px gaps, which satisfies all three simultaneously and removes
  the argument from every code review.

---

## FR-PERF: Dynamic loading, virtualisation, caching and offline read

Owning epic: [E10 Performance, Offline and Scale](./backlog/epic-10-performance-offline-and-scale.md).
This domain carries the brief's "optimized for large datasets with dynamic directory loading". The
numeric budgets themselves live in
[07-non-functional-requirements.md](./07-non-functional-requirements.md); the behaviours live here.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-PERF-001 | The system shall load the contents of a folder on demand when that folder is opened, and shall never load a room's full hierarchy eagerly. | Must | R1 | E10 | `API` `Lab` |
| FR-PERF-002 | The system shall paginate folder listings with an opaque cursor, returning a stable ordering across pages even while items are added or removed. | Must | R1 | E10 | `API` `Unit` |
| FR-PERF-003 | The system shall request a first page sized to fill approximately one and a half viewport heights on the requesting device, rather than a fixed count. | Should | R1 | E10 | `Unit` `Field` |
| FR-PERF-004 | The system shall virtualise any list longer than 100 rows, keeping the number of mounted rows bounded independently of the item count. | Must | R1 | E10 | `Unit` `Lab` |
| FR-PERF-005 | The system shall remain interactive, with scrolling and selection responsive within the INP budget, in a folder containing 10,000 items on the reference device. | Must | R1 | E10 | `Device` `Lab` |
| FR-PERF-006 | The system shall load thumbnails only for rows at or near the viewport and shall cancel pending thumbnail requests for rows scrolled far out of view. | Must | R1 | E10 | `Unit` `Device` |
| FR-PERF-007 | The system shall prefetch the next page of a listing when the principal has scrolled past the configured fraction of the current page. | Should | R1 | E10 | `Unit` `Field` |
| FR-PERF-008 | The system shall apply mutations optimistically for rename, move, delete and view-preference changes, and shall reconcile against the server response, reverting on rejection per FR-SHARE-018. | Must | R1 | E10 | `Unit` `E2E` |
| FR-PERF-009 | The system shall serve, when the device is offline, the listings of folders the principal has previously visited and the previews of files they have previously opened, from a local cache. | Should | R1 | E10 | `Device` `E2E` |
| FR-PERF-010 | The system shall allow a principal to pin specific files for offline availability and shall show which files are pinned and how much space they occupy. | Should | R2 | E10 | `Device` `E2E` |
| FR-PERF-011 | The system shall label locally cached content as a cached copy that the browser may clear, and shall never present it as durable device storage. | Must | R1 | E10 | `Review` `Device` |
| FR-PERF-012 | The system shall request persistent storage from the browser and shall degrade gracefully, without data loss beyond the cache itself, when the request is denied or the storage is evicted. | Should | R1 | E10 | `Device` `Unit` |
| FR-PERF-013 | The system shall treat every locally cached byte as a disposable replica of server state and shall never hold the only copy of a user's data on the device. | Must | R1 | E10 | `Review` `Unit` |
| FR-PERF-014 | The system shall restore list scroll position when returning from a child folder, a preview, a sheet or an external application. | Must | R1 | E10 | `E2E` `Device` |
| FR-PERF-015 | The system shall cancel in-flight requests belonging to a screen the principal has navigated away from. | Must | R1 | E10 | `Unit` |
| FR-PERF-016 | The system shall invalidate the affected cached listings immediately on a successful mutation, so that a returning navigation never shows a stale item. | Must | R1 | E10 | `Unit` `E2E` |
| FR-PERF-017 | The system shall serve thumbnails and rendered preview pages in a modern image format where the client advertises support, falling back automatically otherwise. | Should | R1 | E10 | `API` `Lab` |
| FR-PERF-018 | The system shall keep the initial route's transferred bytes and JavaScript bytes within the budgets in NFR-PERF, enforced as a failing CI check. | Must | R1 | E10 | `Lab` |
| FR-PERF-019 | The system shall not execute a single main-thread task longer than 50 ms while a list is scrolling, while selection mode is toggled, or while a folder is loading, yielding to the scheduler as required. | Must | R1 | E10 | `Lab` `Device` |
| FR-PERF-020 | The system shall handle files of several gigabytes for upload, download and preview without exceeding the browser memory ceiling, by streaming in every path. | Must | R1 | E10 | `Device` `Unit` |
| FR-PERF-021 | The system shall report Largest Contentful Paint, Interaction to Next Paint and Cumulative Layout Shift from real user sessions, attributed to route and to device class. | Must | R1 | E10 | `Analytics` `Field` |
| FR-PERF-022 | The system shall report server timing for every API route, separating database time, storage time and application time. | Should | R1 | E10 | `Analytics` |
| FR-PERF-023 | The system shall record, on every session, the device form factor, the effective connection class, the viewport size and whether the session is running as an installed web app. | Must | R1 | E10 | `Analytics` |
| FR-PERF-024 | The system shall display a first meaningful frame of the folder screen, including breadcrumb and skeleton rows, before the folder listing response arrives. | Must | R1 | E10 | `Lab` `Field` |
| FR-PERF-025 | The system shall keep a room's used-storage figure current within 60 seconds of any upload or permanent deletion, and shall state in the interface when the figure was last computed (BR-200). | Should | R1 | E12 | `API` `Unit` |
| FR-PERF-026 | The system shall degrade to a text-only listing, without thumbnails, when the client reports a metered connection and the principal has enabled data saving. | Could | R2 | E10 | `Device` |

### Notes and rationale

- **FR-PERF-023 exists to own a number nobody publishes.** The prior-art review is explicit that no
  comparable tool publishes the mobile share of data-room sessions, that the one circulating figure
  comes from a methodology-free blog, and that the figure measures supply rather than demand because
  none of them has shipped a usable phone product. Instrumenting device class from day one means we
  know what our own colleagues and recipients actually do, on real devices, by the end of R1. This
  document therefore asserts no mobile-share percentage anywhere.
- **FR-PERF-005 and FR-PERF-019 are written against the reference device, not a flagship.** The
  baseline is a mid-range Android over a slow connection, chosen because a quarter of real devices
  and networks are worse than it, and because field data shows fewer than half of mobile sites pass
  all three Core Web Vitals while mobile blocking time at the 90th percentile runs into many
  seconds. Passing on a recent iPhone proves nothing.
- **FR-PERF-011 to FR-PERF-013 are the honest offline story.** Safari deletes all script-created
  storage for an origin with no user interaction in the last seven days of browser use; Chromium and
  Firefox evict under pressure; and eviction is all-or-nothing across IndexedDB, the Cache API and
  the origin private file system together. "Available offline" as a durable promise is therefore a
  lie the product must not tell. The permitted phrasing is a cached copy that may be cleared.
- **FR-PERF-009 read-only offline in R1 is a scope decision.** Persona P6 standing in a mechanical
  room with no signal needs the rent roll he already opened, which is a read problem. Offline
  mutation is FR-CONF-025 in R2.
- **FR-PERF-002 opaque cursors rather than offsets** because offset pagination in a folder that
  another principal is mutating produces duplicated and skipped rows, which on an infinite-scrolling
  mobile list is invisible until a user swears a file has vanished.
- **FR-PERF-018 sets the bundle budget below the median mobile page, not at it.** The median mobile
  page already exceeds the interactive-in-three-seconds budget for the reference device, so shipping
  an average-weight application is shipping a failing one.

---

## FR-AUDIT: Activity log, viewer analytics, notifications and export

Owning epic: [E11 Trust, Audit and Notifications](./backlog/epic-11-trust-audit-and-notifications.md).
Viewer analytics is what makes an outward share accountable — it is the answer to "did the recipient
actually open it, and what did they read" — and the notification inbox is the mobile-native
replacement for the desktop dashboard.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-AUDIT-001 | The system shall record an activity entry for every create, rename, move, copy, delete, restore, upload, download, preview, share, role change, revoke, sign-in and permission denial within a room. | Must | R1 | E11 | `API` `Unit` |
| FR-AUDIT-002 | The system shall record on every entry the acting principal, the action, the target item and its path at the time, the timestamp with timezone, the coarse source location, the client type and the share or link the access came through. | Must | R1 | E11 | `API` `Unit` |
| FR-AUDIT-003 | The system shall present the activity log per room, and shall allow it to be filtered to a single folder, a single file or a single principal. | Must | R1 | E11 | `API` `E2E` |
| FR-AUDIT-004 | The system shall record, for every file access, which principal opened which file, at what time and for how long, and shall present that as per-file viewer analytics; the first such view event for a recipient shall not be recorded until that recipient has been shown the tracking notice required by NFR-PRIV-010. | Must | R1.1 | E11 | `API` `E2E` `Sec` |
| FR-AUDIT-005 | The system shall record page-level dwell for paginated document previews and shall present per-page time for each viewer. | Should | R2 | E11 | `API` `E2E` |
| FR-AUDIT-006 | The system shall record every download separately from every preview, and shall never conflate the two. | Must | R1 | E11 | `API` `Unit` |
| FR-AUDIT-007 | The system shall attribute activity by an anonymous link visitor to the link token, the captured email address where one was collected, and a stable pseudonymous visitor identifier, and shall label such activity as unverified. | Must | R1 | E11 | `API` `Review` |
| FR-AUDIT-008 | The system shall record every failed access attempt against a room or item, including the reason for refusal. | Must | R1 | E11 | `API` `Sec` |
| FR-AUDIT-009 | The system shall record every permission change with the value before and the value after, so that a role or flag change is reconstructible. | Must | R1 | E11 | `API` `Unit` |
| FR-AUDIT-010 | The system shall treat the activity log as append-only, with no interface or endpoint that edits or deletes an individual entry. | Must | R1 | E11 | `API` `Sec` |
| FR-AUDIT-011 | The system shall never record a password, a token, a link secret, a session credential or file contents in the activity log. | Must | R1 | E11 | `Sec` `Review` |
| FR-AUDIT-012 | The system shall restrict activity log and viewer analytics visibility to the Owner and Managers of the scope concerned, per BR-042. | Must | R1 | E11 | `API` `Sec` |
| FR-AUDIT-013 | The system shall paginate the activity log and shall allow it to be searched by principal, action type and date range. | Should | R1 | E11 | `API` `E2E` |
| FR-AUDIT-014 | The system shall display every timestamp in the viewing principal's device timezone with the timezone named. | Must | R1 | E11 | `E2E` `Unit` |
| FR-AUDIT-015 | The system shall export the activity log for a room, honouring the active filters, as a CSV file delivered as a download. | Should | R1 | E11 | `API` `E2E` |
| FR-AUDIT-016 | The system shall retain activity entries for the period in BR-195 — 24 months by default, administrator-configurable per FR-ACCT-033 — and shall state the period in force in the interface where the log is shown. | Must | R1 | E11 | `API` `Review` |
| FR-AUDIT-017 | The system shall present an in-application notification centre listing access requests, new uploads by others, share events, viewer events and security events, with unread state. | Must | R1 | E11 | `API` `E2E` |
| FR-AUDIT-018 | The system shall make each notification directly actionable where an action exists, so that approving an access request, revoking a share or opening the viewed document takes exactly one tap from the notification. | Must | R1 | E11 | `E2E` `Device` |
| FR-AUDIT-019 | The system shall deliver web push notifications for the event classes the principal has enabled, subject to FR-MOB-045. | Should | R2 | E11 | `Device` |
| FR-AUDIT-020 | The system shall send an email digest of room activity at a per-room frequency the principal chooses, including off. | Should | R2 | E11 | `API` |
| FR-AUDIT-021 | The system shall provide per-room notification preferences and a mute control, and shall apply them to in-application, push and email channels alike. | Must | R1 | E11 | `API` `E2E` |
| FR-AUDIT-022 | The system shall notify the Owner and Managers when a new principal first accesses a shared item, delivering that notification within 30 seconds at the 95th percentile. | Should | R1 | E11 | `API` |
| FR-AUDIT-023 | The system shall present, per room, a live list of the principals currently active in that room. | Could | R3 | E11 | `API` `E2E` |
| FR-AUDIT-024 | The system shall rate-limit activity-log export per account per day, per BR-224, and shall state the limit when it is reached. | Should | R2 | E11 | `API` |
| FR-AUDIT-025 | The system shall write an activity entry for a purge from trash and for the expiry of a version, so that the disappearance of an item is always explained by the log. | Must | R1 | E11 | `API` `Unit` |

### Notes and rationale

- **FR-AUDIT-004 is R1.1, and the disclosure is part of it.** Per-viewer document analytics is the
  capability that makes an outward share accountable: general cloud storage cannot answer "did they
  open it", and the prior art shows an entire product category built on that one answer. It lands in
  R1.1 rather than R1 as one of the three trust features staff will demand the first time a
  confidential document leaks, alongside link expiry (FR-SHARE-009) and the watermark (FR-VIEW-035).
  R1 still records the underlying activity in the log (FR-AUDIT-001, FR-AUDIT-006); R1.1 adds the
  per-viewer presentation, the dwell measurement and — as a hard precondition, not a follow-up — the
  recipient tracking notice in NFR-PRIV-010. Tracking a person who has not been told they are being
  tracked is not a feature we ship for one increment and fix later.
- **FR-AUDIT-017 and FR-AUDIT-018 are the mobile-native replacement for the desktop dashboard.** The
  highest-frequency real mobile job here is responding, not browsing: a question arrived, someone
  requested access, a document was viewed. Every comparable tool puts that behind a desktop
  analytics screen. Specifying the notification itself as the action surface, one tap to approve or
  revoke, is what makes the phone the administration device rather than the reading device.
- **FR-AUDIT-007 labels anonymous activity as unverified,** because an email address typed into a
  capture gate is a claim, not an identity. Presenting it as identity in an audit log a lawyer may
  later rely on would be misleading.
- **FR-AUDIT-010 append-only is what makes the log worth having.** A log the room owner can edit is
  not evidence. This is also why FR-AUDIT-012 restricts visibility rather than allowing
  suppression: the answer to "I don't want this in the log" is that there is no such option.
- **FR-AUDIT-025 exists so that the log explains every disappearance.** Trash purges and version
  expiries are the two ways an item can vanish without a human acting, and an unexplained
  disappearance in a data room is a support escalation at best.

---

## FR-ACCT: Profile, storage quota, provisioning, retention and export

Owning epic: [E12 Account, Storage and Governance](./backlog/epic-12-account-storage-and-governance.md).
This domain carries the brief's used-storage-info requirement and the internal governance around it:
who sets a room's quota, how a colleague's account is created and closed, how long the product keeps
things, and how data gets back out. There is no commercial surface here; quota is an administrative
control, not a product tier.

| ID | Requirement | Priority | Release | Epic | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-ACCT-001 | The system shall allow a signed-in user to view and edit their display name and profile image. | Should | R1 | E12 | `API` `E2E` |
| FR-ACCT-002 | The system shall allow an account email address to be changed, requiring verification of the new address before the change takes effect and notifying the previous address. | Must | R1 | E12 | `API` `Sec` |
| FR-ACCT-003 | The system shall allow a password to be changed by a signed-in user after confirming the current password or a passkey assertion. | Must | R1 | E12 | `API` `E2E` |
| FR-ACCT-004 | The system shall display the storage used by a data room against that room's administrator-set quota (FR-ACCT-027), as a figure and as a proportion, on the account screen and on the workspace home. | Must | R1 | E12 | `API` `E2E` |
| FR-ACCT-005 | The system shall display a per-room breakdown of storage used, ordered by size. | Should | R1 | E12 | `API` `E2E` |
| FR-ACCT-006 | The system shall warn the principal when storage crosses each threshold in BR-196, in the interface and by email, stating the exact remaining allowance. | Must | R1 | E12 | `API` `E2E` |
| FR-ACCT-007 | The system shall refuse to begin any upload that would take the destination room over its quota, stating the file size, the remaining allowance and the shortfall, and offering both the option to free space and the identity of the administrator who can raise the quota, per BR-201. | Must | R1 | E12 | `API` `E2E` |
| FR-ACCT-008 | The system shall abort an in-flight upload whose actual size exceeds the quota, discard its uploaded parts, leave no partial item in the folder, and report the abort explicitly, per BR-203. | Must | R1 | E12 | `API` `Unit` |
| FR-ACCT-009 | The system shall never silently truncate, discard or degrade a file because of a quota condition. | Must | R1 | E12 | `Unit` `Review` |
| FR-ACCT-010 | The system shall continue to serve listing, preview, download, share and revoke operations while a room is at or over its quota, per BR-204. | Must | R1 | E12 | `API` `Sec` |
| FR-ACCT-022 | The system shall allow a user to export their own data, and an administrator to export the data of a colleague who has been deprovisioned, comprising a folder-structured archive of files plus a machine-readable manifest of rooms, folders, shares and activity. | Should | R2 | E12 | `API` `E2E` |
| FR-ACCT-023 | The system shall deliver a data export as an asynchronous job with a notification on completion and a time-limited download link, rather than a blocking request. | Should | R2 | E12 | `API` |
| FR-ACCT-024 | The system shall delete an account and all its rooms after the retention window in BR-190, notify every principal who held a grant that their access has ended, and confirm completion to the requesting address. | Must | R1 | E12 | `API` `E2E` |
| FR-ACCT-025 | The system shall allow an account deletion request to be cancelled at any point within the retention window by the account holder. | Must | R1 | E12 | `API` `E2E` |
| FR-ACCT-027 | The system shall allow a principal holding the administrator role to set a storage quota per data room, shall apply the default per-room quota stated in BR-199 to every room for which no explicit quota has been set, and shall state in the interface both the quota in force and which of the three sources it came from: this room, this room's team, or the default. | Must | R1 | E12 | `API` `E2E` `Sec` |
| FR-ACCT-028 | The system shall allow an administrator to set an optional storage quota per team, applying to every room that team owns, where an explicit room-level quota under FR-ACCT-027 always takes precedence over the team value. | Could | R2 | E12 | `API` `E2E` |
| FR-ACCT-029 | The system shall place a room into a state that refuses new bytes, rather than deleting anything, when an administrator lowers a quota below the storage that room already uses, shall name every room so affected, and shall keep listing, preview, download, share and revoke fully available, per BR-204 and BR-205. | Must | R1 | E12 | `API` `E2E` |
| FR-ACCT-030 | The system shall allow an administrator to provision an account for a colleague, setting whether that colleague holds the administrator role, without requiring the colleague to complete a self-service sign-up first. | Must | R1 | E12 | `API` `E2E` |
| FR-ACCT-031 | The system shall allow an administrator to deprovision a colleague's account, which shall invalidate every session and refresh credential held by that account within the propagation target in BR-108 and shall revoke every share that account created. | Must | R1 | E12 | `API` `Sec` |
| FR-ACCT-032 | The system shall require every room owned by an account being deprovisioned to be transferred to a named Owner as part of the deprovisioning flow, per BR-013, and shall destroy no content as a consequence of deprovisioning. | Must | R1 | E12 | `API` `E2E` |
| FR-ACCT-033 | The system shall allow an administrator to configure the activity-log retention period within the bounds in BR-195, defaulting to 24 months, and shall apply any change forward only, never retroactively deleting entries already retained under a longer setting. | Should | R2 | E12 | `API` `E2E` |
| FR-ACCT-034 | The system shall restrict quota setting, provisioning, deprovisioning and retention configuration to principals holding the administrator role, per BR-044, shall never confer any of them through a room role, and shall record every such action in the activity log. | Must | R1 | E12 | `API` `Sec` |

### Notes and rationale

- **Quota is an administrative control, not a product tier (I03).** An administrator sets a quota
  per data room (FR-ACCT-027), and optionally per team (FR-ACCT-028); a room with no explicit value
  inherits the default in BR-199, so there is never an unbounded room and never a room whose limit
  nobody can name. A room's limit is an operational decision by a named administrator and nothing
  else. The default *figure* is a number, and numbers belong to
  [06](./06-business-rules-and-permissions.md): it is BR-199. What this document requires is that a
  default exist, that it apply automatically to every room without an explicit value, and that the
  interface name which of the three sources is in force. If BR-199 does not state a figure, that is a
  blocking gap in 06 and not a licence to ship an unbounded room. The warning thresholds (FR-ACCT-006, BR-196) and the hard stop (FR-ACCT-007, FR-ACCT-008)
  are unchanged from the original specification and remain R1 Must: an internal tool that quietly
  fills up is more dangerous than one with an external accounting trail, because nothing outside the
  product will notice for us.
- **FR-ACCT-009, FR-ACCT-010 and FR-ACCT-029 are the same principle three times: never answer a
  quota problem with data loss or with loss of control.** A colleague whose room is full must still
  be able to revoke a share, because the alternative is a confidential document left exposed by a
  storage-accounting event. An administrator lowering a quota below current usage is the one case
  where the system could be tempted to delete something to make the numbers work; FR-ACCT-029
  forbids it outright and names the affected rooms instead.
- **FR-ACCT-030 to FR-ACCT-032 are the joiner and leaver flows an internal tool cannot do without.**
  A commercial product can wait for a user to sign themselves up and to close their own account. An
  internal tool cannot: people join, change teams and leave, and on the day someone leaves the
  interesting question is not their profile but the eleven rooms they owned and the four public links
  they created. FR-ACCT-031 kills the credentials and the shares in one transition; FR-ACCT-032
  forces the ownership question to be answered inside the flow rather than discovered six months
  later by whoever needs a file. Neither destroys content — deprovisioning a person is not deleting
  a deal. The assumption that joiner and leaver events originate in the company identity provider is
  recorded in the FR-AUTH notes.
- **FR-ACCT-034 is the administrator role, stated once.** Quota, provisioning, deprovisioning and
  retention are account-scoped authorities that no room role confers, however senior the room role
  sounds: being the Owner of a room is not being an administrator of the tool. The matrix in
  [06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md) is normative
  (BR-044); this requirement states the behaviour the API must enforce and requires the audit trail
  that makes an administrator's actions reviewable by another administrator.
- **FR-ACCT-022 and FR-ACCT-023 are portability, not a courtesy.** The export exists so that the
  product is never the only place a room's contents can be read, which is also what makes
  deprovisioning safe: the leaver's rooms can be handed over as data, not just as access.

### Withdrawn in the internal-tool rework

The product's nature changed: this is an internal tool, so the entire commercial surface is
withdrawn rather than deferred. The identifiers below are retired permanently. They are listed here,
rather than renumbered away, so that any surviving cross-reference in a backlog file, a test name or
a commit message resolves to an explicit tombstone. **Surviving requirements were not renumbered,
and no withdrawn number will ever be reused.**

| Withdrawn ID | Was | Why it is gone |
| --- | --- | --- |
| FR-ACCT-011 | Present plan tiers with prices in the interface | There are no plans and no prices. Storage limits are administrator-set (FR-ACCT-027) |
| FR-ACCT-012 | Purchase and upgrade a plan on a phone with a card | No purchase path exists in an internal tool |
| FR-ACCT-013 | Downgrade or cancel a plan without contacting support | Nothing to downgrade or cancel |
| FR-ACCT-014 | Read-only state when a downgrade leaves the account over its limits | The equivalent internal case — an administrator lowering a quota below current usage — is now FR-ACCT-029 |
| FR-ACCT-015 | Additional seats with per-seat invitation and removal | No seats. Colleagues are provisioned by an administrator (FR-ACCT-030); recipients are never accounts |
| FR-ACCT-016 | Guests and anonymous visitors do not consume a seat | Vacuous once seats are gone; recipients remain free of any account requirement by FR-AUTH-020 and FR-AUTH-021 |
| FR-ACCT-017 | List invoices and receipts, downloadable as PDF | No invoices exist |
| FR-ACCT-018 | Collect billing name, address and tax identifier | No billing identity is collected anywhere in the product |
| FR-ACCT-019 | Time-limited trial without card details | Nothing to trial |
| FR-ACCT-020 | Retry a failed payment on a schedule | No payments |
| FR-ACCT-021 | Restrict billing and plan management to the billing capability | Replaced by the administrator-role restriction in FR-ACCT-034 |
| FR-ACCT-026 | State that no per-page or per-gigabyte overage charge exists | A statement about charges, in a product that never charges |

Two behaviours that these rows used to carry are deliberately **kept** elsewhere, because they were
never really commercial: never losing data at a limit (FR-ACCT-009, FR-ACCT-029) and never losing
the ability to revoke (FR-ACCT-010).

---

## Coverage of the stakeholder brief

Every bullet of the original brief maps to at least one requirement. Nothing was dropped silently.

### Base file manager requirements

| Brief bullet | Requirements | Touch translation recorded in |
| --- | --- | --- |
| Basic file operations: create, delete, copy, rename, cut, paste | Create = FR-FLDR-001 (folder) plus FR-FILE-001 onward (upload); then FR-FILE-026, FR-FILE-027, FR-FILE-028, FR-FILE-029, FR-FILE-031, FR-FLDR-006 | FR-FILE notes: cut/copy/paste becomes the staging tray; "create" is create-folder plus upload, and the in-app empty-file editor (FR-FILE-044) is a separate lesser capability at Could / R3 |
| Download and upload files | FR-FILE-001 to FR-FILE-023, FR-FILE-045 | FR-FILE notes: resumable foreground upload, fire-and-forget download |
| Files tree view | FR-FLDR-021, FR-FLDR-022, FR-FLDR-023, FR-FLDR-018 | FR-FLDR notes: drill-down primary, tree sheet on mobile, real tree at expanded width |
| List and tiles views | FR-VIEW-001 to FR-VIEW-004 | FR-VIEW notes: two-column minimum at 360 px |
| File preview pane with file information | FR-VIEW-007, FR-VIEW-008, FR-VIEW-010 to FR-VIEW-024, FR-VIEW-032 | FR-VIEW notes: hover pane becomes details sheet plus full-screen viewer |
| Split view to manage files between locations | FR-VIEW-029, FR-VIEW-030, FR-VIEW-031, FR-FILE-024, FR-FILE-026 | FR-VIEW notes: staging tray as the compact equivalent, gated on width and height |
| Built-in search box | FR-SRCH-001 to FR-SRCH-025 | FR-SRCH notes: search replaces type-to-jump and large-room tree navigation |
| Context menu and toolbar for quick actions | FR-MOB-001 to FR-MOB-011 | FR-MOB notes: a visible per-row overflow button opens the action sheet, long-press is reserved for selection; labelled bottom action bar |
| Keyboard navigation | FR-MOB-038, FR-MOB-039, FR-MOB-040, FR-MOB-034, FR-MOB-036, FR-MOB-037 | FR-MOB notes: kept in full as a level-A obligation and the desktop enhancement |
| Used storage info | FR-ACCT-004, FR-ACCT-005, FR-ACCT-027, FR-ROOM-023, FR-PERF-025 | FR-ACCT notes: quota is administrator-set per room, with an explicit default |
| Light and dark themes, with easy customisation | FR-MOB-024 to FR-MOB-029, FR-MOB-033 | FR-MOB notes: token-only change surface is the definition of "easy" |
| Optimised for large datasets with dynamic directory loading | FR-PERF-001 to FR-PERF-007, FR-PERF-019, FR-PERF-020, FR-MOB-016 | FR-PERF notes: cursor pagination, virtualisation, reference-device budgets |

### Requested requirements

| Brief bullet | Requirements |
| --- | --- |
| Create a folder and nest folders in another folder | FR-FLDR-001, FR-FLDR-002, FR-FLDR-003, FR-FLDR-004 |
| View folders and their contents including nested items, with breadcrumb navigation | FR-FLDR-014 to FR-FLDR-021, FR-FLDR-024, FR-FLDR-026, FR-VIEW-001 to FR-VIEW-004 |
| Update the folder name | FR-FLDR-006, FR-CONF-005, FR-CONF-010 to FR-CONF-014 |
| Delete a folder and its nested folders and files, warning the user what will be deleted | FR-FLDR-009, FR-FLDR-010, FR-FLDR-011, FR-FLDR-012, FR-FLDR-013, FR-FILE-031 to FR-FILE-034, FR-CONF-030 |

### Derivative requirements

| Brief bullet | Requirements |
| --- | --- |
| Authorization | FR-AUTH-011, FR-AUTH-021, FR-SHARE-006, FR-SHARE-017, FR-SHARE-024, FR-ROOM-019, FR-ROOM-020 |
| Authorization and authentication, owner-based access, room not visible unless shared | FR-AUTH-001 to FR-AUTH-030, FR-ROOM-002, FR-ROOM-019, FR-ROOM-020 |
| Access control with roles and permissions, public link versus permissioned share | FR-SHARE-001 to FR-SHARE-008, FR-SHARE-022, FR-SHARE-024, FR-SHARE-025, FR-SHARE-033 |
| Access revocation at any time by the owner | FR-SHARE-014, FR-SHARE-015, FR-SHARE-016, FR-SHARE-026, FR-SHARE-028, FR-SHARE-031, FR-AUTH-016 |
| Read-only enforcement for shared content | FR-SHARE-004, FR-SHARE-011, FR-SHARE-017, FR-SHARE-018, FR-ROOM-006, FR-ACCT-029 |
| Conflict resolution for duplicate file and folder names | FR-CONF-001 to FR-CONF-014, FR-FILE-015, FR-FILE-028, FR-FILE-043 |

### Hard product constraint: desktop primitives given a mobile-native equivalent

| Desktop primitive | Mobile-native baseline | Desktop enhancement | Prohibition |
| --- | --- | --- | --- |
| Files tree view | FR-FLDR-018 drill-down, FR-FLDR-021 tree sheet with jump-to | FR-FLDR-022 persistent tree in a rail at the expanded class and above | FR-FLDR-023 no indented tree as compact primary |
| Split view | FR-FILE-026 staging tray, FR-FILE-024 destination picker | FR-VIEW-029 two-pane split at the expanded class and above | FR-VIEW-029 also gated on a 480 CSS px height floor, not width alone |
| Right-click context menu | FR-MOB-001 per-row overflow button opening the action sheet | Same menu on secondary click and Shift+F10 via FR-MOB-038 | FR-MOB-002 no action reachable only by gesture; FR-FILE-035 long-press never opens the sheet |
| Dense toolbar | FR-MOB-008 labelled bottom action bar, FR-MOB-009 contextual bar | FR-MOB-010 horizontal toolbar at expanded width | FR-MOB-011 navigation and primary actions never hidden |
| Keyboard navigation | FR-SRCH-001 search as type-to-jump, FR-MOB-035 live regions, FR-MOB-036 label-in-name | FR-MOB-039 shortcut set plus discoverable shortcut sheet | FR-MOB-038 keyboard operability is not desktop-only |
| Hover preview pane | FR-VIEW-007 details sheet at medium detent, FR-VIEW-010 full-screen viewer | FR-VIEW-032 docked inspector pane | FR-VIEW-033 nothing gated behind hover |
| Rubber-band multi-select | FR-FILE-035 long-press or "Select" enters selection mode, FR-FILE-037 select-from-here-to | Click, shift-click, marquee at fine pointer | FR-FILE-042 non-dragging alternative always exists |
| Drag and drop to move | FR-FILE-025 destination picker, FR-FILE-026 staging tray | FR-FILE-041 drag and drop at fine pointer | FR-FILE-042 dragging is never the only path |
| Double-click to rename inline | FR-FILE-029 rename sheet with base name selected | Keyboard rename shortcut via FR-MOB-039 | FR-FILE-029 extension never silently destroyed |

---

## Requirement-to-epic coverage matrix

Every epic is covered, and every domain is owned. Counts are of requirements whose Epic column
names that epic, so a requirement written in one domain but owned by another epic is counted under
its owning epic.

| Epic | Owned requirements | Count | R1 Must count |
| --- | --- | --- | --- |
| E01 Access and Identity | FR-AUTH-001 to FR-AUTH-021, FR-AUTH-023 to FR-AUTH-026, FR-AUTH-029 | 26 | 20 |
| E02 Data Rooms and Workspace Home | FR-ROOM-001 to FR-ROOM-017, FR-ROOM-019 to FR-ROOM-022, FR-ROOM-024 to FR-ROOM-026, FR-ROOM-028 | 25 | 15 |
| E03 Folder Hierarchy and Navigation | FR-FLDR-001 to FR-FLDR-004, FR-FLDR-006, FR-FLDR-007, FR-FLDR-009 to FR-FLDR-011, FR-FLDR-013 to FR-FLDR-016, FR-FLDR-018, FR-FLDR-019, FR-FLDR-021 to FR-FLDR-024, FR-FLDR-027 to FR-FLDR-029 | 22 | 19 |
| E04 File Operations | FR-FLDR-030, FR-FILE-001 to FR-FILE-010, FR-FILE-012 to FR-FILE-014, FR-FILE-017 to FR-FILE-029, FR-FILE-031, FR-FILE-036 to FR-FILE-041, FR-FILE-044 | 35 | 22 |
| E05 Viewing, Preview and File Details | FR-FLDR-025, FR-FILE-030, FR-VIEW-001 to FR-VIEW-005, FR-VIEW-007, FR-VIEW-008, FR-VIEW-010 to FR-VIEW-014, FR-VIEW-016 to FR-VIEW-030, FR-VIEW-032 | 30 | 17 |
| E06 Search and Discovery | FR-ROOM-027, FR-SRCH-001 to FR-SRCH-018, FR-SRCH-020, FR-SRCH-022 to FR-SRCH-024 | 23 | 14 |
| E07 Sharing and Access Control | FR-AUTH-022, FR-AUTH-030, FR-ROOM-018, FR-ROOM-029, FR-ROOM-030, FR-VIEW-035, FR-SHARE-001 to FR-SHARE-028, FR-SHARE-030 to FR-SHARE-035 | 40 | 27 |
| E08 Conflict Resolution and Data Integrity | FR-FLDR-005, FR-FLDR-008, FR-FILE-015, FR-FILE-032 to FR-FILE-034, FR-FILE-043, FR-CONF-001 to FR-CONF-030 | 37 | 30 |
| E09 Mobile UX Foundations | FR-FLDR-012, FR-FLDR-017, FR-FLDR-020, FR-FILE-035, FR-FILE-042, FR-VIEW-009, FR-VIEW-031, FR-VIEW-033, FR-VIEW-034, FR-SRCH-019, FR-SRCH-021, FR-MOB-001 to FR-MOB-015, FR-MOB-017 to FR-MOB-019, FR-MOB-021, FR-MOB-024 to FR-MOB-044, FR-MOB-046 | 52 | 42 |
| E10 Performance, Offline and Scale | FR-FLDR-026, FR-FILE-011, FR-FILE-016, FR-VIEW-006, FR-VIEW-015, FR-SRCH-025, FR-MOB-016, FR-MOB-020, FR-MOB-022, FR-MOB-023, FR-PERF-001 to FR-PERF-024, FR-PERF-026 | 35 | 25 |
| E11 Trust, Audit and Notifications | FR-AUTH-027, FR-SHARE-029, FR-MOB-045, FR-AUDIT-001 to FR-AUDIT-025 | 28 | 16 |
| E12 Account, Storage and Governance | FR-AUTH-028, FR-ROOM-023, FR-FILE-045, FR-PERF-025, FR-ACCT-001 to FR-ACCT-010, FR-ACCT-022 to FR-ACCT-025, FR-ACCT-027 to FR-ACCT-034 | 26 | 18 |

Every requirement appears in exactly one row. The twelve counts sum to 379, which is the total
number of requirements defined in this document after the internal-tool rework withdrew twelve
commercial requirements and added eight governance ones. The twelve withdrawn identifiers are
tombstoned in the FR-ACCT section and are not counted anywhere.

### Domain totals

| Domain | Requirements | Must | Should | Could | R1 | R1.1 | R2 | R3 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FR-AUTH | 30 | 21 | 7 | 2 | 24 | 0 | 4 | 2 |
| FR-ROOM | 30 | 16 | 12 | 2 | 21 | 0 | 9 | 0 |
| FR-FLDR | 30 | 25 | 4 | 1 | 28 | 0 | 2 | 0 |
| FR-FILE | 45 | 32 | 12 | 1 | 35 | 0 | 9 | 1 |
| FR-VIEW | 35 | 23 | 11 | 1 | 27 | 1 | 7 | 0 |
| FR-SRCH | 25 | 17 | 6 | 2 | 22 | 0 | 2 | 1 |
| FR-SHARE | 35 | 27 | 8 | 0 | 29 | 2 | 4 | 0 |
| FR-CONF | 30 | 23 | 7 | 0 | 24 | 0 | 6 | 0 |
| FR-MOB | 46 | 35 | 9 | 2 | 40 | 0 | 6 | 0 |
| FR-PERF | 26 | 17 | 8 | 1 | 24 | 0 | 2 | 0 |
| FR-AUDIT | 25 | 17 | 7 | 1 | 19 | 1 | 4 | 1 |
| FR-ACCT | 22 | 16 | 5 | 1 | 18 | 0 | 4 | 0 |
| **Total** | **379** | **269** | **96** | **14** | **311** | **4** | **59** | **5** |

The four R1.1 requirements are FR-VIEW-035, FR-SHARE-009, FR-SHARE-012 and FR-AUDIT-004: the
watermark, link expiry and the per-viewer access log, which ship as one trust increment together
with the recipient tracking disclosure in NFR-PRIV-010.

Counts are mechanical and are regenerated whenever a requirement is added. If a count here
disagrees with the tables above, the tables are authoritative and this section is stale. No
requirement in this document currently carries the `Won't` priority: everything explicitly ruled out
is recorded in the "Gaps deliberately left open" table below rather than as a requirement, because a
`Won't` row in a requirement table invites a sprint to pick it up.

### Gaps deliberately left open

These are not omissions. They are decisions recorded so nobody re-litigates them without seeing the
reasoning, and each has a corresponding entry in
[12-risks-and-open-questions.md](./12-risks-and-open-questions.md).

| Gap | Why it is out of R1 | Where it lands |
| --- | --- | --- |
| Dynamic watermarking | Rendering-pipeline cost, and it is only credible once server-side page rendering (FR-VIEW-016) is in place; it is not dropped, it is the first thing after R1 | FR-VIEW-035 and FR-SHARE-012, R1.1 |
| Per-viewer access log and share-link expiry | Ship as one increment with the watermark and with the recipient tracking disclosure, rather than trickling trust features out one release at a time | FR-AUDIT-004 and FR-SHARE-009, R1.1 |
| Structured question-and-answer workflow with recipients | Serves a user type explicitly out of scope in [02](./02-personas-and-jtbd.md); would turn a file tool into a workflow tool R1 cannot finish | Not scheduled |
| Redaction | Same reason as above, plus a legal-defensibility bar R1 cannot meet | Not scheduled |
| Native iOS and Android shells | The PWA covers the specified capability set except background upload and OS share-target on iOS; native is an explicitly scoped later option | Not scheduled |
| Content and OCR search | Filename search answers the stated job in R1; extraction adds infrastructure that only pays off once rooms are large | FR-SRCH-023 R2, FR-SRCH-024 R3 |
| Offline mutation beyond upload | Reconciliation over a permissioned hierarchy is a distributed-systems problem; R1 is honest read-only offline | FR-CONF-025 to FR-CONF-028, R2 |
| Compliance attestations (SOC 2, HIPAA, BAA) | No audit programme exists yet, and the user types that would require one are explicitly out of scope in [02](./02-personas-and-jtbd.md) | Not scheduled |
| A build-out of SSO as its own requirement set | The company identity provider is recorded as an assumption in the FR-AUTH notes, with the open question of which provider still open; the existing credential requirements remain the fallback and the recipient path | FR-AUTH notes; open question in [12](./12-risks-and-open-questions.md) |
