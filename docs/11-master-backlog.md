# Master Backlog

## Purpose

This document is the single ordered list of every user story in the product. It flattens the twelve
epic backlog files into one execution sequence, states the prioritisation model that produced that
sequence, proposes a sprint-by-sprint plan for R1, names the stories that block the most other work,
sets out the order in which scope comes off if the R1 date is at risk, and records every
inconsistency found across the twelve source files so it can be fixed at source.

There are 213 stories and 1,101 story points. Nothing has been summarised away: every story in every
epic file appears as its own row in the master story index below.

## Related documents

- [Documentation index](./README.md)
- [Product overview](./03-product-overview.md)
- [Epics](./04-epics.md)
- [Functional requirements](./05-functional-requirements.md)
- [Business rules & permissions](./06-business-rules-and-permissions.md)
- [Non-functional requirements](./07-non-functional-requirements.md)
- [Mobile UX spec](./08-mobile-ux-spec.md)
- [Success metrics & analytics](./10-success-metrics-and-analytics.md)

The twelve epic backlog files this document indexes:

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

---

## How this backlog is ordered

Four rules produced the rank column in the master story index. They are applied in this order, and
where they disagree the earlier rule wins.

**Rule 1 — Dependency order is absolute.** The index is a topological sort of the dependency graph
before it is anything else. No story is ranked above a story it depends on, and no story is scheduled
into a sprint at or before the sprint of any of its prerequisites. This rule beats value, beats
MoSCoW and beats release. Where an epic declared a cross-epic prerequisite in its "Epic summary →
Depends on" row but its individual stories did not carry that prerequisite down to story level, the
edge has been added here and marked with a dagger (†) in the Depends-on column. See RN-08.

**Rule 2 — Release before priority.** R1 (MVP) exhausts before R2 (fast-follow), which exhausts
before R3 (later). A Must in R2 ranks below a Could in R1, because the release tag is a commercial
commitment and MoSCoW is a within-release ordering device. The one exception is a story that R1 work
depends on: it is pulled into R1 and its Release cell shows the move (currently one story,
US-E01-13, see RN-02).

**Rule 3 — A mobile foundation story outranks a desktop enhancement story, every time.** This is not
a tiebreak, it is a hard ordering. Inside each release, stories are placed in three tiers:

1. *Foundation* — the interaction system and the contracts everything else is assembled from: all of
   E09, plus US-E01-01 (the subject model), US-E08-01 (the canonical name), US-E10-01 (the children
   listing contract) and US-E10-02 (list virtualisation). These are built first even though several
   of them have no user-visible demo, because every screen in the product is made of them and every
   acceptance criterion elsewhere assumes their behaviour.
2. *Touch-primary product work* — everything that a person holding a 360 px phone can do.
3. *Desktop and large-screen enhancement* — the stories whose value only appears at >= 840 dp or with
   a fine pointer and a hardware keyboard: US-E01-11, US-E03-13, US-E04-18, US-E05-15, US-E05-16,
   US-E06-17, US-E09-18. Every one of these is ranked last inside its release.

The rule has already done useful work: **R1 contains no desktop enhancement story at all.** All seven
sit in R2. That is the intended outcome of a mobile-first backlog, and it is also why the cut lines
below cannot start by dropping desktop scope, because there is none in R1 to drop.

**Rule 4 — WSJF-style value over effort inside a tier.** Where Rules 1 to 3 leave two stories
interchangeable, the tiebreak is a cost-of-delay-divided-by-size judgement, evaluated as:

| Factor | How it was scored |
| --- | --- |
| Blocking weight | The count of stories that transitively depend on this one. This is the dominant term, because an unblocked team is worth more than any single feature. It is a computed number, not a judgement. |
| MoSCoW | Must before Should before Could, inside equal blocking weight. |
| Persona reach | A story serving P1/P6 (the owners who pay) or P2/P5 (the recipients whose abandonment kills the deal) before one serving a single power user. |
| Size | Smaller first at equal value, because a 3-point story that unblocks a 45-point sprint is worth more than an 8-point story that unblocks nothing. |

Estimate: no R1 story is a 13. The single 13 in the whole backlog is US-E06-16 (OCR, R3), which is
correctly flagged as needing a split before it is ever pulled into a sprint.

Two consequences of this model are worth stating plainly because they will look wrong to someone
reading the index for the first time. First, sprints 1 and 2 deliver almost nothing a user can see:
they deliver tokens, breakpoints, a subject model, a listing contract and a name-normalisation
library. Second, several high-visibility features that a stakeholder would call "the product"
(US-E07-09, the recipient opening a link with no account; US-E05-07, the PDF viewer) land in sprints
10 and 11, because each sits on top of eight to eleven prerequisites. Both are the dependency graph
being honest rather than the priorities being wrong.

---

## Backlog summary

Counts are taken from the twelve epic files as written. Every epic's declared "Story count" and
"Total points" was checked against the stories actually present in that file; all twelve agree.

### R1 — MVP

| Epic | Stories | Points |
| --- | ---: | ---: |
| E01 Access & Identity | 10 | 47 |
| E02 Data Rooms & Workspace Home | 12 | 48 |
| E03 Folder Hierarchy & Navigation | 15 | 68 |
| E04 File Operations | 14 | 75 |
| E05 Viewing, Preview & File Details | 12 | 57 |
| E06 Search & Discovery | 12 | 51 |
| E07 Sharing & Access Control | 16 | 84 |
| E08 Conflict Resolution & Data Integrity | 15 | 68 |
| E09 Mobile UX Foundations | 16 | 96 |
| E10 Performance, Offline & Scale | 17 | 94 |
| E11 Trust, Audit & Notifications | 13 | 67 |
| E12 Account, Storage & Governance | 14 | 76 |
| **R1 total** | **166** | **831** |

### R2 — Fast-follow

| Epic | Stories | Points |
| --- | ---: | ---: |
| E01 Access & Identity | 8 | 40 |
| E02 Data Rooms & Workspace Home | 6 | 28 |
| E03 Folder Hierarchy & Navigation | 3 | 11 |
| E04 File Operations | 4 | 26 |
| E05 Viewing, Preview & File Details | 5 | 25 |
| E06 Search & Discovery | 4 | 19 |
| E07 Sharing & Access Control | 2 | 13 |
| E08 Conflict Resolution & Data Integrity | 3 | 24 |
| E09 Mobile UX Foundations | 2 | 13 |
| E10 Performance, Offline & Scale | 1 | 8 |
| E11 Trust, Audit & Notifications | 5 | 34 |
| E12 Account, Storage & Governance | 3 | 16 |
| **R2 total** | **46** | **257** |

### R3 — Later

| Epic | Stories | Points |
| --- | ---: | ---: |
| E06 Search & Discovery (US-E06-16 OCR) | 1 | 13 |
| **R3 total** | **1** | **13** |

### Grand total and capacity

| | Stories | Points |
| --- | ---: | ---: |
| R1 | 166 | 831 |
| R2 | 46 | 257 |
| R3 | 1 | 13 |
| **Grand total** | **213** | **1,101** |

Two reconciliation decisions move points between releases. RN-02 promotes US-E01-13 (step-up
re-authentication, 5 points) from R2 to R1 because three R1 Must stories cannot satisfy BR-045
without it. RN-13 promotes US-E12-18 (account deletion, 5 points, already counted in the E12 R1 row
above) because FR-ACCT-024, FR-ACCT-025 and FR-AUTH-028 are all Must / R1 and all three name E12.
Applying them gives a planning figure of **R1 = 167 stories / 836 points** and
**R2 = 45 stories / 252 points**. The sprint plan and the index below use the planning figure.

**Capacity.**

- **Assumption:** one delivery team of five (two back-end, two front-end, one QA engineer who also
  owns device-lab verification) on two-week sprints, with a product designer and a business analyst
  shared across the programme rather than dedicated. No second team, no offshore augmentation.
- **Assumption:** the team's steady-state velocity is 45 story points per two-week sprint, ramping
  through 30 points in each of sprints 1 and 2 while the toolchain, the reference device lab and the
  component library bed in.
- **Assumption:** a two-week sprint zero precedes sprint 1 and carries no story points.
- **Estimate:** R1 at 836 points therefore needs 21 delivery sprints. With sprint zero that is 22
  sprints, **44 weeks, roughly ten and a quarter months**, to the end of R1.
- **Estimate:** R2 and R3 together are 265 points, which is 6 delivery sprints of work. They are
  sequenced across the indicative eight-sprint window S22 to S29 by dependency rather than packed to
  capacity, so that window carries roughly two sprints of slack — which is where an R1 overrun lands
  rather than being pretended away.
- **Estimate:** the whole backlog at 1,101 points therefore needs 27 delivery sprints of work,
  **54 weeks plus sprint zero**.
- **Estimate:** halving the R1 elapsed time needs a second team of five taking E05, E06 and E11 in
  parallel from sprint 8 onward, once US-E07-02, US-E09-07 and US-E10-02 exist. Before sprint 8 a
  second team has nothing to work on that is not already on the critical path, so adding people
  earlier will not compress the schedule.

Ten and a quarter months is a long MVP. The [cut lines](#cut-lines) below are the mechanism for
shortening it, and they are honest about how little they can buy: the whole ladder recovers about
four sprints. A materially earlier date requires a second team or dropping a capability wholesale,
not trimming.

---

## Sprint-zero and R1 sequencing

Every sprint below respects Rule 1 strictly: for every story in sprint *n*, all of its prerequisites
sit in a sprint strictly earlier than *n*. This was verified mechanically against the reconciled
dependency graph; there are zero violations.

### Sprint zero (2 weeks, 0 points)

Not a story sprint. Its output is the ability to start sprint 1 and the decisions that sprint 4 and
sprint 8 cannot proceed without.

- Repository, CI, environments, and the persistence layer that replaces the in-memory seed in
  `documents.service.ts`. Nothing in E10 can be measured against an in-memory fixture.
- The reference device lab: the baseline Android device class named in E10 (Galaxy A24 4G class), one
  current iPhone, one older iPhone still on a small screen, and a throttled network profile checked
  into the repo so "on 4G" means the same thing to every engineer.
- The seeded fixtures the acceptance criteria assume: a 10,000-item folder, a 200-page PDF, a 3 GB
  video, a folder tree at the depth limit, and a name set covering the Unicode, reserved-name and
  path-length cases in E08.
- The CI jobs that later stories only extend: byte-budget gate (US-E10-10), axe/WCAG gate, and the
  analytics event schema check.
- **Decisions that must close in sprint zero**, because the stories that consume them are in sprints
  4 to 8 and reworking them later is expensive: RN-15 (additive maximum versus subtractive override
  permission resolution), RN-17 (how many principal types the `Subject` union carries), RN-18 (token
  and guest-session lifetimes), RN-21 (the undo window, OQ91).

### R1 sprints

| Sprint | Points | Theme | Stories | Demoable increment |
| --- | ---: | --- | --- | --- |
| S1 | 23 | The roots: identity, tokens, names, bytes | US-E01-01, US-E09-01, US-E08-01, US-E04-01 | A token page rendering the full palette in light, dark and system at 360/600/840 dp. A contract test proving an uncredentialed request resolves to no subject and returns 401 `UNAUTHENTICATED`. A unit suite proving NFC normalisation and case-folded collision keys. A resumable upload driven from curl that survives a killed connection and resumes at the correct byte offset. |
| S2 | 29 | Breakpoints, the listing contract, the front door | US-E09-02, US-E10-01, US-E01-02, US-E12-01, US-E08-03, US-E08-02 | Sign up on a real phone at 360 x 640 with the keyboard open, no scrolling to reach the button, and land on an empty workspace home. Page a seeded 10,000-item folder through the cursor API. Name validation refusing reserved names, trailing forms and over-length paths with the exact user-facing copy. |
| S3 | 45 | The shell you can hold | US-E09-03, US-E09-05, US-E09-16, US-E01-04, US-E11-01, US-E08-04, US-E08-10, US-E10-17 | The app installed to the Home Screen: bottom navigation, correct safe areas on a notched device, 48 px item rows, dynamic type at 200 percent with no clipping or horizontal scroll, reduced-motion honoured. Sign in with platform autofill. An activity row written for every sign-in. Storage usage incrementing on write. |
| S4 | 45 | Sheets, lists that scale, sessions that last | US-E09-07, US-E10-02, US-E09-04, US-E09-13, US-E09-12, US-E09-11, US-E01-05, US-E01-06 | Scroll a 10,000-row virtualised list on the baseline Android without dropping frames or shifting layout. Open a sheet at two detents and dismiss it with the hardware back button. Skeleton to content with zero CLS. Toast with a working undo. Password reset end to end on a phone. |
| S5 | 43 | First Data Room, first guest | US-E09-06, US-E09-08, US-E09-14, US-E09-10, US-E02-01, US-E05-01, US-E01-08, US-E01-09 | Create a Data Room on a phone in under 60 seconds. Long-press a row for the action sheet; enter selection mode from it. Open a share token as a guest with no account. Sign out everywhere and watch a second device fail its next call inside one access-token lifetime. |
| S6 | 45 | Destination picker, folders, the conflict sheet | US-E09-09, US-E09-15, US-E02-02, US-E03-01, US-E05-06, US-E08-05, US-E04-08, US-E01-13, US-E10-08 | Create a folder, open the full-screen viewer, hit a name collision and choose keep-both, replace or cancel. Drive the whole flow from an external keyboard with a screen reader running. Step-up re-authenticate on return to the app. |
| S7 | 44 | Invisibility, roles, and the activity log | US-E02-03, US-E07-01, US-E08-06, US-E02-06, US-E04-09, US-E12-03, US-E10-14, US-E11-02 | A second account requesting a room it has no grant on receives a response byte-identical to the response for an id that never existed (BR-049). Move a file with the picker. Stream a 3 GB file in and out without the API breaching its memory ceiling. Read the room's activity as plain English on a 360 px screen. |
| S8 | 44 | Permissions resolved, folders browsed, trash that holds | US-E07-02, US-E03-03, US-E02-04, US-E08-14, US-E07-03, US-E11-07, US-E08-09 | Drill from the workspace home into nested folders. A Viewer's every mutating verb refused with the typed error, proven verb by verb. Delete to trash and restore, with the real purge date shown. A view session recorded with dwell that does not count a backgrounded tab. **RN-15 must already be closed before this sprint starts.** |
| S9 | 45 | Share it, find it, upload it | US-E03-04, US-E06-01, US-E07-04, US-E04-02, US-E02-07, US-E07-07, US-E11-12, US-E03-08, US-E04-14 | Upload from the device picker with a visible tray. Mint a public link in three taps. Invite a named email. Search a room by filename with permission filtering proven by a negative test. Breadcrumb collapse at 360 px. Download one file with honest destination copy. |
| S10 | 45 | The PDF, the link controls, who-can-see-what | US-E06-02, US-E07-13, US-E02-08, US-E07-06, US-E05-07, US-E04-04, US-E11-04, US-E04-06, US-E05-05, US-E07-05 | First page of a 200-page PDF on the baseline device inside its stated budget. Set expiry, password and download-off on a link. The share-management screen answering "who can see what" for a whole room. An upload refused for quota, size or type with the exact reason named. |
| S11 | 45 | The recipient path and revocation | US-E06-03, US-E06-04, US-E02-11, US-E07-09, US-E07-11, US-E10-10, US-E03-07, US-E05-04, US-E03-17 | On a clean phone with no account, tap an emailed link and be reading the document in two taps. Revoke it and prove the open session stops inside the measured immediacy contract. CI failing a pull request that pushes the initial route over its byte budget. |
| S12 | 45 | Delete safely, quota honestly, resume where you were | US-E06-05, US-E06-07, US-E10-07, US-E11-15, US-E04-12, US-E12-05, US-E01-03, US-E02-05, US-E03-05 | Delete a file to trash with a working undo. An upload refused before a single byte moves because it would exceed quota. Background the app mid-scroll, get discarded, return to the same row. Search results that jump to the containing folder. Shared-with-me as the recipient's home. |
| S13 | 43 | Camera capture, staging, concurrency in the hand | US-E06-08, US-E06-09, US-E08-12, US-E01-07, US-E04-03, US-E04-10, US-E05-02, US-E08-07, US-E08-11 | Photograph a document straight into a folder. Stage items, browse, paste. Two phones mutating the same folder producing a 409 and the stale-version sheet rather than a lost write. Lockout stating the exact wait. |
| S14 | 45 | Cascade delete, bulk results, field vitals | US-E10-06, US-E10-12, US-E03-09, US-E03-10, US-E04-13, US-E02-09, US-E06-10, US-E03-12 | Delete a folder behind the exact-integer cascade warning and the second confirmation above the threshold. Move forty files and receive a per-item result list naming each failure. Real LCP, INP and CLS from a real device arriving in the dashboard attributed to route and device class. |
| S15 | 44 | Offline reads and the long tail of share and preview states | US-E10-15, US-E03-02, US-E05-10, US-E05-11, US-E06-06, US-E06-11, US-E06-12, US-E07-08, US-E07-10, US-E07-12, US-E10-03, US-E11-03, US-E11-08 | Airplane mode showing a previously visited folder labelled "Cached copy, may be cleared by your browser". An unsupported type offering a route out instead of a dead end. A password-gated link. The revoked-recipient screen. A download recorded as a download, never as a view. |
| S16 | 44 | Deep links, restore, upload recovery | US-E11-11, US-E12-07, US-E03-06, US-E03-11, US-E03-14, US-E03-15, US-E04-05, US-E04-07, US-E04-11, US-E02-16 | A folder deep link opening that folder for a guest and 404ing for a stranger. Restore a deleted folder with its whole subtree. Resume a stuck upload after a tunnel. The recipient-disclosure screen. What still works when storage is full. |
| S17 | 45 | Reading a document properly, changing a grant safely | US-E05-03, US-E05-08, US-E05-09, US-E05-12, US-E07-14, US-E07-15, US-E08-08, US-E08-13, US-E08-15 | Pinch-zoom and fit-to-width on a dense P&L. Jump to page 84, get interrupted, come back to page 84. Revoke while the buyer is mid-read and watch the page stop. Change a role with an explicit widening warning. Permanent delete behind two irreversible steps. |
| S18 | 45 | Scale proof, optimistic UI, numbers the owner trusts | US-E10-04, US-E10-09, US-E10-11, US-E10-18, US-E11-05, US-E11-06, US-E11-13, US-E12-04, US-E12-08 | The seeded 10,000-item soak harness passing on the baseline device. An optimistic move rolling back visibly and typed when the server refuses. Quota warnings at 75, 90 and 100 percent, and a reclaim-space screen that states the byte saving before the tap. A one-tap actionable notification. |
| S19 | 41 | Destructive room actions and the administrator role | US-E02-13, US-E12-06, US-E07-16, US-E10-13, US-E11-14, US-E12-02, US-E01-10, US-E10-05, US-E12-24 | Delete a room behind the blast-radius statement and step-up re-authentication, then restore it. Revoke every share on a room in one action. The "your counterparty opened it" notification landing on the owner's phone. Magic-link sign-in. Prefetch on wifi, off on cellular. Every governance endpoint refusing a room Owner's session with a recorded `access-denied`, and refusing an administrator the contents of a room they hold no grant on with the same 404 a stranger gets. |
| S20 | 18 | Governance: the quota an administrator sets, and the joiner flow | US-E12-19, US-E12-21, US-E12-18 | Set a room's storage ceiling on a phone and watch the storage screen name the figure, the source and who set it. Provision a colleague, have them activate with a passkey, and see the provisioning written to the activity log with the administrator as the actor. Request account deletion and see the exact blast radius in counts and bytes with the purge date. |
| S21 | 13 | Governance: the leaver flow, and lowering a limit without losing data | US-E12-20, US-E12-22 | Lower a room's ceiling below its current usage: nothing is deleted, the room refuses new bytes, revocation still works, and every affected Owner is notified with the shortfall and the deadline. Run a leaver: deprovisioning refused until the rooms they own have an Owner, then one atomic operation that ends every session inside BR-108's target, revokes the shares they created, and destroys nothing. |

R2 lands in sprints 22 to 29 and R3 completes alongside it. Those sprints are not planned story by
story here, because ten sprints of R1 learning should be allowed to reorder them.

---

## Master story index

Every one of the 213 stories, in prioritised execution order. Sprint numbers are assigned for the
whole backlog so no row is blank; sprints 1 to 21 are the planned R1 sequence above, 22 to 29 are the
indicative R2/R3 window.

A dagger (†) in the Depends-on column marks a dependency this index added or corrected relative to
the source file; every one is recorded in [Reconciliation notes](#reconciliation-notes). A dagger in
the Release column marks a release tag this index changed. "P*n* (internal)" in the Persona column
means the story is written from an engineer's or PM's point of view but names the persona it serves;
"Internal" means it names none (see RN-24).

| Rank | Story ID | Title | Epic | Persona | MoSCoW | Release | Points | Depends on | Sprint |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1 | US-E01-01 | Identity, subject and actor model | E01 Access & Identity | P1 (internal) | Must | R1 | 5 | — | S1 |
| 2 | US-E09-01 | Design tokens and the theme foundation | E09 Mobile UX Foundations | Internal | Must | R1 | 5 | — | S1 |
| 3 | US-E09-02 | The responsive size-class ladder and the progressive-enhancement contract | E09 Mobile UX Foundations | Internal | Must | R1 | 5 | US-E09-01 | S2 |
| 4 | US-E09-03 | App shell: safe areas, bottom navigation, sticky breadcrumb and the standalone back affordance | E09 Mobile UX Foundations | P1 | Must | R1 | 8 | US-E09-01, US-E09-02 | S3 |
| 5 | US-E10-01 | Cursor-paginated children listing contract | E10 Perf, Offline & Scale | P4 (internal) | Must | R1 | 8 | US-E01-01† | S2 |
| 6 | US-E09-05 | The item row component | E09 Mobile UX Foundations | P2 | Must | R1 | 5 | US-E09-01, US-E09-02 | S3 |
| 7 | US-E09-07 | The sheet system: detents, grabber, one-sheet rule, popable history | E09 Mobile UX Foundations | P5 | Must | R1 | 8 | US-E09-03 | S4 |
| 8 | US-E08-01 | The canonical name: normalisation, case folding and the collision key | E08 Conflict & Integrity | P4 (internal) | Must | R1 | 5 | — | S1 |
| 9 | US-E10-02 | Virtualised folder list that survives 10,000 items | E10 Perf, Offline & Scale | P4 | Must | R1 | 8 | US-E10-01, US-E09-05† | S4 |
| 10 | US-E09-04 | Bottom action bar and the contextual thumb-zone rule | E09 Mobile UX Foundations | P1 | Must | R1 | 5 | US-E09-03 | S4 |
| 11 | US-E09-06 | Long-press action sheet: the mobile context menu | E09 Mobile UX Foundations | P4 | Must | R1 | 5 | US-E09-05, US-E09-07 | S5 |
| 12 | US-E09-08 | Selection mode and the contextual action bar | E09 Mobile UX Foundations | P4 | Must | R1 | 5 | US-E09-04, US-E09-05 | S5 |
| 13 | US-E09-13 | Toast, undo and the status announcer | E09 Mobile UX Foundations | P6 | Must | R1 | 5 | US-E09-03 | S4 |
| 14 | US-E09-09 | The destination picker: the touch replacement for drag-and-drop and split view | E09 Mobile UX Foundations | P4 | Must | R1 | 8 | US-E09-07, US-E09-08 | S6 |
| 15 | US-E09-14 | The destructive-action confirmation pattern | E09 Mobile UX Foundations | P4 | Must | R1 | 5 | US-E09-07, US-E09-13 | S5 |
| 16 | US-E09-12 | Loading, skeletons, empty states and long-list landmarks | E09 Mobile UX Foundations | P2 | Must | R1 | 8 | US-E09-05, US-E09-02 | S4 |
| 17 | US-E09-15 | Screen-reader semantics, roving tabindex and full keyboard operation | E09 Mobile UX Foundations | P3 | Must | R1 | 8 | US-E09-05, US-E09-07, US-E09-08 | S6 |
| 18 | US-E09-11 | Sticky breadcrumb rail and the collapsed path chip | E09 Mobile UX Foundations | P3 | Must | R1 | 3 | US-E09-03 | S4 |
| 19 | US-E09-10 | Keyboard avoidance and focus that is never obscured | E09 Mobile UX Foundations | P1 | Must | R1 | 5 | US-E09-07 | S5 |
| 20 | US-E09-16 | Dynamic type, reflow, orientation, reduced motion, and honest capability copy | E09 Mobile UX Foundations | P5 | Must | R1 | 8 | US-E09-01, US-E09-02 | S3 |
| 21 | US-E01-02 | Sign up with email and password on a phone | E01 Access & Identity | P1 | Must | R1 | 5 | US-E01-01 | S2 |
| 22 | US-E01-04 | Sign in with email and password | E01 Access & Identity | P1 | Must | R1 | 3 | US-E01-01, US-E01-02 | S3 |
| 23 | US-E01-05 | Session issuance, refresh and mobile session longevity | E01 Access & Identity | P1 | Must | R1 | 5 | US-E01-01, US-E01-04 | S4 |
| 24 | US-E02-01 | Create a Data Room from a phone in under 60 seconds | E02 Data Rooms | P1 | Must | R1 | 5 | US-E01-01, US-E01-05 | S5 |
| 25 | US-E02-02 | Room ownership and owner-only actions | E02 Data Rooms | P1 | Must | R1 | 3 | US-E02-01 | S6 |
| 26 | US-E02-03 | The invisibility rule, enforced on the server | E02 Data Rooms | P1 | Must | R1 | 5 | US-E02-01, US-E02-02 | S7 |
| 27 | US-E07-01 | The role model and the server-side authorisation kernel | E07 Sharing & Access | P1 (internal) | Must | R1 | 8 | US-E01-01, US-E02-02 | S7 |
| 28 | US-E03-01 | Create a folder | E03 Folders & Nav | P1 | Must | R1 | 3 | US-E02-01 | S6 |
| 29 | US-E07-02 | Permission resolution: inheritance, override and effective permission | E07 Sharing & Access | P1 | Must | R1 | 8 | US-E07-01 | S8 |
| 30 | US-E03-03 | Drill-down folder browsing on a 360 px screen | E03 Folders & Nav | P2 | Must | R1 | 5 | US-E03-01, US-E02-03, US-E10-01† | S8 |
| 31 | US-E05-01 | The list row: what a file looks like on a 360 px screen | E05 Viewing & Preview | P2 | Must | R1 | 5 | US-E09-05†, US-E10-02† | S5 |
| 32 | US-E12-01 | Account, limits and capability payload | E12 Account & Governance | Internal | Must | R1 | 5 | US-E01-01† | S2 |
| 33 | US-E11-01 | Activity event contract and append-only write path | E11 Trust & Audit | P1 (internal) | Must | R1 | 8 | US-E01-01† | S3 |
| 34 | US-E03-04 | Breadcrumb navigation and its collapse behaviour | E03 Folders & Nav | P1 | Must | R1 | 5 | US-E03-03 | S9 |
| 35 | US-E06-01 | Search API: filename matching, normalisation and permission filtering | E06 Search | P3 (internal) | Must | R1 | 8 | US-E08-01†, US-E07-02† | S9 |
| 36 | US-E06-02 | A search affordance a thumb can always reach | E06 Search | P4 | Must | R1 | 3 | US-E06-01, US-E09-03† | S10 |
| 37 | US-E08-03 | Name length and total path length limits | E08 Conflict & Integrity | P4 | Must | R1 | 3 | US-E08-01 | S2 |
| 38 | US-E05-06 | The full-screen viewer shell | E05 Viewing & Preview | P2 | Must | R1 | 5 | US-E05-01, US-E09-07† | S6 |
| 39 | US-E04-01 | Resumable upload session and chunk transport | E04 File Ops | P6 (internal) | Must | R1 | 8 | — | S1 |
| 40 | US-E08-04 | The deterministic keep-both suffix | E08 Conflict & Integrity | P4 | Must | R1 | 3 | US-E08-01, US-E08-03 | S3 |
| 41 | US-E02-04 | Workspace home: My rooms on a 360 px screen | E02 Data Rooms | P1 | Must | R1 | 5 | US-E02-01, US-E02-03 | S8 |
| 42 | US-E07-04 | Mint a public link for a room, folder or file in three taps | E07 Sharing & Access | P1 | Must | R1 | 5 | US-E07-01, US-E07-02, US-E09-07† | S9 |
| 43 | US-E06-03 | Type-ahead: debounce, cancellation and no flicker | E06 Search | P3 | Must | R1 | 5 | US-E06-01, US-E06-02 | S11 |
| 44 | US-E08-05 | The conflict sheet: three choices, never silent | E08 Conflict & Integrity | P1 | Must | R1 | 5 | US-E08-04, US-E09-06 | S6 |
| 45 | US-E04-02 | Add files from the device picker with a visible upload tray | E04 File Ops | P1 | Must | R1 | 5 | US-E04-01, US-E09-03†, US-E09-04†, US-E03-03† | S9 |
| 46 | US-E02-07 | Room switcher | E02 Data Rooms | P1 | Must | R1 | 3 | US-E02-04 | S9 |
| 47 | US-E08-06 | Collision on folder create and on rename | E08 Conflict & Integrity | P4 | Must | R1 | 3 | US-E08-05 | S7 |
| 48 | US-E06-05 | Result rows that show the path and jump to it | E06 Search | P3 | Must | R1 | 5 | US-E06-01, US-E06-03, US-E03-04† | S12 |
| 49 | US-E07-07 | Invite specific people by email | E07 Sharing & Access | P1 | Must | R1 | 5 | US-E07-01, US-E07-02 | S9 |
| 50 | US-E01-08 | Guest access to a share without creating an account | E01 Access & Identity | P2 | Must | R1 | 8 | US-E01-01, US-E01-05 | S5 |
| 51 | US-E04-08 | Selection mode and the contextual bulk action bar | E04 File Ops | P4 | Must | R1 | 5 | US-E09-08† | S6 |
| 52 | US-E06-04 | Scope: this folder or this room, with the right default | E06 Search | P1 | Must | R1 | 3 | US-E06-02 | S11 |
| 53 | US-E01-09 | Sign out on this device, and sign out everywhere | E01 Access & Identity | P1 | Must | R1 | 5 | US-E01-05 | S5 |
| 54 | US-E08-10 | Optimistic concurrency: the version token contract | E08 Conflict & Integrity | P4 (internal) | Must | R1 | 5 | US-E08-01 | S3 |
| 55 | US-E10-17 | Storage accounting: incremental usage, per-room breakdown and drift reconciliation | E10 Perf, Offline & Scale | P1 | Must | R1 | 5 | US-E10-01 | S3 |
| 56 | US-E07-13 | The share-management screen: who can see what | E07 Sharing & Access | P1 | Must | R1 | 8 | US-E07-04, US-E07-07, US-E07-02, US-E09-05† | S10 |
| 57 | US-E08-14 | Trash: soft delete, stated retention and restore | E08 Conflict & Integrity | P4 | Must | R1 | 8 | US-E08-06, US-E09-13 | S8 |
| 58 | US-E02-06 | Rename a room | E02 Data Rooms | P1 | Must | R1 | 2 | US-E02-01, US-E02-02 | S7 |
| 59 | US-E02-08 | Visual disambiguation between rooms | E02 Data Rooms | P1 | Must | R1 | 3 | US-E02-01, US-E02-07 | S10 |
| 60 | US-E01-13 | Step-up re-authentication when returning to the app | E01 Access & Identity | P1 | Must | R2 → **R1**† | 5 | US-E01-05 | S6 |
| 61 | US-E04-09 | Move a file or a selection with the destination picker | E04 File Ops | P4 | Must | R1 | 5 | US-E04-08, US-E09-09† | S7 |
| 62 | US-E07-03 | Read-only enforcement, proven verb by verb | E07 Sharing & Access | P3 | Must | R1 | 5 | US-E07-01 | S8 |
| 63 | US-E12-03 | Used storage with a per-room breakdown | E12 Account & Governance | P1 | Must | R1 | 5 | US-E12-01, US-E10-17† | S7 |
| 64 | US-E10-14 | Stream everything: several-gigabyte files without hitting the memory ceiling | E10 Perf, Offline & Scale | P6 | Must | R1 | 8 | US-E10-02 | S7 |
| 65 | US-E11-02 | Room activity log on a 360 px screen | E11 Trust & Audit | P1 | Must | R1 | 8 | US-E11-01, US-E10-01†, US-E09-05† | S7 |
| 66 | US-E11-07 | View sessions and honest dwell measurement | E11 Trust & Audit | P1 | Must | R1 | 8 | US-E11-01, US-E05-06† | S8 |
| 67 | US-E11-12 | Notification centre with unread state | E11 Trust & Audit | P1 | Must | R1 | 8 | US-E11-01, US-E09-03† | S9 |
| 68 | US-E06-07 | Zero results, errors, cancellation and offline | E06 Search | P1 | Must | R1 | 5 | US-E06-03, US-E06-04 | S12 |
| 69 | US-E07-06 | Link controls: expiry, password, download and view cap | E07 Sharing & Access | P1 | Must | R1 | 5 | US-E07-04 | S10 |
| 70 | US-E08-09 | Idempotency: a retried mutation never happens twice | E08 Conflict & Integrity | P6 | Must | R1 | 5 | US-E08-01 | S8 |
| 71 | US-E05-07 | PDF preview: manifest, progressive server-rendered pages, first-page budget | E05 Viewing & Preview | P5 | Must | R1 | 8 | US-E05-06, US-E10-14† | S10 |
| 72 | US-E02-11 | Room settings | E02 Data Rooms | P1 | Should | R1 | 5 | US-E02-02, US-E02-06, US-E02-08 | S11 |
| 73 | US-E01-06 | Reset a forgotten password | E01 Access & Identity | P1 | Must | R1 | 3 | US-E01-04 | S4 |
| 74 | US-E03-08 | Rename a folder | E03 Folders & Nav | P4 | Must | R1 | 3 | US-E03-01, US-E03-03 | S9 |
| 75 | US-E04-04 | Honest upload state across backgrounding, freeze and discard | E04 File Ops | P6 | Must | R1 | 3 | US-E04-01, US-E04-02 | S10 |
| 76 | US-E04-14 | Download one file, honestly | E04 File Ops | P3 | Must | R1 | 3 | US-E07-03† | S9 |
| 77 | US-E10-08 | Request cancellation, cache generations and post-mutation freshness | E10 Perf, Offline & Scale | P1 | Must | R1 | 3 | US-E10-01 | S6 |
| 78 | US-E11-04 | Who may read the log, enforced on the server | E11 Trust & Audit | P1 | Must | R1 | 3 | US-E11-02, US-E07-02† | S10 |
| 79 | US-E04-06 | Commit gates: quota, size ceiling, type sniffing and malware scan | E04 File Ops | P1 | Must | R1 | 5 | US-E04-01 | S10 |
| 80 | US-E05-05 | File and folder details in a bottom sheet | E05 Viewing & Preview | P3 | Must | R1 | 5 | US-E05-01, US-E09-07† | S10 |
| 81 | US-E07-09 | Recipient opens a shared link on a phone with no account | E07 Sharing & Access | P2 | Must | R1 | 8 | US-E07-04, US-E07-06, US-E01-08† | S11 |
| 82 | US-E07-11 | Revoke any share at any time, with a measured immediacy contract | E07 Sharing & Access | P1 | Must | R1 | 8 | US-E07-04, US-E07-07, US-E07-13 | S11 |
| 83 | US-E10-10 | Initial-route byte and blocking budget, enforced by CI | E10 Perf, Offline & Scale | Internal | Must | R1 | 8 | — | S11 |
| 84 | US-E03-07 | Item counts and the folder summary line | E03 Folders & Nav | P3 | Should | R1 | 3 | US-E03-03 | S11 |
| 85 | US-E06-08 | Result counts, paging and a virtualised result list | E06 Search | P4 | Should | R1 | 5 | US-E06-01, US-E06-05, US-E10-02† | S13 |
| 86 | US-E05-04 | Sort controls with a persisted preference | E05 Viewing & Preview | P4 | Must | R1 | 3 | US-E05-01 | S11 |
| 87 | US-E10-07 | Place restoration across navigation, freeze and discard | E10 Perf, Offline & Scale | P2 | Must | R1 | 5 | US-E10-01, US-E10-02 | S12 |
| 88 | US-E11-15 | Per-room notification preferences and mute | E11 Trust & Audit | P4 | Must | R1 | 5 | US-E11-12 | S12 |
| 89 | US-E04-12 | Delete to trash with undo, restore and permanent delete | E04 File Ops | P1 | Must | R1 | 8 | US-E04-08, US-E09-14†, US-E08-14† | S12 |
| 90 | US-E12-05 | Refuse an upload that would exceed quota, before any bytes move | E12 Account & Governance | P6 | Must | R1 | 8 | US-E12-03, US-E04-06† | S12 |
| 91 | US-E06-09 | Filters in one sheet with an explicit Apply | E06 Search | P3 | Should | R1 | 5 | US-E06-05, US-E06-07, US-E09-07† | S13 |
| 92 | US-E01-03 | Verify the email address | E01 Access & Identity | P1 | Must | R1 | 3 | US-E01-02 | S12 |
| 93 | US-E02-05 | Shared with me: the recipient's home | E02 Data Rooms | P3 | Must | R1 | 3 | US-E02-04, US-E01-08 | S12 |
| 94 | US-E03-05 | Up one level, and back-behaviour parity across platforms | E03 Folders & Nav | P2 | Must | R1 | 3 | US-E03-03, US-E03-04 | S12 |
| 95 | US-E08-12 | A folder can never be moved into its own descendant | E08 Conflict & Integrity | P4 | Must | R1 | 3 | US-E08-10, US-E09-09† | S13 |
| 96 | US-E01-07 | Rate limiting, lockout, and the lockout experience | E01 Access & Identity | P1 | Must | R1 | 5 | US-E01-04, US-E01-06 | S13 |
| 97 | US-E04-03 | Capture a document with the camera or pick from the photo library | E04 File Ops | P1 | Must | R1 | 5 | US-E04-02 | S13 |
| 98 | US-E04-10 | The staging tray: cut, copy and paste on touch | E04 File Ops | P4 | Must | R1 | 5 | US-E04-08, US-E04-09 | S13 |
| 99 | US-E05-02 | Tiles view and a persisted view preference | E05 Viewing & Preview | P1 | Must | R1 | 5 | US-E05-01 | S13 |
| 100 | US-E08-07 | Collision on upload, resolved before the item becomes visible | E08 Conflict & Integrity | P1 | Must | R1 | 5 | US-E08-05, US-E04-04 | S13 |
| 101 | US-E08-11 | The stale-version experience on a phone | E08 Conflict & Integrity | P4 | Must | R1 | 5 | US-E08-10, US-E09-13† | S13 |
| 102 | US-E10-06 | Lazy thumbnails with reserved boxes and hard cancellation | E10 Perf, Offline & Scale | P1 | Must | R1 | 5 | US-E10-02, US-E09-05† | S14 |
| 103 | US-E10-12 | Real-user monitoring for LCP, INP, CLS and session context | E10 Perf, Offline & Scale | Internal | Must | R1 | 5 | US-E10-10 | S14 |
| 104 | US-E03-09 | Move a folder with the destination-picker sheet | E03 Folders & Nav | P4 | Must | R1 | 8 | US-E03-03, US-E03-04, US-E03-08 | S14 |
| 105 | US-E03-10 | Delete a folder with an explicit cascade warning | E03 Folders & Nav | P1 | Must | R1 | 8 | US-E03-03, US-E03-07 | S14 |
| 106 | US-E04-13 | Bulk operations with per-item results and mid-flight cancel | E04 File Ops | P4 | Must | R1 | 8 | US-E04-08, US-E04-09, US-E04-12, US-E08-09† | S14 |
| 107 | US-E02-09 | Recents | E02 Data Rooms | P1 | Should | R1 | 3 | US-E02-04 | S14 |
| 108 | US-E06-10 | Recent searches | E06 Search | P1 | Should | R1 | 3 | US-E06-03 | S14 |
| 109 | US-E03-12 | The mobile tree equivalent: the path and outline sheet | E03 Folders & Nav | P4 | Should | R1 | 5 | US-E03-04 | S14 |
| 110 | US-E10-15 | Offline read cache for visited folders and opened files, honestly labelled | E10 Perf, Offline & Scale | P6 | Should | R1 | 8 | US-E10-07, US-E10-08 | S15 |
| 111 | US-E07-05 | Distribute the link: clipboard first, share sheet second | E07 Sharing & Access | P6 | Must | R1 | 2 | US-E07-04 | S10 |
| 112 | US-E03-02 | Nest folders arbitrarily deep, with an enforced limit | E03 Folders & Nav | P4 | Must | R1 | 3 | US-E03-01 | S15 |
| 113 | US-E05-10 | Image, text and code preview | E05 Viewing & Preview | P1 | Must | R1 | 3 | US-E05-06 | S15 |
| 114 | US-E05-11 | Unsupported type: a fallback that never dead-ends | E05 Viewing & Preview | P3 | Must | R1 | 3 | US-E05-06 | S15 |
| 115 | US-E06-06 | Typing with the keyboard up, one-handed | E06 Search | P2 | Must | R1 | 3 | US-E06-02, US-E06-03 | S15 |
| 116 | US-E06-11 | Search-in-folder, the touch substitute for type-to-jump | E06 Search | P4 | Must | R1 | 3 | US-E06-01 | S15 |
| 117 | US-E06-12 | Search analytics and the zero-result feedback loop | E06 Search | Internal | Must | R1 | 3 | US-E06-03, US-E06-05, US-E06-07 | S15 |
| 118 | US-E07-08 | Pending invitations: list, resend, cancel | E07 Sharing & Access | P1 | Must | R1 | 3 | US-E07-07 | S15 |
| 119 | US-E07-10 | The recipient gates: link password and email capture | E07 Sharing & Access | P1 | Must | R1 | 3 | US-E07-06, US-E07-09 | S15 |
| 120 | US-E07-12 | What a revoked or expired recipient sees, mid-session and later | E07 Sharing & Access | P2 | Must | R1 | 3 | US-E07-11 | S15 |
| 121 | US-E08-02 | Forbidden characters, reserved names and trailing forms | E08 Conflict & Integrity | P4 | Must | R1 | 3 | US-E08-01 | S2 |
| 122 | US-E10-03 | Skeleton-first folder screen with no layout shift | E10 Perf, Offline & Scale | P5 | Must | R1 | 3 | US-E10-01, US-E09-12† | S15 |
| 123 | US-E11-03 | Scoped log for a folder or a single file | E11 Trust & Audit | P4 | Must | R1 | 3 | US-E11-02 | S15 |
| 124 | US-E11-08 | Download tracking, never conflated with previewing | E11 Trust & Audit | P6 | Must | R1 | 3 | US-E11-01, US-E11-07, US-E04-14† | S15 |
| 125 | US-E11-11 | Recipient disclosure: what is tracked about you | E11 Trust & Audit | P3 | Must | R1 | 3 | US-E11-07 | S16 |
| 126 | US-E12-07 | What still works at the limit | E12 Account & Governance | P1 | Must | R1 | 3 | US-E12-05 | S16 |
| 127 | US-E03-06 | Deep links to a folder | E03 Folders & Nav | P3 | Must | R1 | 5 | US-E03-03, US-E03-04, US-E01-08 | S16 |
| 128 | US-E03-11 | Restore a deleted folder from Trash | E03 Folders & Nav | P1 | Must | R1 | 5 | US-E03-10 | S16 |
| 129 | US-E03-14 | Name rules, path-length limits and Unicode handling | E03 Folders & Nav | P4 | Must | R1 | 5 | US-E03-01, US-E03-08 | S16 |
| 130 | US-E03-15 | Navigation state, scroll restoration and resumption | E03 Folders & Nav | P5 | Must | R1 | 5 | US-E03-03, US-E03-05 | S16 |
| 131 | US-E04-05 | Resume, retry and cancel an upload | E04 File Ops | P4 | Must | R1 | 5 | US-E04-01, US-E04-04 | S16 |
| 132 | US-E04-07 | Duplicate-name resolution at commit, with apply-to-all | E04 File Ops | P4 | Must | R1 | 5 | US-E04-01, US-E04-02, US-E08-05† | S16 |
| 133 | US-E04-11 | Copy, duplicate and rename a file | E04 File Ops | P1 | Must | R1 | 5 | US-E04-09, US-E08-06† | S16 |
| 134 | US-E05-03 | Thumbnails: server-generated, lazily loaded, never layout-shifting | E05 Viewing & Preview | P5 | Must | R1 | 5 | US-E05-01, US-E05-02, US-E10-06† | S17 |
| 135 | US-E05-08 | Zoom, fit-to-width, rotation and reflow reading mode | E05 Viewing & Preview | P2 | Must | R1 | 5 | US-E05-07 | S17 |
| 136 | US-E05-09 | Page indicator, jump-to-page and resume where I left off | E05 Viewing & Preview | P5 | Must | R1 | 5 | US-E05-07 | S17 |
| 137 | US-E05-12 | Read-only, download-off and revocation while reading | E05 Viewing & Preview | P1 | Must | R1 | 5 | US-E05-06, US-E05-07, US-E07-03†, US-E07-11† | S17 |
| 138 | US-E07-14 | Per-item shared indicator and the "who can see this" sheet | E07 Sharing & Access | P1 | Must | R1 | 5 | US-E07-02, US-E07-13 | S17 |
| 139 | US-E07-15 | Change a grant, and never widen access without saying so | E07 Sharing & Access | P1 | Must | R1 | 5 | US-E07-13, US-E07-02 | S17 |
| 140 | US-E08-08 | Collision on copy and move, including batches | E08 Conflict & Integrity | P4 | Must | R1 | 5 | US-E08-05, US-E08-12 | S17 |
| 141 | US-E08-13 | The item you are viewing changed under you | E08 Conflict & Integrity | P3 | Must | R1 | 5 | US-E08-10 | S17 |
| 142 | US-E08-15 | Permanent deletion, two-step and irreversible | E08 Conflict & Integrity | P1 | Must | R1 | 5 | US-E08-14, US-E01-13 | S17 |
| 143 | US-E10-04 | Landmarks in a long list: counts, load more, and new-item pill | E10 Perf, Offline & Scale | P3 | Must | R1 | 5 | US-E10-01, US-E10-02 | S18 |
| 144 | US-E10-09 | Optimistic UI with a visible, typed rollback | E10 Perf, Offline & Scale | P1 | Must | R1 | 5 | US-E10-08 | S18 |
| 145 | US-E10-11 | Cold start, warm start and the app shell | E10 Perf, Offline & Scale | P1 | Must | R1 | 5 | US-E10-10 | S18 |
| 146 | US-E10-18 | Scale and soak acceptance harness | E10 Perf, Offline & Scale | Internal | Must | R1 | 5 | US-E10-01, US-E10-02, US-E10-12 | S18 |
| 147 | US-E11-05 | Attribution for anonymous link visitors, labelled unverified | E11 Trust & Audit | P6 | Must | R1 | 5 | US-E11-01, US-E07-09† | S18 |
| 148 | US-E11-06 | Denials and permission changes in the log, with before and after | E11 Trust & Audit | P1 | Must | R1 | 5 | US-E11-01 | S18 |
| 149 | US-E11-13 | One-tap actionable notifications | E11 Trust & Audit | P1 | Must | R1 | 5 | US-E11-12 | S18 |
| 150 | US-E12-04 | Quota warning thresholds | E12 Account & Governance | P1 | Must | R1 | 5 | US-E12-03 | S18 |
| 151 | US-E12-08 | Reclaim space: trash, versions and the byte savings shown before the tap | E12 Account & Governance | P4 | Must | R1 | 5 | US-E12-03, US-E08-14† | S18 |
| 152 | US-E02-13 | Delete a room, with an explicit blast-radius warning and restore | E02 Data Rooms | P1 | Must | R1 | 8 | US-E02-02, US-E02-11, US-E01-13† | S19 |
| 153 | US-E12-06 | Quota reservation and the in-flight overshoot abort | E12 Account & Governance | P1 | Must | R1 | 8 | US-E12-05, US-E04-01† | S19 |
| 154 | US-E03-17 | Empty folder state | E03 Folders & Nav | P2 | Should | R1 | 2 | US-E03-03 | S11 |
| 155 | US-E02-16 | Empty states across the workspace home | E02 Data Rooms | P1 | Should | R1 | 3 | US-E02-04, US-E02-05 | S16 |
| 156 | US-E07-16 | Revoke everything on a room in one action | E07 Sharing & Access | P1 | Should | R1 | 3 | US-E07-11, US-E07-13 | S19 |
| 157 | US-E10-13 | Server timing, slow-query visibility and API latency budgets | E10 Perf, Offline & Scale | Internal | Should | R1 | 3 | US-E10-01 | S19 |
| 158 | US-E11-14 | First-open notification to the owner | E11 Trust & Audit | P1 | Should | R1 | 3 | US-E11-12, US-E11-07 | S19 |
| 159 | US-E12-02 | Profile and account settings on a phone | E12 Account & Governance | P1 | Should | R1 | 3 | US-E12-01 | S19 |
| 160 | US-E01-10 | Magic-link sign-in | E01 Access & Identity | P1 | Should | R1 | 5 | US-E01-04, US-E01-07 | S19 |
| 161 | US-E10-05 | Bounded, cellular-aware prefetch and the data-saver path | E10 Perf, Offline & Scale | P2 | Should | R1† | 5 | US-E10-01, US-E10-02 | S19 |
| 162 | US-E12-24 | The administrator role, enforced on the server | E12 Account & Governance | P4 (internal) | Must | R1 | 3 | US-E12-01 | S19 |
| 163 | US-E12-19 | Administrator-set storage quota with an explicit default | E12 Account & Governance | P4 | Must | R1 | 8 | US-E12-01, US-E12-03 | S20 |
| 164 | US-E12-21 | Provision a colleague's account | E12 Account & Governance | P4 | Must | R1 | 5 | US-E12-24 | S20 |
| 165 | US-E12-18 | Account deletion: storage reclamation and the retention window | E12 Account & Governance | P1 | Must | R2 → **R1**† | 5 | US-E12-03, US-E12-24† | S20 |
| 166 | US-E12-20 | Lowering a quota below current usage never deletes anything | E12 Account & Governance | P1 | Must | R1 | 5 | US-E12-19 | S21 |
| 167 | US-E12-22 | Deprovision a colleague: the leaver flow | E12 Account & Governance | P4 | Must | R1 | 8 | US-E12-21 | S21 |
| 168 | US-E09-17 | Row swipe actions and haptics, as shortcuts only | E09 Mobile UX Foundations | P1 | Should | R2 | 5 | US-E09-05, US-E09-13 | S22 |
| 169 | US-E09-18 | Personalisation and the desktop enhancement layer | E09 Mobile UX Foundations | P4 | Should | R2 | 8 | US-E09-01, US-E09-02, US-E09-15 | S22 |
| 170 | US-E12-23 | Retention and limit settings an administrator can actually change | E12 Account & Governance | P4 | Should | R2 | 5 | US-E12-19 | S22 |
| 171 | US-E12-25 | Optional team-level storage ceiling | E12 Account & Governance | P4 | Could | R2 | 3 | US-E12-19 | S22 |
| 172 | US-E12-17 | Data export and portability | E12 Account & Governance | P1 | Should | R3 → **R2**† | 8 | US-E12-24 | S22 |
| 173 | US-E07-18 | Transfer room ownership | E07 Sharing & Access | P1 | Should | R2 | 5 | US-E07-01, US-E01-13 | S22 |
| 174 | US-E11-09 | Per-file viewer analytics on a phone | E11 Trust & Audit | P1 | Must | R2 | 8 | US-E11-07, US-E11-04 | S22 |
| 175 | US-E06-15 | Search inside document text | E06 Search | P3 | Should | R2 | 8 | US-E06-01, US-E06-08 | S22 |
| 176 | US-E08-17 | The offline mutation queue: capture and visibility | E08 Conflict & Integrity | P6 | Should | R2 | 8 | US-E08-09, US-E08-10 | S23 |
| 177 | US-E02-10 | Pin a room to the top | E02 Data Rooms | P6 | Should | R2 | 2 | US-E02-04, US-E02-07 | S22 |
| 178 | US-E01-16 | Change email and change password | E01 Access & Identity | P4 | Should | R2 | 3 | US-E01-03, US-E01-06, US-E01-09 | S22 |
| 179 | US-E03-16 | Folder details sheet | E03 Folders & Nav | P3 | Should | R2 | 3 | US-E03-03, US-E03-07 | S23 |
| 180 | US-E01-14 | Social sign-in with Google, Apple and Microsoft | E01 Access & Identity | P2 | Should | R2 | 5 | US-E01-04, US-E01-05 | S23 |
| 181 | US-E02-12 | Archive and unarchive a room | E02 Data Rooms | P1 | Should | R2 | 5 | US-E02-11 | S23 |
| 182 | US-E02-15 | Room templates and a starting folder structure | E02 Data Rooms | P1 | Should | R2 | 5 | US-E02-01, US-E03-01 | S23 |
| 183 | US-E02-17 | Room list at scale: search, filter and offline cache | E02 Data Rooms | P4 | Should | R2 | 5 | US-E02-04, US-E02-07 | S23 |
| 184 | US-E04-15 | Bulk download as a server-streamed zip | E04 File Ops | P3 | Should | R2 | 5 | US-E04-13, US-E04-14 | S23 |
| 185 | US-E04-16 | Open in, share to another app, and receive from the OS share sheet | E04 File Ops | P6 | Should | R2 | 5 | US-E04-02, US-E04-14 | S24 |
| 186 | US-E05-13 | Video and audio preview by streaming | E05 Viewing & Preview | P6 | Should | R2 | 5 | US-E05-06 | S24 |
| 187 | US-E06-13 | All-rooms search | E06 Search | P1 | Should | R2 | 5 | US-E06-04, US-E06-08 | S24 |
| 188 | US-E11-17 | Email digests and the guaranteed channel | E11 Trust & Audit | P1 | Should | R2 | 5 | US-E11-15 | S24 |
| 189 | US-E11-18 | Audit CSV export, retention statement and rate limit | E11 Trust & Audit | P1 | Should | R2 | 5 | US-E11-02, US-E11-04 | S25 |
| 190 | US-E02-14 | Duplicate a room | E02 Data Rooms | P4 | Should | R2 | 8 | US-E02-01, US-E02-11 | S25 |
| 191 | US-E04-17 | Scan multiple pages into a single PDF | E04 File Ops | P1 | Should | R2 | 8 | US-E04-03 | S25 |
| 192 | US-E05-14 | Office document preview through server conversion | E05 Viewing & Preview | P3 | Should | R2 | 8 | US-E05-07 | S25 |
| 193 | US-E07-17 | Watermarked previews through a share | E07 Sharing & Access | P1 | Should | R2 | 8 | US-E07-06, US-E07-09 | S26 |
| 194 | US-E08-16 | File versioning and version restore | E08 Conflict & Integrity | P4 | Should | R2 | 8 | US-E08-07, US-E08-14 | S26 |
| 195 | US-E08-18 | Reconciling the queue on reconnect | E08 Conflict & Integrity | P6 | Should | R2 | 8 | US-E08-17, US-E08-11 | S26 |
| 196 | US-E10-16 | Explicit offline pinning with visible space accounting | E10 Perf, Offline & Scale | P6 | Should | R2 | 8 | US-E10-15 | S26 |
| 197 | US-E11-10 | Page-level dwell for documents | E11 Trust & Audit | P6 | Should | R2 | 8 | US-E11-09 | S26 |
| 198 | US-E11-16 | Web push, stated honestly per surface | E11 Trust & Audit | P1 | Should | R2 | 8 | US-E11-12, US-E11-15 | S27 |
| 199 | US-E05-17 | Show file extensions, consistently | E05 Viewing & Preview | P4 | Could | R2 | 2 | US-E05-01, US-E05-05 | S24 |
| 200 | US-E01-17 | Claim guest access into a registered account | E01 Access & Identity | P3 | Could | R2 | 3 | US-E01-01, US-E01-08 | S25 |
| 201 | US-E02-18 | Room storage and item counts on the room card | E02 Data Rooms | P6 | Could | R2 | 3 | US-E02-04, US-E02-11 | S26 |
| 202 | US-E03-18 | Recent folders and jump-to-folder | E03 Folders & Nav | P6 | Could | R2 | 3 | US-E03-03, US-E03-09, US-E02-09 | S27 |
| 203 | US-E06-14 | Saved searches | E06 Search | P3 | Could | R2 | 3 | US-E06-09, US-E06-10 | S27 |
| 204 | US-E01-11 | Active sessions and devices screen | E01 Access & Identity | P4 | Should | R2 | 5 | US-E01-05, US-E01-09 | S27 |
| 205 | US-E01-18 | Delete my account with a retention window | E01 Access & Identity | P1 | Must | R2 | 8 | US-E01-09, US-E01-11, US-E01-13†, US-E07-18† | S28 |
| 206 | US-E01-15 | New-device and security-event notification | E01 Access & Identity | P1 | Should | R2 | 3 | US-E01-05, US-E01-11 | S28 |
| 207 | US-E01-12 | Passkey registration and passkey sign-in | E01 Access & Identity | P1 | Should | R2 | 8 | US-E01-04, US-E01-11 | S28 |
| 208 | US-E05-15 | Grouping and the docked desktop inspector | E05 Viewing & Preview | P4 | Should | R2 | 5 | US-E05-04, US-E05-05 | S27 |
| 209 | US-E06-17 | Desktop search enhancements | E06 Search | P3 | Should | R2 | 3 | US-E06-05, US-E06-09 | S27 |
| 210 | US-E03-13 | Desktop tree view in a navigation rail | E03 Folders & Nav | P3 | Should | R2 | 5 | US-E03-03, US-E03-12 | S27 |
| 211 | US-E05-16 | Two-pane split view, and its compact-width equivalent | E05 Viewing & Preview | P4 | Should | R2 | 5 | US-E05-15 | S28 |
| 212 | US-E04-18 | Desktop enhancements: drag-and-drop, folder upload and zip expansion | E04 File Ops | P4 | Should | R2 | 8 | US-E04-02, US-E04-09, US-E04-10 | S27 |
| 213 | US-E06-16 | OCR so scanned documents are findable | E06 Search | P1 | Could | R3 | 13 | US-E06-15 | S29 |
---

## Dependency hot spots

"Blocks (transitive)" is the number of stories that cannot start until this one is done, counted
through the whole reconciled graph. "Blocks (direct)" is the number that name it as an immediate
prerequisite. Both are computed, not estimated.

| Story | Blocks (transitive) | Blocks (direct) | Points | Sprint | Why it is a hot spot, and the risk |
| --- | ---: | ---: | ---: | --- | --- |
| US-E01-01 Identity, subject and actor model | 169 | 10 | 5 | S1 | Every access decision, audit entry, share grant, cache key and storage record names a subject. 79 percent of the backlog sits behind it. It is also the story with an unresolved semantic conflict (RN-17: two principal types in the story, four in BR-001). Getting the union wrong in sprint 1 means a migration touching every table and every guard. Risk: highest in the backlog. Mitigation: close RN-17 in sprint zero and land the union behind a contract test before any consumer is written. |
| US-E09-01 Design tokens and the theme foundation | 113 | 5 | 5 | S1 | Every component in every epic reads these tokens. A token rename in sprint 10 is a repository-wide edit. Risk: low technically, high in coordination. Mitigation: freeze token names at the end of sprint 1 and treat additions as additive only. |
| US-E09-02 Size-class ladder and progressive-enhancement contract | 112 | 5 | 5 | S2 | Fixes what "compact", "medium" and "expanded" mean. Every responsive acceptance criterion in eight other epics is written against it. Risk: if the breakpoints move, every layout AC becomes unverifiable. |
| US-E01-02 / US-E01-04 / US-E01-05 Sign up, sign in, sessions | 108 / 106 / 102 | 2 / 6 / 7 | 5 / 3 / 5 | S2-S4 | Nothing can be demonstrated to a stakeholder without an account and a session. US-E01-05 additionally carries three numeric contradictions against BR-023 and BR-024 (RN-18), and session lifetime is baked into client caching, revocation timing and the "sign out everywhere" contract. Risk: a lifetime change after sprint 8 invalidates the revocation-immediacy tests in E07 and E05. |
| US-E02-01 / US-E02-02 Create a room, room ownership | 91 / 87 | 8 / 5 | 5 / 3 | S5-S6 | The room is the container everything else lives in and the ownership record is what E07's authorisation kernel and E12's quota hang off. Risk: moderate. These are small, well-specified stories; the risk is schedule, not design. |
| US-E10-01 Cursor-paginated children listing contract | 82 | 11 | 8 | S2 | Highest direct-dependent count in the backlog after US-E03-03. Folder browsing, search results, the activity log, the trash screen and the share-management screen all page through it. Risk: a change to the cursor or the response envelope after sprint 9 is a five-epic edit. Mitigation: version the envelope from day one. |
| US-E09-05 The item row component | 72 | 10 | 5 | S3 | Ten stories consume the row directly, and US-E05-01 re-specifies it (RN-23). Risk: two competing row implementations shipping side by side. Mitigation: resolve the US-E05-01 / US-E09-05 overlap before sprint 5. |
| US-E09-07 The sheet system | 58 | 9 | 8 | S4 | Details, conflict, filters, destination picker, link controls and share management are all sheets. The one-sheet rule and popable history are behaviours that cannot be retrofitted per screen. Risk: high if it ships thin; nine consumers will each work around it differently. |
| US-E07-02 Permission resolution | 37 | 7 | 8 | S8 | Search filtering, read-only enforcement, the share-management screen, per-item indicators and log visibility all consume its answer. It is also the site of the largest semantic conflict in the document set (RN-15: subtractive override versus additive maximum). Risk: severe. Building it on the wrong model and discovering it in sprint 15 means reworking US-E06-01, US-E07-03, US-E07-13, US-E07-15 and US-E11-04. Mitigation: this is the single decision most worth escalating out of sprint zero. |
| US-E03-03 Drill-down folder browsing | 34 | 13 | 5 | S8 | The most directly depended-on story in the backlog. Every file operation, preview, search jump and share affordance is reached through it. Risk: low design risk, high blast radius on regression. Mitigation: it deserves the deepest automated coverage of any screen. |
| US-E10-02 Virtualised folder list | 35 | 8 | 8 | S4 | Every long list in the product, and the 10,000-item claim in the pitch. Risk: virtualisation interacts badly with scroll restoration (US-E10-07), sticky breadcrumbs (US-E09-11) and screen-reader semantics (US-E09-15); those three must be tested against it, not after it. |
| US-E08-01 The canonical name | 40 | 6 | 5 | S1 | Collision detection, keep-both suffixes, search normalisation and the uniqueness constraint all read the same canonical form. Risk: changing the normalisation after data exists requires a backfill of every name in the system. |
| US-E07-01 The authorisation kernel | 46 | 5 | 8 | S7 | The capability matrix that BR-031 declares normative. Risk: if the matrix in code and the matrix in [business rules](./06-business-rules-and-permissions.md) drift, BR-031 makes the code the defect by definition. Mitigation: generate the kernel's test table from the rule document rather than hand-transcribing it. |
| US-E02-03 The invisibility rule | 48 | 2 | 5 | S7 | Low direct fan-out but it gates the entire recipient and sharing branch, and the BR-046 to BR-059 indistinguishability requirements (same status, same body, same headers, same timing) are the hardest thing in the backlog to prove. Risk: a single leaking endpoint added in a later sprint silently breaks it. Mitigation: an enumeration test that runs against every route in CI, not a per-story check. |

**The shape of the risk.** Seventeen stories, 96 points, sitting in sprints 1 to 8, gate 836 points of
R1. Two of them (US-E01-01 and US-E07-02) carry unresolved contradictions against the business rules
(RN-15, RN-17). That is the concentration to worry about: the schedule is not threatened by the large
stories, it is threatened by four small ones whose semantics have not been agreed.

---

## Cut lines

The order in which R1 scope comes off if the date is at risk. Each tranche is cut whole, in this
order, and each is chosen to remove a capability rather than to leave a half-built one.

Note first what is *not* here: there is no desktop-enhancement scope in R1 to cut, because Rule 3 put
all seven desktop stories in R2 already. Every point below comes out of working mobile product.

| # | Tranche | Stories | Points | Cumulative | Consequence of the cut |
| ---: | --- | --- | ---: | ---: | --- |
| C1 | Convenience and recall surfaces | US-E02-08, US-E02-09, US-E03-12, US-E06-10, US-E11-03, US-E12-02 | 20 | 20 | Nothing becomes unreachable and no data is at risk. P1 running eight live engagements re-navigates from the room list every time instead of using Recents; rooms lose their colour and monogram so the switcher is read by name only; P4 loses the outline sheet and drills down instead. Profile editing moves to R2, which is survivable because the name is captured at sign-up. Cheapest 20 points in the backlog. |
| C2 | Search beyond the minimum | US-E06-08, US-E06-09, US-E06-12 | 13 | 33 | Search still answers P3's fifteen-second question, because US-E06-01 to US-E06-05, US-E06-07 and US-E06-11 stay. What goes is result counts, paging past the first page, the filter sheet, and the zero-result telemetry. The last one is the real cost: you ship search without the instrumentation that would tell you it is failing. |
| C3 | Offline reads and prefetch | US-E10-15, US-E10-05 | 13 | 46 | P6 in a basement sees the offline banner and nothing else. This must come out of the marketing copy at the same time it comes out of the sprint, or the product claims something it does not do. Clean cut technically: the honest-labelling and eviction acceptance criteria leave with it, so there is no half-offline state to get wrong. |
| C4 | Thumbnails and tiles | US-E05-02, US-E05-03, US-E10-06 | 15 | 61 | List view only. A folder of photographed lease pages becomes forty identical rows reading `IMG_0421`, which is a genuine usability hit for P1, whose corpus is photographs. Recoverable in R2 and it removes the thumbnail pipeline, the lazy-load cancellation work and the reserved-box CLS work together. |
| C5 | Quota enforcement depth | US-E12-06, US-E12-08 | 13 | 74 | The hard block stays: US-E12-05 still refuses an over-quota upload before any bytes move, and US-E12-07 still keeps revoke and delete working at the limit, so the "never silently drop data" promise holds. What goes is the clean mid-flight abort, so a 3 GB upload that overshoots wastes the user's data allowance before failing at commit, and the reclaim-space screen, so the only way to free space is manual deletion room by room. Given BR-197 (trash counts against quota), C5 will generate support tickets. |
| C6 | Bulk and staging operations | US-E04-10, US-E04-11, US-E04-13 | 18 | 92 | Single-item move survives (US-E04-09) so nothing is unreachable, but P4's forty-file refile becomes forty operations, and duplicate and rename disappear. The dangerous part is US-E04-13: cutting it removes per-item partial-failure reporting, so if multi-select is left enabled a half-failed bulk action is silent. If C6 is taken, multi-select must be capped at a small number in the same change. |
| C7 | Notification centre | US-E11-12, US-E11-13, US-E11-15 | 18 | 110 | Keep US-E11-01, US-E11-02, US-E11-07 and US-E11-14 and the trust hook survives: the owner still learns that a counterparty opened the document, delivered by email instead of an in-app inbox. What goes is the inbox, unread state, one-tap actions and per-room mute, so a busy owner cannot turn the noisy room down. This is the last tranche that leaves a usable data room. |
| C8 | Share-management depth (recommend rejecting) | US-E07-10, US-E07-14, US-E07-15, US-E07-16 | 16 | 126 | Only consider this if the alternative is missing the date entirely. Revocation (US-E07-11), the recipient path (US-E07-09), link controls (US-E07-06) and the share-management screen (US-E07-13) all stay, so the security floor holds. But the per-item shared indicator goes, so an owner cannot tell from a listing what is exposed; grant editing goes, so changing a role means revoke-and-reinvite; and the password gate goes, which removes the only pre-open control on a confidential CIM. Each of these is a support conversation or a trust incident. |

**Arithmetic.** The full ladder removes 126 points, taking R1 from 836 to 710, which is 17 delivery
sprints instead of 21. **Estimate: the entire cut ladder buys back four sprints, about eight weeks.**
Anything more aggressive than that is not a cut list, it is a different release: the realistic options
are a second team from sprint 8 (see the capacity note) or deferring E06 Search and the remainder of
E11 to R2 wholesale.

**The floor that is never cut.** These are load-bearing for security, data integrity or the honesty
of the product, and cutting any of them makes R1 unshippable rather than smaller:

- All of E09 sprints 1 to 6 (US-E09-01 to US-E09-16). Cutting a foundation story does not save time,
  it moves the same work into sixteen inconsistent one-off implementations.
- US-E01-01, US-E01-02, US-E01-04, US-E01-05, US-E01-08, US-E01-09, US-E01-13.
- US-E02-01, US-E02-02, US-E02-03, US-E02-13.
- US-E07-01, US-E07-02, US-E07-03, US-E07-04, US-E07-06, US-E07-09, US-E07-11, US-E07-12, US-E07-13.
- All fifteen R1 stories of E08. Every one of them is a data-loss or silent-corruption path.
- US-E10-01, US-E10-02, US-E10-14 (a several-gigabyte upload that exhausts server memory is an
  availability incident, not a slow feature).
- US-E11-01, US-E11-07, US-E11-11 (the log's write path, the view session the owner needs to know a
  document was read, and the disclosure that makes tracking lawful to run).
- US-E12-05, US-E12-07, US-E12-22, US-E12-24 (a leaver whose access does not end, and a governance
  endpoint that trusts the client, are both security incidents rather than missing features).

---

## Reconciliation notes

Every inconsistency found across the twelve epic files, with the file and story ID so it can be fixed
at source. Where this index could resolve a reference itself it did so, and the change is marked with
a dagger in the master story index above.

### Structural checks that passed

Stated so the reader knows what was examined and found clean.

- **No duplicate story IDs and no invented prefixes.** All 213 IDs are unique and conform to
  `US-E<nn>-<mm>`. Epic numbering runs E01 to E12 with no gaps and no collisions.
- **Every epic's own arithmetic is right.** All twelve declared "Story count" and "Total points"
  values match the stories actually present in that file.
- **Every estimate is Fibonacci.** No off-scale values. Exactly one 13-point story exists
  (US-E06-16, R3), correctly flagged as needing a split.
- **Every story is structurally complete.** All 213 carry Acceptance criteria, Mobile acceptance
  criteria, Edge cases & negative paths and a Traces-to row. There is no story anywhere in the set
  with a missing mobile acceptance-criteria section.
- **No dependency cycles.** The graph is acyclic before and after the corrections below.
- **Release-span lines match the story rows in eleven of twelve files.** The one exception is RN-12;
  RN-13 was resolved in this pass.

### Dangling and incorrect dependency references

**RN-01 — `epic-07-sharing-and-access-control.md`, US-E07-09.** Declares
`Depends on US-E07-04, US-E07-06, US-E01-14`. US-E01-14 is *Social sign-in with Google, Apple and
Microsoft* (Should, R2). The story is titled "Recipient opens a shared link on a phone with no
account", so it cannot depend on any sign-in story; the enabling prerequisite is US-E01-08 *Guest
access to a share without creating an account* (Must, R1). This is also a release violation (R1
depending on R2) and a priority inversion (Must depending on Should). Corrected to US-E01-08 in this
index. Fix in `epic-07`.

**RN-02 — `epic-08-conflict-resolution-and-data-integrity.md`, US-E08-15** (Must, R1) depends on
US-E01-13 *Step-up re-authentication*, which `epic-01` releases as R2. BR-045 requires step-up
re-authentication within the preceding 5 minutes for ownership transfer, room deletion and account
deletion, and US-E02-13 (room deletion) is Must/R1. The dependency is correct and the release tag is
wrong. Resolution applied here: **promote US-E01-13 to R1** (+5 points to R1, -5 from R2). Fix the
Release row in `epic-01` and the Release-span line in its Epic summary.

**RN-03 — `epic-01-access-and-identity.md`, US-E01-13** depends on US-E01-12 *Passkey registration
and passkey sign-in* (Should, R2). A Must cannot be gated on a Should, and step-up re-authentication
does not require passkeys, because a password or magic-link re-entry satisfies BR-045. Resolution applied
here: US-E01-13's R1 scope depends on US-E01-05 only; the passkey step-up path becomes an R2
increment delivered with US-E01-12. Fix the Depends-on row in `epic-01` and split the ACs
accordingly.

**RN-04 — `epic-12-account-storage-and-governance.md`, US-E12-18, and `epic-01`, US-E01-18: who owns
account deletion.** US-E12-18's AC1 states that the deletion request flow is "owned by E01
(US-E01-18)", while FR-AUTH-028 — the requirement that *creates* the request flow — names **E12** as
its epic and tags it Must / R1, as do FR-ACCT-024 and FR-ACCT-025. Doc 05 owns release tags and epic
assignment, so E12 owns the flow and US-E01-18's claim to it is the defect. Resolution applied here:
US-E12-18 depends on US-E12-03 and US-E12-24 only, is scheduled in S20, and its former dependency on
the withdrawn US-E12-15 is gone. Fix in `epic-01`: reduce US-E01-18 to the sign-out, session and
credential half it actually owns, and reference US-E12-18 for the rest.

**RN-05 — `epic-01-access-and-identity.md`, US-E01-18.** AC8 references "the ownership-transfer
option exists (E02, E07)" and BR-030 requires that transfer be offered at the point of refusal, but
the Depends-on row omits US-E07-18 *Transfer room ownership*, the story that builds it. Dependency
added here. Fix in `epic-01`.

**RN-06 — `epic-02-data-rooms-and-workspace-home.md`, US-E02-13.** Room deletion (Must, R1) has no
dependency on step-up re-authentication and no acceptance criterion for it, although BR-045 requires
it. The word "step-up" does not appear anywhere in `epic-02`. Dependency on US-E01-13 added here; an
acceptance criterion must be added at source.

**RN-07 — `epic-09-mobile-ux-foundations.md`, US-E09-09, AC8.** Defers cross-room move behaviour to
"the cross-room rules in E04". `epic-04-file-operations.md` contains no cross-room rules; US-E04-09's
destination picker is specified as showing "the room root and its children". The reference is
dangling. See also RN-14, which says the behaviour should not exist at all.

**RN-08 — all epics except E09: epic-level prerequisites never carried down to story level.** Nine
epic files declare cross-epic prerequisites in their "Epic summary → Depends on" row, but their
individual stories declare `Depends on: none` or intra-epic dependencies only. Taken literally, the
story rows produce an unbuildable sequence in which, for example, US-E05-01 (the file list row) has
no prerequisites at all. Fifty-two edges have been added in this index, marked with a dagger. The
significant ones: US-E03-03 → US-E10-01; US-E04-02 → US-E09-03, US-E09-04, US-E03-03; US-E04-08 →
US-E09-08; US-E04-09 → US-E09-09; US-E04-12 → US-E09-14, US-E08-14; US-E04-14 → US-E07-03; US-E05-01
→ US-E09-05, US-E10-02; US-E05-06 → US-E09-07; US-E05-07 → US-E10-14; US-E06-01 → US-E08-01,
US-E07-02; US-E10-01 → US-E01-01; US-E10-02 → US-E09-05; US-E11-01 → US-E01-01; US-E11-02 →
US-E10-01, US-E09-05; US-E11-07 → US-E05-06; US-E12-01 → US-E01-01; US-E12-03 → US-E10-17; US-E12-05
→ US-E04-06. Each epic file should carry its own epic-level dependencies into its story rows.

**RN-09 — `epic-01-access-and-identity.md` and `epic-02-data-rooms-and-workspace-home.md`: declared
dependency-free but not.** E01's Epic summary says "Depends on: Nothing inside this doc set", yet its
Mobile-first design stance requires `env(keyboard-inset-bottom)` focus handling (US-E09-10), the
token layer (US-E09-01) and bottom-sheet layout (US-E09-07). E02 declares dependencies on E01 only,
yet US-E02-04 and US-E02-05 specify a bottom-navigation workspace home built from US-E09-03 and
US-E09-05. Left uncorrected in this index because both files state the position explicitly; it needs
a decision. If the position stands, the auth and home screens ship with one-off layout code and the
E09 acceptance criteria do not cover them.

### Priority inversions

**RN-10 — five cases where a Must depends on a Should.** The sixth, US-E12-15 on US-E12-14, went
with the two withdrawn stories.
 Either the prerequisite is promoted to Must
or it is not really a blocker; both readings need an owner's decision, and the sprint plan currently
treats every one of these prerequisites as effectively Must.

| Story (priority) | Depends on (priority) | File |
| --- | --- | --- |
| US-E01-13 (Must) | US-E01-12 (Should) | `epic-01` — see RN-03 |
| US-E01-18 (Must) | US-E01-11 (Should) | `epic-01` |
| US-E02-13 (Must) | US-E02-11 (Should) | `epic-02` |
| US-E03-10 (Must) | US-E03-07 (Should) | `epic-03` |
| US-E07-09 (Must) | US-E01-14 (Should) | `epic-07` — see RN-01 |

### Release-tag defects

**RN-11 — `epic-10-performance-offline-and-scale.md`, US-E10-05.** Release reads
`R1 (prefetch), R2 (data saver)`. The convention permits exactly one of R1, R2 or R3 per story, and a
split tag makes the story uncountable in any release total and unclosable in any sprint. Split it into
two stories, or tag it R1 and move the data-saver acceptance criteria into US-E10-16. This index
counts it as R1 at 5 points and marks the tag with a dagger.

**RN-12 — `epic-10-performance-offline-and-scale.md`, Epic summary.** The Release span reads
"R2 (stories 16 and the R2 halves of 05 and 11)", but US-E10-11's Release row is a plain `R1` and no
R2 half is described anywhere in the story. Either the span line or US-E10-11 is wrong.

**RN-13 — `epic-12-account-storage-and-governance.md`, US-E12-18: resolved.** The old conflict was a
Release span of "R1 (stories 01 to 08, 18)" against a story row of `R2`, and the story row was
defensible only because it depended on US-E12-15, which was R2. US-E12-15 is withdrawn, so the
dependency is gone and the requirements decide: FR-ACCT-024, FR-ACCT-025 and FR-AUTH-028 are all
Must / R1 and all three name E12. **US-E12-18 is promoted to R1** (+5 points to R1, -5 from R2) and
scheduled in S20, and the epic's Release span now agrees. See RN-04 for the ownership half.

### Stories that contradict a business rule

**RN-14 — `epic-09-mobile-ux-foundations.md`, US-E09-09, AC8** permits the destination picker to
"also target another room the user has write access to". BR-004 states that every folder and file
belongs to exactly one room permanently and that "reparenting across rooms is not an operation the
system offers", and BR-075 states that the only supported route is an explicit copy into the
destination room followed by an explicit delete, precisely so the grant consequences of BR-074 are
visible. AC8 must be deleted or rewritten as a copy affordance.

**RN-15 — `epic-07-sharing-and-access-control.md`, US-E07-02: the largest semantic conflict in the
document set.** AC1(b) and AC2 specify an `inheritMode: 'override'` model in which resolution walks
upward and stops at the first override, "so a Viewer override on `Financials` beats a Manager grant on
the room", with a unit test asserting that widening the room grant does not widen the overridden
subtree. The business rules specify the opposite model in five rules: BR-064 (no negative grant, no
deny rule and no exclusion in R1), BR-065 (a more permissive descendant grant wins), BR-066
(effective role is the *maximum* over every applicable grant), BR-069 (a direct grant "does not
override an inherited grant that is more permissive, and it cannot reduce inherited authority") and
BR-070 (adding a narrower descendant grant "has no restricting effect"). The story is subtractive; the
rule book is additive. Its Traces-to row cites BR-061, BR-078, BR-079 and BR-080 and none of the five
rules it contradicts. This must be decided before US-E07-02 is built in sprint 8, because
US-E06-01, US-E07-03, US-E07-13, US-E07-15 and US-E11-04 all inherit the answer.

**RN-16 — `epic-07-sharing-and-access-control.md`, US-E07-02, AC3** states the recipient's breadcrumb
is "rooted at the link scope (never showing ancestor names)". BR-078, which the same story cites in
its Traces-to row, states that a visitor arriving through a link "sees the ancestor chain above the
link's scope as non-navigable labels showing names only". The story contradicts a rule it claims to
trace.

**RN-17 — `epic-01-access-and-identity.md`, US-E01-01, AC1** requires the `Subject` discriminated
union to have "exactly two variants", `user` and `guest`. BR-001 defines four principal types:
account holder, invited guest, anonymous link visitor and system. BR-009 gives the anonymous link
visitor authority re-derived from its link token on every request, which a guest variant bound to an
invited email cannot express. BR-012 requires every system-principal action to be logged with the job
name as the actor, which a two-variant union cannot represent, and BR-012 also states that no action
is ever recorded with no actor. The conflation is already visible in US-E01-08, whose acceptance
criteria call the result "an anonymous guest session", mixing BR-008 and BR-009. Decide in sprint zero:
this is the highest-blast-radius open item in the backlog.

**RN-18 — `epic-01-access-and-identity.md`, US-E01-05: three numeric contradictions in one story.**
AC1 sets the access token at "Assumption: 10 minutes"; BR-023 sets a maximum of 5 minutes. AC3 sets
"90 days rolling, 180 days absolute"; BR-023 sets 90 days as the maximum refresh-credential lifetime,
so the 180-day absolute ceiling exceeds the rule. AC8 gives a guest session "30 days rolling";
BR-024 gives guest and anonymous-link sessions an absolute 12-hour ceiling, a 60-fold difference and
the one with a real confidentiality consequence. The story's Traces-to row cites BR-019 (passkeys)
rather than BR-023 and BR-024, which is why the conflict was not caught at authoring time. The same
10-minute figure is repeated in the epic's Mobile-first design stance.

**RN-19 — `epic-01-access-and-identity.md`, US-E01-01 AC7 and US-E01-17 versus BR-011.** BR-011
requires that when a person verifies an account on an email address holding guest grants, "every one
of those grants transfers to the new account ... without any action by the granting principal", and
the guest identity is retired. US-E01-01 AC7 instead requires the grants to be "listed as claimable"
behind "a deterministic merge operation ... rather than silently linking them", and the epic's edge
cases state "no automatic linkage". US-E01-17, which implements the claim, is Could/R2, so BR-011 is
not implemented at all in R1, and when it is implemented it is implemented backwards. Decide whether
BR-011 or the epic is authoritative; BR-031 says the rule wins.

**RN-20 — `epic-08-conflict-resolution-and-data-integrity.md`, US-E08-16, AC5: resolved.** The AC stated
the retention policy as "Assumption: 10 versions or 90 days on paid plans, 1 prior version on free"
while citing BR-186, which requires a file to retain "at least the 3 most recent versions regardless of
age". The free-plan figure broke the floor the cited rule sets, and the 10-version cap appeared nowhere
in the rule. Both were commercial artefacts and are gone: AC5 now states the administrator-configurable
window of BR-186 plus the always-keep-3 floor, and cites nothing that does not exist. The version window
itself is configured in US-E12-23.

**RN-21 — `epic-09-mobile-ux-foundations.md`, US-E09-13, AC2 versus five consuming stories and
BR-176.** US-E09-13 fixes the undo window at "6 seconds for non-destructive actions and 10 seconds for
destructive ones". Five stories that consume the component specify 10 seconds for non-destructive
operations: US-E03-09 ("persists 10 seconds even across a navigation"), US-E04-09 AC4 ("for 10
seconds"), US-E04-10 (10-second undo on staging clear and on paste), US-E04-12 and US-E08-14. BR-176
mandates 10 seconds for every delete. US-E09-14's mobile acceptance criteria introduce a third value,
30 seconds, for the background-and-return path. And OQ91 in `epic-09` records the number as an open
question owed before R1 code freeze, while AC2 has already hard-coded it. Resolve OQ91 before sprint
4, when US-E09-13 is built, and make every consumer read the component's value rather than restating
a number.

**RN-22 — retention citations are wrong in two stories.** The retention windows themselves are
consistent at 30 days across US-E02-13, US-E01-18, US-E08-14 and US-E12-18, which is good. The
citations are not: US-E02-13 attributes the room's 30-day retention to BR-014 (which is about Owner
authority) and US-E01-18 attributes the account's 30-day retention to BR-022 (which is about emailed
authentication artefact expiry). The correct rules are BR-177 for trash and BR-190 for account
deletion. US-E12-18 cites BR-190 correctly.

### Duplicated and overlapping scope

**RN-23 — eleven pairs of stories specify the same surface under two IDs.** Each pair will either be
built twice or fought over in code review. Each needs one owning story, with the other reduced to
"consumes X" and re-estimated.

| Overlap | Stories | Recommended owner |
| --- | --- | --- |
| Selection mode and the bulk action bar | US-E09-08 and US-E04-08 (near-identical titles) | US-E09-08; reduce US-E04-08 to the file-specific bulk actions |
| The list/item row | US-E09-05 and US-E05-01 | US-E09-05; US-E05-01 becomes the file-specific row content |
| The destination picker | US-E09-09, re-specified in US-E03-09 and US-E04-09 | US-E09-09 |
| Trash, restore and permanent delete | US-E04-12 versus US-E08-14 and US-E08-15 | US-E08-14 / US-E08-15 own the trash system |
| Restore a deleted item | US-E03-11 and US-E08-14 | US-E08-14 |
| Upload name collision | US-E04-07 and US-E08-07 | US-E08-07 |
| Name rules, length and Unicode | US-E03-14 and US-E08-01 / US-E08-02 / US-E08-03 | E08 owns the rules; US-E03-14 becomes the folder-facing UI |
| Account deletion | US-E01-18 (8 pts, R2) and US-E12-18 (5 pts, R1 per RN-13), both Must | US-E12-18 owns the flow, because FR-AUTH-028 assigns it to E12; US-E01-18 keeps the session, credential and sign-out half. Neither file currently says this — see RN-04 |
| Per-room storage figures | US-E02-18, US-E12-03 and US-E10-17 | US-E10-17 owns accounting, US-E12-03 owns presentation, US-E02-18 becomes a room-card field |
| List virtualisation | US-E10-02 and US-E06-08's "virtualised result list" | US-E10-02 |
| Details sheet | US-E05-05 ("File and folder details") and US-E03-16 ("Folder details sheet") | US-E05-05 |

### Convention deviations

**RN-24 — sixteen stories use an internal actor instead of a P1-P6 persona.** The convention lists
personas as P1..Pn, and the Persona column of this index therefore has to record "internal" for:
US-E01-01, US-E04-01, US-E06-01, US-E06-12, US-E07-01, US-E08-01, US-E08-10, US-E09-01, US-E09-02,
US-E10-01, US-E10-10, US-E10-12, US-E10-13, US-E10-18, US-E11-01, US-E12-01. Eight of them do name
the persona they serve ("As a platform engineer building for P4 Ashley Kim"), which is workable:
US-E01-01, US-E04-01, US-E06-01, US-E07-01, US-E08-01, US-E08-10, US-E10-01, US-E11-01. The other
eight name no persona at all: US-E06-12, US-E09-01, US-E09-02, US-E10-10, US-E10-12, US-E10-13,
US-E10-18, US-E12-01. Either the convention should admit an explicit internal actor, or these stories
need a persona so that the persona coverage of the backlog can be audited.

**RN-25 — every one of the twelve files links `../12-risks-and-open-questions.md`, which does not
exist** in `docs/`. `docs/README.md` indexes it twice as well. Either the file is written or twelve
Related-documents lists and two README rows are corrected. All twelve files link
`../03-product-overview.md` and `../11-master-backlog.md` correctly.

**RN-27 — the internal-tool rework, applied to this index.** The product is an internal tool, so the
commercial surface was withdrawn from the document set rather than deferred. Eight E12 stories are
retired permanently — US-E12-09 to US-E12-16 — and are tombstoned in
[`epic-12`](./backlog/epic-12-account-storage-and-governance.md) with the reason for each. Seven
replacement stories take **fresh** numbers, US-E12-19 to US-E12-25, covering FR-ACCT-027 to FR-ACCT-034:
the administrator-set quota and its default, the never-delete quota reduction, provisioning,
deprovisioning, the retention and limit settings, the administrator role itself, and the optional
team-level ceiling. No withdrawn number is reused anywhere. Net effect on this index: **-8 stories,
+7 stories, -102 points, +92 points**, and E12 moves from 18 stories / 102 points to 17 / 92. Two
knock-on resolutions are recorded above (RN-04, RN-13) and one is closed (RN-20). Anything still
reading as commercial in a story, an out-of-scope row or an open question is a defect against this note.

**RN-26 — sibling-link lists are incomplete in six files**, against the convention that each file
links its siblings: `epic-01` omits E05, E06, E08 and E10; `epic-02` omits E05; `epic-03` omits E12;
`epic-07` omits E06 and E10; `epic-08` omits E06 and E12; `epic-09` omits E11 and E12. E09 omitting
E11 and E12 is the notable one, since E09's own Epic summary claims it blocks E01 to E08 and its
components are in fact consumed by E11 and E12 as well.
