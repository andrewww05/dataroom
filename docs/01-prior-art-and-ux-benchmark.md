# Prior Art & UX Benchmark — Mobile-First Data Room

## Purpose

This document is the evidence base for the design decisions in the rest of this set. Data Room is an
internal tool: our own staff build permissioned document sets and share them outward to external
recipients. It is not a product anyone acquires, so every question this file used to ask about who
would acquire it is gone. It asks four engineering questions instead.

1. What do comparable products already do, and what does each one's mobile surface actually support
   when you look at it rather than at its marketing?
2. Where, specifically and verifiably, does each one's mobile experience fail?
3. What do practitioners complain about loudly enough that the complaint is reliable evidence of a
   failure mode we could repeat?
4. Which of those failure modes does each of our epics now exist to prevent?

Comparable products are referred to throughout as **prior art**. Everything here is either a
primary-source observation with a citation, or is labelled `Assumption:` / `Estimate:`. The file's
job is to justify design decisions, not to promote anything.

## Related documents

- [Documentation index](./README.md)
- [Personas & Jobs-to-be-Done](./02-personas-and-jtbd.md)
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
- [Access & Identity stories](./backlog/epic-01-access-and-identity.md)
- [Sharing & Access Control stories](./backlog/epic-07-sharing-and-access-control.md)
- [Mobile UX Foundations stories](./backlog/epic-09-mobile-ux-foundations.md)

**Where numbers live.** This file owns no thresholds, no release tags and no metric IDs. Release
tags and priorities are owned by [05](./05-functional-requirements.md); thresholds, timings,
retention windows and permission rules by [06](./06-business-rules-and-permissions.md); metric IDs
and event names by [10](./10-success-metrics-and-analytics.md); the responsive size-class ladder by
[03](./03-product-overview.md); entity field names and error codes by
[09](./09-domain-model-and-glossary.md). Where a number appears below for readability it is written
with its owning ID in parentheses.

---

## What we learned that changes the build

Twelve findings, each stated as the build consequence it forces. Everything after this section is the
evidence for these twelve.

1. **Long-press must not open the action sheet.** iOS Files, Google Drive and Dropbox all use
   long-press to enter selection, and a hidden gesture as the only route to an action fails WCAG
   2.5.1 Pointer Gestures. So the action sheet opens from a visible overflow ("...") control of at
   least 48 x 48 CSS px on the trailing edge of every row, and long-press enters multi-select and
   selects that row (D01: FR-MOB-001, FR-FILE-035, US-E09-06). One meaning per gesture, product-wide.

2. **No comparable product lets a sharer administer from a phone, and three vendors document the gap
   themselves.** Google: "You cannot turn the limited access setting on or off for folders from your
   mobile device; you must do this from the web." [15] Box: "enabling and disabling watermarking on a
   folder is supported only on the Box Web app." [17] iDeals' own reviewers: no folder upload and no
   permission management in the app. [35] So the rule for our build is absolute: **no staff action
   may be desktop-only.** Create, nest, rename, move, delete-with-warning, invite, scope, revoke, set
   read-only and toggle download are all first-class touch operations
   ([E03](./backlog/epic-03-folder-hierarchy-and-navigation.md),
   [E04](./backlog/epic-04-file-operations.md),
   [E07](./backlog/epic-07-sharing-and-access-control.md),
   [E09](./backlog/epic-09-mobile-ux-foundations.md)).

3. **Unconfirmed destructive actions are the single most damning report in the research, and it comes
   from a mouse-driven product.** An Intralinks reviewer: "you may move folders unintentionally and
   you wouldn't notice since it doesn't ask for changes confirmation". [33] With a thumb on a 390 CSS
   px viewport (compact size class, [03](./03-product-overview.md)) that is the default outcome, not
   the edge case. So: count-bearing cascade warnings before recursive delete, soft-delete with trash,
   a 10-second undo on delete, move and rename (BR-176), and commit on the up-event with an abort
   path ([E03](./backlog/epic-03-folder-hierarchy-and-navigation.md),
   [E08](./backlog/epic-08-conflict-resolution-and-data-integrity.md),
   [E09](./backlog/epic-09-mobile-ux-foundations.md)).

4. **Large-file preview is the one failure reported against every product in the research, regardless
   of pedigree.** So the viewer never decodes a large document in the tab: server-side page rendering
   above the 25 MB threshold inlined into FR-VIEW-016 (D11), progressive page-at-a-time streaming,
   and first-page paint on a throttled mobile connection as a measured release gate
   ([E05](./backlog/epic-05-viewing-preview-and-file-details.md),
   [E10](./backlog/epic-10-performance-offline-and-scale.md)).

5. **Upload stalling is the loudest operational complaint at any tier.** [34] So: resumable chunked
   upload with the resume offset committed *before* each chunk, a queue reconstructed on next app
   open, an honest paused state, and no copy anywhere claiming background upload the platform does not
   provide ([E04](./backlog/epic-04-file-operations.md),
   [E10](./backlog/epic-10-performance-offline-and-scale.md)). The offline mutation queue holds
   exactly the three kinds of mutation listed in BR-130 and no more (D17).

6. **Search is primary navigation on a phone, and "search doesn't always work" is a headline
   complaint against prior art.** [33] So filename search must be correct and fast from R1, with scope
   selection, path-bearing result rows and jump-to-location, and it must emit `search_performed`
   (FR-SRCH-022) — an event that has to exist in 10's dictionary, because that dictionary is the
   build gate (D13) ([E06](./backlog/epic-06-search-and-discovery.md)).

7. **Version and duplicate-name handling is where prior art quietly corrupts a document set:**
   versions uploading as "copy" and accumulating. [33] So every collision offers exactly three
   choices — keep both, replace as a new version, cancel — and never resolves silently (FR-CONF-006,
   D14). There is no fourth option and no folder merge
   ([E08](./backlog/epic-08-conflict-resolution-and-data-integrity.md)).

8. **Session and entitlement loss is a reported mobile failure, and fixing it must not weaken
   revocation.** An Intralinks App Store review: "Works well for like 24 hours and then the exchange
   is removed". [7] So sessions are long-lived and re-authentication is a step-up prompt rather than a
   lockout — while the API still consults grant state per request, so revocation propagates inside 5
   seconds at p95 and 60 seconds absolutely (BR-108), helped by the 30-second loaded-page re-check
   (BR-112) and the 5-minute access-credential ceiling (BR-023)
   ([E01](./backlog/epic-01-access-and-identity.md),
   [E07](./backlog/epic-07-sharing-and-access-control.md)).

9. **A dead link must disclose nothing.** Prior art routinely tells an unauthenticated visitor
   whether a resource exists, when it expired, or that they "do not have access". A principal holding
   no grant gets 404 NOT_FOUND, byte-identical and timing-equivalent to a genuinely absent resource,
   and a dead, expired or revoked link renders one generic state: "This link is no longer active."
   (D02). Never an expiry date, never an existence oracle.

10. **The trust features staff will demand the first time a shared document leaks are a named
    increment, not a someday.** R1.1 exists for exactly three things — dynamic per-viewer watermark,
    per-viewer access log, and share-link expiry — defined in
    [03's release plan](./03-product-overview.md) and tagged per requirement in
    [05](./05-functional-requirements.md) (D03, D04). Recipient-tracking disclosure ships in the same
    increment as the tracking itself, and the first view event is not recorded until the recipient
    has seen the notice (D08).

11. **The external recipient on a phone with no account is the most demanding surface in the
    product.** The whole point of a share link is that somebody outside the company taps it, usually
    from an in-app WebView inside Gmail, iOS Mail, LinkedIn or Slack, and reads a legible document
    without installing anything or creating an account (NFR-COMPAT-006, NFR-COMPAT-007).
    `Assumption:` staff sign in through the company identity provider (SSO / OIDC) as the primary
    path, with email, passkey and biometric as the fallback; which IdP is an open question tracked in
    [12](./12-risks-and-open-questions.md). Recipients have no IdP and never will.

12. **Nobody publishes the device split for this kind of workload, so we have to measure our own.**
    Every vendor checked captures device per view and none discloses it. So device class, session
    length, recipient device and staff-action-by-device are instrumented from R1, under the metric IDs
    and event names owned by [10](./10-success-metrics-and-analytics.md). We do not repeat anyone
    else's device-share figure and we do not invent one.

---

## Method and confidence

**Research date:** 2026-08-21. All app-store, vendor-documentation and product-page observations in
this document were retrieved on that date and are point-in-time snapshots. Re-verify before relying
on any of them for a build decision more than a couple of quarters from now.

### What was researched

| Area | Method | Primary sources used |
| --- | --- | --- |
| Prior-art inventory and mobile capability | Apple App Store and iTunes Search/Lookup APIs, plus vendor support documentation | 22 products checked; vendor docs from Google, Box, Dropbox, Microsoft [15][17][14][19] |
| Documented mobile limitations | Vendor help centres and release notes, quoted verbatim | Google Drive Help, Box Support, Dropbox Help, Microsoft Community Hub [15][16][17][19] |
| Practitioner complaints | Capterra and G2 review-theme summaries, plus visible App Store reviews | Datasite, Intralinks, Firmex, iDeals, Papermark [32][33][34][35][36] |
| Mobile adoption evidence in an adjacent workload | App Store rating counts as an adoption proxy; board-portal category | OnBoard, Boardvantage, Diligent [46][44][45] |
| Platform and device baseline | StatCounter via Statista; vendor platform documentation | [41][21][22] |

### Confidence by claim class

| Claim class | Confidence | Why |
| --- | --- | --- |
| Vendor-documented mobile gaps (Google limited access, Box watermarking, DocSend no app, Microsoft Lists retirement) | **High** | Primary sources, quoted verbatim, from the vendor's own documentation. [15][17][14][19] |
| App Store release dates, ratings and rating counts | **High** | Retrieved from Apple's own APIs on 2026-08-21. Point-in-time; will drift. [5][7][8][9] |
| Reported failure modes drawn from review sites | **Medium** | Review-theme summaries are self-selected and undated at the item level. They are used here as evidence that a failure mode is *common*, never as a measurement of frequency. [32][33][34][35][36] |
| Absence of a mobile app for Ansarada, CapLinked, ShareVault, Onehub, Orangedox, Peony, DealRoom, Papermark, SecureDocs | **Medium** | Apple search returned nothing and the vendors' own public documentation never mentions mobile. Absence of evidence corroborated by vendor silence, not a vendor denial. |
| Rating counts as a proxy for mobile adoption | **Low to medium** | Directionally useful across three orders of magnitude, useless at the margin. Never convert a rating count into a user count. |

### Gaps we could not close, stated honestly

1. **The device split for data-room-shaped reading does not exist publicly.** Papermark, DocSend,
   Datasite, Intralinks and iDeals were all checked for a device breakdown of room viewers. None
   publishes one. Papermark's product documentation confirms device data is captured per view, so the
   number exists inside these products and is not disclosed. The one circulating figure ("mobile
   access rates are typically under 15% for most deals") comes from an SEO comparison blog with no
   methodology, and in any case it measures supply in a category where nobody has shipped a usable
   phone product. **Do not put a mobile-share percentage in any document in this set.** Instrument it
   from R1 instead; see [Success metrics](./10-success-metrics-and-analytics.md).

2. **Aggregate web traffic in our geographies is still desktop-majority, and that tension is recorded
   rather than smoothed over.** StatCounter for July 2026 has the United States at desktop 54.0% /
   mobile 43.85% and Europe at desktop 51.79% / mobile 46.15%, while global mobile web traffic has
   passed 50% (51.48% in Q2 2026). [41] Mobile-first here is a bet on two specific behaviours —
   external recipients opening a link on a phone, and our own staff acting between meetings and on
   site — plus the fact that no comparable tool is touch-native. It is not a claim about aggregate
   device share and must never be presented as one. Carried into
   [Risks & open questions](./12-risks-and-open-questions.md).

3. **Third-party directory data about these products is demonstrably wrong.** Capterra still tags
   Firmex as "Web, Android, iPhone/iPad" while Apple's lookup API returns `resultCount 0` for the
   Firmex iOS app ID. [9][34] Any claim we make internally about what a comparable product can do must
   be sourced to a vendor document or an app store, never to a directory or a comparison blog.

4. **Some behavioural evidence is old.** Where a figure is the only measurement available and is
   dated, it is labelled at the point of use.

---

## Prior art: what comparable tools do, and where their mobile experience fails

All 22 products in the research. The mobile column states what was actually observed on 2026-08-21,
not what the vendor advertises. What each tool *can do on a phone* is the only thing we build
against, so that is what the table records; the withdrawn columns are listed in the notes at the end
of this file.

| Product | Category | What it is built for | Mobile experience observed | Worth copying | Where the mobile experience fails |
| --- | --- | --- | --- | --- | --- |
| **Datasite (Diligence)** | Enterprise VDR | Investment banks, PE and corp dev running mid to large-cap M&A, divestitures and IPO prep | Strongest genuine effort in the category. Native iOS and Android. iOS v4.6.0, 6 Aug 2026, 4.9/5 from **173** ratings, 142 MB. Documents in-app scan-to-upload, translate, Q&A, user and permission management, biometric login plus Intune. Own claim: "you could run an entire deal from start to finish using only the mobile app" [5][6] | **Capture-to-room is validated by a funded vendor.** In-app scan straight into a project is the right feature and the only instance of it in the research. Biometric unlock and device management are treated as normal, not exotic | 173 ratings against a platform credited with roughly 13,000 deals a year: the app is a companion for a sliver of participants. Dated multi-click UI, documents open one at a time, large-file performance problems, "Learning curve is steeper than it should be" even for people who have used other VDRs [32] |
| **SS&C Intralinks (VDRPro)** | Enterprise VDR | Bulge-bracket banks, large-cap and cross-border M&A, DCM | Largest mobile installed base in pure VDR. iOS v3.10.2, 18 Jun 2026, 4.47/5 from **1,285** ratings, 94 MB. Visible App Store reviews: "Documents cannot be viewed within the app", "Works well for like 24 hours and then the exchange is removed" [7] | Flexible permission profiles and per-folder scoping as a first-class concept | The most instructive failure set in the research. Viewing fails inside the app; sessions or entitlements evaporate after about a day; search "doesn't always work"; versions upload as "copy" and get messy; and folder moves happen **without a confirmation prompt** — "you wouldn't notice since it doesn't ask for changes confirmation" [7][33] |
| **Ansarada** | Enterprise VDR | Process-driven transactions: M&A, capital raising, infrastructure and government procurement, tenders | **No native app.** Apple search returns no Ansarada application, and the vendor's own documentation never mentions mobile; accessed through mobile browsers [11]. Reviewer: "performance of access via mobile devices sometimes feels slower, and the preview process for some fairly large files is very long" | AI-assisted auto-indexing of an uploaded document set; strong structured Q&A | No app at all, and slow mobile preview of large files is the specific reported symptom. A storage meter that discourages uploading is directly hostile to phone capture |
| **iDeals** | Mid-tier VDR | Mid-size M&A, PE/VC, corporate finance, real estate, life sciences | **App effectively abandoned.** iOS v4.2.0, last released **4 Nov 2024**, 3.67/5 from **3** ratings, 6.8 MB, "Designed for iPad". Most recent release note is a new logo and colour scheme. G2 reviewers: cannot upload folders or manage permissions from the app [8][35] | Fast room setup (~30 minutes reported) and a modern web UI | The two operations that define a sharer's job — folder upload and permission management — are desktop-only, and reviewers say so: "which is problematic for those working on-the-go". A 6.8 MB iPad-designed shell is a wrapper, not a client [35] |
| **Firmex** | Mid-tier VDR | Smaller M&A transactions, law firms, accounting and advisory | **iOS app delisted.** Lookup API for ID 1156584536 returns `resultCount 0`; App Store page 404s; term search returns nothing. Vendor's own documentation never mentions mobile, while Capterra still advertises "Web, Android, iPhone/iPad" [9][34] | Highest satisfaction score in its cohort on the web product (4.8/5, 358 reviews) [34] | Mobile web only in practice. Reported: "Uploading of documents often stalls requiring further intervention"; unclear folder structures; navigation "difficulty to figure out on your own without requesting support" [34] |
| **DealRoom** | Mid-tier VDR | Corp dev and PE running repeatable pipelines; acquirer-side heavy | **No native app found.** Vendor documentation never mentions mobile [12] | Pipeline, diligence and integration in one workspace | Its centre of gravity is dense tables and Kanban boards, the two least survivable patterns at compact width. Nothing has been attempted for touch |
| **SecureDocs (Onit)** | Mid-tier VDR | Smaller transactions plus ongoing repositories | No app surfaced. Product page shows smartphone imagery but never claims mobile capability [13] | A genuinely fast room-creation flow (~10 minutes reported) | The fast-setup claim is desktop-only in practice, because folder creation and bulk permissioning are exactly the operations with no mobile path |
| **Digify** | Small-team doc-sharing | Startups, boutique advisory, SMBs, individual dealmakers | **Viewer-only on Android, nothing on iOS, and unmentioned by Digify's own feature pages.** "Digify Viewer" on Play scopes itself to viewing and directs users to digify.com in a browser for "the full secure file sharing features" [31][30] | A strong document-control set (watermark, expiry, download control), 4.8/5 from 178 reviews on the web product, and a credible API story [29] | The clearest statement of the pattern in the whole research: the recipient can read on a phone, the sharer cannot administer from one, and the vendor documents the redirect to a browser as the answer [31] |
| **Dropbox DocSend** | Small-team doc-sharing | Sending a document to an external reader and seeing what they read | **No native app, vendor-confirmed:** "Currently, DocSend does not have a dedicated mobile app." Browser-only, with instructions to add a home-screen shortcut as the substitute [14] | Page-level per-viewer analytics — the clearest prior art for our per-viewer access log | The entire proposition is that a busy external reader opens a link, which is the highest-probability mobile moment in this whole workflow, and there is no mobile product behind it |
| **Dropbox** | General cloud storage | General file storage and sharing; used as an ad-hoc data room everywhere | **Best-in-class app in this research, and the only general-storage product where sharing governance is reachable from a phone.** iOS v486.3, 20 Aug 2026, 4.80/5 from **885,897** ratings. Dropbox's own help documents setting link password and expiry **in the mobile app** [20] | Proof that link password and expiry *can* be first-class mobile controls. Instantly familiar interaction model for external recipients | None of the data-room primitives exist on any platform: no per-viewer page analytics, no dynamic watermarking, no per-recipient scoping, no defensible activity trail |
| **Google Drive / Workspace** | General cloud storage | Everything. The most common accidental data room, including inside our own company | Largest installed base of any product here: iOS v4.2633.41200, 17 Aug 2026, 4.78/5 from **7,737,057** ratings, 451 MB. **Disqualifying documented gap:** "You cannot turn the limited access setting on or off for folders from your mobile device; you must do this from the web" [15]. From 22 Sep 2025 parent-folder permissions always cascade, and a limited-access subfolder is the only workaround [16] | Universal reach, zero onboarding friction for a recipient, excellent viewing and offline behaviour. This is the interaction quality bar our own staff will measure us against | The core act — scoping a subfolder to one external party — is structurally impossible from a phone in the product our staff would otherwise use. No watermarking, no per-viewer analytics, no instant per-file revocation |
| **Box** | General cloud storage | Larger and regulated organisations; presents "virtual data room" as a use case [23] | Strong general app: iOS v7.3.0, 6 Aug 2026, 4.76/5 from **190,273** ratings. Mobile can browse, preview, search, upload, download, move, copy and delete [18]. **Precisely documented failure:** "enabling and disabling watermarking on a folder is supported only on the Box Web app. While this setting cannot be configured on mobile, on Box Mobile watermarks are still visible" [17] | The full set of ordinary file operations working properly on a phone — browse, move, copy, delete — is the baseline we must match before we add anything | The single most data-room-defining control Box has is web-only to configure. Watermarks *render* on mobile but cannot be *set* there, which is the sharer/recipient asymmetry in one sentence |
| **Microsoft OneDrive / SharePoint** | General cloud storage | Any organisation already standardised on Microsoft 365 | Two solid apps: OneDrive iOS v18.8.2, 18 Aug 2026, 4.70/5 from **486,855**; SharePoint iOS v5.0.6, 11 Aug 2026, 4.62/5 from **139,325**. Everything that would make this a data room — sensitivity labels, DLP, external-sharing policy, conditional access, audit — is configured in desktop-web admin centres. **Strategic signal:** Microsoft retired the Lists mobile apps in Nov 2025, directing users to mobile web as part of its "ongoing commitment to deliver the best possible experience through web-based solutions" [19] | A genuine compliance and audit stack, and two well-maintained clients in front of it | Governance lives in an admin console that has no mobile surface at all, and the vendor is actively retreating from mobile apps toward mobile web. External sharing is IT-policy-bound rather than sharer-controlled |
| **Notion** | Adjacent | Teams publishing a structured page or lightweight portal [24] | Excellent app, wrong shape of product. iOS v1.7.329, 20 Aug 2026, 4.78/5 from **89,833** ratings, with Recents and Favorites auto-downloading for offline reading | The offline pattern: recently-viewed content available without a connection, with no explicit user ceremony | None of the security primitives exist: no watermarking, no link expiry, no per-viewer analytics, no per-file revocation. Published pages leak by forwarded link and "Duplicate as template" lets a viewer copy the whole room. Not a file manager: nested folders are pages, and there is no bulk tree upload |
| **Papermark** | Small-team doc-sharing | Small teams sending documents and data rooms to external readers; the nearest prior art to what we are building [25] | **No app, and mobile is its most-cited weakness in its own G2 reviews:** "larger files take a while to load and the mobile viewing experience could be improved", explicitly flagged as "a major concern since most participants open documents from their phones", plus "harder to navigate on mobile" [36] | Unlimited external viewers with page-by-page analytics as a normal expectation, not a premium feature. Open-source, so the data model is inspectable | Its own users are describing our requirements: slow large-file loading, poor mobile navigation, no touch-native interaction system. It has the controls and no mobile surface |
| **Peony** | Small-team doc-sharing | Advisers and deal teams sending permissioned document sets | Browser only. No app; the product emphasises browser access and web-based viewing [27] | Free unlimited recipients as an architectural assumption — recipients are never treated as accounts | Room construction, permission scoping and Q&A triage are desktop-web workflows rendered small |
| **Onehub** | Small-team doc-sharing | Client portals and light data rooms | No app surfaced; treat as mobile-web only, not vendor-confirmed | Explicit portal-per-client model | No mobile surface, no touch design work visible |
| **CapLinked** | Mid-tier VDR | Mid-size transactions, asset sales, fundraising | No app surfaced; mobile-web only on current evidence, not vendor-confirmed | — | No mobile evidence of any kind |
| **ShareVault** | Mid-tier VDR | Life sciences and biotech partnering diligence, plus general M&A | No app surfaced. Not vendor-confirmed | — | No mobile evidence. The workload (thousand-file dossiers, 500-page PDFs, imaging sets) is also the least phone-shaped in the research |
| **SmartRoom (BMC Group)** | Mid-tier VDR | Mid-size and restructuring-adjacent transactions | Maintained but essentially unused: iOS v1.7.3, 28 Jul 2026, 5.0/5 from **4** ratings, 24 MB, iOS 15.1+ | — | 4 ratings. The app is current and nobody uses it, which is the pattern across the whole mid-tier cohort: apps ship as shrunken desktop clients and then nobody opens them |
| **Orangedox** | Adjacent | Tracking and controlling documents that live in Google Drive or Dropbox | No mobile features mentioned in any vendor documentation; no app found [28] | Meeting users where their files already are, with no migration | **Inherits Google Drive's mobile permission ceiling wholesale.** Since limited-access folders cannot be created on mobile per Google's own docs, an overlay on Drive cannot fix the underlying gap [15] |
| **OnBoard (Passageways)** | Adjacent: board portal | Boards and corporate secretaries distributing and reviewing meeting material | **The benchmark.** iOS v2.44.0, 9 Jul 2026, 4.7/5 from **4,716** ratings — roughly 27x Datasite's rating base and 3.7x Intralinks', across far fewer organisations. Category peers ship offline modes (Boardvantage "Briefcase", Diligent offline preview) [46][44][45] | Proof that secure document review on a phone is mass-adopted when somebody builds it for a phone. Offline-first patterns, annotation, voting and notes designed for touch | Not a data room: read-and-vote, not build-and-permission. No external-party scoping, no per-recipient watermark control. And incumbency guarantees nothing even here: Diligent Boards 3.2/5 from 54 ratings, BoardEffect 3.5/5 from 48 |

### Mobile maturity scorecard

Scoring scale, applied consistently. "Administer" means the sharer-side operations that define our
product: create, nest, rename, move, delete-with-warning, invite, scope a permission, revoke, set
read-only, toggle download.

| Score | Meaning |
| --- | --- |
| **0** | No mobile surface documented or discoverable at all |
| **1** | Mobile web only, and the vendor never claims mobile capability |
| **2** | An app exists but is a viewer, a wrapper, or unmaintained |
| **3** | Maintained app: read, browse, search, light file actions. Administration is web-only |
| **4** | Maintained app with most administration operations, with named gaps the vendor documents |
| **5** | Phone-native: every sharer action is a first-class touch operation |

| Product | Native app | Last iOS release | Rating / count | Recipient can read on phone | Sharer can administer on phone | Capture into a folder on phone | Score | One-line verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Datasite** | iOS + Android | 6 Aug 2026 | 4.9 / **173** | Yes | Mostly (users, permissions, Q&A, analytics claimed) | **Yes**, in-app scan-to-upload | **4** | The best in the category, with 173 ratings proving almost nobody uses it |
| **Intralinks** | iOS + Android | 18 Jun 2026 | 4.47 / **1,285** | Partially: a visible review says "Documents cannot be viewed within the app" | Partially (folder and document permission management listed) | No | **3** | Biggest mobile base in pure VDR, and reviewers report viewing and session failures |
| **Dropbox** | iOS + Android | 20 Aug 2026 | 4.80 / **885,897** | Yes, excellent | Link password and expiry yes; no data-room controls exist to administer | Yes (camera upload) | **3** | Superb app, no data-room controls on any platform |
| **Box** | iOS + Android | 6 Aug 2026 | 4.76 / **190,273** | Yes | Browse/move/copy/delete yes; **watermarking configuration web-only, vendor-documented** | Yes | **3** | Excellent file app, and its defining control cannot be set from a phone |
| **Google Drive** | iOS + Android | 17 Aug 2026 | 4.78 / **7,737,057** | Yes, excellent | **No.** Limited-access folders cannot be toggled on mobile, per Google's own docs | Yes | **2** | Universal reach, structurally incapable of the core scoping act on a phone |
| **OneDrive / SharePoint** | iOS + Android | 18 Aug / 11 Aug 2026 | 4.70 / 486,855 and 4.62 / 139,325 | Yes | No: labels, DLP and external-sharing policy are admin-web | Yes | **2** | Two good apps in front of governance that lives somewhere else, and a vendor retreating to mobile web |
| **Notion** | iOS + Android | 20 Aug 2026 | 4.78 / **89,833** | Yes, with offline | No controls exist to administer | Partially | **2** | Great app, no security primitives, not a file manager |
| **SmartRoom** | iOS | 28 Jul 2026 | 5.0 / **4** | Yes | Unknown | Unknown | **2** | Maintained and unused. The mid-tier pattern in one data point |
| **Digify** | Android viewer only | n/a for iOS | not published | Yes on Android | **No**, explicitly: the listing directs users to a browser for full features | No | **2** | Recipient reads, sharer cannot administer, and the vendor never claims mobile |
| **iDeals** | iOS, stale | **4 Nov 2024** | 3.67 / **3** | Partially | **No**: cannot upload folders or manage permissions, per G2 | No | **1** | A 6.8 MB iPad-designed shell abandoned for nearly two years |
| **Firmex** | **Delisted** | app removed | n/a | Mobile web only | No | No | **1** | The app is gone and directories still advertise it |
| **Papermark** | None | n/a | n/a | Mobile web, criticised by its own reviewers | No | No | **1** | Nearest prior art to our shape, and its users are asking for exactly what we are building |
| **DocSend** | **None, vendor-confirmed** | n/a | n/a | Mobile web, "add a home-screen shortcut" | No | No | **1** | The product whose entire value is "somebody opens your link" has no mobile product |
| **Ansarada / Peony / DealRoom / SecureDocs / Onehub / CapLinked / ShareVault / Orangedox** | None found | n/a | n/a | Mobile web at best | No | No | **0-1** | Vendor documentation does not mention mobile at all |
| **OnBoard (adjacent benchmark)** | iOS + Android | 9 Jul 2026 | 4.7 / **4,716** | Yes, with offline patterns in the category | n/a: no external-party scoping exists to administer | No | **4 for its own job** | Proves phone-native secure document review is mass-adopted. Read-and-vote only |

**The scorecard's conclusion in one line:** nothing in the research scores 5. Score 5 is the product
we are specifying, and it is unoccupied not because it is hard to want but because retrofitting a
touch-first interaction system onto a desktop-first product means rebuilding the interaction layer,
which no vendor with a desktop-shaped install base has chosen to do. We have no such install base,
which is the one structural advantage an internal greenfield build actually has.

### Narrative profiles of the most instructive prior art

#### Datasite: the ceiling of what exists

Datasite is the only product in this research that treats mobile as a first-class surface and the
only one shipping in-app scan-to-upload, described on its own page as "Scan or send new documents
directly into projects while on the go". Its iOS app was updated on 6 August 2026 and rates 4.9/5.
On paper it is close to what we want to build. [5][6]

Two things are instructive. First, adoption: 173 ratings against a platform credited with running
roughly 13,000 deals a year. Even where mobile is funded and marketed, it is a companion for a small
fraction of participants — which tells us the bar is not "ship an app", it is "make the phone the
place the work actually happens". Second, the desktop weaknesses carry straight into the app:
documents opening one at a time, connectivity and performance problems on large files, "dated user
interface requiring multiple clicks for simple tasks". [32] A shrunken desktop client inherits the
desktop's interaction cost and then adds a thumb.

**What we take from it:** capture-to-room is the right feature and somebody funded has validated it
([E04](./backlog/epic-04-file-operations.md)). **What we avoid:** shipping the desktop information
architecture at 390 px and calling it mobile.

#### Intralinks: the cautionary tale about shrinking a desktop client

Intralinks has the largest mobile installed base in the pure-VDR category, 1,285 iOS ratings, and
the lowest satisfaction score in its cohort at 4.1/5. Its own App Store listing carries the review
"Documents cannot be viewed within the app", which a reviewer calls a critical flaw, and "Works well
for like 24 hours and then the exchange is removed", which is a session or entitlement loss. On the
web product, reviewers report that search "doesn't always work", that versions upload as "copy" and
get messy, and that "you may move folders unintentionally and you wouldn't notice since it doesn't
ask for changes confirmation". [7][33]

That last sentence is the most important line in this entire document. On a desktop with a mouse, an
unconfirmed folder move is an annoyance. On a compact viewport operated with a thumb it is the
default outcome. It is direct evidence for the safety requirements in
[E08](./backlog/epic-08-conflict-resolution-and-data-integrity.md) and
[E09](./backlog/epic-09-mobile-ux-foundations.md): confirmation surfaces on every consequential
action, blast-radius warnings before recursive delete, and a 10-second undo on move and rename
(BR-176).

The session complaint deserves equal attention, because the naive fix for it is the wrong one.
"Works well for like 24 hours and then the exchange is removed" makes an engineer want to cache
entitlements client-side and stop checking. Doing that breaks revocation, which is a hard
requirement here: grant state is consulted per request, and the propagation bound is 5 seconds at
p95, 60 seconds absolutely (BR-108), backed by a 30-second loaded-page re-check (BR-112) and a
5-minute access-credential ceiling (BR-023). Long sessions and fast revocation are both achievable;
they just have to be designed together.

#### Papermark: prior art whose own users are writing our requirements

Papermark is the nearest thing in the research to the shape we are building: permissioned document
sets sent to external readers, page-by-page per-viewer analytics as a normal expectation, and an
open-source implementation you can read.

It has no mobile app, and its G2 reviewers say so in terms that read like a product brief: "larger
files take a while to load and the mobile viewing experience could be improved", flagged as "a major
concern since most participants open documents from their phones", plus "harder to navigate on
mobile". [36] The lesson is not competitive, it is architectural: having the right controls does not
give you a phone product, because the interaction system is a separate body of work. That is
precisely why [E09](./backlog/epic-09-mobile-ux-foundations.md) is foundational and sequenced ahead
of the features that consume it, rather than being treated as polish applied afterwards.

#### Google Drive: what our staff will use instead, and its documented structural hole

If we do not build this, our staff will keep doing what they already do: create a shared Drive
folder, because it is instant and already available to them. So Drive is the honest comparison, and it
has 7,737,057 iOS ratings at 4.78 to prove the mobile *experience* is not the problem. [22]

The problem is documented by Google. From the Drive Android help page: "You cannot turn the limited
access setting on or off for folders from your mobile device; you must do this from the web." [15]
And from 22 September 2025, Drive stopped allowing restricted access on individual files inside a
shared folder: parent permissions now always cascade, and the only workaround is a limited-access
subfolder, which per the sentence above cannot be created on a phone. [16] The core act of scoping a
subfolder to one external party is therefore structurally impossible from a phone in the tool our
staff actually use. Add no watermarking, no per-viewer access log, and no instant per-file
revocation, and the risk we are building against is concrete rather than theoretical: a document set
goes out, somebody forwards the link, and there is no mechanism to pull it back or to know who read
it.

**This is the single most load-bearing fact in the document.** It is vendor-published, it is exactly
the gap our epics exist to close, and it applies to Orangedox too, which layers over Drive and
therefore inherits the ceiling. [28]

#### DocSend: the highest-value mobile moment in the workflow is unserved

DocSend's whole proposition is that a busy external reader opens your link. That is the
highest-probability mobile moment in this entire workflow. Dropbox's own help page states:
"Currently, DocSend does not have a dedicated mobile app", and instructs users to add a home-screen
shortcut as the substitute. [14] Its analytics exist partly to tell a sender whether the viewer was
on desktop or mobile — an admission that mobile viewing is routine, offered without a mobile-native
product for it.

**What we take from it:** the recipient path is the product's most important surface. A recipient
must reach a legible document from a link tap, inside an in-app WebView, with no account and no
install (NFR-COMPAT-006, NFR-COMPAT-007;
[E01](./backlog/epic-01-access-and-identity.md), [E05](./backlog/epic-05-viewing-preview-and-file-details.md),
[E07](./backlog/epic-07-sharing-and-access-control.md)).

#### OnBoard: the existence proof, from the workload next door

OnBoard's iOS app carries 4,716 ratings at 4.7/5, roughly 27 times Datasite's rating base and 3.7
times Intralinks', across far fewer organisations. Board portals generally are built for phone,
tablet and offline consumption: Nasdaq Boardvantage ships an offline "Briefcase" mode, Diligent
Boards supports offline document preview. [46][44][45]

Two lessons. Positively: secure document review on a phone is mass-adopted when somebody builds it
properly, which is the strongest available answer to "will professionals really do this on a phone?"
Negatively: it is read-and-vote, not build-and-permission. Nobody constructs a large folder tree or
scopes per-recipient permissions from these apps, and quality is uneven even here (Diligent Boards
3.2/5 from 54 ratings, BoardEffect 3.5/5 from 48). Mobile *reading* is proven prior art. Mobile
*authoring and permissioning* is unbuilt, and it is the half our staff need.

---

## Known failure modes we must not repeat

These are grouped review themes from Capterra, G2 and visible App Store reviews, restated as failure
modes with an owning epic. Every quoted string is from the research; nothing here is invented. Theme
numbering is preserved from the original research so earlier cross-references still resolve, which is
why the list starts at Theme 2 — see the withdrawal note at the end of this section.

### Theme 2: Interaction cost, dated interfaces and learning curve

| Evidence | What we must do instead | Epic that must not repeat it |
| --- | --- | --- |
| Capterra cons for Datasite: "dated user interface requiring multiple clicks for simple tasks", documents having to be opened one at a time, "Learning curve is steeper than it should be" even for people who have used other VDRs [32]. Category-level complaint: "too many clicks required to perform simple actions like moving folders, updating permissions, or answering Q&A in bulk" | Tap-count budgets are a requirement, not a nicety. Specify a maximum tap count for the load-bearing paths: create a room, upload, share read-only, revoke. **Estimate:** 3 taps to share, 3 taps to revoke, and a first usable room inside 4 minutes with no documentation read. The measured version of this belongs to [10](./10-success-metrics-and-analytics.md) | E02, E04, E07, E09 |
| Capterra cons for Firmex: navigation "difficulty to figure out on your own without requesting support"; unclear folder structures [34] | Zero-documentation first run. Room templates and a starting folder skeleton so a new room is not a blank page, because internal colleagues will not read a manual either | E02 (room templates), E09 (empty states) |

### Theme 3: Large-file and preview performance, the most consistently reported failure anywhere

| Evidence | What we must do instead | Epic that must not repeat it |
| --- | --- | --- |
| Ansarada reviewer: "the preview process for some fairly large files is very long". Datasite Capterra cons: connectivity and performance problems on large files, documents must be opened individually [32]. Papermark G2: "larger files take a while to load" [36]. Intralinks App Store: "Documents cannot be viewed within the app" [7] | Server-side rendered, progressively streamed, page-at-a-time viewing above the 25 MB threshold inlined into FR-VIEW-016 (D11), with a benchmarkable first-page-paint target on a throttled mobile connection. Never decode a large PDF in the tab; the iOS memory ceiling makes that a crash generator (see [NFRs](./07-non-functional-requirements.md)) | E05, E10 |
| Ansarada: "performance of access via mobile devices sometimes feels slower" | Mobile performance budgets are release gates measured at p75 on real user monitoring, not lab-only sign-off | E10, NFR-PERF and NFR-MOB families |

### Theme 4: Upload reliability

| Evidence | What we must do instead | Epic that must not repeat it |
| --- | --- | --- |
| Firmex Capterra cons: "Uploading of documents often stalls requiring further intervention" [34]. Field reality from the audience research: signal blackspots in basements and at rural sites, uploads that fail silently and leave a half-loaded folder | Resumable chunked upload with the resume offset committed before each chunk, a queue reconstructed on next app open, and an honest paused state. Never a silent partial failure. Never claim background upload where the platform does not provide it. The offline mutation queue carries exactly the three kinds of mutation in BR-130 (D17) | E04, E10, E08 |

### Theme 5: Search that does not work

| Evidence | What we must do instead | Epic that must not repeat it |
| --- | --- | --- |
| Intralinks Capterra cons: search "doesn't always work" [33] | Search is the primary navigation mechanism on a phone, not a secondary convenience. Filename search must be correct and fast in R1, with scope selection and a result row that shows the containing path and jumps to it, emitting `search_performed` (FR-SRCH-022) into 10's event dictionary (D13) | E06 |

### Theme 6: Destructive actions without confirmation

| Evidence | What we must do instead | Epic that must not repeat it |
| --- | --- | --- |
| Intralinks Capterra cons: "you may move folders unintentionally and you wouldn't notice since it doesn't ask for changes confirmation" [33] | Count-bearing confirmation before any recursive delete, naming the exact number of folders and files. Soft-delete with trash and restore. A 10-second undo on delete, move and rename (BR-176). Destructive commit on the up-event with an abort path. And per D01, long-press selects rather than acting, so the gesture most likely to be triggered accidentally cannot start an action at all | E03 (cascade warning), E04 (trash/restore), E08, E09 |

### Theme 7: Version handling and duplicate names

| Evidence | What we must do instead | Epic that must not repeat it |
| --- | --- | --- |
| Intralinks Capterra cons: versions upload as "copy" and get messy [33] | Explicit duplicate-name resolution at the moment of collision, with exactly three choices: keep both with a deterministic suffix, replace as a new version, or cancel (FR-CONF-006, D14). Never a silent auto-rename, never a silent overwrite, and no fourth option such as a folder merge. Server idempotency per (folder, name, content hash) so a retried upload after a page freeze does not manufacture "file (2)" | E08 |

### Theme 8: Session and entitlement loss

| Evidence | What we must do instead | Epic that must not repeat it |
| --- | --- | --- |
| Intralinks App Store review: "Works well for like 24 hours and then the exchange is removed" [7] | Mobile session longevity is a first-class requirement. A recipient must not lose access to a room they were granted, and a colleague must not be signed out mid-task. Re-authentication is a step-up prompt, not a lockout. Crucially, the fix is *not* to stop checking grant state: revocation still has to land inside BR-108's bound, so long sessions and per-request grant checks are designed together | E01, E07 |

### Theme 9: Sharer-side mobile capability gaps

| Evidence | What we must do instead | Epic that must not repeat it |
| --- | --- | --- |
| iDeals G2: cannot upload folders or manage permissions from the mobile app, "which is problematic for those working on-the-go" [35]. Google: limited access cannot be toggled from mobile [15]. Box: watermarking is web-only to configure [17]. Digify Viewer directs users to a browser for full features [31] | Every sharer action is specified touch-first: create, rename, move, delete-with-warning, invite, scope a permission, revoke, set read-only, toggle download. No capability our staff need may be desktop-only. Folder upload gets an explicit mobile path or an explicit honest fallback | E03, E04, E07, E09 |

### Theme 10: Missing triage and alerting

| Evidence | What we must do instead | Epic that must not repeat it |
| --- | --- | --- |
| Intralinks App Store reviewers complain the app does not let you filter for new documents or set alerts [7]. Datasite documents Q&A responses handled "as easily as texting" [6], which is the direction of travel | Push-first, directly actionable notifications replace the desktop dashboard: approve or deny an access request, revoke a share, see who opened what, from one tap. Notification delivery is p95 30 seconds (FR-AUDIT-022, threshold inlined per D11 and owned by [06](./06-business-rules-and-permissions.md)) | E11 |

### Theme 11: Disclosure through error states

| Evidence | What we must do instead | Epic that must not repeat it |
| --- | --- | --- |
| Prior art routinely distinguishes "this never existed" from "this exists and you cannot see it", and often discloses an expiry date to an unauthenticated visitor. Google's own model makes a restricted subfolder's existence visible to anyone holding the parent link [15][16] | A principal holding no grant on the target gets 404 NOT_FOUND, byte-identical and timing-equivalent to a genuinely absent resource. 403 is reserved for a principal that already holds a grant on that exact target and is exceeding it. A dead, expired or revoked link renders one generic state — "This link is no longer active." — disclosing nothing about whether it ever existed, and never an expiry date (D02) | E01, E07, and the error-code table in [09](./09-domain-model-and-glossary.md) |

**Withdrawn in the internal-tool rework**

| Withdrawn | Reason |
| --- | --- |
| Theme 1 (pricing opacity and hostile pricing shape) | The entire theme was about how comparable products charge and what we should charge instead. An internal tool has no commercial surface, so the theme has no engineering content left once the commerce is removed. The one durable idea inside it — that a storage meter must never silently discourage or drop uploads — survives as administrator-set storage governance in [E12](./backlog/epic-12-account-storage-and-governance.md). |

Theme 11 is new in this rework: the disclosure failure mode was previously implicit in the security
requirements and is now recorded here as a named failure mode, because D02 makes it a build rule.

---

## Capability gaps in prior art, and the epic that closes each

Six capability gaps, each with the prior-art evidence that it is genuinely unbuilt and the epic that
now owns closing it. `W1`-`W6` are local reference labels for this document only, not one of the
stable ID schemes in the [index](./README.md). Release sequencing is deliberately absent from this
table: release tags are owned per requirement by [05](./05-functional-requirements.md) and rolled up
in [03's release plan](./03-product-overview.md).

| # | Unbuilt capability | The prior-art evidence that it is unbuilt | Delivered by |
| --- | --- | --- | --- |
| **W1** | **Sharer-side administration on a phone.** Create, rename, move, delete-with-blast-radius-warning, invite, scope, revoke and set read-only, all first-class touch operations | The largest and best-documented gap in the research. Google: limited access is web-only [15]. Box: watermarking config is web-only [17]. iDeals: no folder upload, no permission management on mobile [35]. Digify Viewer: browser required for full features [31]. Ansarada, DocSend, Papermark, Peony, DealRoom, SecureDocs, Orangedox: no app at all | [E03](./backlog/epic-03-folder-hierarchy-and-navigation.md), [E04](./backlog/epic-04-file-operations.md), [E07](./backlog/epic-07-sharing-and-access-control.md), [E09](./backlog/epic-09-mobile-ux-foundations.md) |
| **W2** | **One-handed consequential-action safety.** Nothing can be leaked, moved or deleted by accident from a phone | Intralinks: folder moves with no confirmation prompt [33]. Firmex: uploads stalling mid-flight [34]. At compact width with a thumb, accidental destructive action and silent failure are the default outcome. This is a data-integrity property, not a usability nicety, and it is what makes phone administration of sensitive documents defensible internally | [E03](./backlog/epic-03-folder-hierarchy-and-navigation.md), [E08](./backlog/epic-08-conflict-resolution-and-data-integrity.md), [E09](./backlog/epic-09-mobile-ux-foundations.md) |
| **W3** | **Capture-to-room: the phone as a source of documents, not just a reader.** Camera to the correct nested folder in three taps, multi-page assembly, deskew, duplicate-name resolution at capture time | Everyone else treats mobile as an output device. Datasite is the only product in the research shipping in-app scan-to-upload [6]. Our own staff photograph and scan source documents on site, and the alternative today is emailing themselves a photo | [E04](./backlog/epic-04-file-operations.md), [E08](./backlog/epic-08-conflict-resolution-and-data-integrity.md) |
| **W4** | **Read-only, watermarked viewing that actually works on a phone for large files.** Progressive streaming, fast first-page paint, offline availability of an explicitly chosen subset | The most consistently reported failure at every tier: Ansarada's long previews, Datasite's large-file performance, Papermark's slow loading, Intralinks' "Documents cannot be viewed within the app" [7][32][36]. Board portals proved the offline pattern with "Briefcase" modes [45] | [E05](./backlog/epic-05-viewing-preview-and-file-details.md), [E10](./backlog/epic-10-performance-offline-and-scale.md) |
| **W5** | **Notification-and-triage as the primary mobile surface, replacing the desktop dashboard.** A push-first inbox where each item is actionable in one tap: approve access, revoke a share, see who is in the room | The highest-frequency real mobile job is responding, not browsing. Prior art puts all of it behind a desktop dashboard: DocSend's entire value is per-viewer analytics and Dropbox confirms it has no mobile app [14]. Intralinks reviewers cannot filter for new documents or set alerts [7] | [E11](./backlog/epic-11-trust-audit-and-notifications.md), [E07](./backlog/epic-07-sharing-and-access-control.md) |
| **W6** | **Touch-native replacements for the desktop file-manager primitives, shipped as the foundation rather than a skin.** Breadcrumb chip rail instead of a persistent tree at compact width, a visible per-row overflow control instead of right-click, long-press for multi-select, a bottom action bar with selection mode instead of a hover toolbar, pick-source/pick-destination instead of drag-and-drop, a sheet-based preview instead of a hover pane | Every product in the research answered the desktop file-manager specification by shrinking it or dropping it. None has published a credible touch-first equivalent set. Note the D01 correction to the original research: the equivalence is *not* "long-press replaces right-click" — long-press enters multi-select and the action sheet opens from the row's overflow control, which is what iOS Files, Google Drive and Dropbox do and what WCAG 2.5.1 requires | [E09](./backlog/epic-09-mobile-ux-foundations.md) is the system; [E03](./backlog/epic-03-folder-hierarchy-and-navigation.md), [E04](./backlog/epic-04-file-operations.md), [E05](./backlog/epic-05-viewing-preview-and-file-details.md) consume it. Specified in the [Mobile UX spec](./08-mobile-ux-spec.md) |

### What this means for build order

The six gaps are not equally foundational. W6 is the interaction system, and W1, W2, W3, W4 and W5
are all built on top of it, which is why [E09](./backlog/epic-09-mobile-ux-foundations.md) is
sequenced before the epics that consume it rather than applied as polish afterwards. The evidence
for that sequencing is Papermark: having the right controls and the right data model does not give
you a phone product, because the interaction layer is separate work that cannot be retrofitted
cheaply. W1 and W2 together are what make it legitimate for a colleague to administer a sensitive
document set from a phone at all — capability without safety would simply move the risk from "cannot
do it on mobile" to "did it by accident on mobile". Detailed sequencing, priorities and release tags
live in [05](./05-functional-requirements.md) and [03](./03-product-overview.md); nothing in this
file overrides them.

**Withdrawn in the internal-tool rework**

| Withdrawn | Reason |
| --- | --- |
| W7 (pricing shaped for a phone-first buyer) | Pure commerce. Deleted outright, not deferred. The surviving non-commercial idea — a storage ceiling with warning thresholds and an explicit, non-destructive at-the-limit behaviour — is now administrator-set governance in [E12](./backlog/epic-12-account-storage-and-governance.md). |
| W8 (the unserved middle between cloud storage and a VDR) | A market-structure argument about which vendor can defend which flank. It has no engineering content. The single useful observation inside it — storage products have the mobile clients and none of the controls, document-sharing products have the controls and no mobile client — is now stated in the scorecard conclusion above. |
| S1-S8 (segmentation map with fit scores) | The entire section existed to choose which segment to sell to first, including size signals, willingness-to-pay bands and 1-5 fit scores. An internal tool has one user population: our own staff, plus the external recipients they share with. Replaced by the internal role set in [02](./02-personas-and-jtbd.md). |
| "Whitespace and our wedge" section title and its closing paragraph | Selling framing. Replaced by "Capability gaps in prior art" and "What this means for build order" above. |

---

## Platform and device baseline

The standards and platform facts that constrain the design. [07](./07-non-functional-requirements.md)
owns the enforceable version of all of this; the rows below record *why* those requirements say what
they say.

| Fact | Evidence | Consequence for the build | Owning requirement |
| --- | --- | --- | --- |
| **Neither mobile OS can be assumed.** US mobile OS share is roughly iOS 58% / Android 42%, and globally it inverts to Android ~69% / iOS ~31% | StatCounter [41] | Both platforms are first-class. No iOS-only or Android-only capability may be load-bearing. Our staff skew one way and external recipients do not skew at all, because we do not choose their devices | NFR-COMPAT-002, NFR-COMPAT-005 |
| **Recipients arrive inside in-app WebViews**, not in a clean browser: Gmail, iOS Mail, LinkedIn and Slack | Vendor platform behaviour; storage-quota consequence sourced in NFR-COMPAT-006 | The share-link read path must render a usable document with no service worker, no OPFS, no `share_target`, no File System Access, no Web Push and no persistent storage. Every capability the recipient path depends on is a population it silently excludes | NFR-COMPAT-006, NFR-COMPAT-007 |
| **No install may ever be required** to read a shared document | DocSend's own substitute for a missing app is "add a home-screen shortcut" [14] | The recipient path is mobile web, always. Installation is an optional enhancement for staff, never a precondition for a recipient | NFR-COMPAT-006 |
| **A hidden gesture cannot be the only route to a function** | WCAG 2.5.1 Pointer Gestures | The action sheet opens from a visible overflow control; long-press is an additional accelerator for multi-select, not the sole path to anything (D01) | FR-MOB-001, FR-MOB-002 |
| **Small targets fail** on touch, and indentation fails at narrow widths | WCAG 2.5.8 Target Size (Minimum) and 1.4.10 Reflow | Every interactive row control is at least 48 x 48 CSS px, comfortably above the 24 px floor. The desktop folder tree is replaced at compact width by breadcrumb plus drill-down, with the real tree returning in a rail at the expanded size class | NFR-A11Y family; size-class ladder owned by [03](./03-product-overview.md) |
| **One size-class ladder, no local variants.** compact < 600 CSS px; medium 600-839; expanded 840-1279; large >= 1280. Split view, the persistent folder tree rail and the docked details inspector all appear at expanded and above, and split view additionally requires height >= 480 CSS px | Android window size classes, adopted wholesale (D10) | No document in this set may introduce a 600/768/840/900/1024 variant of its own. Where a breakpoint is mentioned it cites this ladder | [03](./03-product-overview.md) |
| **Aggregate device share is not evidence for this workload.** US desktop 54.0% / mobile 43.85%; Europe desktop 51.79% / mobile 46.15%; global mobile 51.48% (Q2 2026) | StatCounter via Statista [41] | Mobile-first is justified by recipient behaviour and staff-in-transit behaviour, not by aggregate share. We measure our own device split from R1 under the metric IDs owned by [10](./10-success-metrics-and-analytics.md) and never quote anyone else's | [10](./10-success-metrics-and-analytics.md) |
| **App-store observations are snapshots.** Every version, date and rating count in this file was retrieved on 2026-08-21 | Apple iTunes Search/Lookup APIs [5][7][8][9] | Any of these facts used to justify a decision more than two quarters from now must be re-verified first. Do not cite a directory listing; they are demonstrably stale [9][34] | This document |

---

## Withdrawn in the internal-tool rework — whole sections

Per I08, deleted content is tombstoned rather than silently dropped, so that a cross-reference from
another document resolves to an explicit note.

| Withdrawn section | Reason |
| --- | --- |
| Executive summary (10 numbered findings) | Rewritten as "What we learned that changes the build". Findings 1, 2, 7, 8 and 9 were about market size, market structure, comparative cost and metering models and are gone entirely; findings 3, 4, 5, 6 and 10 survive as items 2, 11, 12 and the platform baseline. |
| "Market size and structure" (size estimates, segment splits, demand drivers by deal pool) | Sizing an addressable market has no meaning for a tool built for our own staff. Nothing downstream depended on a growth figure, and no business case in this set may depend on one because none exists any more. |
| "Segmentation map" (S1-S8 with fit scores) | See the tombstone in the capability-gaps section above. |
| "Pricing and packaging landscape" and "Recommended packaging hypothesis" (tier table, secondary SKU, validation questions) | Deleted outright under the internal-tool mandate. Not deferred, not moved to a later release, not left as an open question. Storage governance survives in [E12](./backlog/epic-12-account-storage-and-governance.md) as an administrator-set quota with warning thresholds, a hard stop and a "never silently drop data" guarantee. |
| "Positioning statement" and "Competitive messaging proof points" | Both existed to sell. The technical facts inside proof points 1-3 are retained in the prior-art table, the narrative profiles and the platform baseline, where they justify design decisions instead. |
| "Category naming decision" | A naming choice for an external audience. Internally the artefact a colleague creates is a **data room**, defined once in the [glossary](./09-domain-model-and-glossary.md). |
| "Go-to-market implications for the product" (14 numbered build instructions) | The framing was commercial and the content was duplicative: every row that carried a genuine build instruction now appears in "What we learned that changes the build", in a failure-mode table, or in the platform baseline, and the release column it carried was one of the sources of the contradictory release tags the audit found. Release tags are owned by [05](./05-functional-requirements.md). |
| Cost, price, plan-tier, trial and seat-minimum data in the prior-art table and scorecard | Removed from every row. What a comparable product costs tells us nothing about how to build ours. Where a cost fact was doing real work — "the only vendor shipping scan-to-upload" — the capability survives and the price does not. |

---

## Sources

All URLs below were returned by the research handed to this document and were retrieved on
2026-08-21 unless the entry states otherwise. Entries marked *(secondary)* are third-party or
vendor-published landscape content and are not verified by the product's own documentation.

The numbering is unchanged from the original research so that citation markers elsewhere in this set
still resolve. Entries that existed only to support the market-sizing, deal-pool and commercial
analysis withdrawn in the internal-tool rework are tombstoned in place rather than renumbered away.

1. *Withdrawn in the internal-tool rework — syndicated market-sizing report, cited only by the deleted market-size section.*
2. *Withdrawn in the internal-tool rework — syndicated market-sizing report, cited only by the deleted market-size section.*
3. *Withdrawn in the internal-tool rework — syndicated market-sizing report, cited only by the deleted market-size section.*
4. *Withdrawn in the internal-tool rework — syndicated market-sizing report, cited only by the deleted market-size section.*
5. Datasite on the App Store. https://apps.apple.com/us/app/datasite/id1289279850
6. Streamline M&A Deals with the Datasite Mobile App, Datasite. https://www.datasite.com/en/resources/datasite-mobile-app
7. Intralinks on the App Store. https://apps.apple.com/us/app/intralinks/id1129842754
8. Ideals Virtual Data Room on the App Store. https://apps.apple.com/us/app/ideals-virtual-data-room/id747980888
9. Apple iTunes Lookup API for App Store ID 1156584536 (Firmex VDR); returns `resultCount 0`. https://itunes.apple.com/lookup?id=1156584536
10. Firmex. https://www.firmex.com/
11. Ansarada. https://www.ansarada.com/
12. DealRoom. https://dealroom.net/
13. SecureDocs Virtual Data Room, Onit. https://www.onit.com/products/clm/securedocs/
14. Use Dropbox DocSend on mobile browsers, Dropbox Help. https://help.dropbox.com/account-access/dropbox-docsend-on-mobile
15. Learn about limited access to files and folders in Google Drive (Android), Google Drive Help. https://support.google.com/drive/answer/14254362?hl=en&co=GENIE.Platform%3DAndroid
16. Upcoming Change to Drive Sharing Permissions, Google Workspace Updates. https://workspaceupdates.googleblog.com/2025/09/upcoming-change-to-drive-sharing.html
17. Watermarking Files, Box Support. https://support.box.com/hc/en-us/articles/360044195253-Watermarking-Files
18. Box for Android and iOS Frequently Asked Questions, Box Support. https://support.box.com/hc/en-us/articles/360043693834-Box-for-Android-and-iOS-Frequently-Asked-Questions
19. Microsoft Lists Mobile Apps Retirement in November 2025, Microsoft Community Hub. https://techcommunity.microsoft.com/blog/spblog/microsoft-lists-mobile-apps-retirement-in-november-2025-what-you-need-to-know/4456734
20. How to set shared link permissions, Dropbox Help. https://help.dropbox.com/share/set-link-permissions
21. Compare All Microsoft 365 Business Products, Microsoft. https://www.microsoft.com/en-us/microsoft-365/business/compare-all-microsoft-365-business-products
22. Google Workspace, Google. https://workspace.google.com/
23. Box. https://www.box.com/
24. Notion. https://www.notion.com/
25. Papermark. https://www.papermark.com/
26. *Withdrawn in the internal-tool rework — third-party cost survey, cited only by the deleted commercial analysis.*
27. Peony. https://www.peony.ink/
28. Orangedox. https://www.orangedox.com/
29. Digify, Capterra listing. https://www.capterra.com/p/158671/Digify/
30. Digify Features, Digify. https://digify.com/features.html
31. Digify Viewer, Google Play. https://play.google.com/store/apps/details?id=com.digify.android
32. Datasite Diligence Virtual Data Room, Capterra (4.7/5, 143 reviews). https://www.capterra.com/p/130910/Datasite-Diligence/
33. Intralinks VDRPro, Capterra (4.1/5, 18 reviews). https://www.capterra.com/p/131416/Intralinks-Virtual-Data-Room/
34. Firmex Virtual Data Room, Capterra (4.8/5, 358 reviews; listing still claims iPhone/iPad support). https://www.capterra.com/p/131320/Firmex-Virtual-Data-Rooms/
35. Ideals Virtual Data Room Reviews, G2. https://www.g2.com/products/ideals-virtual-data-room/reviews
36. Papermark Virtual Data Room Reviews, G2. https://www.g2.com/products/papermark-virtual-data-room/reviews
37. *Withdrawn in the internal-tool rework — transaction-volume report, cited only by the deleted demand-driver section.*
38. *Withdrawn in the internal-tool rework — transaction-value report, cited only by the deleted demand-driver section.*
39. *Withdrawn in the internal-tool rework — transaction-volume report, cited only by the deleted segmentation map.*
40. *Withdrawn in the internal-tool rework — transaction-volume report, cited only by the deleted segmentation map.*
41. Mobile web traffic share worldwide 2026, Statista (StatCounter data); platform share by country, StatCounter. https://www.statista.com/statistics/277125/share-of-website-traffic-coming-from-mobile-devices/ and https://gs.statcounter.com/platform-market-share/desktop-mobile-tablet/united-states-of-america
42. *Withdrawn in the internal-tool rework — vendor commercial advocacy, cited only by the deleted commercial analysis.*
43. *Withdrawn in the internal-tool rework — third-party cost survey, cited only by the deleted commercial analysis.*
44. Nasdaq Boardvantage Go on the App Store. https://apps.apple.com/us/app/nasdaq-boardvantage-go/id1592546538
45. Board Management Software & Portal, Nasdaq Boardvantage. https://www.nasdaq.com/products/governance/boardvantage
46. OnBoard Board Portal, Capterra. https://www.capterra.com/p/179015/OnBoard-Board-Portal/
47. Best Virtual Data Room Providers in 2026, Firmex *(vendor-authored landscape)*. https://www.firmex.com/resources/vdr-tips-tricks/best-virtual-data-room-providers-in-2025/
48. Best Virtual Data Room Service Providers of 2026, Comparison, DealRoom *(vendor-authored landscape)*. https://dealroom.net/resources/virtual-data-room-providers-comparison
49. *Withdrawn in the internal-tool rework — third-party landscape post carrying unverified vendor size estimates, cited only by deleted content.*

Standards references (WCAG 2.5.1 Pointer Gestures, 2.5.8 Target Size (Minimum), 1.4.10 Reflow),
Android window size classes, device, network and accessibility sources are listed in
[Personas & Jobs-to-be-Done](./02-personas-and-jtbd.md) and
[Non-functional requirements](./07-non-functional-requirements.md), which own them.
