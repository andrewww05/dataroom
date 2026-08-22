## Context

See proposal.md — Why. What already exists and constrains the approach:

- `StorageService` exposes `client: S3Client` and `bucket: string` and creates the private bucket on
  boot. Nothing writes an object yet.
- `NodeScopeService.resolve(principal, id) → ScopedNode` is the only way to obtain a row and throws
  `NotFoundException` on an unknown or foreign id (BR-010). `ScopedNode` carries `dataRoomId`.
- `resolveUniqueName(tx, dataRoomId, parentId, name, excludeId?)` in `src/nodes/name.helper.ts` is
  BR-020's single implementation. `toFsNode(row)` in `src/nodes/node.serializer.ts` is where
  `BigInt` becomes `number`.
- `Node` carries `sizeBytes BigInt?`, `mimeType String?`, `storageKey String?` — null on a folder.
- `@nestjs/platform-express` is installed (multer 2.x under it); `@aws-sdk/s3-request-presigner` is
  not, and neither is `@types/multer`.

The contract this change adds:

```
POST /api/files                multipart: parentId, file   → 201 FsNode
GET  /api/files/:id/download                               → 200 { url, expiresAt }
```

```ts
// packages/shared/src/files.ts, re-exported from index.ts
export interface PresignedUrl { url: string; expiresAt: string } // ISO 8601
export const MAX_FILES_PER_BATCH = 20;                            // BR-040
export const UPLOAD_ALLOWED_MIME_TYPES = [
  'application/pdf', 'text/plain', 'text/csv', 'text/markdown',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
] as const;
```

New rows in `ErrorCode` and `api.exception.ts` (docs/03 § Errors):

```
FILE_TOO_LARGE       413   over MAX_FILE_BYTES
UNSUPPORTED_TYPE     415   sniffed type off the allow list
STORAGE_UNAVAILABLE  502   the bucket refused or timed out — retryable (BR-050)
```

New environment variable, defaulted in `readEnv()` and documented in `.env.example`. It is not added
to `REQUIRED`, because it has a sensible default:

```
MAX_FILE_BYTES=104857600   # 100 MB (BR-040)
```

Object key: `` `${dataRoomId}/${nodeId}` `` with `nodeId = crypto.randomUUID()` generated in the
service before the row exists, which is what makes blob-first ordering possible.

## Goals / Non-Goals

**Goals:** one upload path that validates real bytes; one download path that never streams bytes
through Nest; row and blob consistent in both directions, including on delete.

**Non-Goals:** presigned direct-to-bucket uploads (they move validation after the write);
`GET /files/:id/preview`, which is slice 7 — the service method takes the disposition as an argument
so that slice is one controller line.

## Decisions

### D1 — Sniff with a hand-written magic-number reader, not `file-type`

`sniffMimeType(buffer): string | null` in `src/files/mime.sniffer.ts`. Magic bytes cover PDF
(`%PDF-`), PNG, JPEG (`FF D8 FF`), GIF, WebP (`RIFF….WEBP`) and the legacy OLE2 Office formats
(`D0 CF 11 E0`). A ZIP header (`PK\x03\x04`) is resolved further: OpenDocument stores an uncompressed
`mimetype` entry first, so its value is read directly; OOXML is identified by the literal filenames
`word/document.xml`, `xl/workbook.xml`, `ppt/presentation.xml`, which sit uncompressed in the local
headers. Anything with no signature is offered to a UTF-8 text check (valid UTF-8, no NUL or stray
control bytes) and becomes `text/plain`, `text/csv` or `text/markdown` by extension — text formats
have no magic number, so extension is the only signal left and it is only reachable after the bytes
have proved they are text.

**Rejected:** `file-type`. Version 21 is ESM-only and the API is CommonJS with decorator metadata, so
`import()` transpiles to `require()` and fails at runtime; pinning the last CJS release (16.x, 2021)
takes an unmaintained dependency. Either way it detects no text format, so the UTF-8 check would
still have to be written.

**BR-040 uphold:** multer's `memoryStorage` with `limits: { fileSize: MAX_FILE_BYTES, files: 1 }`
aborts an oversized body mid-stream — `LIMIT_FILE_SIZE` maps to `413 FILE_TOO_LARGE`. Sniffing runs
on the buffer; a type off `UPLOAD_ALLOWED_MIME_TYPES`, or a zero-byte body, is `415
UNSUPPORTED_TYPE`. `PutObject` is not called until both pass.

### D2 — Download answers `200 { url, expiresAt }` rather than `302`

`getSignedUrl(client, new GetObjectCommand({ Bucket, Key, ResponseContentDisposition:
'attachment; filename="…"' }), { expiresIn: 300 })`. The client fetches this with its bearer token
and then navigates to `url`.

**Rejected:** docs/03's `302`. A top-level navigation carries no `Authorization: Bearer`, and
`fetch(..., { redirect: 'manual' })` yields an opaque response whose `Location` cannot be read, so
`302` only works with a second token kind in the query string or a new ticket endpoint. FR-FILE-020
asks that "the browser navigates to a short-lived presigned URL" — this does exactly that, bytes
still never pass through Nest, and the bucket still needs no CORS rule because the transfer is a
navigation and not a `fetch`.

### D3 — One HTTP request per file; the batch cap lives in the queue

FR-FILE-010 wants per-file progress, per-file cancel and independent failure, none of which survive
several files in one request. `MAX_FILES_PER_BATCH` is exported from `packages/shared` and enforced
by the queue before any request is made, so no route can produce `TOO_MANY_FILES` and that code is
not added (BR-100).

**Rejected:** `FilesInterceptor('files', 20)`. It would make BR-040's cap server-side, and would cost
exactly the three things FR-FILE-010 asks for.

### D4 — Blob cleanup rides the existing recursive CTE

`NodesService.deleteNode` gains a pre-pass with the same shape as `stats`, collecting
`storageKey`s from the subtree, then deletes the row (cascade does the rest), then issues
`DeleteObjects` batched a thousand keys at a time. Row first here, on purpose: the mirror of the
upload's blob-first order, so the failure in either direction is an orphan-free store.

**Rejected:** deleting blobs before the row. A failed row delete would then leave rows pointing at
bytes that are gone — a broken download instead of a reclaimable object.

**BR-060 uphold:** upload writes the blob, then the row inside `$transaction`; a throw from the
transaction triggers `DeleteObject` on the key in a `catch`. Delete collects, deletes rows, then
deletes blobs.

**BR-050 uphold:** the web queue is a Zustand store of `{ id, file, parentId, status, percent, xhr,
attempt }`. `XMLHttpRequest.upload.onprogress` drives the percentage — `fetch` reports none.
`xhr.abort()` is cancel. A network error or a status ≥ 500 schedules attempt 2 and 3 at 500 ms and
1500 ms; any 4xx settles immediately as failed with the server's `message`.

## Risks / Trade-offs

- **100 MB buffered in memory per concurrent upload.** → The multer limit aborts before a larger body
  is read; concurrency in the queue is capped at three, so the ceiling is ~300 MB and the alternative
  (disk staging) adds a temp-file lifecycle for no gain at this scale.
- **A hand-written sniffer is narrower than a library.** → The allow list is fixed by BR-040 and
  small; `mime.sniffer.spec.ts` holds a fixture per accepted format plus the SVG, executable and
  zero-byte rejections, so a gap is a failing test rather than a silent accept.
- **A `DeleteObjects` failure after the rows are gone leaves orphan bytes.** → Logged, not surfaced:
  the user's delete succeeded and nothing is reachable. docs/03 § How it scales already names the
  `PendingBlobDeletion` sweep as the fix when subtrees get large.
- **Upload targets the folder the listing shows, which is the root** until FR-NAV-020's routing lands.
  → `parentId` is a parameter throughout, so nothing changes here when it does.

## Migration Plan

No schema change and no migration: `storageKey`, `sizeBytes` and `mimeType` shipped in slice 1.
`pnpm install` for the two new dependencies, and `MAX_FILE_BYTES` added to `.env.example` — absent
from an existing `.env`, the code default applies.
