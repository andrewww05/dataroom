## Why

Slice 5 left a Data Room that holds folders and nothing else. A room whose whole purpose is handing
documents to the other side is not demonstrable without files in it, and the viewer, sharing, move
and search slices all need real blobs to act on.

## What Changes

Slice 6 of `docs/05-build-order.md`. Delivers `FR-FILE-010`, `FR-FILE-020`, `BR-040`, `BR-050`,
`BR-060`.

**API — `apps/api`:**

- `POST /files` — multipart (`parentId`, `file`). Size and sniffed MIME are checked before a byte is
  stored; `PutObject` writes `{dataRoomId}/{nodeId}`, the `Node` row follows, and a failed row write
  deletes the blob (BR-040, BR-060). Name conflicts go through the existing `resolveUniqueName`.
- `GET /files/:id/download` — a presigned attachment URL, valid 5 minutes, for the browser to
  navigate to.
- `DELETE /nodes/:id` collects the subtree's `storageKey`s and issues `DeleteObjects` after the row
  is gone. Without it, upload starts orphaning blobs on the delete path slice 5 already shipped.
- New codes `FILE_TOO_LARGE` (413), `UNSUPPORTED_TYPE` (415), `STORAGE_UNAVAILABLE` (502); new env
  var `MAX_FILE_BYTES`.

**Web — `apps/web`:** Upload from the toolbar, the empty state, or a drop on the listing. One
request per file over `XMLHttpRequest`, a bottom-right queue card with per-row percentage, cancel and
retry, two backoff retries on a network error or 5xx and none on a 4xx (BR-050). Download acts on the
current file selection.

**Requirement change.** docs/03 § API records `/files/:id/download` as `302`. A top-level navigation
carries no `Authorization: Bearer` and `fetch` cannot read a redirect's `Location`, so the route
answers `200 { url, expiresAt }` and the client navigates to it — FR-FILE-020 verbatim, bytes still
never through Nest, bucket still needs no CORS rule. That one cell of docs/03 changes; nothing in
docs/02 does.

## Capabilities

### New Capabilities

- `files`: Uploading bytes into a folder, validating them server-side before storage, handing them
  back through a short-lived presigned URL, and keeping row and blob consistent on delete.

### Modified Capabilities

- `navigation`: "Navigation toolbar write actions" enumerates the toolbar's buttons; it gains
  **Upload** (always visible) and **Download** (visible when the selection is files only), and the
  empty state gains its Upload affordance.

## Impact

- New: `apps/api/src/files/` (module, controller, service, DTO, MIME sniffer);
  `apps/web/src/components/files/` (`UploadDropzone`, `UploadQueueCard`, `UploadQueueRow`) and the
  Zustand upload store.
- Modified: `StorageService` (put, presign, delete), `NodesService.deleteNode`, `env.ts`,
  `.env.example`, `api.exception.ts`, `ListingToolbar`, the listing route.
- Dependencies: `@aws-sdk/s3-request-presigner`, `@types/multer`.
- `packages/shared`: `PresignedUrl`, the upload allow list.

## Non-goals

- The `/f/$folderId` route, row-click navigation and live breadcrumbs — the rest of FR-NAV-020,
  still outstanding from slice 4. Upload targets whichever folder the listing shows, which is the
  root until that lands.
- `GET /files/:id/preview` and the file viewer — slice 7 (FR-VIEW-060).
- File rename and move — slice 8 (FR-FILE-030/050).
- Multi-file batch upload in one request, and therefore `TOO_MANY_FILES`: per-file progress, cancel
  and independent failure (FR-FILE-010) require one request per file, so BR-040's 20-per-batch cap
  is enforced in the queue before any request is made and no route can produce that code (BR-100).
