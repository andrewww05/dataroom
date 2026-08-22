## Context

See proposal.md — Why. Today `/files/:id/download` exists and returns `200 { url, expiresAt }`; there
is no inline counterpart. `apps/web` has one listing route (`/`), a details pane that is a hardcoded
placeholder, a breadcrumb that is the literal string `Current Folder`, and a double-click that calls
`downloadFile()`. `mimeType` on every file was sniffed server-side at upload (BR-040), so the client
never has to guess a kind from an extension.

## Goals / Non-Goals

**Goals:** one presign helper per disposition; the viewer's kind decided by `mimeType`; folder and open
file both in the URL; the details pane reading figures only on demand.

**Non-Goals:** no pdf.js, no text/Office rendering, no thumbnail generation (an image previews from
its own inline URL; every other kind shows a type icon).

## Decisions

**Preview returns JSON, not a `302`.** `docs/03` lists `302` for both blob routes; both return the
envelope below instead, because an `<iframe>`/`<img>` navigation carries no `Authorization` header —
a redirect route would answer `401 UNAUTHENTICATED` before it ever redirected. Rejected alternative:
point the iframe straight at `/api/files/:id/preview` and authenticate it with a cookie or a
query token — a second auth surface for one screen. `/download` already shipped this shape; the last
task fixes those two `docs/03` rows.

```ts
// packages/shared — already exists, reused unchanged
interface PresignedUrl { url: string; expiresAt: string } // ISO 8601

GET /api/files/:id/preview  → 200 PresignedUrl
// 404 NOT_FOUND (folder | unknown | other room, via NodeScopeService — never 403, BR-010)
// 401 UNAUTHENTICATED · 400 VALIDATION_FAILED · 502 STORAGE_UNAVAILABLE
```

```ts
// storage.service.ts — beside presignDownload, same 300s expiry, signed against S3_ENDPOINT (BR-100)
presignInline(key, filename, contentType): GetObjectCommand({
  Bucket: this.bucket, Key: key,
  ResponseContentDisposition: `inline; filename="${filename}"`,
  ResponseContentType: contentType,   // Safari blanks an iframe without a real inline disposition
})
```

**`400`, not `500`, on a junk id.** `ParseUUIDPipe` throws a bare `BadRequestException`; the filter's
`BY_STATUS` has no `400` row, so the catch-all answers `500 INTERNAL` today. Both file routes get
`new ParseUUIDPipe({ exceptionFactory: () => new ValidationFailedException({ id: [...] }) })`. The
`/nodes/*` routes still `500` on a malformed id — a `platform/http` defect this change flags and
leaves alone.

**The URL owns both selections.**

```
/                        → redirect to auth/me's dataRoom.rootId
/f/$folderId             → listing + breadcrumbs from GET /nodes/:id/path (head = DataRoom.name)
/f/$folderId?file=$fileId → viewer over that listing; Back closes it, the link is shareable
```

**Kind from `mimeType`, never the name.** `application/pdf` → `<iframe>`; `image/png|jpeg|gif|webp` →
fitted `<img>`; anything else → icon, size, Download.

**`←`/`→` read the cached page.** The listing's `['nodes', folderId, 'children']` cache, filtered to
`FILE`, is the step order — no request per step, and it is the order on screen. It stops at both ends
and renders no affordance there (BR-100).

**Invariants.** BR-010: preview resolves through `NodeScopeService`, so foreign and unknown are one
`404`. BR-040: kind from the sniffed type. BR-050: viewer load failure, stats failure and `502` all
surface with a retry, and no body names a host, bucket or credential. BR-100: no disabled next-file
button, no shares section, no hardcoded endpoint.

## Risks / Trade-offs

- **A restrictive `frame-src` silently blanks the PDF** → nothing sets CSP today; the viewer shows its
  load-failure state with Download rather than an empty frame.
- **Widening into `navigation`** (the folder route is slice 4 debt) → confined to routing and
  breadcrumbs; the FR-NAV-010 tree stays untouched.
- **Deep-linked `?file` on page 2 of a folder** → the id is fetched with `GET /nodes/:id` rather than
  assumed present in the first page's cache; stepping is limited to the pages loaded.

## Validation

`scripts/validate/file-viewer-and-details-pane.sh` proves at runtime: **FR-VIEW-060** (`200` +
`url`/`expiresAt`, url off the API origin, `X-Amz-Expires=300`, the bytes match, `Content-Disposition:
inline` on the store's response, a tampered signature refused), **BR-010** (`404 NOT_FOUND` for a
folder id, an unknown id and another room's file), **FR-AUTH-030** (`401 UNAUTHENTICATED`),
`400 VALIDATION_FAILED` on a junk id, and **FR-ACCT-020** (the pane's figures from
`GET /nodes/:id/stats`).

It cannot prove, so it prints as the manual checklist: double-click opens the viewer and downloads
nothing; PDF at full height; image fitted; `.docx` fallback; `Esc` closes and restores selection;
`←`/`→` step, skip folders and stop at the ends; the deep link opens the viewer and Back closes it;
focus is trapped and returned; the details pane's fields, loading state and folder figures; the
nothing-selected pane; no shares section; breadcrumb head is the Data Room's name; `/` redirects;
Back/Forward between folders; the unknown-folder screen.
