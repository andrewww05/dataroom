## 1. `FileViewer.tsx` — new renderer branches

- [x] 1.1 Add `video/` branch: render `<video controls src={previewUrl} className="max-w-full max-h-full" />` inside the existing dark-backdrop wrapper (mirrors the image branch).
- [x] 1.2 Add `audio/` branch: render a centred `<div>` with the file name above and `<audio controls src={previewUrl} className="w-full max-w-lg" />` below.
- [x] 1.3 Add text branch for `text/plain | text/csv | text/markdown | text/x-markdown`: introduce a `useTextContent(url)` hook (inside the same file) that uses the existing `useQuery` pattern with `fetch(url).then(r => r.text())`; render result in a `<pre className="…overflow-auto whitespace-pre-wrap font-mono text-sm p-6 w-full h-full">`. Show loading and error states using the same patterns already in `ViewerContent`.
- [x] 1.4 Verify `image/svg+xml` is already covered by the existing `mime.startsWith('image/')` guard — no code change needed, add a comment.
- [x] 1.5 `pnpm typecheck --filter @dataroom/web` — zero errors.
- [x] 1.6 `pnpm lint --filter @dataroom/web` — zero new lint errors.

## 2. Spec sync

- [x] 2.1 Merge the delta `openspec/changes/rich-preview/specs/viewing/spec.md` into `openspec/specs/viewing/spec.md`: expand the FR-VIEW-060 renderer table, update the "honest fallback" scenario list to name only Office/proprietary formats.

## 3. Component tests

- [x] 3.1 Add a test in `FileViewer.spec.tsx` (Vitest + jsdom): given a node with `mimeType: 'video/mp4'` and a resolved presigned URL, assert that `ViewerContent` renders a `<video>` element with `src` set to that URL.
- [x] 3.2 Add a test: given `mimeType: 'audio/mpeg'`, assert `<audio>` renders with `controls`.
- [x] 3.3 Add a test: given `mimeType: 'text/plain'` and a fetch that resolves to `"hello"`, assert `<pre>` contains `"hello"`.
- [x] 3.4 Add a test: given `mimeType: 'text/plain'` and a fetch that rejects, assert the error state (Retry + Download buttons) renders.
- [x] 3.5 `pnpm test --filter @dataroom/web` — all pass.

## 4. Validation script

- [x] 4.1 Write `scripts/validate/rich-preview.sh` (Bash, `set -euo pipefail`, executable).
  - Authenticate as owner; upload a `.mp4`, `.mp3`, `.txt`, and `.docx` file via the API.
  - For each: call `GET /api/nodes/:id/preview` and assert HTTP 200 with a presigned URL whose `Content-Type` header (from a `HEAD` request to the URL) matches the expected MIME type — proves FR-VIEW-060 (bytes arrive from the object store with correct type).
  - Assert that `GET /api/nodes/:id/preview` on the `.docx` also returns 200 with a presigned URL (the API does not block non-renderable types; the browser-side decision is client-only).
  - Clean up all created nodes.
  - Print manual checklist: video plays with controls; audio plays with name visible; `.txt` content shows in `<pre>`; `.docx` shows download prompt; SVG renders if available; no download triggered on open.
- [x] 4.2 `chmod +x scripts/validate/rich-preview.sh`.
- [x] 4.3 Run `scripts/validate/rich-preview.sh` against the running app — exits 0.
