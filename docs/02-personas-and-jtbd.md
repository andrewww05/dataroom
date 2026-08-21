# Personas & Jobs-to-be-Done

## Purpose

This document names exactly who this internal tool is for and what they are trying to get done. Data
Room is a tool the company builds for its own staff: nothing here is sold, there is no commercial
surface of any kind, and nobody outside the company ever gets an account. It gives six personas (`P1`-`P6`) enough concrete
detail that a designer can lay out a screen and a QA engineer can reproduce a session on a real
phone. Three are internal staff roles; three are **external recipients**, because the person who
matters most in this product is somebody who was sent a link, has no account, is holding a phone, and
has never seen our interface. It separates what a staff sharer needs from what that recipient needs,
because those are two different products sharing one codebase and the second one is the more
demanding surface. It converts all of that into nineteen jobs-to-be-done mapped to epics and
releases, a device and network baseline the whole team designs and tests against, and a coverage
matrix so no persona is orphaned and no epic is unowned.

Every figure carries its source. Anything reasoned rather than sourced is labelled `Assumption:` or
`Estimate:`. Where the evidence contradicts a founding premise of the build, this document says so.

## Related documents

- [Documentation index](./README.md)
- [Prior art & UX benchmark](./01-prior-art-and-ux-benchmark.md)
- [Product overview](./03-product-overview.md)
- [Epics](./04-epics.md)
- [Functional requirements](./05-functional-requirements.md)
- [Business rules & permissions](./06-business-rules-and-permissions.md)
- [Non-functional requirements](./07-non-functional-requirements.md)
- [Mobile UX spec](./08-mobile-ux-spec.md)
- [Domain model & glossary](./09-domain-model-and-glossary.md)
- [Success metrics & analytics](./10-success-metrics-and-analytics.md)
- [Master backlog](./11-master-backlog.md)
- [Risks & open questions](./12-risks-and-open-questions.md)
- Backlog: [E01 Access & Identity](./backlog/epic-01-access-and-identity.md) ·
  [E02 Data Rooms & Workspace Home](./backlog/epic-02-data-rooms-and-workspace-home.md) ·
  [E03 Folder Hierarchy & Navigation](./backlog/epic-03-folder-hierarchy-and-navigation.md) ·
  [E04 File Operations](./backlog/epic-04-file-operations.md) ·
  [E05 Viewing, Preview & File Details](./backlog/epic-05-viewing-preview-and-file-details.md) ·
  [E06 Search & Discovery](./backlog/epic-06-search-and-discovery.md) ·
  [E07 Sharing & Access Control](./backlog/epic-07-sharing-and-access-control.md) ·
  [E08 Conflict Resolution & Data Integrity](./backlog/epic-08-conflict-resolution-and-data-integrity.md) ·
  [E09 Mobile UX Foundations](./backlog/epic-09-mobile-ux-foundations.md) ·
  [E10 Performance, Offline & Scale](./backlog/epic-10-performance-offline-and-scale.md) ·
  [E11 Trust, Audit & Notifications](./backlog/epic-11-trust-audit-and-notifications.md) ·
  [E12 Account, Storage & Governance](./backlog/epic-12-account-storage-and-governance.md)

## Where the numbers in this document come from

This file describes people. It does not own thresholds, and it does not set release tags. It **cites**
them, with the owning identifier in parentheses wherever a number appears for readability.

| Kind of statement | Owned by | This file does |
| --- | --- | --- |
| Requirement Release tag and Priority | [05](./05-functional-requirements.md) | Cites the FR ID; the Release column in the jobs table below is derived, not authoritative |
| Thresholds, limits, retention windows, timing guarantees, permission rules | [06](./06-business-rules-and-permissions.md) | Writes the figure with its `BR-` ID, e.g. "within 5 seconds at p95 (BR-108)" |
| Metric IDs and event names | [10](./10-success-metrics-and-analytics.md) | Cites `M`nn in the jobs table rather than asserting its own targets |
| The responsive size-class ladder | [03](./03-product-overview.md) | Cites the one ladder; no other breakpoint numbers appear here |
| Entity field names and error codes | [09](./09-domain-model-and-glossary.md) | Cites them; names no field or code of its own |

The release ladder has exactly four rungs: **R1** (MVP), **R1.1** (Trust hardening), **R2**
(Fast-follow), **R3** (Later). R1.1 is a named increment, not a slip, and it is defined in
[03's release plan](./03-product-overview.md).

---

## Who this tool is for

### The decision

**This is an internal tool for the company's own staff, and for the external recipients those staff
send documents to.** Every requirement in R1 is specified for one of the six personas below. If a
requirement cannot be traced to `P1`-`P6`, it needs a justification recorded in
[Risks & open questions](./12-risks-and-open-questions.md).

There are three populations and only three:

1. **Staff who create and share rooms** (`P1`, `P6`). They own the client-facing engagement, assemble
   the document set, and send it outward. They work away from a desk more than at one.
2. **Colleagues who maintain the workspace** (`P4`). One of them also holds the **administrator**
   role: storage quota per data room, retention settings, joiner and leaver provisioning, export.
   The administrator is a colleague with a role, not a separate audience.
3. **External recipients** (`P2`, `P3`, `P5`). Clients, counterparties and their advisers. They are
   reached **only** through a public link or an emailed invite. They never get an account, never see
   the company identity provider, and never learn our interface. They are, nonetheless, the surface
   the product is judged on, because a recipient who cannot read the document on a phone will ask a
   colleague to email the attachment instead, and at that moment the controls this tool exists to
   provide are gone.

`P1`-`P6` is the reserved persona namespace across the whole document set. No other file may reuse
`P`nn for anything else; [10](./10-success-metrics-and-analytics.md) uses `PII0`-`PII3` for its data
classes for exactly this reason.

### Identity: the assumption to design against

**`Assumption: A-IDP-01`.** The company identity provider (SSO over OIDC) is the **primary sign-in
path for staff**. Staff do not maintain a separate password for this tool; the joiner and leaver
flows in [E12](./backlog/epic-12-account-storage-and-governance.md) are expected to hang off the
directory that provider is backed by.

Two consequences, both deliberate limits on this pass:

- **No new SSO requirement set is written in this pass.** The existing email, magic-link, passkey and
  re-authentication requirements (`FR-AUTH-001` to `FR-AUTH-019`) stay exactly as they are. They are
  the fallback path for staff when the provider is unavailable, and they are the *only* path for
  external recipients.
- **External recipients must still be able to open a link with no account at all.** `FR-AUTH-020`
  (email-bound magic link for an invited recipient) and `FR-AUTH-021` (anonymous session from a
  public-link token) are hard R1 requirements and are not weakened by A-IDP-01. Nothing about staff
  SSO may leak an interstitial, a tenant chooser or a "sign in with your work account" prompt onto
  the recipient path.

**Open question, for [Risks & open questions](./12-risks-and-open-questions.md): which identity
provider, and does it support the group claims the administrator role needs?** Entra ID, Okta and
Google Workspace differ in how they express group membership and in how promptly a deprovisioning
event is visible to a relying party, and `P4`'s leaver job (JTBD-18) depends on that promptness. This
is an open question, not an assumption, and it must be answered before the E12 provisioning stories
are estimated.

### Why an internal tool is still designed mobile-first

1. **Staff are not at a desk when the document set is needed.** `P1` is standing in a client's car
   park with a phone in one hand and a folder of paper in the other. The job is "get a populated,
   read-only room in front of the external contact within the hour, before the conversation goes
   cold." That is a phone job. Comparable tools fail it: their mobile apps cannot upload folders or
   manage permissions at all, and one major consumer drive states plainly that limited-access folders
   cannot be toggled from a mobile device. See
   [Prior art & UX benchmark](./01-prior-art-and-ux-benchmark.md).

2. **The phone is the scanner.** Documents arrive as photographs: a lease handed over on site, a
   nameplate in a mechanical room, six pages of an operating record. "Capture a document into the
   right nested folder from your phone and share it read-only with the counterparty's accountant" is
   the highest-value single flow in the product, and it does not exist anywhere in the prior art at a
   quality worth copying.

3. **The external recipient will never open a laptop for the first pass.** `P2` and `P5` do the first
   read on a phone in 20-to-40-second and 60-to-240-second bursts, and escalate to a laptop only if
   genuinely engaged. Adobe's survey of 2,000+ Americans found 45% stopped reading, or did not even
   try to read, a document on mobile, and 72% said they would work on mobile more if documents were
   easier to read [17]. Losing the first pass means the recipient asks for email attachments, and the
   company loses revocation, read-only enforcement and any record of who read what.

### The trust increment (R1.1) is not optional

**R1 as scoped has no dynamic watermark, no per-viewer access log and no share-link expiry.** Staff
will demand all three the first time a confidential document reaches somebody it should not have.
That is why R1.1 exists as a named increment in [03's release plan](./03-product-overview.md) rather
than as a vague "later": it contains the dynamic per-viewer watermark, the per-viewer access log, and
share-link expiry, plus the recipient tracking disclosure that must ship in the same increment as the
tracking itself (see the asymmetry table below). Owned by
[E07](./backlog/epic-07-sharing-and-access-control.md) and
[E11](./backlog/epic-11-trust-audit-and-notifications.md), and recorded as a risk in
[Risks & open questions](./12-risks-and-open-questions.md).

---

## Persona directory

Six personas. Three are internal staff (`P1`, `P4`, `P6`), one of whom (`P4`) also holds the
administrator role. Three are external recipients (`P2`, `P3`, `P5`). The split is deliberate: half
the product is a surface used by people who never sign in, never get an account, and never learn our
interface.

---

### P1 — Marcy Doyle · Engagement lead, five to eight live engagements at once

**Role: STAFF SHARER / ROOM OWNER. If Marcy cannot get a room live in four minutes she will use a
shared consumer drive folder instead, and every control this tool exists to provide is gone.**

| Attribute | Detail |
| --- | --- |
| **Role** | Engagement lead in the client-facing team. Owns the relationship end to end. No analyst assigned to her full time |
| **Context** | 5-8 live engagements at once, each with its own document set (financial records, contracts, operating documents) that must reach external counterparties and their advisers under a confidentiality undertaking. Every new engagement is a new data room, so the room, not the file, is her unit of work |
| **Devices** | Company iPhone as the primary work computer. A five-year-old laptop that lives in the boot of the car. No tablet. Prints nothing |
| **Primary device split** | **Estimate: ~75% phone / ~25% laptop**, and the phone share is higher for the actions that matter most (create, rename, share, revoke) |
| **Network reality** | LTE, not wifi. Client car parks, back offices, industrial units. Intermittent |
| **Session length** | **90 seconds to 4 minutes.** Standing, one-handed, often with paper in the other hand |
| **Peak hours** | 7-8am and 8-10pm, consistent with Microsoft's 2025 Work Trend Index finding 40% of people online at 6am already triaging email and nearly 30% back online by 10pm [18] |
| **Sign-in** | Company identity provider on the laptop (`Assumption: A-IDP-01`); on the phone a persisted session (`FR-AUTH-012`) with a passkey (`FR-AUTH-009`) where the browser exposes one. She must never be asked to type a password on a phone in a car park |
| **Tech comfort** | Confident consumer-app user, allergic to setup. Will not read documentation, will not attend onboarding. An internal tool does not get patience for free: her alternative is one tap away |

**Goals**

- Get a populated, read-only room in front of an external contact **within an hour of the call**,
  before the conversation cools.
- Keep 5-8 rooms straight on a small screen without ever mixing up whose documents are whose.
- End a recipient's access the moment the engagement changes, in **seconds, not hours** (BR-108).
- Never be the reason a confidential document reached somebody it should not have.

**Frustrations**

- The workaround she is being asked to give up is genuinely convenient: a shared consumer drive
  folder is free of setup and instant. It also gives her no per-recipient scoping, no read-only
  enforcement she can verify, and no record of who opened what. See
  [Prior art & UX benchmark](./01-prior-art-and-ux-benchmark.md).
- **Has twice sent the wrong link to the wrong recipient.** This is the single highest-consequence
  failure in the entire product.
- Cannot revoke cleanly, so she deletes whole folders instead and breaks everybody else's access.
- Tools built for a desk assume somebody else loads them for her. Nobody does.

**A day in her thumb**

3:40pm, standing in the gravel lot outside a two-bay workshop. The client has just handed her a
manila folder: last year's accounts, the lease, and a vehicle schedule. The external contact she
spoke to this morning has just texted "send me what you've got". She has 11 minutes before her next
appointment.

She opens the app with her thumb. The home screen shows her rooms, and she can tell them apart at a
glance because each carries the client name and a colour. Tap **New room**, name it "Brandon
workshop", accept the default folder skeleton (Financials / Legal / Operations). Tap the Financials
folder, tap the **camera** action, photograph the two account pages, and the app assembles them into
one PDF and shows her the destination it is filing into before it commits. It tells her it has queued
2 items and is uploading over cellular. She drills into Legal, photographs the lease, six pages.

The upload bar says "3 of 8 uploaded, 2 paused". She walks toward the car and the bar reconnects. She
taps **Share**, picks **Invite by email**, pastes the contact's address (the field offers the
addresses she has used before, so she does not retype it), leaves the role on **Viewer**, leaves
**download** off, and taps Send. From R1.1 she also sets the link to expire in 14 days. Total: three
taps from the room to a sent invite.

She then remembers a recipient on another engagement who has gone quiet and started asking odd
questions. She switches to that room, opens **Who can see this**, finds him, taps the **"..."**
button on his row, taps **Revoke**, confirms once, and gets a toast naming the principal and the
scope. The link is refused within five seconds at p95 and 60 seconds absolutely (BR-108), and the
other eleven recipients are unaffected. She is in the car at 3:51pm.

**What success looks like**

She can create a room, drop in eleven files, set one recipient to read-only, share the link and
revoke a different recipient, all from the phone, in under three minutes, without pinching or
zooming, on a bad cell connection. Afterwards the activity log shows exactly what she did, so nobody
has to take her word for it.

**Product implications**

- **`E02`** is her home screen. Rooms must be visually unmistakable from each other on a 360 px
  screen: name, colour or avatar, recipient count, last activity. Room templates and a default folder
  skeleton so a new room is never a blank page. Room switcher reachable in the thumb zone.
- **`E02`** must enforce the invisibility rule: a room is not discoverable or visible to anyone it
  was not shared with. She has to be able to believe this without reading documentation, and a
  principal with no grant on the target must receive a `404 NOT_FOUND` that is byte-identical and
  timing-equivalent to a genuinely absent resource, never a `403` that confirms the room exists.
- **`E03`** create and nest folders from the phone; rename inline via a sheet; delete with a
  count-bearing cascade warning naming exactly how many folders and files will be destroyed
  (`FR-FLDR-010`).
- **`E04`** camera and photo-library upload straight into a chosen nested folder, with a visible
  destination confirmation before commit. Resumable upload that survives a tunnel. Honest paused
  state, never a claim of background upload.
- **`E07`** is her core value: three taps to share read-only, three taps to revoke, effect within
  BR-108's propagation target, per-recipient scoping, and a permanently visible "who can see this
  right now" surface (`FR-SHARE-022`, `FR-SHARE-023`). **Wrong-link-to-wrong-recipient must be
  structurally hard**: the share confirmation names the room and the recipient.
- **`E09`** thumb-zone layout, bottom action bar, and the row interaction model she cannot get wrong:
  the action sheet opens from an always-visible **"..." overflow button on the row's trailing edge,
  at least 48x48 CSS px** (`FR-MOB-001`, `FR-MOB-002`), while **long-press enters multi-select and
  selects that row** (`FR-FILE-035`). Toast plus a 10-second undo (BR-176). Zero documentation. First
  room live in under four minutes.
- **`E11`** notification when a recipient opens a document, because that is the moment she calls him
  back. Delivery p95 within 30 seconds (`FR-AUDIT-022`).
- **`E12`** she must be able to see used storage and the per-room breakdown (`FR-ACCT-004`,
  `FR-ACCT-005`) so that a ceiling never surprises her mid-upload, and she is the person a leaver
  flow acts on when she moves teams: her rooms transfer and her outward links do not silently
  survive her.

---

### P2 — Dev Raman · External recipient with no account, opens the link on a commuter train

**Role: EXTERNAL RECIPIENT. The most demanding surface in the product: a phone, no account, no
training, and no reason whatsoever to persist.**

| Attribute | Detail |
| --- | --- |
| **Role** | Operations manager at an external counterparty. Received an emailed invite from `P1`, or a public link forwarded by his own colleague. **Has never seen a data room before** |
| **Context** | Tracking several parallel conversations at once, has signed a confidentiality undertaking on paper, and has no login for anything of ours. He will not create one, and nothing in the product asks him to |
| **Devices** | Android phone. A work-issued laptop he will not put another company's confidential documents on. A personal laptop he opens maybe twice a week |
| **Primary device split** | **~95% phone for the first pass, 100% phone for anything time-sensitive.** Android is 41.62% of US mobile OS share and 69.14% globally, so the room cannot be iOS-shaped |
| **Network reality** | Commuter train, office wifi he does not trust, cellular in a queue. Frequently degraded |
| **Session length** | **20 to 40 seconds**, one thumb, spread across a dozen sessions a day |
| **Identity** | **None.** An email-bound magic link (`FR-AUTH-020`) or an anonymous public-link session (`FR-AUTH-021`). He never sees our identity provider, and as an anonymous visitor his role is always Viewer, with download-allowed as the only variable (`FR-SHARE-007`) |
| **Tech comfort** | High consumer fluency, **zero domain fluency**. Will not tolerate an interstitial, a download prompt, or a PDF viewer that fights him. Bounces silently rather than complaining |

**Goals**

- Decide in 90 seconds of skimming whether this is worth a weekend of real work.
- Find the two documents he was told about before he gets to the office.
- Understand what he is looking at without a glossary.
- Never lose the link.

**Frustrations**

- PDFs that arrive as a wall of unreadable 6pt text on a phone screen. Adobe's survey of 2,000+
  Americans found 65% find reading documents on mobile frustrating, **45% stopped reading or did not
  even try to read** a document on mobile, and 72% said they would work on mobile more if documents
  were easier to read. *(Caveat: this is 2020 data, the oldest figure in this document, and the only
  hard measurement of mobile document abandonment we could source.)* [17]
- Being asked to create an account before he can see anything.
- Getting a folder tree with 60 files and no idea where to start.
- Being tracked without being told. He is a person outside our company; the first view event
  recorded against him must not be recorded until he has been shown the tracking notice
  (`NFR-PRIV-010`, R1.1). Tracking and its notice ship together or not at all.

**A day in his thumb**

7:52am, standing on a commuter platform, one earbud in, phone in his right hand, coffee in his left.
An email arrives: "Brandon workshop, documents as promised." He taps the link.

The page opens **inside two taps and with no signup wall** (`FR-SHARE-021`). It says the room name,
who shared it, and his access level ("View only"), and it tells him plainly that his views are
recorded before any view of his is recorded. Below that, three files are surfaced first, not buried.
He taps the accounts file. The first page paints in about a second and the text reflows to phone
width; he is reading numbers, not pinching a shrunken A4 page. He swipes down two pages. The train
arrives and he pockets the phone mid-page.

9:14am, in a lift at work, he reopens the link from the same email. **It resumes at the page and
scroll position he left** (`FR-VIEW-024`, retained 90 days). He finishes the file, taps the back
affordance once (which works whether he uses the on-screen control or the Android system back
gesture), opens the lease, sees that it is 22 pages, jumps to the rent-escalation clause using the
page jump, and taps the room's **Ask** action to tell Marcy "yes, send me the maintenance records".
He never created a password.

Had that link been revoked overnight, he would have seen exactly one thing: a page reading **"This
link is no longer active."** It would not have told him whether the room exists, whether it ever
existed, who owned it, or when the link expired.

**What success looks like**

Taps the link, is inside within two taps with no signup wall, sees the files that matter surfaced
first, can read a page legibly without pinch-zoom, and can tell the sharer "yes, send me the lease"
from the phone.

**Product implications**

- **`E01`** invitee and anonymous access **without an account** (`FR-AUTH-020`, `FR-AUTH-021`). This
  is a hard R1 requirement, not a convenience. A signup wall in front of a first-pass read is the
  single most expensive design error available to us, and staff SSO must not introduce one.
- **`E05`** is his entire product. Full-screen viewer as its own history entry; text legible without
  two-dimensional scrolling at a 320 CSS px viewport (`FR-MOB-031`); page jump; **scroll and page
  position preserved across interruption and app switch** (`FR-VIEW-024`); unsupported-type fallback
  that does not dead-end.
- **`E05`/`E10`** first-page paint on a throttled mobile connection is a measured release gate (`M10`,
  `M36`). He abandons, he does not complain.
- **`E07`** the room states plainly who shared it, what he can do, and what he cannot. Read-only is
  enforced at the API (`FR-SHARE-017`), not by hiding a button. A dead, expired or revoked link
  renders **one** generic state, and never discloses an expiry date to an unauthenticated visitor.
- **`E07`** a principal holding no grant gets `404 NOT_FOUND`, byte-identical and timing-equivalent
  to an absent resource. `403` is reserved for a principal that already holds a grant on that exact
  target and is exceeding it, such as an authenticated Viewer attempting a write.
- **`E09`** Android system back and the iOS in-app back both work everywhere, every sheet is a
  popable history entry, 48 CSS px touch targets (`FR-MOB-028`), no hover-dependent affordance, no
  gesture as the only route to an action.
- **`E06`** he will search for "lease" before he navigates. Search must be the reachable primary
  (`FR-SRCH-001`), not a secondary convenience.
- **`E10`** poor-network banner that tells the truth, and a cached copy of what he already opened.
- **`E11`** his opens are the record the room owner relies on, so the event model must capture
  recipient activity without requiring a recipient account, and the disclosure must precede the
  first recorded view.

---

### P3 — Tomás Ferreira · External adviser acting for a counterparty, invited into somebody else's room

**Role: EXTERNAL RECIPIENT, and the professional who will demand the desktop enhancements. He triages
on mobile and analyses on desktop, and those are two different requirements.**

| Attribute | Detail |
| --- | --- |
| **Role** | Accountant at a six-person practice, engaged by an external counterparty to review the numbers. Pulled into 15-20 engagements a year, works to a fixed fee, **never the person who chose the data room** |
| **Context** | He is in the room because somebody else invited him. He has no relationship with us, no training, and no interest in acquiring either. He does have a professional obligation to be thorough, which is why he is the recipient who reads everything rather than skimming |
| **Devices** | iPhone plus a Windows laptop. Two monitors at an office he is rarely at during crunch. Sometimes an iPad for reading |
| **Primary device split** | **~35% phone / ~65% desktop by time, but ~80% phone by number of sessions.** He triages on the phone and analyses at a desk |
| **Network reality** | Client reception wifi, home wifi, cellular between appointments. Roughly a quarter of US paid workdays are now remote (26% as of February 2026), so "at his desk" is a coin flip on any given day [38] |
| **Session length** | 30 seconds to 3 minutes on mobile; 45 minutes and up on desktop |
| **Identity** | An email-bound magic link, valid for the length of the engagement (`FR-AUTH-020`, `FR-AUTH-012`). **He must never create a password**, and he must never be presented with our staff sign-in |
| **Tech comfort** | Professionally competent, institutionally conservative, deeply impatient with tools he did not pick |

**Goals**

- Get in, find the twelve documents he actually needs, decide within an hour whether the numbers
  hold, and flag missing items back to the sharer without a three-day email chain.

**Frustrations**

- Being invited with permissions so narrow he cannot see the folder he needs, or so broad he sees
  things he should not.
- No way to say "these four files are missing" **inside** the room.
- Different room software on every engagement, each with its own login.
- Read-only enforcement that also blocks him from downloading a spreadsheet he legitimately needs to
  model.

**A day in his thumb**

6:40pm, in a client's reception, waiting. He opens the room link Marcy sent this morning. He does not
browse; he taps search and types "ageing". Two results come back, each showing the folder path it
lives in (`FR-SRCH-008`), and he taps one to jump straight there (`FR-SRCH-010`). The file is present,
dated last month, which is what he needed to know.

He goes back to the room root. The folder list shows item counts (`FR-FLDR-024`), so he can see at a
glance that **Financials / Bank statements** says "0 items". That is the gap. He taps the row's
**"..."** overflow button, taps **Request files**, and types "Need Jan-Jun bank statements, all
accounts". One message, not a three-day email chain.

Then he checks whether he can actually work tomorrow: he opens the payroll file, sees the details
sheet showing 4.2 MB, XLSX, and **Download: allowed**, and closes the phone satisfied. Tomorrow
morning at his desk the same room opens with a persistent folder tree in a rail, a docked details
inspector and a real split view, because his laptop is at expanded width and taller than 480 CSS px.
He never thinks about it again.

**What success looks like**

Search finds a file by partial name on the first try from a phone. He can see at a glance which
requested folders are still empty, and ping the sharer without leaving the room. He never has to
create a password.

**Product implications**

- **`E06`** partial-filename search from a phone, first try, with the containing path on every result
  row and a jump-to-location action (`FR-SRCH-002`, `FR-SRCH-008`, `FR-SRCH-010`). This is his
  primary navigation, and every search emits `search_performed` (`FR-SRCH-022`), which must exist in
  10's event dictionary because that dictionary is the build gate.
- **`E03`** item counts on folder rows (`FR-FLDR-024`), because "is it in here yet" is his most
  frequent question and a count answers it without a drill-down.
- **`E07`** the download-allowed flag is a real, separately-controlled permission orthogonal to the
  role (`FR-SHARE-007`), not a side effect of read-only. A Viewer who cannot download a spreadsheet
  he must model is a broken engagement.
- **`E07`/`E11`** a lightweight in-room request or comment path so "these four files are missing"
  never becomes an email thread. **Scope check:** this is not a full structured Q&A module (out of
  scope, `X3`); it is one message attached to a folder.
- **`E01`** he must never create a password. Magic link or passkey, and the session must survive long
  enough to cover a multi-week engagement (`FR-AUTH-012`).
- **`E05`/`E09`** he is the persona who justifies the **progressive enhancements**, all of them
  keyed to the one size-class ladder in [03](./03-product-overview.md): the persistent folder tree
  rail at expanded and above (`FR-FLDR-022`), split view at expanded and above **and only when
  height is at least 480 CSS px** (`FR-VIEW-029`, `FR-VIEW-032`), the docked details inspector at
  expanded and above, keyboard navigation and the shortcut set (`FR-MOB-039`, R1). All of it is an
  enhancement on top of the touch baseline, never the baseline itself. See
  [Mobile UX spec](./08-mobile-ux-spec.md).

---

### P4 — Ashley Kim · Document operations coordinator, and the workspace administrator

**Role: INTERNAL COLLABORATOR AND WORKSPACE ADMINISTRATOR. The person who actually builds and
maintains the rooms, the highest-skill user in the product, and the holder of the administrator role
that [E12](./backlog/epic-12-account-storage-and-governance.md) defines.**

| Attribute | Detail |
| --- | --- |
| **Role** | Document operations coordinator supporting three engagement leads. The reason "internal collaborator" is a distinct role: `P1`'s world collapses into one person, but the moment a team has three or more leads, room hygiene becomes somebody's job. That somebody also ends up holding the administrator role |
| **Context** | Handles document collection from clients and colleagues who send things by text message, chat photo and forwarded email. Also the person who receives the joiner and leaver tickets |
| **Devices** | MacBook at a desk for bulk building. iPhone for everything between 5pm and 9am and everything that happens while she is on the phone with a client. Occasionally an iPad |
| **Primary device split** | **~60-70% desktop / ~30-40% phone**, and the phone share is concentrated in capture and correction rather than construction |
| **Network reality** | Office wifi for construction; train and home cellular for correction |
| **Session length** | 20-45 minutes at the desk; 45 seconds to 2 minutes on the phone |
| **Working hours** | Works the shoulders of the day, matching the Microsoft 2025 finding that most employees send or receive 50+ messages outside core hours [18] |
| **Sign-in** | Company identity provider (`Assumption: A-IDP-01`), with a passkey on the phone. Her administrator capability is a role on her staff identity, not a second account |
| **Tech comfort** | **Highest of any persona.** Power user, keyboard-shortcut person on desktop, and the one who will file the sharpest bug reports |

**What the administrator role actually consists of**

Every one of these is set by her as an administrator, never by anything acquired or provisioned from
outside, and every one of them has an explicit default she can see before she changes anything:

- **Storage quota per data room**, and optionally per team. Warning thresholds at 75%, 90% and 100%
  of the quota fire once per crossing, in the interface and by email, each stating the exact
  remaining allowance (BR-196). An upload that would cross the ceiling is refused **at initiation,
  before any byte is accepted**, stating the file size, the remaining allowance and the shortfall
  (BR-201). At or over the ceiling the room retains full authority to list, search, preview,
  download, share, revoke, rename, move, delete and export (BR-204). Data is **never** silently
  truncated, discarded or degraded (`FR-ACCT-009`).
- **Retention settings**, within the windows 06 owns: trash 30 days (BR-177), file versions 90 days
  with the 3 most recent always retained regardless of age (BR-186), activity log 24 months and
  administrator-configurable (BR-195).
- **Joiner and leaver provisioning.** Account provisioning for a new colleague, and deprovisioning
  for a departing one, including transfer of the rooms they owned and disposal of every outward
  share they created.
- **Data export and portability**, as an asynchronous job with a notification on completion
  (`FR-ACCT-022`, `FR-ACCT-023`).
- **Account deletion with a retention window**, cancellable inside that window.

**Goals**

- Assemble a complete, consistently named folder structure for a new engagement in under 30 minutes.
- Reuse the same skeleton across every engagement.
- Bulk-move files that arrived in the wrong place, from wherever she happens to be.
- Never let two files called `Lease.pdf` collide silently.
- Know a room is approaching its ceiling **before** a colleague's upload is refused in front of a
  client.
- When a colleague leaves, be certain that nothing they shared outward is still live.

**Frustrations**

- Colleagues who send 40 photos of documents by text.
- Duplicate filenames that overwrite or silently rename.
- Redoing the same folder tree from scratch on every engagement.
- Bulk operations that only exist on desktop, so she cannot fix a misfiled batch while she is out.
- **Deletion warnings that do not tell her what she is about to destroy.** This is her single
  highest-stakes interaction.
- Discovering, weeks after somebody left, that a public link they created is still serving bytes.

**A day in her thumb**

5:35pm, on the train home. A colleague has dumped nine files into the room root instead of into
**Financials / Tax returns**, and an external walkthrough is tomorrow morning.

She opens the room. She **long-presses the first file, which enters multi-select mode and selects
that row**: checkboxes appear on every row, the bottom bar becomes a contextual action bar reading "9
selected", and she taps the other eight. She taps **Move to**, and a single sheet opens showing the
room's folders with its own internal breadcrumb; she drills Financials, then Tax returns, then taps
**Move here**. A toast says "Moved 9 items" with an **Undo** that lives for 10 seconds (BR-176).

Two of the nine collide with files already there. Instead of silently renaming them, the app asks
once, in the same sheet, per conflicting name, offering **exactly three** choices: **Keep both /
Replace as a new version / Cancel**. There is no fourth option and no merge. She picks "Replace as a
new version" for one, because the colleague's copy is the signed one, and "Keep both" for the other.
The replaced version stays recoverable for 90 days, and the 3 most recent versions are kept
regardless of age (BR-186).

Then she notices a folder a colleague created called "misc stuff (delete?)" containing things she
cannot identify. She taps its **"..."** overflow button, taps **Delete**, and the confirmation states
plainly: **"This will permanently delete 3 folders and 47 files, including 12 files a recipient has
already opened, and will break 2 active shares."** She cancels, because that is not what she
expected, and messages the colleague instead. That cancel is the product working.

**A second scene, at the desk, because she is also the administrator**

Tuesday, 09:20. A leaver ticket: an engagement lead left on Friday. She opens the workspace
administration screen, finds his account, and asks to deprovision. The screen tells her the truth
before she commits: he owned 2 rooms, holds grants on 5 more, and **created 3 outward shares that are
still active**, one of them a public link with download allowed. She transfers the two rooms to
another lead, revokes all three shares in one action with the count shown before commit
(`FR-SHARE-031`), and confirms the deprovision. Every step lands in the activity log, which is
retained for 24 months (BR-195). Nothing about his access survives him, and nothing he was
responsible for is lost.

**What success looks like**

She can multi-select nine files and move them into a nested folder with one thumb. Duplicate-name
conflicts prompt her with exactly three choices rather than resolving silently. A delete warning
enumerates the 3 folders and 47 files it will take with it. She can clone a folder skeleton from the
last engagement. And a leaver leaves nothing live behind them.

**Product implications**

- **`E04`** multi-select mode on touch: **long-press enters multi-select and selects the row**
  (`FR-FILE-035`), checkboxes, a contextual bottom action bar with the selection count, and bulk
  move / copy / delete with **partial-failure reporting**. The action sheet is a separate,
  discoverable affordance: an always-visible **"..." button on the row's trailing edge, at least
  48x48 CSS px** (`FR-MOB-001`, `FR-MOB-002`). This matches iOS Files, Google Drive and Dropbox, and
  a visible button satisfies WCAG 2.5.1 without needing a separate fallback.
- **`E04`/`E05`** the destination picker is **one sheet with in-sheet drill-down and its own
  breadcrumb** (`FR-MOB-005`), never a stack of sheets. It is also the mobile equivalent of split
  view.
- **`E08`** duplicate-name resolution is an explicit choice at the moment of collision with exactly
  three options (`FR-CONF-006`: keep both with a deterministic suffix, replace as a new version,
  cancel), never a silent auto-rename and never a silent overwrite. Case-insensitive collision
  policy, forbidden characters, Unicode normalisation, and name and path limits measured in **bytes**
  (255 UTF-8 bytes per name, 4096 UTF-8 bytes per path) with the UI warning in graphemes before the
  byte limit is reached.
- **`E08`** file versioning and version restore, because "replace as a new version" is only safe if
  the previous version is recoverable (BR-186). Optimistic concurrency so her move does not clobber a
  colleague's simultaneous rename.
- **`E03`** the cascade delete warning must state the exact counts (`FR-FLDR-010`), and (`E04`)
  delete must go to trash with restore for 30 days (BR-177), plus the 10-second undo toast (BR-176).
- **`E02`** room templates and folder-skeleton reuse, so a new engagement is five minutes rather than
  thirty.
- **`E09`** she is the second justification for the desktop enhancements (keyboard navigation, the
  shortcut set `FR-MOB-039`, marquee selection, tree rail, split view) **and** the proof that they
  cannot replace touch parity, because 30-40% of her touches are on the phone.
- **`E12`** she is the **primary driver of this epic**: the administrator role itself, the
  administrator-set storage quota with its thresholds and hard stop, the used-storage figure and
  per-room breakdown, retention settings, export, and the joiner and leaver flows. None of it is
  keyed to anything purchased; all of it is keyed to a role she holds.

---

### P5 — Ingrid Sørensen · Senior external decision-maker, reading between meetings

**Role: EXTERNAL RECIPIENT. The most ruthless user in the set and the proof of the mobile-first
constraint.**

| Attribute | Detail |
| --- | --- |
| **Role** | Principal at an external firm on the other side of the engagement. The person who decides whether her organisation proceeds, and the person nobody can ask to install anything |
| **Context** | She is sent several document sets a week and reads the first pass of each on a phone between meetings (`Estimate:`). The closest hard measurement available for a first-pass read of an unfamiliar document set is the deck-review data: a complete review at **3.2 minutes**, 23 seconds on the first page and ~15 seconds per page after, with a comparable index reporting ~3m44s for a first read [15][16]. Whatever the exact figure, her budget is minutes, not tens of minutes |
| **Devices** | iPhone, always. iPad on flights. Laptop only for the small number of engagements she has actually committed to |
| **Primary device split** | **~90% phone for first pass**, laptop only after a keep decision |
| **Network reality** | Taxi, hotel lobby wifi, roaming data. Frequently poor and frequently changing |
| **Session length** | **60 seconds to 4 minutes**, frequently interrupted and resumed |
| **Reading hours** | 6am and after 22:00. The Microsoft 2025 Work Trend Index pattern (40% online at 6am, ~30% back online by 22:00, meetings starting after 8pm up 16% YoY, 30% of meetings spanning time zones) describes her literally [18] |
| **Identity** | None, and she will not acquire one. An anonymous public-link session (`FR-AUTH-021`), Viewer role, download flag as the sharer set it |
| **Tech comfort** | Very high, and correspondingly ruthless. **Zero patience budget** |

**Goals**

- Reach a proceed-or-pass decision in under four minutes without opening a laptop.
- Read the summary document, the one-pager and the numbers file.
- Forward one file to a colleague.
- Come back later and not lose her place.

**Frustrations**

- Rooms that demand a signup or a click-through before she can see anything. She will simply not do
  it for a first look.
- Files that download rather than preview.
- A folder tree she has to navigate three levels deep before she finds the document she was told
  about.
- Losing scroll position when she switches apps mid-read.

**A day in her thumb**

21:48, in the back of a taxi. A follow-up email, a link, a tap.

No gate. The room opens directly onto the summary document, because the sharer designated it as the
landing document, and the first page is already painted. She swipes through 14 pages in about 100
seconds, pausing on the numbers. Her phone rings; she takes the call; four minutes later she returns
to the browser and the document **is on page 9 where she left it** (`FR-VIEW-024`).

She wants a colleague to see the numbers file, so she taps the file's **"..."** overflow button and
**Share to another app**, dropping it into a chat. That action is present because download is allowed
on this share; where download is off it is honestly absent rather than present and failing
(`FR-SHARE-011`). The room's own share controls remain the sharer's business, not hers, and nothing
in the UI implies she has permission she does not have.

Next morning at 06:20 she reopens the link from the same email and there is no re-authentication
challenge, because she is on the same device and the session is still valid. Nobody asked her to
create an account at any point.

**What success looks like**

Link opens straight into a readable document with no gate. The single most important file is the
first thing she sees, not the fourth folder down. Text reflows to phone width instead of rendering a
shrunken A4 page. She can resume exactly where she left off.

**Product implications**

- **`E07`** the sharer must be able to designate a **landing document** for a share, so a link can
  open directly onto the thing that matters rather than a folder listing. This is the
  single highest-leverage feature on the recipient path and E07 must carry it as a share
  configuration.
- **`E01`** public link access with genuinely no account, no interstitial and no app-install prompt
  (`FR-AUTH-021`). An optional email-capture gate is the sharer's choice (`FR-AUTH-022`) and must be
  one field, not a form.
- **`E05`** resume position per file per principal, surviving app switch, tab discard and next-day
  return, retained 90 days (`FR-VIEW-024`). Preview, never download-by-default.
- **`E05`** "share to another app" via the OS share sheet for a file she is allowed to have, and a
  clear, honest absence of that action when download is disallowed.
- **`E10`** first-page paint budget on a poor connection is her entire experience (`M10`). She does
  not complain, she passes, and then she asks for the documents by email, which is the outcome the
  whole product exists to prevent.
- **`E11`** her opens produce the per-viewer, per-page record that makes an outward share defensible
  after the fact, and that record is R1.1 together with the disclosure that must precede it.
- **`E07`** she must never be told, by a status code or by a message, whether a link she cannot use
  ever existed. One generic state, no expiry date, no owner name.
- **`E09`** reduced-motion respect, dynamic type, and a viewer that does not fight a one-handed grip
  in a moving vehicle.

---

### P6 — Ray Okonkwo · Field staff, works from client sites and asset inspections

**Role: STAFF SHARER, field conditions. The persona who will find every offline and flaky-network bug
in R1.**

| Attribute | Detail |
| --- | --- |
| **Role** | Field engagement manager. Runs site visits and asset inspections, then publishes the resulting document package to a curated external recipient list under confidentiality |
| **Context** | 6-10 sites in progress at a time, each with a survey, a schedule of condition, an environmental report and title documents. His comparable-profession analogue lives on a phone: NAR's 2025 Technology Survey puts field professionals at a **median 44% of working time** on client work via mobile devices, with 94% using mobile to communicate with clients [4][5] |
| **Devices** | iPhone Pro with a big screen in a rugged case. iPad Pro in the truck for showing documents on site. Desktop at an office he visits twice a week |
| **Primary device split** | **~85% phone and tablet / ~15% desktop.** Zero interest in the desktop product |
| **Network reality** | **The worst in the set.** Signal blackspots at basement and rural sites, one bar of LTE or none. Damaged hardware is normal: an on-site survey found more than 80% of field workers have damaged their devices, three in four with cracked screens, and 44% said device failures delayed work by more than an hour [21] |
| **Session length** | Two-minute sessions between site walks |
| **Sign-in** | Company identity provider on the desktop, persisted session plus passkey on the phone. A sign-in challenge with no signal is a hard failure for him, so the session must outlive the blackspot (`FR-AUTH-012`) |
| **Tech comfort** | Medium-high, entirely mobile-native |

**Goals**

- Publish a document package to 30 external recipients the day it is ready.
- Add the new environmental report from the site itself.
- See which recipients are actually engaged.
- End access for the ones who have gone quiet.

**Frustrations**

- Signal blackspots: uploads that fail silently and leave a half-loaded folder.
- Large PDF plan sets that are unusable on a phone.
- Being unable to show a document to the person standing next to him because the app needs a network
  round trip. This is the same reality as construction, where 93% of trade contractors use
  smartphones on site and 65% use tablets [20].

**A day in his thumb**

11:15am, in a mechanical room in the basement of a 1970s building, hard hat on, gloves half off,
thumb on a cracked screen. **No bars.**

He needs to show the client contact standing next to him the schedule of condition. He opens the app:
the offline banner says "Offline. Showing your cached copy." The file he opened this morning is there,
and it renders. The contact reads it.

He then photographs a newly-found survey sticker and the plant nameplate, and captures the 14-page
environmental report the engineer left on site, 40 MB. The app queues all of it, tells him "3 items
queued, will upload when you have signal", and does not pretend to be uploading in the background. He
climbs the stairs. At one bar the queue starts, stalls at 18%, and resumes at the same committed
offset rather than starting over. He does not need to watch it: when it completes he gets a toast, and
if it fails he gets a row he can retry, not a silent gap.

Back in the truck he taps **Share**, selects the eight recipients who have returned the
confidentiality undertaking from a list that remembers them, sets **Viewer**, download off, watermark
on (R1.1), and sends. Then he opens the room activity and sees that two recipients from last week
never opened anything, and revokes them in two taps each.

**What success looks like**

A 40 MB survey PDF uploads from one bar of signal, resumes after the connection drops, and lands in
the right folder. He can share to a new recipient with read-only access in three taps while walking.
Nothing he already opened goes blank when he loses signal.

**Product implications**

- **`E04`** resumable chunked upload is a **correctness requirement, not a performance nicety**: the
  resume offset is committed before each chunk, the queue is reconstructed on next app open, and the
  UI states honestly that a queued upload continues when he reopens the app rather than implying
  background progress. Adaptive chunk size, small on cellular.
- **`E10`** exactly three mutation kinds may be queued while offline: file upload, rename and
  delete-to-trash (BR-130). Everything else must say so at the point of attempt rather than being
  accepted into a queue that cannot honour it. He is the persona who would otherwise discover this
  the hard way.
- **`E10`** offline read cache for what he has already opened, with an honest label ("cached copy,
  may be cleared by your browser") because storage eviction is real and all-or-nothing per origin.
  Offline pinning of an explicitly chosen subset in R2.
- **`E05`** large plan-set and survey viewing must be server-rendered and streamed page by page above
  the 25 MB threshold (`FR-VIEW-016`). A client-side full decode of a 40 MB PDF is a crash on a
  mid-range phone.
- **`E09`** high-contrast, large touch targets, one-handed reach, and tolerance for a partially
  unreadable screen area, because his screen is cracked and he is wearing one glove.
- **`E09`** the offline and poor-network banner must be truthful and non-blocking. Never a modal.
- **`E07`** bulk share to a saved recipient list, watermark on (R1.1), download off, and two-tap
  revoke per recipient. Revocation is available to him because he created the grant, as well as to
  the room Owner and any Manager (`FR-SHARE-014`).
- **`E11`** engagement view per recipient ("who opened what, when") is what he uses to decide whose
  access to end.
- **`E12`** he hits a room's storage ceiling first, because his files are 40 MB photographs and
  surveys. The ceiling must warn at 75%, 90% and 100% (BR-196), refuse at initiation with the
  shortfall stated (BR-201), and never silently drop a byte (`FR-ACCT-009`). The quota is set by the
  administrator (`P4`) per room, not by anything he could purchase.

---

## User types explicitly out of scope

Each exclusion is a decision with a reason, so that a single loud request cannot quietly pull the
backlog somewhere it should not go. These are not "users we dislike"; they are **user types and use
cases whose requirements must not set our defaults**.

| # | User type or use case out of scope | Why it looks in scope | Why it is out | Revisit when |
| --- | --- | --- | --- | --- |
| **X1** | **External recipients as room builders or content owners** | They are already in the product every day, they ask for upload access, and a Contributor role exists | The authorization model roots every decision in a staff-owned room (`E02` invisibility rule, `E07` inheritance). An external principal owning content would need provisioning outside the company identity provider, a separate lifecycle, and a separate deprovisioning story that A-IDP-01 does not cover. External parties upload only into a scope a staff Owner created and only where a Contributor grant was explicitly given; an **anonymous public-link visitor is always Viewer** and no configuration lets an anonymous visitor write | If a genuine two-sided workflow appears, and not before the identity question above is answered |
| **X2** | **Protected health information and clinical documentation** | Staff genuinely handle documents that could contain health information, for example in benefits or insurance matters | There is no BAA, no HIPAA posture and no data-classification enforcement. A document workspace holding protected health information without those controls is a liability, not a feature. Staff must not place PHI in this tool, and the tool must say so where it is plausible | After data classification, an immutable audit trail and a compliance programme exist |
| **X3** | **Statutory audit evidence, structured Q&A and immutable record-keeping** | It is a document repository with an activity log, so it looks like a system of record | Read-only enforcement plus a revocable link plus a 24-month activity log (BR-195) is not an audit-grade evidence trail, and a structured Q&A module is a product in its own right. Using this tool as the immutable record would create a false assurance, which is worse than not having it | After immutable audit, version lineage and defensible retention exist. Not before R3 |
| **X4** | **External institutional counterparties demanding federated identity into our workspace** | Large external organisations will ask for SSO, entity-level permissioning and a security questionnaire | They are recipients on a link. Federating another organisation's directory into our workspace means an entity/group permission model, a tenancy story and an assurance programme, none of which R1 has. The recipient path (`FR-AUTH-020`, `FR-AUTH-021`) already gives them access without any of it | After an entity and group permission model exists, and only for a named internal need |
| **X5** | **Field-operations and project-management workflows** | The field evidence is the strongest anywhere: 93% of trade contractors use smartphones on site and 65% use tablets [20], and `P6` is literally in a mechanical room | Drawing markup, RFIs, punch lists and task workflow belong to the field-operations platform the company already runs. This tool must not become a thirteenth place documents live. `P6` captures documents here and shares them outward; he does not run a project here | Probably never as scope; possibly as an integration |
| **X6** | **Tender and grant submission** | Staff assemble submission packs, and the pack looks exactly like a room | Submissions must go through the mandated contracting-authority portal, not a room of our choosing. Internal assembly of a pack is a collaboration problem, and the room is a share-with-an-external-recipient tool | Not a product fit; do not revisit |
| **X7** | **Personal file storage for staff** | It is a file manager, so this looks adjacent | The revocable, read-only, recipient-facing share is the whole product. Without an external recipient there is no reason for this tool to exist rather than the company's general document storage, and personal content in a room with a 24-month activity log and administrator-set retention is a problem for everybody | **Out permanently**, not just in R1 |
| **X8** | **Desktop-primary power users as the design target** | `P3` and `P4` genuinely need the tree rail, split view, keyboard navigation and a docked details inspector, and will ask for them first and loudest | This exclusion means **anti-default, not anti-user**. Those primitives ship as real progressive enhancements at expanded width and above, on the single size-class ladder [03](./03-product-overview.md) owns. They must never set the baseline interaction model, and **no requirement gets specified desktop-first and retrofitted to touch**. See the translation table in the [Mobile UX spec](./08-mobile-ux-spec.md) | Never: this exclusion is structural and permanent |

### Withdrawn in the internal-tool rework

These identifiers existed in the previous, commercial version of this document. They are listed here
so that any cross-reference resolves to an explicit tombstone rather than dangling. None of them is
deferred; all are gone.

| Withdrawn ID or section | Reason |
| --- | --- |
| The "Primary beachhead audience" section, including its size-signal table and its five "why this segment" arguments | This is an internal tool. There is no segment to select and nothing to sell into |
| `A1` boutique commercial real estate brokers | Was a secondary audience-as-market. The field-mobile reality it carried survives inside `P6`, who is now internal staff |
| `A2` startup founders and their investors | Was a secondary audience-as-market. The measured first-pass reading economics it carried survive inside `P5` |
| `A3` buy-side individual acquirers and their lenders | Was a secondary audience-as-market and a conversion play. External parties are recipients only (`X1`) |
| `A4` boutique recruiting and executive-search firms | Was a secondary audience-as-market |
| `A5` long-lived corporate repositories | Was a secondary audience-as-market. Its real requirements (per-room storage breakdown, notification preferences, activity-log export) are now ordinary `E11` and `E12` scope |
| The "willingness to pay" and tech-spend figures attached to former `P1`, `P4` and `P6`, and the former `E12` implications about tiers, seats and card checkout | Commerce. Deleted outright, not deferred. `E12` is now Account, Storage & Governance |
| Former anti-persona rationales `X1`-`X6` as *segments* (enterprise M&A, healthcare as a market, audit practices as sharers, fund administrators, construction as a paid segment, tender volume) | The `X` identifiers survive and are reused above as **user types and use cases** out of scope. Only the market framing was removed |
| Sources 6, 7, 8, 9, 10, 11, 12, 13, 14, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 40 | Supported segment sizing, pricing, or an excluded market. Numbering is deliberately not compacted so that surviving citations keep their numbers |

---

## Sharer vs recipient asymmetry

Two audiences, one codebase, and radically different requirements. The staff sharer signs in through
the company identity provider, has been shown the tool by a colleague, and will tolerate one round of
learning. **The external recipient never signed in, never chose us, and will never learn our
interface. The recipient path is therefore the most polished surface in the product, not the least.**

| Dimension | **Staff sharer** (`P1`, `P4`, `P6`) | **External recipient with no account** (`P2`, `P3`, `P5`) | Implication |
| --- | --- | --- | --- |
| **Relationship to the tool** | A colleague using a tool the company built for them. Reachable, trainable, and identifiable | Was sent a link by somebody else. Has no relationship, no obligation to persist, and no support channel into us | Every recipient friction converts directly into a lost read. Zero-learning is a hard constraint, not an aspiration |
| **Entry point** | App home screen, signed in through the company identity provider (`A-IDP-01`), session persisted across devices | **A URL in an email or a text message**, tapped once, cold | The link is the product's front door. `E07`'s recipient experience and `E01`'s no-account access are the highest-traffic paths in the system |
| **Account requirement** | Full staff identity, SSO primary, passkey and magic link as fallback, session management, re-authentication on sensitive actions | **None, ever.** No signup, no password, no app install, no interstitial, and no sight of the staff sign-in screen (`FR-AUTH-020`, `FR-AUTH-021`) | Staff SSO may not leak onto the recipient path. `P5` will not sign in for a first look, full stop |
| **Role ceiling** | Owner, Manager or Contributor as granted; full authoring authority in their own rooms | **Viewer.** An anonymous public-link visitor is always Viewer, with the orthogonal download-allowed flag (`FR-SHARE-007`) as the only variable. Role control exists only on the invite path | No configuration lets an anonymous visitor write. There is no "Viewer or Contributor" picker on a public link |
| **Primary job** | Construct, organise, scope, revoke: authoring | Find one document and read it: consumption | The two surfaces need different navigation. Sharers get create and manage affordances; recipients get search plus a surfaced shortlist |
| **Navigation model** | Breadcrumb drill-down plus folder management on touch, and the tree rail plus split view at expanded width and above | **Search first, then a short surfaced list**, or a designated landing document. Never a 60-file tree as the landing experience | `E06` scope selection matters more to recipients; `E03` folder management matters only to staff |
| **What they must be told, explicitly** | Who can see this right now (`FR-SHARE-022`); what a delete will destroy (`FR-FLDR-010`); what a share grants before it is created (`FR-SHARE-025`) | What they are allowed to do (view only, download allowed or not), who shared it, that they are not seeing everything in the room, **and that their views are recorded** | `E07` must render access level plainly on the recipient's screen. Silence reads as either mistrust or a bug |
| **What they are told when access is gone** | An explicit, named result: which principal, which scope, what changed (`FR-SHARE-016`) | **One generic state: "This link is no longer active."** No expiry date, no room name, no owner, no distinction between revoked, expired, rotated and never-existed | A principal holding no grant on the target gets `404 NOT_FOUND`, byte-identical and timing-equivalent to an absent resource. `403` is permitted **only** for a principal that already holds a grant on that exact target and is exceeding it |
| **Tracking and disclosure** | Knows the activity log exists, wants it, and relies on it | **Must be shown the tracking notice before the first view event is recorded.** The notice and the tracking ship in the same increment (R1.1); the first `FR-AUDIT-004` view event for a recipient must not be recorded until the notice has been shown (`NFR-PRIV-010`) | Tracking a person outside the company without telling them is not a feature we ship early and disclose late |
| **Tolerance for confirmation dialogs** | High. They want the confirmation, because their actions are destructive | **Zero.** They are reading, so every extra tap is pure tax | Confirmation surfaces belong on write paths only. A read path with a confirmation is a design defect |
| **Session longevity need** | Weeks, across devices, with step-up re-authentication on sensitive actions | Days to weeks on one device, with **no re-authentication challenge for a returning reader on the same device** (`FR-AUTH-012`) | `E01`. A prior-art app review reading "works well for like 24 hours and then the exchange is removed" is the exact failure to avoid; see [Prior art & UX benchmark](./01-prior-art-and-ux-benchmark.md) |
| **Performance sensitivity** | Moderate. Will wait 3 seconds for an upload to start | **Absolute.** The closest measured analogue puts a full first review at 3.2 to 3.7 minutes total [15][16]. A 4-second first paint eats 2% of the entire review | `E10` first-page paint is the recipient's whole product (`M10`). `E05` resume position turns six interrupted 40-second sessions into one real review |
| **Offline need** | Real: `P6` needs cached documents in a basement | Real but different: `P2` loses signal on a train mid-page and must not lose the page | `E10` read cache plus `E05` position restore, both honestly labelled, and only the three queueable mutations in BR-130 |
| **Failure mode when unhappy** | Complains to a colleague, files a ticket, or quietly reverts to a shared consumer drive folder | **Bounces silently.** No ticket, no feedback, no signal except a shortened session in our own telemetry | `E11` and [Success metrics](./10-success-metrics-and-analytics.md) must instrument recipient sessions from R1, because the recipient will never tell us |
| **Who bears the cost of a bad experience** | The company | **The company, again, and worse.** A recipient who cannot read the document on a phone asks for an email attachment, and the colleague sends one | This is the internal-tool equivalent of churn, and it is more dangerous: it does not show up as a lost user, it shows up as an unlogged, unrevocable, un-watermarked copy of a confidential document sitting in somebody else's inbox. **This is why the recipient path is the priority** |
| **Platform mix** | **Knowable.** `Assumption:` the staff fleet is company-issued and skews iPhone, which means it can be enumerated and tested exhaustively | **Unknowable.** `P2` is on Android; Android is ~42% of US and ~69% of global mobile OS share (Statcounter, July 2026) | No iOS-only capability may be load-bearing anywhere on the recipient path, and no recipient-path bug may be closed on the grounds that it does not reproduce on the staff fleet |
| **Volume** | One Owner per room, a handful of staff grants | **Dozens per room** (`P6` shares with 30 recipients; `P1` with 12) | Recipients outnumber staff by an order of magnitude. The surface used by the many is the surface that must not have rough edges |

**The rule that follows:** when a sharer requirement and a recipient requirement conflict, **the
recipient wins on the read path and the sharer wins on the write path.** Write that into review
checklists.

**The rule behind the rule:** the tool's only reason to exist over an emailed attachment is that
access is scoped, revocable, read-only and recorded. Every recipient-path failure pushes a colleague
back toward the attachment, which is exactly the state the tool was built to end. A recipient defect
is therefore a governance defect, not a polish defect.

---

## Jobs-to-be-Done

Nineteen jobs, expressed in the standard "when / I want / so that" form. `JTBD-01` to `JTBD-19` are
local reference labels for this document only, not one of the stable ID schemes in the
[index](./README.md). The **Success measure** column cites metric IDs owned by
[Success metrics & analytics](./10-success-metrics-and-analytics.md) and thresholds owned by
[Business rules](./06-business-rules-and-permissions.md); where neither owns a figure yet, the
statement is a verification instruction rather than a target. The **Release** column is **derived
from [05](./05-functional-requirements.md)**, which owns every requirement's Release tag, on the four
rung ladder R1 / R1.1 / R2 / R3.

| # | Job statement | Trigger | Current workaround | Success measure | Personas | Epics | Release |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **JTBD-01** | When an external contact asks for the documents while I am standing in a client's car park, I want to create a data room, capture the accounts and the lease into it, and send a read-only link from my phone in under three minutes, so the conversation does not go cold while I drive back to a desk | Inbound call or text during a site visit | Create a shared consumer drive folder, drag files from the laptop later that evening, share the folder link | Time from room creation to the first share that is later opened (`M08`); rooms created on a phone instrumented from R1 (`M20`), no target asserted | P1, P6 | E02, E03, E04, E07, E09 | **R1** |
| **JTBD-02** | When a recipient goes quiet or an engagement changes shape, I want to end their access instantly from my phone without deleting anything or breaking the other twelve recipients' links, so control of a confidential document set never depends on my getting back to the office | Recipient goes silent, asks odd questions, or leaves the process | Delete the whole shared folder and re-share with everybody else, or do nothing | Taps from room to confirmed revoke: **3 or fewer** (`M46`). Propagation within **5 s at p95 and 60 s absolutely** (BR-108), measured by 10's revocation-latency metric and by a synthetic revoke-then-probe canary. A download already streaming is cut at the next range boundary and in no case more than 30 s after revocation. Collateral breakage: **zero** other recipients affected. Unintended access incidents remain zero (`M50`) | P1, P6, P4 | E07, E11, E09 | **R1** |
| **JTBD-03** | When I am running eight live engagements at once, I want each room to be visibly and unmistakably separate on a small screen, so I never send engagement A's confidential documents to engagement B's recipient | Switching between engagements during a working day | Colour-coded folders and hoping; `P1` has already sent the wrong link twice | Wrong-recipient share incidents: **zero** (`M50`). The share confirmation names the room and the recipient in every case (`FR-SHARE-025`) | P1, P4, P6 | E02, E07, E09 | **R1** |
| **JTBD-04** | When I receive a link in my inbox while on a commuter train, I want to tap it and be reading the actual document within two taps with no signup, no click-through and no app install, so I can decide in 90 seconds whether this deserves a weekend | Email or text arrives with a link | Tap, hit a signup wall, give up or defer to a laptop that never gets opened | Taps from link to rendered first page: **2 or fewer** (`FR-SHARE-021`). Recipient activation (`M09`) and recipient bounce before first document render, instrumented from R1 | P2, P3, P5 | E01, E07, E05 | **R1** |
| **JTBD-05** | When I am reading a document on a phone in a queue, I want the page legible at phone width without pinch-zoom or horizontal scrolling, so I actually finish it instead of abandoning it | Opening any document over one page on a phone | Pinch, zoom, pan, give up. 45% of people report stopping, or not trying to read, a document on mobile [17] | Read completion rate (`M15`). **No two-dimensional scrolling at a 320 CSS px viewport** (`FR-MOB-031`, WCAG 1.4.10) verified per document type. Automated WCAG conformance (`M48`) | P2, P3, P5 | E05, E09, E10 | **R1** |
| **JTBD-06** | When I get pulled off a first-pass read after 40 seconds, I want to come back later and resume at exactly the page and scroll position I left, so my six interrupted two-minute sessions add up to one real review rather than six restarts | Phone call, station arrival, meeting starts, app switch, tab discard | Start over from page one every time, and usually stop reading | Position restored across app switch, tab discard and next-day return on the same device: **100% for the three cases**, verified manually per platform, retention 90 days (`FR-VIEW-024`). Return recipient rate (`M22`) | P2, P3, P5 | E05, E10, E09 | **R1** |
| **JTBD-07** | When I am invited into a room as the counterparty's adviser, I want to see at a glance which of the twelve documents I asked for are present and which folders are still empty, so I can chase the gap in one message instead of a three-day email chain | Starting an external review engagement | A spreadsheet checklist maintained by hand, plus email | Item counts visible on every folder row without a drill-down (`FR-FLDR-024`). Chase cycles per engagement, self-reported: **down from 3+ to 1** | P3, P4 | E03, E06, E07, E11 | **R1** counts and in-room request; **R2** request-list tracking |
| **JTBD-08** | When I am on the phone with a client who is texting me photographs of documents, I want to capture or forward those files straight into the correct nested folder while still on the call, so nothing gets lost in my camera roll | Live call with a client who sends by text, chat or camera | Screenshots pile up in the camera roll; some get filed weeks later, some never | Taps from room open to a captured document filed into a chosen nested folder: **3 or fewer**, with the destination shown before commit. Capture-to-room upload share (`M18`) | P1, P4, P6 | E04, E08, E09 | **R1** camera and library; **R2** OS share-sheet target (Android only, see platform limits) and multi-page scan assembly |
| **JTBD-09** | When a batch of files has landed in the wrong folder, I want to multi-select nine of them with my thumb and move them into a different nested folder without a mouse or a right-click, so I can fix room hygiene from a train | Discovering a misfiled batch outside office hours | Wait until back at a desk; sometimes never fixed | Bulk move of 9 items completed on a phone in **under 60 seconds** (`M46`), with a single destination sheet and an undo toast (BR-176). Partial failures reported per item, never as one generic error. **Long-press enters multi-select; the action sheet opens from the row's "..." button** | P4, P1, P6 | E04, E05 (destination picker as the split-view equivalent), E08, E09 | **R1** |
| **JTBD-10** | When I upload two files that share a name, I want to be told explicitly and offered exactly three choices, so I never silently overwrite a version of a lease that a recipient is already relying on | Any upload, copy, move or rename that collides | A consumer drive silently keeps both with an opaque suffix, or a prior-art tool uploads a "copy" that gets messy; see [Prior art & UX benchmark](./01-prior-art-and-ux-benchmark.md) | **Zero silent overwrites and zero silent auto-renames**, verified by test. The prompt appears in the same sheet as the action, per colliding name, with exactly **keep both / replace as a new version / cancel** (`FR-CONF-006`). No fourth option, no folder merge. Superseded versions recoverable for 90 days, 3 most recent always kept (BR-186) | P4, P1, P6 | E08, E04, E03 | **R1** |
| **JTBD-11** | When I am about to delete a folder, I want to be shown exactly how many nested folders and files will go with it, and how many active shares it will break, before I confirm, so a mis-tap on a small screen cannot destroy a live engagement's document set | Tapping delete on any folder | A generic "Are you sure?" that says nothing, or no prompt at all; prior-art reviewers report folder moves with no confirmation prompt whatsoever | Confirmation states exact counts of folders, files, bytes and active shares (`FR-FLDR-010`). A second distinct confirmation gesture above the threshold in BR-174. Undo for **10 seconds** (BR-176), then trash for **30 days** (BR-177). Accidental deletion rate (`M49`) | P4, P1, P6 | E03, E04, E08, E09 | **R1** |
| **JTBD-12** | When I am uploading a 40 MB survey from a basement on one bar of signal, I want the upload to queue, survive the connection dropping, and resume automatically, so I am not left with a half-loaded folder I do not know about | Upload started on a degraded or intermittent connection | Prior-art reviewers: "uploading of documents often stalls requiring further intervention". Usually: email it to yourself and do it later | Upload resumes from the committed offset after a network drop and after an app backgrounding (`M40`, `M41`), or fails loudly with a retryable row. No silent partial folder. No UI copy claiming background upload where the platform does not provide it. Offline mutation loss rate **zero** (`M54`), and only the three queueable kinds in BR-130 | P6, P1, P4 | E04, E10, E08 | **R1** |
| **JTBD-13** | When I have already opened key documents in a room, I want them available when I lose signal entirely, so I can show a document to the person standing next to me in a mechanical room with no bars | Entering a basement, a rural site or a lift with somebody present | Screenshot everything in advance, or apologise | Previously opened documents render with **zero network**, behind an honest "cached copy" label. Cache limits and eviction stated in the UI, never implied as permanent. Unrecoverable session rate (`M44`) | P6, P2, P3 | E10, E05, E09 | **R1** read cache for opened items; **R2** explicit offline pinning |
| **JTBD-14** | When I am setting up a new engagement, I want to reuse the folder skeleton from the last one rather than rebuilding it, so a new room takes five minutes rather than thirty and every room in the team is named the same way | Winning or opening a new engagement | Manually recreate the same tree, inconsistently named, every time | Time to a fully structured empty room: **under 60 seconds** from a template. Room setup completion (`M11`); naming consistency measurable by template usage rate | P4, P1, P6 | E02, E03 | **R1** default template; **R2** save-as-template and team-shared templates |
| **JTBD-15** | When I need one specific file out of sixty, I want a search box that finds it on a partial filename from my phone, so I never have to navigate four levels of folder hierarchy with a thumb | Any "is it in here" or "where is the lease" moment | Scroll and guess; prior-art reviewers report search that "doesn't always work" | Partial-filename match returns the target in the **first three results** with its containing path and a jump-to-location action (`FR-SRCH-008`, `FR-SRCH-010`). Search success rate (`M19`). Type-ahead usable on a throttled connection without blocking input | P3, P2, P4, P5 | E06, E03, E09 | **R1** filename search; **R2** document content; **R3** OCR |
| **JTBD-16** | When I get to my desk for the engagements I have committed to, I want the tree rail, split view, keyboard navigation and a docked details inspector to be there as a genuine step up in power, so mobile-first does not mean I am capped at a toy when I am doing real work | Sitting down at a desktop or docking a tablet with a keyboard | Two different products with two different mental models, or a mobile app that is simply worse | Every touch capability is present at expanded width and above, **plus** the tree rail, split view (expanded and above, height at least 480 CSS px), marquee and range selection, docked inspector, and the keyboard shortcut set (`FR-MOB-039`). **No capability exists only on desktop**, and none is lost on the way up | P3, P4, P1 | E09, E05, E03, E04, E06 | **R1** responsive baseline, keyboard operability and shortcut set; **R2** tree rail and split view |
| **JTBD-17** | When a colleague is about to fill a room with 40 MB scans, I want the room's storage ceiling, its warnings and its behaviour at the limit to be something I set and can see, so nobody is ever surprised mid-upload and nothing is ever silently dropped | Administering the workspace; a room approaching its ceiling | Nobody owns it; somebody discovers the limit when an upload fails | Warnings fire once per crossing at 75%, 90% and 100% with the exact remaining allowance (BR-196). Refusal happens **at initiation**, stating size, allowance and shortfall (BR-201). At the ceiling, list, search, preview, download, share, **revoke** and export all still work (BR-204). Bytes silently dropped: **zero** (`FR-ACCT-009`), verified by test. Quota is set by the administrator per room, with an explicit default | P4, P1, P6 | E12, E10, E11 | **R1** |
| **JTBD-18** | When a colleague joins or leaves, I want to provision or remove their access in one place and be shown every room they own and every outward share they created before I confirm, so a departure never leaves a live link behind it | Joiner or leaver ticket | Ad-hoc: hope somebody remembers which rooms they owned | Every outward share created by a departing colleague is transferred or revoked before deprovisioning completes, with the count shown before commit (`FR-SHARE-031`), verified by an API test. Unintended access incidents remain **zero** (`M50`). Every step recorded in the activity log, retained 24 months (BR-195) | P4, P1 | E12, E01, E07, E11 | **R1** |
| **JTBD-19** | When somebody asks me months later who saw a confidential document, I want a per-recipient record I can read on a phone and export, so an outward share is defensible after the fact rather than a matter of memory | An internal question, a client question, or a suspected leak | Reconstruct it from sent-mail and memory, which is not a record | Activity log answers "who opened what, when" per room and per recipient; export completes as an asynchronous job with a notification and a time-limited link. The per-viewer log and the dynamic watermark land in R1.1 **together with the recipient disclosure** (`NFR-PRIV-010`), and no view event is recorded for a recipient before the notice is shown | P1, P6, P4, P5 | E11, E07, E12 | **R1** activity log and CSV export; **R1.1** per-viewer access log, watermark and disclosure |

### Job clustering, for backlog sequencing

| Cluster | Jobs | What it is | Consequence for the backlog |
| --- | --- | --- | --- |
| **The three-minute share** | JTBD-01, 02, 03, 08 | The staff sharer's core path | Must all work end to end in R1, or staff keep using a shared consumer drive folder and the tool has no reason to exist |
| **The ninety-second read** | JTBD-04, 05, 06, 15 | The external recipient's path | Must be the most polished surface in the product. A failure here pushes a colleague back to emailing attachments |
| **Do not destroy the record** | JTBD-10, 11, 12 | Safety on a touch screen | These are the requirements that make administering a document set from a phone credible to a professional |
| **Room hygiene** | JTBD-07, 09, 14 | The coordinator's work | Justifies multi-select, the destination picker and templates in R1 |
| **Field reality** | JTBD-12, 13 | Bad networks and no networks | Non-negotiable for `P6`, and the source of most R1 engineering risk |
| **Power on the way up** | JTBD-16 | Progressive enhancement | The promise that mobile-first is not a ceiling |
| **Governance** | JTBD-17, 18, 19 | The administrator's work and the after-the-fact record | The reason `E12` exists after the internal-tool rework, and the cluster that makes an outward share defensible |

---

## Device, network and context assumptions

This is the concrete baseline the whole team designs, builds and tests against. It is derived from
the mobile-platform research and is stated in full in
[Non-functional requirements](./07-non-functional-requirements.md) and the
[Mobile UX spec](./08-mobile-ux-spec.md). Reproduced here so that nobody designing for a persona has
to guess.

**Why this baseline matters more, not less, for an internal tool.** The staff fleet is company-issued
and therefore knowable and exhaustively testable. The **recipient** device is not: `P2`, `P3` and `P5`
arrive on whatever they own, on whatever network they happen to have. A defect that reproduces only
off the staff fleet is still a defect on the surface that matters most.

### Reference hardware and network

| Item | Baseline | Source / note |
| --- | --- | --- |
| **Reference device (budget and CI baseline)** | **Samsung Galaxy A24 4G**, or an equivalent from the stated set (Galaxy A16 4G, Galaxy A07 4G, Xiaomi Redmi Note 13 Pro 4G) | Chosen to emulate a 75th-percentile experience: a full quarter of real devices are worse than this [41] |
| **Reference network** | **9 Mbps down / 3 Mbps up / 100 ms RTT** | Deliberately pessimistic global-75th-percentile modelling assumption, not a measured national median [41] |
| **Why not a flagship** | Mid-tier ~$300 Android now delivers roughly the single-core performance of a 2014 iPhone and the multi-core performance of a 2015 iPhone, and in the last year the premium-to-budget gap grew more (252 points) than the low end improved (174 points) | [41]. The staff fleet is better than this; the recipient's phone frequently is not |
| **CI throttling profile** | Lighthouse default mobile preset: **150 ms RTT, 1,638.4 Kbps down / 750 Kbps up, 4x CPU**, documented as "roughly the bottom 25% of 4G connections and top 25% of 3G connections" | [43]. This is the **regression guard**, not the acceptance criterion |
| **Manual QA hardware** | Mid-tier Galaxy A54 5G, low-tier Galaxy A15 5G, with DevTools **calibrated** CPU presets rather than hard-coded multipliers (measured 2.9x mid, 9.1x low on one host) | [42] |
| **Upload reality, which governs this product** | Even on fast US networks the **median upload is only ~12-13 Mbps** (T-Mobile median 12.26 Mbps up against 259.49 Mbps down). Size chunking against an effective **1-3 Mbps uplink** | [60] |
| **Acceptance gate** | **p75 mobile field data** (RUM or CrUX): LCP (`M36`), INP (`M37`) and CLS (`M38`) all in the good band, with the combined pass rate tracked as `M39`. In July 2025 CrUX data only **48% of mobile sites passed all three** | [44][45][46]. 10 owns the metric IDs and their thresholds; this file cites them |
| **Weight ceiling** | The median mobile home page was already 2.56 MB with 697 KB of JavaScript, which **exceeds** the 3-second budget on the baseline device (1.2 MiB total / 0.62 MiB JS for a JS-heavy page). Set the initial-route budget **below** the median, not at it | [47][41] |

### Screen, touch and interaction baseline

| Item | Baseline | Source / note |
| --- | --- | --- |
| **Design width** | **360 CSS px** is the design target; **320 CSS px** is the hard floor at which no two-dimensional scrolling is permitted (`FR-MOB-031`) | WCAG 2.2 SC 1.4.10 Reflow [51] |
| **Touch target** | **48 CSS px minimum with 8 px minimum gaps** (`FR-MOB-028`). This single number satisfies iOS (44 pt default, 28 pt absolute minimum), Material (48 dp separated by 8 dp) and the WCAG 2.2 AA floor (24x24 CSS px) simultaneously. The per-row **"..." overflow button** is sized against this floor | [48][49][50][52] |
| **Size classes** | **One ladder, owned by [Product overview](./03-product-overview.md), cited here and never restated with different numbers: compact** below 600 CSS px, **medium** 600 to 839, **expanded** 840 to 1279, **large** 1280 and above. Split view appears at **expanded and above, and only when height is at least 480 CSS px**. The persistent folder tree rail appears at expanded and above. The docked details inspector appears at expanded and above | Derived from Android window size classes [53]. Height is part of the split-view condition because a landscape phone can be medium-width and short, which is exactly where a width-only rule breaks. Any other breakpoint number appearing anywhere in the set is a defect against 03 |
| **Orientation** | No orientation lock and no "rotate your device" gate | WCAG 2.2 SC 1.3.4 [52] |
| **Text resize** | Legible and fully functional at **200%** text size, including long filenames, breadcrumbs and bottom-bar labels (`FR-MOB-030`) | WCAG 2.2 SC 1.4.4 [52] |
| **Gestures** | No gesture may be the only route to an action (`FR-MOB-041`). Multipoint and path-based gestures need a single-pointer equivalent (SC 2.5.1, Level A). Dragging needs a non-dragging alternative (SC 2.5.7, AA), which is what makes drag-and-drop unshippable as the only move mechanism. Destructive actions complete on the up-event with an abort or undo path (SC 2.5.2, Level A, `FR-FLDR-012`) | [52]. This is also why the action sheet hangs off a visible button rather than off long-press alone |
| **Android system back** | Owns **both** screen edges; apps can only carve out 200 dp per edge. Horizontal row swipes started near an edge are unreliable. Every sheet, selection mode and preview must be a popable history entry (`FR-FLDR-020`) | [54][55] |
| **iOS back** | There is **no system back**. An installed iOS web app in standalone display has no browser chrome, so an in-app back affordance plus correct History API depth is mandatory | Apple HIG Gestures [56] |
| **Safe areas** | `viewport-fit=cover` plus `env(safe-area-inset-*)`. Every bottom action bar, FAB and upload progress bar must add `env(safe-area-inset-bottom)` or it lands under the home indicator. Focus must never be obscured by a sticky bar, sheet or the software keyboard (SC 2.4.11, `FR-MOB-034`) | [57][52] |

### Platform capability limits that bite, and the honest UI copy they force

| Capability | Reality | What the UI must say instead |
| --- | --- | --- |
| **Background upload** | Background Fetch is **Chrome-only**; unsupported in Safari, Firefox and Android WebView. No Background Sync on iOS. A frozen page cannot run fetch callbacks; a discarded page runs no code at all; `unload` does not fire when a tab is closed from the mobile tab switcher | Never "uploading in the background". Say **"Paused. Reopen the app to continue."** Commit the resume offset **before** each chunk. Only the three mutation kinds in BR-130 (upload, rename, delete-to-trash) may be queued at all [58][59] |
| **Offline storage** | Safari deletes all script-created storage for an origin with no user interaction in the last seven days, and eviction is **all-or-nothing** across IndexedDB, Cache API and OPFS together. Quotas differ by engine and are underreported by `estimate()` | Never "available offline" as a durability claim. Say **"Cached copy, may be cleared by your browser."** Local cache is never the only copy [58] |
| **Download destination** | iOS Safari routes downloads to a Downloads folder (default iCloud Drive, user-configurable). The page is never told the path, gets no completion callback, and cannot verify or reopen the file | Model download as fire-and-forget. Say **"Saved to your Downloads folder (Files app)."** Keep an in-app list of re-fetchable server links, not local file references |
| **OS share sheet into the app** | Manifest `share_target` is Chrome Android 76+ and Opera only. **Not** Safari, **not** Firefox, **not** Android WebView | "Share a photo straight into a folder" is an **Android-only** capability. iOS users go through the in-app picker. Never describe it platform-agnostically |
| **File system pickers** | `showOpenFilePicker`, `showSaveFilePicker`, `showDirectoryPicker` are absent in Safari and Firefox on every version. OPFS is available broadly and is the resume scratch space | No "choose where to save" on iOS. Treat the user's real filesystem as write-once via download |
| **Folder upload** | `webkitdirectory` only became functional on iOS Safari **18.4** and Chrome for Android **132**; Firefox Android 141/142; unsupported in Android WebView | Folder-tree upload is multi-file selection with path reconstruction, or a zip the server expands, or desktop-only with an **explicit** mobile fallback message. `P4`'s job depends on this being honest |
| **Photo pickers** | Permissionless and partial by design on both platforms (Android 13 photo picker, Android 14 `READ_MEDIA_VISUAL_USER_SELECTED`, iOS Photos picker). Library enumeration is impossible | "Sync my camera roll" is not expressible. Batch selection with a visible count, and re-prompting, never background scanning |
| **Push on iOS** | Web push exists from iOS 16.4 but **only for Home Screen web apps**, requires a direct user gesture to request permission, and iOS 26 removed the installability gate while keeping the Home Screen requirement. There is no `beforeinstallprompt` on iOS | `P1`'s "a recipient opened your document" push works on Android and on installed iOS. Installation must be **taught in-product** on iOS, and because the staff fleet is company-issued this is a solvable onboarding problem rather than a permanent limit |
| **Biometric re-unlock** | WebAuthn and passkeys are cross-platform (Chrome 67, Chrome Android 70, Safari 13, Firefox 60), but WebAuthn is an authentication ceremony, **not a screen lock**. There is no web API that forces a biometric check on foreground return | "Require biometrics to reopen" is a **server-side session policy**: short access-credential lifetime (5 minutes, BR-023) plus a step-up WebAuthn assertion on resume. Describe it as a re-authentication prompt, never an OS-level lock (`FR-AUTH-014`) |
| **Memory on iOS** | A published measurement crashed mobile Safari at roughly 100 MB of allocated JS array data on an iPhone SE 3rd generation and roughly 200 MB on an 8th-generation iPad, with **no catchable JavaScript exception** | Never read a whole file into memory, never build a `data:` URL from a file, always stream via `File.slice()`. Render PDFs one page at a time, server-side above 25 MB (`FR-VIEW-016`); a client-side engine that parses the whole document is a crash generator [58] |

### Platform and context mix

| Item | Figure | Implication |
| --- | --- | --- |
| Global platform share, July 2026 | Mobile 52.57%, desktop 45.93%, tablet 1.5% | Mobile leads globally [1] |
| **United States**, July 2026 | **Desktop 54.0%, mobile 43.85%, tablet 2.15%** | **The premise that "the vast majority of users will access this on a phone" is not supported by aggregate US traffic data.** Mobile-first is a defensible design bet on external-recipient behaviour and on staff who work away from a desk. It must never be justified as a traffic-share fact [2] |
| **Europe**, July 2026 | Desktop 51.79%, mobile 46.15%, tablet 2.06% | Same caveat [3] |
| US mobile OS | iOS 58.35%, Android 41.62% (Statcounter, July 2026) | `Assumption:` the company fleet skews iPhone, and being company-issued it is enumerable and testable |
| Global mobile OS | Android 69.14%, iOS 30.79% (Statcounter, July 2026) | External recipients do not follow the fleet. Both platforms are first-class from R1; the recipient path is mobile web with no install requirement |
| Remote and non-desk work | 26% of US paid workdays performed remotely as of February 2026; ~1.4 WFH days/week across 35 countries, ~1.7 in English-speaking countries; Gallup's remote-capable split 52% hybrid / 26% fully remote / 22% on-site | "At their desk" is a coin flip for `P3` and `P4` [38] |
| Deskless work | ~80% of the global workforce, about 2.7 billion people, historically served by roughly 1% of enterprise software spend | The structural reason the prior art is desktop-shaped: it was all built for the other 20%. See [Prior art & UX benchmark](./01-prior-art-and-ux-benchmark.md) [19] |
| Work hours | 40% of people online at 6am are already triaging email; nearly 30% are back online by 10pm; 50+ messages outside core hours; meetings starting after 8pm up 16% YoY; 30% of meetings span time zones | `P1`'s 7-8am and 8-10pm peaks and `P5`'s 06:20 and 21:48 sessions are the norm, not the exception [18] |
| Field hardware condition | 93% of trade contractors use smartphones on site, 65% use tablets; more than 80% of field workers have damaged devices, three in four with cracked screens; 44% report device failures delaying work by over an hour | `P6` is operating a cracked screen with one glove on. High contrast, large targets, one-handed reach, tolerance for a dead screen region [20][21] |
| Mobile document actions | Roughly 50/50 desktop-to-mobile user ratio in secondary e-signature reporting, with a vendor case citing mobile completion improving up to 20%. Directional only; no official share is published | The closest measured analogue to "completing a document action on a phone" says it is normal [39] |

---

## Persona-to-epic coverage matrix

**P** = primary driver, the persona whose needs set the epic's requirements. **S** = secondary, has
real requirements the epic must satisfy but does not set the shape. **-** = not relevant to this
persona.

| Persona | E01 Access & Identity | E02 Rooms & Home | E03 Folders & Nav | E04 File Ops | E05 View & Preview | E06 Search | E07 Sharing & Access | E08 Conflict & Integrity | E09 Mobile UX | E10 Perf, Offline & Scale | E11 Trust, Audit & Notify | E12 Account, Storage & Governance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **P1** Marcy, engagement lead (staff, sharer/owner) | **P** | **P** | **P** | **P** | S | S | **P** | S | **P** | S | **P** | **P** |
| **P2** Dev, external recipient, no account | **P** | S | S | S | **P** | S | **P** | - | **P** | **P** | S | S |
| **P3** Tomás, external adviser (recipient, desktop-capable) | **P** | S | S | S | **P** | **P** | S | S | S | S | S | S |
| **P4** Ashley, coordinator **and workspace administrator** (staff) | S | **P** | **P** | **P** | S | **P** | S | **P** | **P** | S | S | **P** |
| **P5** Ingrid, external decision-maker (recipient) | **P** | S | - | - | **P** | S | **P** | - | **P** | **P** | S | S |
| **P6** Ray, field staff (staff, sharer, field conditions) | S | **P** | S | **P** | **P** | S | **P** | S | **P** | **P** | **P** | S |

### Coverage audit

| Check | Result |
| --- | --- |
| Every epic has at least one **primary** persona | Yes. E01 (P1, P2, P3, P5), E02 (P1, P4, P6), E03 (P1, P4), E04 (P1, P4, P6), E05 (P2, P3, P5, P6), E06 (P3, P4), E07 (P1, P2, P5, P6), E08 (P4), E09 (P1, P2, P4, P5, P6), E10 (P2, P5, P6), E11 (P1, P6), E12 (P1, P4) |
| Every persona is primary on at least one epic | Yes. P1 on eight, P2 on five, P3 on three, P4 on seven, P5 on five, P6 on seven |
| Any epic with a single primary persona (concentration risk) | **E08 Conflict & Integrity** (P4 only). It is load-bearing for P1, P3 and P6 as secondary, so it is not at risk of being cut, but its stories should be reviewed with a second persona before sprint planning. **E06 Search** is no longer single-primary: P4 finds one file out of sixty from a train, which is the same requirement from the staff side |
| Any epic driven only by recipients | **E05** and **E10** are recipient-primary, and **E07** is co-primary between staff sharers and recipients. This is deliberate: the recipient path is the surface a failure pushes people off the tool entirely, straight back to emailed attachments |
| Personas with no governance relationship | **None, and this is a change.** In the previous version P2, P3 and P5 were marked `-` on E12, because that epic was then an account-and-commerce surface a recipient never touched. They now carry a real E12 requirement: a room at or over its administrator-set quota must still serve listing, preview, download, share and **revoke** (BR-204), and no quota, retention or account-administration state may ever surface an interstitial on the recipient path |
| **E12 after the internal-tool rework** | E12 is **Account, Storage & Governance**. Its primary personas are **P4** (the administrator: quota per room, retention, joiner and leaver provisioning, export, account deletion with a retention window, and the administrator role itself) and **P1** (profile and preferences, used-storage figure and per-room breakdown, and the subject of a leaver flow when he moves teams). P6 is secondary because he reaches the storage ceiling first. Every former commerce driver of this epic is deleted, not deferred |
| Out-of-scope user types represented | `X8` (desktop-primary power users) is represented **as an enhancement requirement** through P3's and P4's marks on E09 and E05, never as a baseline driver. `X1` (external parties as content owners) is represented as a hard boundary on E07's role model: an anonymous visitor is always Viewer |
| Jobs coverage | All nineteen jobs map to at least two epics, and every epic E01-E12 appears in at least one job's Epics column |

---

## Sources

Entries 1-5 and 15-21 are behavioural and context evidence for the personas. Entries 38-39 are
working-context evidence. Entries 41-60 are the mobile platform, performance and accessibility
research underpinning the device baseline. Retrieved 2026-08-21 unless noted. Prior-art and
comparable-product sources are listed separately in
[Prior art & UX benchmark](./01-prior-art-and-ux-benchmark.md).

Numbering is **not** compacted: gaps are the withdrawn entries listed in the tombstone above, so that
every surviving citation keeps the number it had.

1. Statcounter Global Stats, Desktop vs Mobile vs Tablet, Worldwide (July 2026). https://gs.statcounter.com/platform-market-share/desktop-mobile-tablet
2. Statcounter Global Stats, Desktop vs Mobile vs Tablet, United States (July 2026). https://gs.statcounter.com/platform-market-share/desktop-mobile-tablet/united-states-of-america
3. Statcounter Global Stats, Desktop vs Mobile vs Tablet, Europe (July 2026). https://gs.statcounter.com/platform-market-share/desktop-mobile-tablet/europe
4. NAR, REALTORS Embrace AI, Digital Tools to Enhance Client Service (2025 Technology Survey press release). *(Cited only for the mobile working-time and client-communication figures, as a field-profession analogue for `P6`.)* https://www.nar.realtor/press-releases/realtors-embrace-ai-digital-tools-to-enhance-client-service-nar-survey-finds
5. NAR, 2025 REALTORS Technology Survey, full report. https://cms.nar.realtor/sites/default/files/2025-09/2025-realtors-technology-survey-report-09-18-2025.pdf
15. Papermark, Pitch Deck Metrics Report 2024-2025 (3,000 decks, 8M+ data points, 172,087 minutes). *(Cited only as the closest hard measurement of first-pass document-review length on a phone.)* https://www.papermark.com/pitch-deck-metrics
16. DocSend, Startup Index / Pitch Deck Metrics. *(Same use as [15].)* https://www.docsend.com/pitch-deck-metrics/
17. Adobe, Reimagining Reading infographic. **Note: 2020 data, the oldest figure used in this document, and the only hard measurement of mobile document abandonment available.** https://blog.adobe.com/en/fpost/2020/reimagining-reading-infographic
18. Microsoft WorkLab, Breaking Down the Infinite Workday, 2025 Work Trend Index special report. https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday
19. Emergence Capital, Deskless Workforce conviction area. https://www.emcap.com/conviction-areas/deskless-workforce
20. MindForge, Smartphone App Usage Among Construction Workers. https://www.mindforgeapp.com/blog-posts/smartphone-app-usage-among-construction-workers-adoption-preferences-and-barriers
21. On-Site Magazine, Construction environments putting phones, and project timelines, at risk. https://www.on-sitemag.com/construction/construction-environments-putting-phones-and-project-timelines-at-risk/1003986375/
38. FlexOS, Hybrid and Remote Work Statistics and Trends 2026 *(aggregator citing Stanford WFH Research / SWAA, February 2026, and Gallup)*. https://www.flexos.work/learn/hybrid-remote-work-statistics-trends-2026
39. Docusign, Mobile document signing product page *(directional; no official mobile share published)*. https://www.docusign.com/products/mobile
41. Alex Russell, The Performance Inequality Gap, 2026 (Galaxy A24 4G baseline, 9/3 Mbps at 100 ms, JS byte budgets). https://infrequently.org/2025/11/performance-inequality-gap-2026/
42. CSS Wizardry, Low- and Mid-Tier Mobile for the Real World (2025). https://csswizardry.com/2025/08/low-and-mid-tier-mobile-for-the-real-world-2025/
43. Lighthouse throttling documentation (Slow 4G preset: 150 ms RTT, 1,638.4 Kbps down / 750 Kbps up, 4x CPU). https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md
44. Web Vitals, thresholds and 75th-percentile assessment, web.dev. https://web.dev/articles/vitals
45. Largest Contentful Paint (LCP), web.dev. https://web.dev/articles/lcp
46. Interaction to Next Paint (INP), web.dev. https://web.dev/articles/inp
47. Web Almanac 2025, Page Weight chapter (median mobile page 2.56 MB, 697 KB JavaScript). https://almanac.httparchive.org/en/2025/page-weight
48. Apple Human Interface Guidelines, Accessibility (44x44 pt default, 28x28 pt minimum control size). https://developer.apple.com/design/human-interface-guidelines/accessibility
49. Apple Human Interface Guidelines, Buttons. https://developer.apple.com/design/human-interface-guidelines/buttons
50. Android Accessibility Help, Touch target size (48 dp minimum, about 9 mm physical). https://support.google.com/accessibility/android/answer/7101858?hl=en
51. W3C, Understanding SC 2.5.8 Target Size (Minimum). https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
52. W3C, Web Content Accessibility Guidelines (WCAG) 2.2 (Recommendation, 5 October 2023). https://www.w3.org/TR/WCAG22/
53. Android, Window size classes and breakpoints. *(The source of the ladder; the authoritative ladder for this product is in [03](./03-product-overview.md).)* https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes
54. Android, Predictive back gesture. https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture
55. Android, Ensure compatibility with gesture navigation (200 dp per-edge exclusion cap). https://developer.android.com/develop/ui/views/touch-and-input/gestures/gesturenav
56. Apple Human Interface Guidelines, Gestures. https://developer.apple.com/design/human-interface-guidelines/gestures
57. MDN, CSS `env()` (safe-area and keyboard insets). https://developer.mozilla.org/en-US/docs/Web/CSS/env
58. MDN, Storage quotas and eviction criteria; WebKit, Updates to Storage Policy; Chrome for Developers, Page Lifecycle API; Jeff Johnson (lapcatsoftware), Mobile Safari web pages are severely limited by memory (22 Jan 2026). https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria · https://webkit.org/blog/14403/updates-to-storage-policy/ · https://developer.chrome.com/docs/web-platform/page-lifecycle-api · https://lapcatsoftware.com/articles/2026/1/7.html
59. MDN, Background Fetch API (Chrome 74+ only; unsupported in Safari, Firefox and Android WebView). https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API
60. Ookla H2 2025 Connectivity Report, as reported by RCR Wireless (US medians: T-Mobile 259.49 Mbps down, 12.26 Mbps up, 46 ms latency). https://www.rcrwireless.com/20260203/5g/ookla
