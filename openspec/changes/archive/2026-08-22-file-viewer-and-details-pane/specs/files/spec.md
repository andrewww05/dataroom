## ADDED Requirements

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
