## Context

`ViewerContent` in `apps/web/src/components/FileViewer.tsx` already fetches a presigned URL and
branches on `file.mimeType`. Two branches exist: `application/pdf` → `<iframe>`, `image/*` →
`<img>`. Everything else falls through to the download-only prompt. The presigned-URL pipeline
(API → `GET /nodes/:id/preview` → S3 signed URL) already works and delivers bytes directly from
the object store, so no back-end change is required. `FsNode.mimeType` is already on the type
from `@dataroom/shared`.

The upload allow-list in the API (`BR-040`) already blocks SVG on upload, but SVG files may exist
from before that rule was enforced, and the spec permits `image/svg+xml` to be rendered via `<img>`
(which browsers sandbox).

## Goals / Non-Goals

**Goals:**

- Add `video/` → `<video controls>` branch (FR-VIEW-060).
- Add `audio/` → `<audio controls>` branch (FR-VIEW-060).
- Add `text/plain`, `text/csv`, `text/markdown`, `text/x-markdown` → `fetch` + `<pre>` branch
  (FR-VIEW-060); text is fetched from the presigned URL, never through the API.
- Treat `image/svg+xml` the same as other raster images — already covered by the `image/` guard,
  so no code change needed; document explicitly.
- Update `openspec/specs/viewing/spec.md` to enumerate the new renderers and shrink the
  honest-fallback set to Office / proprietary formats only.

**Non-Goals:**

- Office / OpenDocument rendering — no suitable zero-dependency in-browser library; deferred.
- Syntax highlighting (Polish tier).
- Inline `<svg>` embedding — the object store is a different origin; BR-040 already blocks SVG
  upload on the server; `<img src>` is the safe path.
- Any API change — the existing `GET /nodes/:id/preview` presigned-URL flow is sufficient.

## Decisions

**Text via fetch, not `<iframe>`.** An `<iframe>` with a presigned URL for a text file renders the
raw bytes, which is acceptable, but `<pre>` lets us apply font, padding and word-wrap styling
consistently. The fetch uses the presigned URL (object-store origin), so it does not add an API
call and upholds FR-VIEW-060.

**`<video>` and `<audio>` with `src=presignedUrl`.** The browser streams the bytes from S3 directly
through the presigned URL; no byte passes through the API. The `controls` attribute is the only
affordance — no custom player UI (BR-100: nothing half-implemented).

**Rejected — third-party player library.** A library like `react-player` would cover more edge
cases but adds a dependency for behaviour the native elements already supply. The user's instruction
says "without going overboard unless a ready-made library just needs layout". Native elements are
the ready-made library here.

**BR-040 compliance.** SVG upload is blocked server-side. The renderer accepts `image/svg+xml`
for read-only preview via `<img>`, which is the browser's safe sandboxed rendering path. No
`dangerouslySetInnerHTML` or inline `<svg>` is used.

**BR-050 compliance.** The text-fetch path wraps the `fetch` call in the existing `useQuery`
error-path and shows the same error UI (Retry + Download) on failure.

## Implementation

One file changes: `apps/web/src/components/FileViewer.tsx`.

The `ViewerContent` component gains three new branches inserted before the catch-all `return`:

```
video/*   →  <video controls src={previewUrl} className="…max dimensions…" />
audio/*   →  centered <div> wrapping <audio controls src={previewUrl} className="w-full" />
text/plain | text/csv | text/markdown | text/x-markdown
          →  useTextContent(previewUrl) → <pre> or loading/error state
```

`useTextContent` is a small helper (inside the same file or a sibling) that uses the existing
`useQuery` pattern to `fetch(url).then(r => r.text())`.

No change to `FileViewer`'s props, the presigned-URL query, or the error/loading wrappers.

## Risks / Trade-offs

- Large text files render entirely in the DOM. A 100 MB CSV will cause jank. Acceptable at this
  tier; a virtual-scroll text renderer is Extra-credit.
- Video streaming requires the object store to honour `Range` requests. MinIO does; most S3
  providers do. Noted in the validation checklist.

## Validation IDs

Proves at runtime via `scripts/validate/rich-preview.sh`:

- FR-VIEW-060 (video, audio, text: check presigned URL returns 200 with correct Content-Type)
- BR-050 (error state: covered by unit/component test, noted in manual checklist)

Manual checklist (browser only):

- Video plays with native controls; no download triggered on open.
- Audio plays; file name visible above the player.
- Plain-text file content visible in `<pre>`; no HTML interpretation.
- `.docx` file still shows download prompt, not an empty frame.
- SVG file renders visually (if one exists in the test data room).
