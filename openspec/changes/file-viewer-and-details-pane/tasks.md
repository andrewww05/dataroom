## 1. API — the inline preview

- [x] 1.1 Add `presignInline(key, filename, contentType)` to `StorageService` beside `presignDownload`
      (same 300 s expiry, `ResponseContentDisposition: inline`, `ResponseContentType`), then
      `FilesService.presignPreview` resolving through `NodeScopeService` and the
      `GET /files/:id/preview` route returning `PresignedUrl`. Give both file routes
      `new ParseUUIDPipe({ exceptionFactory: () => new ValidationFailedException({ id: [...] }) })`.
      Verify: `curl` the route with the owner's token and see `200 { url, expiresAt }`, and
      `curl -I` the returned URL and see `Content-Disposition: inline` plus `X-Amz-Expires=300`.
- [x] 1.2 Extend `apps/api/src/files/files.e2e-spec.ts` with the preview cases: the `200` shape and
      that the URL is not on the API's origin, `404 NOT_FOUND` for a folder id / an unknown id / a
      file in another Data Room (BR-010), `401 UNAUTHENTICATED` with no token (FR-AUTH-030), and
      `400 VALIDATION_FAILED` on a malformed id. Verify:
      `pnpm --filter @dataroom/api test:e2e` is green.

## 2. Web — folder navigation (slice 4 debt, widened on the user's instruction)

- [x] 2.1 Add the `/f/$folderId` route holding the listing, make `/` redirect to `auth/me`'s
      `dataRoom.rootId`, and give the route a not-found state with a way back to the room for the
      `404 NOT_FOUND` the API answers for an unknown, foreign or file id. Delete the dead
      `navigate({ to: '/folders/...' })`. Verify: open a nested folder and see its own URL and
      children, reload it, walk Back/Forward, and load `/f/<random-uuid>` to see the not-found state.
- [x] 2.2 Replace the hardcoded `Current Folder` breadcrumb in `_authenticated.tsx` with real segments
      from `GET /nodes/:id/path`, head segment the Data Room's name (FR-ROOM-010), each segment
      navigating to its folder. Verify: three levels deep the trail reads
      `<room> / <parent> / <folder>`, clicking the middle segment lands there, and nothing anywhere
      reads "Root".

## 3. Web — the viewer

- [x] 3.1 Build the three renderers keyed off `mimeType`: `PdfViewer` (`<iframe>` at full viewport
      height), `ImageViewer` (fitted, dark backdrop), `UnsupportedTypeViewer` (type icon, name, size,
      Download) — plus the load-failure state with retry and Download (BR-050). Verify: render each
      against a real uploaded PDF, PNG and `.docx`, and against a bad URL for the failure state.
- [x] 3.2 Build the `FileViewer` shell over the listing: opened by double-click, `Enter` on one
      selected file, and the details-pane preview; `?file=$fileId` on the folder route so a link
      opens it and Back closes it; `Esc` closes and restores the selection; `←`/`→` step through the
      cached listing filtered to `FILE`, stopping at both ends with no affordance rendered there;
      Download inside the viewer. **Remove the `downloadFile()` call from the file double-click
      path** — opening a file must never download it (FR-VIEW-060). Verify: double-click a file and
      see the viewer with nothing saved to downloads; step through a folder of mixed files and
      folders; reload a `?file=` URL.

## 4. Web — the details pane

- [x] 4.1 Build `DetailsPane` for the third column: when one node is selected in the listing, show
      its name, type, `createdAt`, `updatedAt`, size (if file), and the number of
      folders/files/bytes inside it (if folder, fetched via `useNodeStats`). For a file, include a
      smaller `ViewerContent` block (the same iframe/image as the full viewer, or a placeholder if
      unsupported). If zero or multiple nodes are selected, show the empty state. Verify: select a
      file and see its preview/metadata; select a folder and see its tree counts; select two items
      and see the placeholder.

## 5. Tests, validation and docs

- [x] 5.1 Add Vitest specs for the rules this change carries: the renderer chosen from `mimeType` and
      not from the file name (BR-040), the `←`/`→` step order skipping folders and not wrapping, and
      that opening a file calls the preview path and never the download path (FR-VIEW-060). Verify:
      `pnpm test --filter @dataroom/web` is green.
- [x] 5.2 Write `scripts/validate/file-viewer-and-details-pane.sh` to the contract in `AGENTS.md`
      § Testing Strategy — `set -euo pipefail`, `API_BASE_URL` with a local default, its own account
      and fixtures created and deleted through the public API. It asserts FR-VIEW-060 (the `200`
      shape, the URL off the API origin, `X-Amz-Expires=300`, the bytes match,
      `Content-Disposition: inline` on the store's response, a tampered signature refused), BR-010
      (three `404 NOT_FOUND` cases), FR-AUTH-030 (`401`), `400 VALIDATION_FAILED` on a junk id, and
      FR-ACCT-020 (the pane's figures from `GET /nodes/:id/stats`), then prints the manual checklist
      from `design.md` § Validation. Verify: it exits 0 against the running stack, twice in a row.
- [x] 5.3 Correct the two `docs/03-domain-and-api.md` rows that still say `302` for
      `/files/:id/download` and `/files/:id/preview` — both return `200 { url, expiresAt }`, with the
      reason (an iframe navigation carries no `Authorization` header) recorded beside the
      § Storage bullet that describes the two dispositions. Verify: `pnpm verify` is green and the
      table matches the shipped routes.
