## Why

FR-SHARE-070 says a share exposes its subtree "browsable with the same listing, breadcrumbs **and
viewer** as the owner's view, minus every write affordance". Slice 10 shipped the listing and the
breadcrumbs but not the viewer: `/s/{token}` renders its own read-only screens that offer nothing
but Download. A single-file share is a static card with a file icon — even for a PNG. Inside a
shared folder, double-clicking a file does nothing at all.

The API is already correct. `GET /files/:id/preview` resolves a share principal through the same
ancestor walk as every other read route (BR-010, BR-070) and `presignInline` signs an inline URL
with the file's content type. The gap is entirely in `apps/web`: `/s/{token}` never imports the
viewer, and `previewFile`/`downloadFile` are hardcoded to the JWT fetcher, so an anonymous visitor
holding a public link would get `401 UNAUTHENTICATED` even if the viewer were mounted.

## What Changes

- `previewFile` / `downloadFile` take an optional share token and pick `fetchShareClient` over
  `fetchClient` when one is present.
- `FileViewer` and `ViewerContent` take an optional `shareToken` and thread it into those calls.
  Default behaviour for the owner's view and the details pane is unchanged.
- `/s/{token}` mounts the existing viewer: a file share opens straight into it; a folder share opens
  it on double-click, with `←` / `→` stepping through the files of the current folder and `Esc`
  closing. The Download button inside it keeps working over the share token.
- The static "file icon + Download" card in the shared view is deleted, not kept alongside (BR-100).

Completes slice 10 of `docs/05-build-order.md`. Delivers FR-SHARE-070 and FR-VIEW-060 for a share
principal; upholds BR-010, BR-050, BR-070, BR-100.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `sharing`: the shared view MUST open a file in the viewer rather than only offering Download, for
  an anonymous PUBLIC visitor as well as a signed-in RESTRICTED grantee.
- `viewing`: the "open file lives in the URL" clause is scoped to the owner's listing — the shared
  view does not carry its folder in the URL either, so it cannot carry the open file there.

## Impact

- **Web**: `apps/web/src/routes/s.$token.tsx` (rewritten screens), `apps/web/src/components/FileViewer.tsx`
  (optional `shareToken` prop), `apps/web/src/hooks/useNodes.ts` (optional token on the two helpers).
- **API**: none. No new route, no new error code, no migration.
- **Shared**: none. No new cross-boundary type.
- **Dependencies**: none.

## Non-goals

- No details pane in the shared view — FR-VIEW-020 is the owner's screen and stays there.
- No thumbnails in shared listing rows, and no new MIME family in the render table: the viewer
  renders exactly what slice 7 gave it.
- No change to `GET /files/:id/preview`, the guard, or `NodeScopeService` — the principal refactor
  (slice 9) already handles this and is left alone.
- No URL state for the shared view. Its folder position is component state today; putting the open
  file in the URL without the folder would deep-link into the wrong listing.
- No change to Shared with me (FR-SHARE-080) or the rich-link-preview endpoint (FR-SHARE-090).
- No requirement in `docs/02` changes. This change implements FR-SHARE-070 as already written.
