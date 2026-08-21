# 01 — Scope

## The product

Acme Corp is negotiating a multi-billion dollar acquisition and wants the diligence documents in
one place. So: one owner, one **Data Room**, an arbitrarily deep tree of folders and files inside
it. The owner uploads documents, organises them into nested folders, renames and moves them, reads
them in the browser, and hands the other side a read-only link — public, or restricted to named
people — which they can revoke. Nobody sees anything they were not given, and the server is what
decides that.

## How the work is tiered

The brief asks to optimise, in order, for (1) UX and functionality, (2) design and polish,
(3) code quality, and names 6–8 hours. Three tiers follow from that. The tier is what gets cut
when time runs out — never the finish on what is already in, because a half-polished feature reads
worse than an absent one ("don't include unimplemented features").

| Tier | What it is | Cost |
| --- | --- | --- |
| **Core** | Every functional requirement in the brief, plus its two hard deliverables: both apps deployed and publicly reachable, and a README that answers its three scaling questions | ~12 h 40 m |
| **Polish** | Affordances that make it feel like Drive rather than a CRUD form — context menu, multi-select, cut/copy/paste, keyboard, tiles, dark theme | ~3 h |
| **Extra credit** | The brief's own optional list, in its order: search by name, then versioning on name conflict | ~1 h 45 m |

Core is above the 6–8 h estimate and that is deliberate. The overrun is sharing (three slices) and
deployment (one slice plus a constraint on every other), and the brief lists both as required, not
as stretch. Everything discretionary is below the line, not above it.

## Core

- **Auth** — email + password sign-up and sign-in, JWT. A Data Room is invisible to everyone but
  its owner and the people they shared it with. Requirements: FR-AUTH-\*.
- **Data Room** — created with the account, named, renamable. It is the top-level object the brief
  describes and the unit everything else is scoped by. Requirements: FR-ROOM-\*.
- **Folders** — create, nest arbitrarily deep, rename, move, delete a subtree after a warning that
  states exactly what goes with it. Requirements: FR-FLDR-\*.
- **Files** — upload (multiple, drag-and-drop, per-file progress), read in the browser, rename with
  conflict resolution, move to another folder, download, delete. Requirements: FR-FILE-010…050,
  FR-VIEW-060.
- **Navigation** — a folder tree in the sidebar, a paginated listing in the middle, breadcrumbs
  above it, the URL as the state. Requirements: FR-NAV-\*.
- **Details pane** — name, kind, size, created, modified, recursive size and item count for folders,
  and the active shares on the selected node. Requirements: FR-VIEW-020, FR-ACCT-020, FR-SHARE-060.
- **Sharing** — a Data Room, a folder or a single file, as a public link or a restricted one, always
  read-only, always revocable, always covering the whole subtree below the shared node.
  Requirements: FR-SHARE-\*, BR-070.
- **Delivery** — frontend and backend deployed and publicly reachable, a README carrying the design
  decisions, the ERD, the three scaling answers and the AI note, and a seeded demo account so a
  reviewer can look at a populated Data Room without signing up. Requirements: FR-OPS-\*, BR-100.

## Polish

Built only once Core is green **on the deployed URL**. None of it is in the brief; all of it is
what the brief means by "we welcome any additions an engineer sees fit".

Context menu mirroring the toolbar · multi-select with bulk delete/move/download · cut / copy /
paste (copy duplicates a subtree server-side) · the ten-key keyboard map · tiles view · dark theme ·
storage-used footer. Requirements: FR-VIEW-010/030/040/050, FR-FILE-060/070, FR-ACCT-010.

## Extra credit

The brief's optional list, and nothing else invented alongside it.

- **Search and filter by name across the Data Room** — 30 minutes and the one thing a diligence
  room is unusable without at scale, so it is built first of the two, straight after Core.
  Requirements: FR-SRCH-010/020.
- **File versioning on name conflicts** — a `FileVersion` row per upload with
  `Node.currentVersionId` pointing at the newest, and a second option next to BR-020's auto-rename
  when a name collides. Blobs are keyed by a generated id already, so keying them by version id is
  a migration, not a redesign. Requirements: FR-VER-\*, BR-080.

## Cut

Cut because a take-home is judged on a working, deployed core, not on surface area:

roles beyond viewer in the UI · audit log · notifications · split view · offline/PWA · trash and
restore · thumbnail generation · quotas · admin console · i18n · analytics · Google OAuth (the brief
accepts either; email + password is one dependency instead of an OAuth client per environment) ·
multiple Data Rooms per user in the UI (the model allows them, see FR-ROOM-020).

**Semantic search over file contents is cut outright.** An earlier draft of this spec had it as
required work — pgvector, text extraction, an embedding key, a job queue, three slices. The brief
never asks for it: its optional list is name search and versioning. It was ~3 hours of the most
fragile work in the plan, buying nothing that is graded. Requirement IDs FR-SRCH-030/040/050 and
BR-090 are retired and not reused.

## Traceability against the brief

Every row is a line from the brief. Nothing here is inferred from a different exercise.

### Technical requirements

| From the brief | Status |
| --- | --- |
| Full-stack, real backend and real database, working end to end | **Core** — NestJS 11 + Postgres + Prisma, [03](./03-domain-and-api.md) |
| Frontend: any React-based framework (they use React / TS / Tailwind / shadcn) | **Core** — Vite + React 19 + Tailwind + shadcn/ui, see [Stack decisions](#stack-decisions-against-the-brief) |
| Backend: Node.js (they use NestJS + PostgreSQL + Prisma) | **Core** — exactly that |
| File storage in blob storage (S3, Supabase Storage, Vercel Blob…) | **Core** — S3 API throughout: MinIO locally, Cloudflare R2 in production, one `@aws-sdk/client-s3` code path |
| Authentication required; a Data Room is not visible to other users unless shared | **Core** — FR-AUTH-\*, BR-010 |
| Both frontend and backend deployed and publicly accessible | **Core** — FR-OPS-010, and slice 2 of [05](./05-build-order.md) deploys before any feature exists |
| Data model designed for the functional requirements and to scale | **Core** — [03 § Model](./03-domain-and-api.md#model) and [03 § How it scales](./03-domain-and-api.md#how-it-scales) |
| Edge case: uploading files with the same name | **Core** — BR-020 |
| Edge case: deleting a folder someone is viewing through a share | **Core** — FR-SHARE-050 |
| Granular React components | **Core** — the component inventory in [04](./04-ux.md#component-inventory) |

### Folders

| From the brief | Status |
| --- | --- |
| Create a folder and nest folders in another folder | **Core** — FR-FLDR-010 |
| View folders and their contents, nested, with breadcrumb navigation | **Core** — FR-NAV-010/020 |
| Update the folder name | **Core** — FR-FLDR-020 |
| Delete a folder and its nested folders and files, warning what will be deleted | **Core** — FR-FLDR-030 + BR-030, with the real recursive counts, not "and its contents" |

### Files

| From the brief | Status |
| --- | --- |
| Upload files (PDF is enough): multiple at once, drag-and-drop, per-file progress | **Core** — FR-FILE-010 |
| View file in UI | **Core** — FR-VIEW-060, a full-screen viewer, not a thumbnail in a side pane |
| Update a file's name, resolving name conflicts within a folder | **Core** — FR-FILE-030 + BR-020 |
| Move a file to another folder | **Core** — FR-FILE-050, an explicit "Move to…" picker; drag-onto-folder and cut/paste are additions on top |
| Delete a file | **Core** — FR-FILE-040 |

### Sharing

| From the brief | Status |
| --- | --- |
| Share a Data Room, a folder, or a single file — read-only, including nested content | **Core** — FR-SHARE-010/030/070; the Data Room is a share target in its own right |
| Public link mode (anyone with the link) | **Core** — FR-SHARE-020 |
| Permissioned mode (only specific users you granted access) | **Core** — FR-SHARE-020/080, one row per grantee, plus a "Shared with me" list so a grantee is not dependent on being sent the URL |
| The owner can revoke access | **Core** — FR-SHARE-040 |

### Deliverables

| From the brief | Status |
| --- | --- |
| GitHub repo with a README: design decisions and setup instructions | **Core** — FR-OPS-020 |
| A data model / ERD | **Core** — FR-OPS-020, the mermaid ERD in [03](./03-domain-and-api.md#erd) |
| "How it scales": subtree size and item count | **Core** — FR-ACCT-020, one recursive CTE; trade-off and upgrade path in [03](./03-domain-and-api.md#how-it-scales) |
| "How it scales": one Data Room with 100,000 files — listing, pagination, indexes | **Core** — FR-NAV-030, keyset pagination on a covering index; [03](./03-domain-and-api.md#how-it-scales) |
| "How it scales": per-user roles (viewer/editor) without remodeling | **Core** — `Share.role` ships in the first migration defaulted to `VIEWER`, and BR-070 puts the capability check on the principal, so `EDITOR` is a branch in one guard and no schema change |
| A note on where and how AI was used | **Core** — FR-OPS-020 |
| Hosted URLs: deployed frontend and backend | **Core** — FR-OPS-010 |

### Extra credit

| From the brief | Status |
| --- | --- |
| Search and filtering by file name across the Data Room | **Extra credit** — FR-SRCH-010/020, first item after Core |
| File versioning on name conflicts | **Extra credit** — FR-VER-\*, BR-080; until it exists, BR-020 renames |

## Stack decisions against the brief

The repo baseline is Turborepo + Vite/React 19 + NestJS 11 + a shared types package, and nothing
else: `apps/web` has `react` and `react-dom` as its only dependencies. So every UI library below is
a decision being made now, not a constraint inherited from the repo.

| Brief | Here | Why |
| --- | --- | --- |
| React / TypeScript / Tailwind / shadcn | Tailwind v4 + shadcn/ui | Nothing is installed yet, so matching their stack costs the same as not matching it. shadcn is copy-in components over Radix, so the design is ours to control — which is what criterion 2 is grading — and dark mode is CSS variables rather than a second theme algorithm. |
| NestJS + PostgreSQL + Prisma | Kept | Exactly the brief's backend. |
| Blob storage of your choice | MinIO locally, Cloudflare R2 in production | Both speak S3, so `@aws-sdk/client-s3` and every presigned URL work identically in both; local development needs no cloud account and production needs no code change. |
| "We recommend Vercel for the frontend" | Vercel for `apps/web` | It is a static Vite build. |
| — (deployment target for the API is unspecified) | Railway for `apps/api`, Neon for Postgres | Uploads stream through Nest so BR-040 can validate real bytes, and a serverless function caps request bodies far below the 100 MB limit — the API needs a persistent host. This is the one place the deployment target dictates an architectural decision; see [03 § Deployment](./03-domain-and-api.md#deployment). |
| Google social auth *or* email/password | Email + password (argon2) | One less OAuth client to configure per environment, and the brief accepts either. |
| Off-the-shelf boilerplates and AI tools are allowed | Used, and written down | FR-OPS-020's AI note is a deliverable, not a footnote. |
