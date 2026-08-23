## Why

The file viewer currently renders only two types in-browser: PDFs via `<iframe>` and images via
`<img>`. All other formats — video, audio, plain text, SVG, HTML — fall through to a "no preview"
download prompt even though every modern browser can render them natively at zero extra cost.
Grantees opening a shared link see that prompt for a MP4 or MP3 and must download the file to see
its content, which defeats the purpose of a data room viewer. FR-VIEW-060 already mandates that the
viewer renders each kind "at full size, or says plainly that it cannot"; this change makes the
implementation honour that contract for every format the browser supports natively.

## What Changes

- `FileViewer.tsx` (`ViewerContent`) gains renderer branches for: video (`video/`), audio (`audio/`),
  plain-text variants (`text/plain`, `text/csv`, `text/markdown`, `text/html`), SVG (`image/svg+xml`),
  and a catch-all for any other `text/*` or `image/*` the browser may handle.
- The viewer spec is updated to enumerate these newly rendered kinds alongside PDF and raster images.
- No new API endpoints, no new dependencies (all renderers use native browser elements).
- No library is introduced for formats already covered by `<video>`, `<audio>`, and `<iframe>` or
  `<pre>`; a library would only be considered if browser support were materially insufficient.

## Capabilities

### Modified Capabilities

- `viewing`: Expands FR-VIEW-060 to enumerate the additional MIME types the viewer renders natively
  (video, audio, plain text, SVG) and clarifies the "honest fallback" set to what truly has no
  native renderer (Office formats, proprietary binary formats).

## Impact

- `apps/web/src/components/FileViewer.tsx` — new renderer branches, no props change.
- `openspec/specs/viewing/spec.md` — updated requirement and scenarios for FR-VIEW-060.
- `scripts/validate/rich-preview.sh` — runtime validation against the live app.

## Non-goals

- Office / OpenDocument rendering (`.docx`, `.xlsx`, `.pptx`, `.odt`) — requires a third-party
  converter or WASM library; deferred to a dedicated slice.
- Syntax-highlighted code viewer beyond plain `<pre>` — Polish tier.
- In-browser PDF annotation — Extra-credit tier.
- Any back-end change — the presigned-URL flow already delivers bytes from the object store directly.
