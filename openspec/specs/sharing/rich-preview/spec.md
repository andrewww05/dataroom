# sharing/rich-preview Specification

## Purpose

Serves static HTML with Open Graph metadata for bots and crawlers to generate rich link previews for shared nodes.

## Requirements

### Requirement: FR-SHARE-090

Bots and crawlers MUST receive Open Graph metadata for shared links.

#### Scenario: FR-SHARE-090 preview endpoint returns HTML with Open Graph tags

- **WHEN** a client calls `GET /shares/preview/:token`
- **THEN** the server returns `200 OK` with `Content-Type: text/html` containing `<meta property="og:title" content="...">`, `og:site_name`, and `twitter:card` tags for the shared node.

#### Scenario: FR-SHARE-090 preview endpoint returns 404 for unknown or expired token

- **WHEN** a client calls `GET /shares/preview/:token` with an invalid token
- **THEN** the server returns `404 NOT_FOUND` with no metadata leaked.

#### Scenario: FR-SHARE-090 preview endpoint handles folder and file differently

- **WHEN** the shared node is a file
- **THEN** the title includes the file name, and if size is known, maybe a description.
- **WHEN** the shared node is a folder
- **THEN** the title reflects it's a folder.
