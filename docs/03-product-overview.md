# Product Requirements Document — Data Room (Mobile-First)

## Purpose

Data Room is an **internal tool**. The company builds it for its own staff, to hold confidential
documents and show them, under control, to external parties who are reached through a share link
or an emailed invite. There is no customer, no price and no go-to-market: this document set is an
engineering and product specification, and the only audience for it is the team that builds and
runs the tool.

This document is the single agreed definition of what Data Room is, who uses it, what ships in
which release, and how we will know it worked. It is written to be read first and read by three
different people: the internal sponsor who needs the decision stated plainly, a designer who needs
the interaction mandate and the user roles, and a tech lead who needs the scope boundaries, the
traceability of the original brief, and the gates a story must pass before it is called done.
Everything below is either sourced, or explicitly labelled as an assumption or an estimate.

## Related documents

Context and discovery

- [Documentation index and reading order](./README.md)
- [Prior art and UX benchmark](./01-prior-art-and-ux-benchmark.md)
- [Personas and jobs-to-be-done](./02-personas-and-jtbd.md)

Requirements

- [Epics](./04-epics.md)
- [Functional requirements](./05-functional-requirements.md)
- [Business rules and permissions](./06-business-rules-and-permissions.md)
- [Non-functional requirements](./07-non-functional-requirements.md)
- [Mobile UX specification](./08-mobile-ux-spec.md)
- [Domain model and glossary](./09-domain-model-and-glossary.md)

Measurement and delivery

- [Success metrics and analytics](./10-success-metrics-and-analytics.md)
- [Master backlog](./11-master-backlog.md)
- [Risks and open questions](./12-risks-and-open-questions.md)

Story backlog, one file per epic

- [E01 Access & Identity](./backlog/epic-01-access-and-identity.md)
- [E02 Data Rooms & Workspace Home](./backlog/epic-02-data-rooms-and-workspace-home.md)
- [E03 Folder Hierarchy & Navigation](./backlog/epic-03-folder-hierarchy-and-navigation.md)
- [E04 File Operations](./backlog/epic-04-file-operations.md)
- [E05 Viewing, Preview & File Details](./backlog/epic-05-viewing-preview-and-file-details.md)
- [E06 Search & Discovery](./backlog/epic-06-search-and-discovery.md)
- [E07 Sharing & Access Control](./backlog/epic-07-sharing-and-access-control.md)
- [E08 Conflict Resolution & Data Integrity](./backlog/epic-08-conflict-resolution-and-data-integrity.md)
- [E09 Mobile UX Foundations](./backlog/epic-09-mobile-ux-foundations.md)
- [E10 Performance, Offline & Scale](./backlog/epic-10-performance-offline-and-scale.md)
- [E11 Trust, Audit & Notifications](./backlog/epic-11-trust-audit-and-notifications.md)
- [E12 Account, Storage & Governance](./backlog/epic-12-account-storage-and-governance.md)

## Document control

| Field | Value |
| --- | --- |
| Document | 03-product-overview.md, the core PRD |
| Version | 2.0 |
| Date | 2026-08-21 |
| Author | Lead BA / PM |
| Status | Draft for review |
| Nature | Internal tool, built by the company for its own staff. External parties appear only as recipients of a share |
| Reviewers | Engineering lead, Design lead, QA lead, Security and legal reviewer, Internal tooling sponsor |
| Supersedes | The original stakeholder brief, which is now traced line by line in [Requirements traceability overview](#requirements-traceability-overview) |
| Change control | Any change to scope, to a release tag, or to the mobile-first mandate requires a new minor version of this file and a note in [12-risks-and-open-questions.md](./12-risks-and-open-questions.md) |

### How to use this document set

The definition is split across thirteen files plus twelve backlog files, deliberately, so that
each audience reads only what it needs and so that two authors can work without colliding. Read
the index in [README.md](./README.md) for the per-role reading order. The split follows one
rule: this file owns decisions, the numbered siblings own detail, and the backlog owns
executable stories.

| You need | Go to | Not here, because |
| --- | --- | --- |
| The decision, the scope, the release plan | this file | detail would bury the decision |
| What the system shall do, testably | [05-functional-requirements.md](./05-functional-requirements.md) | this file names domains, not individual FRs |
| Who may do what, and what happens on a name collision | [06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md) | rules are cross-epic and change independently of scope |
| Budgets, thresholds, and how they are measured | [07-non-functional-requirements.md](./07-non-functional-requirements.md) | this file states the gate, not the instrumentation |
| Gestures, sheets, wireframes, per-screen mechanics | [08-mobile-ux-spec.md](./08-mobile-ux-spec.md) | this file states the mandate, the spec states the mechanics |
| The breakpoints themselves | this file, [Responsive size-class ladder](#responsive-size-class-ladder) | one ladder, defined once; 08 and 07 cite the class names rather than restating pixel values |
| A story a developer can pick up tomorrow | [backlog/](./backlog/) | stories churn faster than the PRD |

Identifier schemes are stable and must never be renumbered or extended with new prefixes.

| Prefix | Meaning | Authority |
| --- | --- | --- |
| `E01`–`E12` | Epic | [04-epics.md](./04-epics.md) |
| `US-E<nn>-<mm>` | User story inside an epic | [backlog/](./backlog/) |
| `FR-<DOMAIN>-<nnn>` | Functional requirement. Domains: AUTH, ROOM, FLDR, FILE, VIEW, SRCH, SHARE, CONF, MOB, PERF, AUDIT, ACCT | [05-functional-requirements.md](./05-functional-requirements.md) |
| `NFR-<CAT>-<nnn>` | Non-functional requirement. Categories: PERF, MOB, SEC, PRIV, AVAIL, SCALE, A11Y, I18N, OBS, COMPAT, MAINT, COMPL | [07-non-functional-requirements.md](./07-non-functional-requirements.md) |
| `BR-<nnn>` | Business rule | [06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md) |
| `P1`–`P6` | Persona. This namespace is reserved for personas and is never reused for anything else | [02-personas-and-jtbd.md](./02-personas-and-jtbd.md) |
| `M<nn>` | Metric; analytics events are snake_case | [10-success-metrics-and-analytics.md](./10-success-metrics-and-analytics.md) |
| `A<nn>`, `R<nn>`, `OQ<nn>` | Assumption, risk, open question | this file (A) and [12-risks-and-open-questions.md](./12-risks-and-open-questions.md) (R, OQ) |

Priority language throughout is MoSCoW (Must, Should, Could, Won't-for-now) paired with a
release tag of R1 (MVP), R1.1 (trust hardening), R2 (fast-follow) or R3 (later). Estimates are
Fibonacci story points; 13 points means the story must be split before sprint planning.

### Single source of truth per subject

The set is large enough that the same number can be restated in five files and drift in four of
them. Each subject therefore has exactly one owning file. Every other file **cites** by ID rather
than restating, and where a number must appear for readability it is written with the owning ID in
parentheses, for example "60 seconds (BR-110)".

| Subject | Owning file | Everyone else |
| --- | --- | --- |
| Requirement `Release` tag and `Priority` | [05-functional-requirements.md](./05-functional-requirements.md) | cites. The scope tables and release plan in *this* file are derived from 05, not authored independently |
| Thresholds, limits, retention windows, timing guarantees, permission rules | [06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md) | cites `BR-<nnn>` |
| Metric IDs and analytics event names | [10-success-metrics-and-analytics.md](./10-success-metrics-and-analytics.md) | cites `M<nn>` and the snake_case event name |
| The responsive size-class ladder | **this file**, [Responsive size-class ladder](#responsive-size-class-ladder) | cites the class names `compact`, `medium`, `expanded`, `large`. No other file defines a breakpoint |
| Entity field names and error codes | [09-domain-model-and-glossary.md](./09-domain-model-and-glossary.md) | cites |

## Problem statement

A data room is a folder of confidential documents that our staff show to an external party, under
control, and take back when the process ends. Our people do this today with a shared cloud-storage
folder, which has no scoped access, no watermark, no per-recipient access log and no instant
per-file revocation. The tools that do have those controls all share one defect, and it is the
defect that decides this build.

**Every comparable tool treats the phone as a screen, never as a workplace.** The evidence is
primary and specific, not inferred. Full detail, and the failure modes we must not repeat, are in
[01-prior-art-and-ux-benchmark.md](./01-prior-art-and-ux-benchmark.md).

- Google Drive's own Android help page states, of the only mechanism Drive has for restricting a
  subfolder inside a shared parent: "You cannot turn the limited access setting on or off for
  folders from your mobile device; you must do this from the web"
  ([support.google.com/drive/answer/14254362](https://support.google.com/drive/answer/14254362?hl=en&co=GENIE.Platform%3DAndroid)).
  Since 22 September 2025 parent-folder permissions always cascade to contents, so the
  limited-access subfolder is the only workaround, and it cannot be created from a phone
  ([Google Workspace Updates](https://workspaceupdates.googleblog.com/2025/09/upcoming-change-to-drive-sharing.html)).
- Box Support states that "enabling and disabling watermarking on a folder is supported only on
  the Box Web app"
  ([support.box.com](https://support.box.com/hc/en-us/articles/360044195253-Watermarking-Files)).
  Watermarking is the single most data-room-defining control Box has.
- Dropbox's own help page states: "Currently, DocSend does not have a dedicated mobile app", and
  recommends adding a home-screen shortcut instead
  ([help.dropbox.com](https://help.dropbox.com/account-access/dropbox-docsend-on-mobile)).
  DocSend exists so that a busy reader opens a link on whatever device they are holding.
- The Firmex iOS app has been delisted: Apple's lookup API returns zero results for App Store ID
  1156584536 ([itunes.apple.com/lookup?id=1156584536](https://itunes.apple.com/lookup?id=1156584536)),
  while Capterra still advertises the product as "Web, Android, iPhone/iPad".
- The iDeals iOS app was last released 4 November 2024, a logo and colour update, and carries
  3.67/5 from three ratings
  ([App Store](https://apps.apple.com/us/app/ideals-virtual-data-room/id747980888)). Its G2
  reviewers report that folders cannot be uploaded and permissions cannot be managed from the
  app, which are the two operations that define an owner's job.
- Ansarada, Papermark, Peony, DealRoom, SecureDocs and Orangedox have no native app at all.
  Papermark's own G2 reviewers say the mobile viewing experience "could be improved" and flag it
  as "a major concern since most participants open documents from their phones"
  ([G2](https://www.g2.com/products/papermark-virtual-data-room/reviews)).

Read together, the pattern is unambiguous. Recipients can read on a phone, badly. The staff who
administer a room cannot administer it from a phone at all. That is why our own people default to
a shared cloud-storage folder: they are not choosing it because it is secure, they are choosing it
because it works on the device in their hand.

**And the recipients are structurally mobile.** External parties open what we send them on a
phone, in a gap between other work, and their first pass is phone-length: Papermark's analysis of
3,000 documents and over 8 million data points puts a complete review at 3.2 minutes, 23 seconds
on page one and about 15 seconds per page after
([papermark.com/pitch-deck-metrics](https://www.papermark.com/pitch-deck-metrics)). Adobe's survey
of over 2,000 respondents found 45% had stopped reading, or never started, a document on mobile.
A recipient does not complain when the document is unreadable on their phone; they stop reading,
and we never learn.

**The honest counterweight, stated up front.** Aggregate traffic data does not support a claim
that most business users are on phones. Statcounter for July 2026 puts the United States at
desktop 54.0%, mobile 43.85%, tablet 2.15%, and Europe at desktop 51.79%, mobile 46.15%
([Statcounter US](https://gs.statcounter.com/platform-market-share/desktop-mobile-tablet/united-states-of-america)).
Nobody publishes the mobile share of data-room sessions, and the one circulating figure ("under
15%") comes from a comparison blog with no methodology and measures supply rather than demand,
because nobody has shipped a usable phone product. Mobile-first is therefore a deliberate
engineering decision about recipient behaviour and about staff working away from a desk. It is not
presented anywhere in this document set as a usage-share fact. We instrument device share from day
one so that we own the number, rather than arguing about it
(see [10-success-metrics-and-analytics.md](./10-success-metrics-and-analytics.md), M20).

The problem in one paragraph: a colleague running eight live processes from a car cannot create a
room, file a photographed statement into the right folder, share it read-only with a named external
recipient, and revoke a different recipient, from the device they actually have in their hand,
without falling back to a tool that leaks.

## Vision

Data Room is the internal secure document workspace that a member of staff can run entirely from a
phone, and that an external recipient can read on a phone without an account, an app or an
argument. The desktop experience is a genuine step up in power for the hours you spend at a desk,
not the place where the real product lives.

**The promise we hold ourselves to:** create a room, fill it, share it read-only and revoke it, in
under three minutes, one-handed, on a bad cellular connection, without ever wondering who can see
what.

## Strategic pillars

Five pillars. Each states what it means, what it forbids, and where it is enforced. A story that
violates a pillar is rejected at review, not renegotiated in sprint.

### Pillar 1: The phone is the administration surface, not the viewer

**Means.** Every owner-side act is first-class on a 360 px screen: create and nest folders,
rename, move, delete with a stated blast radius, upload, invite by email, create a public link,
change a role, set read-only, revoke. Feature parity is defined phone-outward, so a capability
that exists on desktop but not at compact width is an incomplete feature, not a desktop feature.

**Forbids.** Any "manage this on the web" message. Any administration screen that only renders
above the compact size class. Any permission or share control whose only entry point is a hover, a
right-click or a drag. Shipping a viewer-only mobile surface, which is the exact failure mode every
comparable tool has already shipped.

**Enforced by.** The touch-equivalence gate (MF-3 below), E07, E09, and the acceptance criteria
in every backlog file.

### Pillar 2: Nothing consequential happens by accident

**Means.** Every destructive or access-changing action states its consequence in numbers before
it commits, commits on the up-event, and is reversible for a stated window. Deleting a folder
names the count of subfolders and files it will destroy. Moving a batch reports partial failure
item by item. Changing a share says exactly who gains and loses access. Every folder and file
carries a visible "who can see this right now" indicator.

**Forbids.** Confirmation dialogs used as the only safety net. Destructive actions fired on
touchstart or on a swipe with no undo. Silent overwrite on a name collision. Silent folder moves,
the failure prior-art reviewers report as "you may move folders unintentionally and you wouldn't
notice since it doesn't ask for changes confirmation". Optimistic UI that lies about a mutation
that has not been accepted by the server.

**Enforced by.** WCAG 2.2 SC 2.5.2 Pointer Cancellation, the business rules in
[06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md), E08 and E09.

### Pillar 3: The phone is a source of documents, not only a screen

**Means.** Camera capture, photo library selection, the device files picker and (where the
platform allows it) the OS share sheet all land a document in a chosen nested folder, with
duplicate-name resolution handled at capture time. Uploads are chunked and resumable, survive
the app being backgrounded, and tell the truth about their state.

**Forbids.** Treating upload as a desktop-only path. Any storage rule that discourages the exact
behaviour the product exists to enable: a quota is an administrator's capacity decision (BR-196 to
BR-205), never a tax on capture. Claiming background upload on platforms that do not provide it.
Buffering a whole file in memory, which crashes mobile Safari at roughly 100 MB on an
iPhone SE 3rd generation ([lapcatsoftware.com, 22 January 2026](https://lapcatsoftware.com/articles/2026/1/7.html)).

**Enforced by.** E04, E10, and NFR-MOB.

### Pillar 4: The recipient path has no gate and no gap

**Means.** A shared link opens into a readable document within two taps, with no signup, no app
install and no interstitial, on either mobile platform. The first page paints fast on a
mid-range Android over a poor 4G link. Reading resumes at the exact page and scroll position
after an interruption. Read-only means read-only, enforced at the API, not by hiding a button.

**Forbids.** Account creation as a precondition of a first read. A download prompt where a
preview is expected. An iOS-only or Android-only recipient path; Statcounter puts US mobile OS
share at iOS 58.35% against Android 41.62%, and globally the split inverts to Android 69.14%.
Any preview that fetches an entire large file into the tab.

**Enforced by.** E01 (guest access), E05 (viewer), E07 (link semantics), E10 (budgets).

### Pillar 5: Honest capability

**Means.** Every capability claim is written per surface: browser tab, installed Android,
installed iOS. Where the platform does not grant something, the UI says so in plain words and
offers the real alternative. The same honesty applies inward: when storage, retention or a limit is
set by an administrator, the screen names the administrator-set figure and the default it came
from rather than showing an unexplained number.

**Forbids.** "Uploading in the background" on iOS, where Background Fetch does not exist. "Saved
to your device" with an implied path, where the page is never told where an iOS download landed.
"Available offline" presented as durable storage, when WebKit deletes script-created storage for
an origin with no user interaction in the last seven days
([webkit.org/blog/14403](https://webkit.org/blog/14403/updates-to-storage-policy/)). Any limit
presented as a law of nature when it is in fact a configuration value.

**Enforced by.** E10, E12, and the copy rules in [08-mobile-ux-spec.md](./08-mobile-ux-spec.md).

## Mobile-first mandate

This section is quotable and binding. It is the clause a reviewer cites when rejecting work.

### The rules

| ID | Rule | How it is checked |
| --- | --- | --- |
| MF-1 | **Design order.** The first artefact for any screen is a 360 x 640 CSS px composition, which is the `compact` size class. Tablet and desktop compositions may not be produced before it, and may not introduce a capability the compact composition lacks. | Design review rejects a Figma page whose first frame is wider than the top of `compact`. |
| MF-2 | **Specification order.** Every functional requirement and every acceptance criterion states the `compact` behaviour first, then the `medium`, `expanded` and `large` enhancement, using the class names in the [responsive size-class ladder](#responsive-size-class-ladder) and never a raw pixel figure of its own. A requirement written mouse-first is returned as incomplete. | PRD and backlog review; QA rejects a story whose criteria cannot be executed on a phone alone. |
| MF-3 | **Touch-equivalence gate.** No desktop-only interaction primitive ships without its named, specified, implemented mobile equivalent in the same release. The mapping table below is normative. Removing a primitive is not an option; nor is deferring its touch equivalent to a later release than the primitive itself. | Definition of Done, clause 9. Enforced per story. |
| MF-4 | **No gesture is a mechanism.** Every action reachable by long-press, swipe or pinch is also reachable by a single visible tap target. Dragging is never the only way to move, resize or reorder. | Automated a11y suite plus manual pass against WCAG 2.2 SC 2.5.1, 2.5.2, 2.5.7. |
| MF-5 | **Budget gate.** CI fails a pull request that pushes an initial route over its byte or blocking budget on the CI throttling profile. Release requires field p75 mobile Core Web Vitals inside the good band on every key route. | See [07-non-functional-requirements.md](./07-non-functional-requirements.md), NFR-PERF. |
| MF-6 | **One-handed verification.** Every story is verified on the reference device, held in one hand, thumb only, standing up, with the device's largest supported system text size, in both portrait and landscape. | Definition of Done, clause 8. |
| MF-7 | **Degraded-network verification.** Every story is verified on the reference network profile and once with the network disabled mid-action, and must produce an honest state rather than a spinner or a lie. | Definition of Done, clause 7. |
| MF-8 | **Reflow floor.** No horizontal scrolling of the page body at 320 CSS px width, and no loss of function at 200% text size. Wide content scrolls inside its own container. | WCAG 2.2 SC 1.4.10 and 1.4.4 checks in CI and manual QA. |
| MF-9 | **Honest capability copy.** Any string describing upload, download, offline availability or notifications must be reviewed against the platform capability matrix in [07-non-functional-requirements.md](./07-non-functional-requirements.md) before merge. | Copy review; blocked strings list. |

### Normative touch-equivalence mapping

Every desktop primitive named in the stakeholder brief, with its mobile-native replacement. The
mechanics live in [08-mobile-ux-spec.md](./08-mobile-ux-spec.md); this table fixes the decision.

One decision governs two of these rows and is stated once here, because getting it wrong is the
worst mobile-first defect available to us (**resolved by D01**, closing OQ89):

> **Long-press enters multi-select mode and selects the pressed row. Long-press never opens the
> action sheet.** The action sheet opens from an explicit, always-visible overflow affordance: a
> "..." button on every row, at least 48 x 48 CSS px, on the row's trailing edge. This matches iOS
> Files, Google Drive and Dropbox, so the gesture means what a user's other apps have already
> taught them; and a discoverable button satisfies WCAG 2.2 SC 2.5.1 on its own, with no separate
> fallback to specify, test or forget. `FR-MOB-001` is the overflow button opening the sheet;
> `FR-FILE-035` keeps long-press bound to selection.

| Desktop primitive (brief) | Why it is hostile to touch | Mobile-native equivalent (baseline) | Progressive enhancement | Epic |
| --- | --- | --- | --- | --- |
| Files tree view | Indentation inside 320 CSS px breaks SC 1.4.10 Reflow; expand twisties fall under the 24 x 24 CSS px floor of SC 2.5.8 and compete with the row's own navigate target | Breadcrumb chip rail plus drill-down list; a "Jump to" sheet listing the ancestor chain; a flat "Folder map" sheet listing descendant folders with depth and item counts; search-first navigation | Persistent tree in a navigation rail or drawer at `expanded` and above (FR-FLDR-022) | E03 |
| Split view between two locations | Two panes cannot satisfy Reflow at 360 px; a landscape phone is `medium` width but under the 480 px height floor, which Android explicitly warns makes two-pane layouts impractical | Staging tray: enter selection mode, choose "Move to" or "Copy to", pick the destination in one sheet with in-sheet drill-down; a persistent "n items ready to move" tray that survives navigation, then "Paste here" | True two-pane split at `expanded` and above **and** height >= 480 CSS px only (FR-VIEW-029) | E04 (tray), E05 (split) |
| Right-click context menu | No secondary click exists on touch | An always-visible per-row overflow button ("...", >= 48 x 48 CSS px, trailing edge of the row) opens the action sheet. Long-press does **not** open it; long-press enters multi-select. Apple's HIG requires that context-menu items "always" also exist in the main interface, and here the main interface is the only way in | `contextmenu` event and Shift+F10 bound to the same command set as the overflow button | E09 |
| Toolbar for quick actions | Dense, hover-revealed, outside the thumb zone | Bottom action bar with three to five labelled primary actions plus an overflow; replaced by a count-titled contextual action bar in selection mode; grouped secondary commands go in a sectioned modal bottom sheet, never a scrolling action sheet | Full horizontal toolbar with icon plus label and visible shortcut hints at `expanded` and above | E09 |
| Keyboard navigation | Not hostile, simply absent by default on a phone. WCAG 2.1.1 is Level A, so it is mandatory anyway | Kept in full. Mobile counterparts: roving-tabindex grid semantics on every list, a type-ahead search box in place of type-to-jump, polite live regions for every status message, Label in Name on every icon-only control | Visible focus ring, the full shortcut set of FR-MOB-039 (R1, including move and toggle view), Shift+click ranges, marquee select | E09 |
| Hover preview pane with file information | There is no hover on touch, and nothing may be gated behind it | Tap a row to open a full-screen viewer as its own history entry; tap the info affordance for a details bottom sheet at the medium detent, so the list stays partly visible | The same details component docked as a right-hand inspector pane at `expanded` and above (FR-VIEW-032) | E05 |
| Drag and drop to move or copy | Finger touch does not fire `DragEvent` on Chrome Android, Firefox Android or Samsung Internet, and SC 2.5.7 forbids drag-only functionality | Select, then "Move to" or "Copy to" with a destination picker sheet | HTML5 drag and drop enabled only under `(pointer: fine)`, with "Move to" still the primary path | E04 |
| Rubber-band multi-select | No touch analogue exists. Apple: "In iOS and iPadOS, people must enter an edit mode before they can select table items" | Explicit selection mode, entered **either** by long-press on a row (which enters the mode and selects that row) **or** by a visible "Select" button; checkbox on every row; count in the bar title; explicit Select all and Select none; "select range from here" instead of a drag | Click, Shift+click range, Cmd/Ctrl+click toggle, marquee drag | E09 |
| Double-click to rename inline | No double-click on touch; an inline field lands under the software keyboard | The row's overflow button, then "Rename" in a keyboard-aware sheet with only the basename preselected and the extension protected | F2 shortcut opening the same sheet; optional inline edit at `expanded` and above | E03, E04 |
| Cut, copy and paste across locations | Depends on a second window and a keyboard | The staging tray is the touch analogue of the clipboard: cut or copy fills the tray, navigation is free, "Paste here" commits with a conflict prompt | Cmd/Ctrl+X, C, V bound to the same tray | E04 |

### Reference device and reference network

These are the definitions all budgets and all manual verification refer to. They are chosen to
emulate roughly a 75th-percentile experience, which means a full quarter of real users are worse
off than this.

| Item | Definition | Source |
| --- | --- | --- |
| Reference device (budgets, CI) | Samsung Galaxy A24 4G, or equivalent: Galaxy A16 4G, Galaxy A07 4G, Xiaomi Redmi Note 13 Pro 4G | [Alex Russell, The Performance Inequality Gap, 2026](https://infrequently.org/2025/11/performance-inequality-gap-2026/) |
| Reference network | 9 Mbps down, 3 Mbps up, 100 ms RTT | as above |
| CI throttling profile | Lighthouse default mobile preset: 150 ms TCP RTT, 1,638.4 Kbps down, 750 Kbps up, no packet loss, constant 4x CPU multiplier, documented as roughly the bottom 25% of 4G and top 25% of 3G | [Lighthouse throttling docs](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md) |
| Manual QA hardware, mid tier | Samsung Galaxy A54 5G, DevTools calibrated CPU preset plus Slow 4G | [CSS Wizardry, 2025](https://csswizardry.com/2025/08/low-and-mid-tier-mobile-for-the-real-world-2025/) |
| Manual QA hardware, low tier | Samsung Galaxy A15 5G, DevTools calibrated CPU preset plus 3G | as above |
| Manual QA hardware, iOS memory floor | iPhone SE 3rd generation, the device on which mobile Safari was measured to crash at roughly 100 MB of allocated JavaScript data with no catchable exception | [lapcatsoftware.com](https://lapcatsoftware.com/articles/2026/1/7.html) |
| Design width | 360 CSS px primary, 320 CSS px hard floor for Reflow | WCAG 2.2 SC 1.4.10 |
| Breakpoints | Defined once, in the [responsive size-class ladder](#responsive-size-class-ladder) below. No other file, table or component may define its own | [Android window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes) |
| Minimum touch target | 48 CSS px with at least an 8 px gap. This single number satisfies iOS 44 pt, Material 48 dp and the WCAG 2.2 SC 2.5.8 floor of 24 x 24 CSS px simultaneously | Apple HIG Accessibility; Material 3; WCAG 2.2 |
| Release acceptance | p75 field data (RUM or CrUX) on mobile: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1. The Lighthouse mobile preset is the CI regression guard, never the acceptance criterion | [web.dev/articles/vitals](https://web.dev/articles/vitals) |

Context for why the baseline is deliberately pessimistic: in CrUX data for July 2025 only 48% of
mobile websites passed all three Core Web Vitals, mobile good-LCP was 62% against desktop's 74%,
and mobile p90 Total Blocking Time reached 7,555 ms
([Web Almanac 2025, Performance](https://almanac.httparchive.org/en/2025/performance)). The median
mobile home page was 2.56 MB with 697 KB of JavaScript
([Web Almanac 2025, Page Weight](https://almanac.httparchive.org/en/2025/page-weight)), which
already exceeds the three-second interactive budget for the reference device. Shipping something
average is therefore shipping something that fails.

### Responsive size-class ladder

**This section is the single source of truth for every breakpoint in the product.** There is one
ladder, four classes, and no other numbers. A requirement, a business rule, a mobile-UX table, a
non-functional viewport matrix or a component may cite a class name; none of them may introduce
600 / 768 / 840 / 900 / 1024 variants of its own. A pull request that hard-codes a width outside
this ladder is a review-blocking defect.

Width classes, measured in CSS pixels of viewport width:

| Class | Width | The layout it implies |
| --- | --- | --- |
| `compact` | below 600 | Single column. Bottom navigation, bottom action bar, sheets, drill-down. This is the baseline every requirement is written against first (MF-1, MF-2). |
| `medium` | 600 to 839 | Single column with more breathing room; navigation rail replaces bottom navigation; two-column tiles become three or more. Still no second pane. |
| `expanded` | 840 to 1279 | The first class where a persistent second surface is permitted: the folder tree rail, the docked details inspector, the two-pane split view. |
| `large` | 1280 and above | As `expanded`, with wider content measures, more columns in tiles, and larger listing page sizes. No new capability appears here that `expanded` lacks. |

Three affordances are gated on this ladder, and these three sentences are the whole rule:

| Affordance | Appears when | Requirement |
| --- | --- | --- |
| Two-pane split view | `expanded` or `large` **and** viewport height is at least 480 CSS px | FR-VIEW-029 |
| Persistent desktop folder tree rail | `expanded` or `large` | FR-FLDR-022 |
| Docked details inspector pane | `expanded` or `large` | FR-VIEW-032 |

**Why split view carries a height condition as well as a width one.** A phone held in landscape is
frequently `medium` or even `expanded` in width while being only 360 to 420 CSS px tall. A
width-only rule therefore puts two panes, each with its own toolbar and scroll region, into roughly
150 px of usable vertical space per pane. The 480 px height floor is the smallest value at which a
split pane still shows enough rows to be worth the width it costs, and it is why FR-VIEW-029 is
written with `and`, not `or`. This is the specific bug an inherited width-only breakpoint set
produces, and it is why the ladder lives in one place.

**Why the `large` boundary is 1280 rather than 1200 or 1600.** The classes exist to switch layouts,
not to describe hardware, and nothing in this product changes behaviour between 1200 and 1280.
1280 is the common laptop logical width, so it is the point at which "a window on a laptop" and "a
maximised window on a monitor" genuinely diverge in how much content is worth showing. Extra
classes above it were removed because every one of them was defined and then never used, which is
how a ladder drifts.

### Platform assumption

The mobile-first delivery vehicle is a responsive, installable PWA: one codebase, instant
updates, no app-store gate, and a recipient path that needs no install. Native shells are an
explicitly scoped later option (R3, see [Scope](#scope)), justified only by a capability gap we
can measure. The gaps that PWA delivery costs us are named, not hidden:

| PWA limit | Where it bites | What we ship instead |
| --- | --- | --- |
| No Background Fetch on iOS or in any WebView; Chrome-only elsewhere | Long uploads from the field (P6, P1) | Foreground chunked resumable upload, resume offset committed before each chunk, an honest "Paused, reopen to continue" state, and Screen Wake Lock offered during a long foreground upload |
| No Background Sync on iOS | Retry on reconnect | Foreground-driven queue replay on next app open, with a visible queue |
| `showSaveFilePicker` and `showDirectoryPicker` absent on iOS and Firefox | Choosing where a download lands | Download is modelled as fire-and-forget; we keep an in-app list of re-fetchable links and name the Files app Downloads folder in copy |
| `share_target` unsupported in Safari and Firefox | "Share to Data Room" from the OS share sheet | Android-only capability, feature-detected; iOS users use the in-app picker, and the UI never advertises what the platform will not do |
| `webkitdirectory` only from iOS Safari 18.4 and Chrome Android 132 | Folder upload | Multi-file select with path reconstruction where `webkitRelativePath` exists, a zip upload the server expands, and an explicit fallback message elsewhere |
| Web push on iOS requires a Home Screen web app, and there is no `beforeinstallprompt` | Notification-led triage (E11) | Install is taught in-product; push is treated as an enhancement and email is the guaranteed channel |
| No web API forces a biometric re-check on resume | "Require Face ID to reopen the room" | Short session TTL plus a step-up WebAuthn assertion on resume, described honestly as a re-authentication prompt, not an OS lock |
| Storage is evictable, all-or-nothing per origin, after seven days without interaction on WebKit | Offline reading | Cached copies are labelled "Cached copy, may be cleared by your browser"; the server is always the source of truth |

## Target users

There are two kinds of user and the asymmetry between them is the most important fact in this
document set. **Staff** are colleagues with accounts, who create rooms, file documents, grant
access and take it back. **Recipients** are external parties — a counterparty, an adviser, a
prospective acquirer — who never get an account, arrive through a link or an emailed invite, and
must be able to read on a phone with nothing installed. A recipient on a phone with no account is
the most demanding surface in the product, so recipients are specified as first-class users, not as
an afterthought.

Full detail, including devices, network conditions, frustrations and jobs-to-be-done, is in
[02-personas-and-jtbd.md](./02-personas-and-jtbd.md), which is authoritative for the persona set.
Condensed here so that scope arguments can be settled against a person rather than an adjective.

| ID | Role | Side | One-line job | Primary device | Why they decide our design |
| --- | --- | --- | --- | --- | --- |
| P1 | Deal lead, runs several live processes at once | Staff, sharer / room owner | Get a named recipient into a populated room within an hour of the call | Phone as the primary work computer; a laptop in the car boot | If room creation, filing and revocation are not one-handed, she goes back to a shared cloud folder and the controls stop existing |
| P2 | External recipient, first pass, no account | Recipient | Decide in 90 seconds of skimming whether this deserves an evening | Android phone | Never uses a desktop for a first pass, and bounces silently rather than complaining. Everything in Pillar 4 exists for him |
| P3 | External adviser to a recipient (accountant, lawyer) | Recipient / adviser | Find the twelve documents that matter and chase the missing ones | Phone plus Windows laptop | Triages on mobile and analyses on desktop. He is why the desktop enhancements must be real, and why they must not set the baseline |
| P4 | Transaction coordinator, internal | Staff, collaborator | Assemble and repair a consistent room structure fast, and fix someone else's mistakes | Laptop for construction, phone for correction | Roughly a third of her touches are on the phone. She justifies touch-native bulk operations and blast-radius warnings |
| P5 | External decision-maker, time-boxed | Recipient | Reach a yes or no in under four minutes without a laptop | Phone, always | She proves the constraint. If the room is desktop-shaped she does not complain, she stops reading |
| P6 | Field staff, capturing documents on site | Staff, sharer, field | Publish a package and add a document photographed on site | Phone, tablet in the vehicle | He will find every offline, resumable-upload and flaky-network defect in R1 |
| *Administrator* | Internal administrator | Staff, governance | Provision and deprovision colleagues, set a room's storage quota and retention, answer "who had access" | Laptop primarily, phone for urgent revocation | E12 exists for this role. Every limit in the product is a value this person sets, with a stated default |

The administrator row carries no `P<n>` identifier because
[02-personas-and-jtbd.md](./02-personas-and-jtbd.md) owns the persona namespace and had not
allocated one at the time of writing. Cite it by name until 02 does.

**User types explicitly out of scope**, restated so they are not smuggled back in:

| Out of scope | Reason |
| --- | --- |
| External recipients as administrators | A recipient never configures anything. Roles, quotas, retention and provisioning are staff-only, and an anonymous link visitor is always a Viewer (D06). Widening this is a security change, not a feature. |
| Anyone outside the company as an account holder | Accounts are provisioned for colleagues (E12). External parties reach content through a share, and the no-account path is a requirement, not a limitation. |
| Consumers using this as personal file storage | The tool is scoped to controlled outward sharing of company documents. Personal storage has no room, no recipient and no revocation, so it shares no requirements with this product. |
| Clinical, regulated-records and statutory-audit workflows | These import compliance regimes (HIPAA, SOC 2, statutory retention schedules) that this tool does not implement and does not claim. Assumption A11 states the privacy posture we do hold. |
| Desktop-primary power users **as the design target** | P3 and P4 are users we serve properly, and the `expanded` enhancements are real. They never set the baseline interaction model (MF-1). This is a design-order exclusion, not an exclusion of people. |

## Scope

Scope is expressed per release. MoSCoW priority is relative to its own release: everything
marked Must in R1 is required for R1 to ship.

**These four tables are derived, not authored.** Every release tag and every priority in the
product is owned by [05-functional-requirements.md](./05-functional-requirements.md), one per
requirement. The tables below are the epic-level roll-up of 05's `Release` column, regenerated
whenever 05 changes. Where this file and 05 disagree, **05 wins and this file is the defect.** The
same rule governs the release columns in [04-epics.md](./04-epics.md).

### In scope for R1 (MVP)

Theme: a colleague can run a real room end to end from a phone, and an external recipient can read
it without an account.

| Epic | In R1 | MoSCoW |
| --- | --- | --- |
| E01 | Email and password sign-up and sign-in; magic-link sign-in; email verification including the deferred-verification path; password reset; session management with mobile session longevity and a per-device session list; sign-out everywhere (FR-AUTH-016); passkey and WebAuthn sign-in (FR-AUTH-009); rate limiting and progressive lockout UX that explains itself; invitee access to a shared item with no account; anonymous public-link sessions scoped to exactly the shared subtree; account deletion with the retention window in BR-190; new-device sign-in security event. Sign-in through the company identity provider is the assumed primary path for staff (A13) and the requirements above are the fallback and the external-recipient path | Must |
| E02 | Create, rename and delete a room; room ownership and the single-owner invariant; the mobile workspace home with My rooms, Shared with me, Recents and pinned rooms; empty states; the room switcher; the per-room visual marker and the persistent room name in every header; the room settings screen; the invisibility rule and its indistinguishable-not-found corollary; room-name search; room list sort; the per-room storage figure; room deep links; the header indicator of how many principals have access | Must |
| E03 | Create and nest folders to the depth limit; drill-down navigation; breadcrumb with collapse behaviour at `compact`; the folder-tree sheet with jump-to as the mobile tree equivalent; rename; move; delete with an explicit cascade warning stating exact counts (BR-172); item counts; folder details on request; depth and path-length limits; deep links to a folder; hardware and gesture back; up-one-level; guaranteed scroll restoration | Must |
| E04 | Upload from camera, photo library and device files picker; multi-file upload; chunked resumable upload with progress, cancel and retry; single-file download and server-streamed bulk zip download; copy or duplicate; rename; move, including cut and paste via the staging tray; delete to trash with restore; selection mode with a bulk action bar and select-range; open-in and share-to another app where the Web Share API allows; per-item partial-failure reporting | Must |
| E05 | List view and tiles view with a persisted preference; thumbnails with reserved layout boxes; the details bottom sheet with size, type, created, modified, owner, path, version and effective permissions; the full-screen viewer for PDF, image, text or code, and video and audio streamed by range request; pinch-zoom plus single-pointer zoom and fit-to-width controls; page jump; unsupported-type fallback; sort controls with a persisted sort; resume at last page and scroll position, retained 90 days | Must |
| E06 | Filename search with the scope selector for this folder, this room and all rooms; debounced type-ahead with supersede cancellation; filters for type, date, size, owner and shared status in a single sheet with an explicit Apply; recent searches; result rows showing the containing path with jump-to; result count and paging; zero-result, error, offline and cancellation states; reachable search affordance and keyboard handling on a phone; `search_performed` and `search_result_opened` events | Must |
| E07 | Share a room, a folder or a single file; public link and invite-by-email as distinct objects; the four roles Owner, Manager, Contributor, Viewer plus the orthogonal download-allowed and can-reshare flags; link password, the link download on/off toggle and link rotation (scheduled link **expiry** is R1.1); revoke any share at any time within BR-108, with revoke authority limited to the room Owner, a Manager, or the principal that created the grant; revoke-every-share-on-this-room; read-only enforcement in the API as well as the UI; pending invites, resend and cancel; the no-account recipient path in at most two taps; the share-management screen answering "who can see what"; inheritance and override rules for nested items with the pre-commit summary; no-index and no-referrer on every public link page; the single generic dead-link state | Must |
| E08 | Duplicate-name handling on create, upload, copy, move and rename with exactly three choices — keep both, replace as a new version, cancel; the deterministic suffix; case-insensitive collision policy; forbidden characters; Unicode NFC normalisation; name and total path length limits; trailing space and reserved-name handling; upload idempotency per folder, name and content hash; ETag or version-token optimistic concurrency with a specified 409 experience; prevention of moving a folder into its own descendant; trash retention (BR-177) and permanent deletion | Must |
| E09 | The whole interaction system: thumb-zone layout, bottom navigation, bottom action bar and contextual action bar, the per-row overflow button that opens the action sheet, long-press as the entry to multi-select, pull-to-refresh, virtualised list with an explicit Load more, safe-area and notch handling, keyboard avoidance, sticky breadcrumb, skeleton loaders, toast with undo, offline and poor-network banners, system-following light and dark theme, the [size-class ladder](#responsive-size-class-ladder) from `compact` to `large`, WCAG 2.2 AA including 48 CSS px targets, screen-reader semantics, dynamic type, reduced motion, full keyboard operability, and the keyboard shortcut set of FR-MOB-039 including move and toggle view | Must |
| E10 | Dynamic directory loading, cursor pagination, list virtualisation above 100 rows, lazy thumbnails, optimistic UI with rollback, offline read cache for previously visited folders and previously opened files with honest "cached copy" labelling, performance budgets wired into CI, real-user monitoring, used-storage measurement | Must |
| E11 | Per-room, per-folder and per-file activity log covering who did what and when, including document-open events and failed access attempts; per-file viewer analytics (who opened what, when, for how long); the in-app notification centre with directly actionable items; per-room notification preferences and mute; activity-log export to CSV; the retention period in BR-195 stated in the interface; email notification for the events an owner must not miss | Must |
| E12 | Profile and preferences; the administrator-set storage quota with its stated default; the used-storage indicator and the per-room breakdown (FR-ACCT-005); warning thresholds (BR-196); explicit and non-destructive behaviour at the limit; retention settings; account provisioning and deprovisioning; account deletion with the retention window in BR-190; the administrator role itself | Must |

**What the brief's "create" means (D15).** In brief bullet 1, *create* is create-folder
(FR-FLDR-001) plus upload (FR-FILE-001 onward). Both are R1 Must. Creating an **empty file** inside
the application, and editing it in-app, is a separate and lesser capability: it is FR-FILE-044, it
stays at Could / R3, and it is not what the bullet asks for. This is stated because "create" in a
file-manager brief is routinely read as "new empty document", which would put a text editor on the
R1 critical path.

Cross-cutting R1 inclusions: the real persistence layer and object storage that replace the
in-memory seed in `documents.service.ts`; the resumable-upload gateway; server-side preview and
thumbnail rendering; the shared typed contract additions in `packages/shared`; and the analytics
event pipeline.

### R1.1 (trust hardening)

R1.1 is a named increment, not a slipped part of R1 and not a rebranded R2. It exists because of a
single predictable event: **the first time a document we shared leaks, staff will ask three
questions** — who had it open, can I prove it, and does that link still work. R1.1 is the answer to
those three questions and nothing else. It is scoped small deliberately so that it can ship within
two sprints of R1 rather than queueing behind the R2 backlog, and it is separated from R1 because
none of it is required to prove that the tool works, while all of it is required before the tool is
trusted with the most sensitive material we hold.

| Epic | In R1.1 | MoSCoW |
| --- | --- | --- |
| E07 / E05 | **Dynamic per-viewer watermark.** Every server-rendered preview page of a watermark-enabled share carries the viewer's identifier and the access timestamp, baked into the rendered tile rather than overlaid in the client (FR-VIEW-035, FR-SHARE-012). Configurable from a phone, which is precisely the control the closest comparable product documents as web-only | Must |
| E11 | **Per-viewer access log.** The owner-facing view of who opened which file, when, from which share, and for how long, surfaced per file and per recipient rather than only as a room-wide feed | Must |
| E07 | **Share-link expiry**, enforced server-side, with the dead-link state disclosing nothing — including never disclosing the expiry date to an unauthenticated visitor | Must |
| E11 | **Recipient tracking disclosure** (NFR-PRIV-010, US-E11-11). The disclosure is a hard precondition, not a companion task: the first FR-AUDIT-004 view event for a recipient must not be recorded until that recipient has been shown the tracking notice. Tracking and its notice ship in the same release or neither ships | Must |

R1.1's theme, sequencing and exit criteria are in the
[release plan](#r11-trust-hardening-the-three-questions-after-a-leak).

### R2 (fast-follow)

Theme: the notification-led triage surface, the desktop step-up, and the capabilities that make the
tool a daily habit rather than a place you are sent.

| Epic | In R2 | MoSCoW |
| --- | --- | --- |
| E11 | Page-level viewer analytics for PDF including per-page dwell; web push where the platform allows it; email digests at a per-room frequency; the export rate limit | Must |
| E01 | Social and OAuth sign-in where it reduces friction; biometric or device-passcode step-up re-authentication on resume, described honestly as re-authentication; transfer of a guest's grants to a full account on signup with the same verified address | Should |
| E02 | Duplicate a room; archive and restore a room; room templates and user-defined templates; room item counts; the room-list filter; the room-level default share policy | Should |
| E03 | The persistent folder tree in a navigation rail at `expanded` and above; copy-path | Should |
| E04 | Multi-page camera capture assembled into one PDF with per-page retake and reorder; OS share-sheet target on Android; folder upload where directory selection exists, plus the zip-upload alternative; the recently-downloaded list; screen wake lock during a long foreground upload; drag and drop under `(pointer: fine)` | Should |
| E05 | Office-format preview through server-side conversion; rotate; grouping; folders-before-files setting; the true two-pane split view (`expanded` and above, height >= 480 CSS px); the docked inspector pane; preset split ratios as the non-dragging alternative | Should |
| E06 | Document content search where it is enabled for a room; saved searches | Should |
| E07 | Email-capture gate on a public link; ownership transfer; bulk permission editing; the concurrent-public-link ceiling; inbound access requests as actionable notifications | Should |
| E08 | File versioning and version restore (BR-186); replace-as-new-version; the offline mutation queue and its reconciliation on reconnect, limited to the three queueable mutation kinds in BR-130 | Should |
| E09 | Theme customisation (accent, density, text size); haptics; row swipe actions as shortcuts only; the navigation rail and horizontal toolbar at `medium` and above; installed-PWA polish | Should |
| E10 | Explicit offline pinning of specific files; prefetch tuning; the data-saver text-only listing; behaviour verified in a folder of 10,000-plus items and with files of several GB | Should |
| E12 | Data export and portability as an asynchronous job with a time-limited download link | Should |

### R3 (later)

Theme: content intelligence, and the capability gaps that would justify native code.

| Epic | In R3 | MoSCoW |
| --- | --- | --- |
| E06 | OCR search, including OCR of camera captures, so that a photographed document is findable by its contents | Could |
| E11 | Structured question-and-answer workflow with recipients; per-recipient scoped reporting; the live "who is in this room now" list | Could |
| E04 | On-device scan pipeline with deskew and on-device OCR; creating and editing an empty text or Markdown file in-app (FR-FILE-044) | Could |
| E01 | Time-based one-time-password second factor with recovery codes; owner-set forced re-authentication interval per room | Could |
| Platform | Native iOS and Android shells, scoped only against a measured PWA capability gap: true background upload, biometric app lock, OS-level share target on iOS | Could |
| E07 | Click-through acknowledgement gate before first view; screenshot deterrence where the platform allows it | Could |

### Out of scope and non-goals

| Excluded | Release | Reason |
| --- | --- | --- |
| Real-time collaborative co-editing of documents | Won't-for-now | The tool's job is showing an external party a document and taking it back, not editing together. Co-editing implies CRDT infrastructure, presence and conflict merge, none of which serve any job-to-be-done in [02-personas-and-jtbd.md](./02-personas-and-jtbd.md), and the company already has a tool for that. |
| E-signature | Won't-for-now | A separate compliance surface (audit trail, identity assurance, legal retention). Our people already have a signing tool, so integrating later beats building. |
| Native desktop application | Won't-for-now | The responsive web app already serves the desk. A native desktop shell adds packaging, update and code-signing cost for zero capability we lack. |
| AI question-answering over document contents, auto-tagging, auto-redaction, translation | Won't-for-now (revisit after R3 content search) | It requires content extraction we do not have until R3, and none of it addresses what our staff are failing at today, which is doing the basic operations from a phone. |
| Full document management system: records retention schedules, legal hold, classification taxonomies, DLP policy engine | Won't-for-now | A different problem with a different owner. E12 ships administrator-set retention and quota, which is the governance this tool genuinely needs; a policy engine is not. |
| Offline write-heavy sync (a full two-way sync engine with local edits) | Won't-for-now | Storage on the web is evictable all-or-nothing per origin, WebKit deletes it after seven days without interaction, and pages are frozen and discarded aggressively on mobile. A sync engine built on that substrate would lose data. R1 ships an offline read cache and R2 a bounded mutation queue of exactly the three kinds in BR-130. |
| Structured question-and-answer workflow in R1 | R3 | Genuinely valuable and genuinely a phone-shaped job, but it presupposes a multi-party process and every R1 hour is better spent on the operations every room needs. |
| Room-to-room content sync, integration marketplace, CRM connectors | Won't-for-now | Nothing in R1 asks for it; every integration is a support surface we would then own. |
| Chat or messaging inside the room | Won't-for-now | The chase-the-missing-document job (P3) is served by a targeted request-and-comment on a folder, not by a general chat product. The company already has chat. |
| Watermarking, per-viewer access log and link expiry in R1 | **R1.1**, which exists for exactly this | These are the three things staff demand the first time a shared document leaks. They are not deferred into the R2 queue; they are a named increment scheduled directly after R1 with its own exit criteria. Tracked as R07 in [12-risks-and-open-questions.md](./12-risks-and-open-questions.md). |
| Supporting IE, legacy Edge, or Android WebView as a first-class host | Never | The capability floor (no `webkitEntries`, no Background Fetch, 15% storage quota inside an embedding app) makes it a different product. Detect and degrade with a clear message. |

## Requirements traceability overview

This table is the most important part of this document. It accounts for every bullet in the
stakeholder brief. Nothing in the brief is dropped, and where a bullet is hostile to touch, the
touch-first treatment is stated rather than the bullet being quietly reinterpreted. The
finer-grained mapping down to individual `FR-` identifiers is in
[05-functional-requirements.md](./05-functional-requirements.md); the epic-level coverage check
is repeated in [04-epics.md](./04-epics.md).

### Base file-manager requirements

| # | Brief bullet, verbatim | Epic(s) | FR domain(s) | Release | Touch-first treatment |
| --- | --- | --- | --- | --- | --- |
| 1 | Basic file operations: create, delete, copy, rename, cut, paste | E04, E08 | FILE, CONF | R1 | Selection mode plus a bottom action bar. **"Create" here is create-folder (FR-FLDR-001) plus upload (FR-FILE-001 onward)**, not an in-app empty-file editor, which is FR-FILE-044 at Could / R3. Cut and paste become the staging tray: cut or copy fills a persistent "n items ready to move" tray, the user navigates freely, "Paste here" commits with conflict resolution. Delete goes to trash with a count-bearing confirmation and a 10-second undo toast (BR-176). |
| 2 | Download and upload files | E04, E10 | FILE, PERF | R1 (single download, server-streamed bulk zip download, multi-file upload); R2 (OS share-sheet target, folder upload) | Upload sources are camera, photo library and files picker, all first-class. Chunked resumable upload with the offset committed before each chunk (BR-208). Download is fire-and-forget with an honest destination story, because the page is never told where an iOS download landed. Bulk download is a server-streamed zip, never client-side buffering. |
| 3 | Files tree view | E03, E09 | FLDR, MOB | R1 (mobile equivalent); R2 (desktop tree rail) | **Hostile to touch.** Indentation at 320 CSS px violates SC 1.4.10 Reflow and twisties fall under the SC 2.5.8 target floor. Replaced at `compact` by breadcrumb plus drill-down, an ancestor sheet from the collapsed breadcrumb, and a folder-tree sheet with jump-to on every node. The real persistent tree returns in a navigation rail at `expanded` and above (FR-FLDR-022). |
| 4 | List and tiles views | E05 | VIEW | R1 | Both views ship at `compact`. Preference persists per account per room. Tiles use lazy thumbnails with fixed aspect boxes so the grid does not shift (CLS). |
| 5 | File preview pane with file information (file size, type, modified date, etc) | E05 | VIEW | R1 (sheet plus full-screen viewer); R2 (docked pane) | **Hostile to touch,** because the pane is populated by hover. Replaced by two surfaces: a details bottom sheet at the medium detent, and a full-screen viewer that is its own history entry so system back and in-app back both close it. The same details component docks as an inspector pane at `expanded` and above (FR-VIEW-032). |
| 6 | Split view to manage files between different locations | E04, E05 | FILE, VIEW | R1 (tray and destination picker); R2 (true split) | **Hostile to touch.** Two panes cannot meet Reflow at 360 px, and a landscape phone is often `medium` in width while being under the 480 px height floor. Replaced by the staging tray and a single destination-picker sheet with in-sheet drill-down, never stacked sheets. True split view is gated on `expanded` or above **and** height >= 480 CSS px (FR-VIEW-029, [size-class ladder](#responsive-size-class-ladder)). |
| 7 | Built-in search box | E06 | SRCH | R1 (filename, filters, all-rooms scope, recent searches); R2 (document content search); R3 (OCR) | Search is the primary navigation aid on a phone, not a secondary one, because a thumb should never walk four levels of tree. Reachable affordance in the thumb zone, debounced type-ahead, visible scope selector, cancellable requests, filters in one sheet with an explicit Apply, result rows that show the containing path and jump to it. |
| 8 | Context menu and toolbar for quick actions | E09 | MOB | R1 | **Hostile to touch.** No secondary click exists. The context menu becomes an always-visible per-row overflow button ("...", at least 48 x 48 CSS px, trailing edge) that opens the action sheet; **long-press is not that entry point — long-press enters multi-select and selects the row** (D01, FR-MOB-001 and FR-FILE-035). A visible button is discoverable, matches iOS Files, Drive and Dropbox, and satisfies SC 2.5.1 without a second mechanism. Toolbar becomes a bottom action bar of three to five labelled actions plus overflow, and a contextual action bar in selection mode. Grouped commands go in a sectioned modal bottom sheet, since an iOS action sheet caps at four buttons including Cancel and must not scroll. |
| 9 | Keyboard navigation | E09 | MOB | R1 | Kept in full: WCAG 2.1.1 is Level A and applies on phones, which support hardware keyboards and switch access. Mobile counterparts specified alongside: roving-tabindex grid semantics, type-ahead search in place of type-to-jump, polite live regions for every status message, Label in Name on every icon-only control. The shortcut set (FR-MOB-039, R1) covers navigate, select, select-range, rename, **move**, delete, search, new folder, upload and **toggle view**, and is listed in a discoverable shortcut sheet. Shortcuts and a visible focus ring light up when a hardware keyboard or fine pointer is detected. |
| 10 | Used storage info | E12, E10 | ACCT, PERF | R1 (indicator, per-room breakdown, limit behaviour) | A compact indicator in the account sheet and on the workspace home, plus the per-room breakdown ordered by size (FR-ACCT-005). The quota is set by an internal administrator per room, with a stated default, never by a purchased plan. Warning thresholds at 75, 90 and 100 percent (BR-196); explicit, non-destructive behaviour at the limit, which refuses new uploads before any byte is accepted and never silently drops data (BR-201 to BR-205). |
| 11 | Light and dark themes, with easy customization | E09 | MOB | R1 (system-following light and dark); R2 (accent, density, text size) | Theme follows the system by default with a user override. Tokens are defined once; components never hard-code colour. Customisation respects dynamic type and reduced motion rather than fighting them. |
| 12 | Optimized for large datasets with dynamic directory loading | E10 | PERF | R1 (pagination, virtualisation above 100 rows, lazy thumbnails, offline read cache); R2 (10,000-plus item verification, explicit offline pinning) | Cursor pagination, list virtualisation, lazy thumbnails, and an explicit Load more affordance rather than pure infinite scroll, because infinite scroll destroys the landmarks a person needs when hunting one specific file. Guaranteed scroll-position restoration on return from a child folder or a preview. |

### Requested requirements

| # | Brief bullet, verbatim | Epic(s) | FR domain(s) | Release | Touch-first treatment |
| --- | --- | --- | --- | --- | --- |
| 13 | Create a folder and nest folders in another folder | E03, E08 | FLDR, CONF | R1 | A visible Add affordance in the thumb zone on every folder screen, per HIG file-management guidance. Nesting to a stated depth limit, with the limit surfaced before the user hits it. Name validation and collision resolution happen in the same sheet, never silently. |
| 14 | View folders and their contents, this includes nested files and folders, with breadcrumb navigation | E03, E05, E10 | FLDR, VIEW, PERF | R1 | Drill-down list as primary. Breadcrumb is a horizontally scrollable chip rail that collapses at 360 px to the current folder plus a leading path chip which opens the ancestor sheet. Breadcrumb is sticky. Item counts on every folder row. Deep links resolve to a folder and restore the breadcrumb. |
| 15 | Update the folder name | E03, E08 | FLDR, CONF | R1 | Rename from the row's overflow button into a keyboard-aware sheet, basename preselected, extension protected, collision resolved in place. Not from long-press, which is bound to multi-select (D01). No double-click, no inline edit under the keyboard. |
| 16 | Delete a folder and its nested folders and files (warn the user what will be deleted) | E03, E08 | FLDR, CONF | R1 | The single highest-stakes touch interaction in the product. The confirmation states exact counts ("This deletes 3 folders and 47 files, 812 MB") and names any shared items that will lose access. Commit is on the up-event. Soft delete to trash with the retention window in BR-177, plus a 10-second undo toast (BR-176). Never a swipe-only path. |

### Derivative requirements

| # | Brief bullet, verbatim | Epic(s) | FR domain(s) | Release | Touch-first treatment |
| --- | --- | --- | --- | --- | --- |
| 17 | Authorization | E01, E07 | AUTH, SHARE | R1 | Every API call is authorised server-side against the caller's effective role on the target resource. Hiding a button is not authorisation. Authorisation decisions are logged (E11). |
| 18 | Authorization / Authentication (owner-based access; Data Room not visible to others unless shared) | E01, E02, E07 | AUTH, ROOM, SHARE | R1 | The invisibility rule is a hard business rule, not a UI state: a room is absent from listings, search, notifications and error messages for anyone it was not shared with, and an unauthorised fetch returns the same response as a non-existent room so existence is not leaked. A principal holding no grant on the target gets 404, byte-identical and timing-equivalent to a genuinely absent resource; 403 is reserved for a principal that holds a grant on that exact target and is exceeding it (D02). Sign-in supports email and password, magic link and passkeys in R1, with the company identity provider assumed as the primary staff path (A13), and WCAG 3.3.8 compliant flows throughout (paste allowed into OTP, autofill supported). |
| 19 | Access control (roles/permissions) — supports public link vs permissioned share | E07 | SHARE | R1 | Four roles plus the orthogonal download-allowed and can-reshare flags, editable from a phone in one sheet with an explicit Apply and a summary of exactly what will change. Public link and invite-by-email are separate objects with separate controls. An anonymous public-link visitor is always a Viewer; the download-allowed flag is the only variable, and no configuration lets an anonymous visitor write (D06). Role control belongs to the invite path only. Inheritance and override for nested items are specified, and the effective permission is always visible on the item. |
| 20 | Access revocation (owner can revoke a share at any time) | E07, E11 | SHARE, AUDIT | R1 | Revoke is reachable in at most three taps from the room home, and is available to the room Owner, to a Manager, and to the principal that created the grant (D07). Effect is bounded, not hand-waved: refused on every path within 5 seconds at p95 and 60 seconds absolutely (BR-108), signed content URLs live at most 60 seconds and are bound to the grant epoch (BR-110), a streaming download is cut at the next range boundary and never more than 30 seconds after revocation (BR-111), and a loaded page loses access on its next request within the 30-second re-check interval (BR-112). Revocation is a logged, notifiable event. Revoking one recipient never affects another. |
| 21 | Read-only enforcement for shared content | E07, E04, E05 | SHARE, FILE, VIEW | R1 | Enforced at the API for every mutating verb, then reflected in the UI by hiding rather than dimming unavailable commands. Download is a separate flag from read, because a Viewer who may read is not automatically a Viewer who may download. Read-only is verified by a QA test that calls the API directly with a Viewer token. |
| 22 | Conflict resolution for duplicate file/folder names | E08 | CONF | R1 | Exactly three choices, never a fourth: keep both with a deterministic suffix, replace as a new version, or cancel this item, offered in the same sheet as the action that caused the collision. Case-insensitive collision policy, Unicode NFC normalisation, forbidden-character and reserved-name handling, name and total path length limits. Upload retries after a page freeze must be idempotent per folder, name and content hash, or a resume will manufacture duplicates the user never asked for. |

### The hard product constraint

| Constraint bullet | Where it is discharged |
| --- | --- |
| Mobile-first is non-negotiable; every requirement specified for a small touch screen first | [Mobile-first mandate](#mobile-first-mandate) rules MF-1 and MF-2; enforced per story by the Definition of Done |
| Desktop-only primitives each given an explicit mobile-native equivalent, never dropped, never bolted on | The [normative touch-equivalence mapping](#normative-touch-equivalence-mapping); rows 3, 5, 6, 8, 9 of the base-FM traceability table; E09 owns the interaction system |
| Where a base requirement is hostile to touch, say so and specify the replacement plus the desktop enhancement | Every "Touch-first treatment" cell above that opens with "Hostile to touch" |
| PWA as the delivery vehicle, with its limits called out rather than hidden | [Platform assumption](#platform-assumption) |

## Release plan

Sprints are two weeks, one team of five: two full-stack engineers, one front-end specialist, one
designer, one QA engineer, with the PM shared. All sprint counts below are **Estimates**, not
commitments, and assume the technical baseline in the repository is kept rather than
re-architected.

There are exactly **four releases**: R1 (MVP), R1.1 (trust hardening), R2 (fast-follow), R3
(later). No fifth tag exists, and a requirement carrying anything else is a defect against
[05-functional-requirements.md](./05-functional-requirements.md), which owns the tag.

### R1, MVP: "Run a real deal from a phone"

| Field | Value |
| --- | --- |
| Theme | A colleague can create, fill, share and revoke a room entirely on a phone; an external recipient can read it with no account |
| Epics | E09 and E10 foundations first, then E01, E02, E03, E04, E08, E05, E06, E07, with E11 and E12 at the depth stated in the R1 scope table |
| Demoable outcome | On a Galaxy A24 over the reference network, one hand: create a room, add three nested folders, photograph a document into the deepest one, upload a 40 MB PDF that survives airplane mode toggling, invite two email recipients as Viewer, send a public link, open that link on a second phone with no account and read the PDF, revoke the second recipient and watch their next request fail inside the BR-108 bound, then delete a folder and read a warning that names the exact counts |
| Sprint estimate | 9 sprints, 18 weeks |
| Rough sequence | S1 to S2: E09 interaction system, E10 list and pagination primitives, persistence and object storage landing. S3: E01. S4: E02 plus E03 navigation. S5: E03 mutations plus E08 naming and conflict core. S6 to S7: E04 upload, download, trash, selection mode, staging tray. S7: E05 views, details sheet, viewer. S8: E06 plus E07 sharing and revocation. S9: E11 activity log and notification centre, E12 quota, provisioning and administrator role, hardening, accessibility pass, performance pass |
| Exit criteria | (1) Every R1 Must FR has a passing acceptance test executed on the reference device. (2) p75 field or lab-on-device Core Web Vitals inside the good band on the six key routes: workspace home, folder list, viewer, search, share sheet, upload. (3) Zero WCAG 2.2 AA violations in the automated suite and a clean manual pass on SC 1.4.10, 2.4.11, 2.5.1, 2.5.2, 2.5.7, 2.5.8, 4.1.3. (4) Read-only and revocation verified by direct API tests with a Viewer token, not by UI inspection, and revocation measured against BR-108. (5) A resumable upload survives backgrounding, network loss and a forced page discard, and reports an honest state. (6) Cascade-delete warnings verified to state correct counts on a tree of depth 6 with 500 items. (7) Three internal teams have each run one live process through the tool end to end |
| Not exited by | Feature count, or a desktop demo |

### R1.1, trust hardening: "The three questions after a leak"

| Field | Value |
| --- | --- |
| Theme | The three controls staff will ask for the first time a shared document turns up somewhere it should not: who had it open, can I prove it, and does that link still work |
| Why it is its own release | It is not R1, because none of it is needed to prove the tool works, and holding R1 for it delays every basic operation our people are currently doing in a shared cloud folder. It is not R2, because R2 is a twelve-week block and these three capabilities are the ones that decide whether the tool is trusted with the material that matters. Naming it separately is what stops it being quietly re-planned into the middle of R2 |
| Epics | E07 (watermark configuration, share-link expiry), E05 (watermark baked into the rendered tile), E11 (per-viewer access log, recipient tracking disclosure) |
| Scope | Exactly the four rows in the [R1.1 scope table](#r11-trust-hardening). Nothing else may be added to this release; anything adjacent goes to R2 |
| Demoable outcome | A colleague turns on watermarking for one share from a phone, sends the link with a 7-day expiry, opens it on a second device and sees their own identifier and the access timestamp baked into the page image; the owner then opens the per-viewer access log and sees that view with its duration; the recipient is shown the tracking notice before any view event exists for them; the link is left to expire and then shows exactly the same generic dead-link state as a link that never existed |
| Sprint estimate | 2 sprints, 4 weeks, starting immediately after R1 |
| Exit criteria | (1) A watermarked preview carries the correct per-viewer identity on the rendered tile, and a cached tile is proven never to be served to a viewer whose watermark differs. (2) Watermarking can be turned on and off for a share entirely from a 360 px viewport, which is the specific control the closest comparable product documents as web-only. (3) The per-viewer access log reconciles exactly with the activity log for the same period; the two sources never disagree. (4) Link expiry is enforced at the API, and expired, revoked and never-existent links are shown to be byte-identical and timing-equivalent to an unauthenticated visitor, with no expiry date ever disclosed to one (D02). (5) A query over the event store returns zero FR-AUDIT-004 view events for any recipient not previously shown the tracking notice. (6) No regression in the R1 exit criteria |

### R2, fast-follow: "Triage on the phone, and the desk"

| Field | Value |
| --- | --- |
| Theme | The notification surface that makes the tool a daily habit rather than a place you are sent, and the real desktop step-up |
| Epics | E11 (page-level analytics, push, digests), E07 (email-capture gate, ownership transfer, bulk permission editing, access requests), E05 (office formats, true split view, docked inspector), plus the R2 rows of E01, E02, E03, E04, E06, E08, E09, E10, E12 |
| Demoable outcome | An owner sees "an external recipient opened the offering document, 4 pages, 3m12s" as a push notification on a phone, taps it, sees the per-page dwell chart, revokes the share from the notification, and exports the room's activity log to CSV. Separately, a coordinator uses the true two-pane split view on a desktop to move 40 files between two folders, and an office document previews without leaving the room |
| Sprint estimate | 6 sprints, 12 weeks |
| Exit criteria | (1) Per-page dwell available for PDF, reconciling with the R1.1 access log. (2) Web push delivered on Android and on installed iOS Home Screen web apps, with email as the guaranteed fallback and no capability claimed that the platform does not grant. (3) Version restore verified, including the always-keep-3 rule (BR-186). (4) The offline mutation queue verified across all three of BR-130's queueable kinds, and verified to carry no fourth. (5) Offline read cache verified to degrade honestly after eviction. (6) A folder of 10,000 items scrolls at 60 fps on the reference device with no task over 50 ms. (7) Split view, tree rail and docked inspector verified to appear exactly at the ladder's `expanded` boundary and, for split view, only above the 480 px height floor |

### R3, later: "Content and the native question"

| Field | Value |
| --- | --- |
| Theme | Make the contents searchable, and answer the native-shell question with evidence rather than preference |
| Epics | E06 (OCR search), E11 (question-and-answer workflow), E04 (scan pipeline, in-app text file), E01 (second factor, per-room re-authentication interval), plus a scoped native-shell evaluation |
| Demoable outcome | A colleague photographs a 12-page lease with the scan pipeline, it assembles into one searchable PDF in the right folder, and a search for a tenant name inside the room finds it. A native shell prototype demonstrates true background upload and biometric app lock, with a measured delta against the PWA |
| Sprint estimate | 6 or more sprints, scope-dependent |
| Exit criteria | (1) Content and OCR search precision and recall measured against a labelled corpus, with the number recorded. (2) OCR quality measured on real phone captures, not scans. (3) A written go or no-go on native shells that cites measured PWA gaps. (4) No regression in the R1 and R1.1 exit criteria |

## Success metrics

**This file defines no metric.** [10-success-metrics-and-analytics.md](./10-success-metrics-and-analytics.md)
owns the north star, the metric catalogue, every `M<nn>` identifier, every target and the
snake_case analytics event dictionary. This section only names which of 10's metrics this PRD is
judged on, and cites them by ID. Earlier drafts of this file defined its own `M01` to `M05` with
different meanings from 10's; that collision is withdrawn, and any document still using the old
local meanings is wrong.

The north star is **M01, Weekly Active Shared Rooms**: rooms that in the trailing week saw both an
owner-side mutation and a real external read. It is the right north star for an internal tool
because it counts the thing the tool exists to do — a colleague put documents somewhere controlled
and an external party actually read them — and it cannot be gamed by adoption theatre: a room
nobody outside the company reads does not count, and a read with no upkeep behind it does not
count either. Full definition and inclusion rules are in 10.

| Metric (owned by 10) | Why this PRD is judged on it |
| --- | --- |
| **M01** Weekly Active Shared Rooms | The north star. Everything below is an input to it |
| **M08** Time to first share | The promise in the [Vision](#vision) stated as a number. If this is slow, colleagues go back to a shared cloud folder and the controls stop existing |
| **M10** Time to first rendered page (recipient sessions) | The recipient stops reading silently. This is the number that decides whether an external party ever finishes the document |
| **M20** Share of sessions on mobile, split by role | The claim in [Pillar 1](#pillar-1-the-phone-is-the-administration-surface-not-the-viewer) is that administration happens on a phone. M20 is where we find out, and it is measure-only by design: we own the number instead of arguing about it (A02) |
| **M39** Mobile Core Web Vitals pass rate | The release gate in MF-5, not an aspiration. Only 48% of mobile sites pass all three (CrUX, July 2025) |
| **M49** Accidental deletion rate | [Pillar 2](#pillar-2-nothing-consequential-happens-by-accident) as a measurement. On a thumb-sized screen an unnoticed destructive action is a data-loss bug, and this is how we prove we do not have one |
| **M50** Unintended access incidents | The only metric in the set with a zero threshold. The tool's whole reason to exist over a shared folder is that access is controlled and revocable |
| **M46** One-handed task success | MF-6 as a measurement, from moderated sessions rather than from telemetry |

Guardrails and counter-metrics are 10's to define and are not restated here; the two this PRD
leans on hardest are that recipient friction must never be increased to improve an owner-side
number (Pillar 4), and that upload reliability (M40, M41) must never be traded for storage cost
(Pillar 3).

## Assumptions

Each assumption is falsifiable and has an owner. Where an assumption is load-bearing for scope,
its failure mode is stated.

| ID | Assumption | If false |
| --- | --- | --- |
| A01 | The tool serves the whole company rather than one team: the room, folder, file and share model is general enough that no department needs a variant of it | If a department's process cannot be expressed as rooms, folders and grants, it is out of scope rather than a reason to fork the model |
| A02 | Mobile-first is an assumption about *our* people and *our* recipients, not a claim about aggregate traffic. We assume recipient sessions and away-from-desk staff sessions skew heavily to phones even though aggregate traffic does not | If M20 shows owner-side phone sessions stalling below 30% after R2, the `expanded` enhancements are promoted ahead of R3 scope |
| A03 | Colleagues will trust a phone with permission changes if the consequence is stated before commit | If not, R2 adds a confirm-by-email step for irreversible permission changes |
| A04 | A responsive installable PWA is sufficient for R1, R1.1 and R2, with native shells deferred | If a required capability (true background upload, OS share target on iOS, biometric app lock) blocks adoption, the native evaluation moves from R3 into R2 |
| A05 | External recipients will read without creating an account, and staff will accept that in exchange for the recipient actually reading the document | If staff demand an identified viewer on every view, the email-capture gate moves from R2 into R1.1 |
| A06 | Filename search plus a good folder structure is enough for R1; content search can wait | If R1 telemetry shows M19 search success persistently low with a high zero-result share, content search is promoted from R2 into R1.1 |
| A08 | A single team of five can deliver R1 in about 9 sprints on the existing baseline, given that persistence and object storage are the only genuinely new infrastructure | Scope is cut in the order stated by the cut lines in [11-master-backlog.md](./11-master-backlog.md), never by dropping a mobile equivalent |
| A09 | Server-side preview rendering is cheaper and safer than client-side parsing, given the roughly 100 to 200 MB mobile Safari memory ceiling and the iOS canvas caps | If rendering cost per room is prohibitive, previews become size-tiered with a documented threshold |
| A10 | Watermarking, the per-viewer access log and link expiry can wait until R1.1 without staff refusing to put sensitive material in the tool at all | This is the sharpest assumption in the document. Tracked as risk R07. If teams refuse to move real material into R1, R1.1's contents are pulled into R1 and E06 filters are pushed out |
| A11 | GDPR-grade privacy posture (data residency choice, deletion within a stated window, recipient tracking disclosure) is sufficient; the tool does not carry HIPAA, SOC 2 or FedRAMP obligations | The out-of-scope boundaries hold. If a regulated workflow needs one of those regimes, it is a separate programme, not a feature of this tool |
| A12 | Email deliverability is a solved problem via the company's provider, and magic-link and invite email will not be blocked by an external recipient's corporate mail filter | If magic links are unreliable for recipients, the public-link path with a link password becomes the primary recipient route and the invite path becomes secondary |
| **A13** | **The company identity provider (SSO / OIDC) is the primary sign-in path for staff.** The email-and-password, magic-link, passkey and biometric requirements in FR-AUTH remain in scope as the fallback for staff and as the only path for external recipients, who must still be able to open a link with **no account at all**. No new SSO requirement set is written in this pass | If the identity provider cannot be integrated in R1, the existing FR-AUTH requirements are already sufficient to ship: SSO becomes an addition rather than a blocker. The open question of *which* provider, and whether SCIM provisioning rides with it, is tracked in [12-risks-and-open-questions.md](./12-risks-and-open-questions.md) and must be answered before E12's provisioning stories are estimated |

**Withdrawn in the internal-tool rework.** A07 (pricing shape and competitor price anchors) is
withdrawn: the tool is not sold, so there is no price to assume. Nothing replaces it. A01 was
rewritten from a market-reachability assumption into an internal-coverage assumption; the
market-sizing figures it carried are gone, not moved.

## Constraints

| Category | Constraint |
| --- | --- |
| Technical baseline (fixed, do not re-architect) | Turborepo monorepo, pnpm 10, Node >= 22.12. `apps/web` is a Vite 8 plus React 19 SPA delivered as an installable PWA. `apps/api` is NestJS 11 REST under `/api` with a global ValidationPipe (whitelist, transform, forbidNonWhitelisted). `packages/shared` (`@dataroom/shared`) is the single typed contract both sides import. Tests are Jest for the API and Vitest plus Testing Library for the web app |
| Persistence | Currently an in-memory seed in `documents.service.ts`. The data model is genuinely greenfield, so the entity design in [09-domain-model-and-glossary.md](./09-domain-model-and-glossary.md) is a real decision, and landing a real repository is on the R1 critical path |
| Contract discipline | Any new DTO, enum or envelope crosses through `packages/shared`. No duplicated types on either side |
| Platform, iOS | No Background Fetch, no Background Sync, no `showSaveFilePicker` or `showDirectoryPicker`, no `share_target`, web push only for Home Screen web apps, no `beforeinstallprompt`, no API to force a biometric re-check, roughly 100 to 200 MB page memory ceiling with no catchable exception, single canvas capped at 16,777,216 pixels with an additional total canvas memory budget |
| Platform, both | Pages are frozen (timers and fetch callbacks stop) and discarded (no code runs) aggressively on mobile; `unload` does not fire when a tab is closed from the mobile tab switcher, so `pagehide` and the transition to hidden are the last reliable save points. Assume roughly 30 seconds of service-worker runtime, not a background daemon |
| Platform, Android | The system back gesture owns both screen edges and apps may only exclude 200 dp per edge, so edge-started row swipes are unreliable. Predictive back is on by default from Android 13, so every sheet, selection mode and preview must be a popable history entry |
| Storage | Client storage is evictable and all-or-nothing per origin: IndexedDB, Cache API and OPFS vanish together. WebKit deletes script-created storage for an origin with no user interaction in the last seven days. `navigator.storage.estimate()` is deliberately imprecise |
| Upload protocol | S3 multipart imposes a 5 MiB minimum part size and 10,000 parts; GCS resumable requires 256 KiB multiples and recommends 8 MiB chunks. The plan of record is tus-style semantics at the edge with adaptive chunk size, small on cellular, 5 to 8 MiB on Wi-Fi, fanning out to multipart behind the gateway. Size chunking against an effective uplink of 1 to 3 Mbps, not against download headlines: even on fast US networks median upload is roughly 12 Mbps |
| Accessibility | WCAG 2.2 AA is a release gate, not a backlog item. SC 1.3.4 forbids orientation locking, so the landscape phone case must be designed |
| Team and time | One team of five. R1 estimated at 9 two-week sprints, R1.1 at 2 |
| Governance | Every limit in the product — storage quota, retention window, rate limit — is an administrator-set configuration value with an explicit default stated in [06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md), never a hard-coded constant and never derived from a purchased plan. A screen that shows such a number names the figure and where it came from |
| Identity | Staff sign-in is expected to run through the company identity provider (A13). The FR-AUTH requirement set stays as the fallback and as the external-recipient path, and the recipient path must work with no account at all |
| Legal and privacy | GDPR applies. Sharing copy, link-expiry semantics, recipient tracking disclosure and activity-log retention require legal review before R1 exit |

## Dependencies

| Dependency | Needed by | Owner | Notes |
| --- | --- | --- | --- |
| Relational persistence layer replacing the in-memory seed | R1 S1 | Engineering | On the critical path. Schema comes from [09-domain-model-and-glossary.md](./09-domain-model-and-glossary.md) |
| Object storage with presigned access and multipart support | R1 S1 | Engineering | Region choice interacts with GDPR residency (A11) |
| Resumable-upload gateway with tus-style semantics | R1 S6 | Engineering | Cannot be deferred; foreground-only resumability is the whole upload story on iOS |
| Server-side preview and thumbnail rendering service | R1 S7 | Engineering | Required by A09. Must stream page images, not whole documents |
| Transactional email provider | R1 S3 | Engineering | Magic links, invites, verification, R1 notifications |
| Analytics and RUM pipeline with a device-class dimension | R1 S2 | Engineering plus Data | Needed to own the mobile-share number we could not source (A02, M20) |
| Design system tokens and component library at 360 px first | R1 S1 | Design | E09 is blocked without it |
| Malware scanning on upload | R1 S6 | Engineering plus Security | Uploads come from phones and go outward to external recipients (BR-225, BR-226) |
| Company identity provider integration, or the decision not to have one in R1 | R1 S3 | Engineering plus IT | A13. Which provider is an open question in [12-risks-and-open-questions.md](./12-risks-and-open-questions.md); the FR-AUTH fallback means this does not block R1 |
| Administrator role and joiner/leaver process agreed with IT | R1 S9 | Product plus IT | E12's provisioning and deprovisioning stories cannot be estimated until the process is named |
| Server-side watermark rendering in the preview pipeline | R1.1 | Engineering | The watermark must be baked into the rendered tile, so it is a change to the R1 rendering service rather than a client feature |
| Web push infrastructure (VAPID) | R2 | Engineering | Android and installed iOS only; email remains the guaranteed channel |
| Three internal teams willing to run a live process on R1 | R1 exit | Product | An R1 exit criterion, so recruit during S1 to S4 |
| Legal review of sharing, retention, tracking disclosure and activity-log copy | R1 exit | Legal | Blocks R1 exit, not R1 development. The tracking disclosure specifically blocks R1.1 exit |

## Definition of Ready

A story may enter a sprint only when every clause is true. A story failing any clause is
returned, not negotiated down.

1. It carries a stable `US-E<nn>-<mm>` ID and links to its epic in [04-epics.md](./04-epics.md).
2. It cites the `FR-` and `BR-` identifiers it implements, and the `NFR-` categories it will be
   judged against.
3. It has a MoSCoW priority and a release tag of R1, R1.1, R2 or R3 **matching the tag 05 carries
   for the requirements it implements**, and a Fibonacci estimate that is not 13.
4. Acceptance criteria are written in given/when/then and are verifiable by a QA engineer holding
   a phone, with no access to a desktop.
5. **Mobile clause.** The story states the `compact` (360 px) behaviour explicitly, and where
   relevant the `medium`, `expanded` and `large` enhancement, using the class names in the
   [size-class ladder](#responsive-size-class-ladder) rather than pixel values of its own. If it
   touches a primitive in the
   [touch-equivalence mapping](#normative-touch-equivalence-mapping), it names the equivalent it
   implements.
6. Its empty, loading, offline, error, permission-denied and partial-failure states are specified,
   not left to implementation.
7. Any destructive or access-changing behaviour states its confirmation copy, its counts, its
   undo window and its audit event.
8. A compact-width design artefact exists, and it is the first artefact, per MF-1.
9. Analytics events it emits are named in snake_case and **already present in 10's event
   dictionary** ([10-success-metrics-and-analytics.md](./10-success-metrics-and-analytics.md)). An
   event a story invents but 10 does not define is a blocked story, not a documentation follow-up.
10. Its dependencies are landed or explicitly sequenced ahead of it in the same sprint.

## Definition of Done

Every clause is checked per story, not per release.

1. Code merged behind a feature flag where the change is user-visible and incomplete, with the
   flag's removal ticketed.
2. Shared types added or changed only in `packages/shared`, consumed by both apps.
3. Unit tests (Vitest for web, Jest for API) plus at least one integration test per acceptance
   criterion; server-side authorisation tested by calling the API directly with a token of each
   relevant role, including a Viewer token attempting every mutating verb.
4. All acceptance criteria demonstrated, and the negative paths demonstrated too.
5. Analytics events fire with the specified payloads, verified in a live session.
6. **Mobile clause, device.** Verified on the reference device (Galaxy A24 4G class) and on an
   iPhone SE 3rd generation, in both portrait and landscape, in light and dark theme, at the
   largest system text size.
7. **Mobile clause, network.** Verified on the reference network profile, and once with the
   network dropped mid-action: the result is an honest state (an offline banner, a paused upload
   with a "reopen to continue" message, a queued mutation), never a silent failure, an infinite
   spinner, or a claim the platform cannot honour.
8. **Mobile clause, one-handed.** Verified one-handed, thumb only, standing, with every primary
   action inside the thumb zone and every interactive target at least 48 CSS px with 8 px
   separation.
9. **Mobile clause, touch equivalence.** If the story adds or changes a desktop primitive, its
   named mobile equivalent is implemented and verified in the same pull request. A pull request
   that ships the desktop half alone is rejected.
10. **Mobile clause, performance.** The route stays inside its byte and blocking budget on the CI
    throttling profile, no single task exceeds 50 ms during list scroll, selection-mode toggle or
    breadcrumb navigation, and the route's lab CWV proxies are inside the good band.
11. **Mobile clause, accessibility.** Zero automated WCAG 2.2 AA violations, plus a manual pass
    on SC 1.3.4, 1.4.4, 1.4.10, 2.1.1, 2.4.11, 2.5.1, 2.5.2, 2.5.3, 2.5.7, 2.5.8, 3.3.7, 3.3.8
    and 4.1.3, and a screen-reader pass with VoiceOver and TalkBack on the affected screens.
12. **Mobile clause, degraded offline.** Read paths render from cache with a "Cached copy" label
    where a cache exists; write paths queue or refuse honestly. No path assumes durable local
    storage.
13. Copy reviewed against the honest-capability rule (MF-9), including any string about
    uploading, downloading, offline availability or notifications.
14. Documentation updated: the relevant `FR`, `BR`, `NFR` and backlog entries reflect what
    shipped, and any deviation is recorded in
    [12-risks-and-open-questions.md](./12-risks-and-open-questions.md).
15. Product owner accepted the story on a phone. Acceptance on a desktop does not count.

## Stakeholders and RACI

R responsible, A accountable, C consulted, I informed.

| Activity | Product (Lead BA / PM) | Engineering lead | Design lead | QA lead | Security and legal | Internal tooling sponsor | IT / identity and administration |
| --- | --- | --- | --- | --- | --- | --- | --- |
| This PRD, scope and release tags | R | C | C | C | C | A | I |
| Epic and story definition | R | C | C | C | I | I | C |
| Mobile-first mandate and touch-equivalence mapping | A | C | R | C | I | I | I |
| Responsive size-class ladder | A | C | R | C | I | I | I |
| Interaction system and design system (E09) | C | C | R | C | I | I | I |
| Domain model, API contract, persistence | C | R | I | C | C | I | I |
| Non-functional budgets and their instrumentation | C | R | C | A | C | I | I |
| Access-control model and read-only enforcement | C | R | C | C | A | I | C |
| Privacy, retention, recipient tracking disclosure, sharing copy | C | C | C | I | A | C | I |
| Storage quota defaults, retention settings, administrator role | C | C | I | I | C | A | R |
| Identity provider choice and staff provisioning (A13) | C | C | I | I | C | A | R |
| Release go or no-go against exit criteria | R | C | C | A | C | A | I |
| Recruiting internal teams to run a live process on R1 | R | I | I | I | I | A | C |
| Analytics event dictionary and metric definitions | R | C | I | C | I | C | I |

## Glossary pointer

Every domain term used in this document set (room, item, folder, file, share, link, role,
effective permission, inheritance, override, staging tray, blast radius, detent, thumb zone,
reference device, compact and expanded width, and the rest) is defined once in
[09-domain-model-and-glossary.md](./09-domain-model-and-glossary.md). If a term in this PRD is
ambiguous, the glossary wins, and the ambiguity is a defect in this file.
