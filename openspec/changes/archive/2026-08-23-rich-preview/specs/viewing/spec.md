## MODIFIED Requirements

### Requirement: The viewer renders each kind at full size, or says plainly that it cannot

**Replaces / extends** the same requirement in `openspec/specs/viewing/spec.md`.

The viewer SHALL render the following MIME families natively, without installing any third-party
library, using the browser's own rendering engine (FR-VIEW-060):

| Family | MIME prefix / type | Element |
|---|---|---|
| PDF | `application/pdf` | `<iframe>` |
| Raster image | `image/` (excl. SVG) | `<img>` |
| SVG | `image/svg+xml` | `<img>` (same as raster; SVG is sandboxed by the object-store; inline is not used, BR-040) |
| Video | `video/` | `<video controls>` |
| Audio | `audio/` | `<audio controls>` |
| Plain text | `text/plain`, `text/csv`, `text/markdown`, `text/x-markdown` | `<pre>` fetched as text and displayed verbatim |

Any other MIME type — specifically Office formats (`.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`),
proprietary binary formats, and any format not in the table above — SHALL display the honest
fallback: a type icon, the file's name and size, and a Download button. No empty frame, no spinner
that never resolves.

The bytes in all cases SHALL be fetched directly from the object store via the presigned URL, never
routed through the API (FR-VIEW-060, BR-050).

#### Scenario: FR-VIEW-060 a PDF renders inline

- **WHEN** the owner opens a PDF
- **THEN** its first page is visible at full viewport height without scrolling the page behind it,
  and the viewer's title is the file's name

#### Scenario: FR-VIEW-060 an image is fitted to the viewport

- **WHEN** the owner opens a PNG, JPEG, GIF or WebP
- **THEN** the whole image is visible, scaled down to fit rather than cropped or overflowing, on a
  dark backdrop

#### Scenario: FR-VIEW-060 a video file renders with native controls

- **WHEN** the owner opens a file whose MIME type starts with `video/`
- **THEN** the viewer renders a `<video>` element at full available size with browser-native playback
  controls, and no download begins automatically

#### Scenario: FR-VIEW-060 an audio file renders with native controls

- **WHEN** the owner opens a file whose MIME type starts with `audio/`
- **THEN** the viewer renders an `<audio>` element with browser-native playback controls, centered
  in the viewport, with the file's name visible above it

#### Scenario: FR-VIEW-060 a plain-text file renders its contents verbatim

- **WHEN** the owner opens a `.txt`, `.csv`, `.md`, or `.log` file (MIME `text/plain`,
  `text/csv`, or `text/markdown`)
- **THEN** the viewer fetches the text from the presigned URL, renders it inside a `<pre>` block
  with wrapping and a monospaced font, and does not interpret it as HTML or Markdown

#### Scenario: FR-VIEW-060 an SVG image renders like a raster image

- **WHEN** the owner opens an SVG file (MIME `image/svg+xml`)
- **THEN** the viewer renders it via an `<img>` tag fitted to the viewport on a dark backdrop,
  identical to a PNG or JPEG — it is not embedded as inline `<svg>`

#### Scenario: FR-VIEW-060 an Office or proprietary file shows the honest fallback

- **WHEN** the owner opens a `.docx`, `.xlsx`, `.pptx`, or `.odt` file
- **THEN** the viewer shows a type icon, the file's name and size, and a Download button — no empty
  frame, no spinner, no partial render

#### Scenario: BR-050 a preview that cannot be fetched fails visibly

- **WHEN** the URL the viewer was given is refused or unreachable
- **THEN** the viewer shows a message saying the file could not be loaded, with a way to retry and a
  Download button, and never a blank frame

#### Scenario: BR-050 a text fetch that fails shows the error state

- **WHEN** the viewer attempts to fetch the text content of a plain-text file and the request fails
- **THEN** the viewer shows the same error state used for PDF and image failures: a message, a Retry
  button, and a Download button — it does not leave an empty `<pre>`

#### Scenario: FR-VIEW-060 the bytes do not pass through the API

- **WHEN** a file is displayed in the viewer
- **THEN** the request that carries its bytes is not on the API's own origin
