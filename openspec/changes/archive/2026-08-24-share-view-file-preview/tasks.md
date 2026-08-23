## 1. Fetch layer

- [x] 1.1 Add an optional `shareToken` second argument to `previewFile` and `downloadFile` in
      `apps/web/src/hooks/useNodes.ts`, routing through `fetchShareClient` when it is present and
      `fetchClient` when it is not. Verify: `pnpm typecheck` passes with every existing call site
      unchanged, because the argument is optional.

## 2. Viewer

- [x] 2.1 Add `shareToken?: string` to `FileViewer` and `ViewerContent` in
      `apps/web/src/components/FileViewer.tsx`, pass it to `previewFile`/`downloadFile`, and put it
      in the preview query key as `['preview', file.id, shareToken ?? 'owner']`. Verify: the
      existing `FileViewer.spec.tsx` suite still passes and `DetailsPane` compiles untouched.

## 3. Shared view

- [x] 3.1 Replace `SharedFileView`'s icon-plus-Download card in `apps/web/src/routes/s.$token.tsx`
      with the header strip plus `<ViewerContent file={node} shareToken={token} onDownload={…} />`,
      deleting the card rather than keeping it beside the viewer (BR-100). Verify: a PUBLIC link to
      a PNG shows the image, and a link to a `.docx` shows the fallback card with Download.
- [x] 3.2 In `SharedViewShell`, hold the open file in component state, open `FileViewer` on
      double-click of a file row, and wire `onPrev`/`onNext` to the files of `childrenData.items`
      in listing order so folders are skipped and the ends do not wrap. Verify: double-click opens
      the viewer, `←`/`→` step between files, `Esc` returns to the same shared folder.
- [x] 3.3 Confirm no write affordance and no inert control ships in either shared screen — no close
      control or arrows on a file share, no rename/move/delete/upload/share anywhere (FR-SHARE-070,
      BR-070, BR-100). Verify: read the rendered tree in the browser for both share kinds.

## 4. Tests

- [x] 4.1 Extend `apps/web/src/components/FileViewer.spec.tsx` to assert `ViewerContent` requests its
      preview over the share token when `shareToken` is set and over the JWT client when it is not,
      and that the two produce different query keys. Verify: `pnpm test --filter @dataroom/web`.
- [x] 4.2 Add `apps/web/src/routes/s.$token.spec.tsx` covering a file share rendering the viewer
      instead of a download card, a folder share opening the viewer on double-click of a file row,
      double-click of a folder row navigating instead, and the failure path rendering the Retry +
      Download error state (BR-050). Verify: `pnpm test --filter @dataroom/web`.

## 5. Validation script

- [x] 5.1 Write `scripts/validate/share-view-file-preview.sh` to the contract in AGENTS.md
      § Testing Strategy, asserting FR-SHARE-020 (anonymous `Share` token preview → `200`, inline
      URL, `Content-Disposition: inline` and the file's `Content-Type`), BR-010 (preview outside the
      shared subtree → `404 NOT_FOUND`), FR-SHARE-020 (`RESTRICTED` without a JWT →
      `401 SIGN_IN_REQUIRED`, wrong grantee → `404 NOT_FOUND`), FR-SHARE-050 (revoked token →
      `401 UNAUTHENTICATED`), and download over a share token → `200` with `attachment`. It closes
      by printing the manual checklist from design.md § Validation. Verify: it exits 0 against the
      running stack, and twice in a row.

## 6. Docs

- [x] 6.1 Update `docs/04-ux.md` § Shared view so it states that a file opens in the viewer and that
      the shared viewer is not URL-addressable — drop this task if the implementation matched the
      plan and the doc already reads correctly.
