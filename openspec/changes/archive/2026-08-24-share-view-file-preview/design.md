## Context

See proposal.md § Why. The API side is already done by slice 9: `GET /api/files/:id/preview` and
`GET /api/files/:id/download` both accept `Authorization: Share <token>` (or
`Share <token>, Bearer <jwt>` for a `RESTRICTED` grantee) and answer `200` with
`PresignedUrl` = `{ url: string; expiresAt: string }`. Refusals are `404 NOT_FOUND` (outside the
shared subtree), `401 SIGN_IN_REQUIRED` (`RESTRICTED`, not signed in), `401 UNAUTHENTICATED`
(revoked or expired token) and `502 STORAGE_UNAVAILABLE`. No env var, no migration, no new code.

`/s/{token}` already resolves `GET /api/shares/resolve?token=` → `{ node, mode, role, rootNodeId,
ownerEmail }` and lists with `GET /api/nodes/:id/children` → `Page<FsNode>`. `FsNode` carries
`mimeType` and `sizeBytes`, which is everything the viewer's render table needs.

## Goals / Non-Goals

**Goals:** one viewer component serving both audiences; the share token is the only thing that
differs.

**Non-Goals:** see proposal.md § Non-goals. At design level: no new API route, no second viewer, no
copy of the render table.

## Decisions

**Thread an optional token, do not fork the component.** The two fetch helpers pick their client:

```ts
// apps/web/src/hooks/useNodes.ts
export async function previewFile(fileId: string, shareToken?: string) {
  const res = shareToken
    ? await fetchShareClient<PresignedUrl>(shareToken, `/files/${fileId}/preview`)
    : await fetchClient<PresignedUrl>(`/files/${fileId}/preview`);
  return res.url;
}
```

`FileViewer` and `ViewerContent` take `shareToken?: string` and pass it down. The React Query key
becomes `['preview', file.id, shareToken ?? 'owner']` so two shares never read each other's cached
URL. Owner call sites and `DetailsPane` pass nothing and are untouched.

**A file share renders `ViewerContent`, not `FileViewer`.** `FileViewer` is a `Dialog` overlay with a
close control and arrows; behind a single-file share there is no listing to close to and no sibling
to step to, so rendering it would leave two controls that do nothing (BR-100). The shared file page
is the header strip plus `<ViewerContent file={node} shareToken={token} onDownload={…} />`.

**Rejected: a dedicated `GET /shares/:token/files/:id/preview`.** It would be a second code path for
a rule slice 9 already enforces, and a handler that reads the token instead of asking the principal
for `read` — exactly what BR-070 forbids.

## Invariants

- **BR-010** — untouched. Scope stays in `NodeScopeService.resolve`; the client cannot widen it, and
  a node outside the subtree is still `404`, never `403`.
- **BR-050** — `ViewerContent`'s existing error state (message + Retry + Download) now covers the
  shared path too; a failed preview is never a blank frame.
- **BR-070** — the client only changes which header it sends. The capability check stays server-side,
  and no write control is added to the shared view.
- **BR-100** — the download-only card is deleted rather than kept beside the viewer, and no close or
  arrow control is rendered where it would be inert. No host is hardcoded: every URL comes from the
  API's presigned response.

## Risks / Trade-offs

- **A presigned URL expires in 300 s while the viewer sits open** → the existing error state offers
  Retry, which re-runs the query and signs a fresh URL. Same behaviour the owner already has.
- **A share revoked mid-view keeps rendering the current bytes until the URL expires** → accepted, and
  identical to the owner's viewer; the next preview or download request is refused with `401`.
- **Sharing one query cache across audiences** → mitigated by putting the token in the query key.

## Validation

`scripts/validate/share-view-file-preview.sh` proves at runtime: FR-SHARE-020 (anonymous `Share`
token preview → `200`, inline URL, `Content-Disposition: inline` with the right `Content-Type`),
BR-010 (preview outside the subtree → `404 NOT_FOUND`), FR-SHARE-020 (`RESTRICTED` without a JWT →
`401 SIGN_IN_REQUIRED`; wrong grantee → `404 NOT_FOUND`), FR-SHARE-050 (revoked token →
`401 UNAUTHENTICATED`), and download over a share token → `200` with `attachment`.

It cannot prove FR-SHARE-070's gestures and rendering. Those become the printed manual checklist:
double-click opens the viewer, `←`/`→` step and skip folders and stop at the ends, `Esc` returns to
the same shared folder, a file share shows no close control or arrows, a PNG is fitted and a PDF
renders inline for an anonymous visitor, a `.docx` shows the fallback card, no write affordance is
reachable, and the address bar still reads the share URL.
