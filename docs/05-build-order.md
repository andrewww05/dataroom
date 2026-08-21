# 05 — Build order

Vertical slices: each one ends with something you can click. The estimates are for one developer
who already knows this stack, and they are honest: Core is ~11 h 40 m against the brief's 6–8 h, and
the overrun is sharing, which the brief requires. The **cut line** at slice 7 is not a scope
boundary — it is where the app first becomes worth showing.

## Core

| # | Slice | Covers | ~ |
| --- | --- | --- | --- |
| 1 | Local infra: `docker compose` (Postgres + MinIO), Prisma schema (`User`, `DataRoom`, `Node`, `Share`), first migration including the two hand-written partial unique indexes, bucket-on-boot | [03 § Model](./03-domain-and-api.md#model) | 40 m |
| 2 | Auth: signup/login/me, argon2, Passport JWT guard applied globally with a `@Public()` escape, and the signup transaction that creates `User` + `DataRoom` + root `Node` | FR-AUTH-\*, FR-ROOM-010 | 45 m |
| 3 | Nodes read side: `GET /nodes/:id`, `/children` with keyset paging, `/path`, `/stats`; the principal + room scope check in one place | FR-NAV-020/030, FR-ACCT-020, BR-010 | 45 m |
| 4 | Web shell: Tailwind + shadcn init and the token file, TanStack Router + Query, sign-in/sign-up screens, three-pane layout, Data Room title, breadcrumbs, list view, and the empty / skeleton / error states | FR-NAV-020/040, FR-VIEW-010 (list), FR-ROOM-010 | 1 h 30 m |
| 5 | Folder CRUD: create, rename, delete with the stats preflight and the BR-030 dialog; the BR-020 suffixing helper written once, here | FR-FLDR-010/020/030 | 1 h |
| 6 | Upload and download: multipart to `PutObject` with sniffed-type and size validation, presigned redirects, the progress queue with cancel and retry | FR-FILE-010/020, BR-040/050/060 | 1 h 15 m |
| 7 | Viewing: the full-screen viewer (PDF + image + fallback), the details pane, folder stats in it | FR-VIEW-020/060 | 45 m |
| — | **Cut line — the app is demonstrable** | | **~6 h 40 m** |
| 8 | File rename, the Move dialog with the tree as picker, drag-onto-folder, delete with confirm, folder move + cycle check | FR-FILE-030/040/050, FR-FLDR-040 | 45 m |
| 9 | Principal refactor: the guard resolves owner-or-share, handlers assert a capability, subtree scope check on the ancestor walk | BR-070 | 45 m |
| 10 | Sharing: create/list/revoke, the share dialog including the Data-Room-wide case, `/s/{token}` reusing the listing panes read-only, the removed-by-owner screen, Shared with me, `Referrer-Policy` on `/s/*` | FR-SHARE-\* | 1 h 45 m |
| 11 | The README deliverable: design decisions, ERD, the three scaling answers, the AI note, setup from a clean clone, what any host has to provide, and the idempotent demo seed | FR-OPS-010/020/030 | 45 m |
| 12 | Tests: unit on the suffixing helper and the cycle check, integration on share scope and read-only rejection, e2e on upload → list → move → share → revoke | BR-020/060/070 | 1 h |
| — | **Core complete — ~11 h 40 m** | | |

## Extra credit, part 1

| # | Slice | Covers | ~ |
| --- | --- | --- | --- |
| 13 | Name search: the `pg_trgm` extension and GIN index as their own migration, the endpoint on it, a debounced box, results list, back-to-folder | FR-SRCH-010/020 | 30 m |

Search comes before Polish because a diligence room with 100,000 files is unusable without it and it
costs half an hour — the brief lists it first among its optional items for the same reason.

## Polish

| # | Slice | Covers | ~ |
| --- | --- | --- | --- |
| 14 | Multi-select (click / Ctrl / Shift / Ctrl+A), bulk delete / move / download, context menu mirroring the toolbar, storage-used footer | FR-FILE-070, FR-VIEW-030, FR-ACCT-010 | 1 h 15 m |
| 15 | Cut / copy / paste, with server-side `CopyObject` and subtree copy | FR-FILE-060 | 45 m |
| 16 | Keyboard map, focus handling, `aria-label`s, focus traps | FR-VIEW-040 | 30 m |
| 17 | Tiles view and the dark-mode toggle | FR-VIEW-010/050 | 30 m |

## Extra credit, part 2

| # | Slice | Covers | ~ |
| --- | --- | --- | --- |
| 18 | Versioning: the `FileVersion` migration moving `storageKey` off `Node`, the upload conflict prompt, the version list, restore | FR-VER-\*, BR-080 | 1 h 15 m |

Total: ~16 h 25 m, of which the first 11 h 40 m is everything the brief requires that this plan
keeps — see [01 § Cut](./01-scope.md#cut) for the deployment requirement it deliberately does not.

## Order rationale

Two rules run through the list.

**Whatever ends up in every query goes in before the queries exist.** Auth is early because the
principal is in every subsequent handler and retrofitting it means touching all of them. Keyset
paging comes with the first listing rather than after it. The BR-020 suffixing helper is written once
in slice 5 and reused by rename, move, copy and upload, so it is worth the extra ten minutes there
rather than four ad-hoc versions later. Slice 9 is the same rule applied to sharing, and it is the
one piece of pure refactoring in the list: building sharing first and retrofitting the guard means
touching every handler twice, and the second pass is where a route gets missed and a share principal
ends up able to write. Doing it alone makes BR-070 one test against one guard instead of a checklist
against twenty controllers.

**Portability is a constraint on every slice, not a slice of its own.** An earlier draft of this plan
opened with a deployed walking skeleton, because the brief asks for both apps hosted. That is cut
(see [01 § Cut](./01-scope.md#cut)): this project is built to run locally and to be deployed by
whoever wants it, wherever they want it. What survives from that slice is the discipline it existed
to enforce — no host, port, origin or bucket name in the code, every one of them an env var with a
local default (BR-100), and the hosting contract written down in
[03 § Running it somewhere else](./03-domain-and-api.md#running-it-somewhere-else). It costs nothing
per slice and it is what keeps "deploy it anywhere" true rather than aspirational.

Sharing sits at 9–10 rather than at the end because the brief lists it as one of its three
functional areas, alongside folders and files. It was in "phase 2" in an earlier draft of this plan;
that was a misreading of a different brief, and it put a required feature behind eight optional ones.

## Where the risk is

- **Serverless body limits.** Uploads stream through Nest, and a Vercel/Lambda-style function caps
  request bodies far below 100 MB. Whoever hosts the API needs a persistent process — this is the
  one hosting constraint the code actually imposes, and it is recorded in
  [03 § Running it somewhere else](./03-domain-and-api.md#running-it-somewhere-else).
- **Pooled Postgres and Prisma.** Runtime can use a pooled connection string; `prisma migrate deploy`
  needs the direct one (`DIRECT_URL`). A migration that hangs is almost always this.
- **Presigned URLs and the browser.** URLs are signed against `S3_ENDPOINT`, so it has to be an
  endpoint the browser can resolve. Locally, `localhost:9000` works from the host machine and a
  container-internal hostname does not.
- **PDF in an `<iframe>`.** Fine on the presigned inline URL, but any `Content-Security-Policy` with
  a restrictive `frame-src` will silently blank it, and Safari needs `Content-Disposition: inline` to
  be actually present on the object response.
- **Upload progress** — `fetch` cannot report it. Use `XMLHttpRequest` from the start instead of
  discovering this in slice 6.
- **`BigInt` over JSON** — Prisma returns `BigInt` for `sizeBytes` and `JSON.stringify` throws on
  it. Convert in the serialisation layer once, not at each call site.
- **Copying a folder** — a subtree copy is recursion plus N `CopyObject` calls. If time is short,
  **do not ship copy at all** and take it out of the toolbar and the menu. A greyed-out Copy is an
  unimplemented feature on display, which is the one thing the brief asks not to include.
- **Share tokens in the URL** — a `/s/{token}` link leaks through the `Referer` header on any
  outbound click from the shared view. Send `Referrer-Policy: no-referrer` on that route; it is one
  header and it is easy to notice only in review.
- **The demo seed** — it is idempotent and must refuse to touch a database where that email already
  exists with different data, because nothing stops someone pointing it at a populated database.
