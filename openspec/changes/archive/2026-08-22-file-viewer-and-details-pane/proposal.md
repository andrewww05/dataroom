## Why

Slice 7 of `docs/05-build-order.md` — the cut line where the app becomes worth showing. A data room
exists to be read, and today a file cannot be read at all: double-clicking one downloads it, which
`docs/04` calls the biggest UX error of its own previous draft. Delivers FR-VIEW-060, FR-VIEW-020 and
FR-ACCT-020's UI half.

## What Changes

- **BREAKING** — double-clicking a file opens a full-screen viewer instead of downloading it.
  Download stays a toolbar button and gains one inside the viewer (FR-VIEW-060).
- New `GET /files/:id/preview`: a presigned **inline** URL in the same 5-minute shape `/download`
  already returns, so viewer bytes go store→browser, never through Nest.
- The viewer: PDF in an `<iframe>`, images fitted, everything else a type icon plus Download. `Esc`
  closes, `←`/`→` step through the same folder's files, and the open file is in the URL — deep-linkable,
  Back closes it.
- The details pane replaces the `Select an item to view details` placeholder: name, kind, size, created,
  modified, a preview that opens the viewer, and for a folder its recursive stats from
  `GET /nodes/:id/stats` (FR-VIEW-020, FR-ACCT-020).
- **Widened on the user's instruction** — slice 4 debt, not slice 7 scope: folder navigation works.
  `/f/$folderId` exists, `/` redirects to `rootId`, breadcrumbs come from `GET /nodes/:id/path`
  instead of the literal string `Current Folder`. Without it the viewer's "same folder" is only ever
  the root (FR-NAV-020).

No `docs/02` requirement changes. One `docs/03` row does: `/download` and `/preview` return
`200 { url, expiresAt }`, not `302` — an iframe navigation sends no `Authorization` header, so a
redirect route cannot authenticate. `/download` already shipped this way.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `viewing`: what opening a file does, what each kind renders, what one selected item reports.
- `files`: `GET /files/:id/preview` and its inline disposition.
- `navigation`: `/f/$folderId`, `/` → `rootId`, breadcrumbs from the path endpoint.

## Non-goals

- Slice 8 (file rename, Move, drag-onto-folder) and slices 9–10 (principal refactor, sharing). The
  details pane ships **without** the shares section FR-VIEW-020 mentions rather than an empty one
  (BR-100); FR-SHARE-060 lands in slice 10.
- Polish: no tiles, context menu, multi-select or full keyboard map — only the viewer's own keys.
- The FR-NAV-010 sidebar tree: this change fixes the URL and breadcrumbs, not the tree.
- No text or Office rendering; those take the icon-and-Download fallback FR-VIEW-060 asks for.

## Impact

- `apps/api` — `files.controller.ts`, `files.service.ts`, `storage.service.ts` (an inline presign
  beside the attachment one).
- `apps/web` — `FileViewer` / `PdfViewer` / `ImageViewer` / `UnsupportedTypeViewer`, `DetailsPanel`,
  a new `/f/$folderId` route; `_authenticated.tsx` loses its placeholder pane and fake breadcrumb.
- `packages/shared` — no new type; `/preview` returns the existing `PresignedUrl`.
- `docs/03-domain-and-api.md` — the two response-shape rows.
