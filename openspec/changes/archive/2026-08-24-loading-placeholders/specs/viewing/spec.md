## ADDED Requirements

### Requirement: The viewer's media frame is covered until its bytes have painted

Between the moment the viewer has a presigned URL and the moment the browser has painted the media,
the frame SHALL show a placeholder rather than the element's own empty background (FR-VIEW-060,
FR-VIEW-070). This window is separate from the one the presigned-URL request already covers: the URL
arrives quickly, and the bytes behind it then stream from the object store.

It matters for the two elements that paint an opaque background of their own before any content
arrives — the `<iframe>` a PDF renders in, which paints white regardless of the active theme, and the
`<img>` an image renders in. The placeholder SHALL be removed once the element reports that it has
loaded, and SHALL be replaced by the viewer's existing failure state — a message, Retry and Download —
if the element reports an error instead (BR-050). It SHALL NOT depend on the element's load report
alone: a report that never arrives SHALL still resolve to the failure state rather than leave the
placeholder on screen indefinitely.

#### Scenario: FR-VIEW-060 a PDF's frame is covered until its first page paints

- **WHEN** the owner opens a PDF whose bytes take measurable time to stream from the object store
- **THEN** the frame shows a placeholder shaped like a document page for the whole wait, and the
  placeholder is gone once the first page is visible

#### Scenario: FR-VIEW-060 an image's frame is covered until the image paints

- **WHEN** the owner opens a large image
- **THEN** the frame shows a placeholder sized to the frame until the image has decoded, and the image
  then replaces it without the frame flashing empty in between

#### Scenario: FR-VIEW-050 nothing white appears in the frame under the dark theme

- **WHEN** the dark theme is active and the owner opens a PDF
- **THEN** no white rectangle appears in the frame at any point before the PDF's own page paints

#### Scenario: FR-VIEW-060 stepping to the next file covers the frame again

- **WHEN** the owner presses `→` in the viewer to step to the next file in the folder
- **THEN** the frame shows the placeholder again for the new file, rather than holding the previous
  file's rendering or going empty

#### Scenario: BR-050 a media frame that fails to load shows the failure state

- **WHEN** the element reports an error because the URL was refused or the object is gone
- **THEN** the placeholder is replaced by the viewer's existing failure state, with a Retry and a
  Download button

#### Scenario: BR-050 a media frame that never reports at all still resolves

- **WHEN** the element neither loads nor reports an error — the request hangs
- **THEN** the frame eventually shows the failure state with Retry and Download, and the placeholder
  is not left on screen as a wait with no end
