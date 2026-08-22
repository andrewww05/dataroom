## 1. Shared contract and dependencies

- [x] 1.1 Add `packages/shared/src/files.ts` exporting `PresignedUrl { url, expiresAt }`,
  `MAX_FILES_PER_BATCH = 20` and `UPLOAD_ALLOWED_MIME_TYPES` (the 16 entries in design.md), re-export
  it from `index.ts`, and add `@aws-sdk/s3-request-presigner` and `@types/multer` to `apps/api`;
  verify `pnpm build --filter @dataroom/shared && pnpm typecheck` passes and both apps can import the
  new names.

## 2. API — configuration, errors and storage

- [x] 2.1 Add `maxFileBytes` to `Env` and `readEnv()` in `src/config/env.ts`, defaulted to
  `104857600` and deliberately **not** added to `REQUIRED`, document `MAX_FILE_BYTES` in
  `.env.example`, and add `FILE_TOO_LARGE` (413), `UNSUPPORTED_TYPE` (415) and `STORAGE_UNAVAILABLE`
  (502) to `ErrorCode` with their exception classes in `src/http/api.exception.ts`; verify
  `env.spec.ts` covers the default and an override, and that each new exception serialises to
  `{ code, message }` at its documented status.

- [x] 2.2 Give `StorageService` `putObject(key, body, contentType)`, `presignDownload(key, filename)`
  returning `{ url, expiresAt }` from `getSignedUrl(..., { expiresIn: 300 })` with
  `ResponseContentDisposition: attachment`, and `deleteObjects(keys)` batching a thousand keys per
  call; each wraps an S3 failure as `STORAGE_UNAVAILABLE` naming no host, bucket or credential;
  verify against the compose MinIO that a put, a presigned fetch and a delete round-trip.

## 3. API — validation, the file routes and blob cleanup

- [ ] 3.1 Write `src/files/mime.sniffer.ts` — `sniffMimeType(buffer): string | null` per design.md
  D1: magic bytes, ZIP-container resolution for OpenDocument and OOXML, and the UTF-8-then-extension
  path for text/CSV/Markdown — with `mime.sniffer.spec.ts` holding a fixture per accepted format plus
  the SVG, executable, mislabelled-PNG and zero-byte rejections (BR-040); verify
  `pnpm test --filter @dataroom/api` passes.

- [x] 3.2 Add `src/files/` (module, controller, service, `UploadFileDto { parentId }`) with
  `POST /files` — `FileInterceptor('file')` on `memoryStorage` with
  `limits: { fileSize: maxFileBytes, files: 1 }`, `scope.resolve` on `parentId` (404 for unknown,
  foreign, or non-folder), sniff → allow-list check, `crypto.randomUUID()` for the node id,
  `putObject` to `{dataRoomId}/{nodeId}`, then `resolveUniqueName` + the row inside `$transaction`
  with a `catch` that deletes the object (BR-040, BR-060) — and `GET /files/:id/download` returning
  `200 PresignedUrl`; register the module in `app.module.ts`; verify multer's `LIMIT_FILE_SIZE`
  surfaces as `413 FILE_TOO_LARGE` rather than a 500.

- [x] 3.3 Extend `NodesService.deleteNode` to collect the subtree's non-null `storageKey`s with the
  recursive CTE `stats` already uses, delete the rows, then call `deleteObjects` (design.md D4),
  logging rather than surfacing a store failure; verify deleting a folder of files leaves no object
  under `{dataRoomId}/` in the bucket.

## 4. API — tests

- [x] 4.1 Write `src/files/files.e2e-spec.ts` against `createTestApp()` covering upload happy path
  (201 `FsNode` with sniffed `mimeType` and numeric `sizeBytes`), BR-020 suffixing on a taken name,
  BR-040 refusals (`413`, `415` for SVG and for a mislabelled file), BR-010 refusals (`404` for an
  unknown, foreign and non-folder `parentId`), `401` for an anonymous call, download (`200` with a
  URL that is not the API origin and yields the uploaded bytes), and BR-060 (no object left after a
  file and after a folder delete); verify `pnpm --filter @dataroom/api test:e2e` passes.

## 5. Web — the upload queue and its controls

- [ ] 5.1 Add the Zustand upload store and `src/lib/upload.ts`: one `XMLHttpRequest` per file with
- [x] 5.1 Add the Zustand upload store and `src/lib/upload.ts`: one `XMLHttpRequest` per file with
  `upload.onprogress` driving `percent`, `abort()` for cancel, and BR-050's retry policy — two
  retries at 500 ms and 1500 ms on a network error or status ≥ 500, none on any 4xx, the server's
  `message` kept on failure — with concurrency capped at three and `MAX_FILES_PER_BATCH` refused
  before any request; verify a Vitest spec covers progress, cancel, the retry ladder and the
  no-retry-on-4xx rule.

- [x] 5.2 Add `src/components/files/UploadDropzone`, `UploadQueueCard` and `UploadQueueRow`, wire
  drop targets onto the listing and its empty state, add **Upload** (always) and **Download**
  (files-only selection, absent otherwise per BR-100) to `ListingToolbar`, and invalidate
  `['nodes', parentId, 'children']` as each upload completes; download fetches `PresignedUrl` and
  navigates to `url`; verify a Vitest spec covers the two new toolbar buttons' visibility rules and
  that a queue row renders percentage, cancel and Retry.

## 6. Docs

- [ ] 6.1 Update `docs/03-domain-and-api.md`: change the `GET /files/:id/download` row from
  `302` to `200 { url, expiresAt }` with the reason from design.md D2, add `PresignedUrl`,
  `UPLOAD_ALLOWED_MIME_TYPES` and `MAX_FILES_PER_BATCH` to § Shared contract, and mark
  `TOO_MANY_FILES` in § Errors as client-enforced with no route producing it; verify
  `pnpm verify` is green.
