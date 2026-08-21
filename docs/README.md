# Data Room — Product Documentation

The complete product definition for **Data Room**, a mobile-first secure document workspace
built as an **internal tool**. Company staff own the rooms; external counterparties (clients,
buyers, their advisors) reach the documents only as recipients, through a share link or an
emailed invite.

This set is deliberately split into small files so that each audience reads only what it needs
and so that two people can edit different concerns without colliding.

- **Version:** 1.1 (Draft for review — internal-tool rework)
- **Date:** 2026-08-21
- **Author:** Lead BA / Product Manager
- **Hard constraint governing every document here:** mobile-first. Most work happens on a phone,
  so every requirement is specified for a 360 px touch screen first and progressively enhanced
  for tablet and desktop.
- **Not in this product:** there is no billing, no plans, no seats and no pricing. Storage
  quotas, retention windows and limits are set by an internal administrator, not purchased.

## Reading order

Pick the row that matches why you opened this folder.

| If you are a… | Read, in this order |
| --- | --- |
| Executive / stakeholder | [Product overview](./03-product-overview.md) → [Success metrics](./10-success-metrics-and-analytics.md) → [Risks & open questions](./12-risks-and-open-questions.md) |
| Product manager | [Product overview](./03-product-overview.md) → [Epics](./04-epics.md) → [Master backlog](./11-master-backlog.md) → [Risks & open questions](./12-risks-and-open-questions.md) |
| Designer | [Personas & JTBD](./02-personas-and-jtbd.md) → [Mobile UX spec](./08-mobile-ux-spec.md) → [Prior art & UX benchmark](./01-prior-art-and-ux-benchmark.md) |
| Engineer / tech lead | [Functional requirements](./05-functional-requirements.md) → [Business rules & permissions](./06-business-rules-and-permissions.md) → [Domain model & contracts](./09-domain-model-and-glossary.md) → [Non-functional requirements](./07-non-functional-requirements.md) |
| QA | [Functional requirements](./05-functional-requirements.md) → [Business rules & permissions](./06-business-rules-and-permissions.md) → [Non-functional requirements](./07-non-functional-requirements.md) → the [backlog](./backlog/) acceptance criteria |
| Anyone starting a sprint | [Master backlog](./11-master-backlog.md) → the relevant [epic backlog file](./backlog/) |

## Document map

### Discovery and design input

| File | What it answers |
| --- | --- |
| [01-prior-art-and-ux-benchmark.md](./01-prior-art-and-ux-benchmark.md) | What comparable document-sharing tools do, where their mobile experience fails, and the known failure modes we must not repeat. Design input, not a market study. |
| [02-personas-and-jtbd.md](./02-personas-and-jtbd.md) | Who uses this: internal staff roles plus the external recipient. The sharer-versus-recipient asymmetry, and the jobs each one hires the tool for. |
| [03-product-overview.md](./03-product-overview.md) | The PRD proper: problem, vision, mobile-first mandate, the responsive size-class ladder, scope by release, and the traceability of every line of the original brief. |

### Requirements

| File | What it answers |
| --- | --- |
| [04-epics.md](./04-epics.md) | The twelve epics (E01–E12), their dependencies, and the delivery sequence. |
| [05-functional-requirements.md](./05-functional-requirements.md) | Every `FR-<DOMAIN>-<nnn>` requirement: what the system shall do, at what priority, verified how. **Owns every Release tag and Priority.** |
| [06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md) | Every `BR-<nnn>` rule: the role model, permission matrix, visibility and inheritance, revocation semantics, naming and conflict resolution, deletion and quota rules. **Owns every threshold, limit and timing guarantee.** |
| [07-non-functional-requirements.md](./07-non-functional-requirements.md) | Every `NFR-<CAT>-<nnn>`: performance budgets, mobile constraints, security, privacy, scale, accessibility, and how each is measured. |
| [08-mobile-ux-spec.md](./08-mobile-ux-spec.md) | The interaction system. Thumb zones, the desktop-primitive-to-touch translation table, screen-by-screen wireframes, gesture dictionary, theming, accessibility checklist. |
| [09-domain-model-and-glossary.md](./09-domain-model-and-glossary.md) | Entities, state machines, the shared TypeScript contract, the API surface, error codes, and the glossary. **Owns entity field names and error codes.** |

### Measurement and delivery

| File | What it answers |
| --- | --- |
| [10-success-metrics-and-analytics.md](./10-success-metrics-and-analytics.md) | North Star metric, KPI tree, metric catalogue, the analytics event dictionary, and guardrail metrics. **Owns every metric ID and event name.** |
| [11-master-backlog.md](./11-master-backlog.md) | Every story from every epic in one prioritised table, with the R1 sprint-by-sprint sequence and the cut lines. |
| [12-risks-and-open-questions.md](./12-risks-and-open-questions.md) | Risks, assumptions, decisions taken, decisions still owed, and the review findings raised against this document set. |

### Backlog by epic

Each file holds the user stories for one epic, in build order, with acceptance criteria,
mobile acceptance criteria, and negative paths.

| Epic | Stories |
| --- | --- |
| E01 Access & Identity | [epic-01-access-and-identity.md](./backlog/epic-01-access-and-identity.md) |
| E02 Data Rooms & Workspace Home | [epic-02-data-rooms-and-workspace-home.md](./backlog/epic-02-data-rooms-and-workspace-home.md) |
| E03 Folder Hierarchy & Navigation | [epic-03-folder-hierarchy-and-navigation.md](./backlog/epic-03-folder-hierarchy-and-navigation.md) |
| E04 File Operations | [epic-04-file-operations.md](./backlog/epic-04-file-operations.md) |
| E05 Viewing, Preview & File Details | [epic-05-viewing-preview-and-file-details.md](./backlog/epic-05-viewing-preview-and-file-details.md) |
| E06 Search & Discovery | [epic-06-search-and-discovery.md](./backlog/epic-06-search-and-discovery.md) |
| E07 Sharing & Access Control | [epic-07-sharing-and-access-control.md](./backlog/epic-07-sharing-and-access-control.md) |
| E08 Conflict Resolution & Data Integrity | [epic-08-conflict-resolution-and-data-integrity.md](./backlog/epic-08-conflict-resolution-and-data-integrity.md) |
| E09 Mobile UX Foundations | [epic-09-mobile-ux-foundations.md](./backlog/epic-09-mobile-ux-foundations.md) |
| E10 Performance, Offline & Scale | [epic-10-performance-offline-and-scale.md](./backlog/epic-10-performance-offline-and-scale.md) |
| E11 Trust, Audit & Notifications | [epic-11-trust-audit-and-notifications.md](./backlog/epic-11-trust-audit-and-notifications.md) |
| E12 Account, Storage & Governance | [epic-12-account-storage-and-governance.md](./backlog/epic-12-account-storage-and-governance.md) |

## Identifier conventions

These IDs are stable. Cite them in commits, tickets, test names and design files; never
renumber them. When a requirement, rule or story is withdrawn, its ID becomes a tombstone in a
"Withdrawn" note rather than being reused.

| Prefix | Meaning | Owned by |
| --- | --- | --- |
| `E01`–`E12` | Epic | [04-epics.md](./04-epics.md) |
| `US-E<nn>-<mm>` | User story, numbered from 01 within its epic | [backlog/](./backlog/) |
| `FR-<DOMAIN>-<nnn>` | Functional requirement. Domains: AUTH, ROOM, FLDR, FILE, VIEW, SRCH, SHARE, CONF, MOB, PERF, AUDIT, ACCT | [05-functional-requirements.md](./05-functional-requirements.md) |
| `NFR-<CAT>-<nnn>` | Non-functional requirement. Categories: PERF, MOB, SEC, PRIV, AVAIL, SCALE, A11Y, I18N, OBS, COMPAT, MAINT, COMPL | [07-non-functional-requirements.md](./07-non-functional-requirements.md) |
| `BR-<nnn>` | Business rule | [06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md) |
| `P1`–`P6` | Persona | [02-personas-and-jtbd.md](./02-personas-and-jtbd.md) |
| `PII0`–`PII3` | Analytics PII class | [10-success-metrics-and-analytics.md](./10-success-metrics-and-analytics.md) |
| `M<nn>` | Metric | [10-success-metrics-and-analytics.md](./10-success-metrics-and-analytics.md) |
| `D01`–`D19` | Reconciliation decision taken against this document set | [12-risks-and-open-questions.md](./12-risks-and-open-questions.md) |
| `I01`–`I12` | Internal-tool rework decision | [12-risks-and-open-questions.md](./12-risks-and-open-questions.md) |
| `A<nn>` / `R<nn>` / `OQ<nn>` | Assumption / Risk / Open question | [12-risks-and-open-questions.md](./12-risks-and-open-questions.md) |

Priorities use MoSCoW (Must / Should / Could / Won't-for-now) together with a release tag:

| Tag | Release |
| --- | --- |
| **R1** | MVP |
| **R1.1** | Trust hardening — watermark, per-viewer access log, link expiry. The increment that must ship before anyone is comfortable sending a client's documents outward. |
| **R2** | Fast-follow |
| **R3** | Later |

Estimates are Fibonacci story points, where 13 means the story must be split before sprint
planning.

## Ground rules that apply to every document

1. **Mobile before desktop.** A requirement that only makes sense with a mouse is incomplete
   until its touch equivalent is specified. See the translation table in
   [08-mobile-ux-spec.md](./08-mobile-ux-spec.md).
2. **Testable or it is a defect.** No requirement without a measurement method, no acceptance
   criterion a QA engineer holding a phone cannot verify alone.
3. **The server is the enforcement point.** Hiding a button is not access control. Read-only,
   revocation and role checks are specified against the API in
   [06-business-rules-and-permissions.md](./06-business-rules-and-permissions.md).
4. **One owner per fact.** Release tags live in 05, thresholds and rules in 06, metric and event
   names in 10, the size-class ladder in 03, entity fields and error codes in 09. Every other
   file cites them by ID instead of restating the value. A number written twice is a number that
   will disagree with itself.
5. **A room nobody shared with you does not exist.** A principal holding no grant on a target
   gets an indistinguishable 404, never a 403 that confirms the thing is there.
6. **Evidence is labelled.** Sourced figures carry their source; anything reasoned is marked
   `Assumption:` or `Estimate:`.
7. **Nothing in the original brief is dropped silently.** The traceability tables in
   [03-product-overview.md](./03-product-overview.md) and
   [05-functional-requirements.md](./05-functional-requirements.md) account for every bullet.

## Implementation baseline

The repository these documents live in already fixes the technical baseline, and the documents
assume it rather than re-architecting it: a Turborepo monorepo with a Vite + React SPA in
`apps/web`, a NestJS REST API under `/api` in `apps/api`, and a single shared typed contract in
`packages/shared` that both sides import. The mobile-first delivery vehicle is a responsive,
installable PWA; native shells are an explicitly scoped later option. See the repository
[README](../README.md) for commands, and
[09-domain-model-and-glossary.md](./09-domain-model-and-glossary.md) for the contract and API
additions this product needs.
