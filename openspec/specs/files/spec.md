# files Specification

## Purpose

Covers getting bytes into a Data Room and back out of it: what an upload must prove about itself
before anything is stored, what the stored file looks like as a row, how a file is handed back
without its bytes passing through the API, and what happens to the bytes when the row goes away.

## Requirements

### Requirement: An upload proves what it is before anything is stored

The API SHALL decide whether to accept an upload from the bytes themselves, never from the client's
claimed content type or the file's extension, and SHALL make that decision before writing anything
to the object store (BR-040). A file larger than the configured maximum SHALL be refused
`413 FILE_TOO_LARGE`; a file whose sniffed type is not on the allow list SHALL be refused
`415 UNSUPPORTED_TYPE`. The allow list is PDF, plain text, CSV, Markdown, PNG, JPEG, GIF, WebP, and
the Office and OpenDocument formats. A refused upload SHALL leave no stored object and no row.

#### Scenario: BR-040 an allowed type is accepted on its bytes

- **WHEN** a PDF, a PNG, a plain-text file and an OpenDocument text file are each uploaded
- **THEN** each is accepted, and each resulting file reports the content type that was sniffed from
  its bytes rather than the one the client sent

#### Scenario: BR-040 the client's claimed content type is ignored

- **WHEN** an upload declares `application/pdf` and sends PNG bytes
- **THEN** the upload is accepted and the file reports the PNG content type, not the declared one

#### Scenario: BR-040 a disallowed type is refused on its bytes

- **WHEN** an upload named `report.pdf` and declared `application/pdf` in fact carries an executable
- **THEN** the response is `415` with code `UNSUPPORTED_TYPE`, and nothing is stored

#### Scenario: BR-040 SVG is refused however it is presented

- **WHEN** an SVG document is uploaded, whatever its name or declared content type
- **THEN** the response is `415` with code `UNSUPPORTED_TYPE` — SVG is deliberately off the allow
  list because it is a script container

#### Scenario: BR-040 an oversized file is refused

- **WHEN** an upload exceeds the configured maximum file size
- **THEN** the response is `413` with code `FILE_TOO_LARGE`, and nothing is stored

#### Scenario: BR-040 an empty file is refused

- **WHEN** a zero-byte file is uploaded
- **THEN** the response is `415` with code `UNSUPPORTED_TYPE`, because no type can be sniffed from
  no bytes

#### Scenario: BR-040 the maximum is configured, not compiled in

- **WHEN** the deployment's maximum file size is changed and the API restarted
- **THEN** the new limit is what uploads are measured against, with no code change (BR-100)

---

### Requirement: An accepted upload becomes a file in a folder

The API SHALL create, for an accepted upload, one file node in the named folder carrying its name,
its byte size as a JSON number, and its sniffed content type (FR-FILE-010). A name that collides
with a sibling SHALL be suffixed by the same rule every other write path uses, and the response
SHALL carry the name actually stored (BR-020). A target the caller has no claim on, one that does
not exist, and one that is not a folder SHALL all answer `404 NOT_FOUND` (BR-010).

#### Scenario: FR-FILE-010 an upload appears in the folder that was named

- **WHEN** a file is uploaded into a folder
- **THEN** the response is `201` with the new file's id, its parent's id, the file kind, its name,
  its byte size as a number and its sniffed content type — and the folder's next listing includes it

#### Scenario: BR-020 an upload whose name is taken is stored under a suffixed name

- **WHEN** `statement.pdf` is uploaded into a folder that already holds `statement.pdf`
- **THEN** the response is `201` and the stored name is `statement (2).pdf` — the suffix before the
  extension, and the response says which name was used

#### Scenario: BR-020 a name collision is judged without regard to case

- **WHEN** `Statement.PDF` is uploaded into a folder that already holds `statement.pdf`
- **THEN** it is treated as a collision and the stored name is suffixed

#### Scenario: BR-010 an upload into a folder in someone else's room is refused

- **WHEN** a caller uploads into a folder id that exists but belongs to another Data Room
- **THEN** the response is `404` with code `NOT_FOUND` — indistinguishable from a folder that does
  not exist, and never `403`

#### Scenario: BR-010 an upload into an unknown target is refused

- **WHEN** a caller uploads into an id no row has, or into an id that names a file rather than a
  folder
- **THEN** the response is `404` with code `NOT_FOUND`

#### Scenario: FR-AUTH-030 an anonymous upload is refused

- **WHEN** an upload arrives with no token, or an expired one
- **THEN** the response is `401` with code `UNAUTHENTICATED`, and nothing is stored

#### Scenario: BR-050 an object store that refuses is reported as retryable

- **WHEN** the object store cannot be reached or refuses the write
- **THEN** the response is `502` with code `STORAGE_UNAVAILABLE` and a message the client can show,
  no row exists for the attempt, and the body names no host, bucket, credential or library

---

### Requirement: A file's row and its bytes exist together or not at all

The API SHALL never leave a file row whose bytes are missing, nor stored bytes that no row refers to
(BR-060). An upload that fails after its bytes are stored SHALL remove them. Deleting a node SHALL
remove the stored bytes of every file in its subtree once the rows are gone, so a delete leaves
nothing behind in the object store (BR-060, FR-FLDR-030).

#### Scenario: BR-060 a failed row write leaves nothing stored

- **WHEN** an upload's bytes are stored but the row cannot be written
- **THEN** the request fails, no file appears in the folder, and the object store holds no object
  for that attempt

#### Scenario: BR-050 an abandoned upload leaves nothing behind

- **WHEN** an upload is cancelled or its connection drops before it completes
- **THEN** no file appears in the folder and the object store holds no object for that attempt

#### Scenario: BR-060 deleting a file removes its bytes

- **WHEN** a file is deleted
- **THEN** the response is `204`, the file is gone from its folder, and the object store no longer
  holds its object

#### Scenario: BR-060 deleting a folder removes the bytes of everything under it

- **WHEN** a folder holding files at several depths is deleted
- **THEN** the object store no longer holds an object for any file that was in that subtree

---

### Requirement: A file is handed back through a short-lived URL, not through the API

The API SHALL answer a download request for a file the caller is entitled to with a short-lived URL
the browser navigates to, so the bytes travel from the object store to the browser and never through
the API (FR-FILE-020). The URL SHALL carry the file's stored name and present as an attachment, and
SHALL stop working once it expires. A folder, an unknown id and a node in another Data Room SHALL
all answer `404 NOT_FOUND` (BR-010).

#### Scenario: FR-FILE-020 a download hands back a working URL

- **WHEN** the owner requests a download for one of their files
- **THEN** the response is `200` carrying a URL and the moment it expires, the URL is not on the
  API's own origin, and fetching it returns exactly the bytes that were uploaded

#### Scenario: FR-FILE-020 the URL downloads under the stored name

- **WHEN** that URL is opened in a browser
- **THEN** the browser saves the file rather than displaying it, under the name the file has in the
  Data Room

#### Scenario: FR-FILE-020 the URL stops working when it expires

- **WHEN** the URL is used after the moment the response named
- **THEN** the object store refuses it, so a copied link is not a permanent handle on the bytes

#### Scenario: BR-010 a download for a foreign or unknown file is refused

- **WHEN** a download is requested for an id that does not exist, that belongs to another Data Room,
  or that names a folder rather than a file
- **THEN** the response is `404` with code `NOT_FOUND`, never `403`

#### Scenario: FR-AUTH-030 an anonymous download request is refused

- **WHEN** a download is requested with no token, or an expired one
- **THEN** the response is `401` with code `UNAUTHENTICATED` and no URL is handed out

---

### Requirement: Uploading is reachable by button and by dropping files on the listing

The UI SHALL let the owner start an upload into the open folder from an explicit control and by
dropping files onto the listing, including onto an empty folder's own empty state (FR-FILE-010). A
drag carrying files SHALL be visibly acknowledged before it is released. A selection larger than the
per-batch cap SHALL be refused in the UI before any request is made, with the reason stated.

#### Scenario: FR-FILE-010 files can be chosen from a control

- **WHEN** the owner activates Upload and picks one or more files
- **THEN** each picked file starts uploading into the folder currently shown

#### Scenario: FR-FILE-010 files can be dropped on the listing

- **WHEN** the owner drags files over the listing and releases them
- **THEN** the listing indicates it will accept them while the drag is over it, and on release each
  file starts uploading into the folder currently shown

#### Scenario: FR-FILE-010 an empty folder accepts a drop too

- **WHEN** the owner drops files on a folder that is showing its empty state
- **THEN** the files upload into it, and the empty state also offers Upload as an explicit control

#### Scenario: BR-040 an over-large batch is refused before anything is sent

- **WHEN** the owner picks or drops more files at once than the per-batch cap allows
- **THEN** nothing is uploaded, and the UI says how many files may be sent at once

---

### Requirement: Every upload reports its own progress and can be cancelled or retried

The UI SHALL show one row per upload with its progress as a percentage and a way to cancel it, and
one upload's failure SHALL NOT abort the others (FR-FILE-010). A failure SHALL be visible and carry
the server's own message; an upload SHALL retry twice with backoff on a network error or a `5xx`,
and SHALL NOT retry a `4xx` (BR-050). The queue SHALL remain until the owner dismisses it, so a
failure is not lost by navigating away.

#### Scenario: FR-FILE-010 each file gets its own progress

- **WHEN** several files are uploaded at once
- **THEN** each has its own row showing a percentage that advances, and each completes or fails on
  its own

#### Scenario: FR-FILE-010 one failure does not abort the others

- **WHEN** one file in a batch is refused and the rest are valid
- **THEN** the refused row shows its failure and the other rows finish and appear in the listing

#### Scenario: FR-FILE-010 an upload can be cancelled mid-flight

- **WHEN** the owner cancels an upload that is in progress
- **THEN** its row reports it was cancelled, the transfer stops, and no file appears in the folder

#### Scenario: BR-050 a transport failure retries and then offers Retry

- **WHEN** an upload fails with a network error or a `5xx`
- **THEN** it is retried twice with a growing delay, and only after the third failure does its row
  show the failure with a Retry action that starts it again

#### Scenario: BR-050 a rejected upload is not retried

- **WHEN** an upload is refused `413 FILE_TOO_LARGE`, `415 UNSUPPORTED_TYPE` or `404 NOT_FOUND`
- **THEN** it is not retried, and its row shows the message the server sent rather than a generic one

#### Scenario: BR-050 the queue outlives the folder it started in

- **WHEN** the owner navigates to another folder while uploads are running or after one has failed
- **THEN** the queue and its rows are still visible, and are removed only when dismissed

#### Scenario: BR-020 a completed row names the file as it was stored

- **WHEN** an upload is stored under a suffixed name because its own name was taken
- **THEN** its completed row shows the name that was actually stored, not the name that was picked

### Requirement: A file can be fetched for display instead of for saving

The API SHALL answer a preview request for a file the caller is entitled to with a short-lived URL
that presents the bytes **inline**, so a browser displays the file rather than saving it
(FR-VIEW-060). It is the display counterpart of the download URL and behaves the same way otherwise:
the bytes travel from the object store to the browser and never through the API, the URL carries the
file's content type, and it stops working once it expires. A folder, an unknown id and a node in
another Data Room SHALL all answer `404 NOT_FOUND` (BR-010).

#### Scenario: FR-VIEW-060 a preview hands back a working inline URL

- **WHEN** the owner requests a preview for one of their files
- **THEN** the response is `200` carrying a URL and the moment it expires, the URL is not on the API's
  own origin, and fetching it returns exactly the bytes that were uploaded

#### Scenario: FR-VIEW-060 the URL displays rather than saves

- **WHEN** that URL is opened in a browser
- **THEN** the browser displays the file rather than offering to save it, and the response carries the
  file's sniffed content type

#### Scenario: FR-VIEW-060 the preview URL stops working when it expires

- **WHEN** the URL is used after the moment the response named
- **THEN** the object store refuses it, so a copied preview link is not a permanent handle on the
  bytes

#### Scenario: BR-010 a preview for a foreign or unknown file is refused

- **WHEN** a preview is requested for an id that does not exist, that belongs to another Data Room, or
  that names a folder rather than a file
- **THEN** the response is `404` with code `NOT_FOUND`, never `403`, and no URL is handed out

#### Scenario: FR-AUTH-030 an anonymous preview request is refused

- **WHEN** a preview is requested with no token, or an expired one
- **THEN** the response is `401` with code `UNAUTHENTICATED` and no URL is handed out

#### Scenario: BR-050 an object store that cannot sign is reported without leaking

- **WHEN** the object store cannot be reached to sign the URL
- **THEN** the response is `502` with code `STORAGE_UNAVAILABLE` and a message the client can show,
  and the body names no host, bucket, credential or library

#### Scenario: FR-VIEW-060 a malformed id is a validation failure, not a server error

- **WHEN** a preview or a download is requested for an id that is not a well-formed identifier —
  which a hand-edited viewer link can produce
- **THEN** the response is `400` with code `VALIDATION_FAILED` naming `id`, and never `500 INTERNAL`
