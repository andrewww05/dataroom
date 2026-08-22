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

| Tier             | What it is                                                                                                                                 | Cost       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| **Core**         | Every functional requirement in the brief, plus a README that answers its three scaling questions and an app that runs from a clean clone  | ~11 h 40 m |
| **Polish**       | Affordances that make it feel like Drive rather than a CRUD form — context menu, multi-select, cut/copy/paste, keyboard, tiles, dark theme | ~3 h       |
| **Extra credit** | The brief's own optional list, in its order: search by name, then versioning on name conflict                                              | ~1 h 45 m  |

Core is above the 6–8 h estimate and that is deliberate. The overrun is sharing (three slices),
which the brief lists as required, not as stretch. Everything discretionary is below the line, not
above it.

**One thing the brief asks for is deliberately not built: hosting it.** This is a project you run
locally and deploy wherever you like, so no host is chosen for you. What replaces the requirement is
portability — see [§ Cut](#cut) and BR-100.

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
- **Delivery** — the whole app running from a clean clone with no cloud account, a README carrying
  the design decisions, the ERD, the three scaling answers, the AI note and what any host has to
  provide, and a seeded demo account so a reviewer can look at a populated Data Room without signing
  up. Requirements: FR-OPS-\*, BR-100.

## Polish

Built only once Core is green and demonstrable end to end. None of it is in the brief; all of it is
what the brief means by "we welcome any additions an engineer sees fit".

Context menu mirroring the toolbar · multi-select with bulk delete/move/download · cut / copy /
paste (copy duplicates a subtree server-side) · the ten-key keyboard map · tiles view · dark theme ·
storage-used footer. Requirements: FR-VIEW-010/030/040/050, FR-FILE-060/070, FR-ACCT-010.

## Extra credit

The brief's optional list, and nothing else invented alongside it.

- **Search and filter by name across the Data Room** — 30 minutes and the one thing a diligence
  room is unusable without at scale, so it is built first of the two, straight after Core.
  Requirements: FR-SRCH-010/020. Built only once Core is green.
- **File versioning on name conflicts** — a `FileVersion` row per upload with
  `Node.currentVersionId` pointing at the newest, and a second option next to BR-020's auto-rename
  when a name collides. Blobs are keyed by a generated id already, so keying them by version id is
  a migration, not a redesign. Requirements: FR-VER-\*, BR-080.

## Cut

Cut because a take-home is judged on a working core, not on surface area:

roles beyond viewer in the UI · audit log · notifications · split view · offline/PWA · trash and
restore · thumbnail generation · quotas · admin console · i18n · analytics · Google OAuth (the brief
accepts either; email + password is one dependency instead of an OAuth client per environment) ·
multiple Data Rooms per user in the UI (the model allows them, see FR-ROOM-020).

**Semantic search over file contents is cut outright.** An earlier draft of this spec had it as
required work — pgvector, text extraction, an embedding key, a job queue, three slices. The brief
never asks for it: its optional list is name search and versioning. It was ~3 hours of the most
fragile work in the plan, buying nothing that is graded. Requirement IDs FR-SRCH-030/040/050 and
BR-090 are retired and not reused.

**Hosting is cut, and it is the one place this plan knowingly diverges from the brief.** The brief
asks for both apps deployed and publicly reachable, and for their URLs. An earlier draft had that as
Core: a deployed walking skeleton as slice 2, named hosts for each piece, and every later slice
finished only once it worked on the public URL. All of it is gone. This is a project meant to run on
a laptop and be deployed by whoever wants it, to wherever they want it, so committing it to a
particular vendor's dashboard is a decision that is not the plan's to make — and four accounts and a
set of secrets are a setup cost paid by everyone who clones it, whether they intend to host it or
not.

What replaces the requirement is stricter than it sounds, because the failure modes deployment
exposes are cheap to design out and expensive to retrofit:

- FR-OPS-010 is now "runs end to end from a clean clone, and names no host in its code".
- BR-100 keeps the half of it that had nothing to do with hosting — nothing ships disabled — and
  adds the portability rule: no host, port, origin or bucket name is hardcoded, ever.
- [03 § Running it somewhere else](./03-domain-and-api.md#running-it-somewhere-else) records the
  contract a host must satisfy, including the one real constraint the code imposes: the API needs a
  persistent process, because uploads stream through it.

Nothing about the code changes; a slice is simply finished when it works locally rather than at a
URL. Requirement IDs are **not** retired here — FR-OPS-010 and BR-100 are rewritten, not withdrawn.

## Traceability against the brief

Every row is a line from the brief. Nothing here is inferred from a different exercise.

### Technical requirements

| From the brief                                                                   | Status                                                                                                                                                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full-stack, real backend and real database, working end to end                   | **Core** — NestJS 11 + Postgres + Prisma, [03](./03-domain-and-api.md)                                                                                                                |
| Frontend: any React-based framework (they use React / TS / Tailwind / shadcn)    | **Core** — Vite + React 19 + Tailwind + shadcn/ui, see [Stack decisions](#stack-decisions-against-the-brief)                                                                          |
| Backend: Node.js (they use NestJS + PostgreSQL + Prisma)                         | **Core** — exactly that                                                                                                                                                               |
| File storage in blob storage (S3, Supabase Storage, Vercel Blob…)                | **Core** — the S3 API throughout: MinIO locally, any S3-compatible bucket elsewhere, one `@aws-sdk/client-s3` code path                                                               |
| Authentication required; a Data Room is not visible to other users unless shared | **Core** — FR-AUTH-\*, BR-010                                                                                                                                                         |
| Both frontend and backend deployed and publicly accessible                       | **Cut** — see [§ Cut](#cut). Replaced by FR-OPS-010 (runs from a clean clone, no host in the code) and the hosting contract in [03](./03-domain-and-api.md#running-it-somewhere-else) |
| Data model designed for the functional requirements and to scale                 | **Core** — [03 § Model](./03-domain-and-api.md#model) and [03 § How it scales](./03-domain-and-api.md#how-it-scales)                                                                  |
| Edge case: uploading files with the same name                                    | **Core** — BR-020                                                                                                                                                                     |
| Edge case: deleting a folder someone is viewing through a share                  | **Core** — FR-SHARE-050                                                                                                                                                               |
| Granular React components                                                        | **Core** — the component inventory in [04](./04-ux.md#component-inventory)                                                                                                            |

### Folders

| From the brief                                                                 | Status                                                                                  |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Create a folder and nest folders in another folder                             | **Core** — FR-FLDR-010                                                                  |
| View folders and their contents, nested, with breadcrumb navigation            | **Core** — FR-NAV-010/020                                                               |
| Update the folder name                                                         | **Core** — FR-FLDR-020                                                                  |
| Delete a folder and its nested folders and files, warning what will be deleted | **Core** — FR-FLDR-030 + BR-030, with the real recursive counts, not "and its contents" |

### Files

| From the brief                                                                   | Status                                                                                                     |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Upload files (PDF is enough): multiple at once, drag-and-drop, per-file progress | **Core** — FR-FILE-010                                                                                     |
| View file in UI                                                                  | **Core** — FR-VIEW-060, a full-screen viewer, not a thumbnail in a side pane                               |
| Update a file's name, resolving name conflicts within a folder                   | **Core** — FR-FILE-030 + BR-020                                                                            |
| Move a file to another folder                                                    | **Core** — FR-FILE-050, an explicit "Move to…" picker; drag-onto-folder and cut/paste are additions on top |
| Delete a file                                                                    | **Core** — FR-FILE-040                                                                                     |

### Sharing

| From the brief                                                                      | Status                                                                                                                             |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Share a Data Room, a folder, or a single file — read-only, including nested content | **Core** — FR-SHARE-010/030/070; the Data Room is a share target in its own right                                                  |
| Public link mode (anyone with the link)                                             | **Core** — FR-SHARE-020                                                                                                            |
| Permissioned mode (only specific users you granted access)                          | **Core** — FR-SHARE-020/080, one row per grantee, plus a "Shared with me" list so a grantee is not dependent on being sent the URL |
| The owner can revoke access                                                         | **Core** — FR-SHARE-040                                                                                                            |

### Deliverables

| From the brief                                                                   | Status                                                                                                                                                                                       |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub repo with a README: design decisions and setup instructions               | **Core** — FR-OPS-020, and the setup is `docker compose up -d` plus `pnpm dev`                                                                                                               |
| A data model / ERD                                                               | **Core** — FR-OPS-020, the mermaid ERD in [03](./03-domain-and-api.md#erd)                                                                                                                   |
| "How it scales": subtree size and item count                                     | **Core** — FR-ACCT-020, one recursive CTE; trade-off and upgrade path in [03](./03-domain-and-api.md#how-it-scales)                                                                          |
| "How it scales": one Data Room with 100,000 files — listing, pagination, indexes | **Core** — FR-NAV-030, keyset pagination on a covering index; [03](./03-domain-and-api.md#how-it-scales)                                                                                     |
| "How it scales": per-user roles (viewer/editor) without remodeling               | **Core** — `Share.role` ships in the first migration defaulted to `VIEWER`, and BR-070 puts the capability check on the principal, so `EDITOR` is a branch in one guard and no schema change |
| A note on where and how AI was used                                              | **Core** — FR-OPS-020                                                                                                                                                                        |
| Hosted URLs: deployed frontend and backend                                       | **Cut** — nothing is hosted, so there are no URLs to give. The README says instead what a host has to provide ([03](./03-domain-and-api.md#running-it-somewhere-else))                       |

### Extra credit

| From the brief                                         | Status                                                                |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| Search and filtering by file name across the Data Room | **Extra credit** — FR-SRCH-010/020, first item after Core             |
| File versioning on name conflicts                      | **Extra credit** — FR-VER-\*, BR-080; until it exists, BR-020 renames |

## Stack decisions against the brief

The repo baseline is Turborepo + Vite/React 19 + NestJS 11 + a shared types package, and nothing
else: `apps/web` has `react` and `react-dom` as its only dependencies. So every UI library below is
a decision being made now, not a constraint inherited from the repo.

| Brief                                               | Here                                              | Why                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React / TypeScript / Tailwind / shadcn              | Tailwind v4 + shadcn/ui                           | Nothing is installed yet, so matching their stack costs the same as not matching it. shadcn is copy-in components over Radix, so the design is ours to control — which is what criterion 2 is grading — and dark mode is CSS variables rather than a second theme algorithm.                                                                                      |
| NestJS + PostgreSQL + Prisma                        | Kept                                              | Exactly the brief's backend.                                                                                                                                                                                                                                                                                                                                      |
| Blob storage of your choice                         | MinIO locally, any S3-compatible bucket elsewhere | One S3 code path: `@aws-sdk/client-s3` and every presigned URL behave identically against MinIO, S3, R2 or B2. Local development needs no cloud account, and moving to a hosted bucket changes four env vars and no code.                                                                                                                                         |
| "We recommend Vercel for the frontend"              | No host is chosen                                 | `apps/web` is a static Vite build, so anything that serves files will do — including Vercel, if that is what you want. Picking for you would only add an account to the setup. See [§ Cut](#cut).                                                                                                                                                                 |
| — (deployment target for the API is unspecified)    | No host is chosen, but the shape is constrained   | Uploads stream through Nest so BR-040 can validate real bytes, and a serverless function caps request bodies far below the 100 MB limit — so wherever the API runs, it needs a persistent process. That is the one hosting constraint the code imposes, and it is recorded in [03 § Running it somewhere else](./03-domain-and-api.md#running-it-somewhere-else). |
| Google social auth _or_ email/password              | Email + password (argon2)                         | One less OAuth client to configure per environment, and the brief accepts either.                                                                                                                                                                                                                                                                                 |
| Off-the-shelf boilerplates and AI tools are allowed | Used, and written down                            | FR-OPS-020's AI note is a deliverable, not a footnote.                                                                                                                                                                                                                                                                                                            |
