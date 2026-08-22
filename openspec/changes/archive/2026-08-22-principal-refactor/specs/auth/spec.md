## ADDED Requirements

### Requirement: A RESTRICTED share token authenticates only the matching signed-in grantee

The guard resolves a `Share` token from `Authorization: Share <token>`. When the share's `mode` is
`RESTRICTED`, the guard MUST additionally verify the caller's identity before admitting the request
(BR-070, FR-SHARE-020).

- If no JWT is present alongside the share token (the caller is anonymous), the guard SHALL reject
  the request with `401 SIGN_IN_REQUIRED` rather than `404`, so the intended recipient knows they
  need to sign in.
- If a JWT is present and resolves to a valid user whose email does **not** match
  `Share.granteeEmail` (case-insensitive), the guard SHALL reject with `404 NOT_FOUND` — the
  response must be indistinguishable from a node the caller has no claim on (BR-010).
- If a JWT is present and resolves to the matching grantee, the request proceeds with the
  `SharePrincipal` as normal.
- A `PUBLIC` share token is accepted without any JWT (unchanged behavior).

#### Scenario: BR-070 anonymous visitor on a RESTRICTED share gets SIGN_IN_REQUIRED

- **WHEN** `GET /api/nodes/:id` is called with `Authorization: Share <restricted-token>` and no
  `Authorization: Bearer <jwt>`
- **THEN** the response is `401` with code `SIGN_IN_REQUIRED`

#### Scenario: BR-070 wrong grantee on a RESTRICTED share gets NOT_FOUND

- **WHEN** `GET /api/nodes/:id` is called with `Authorization: Share <restricted-token>` and a
  valid JWT for a user whose email does not match the share's `granteeEmail`
- **THEN** the response is `404` with code `NOT_FOUND`

#### Scenario: FR-SHARE-020 matching grantee on a RESTRICTED share is admitted

- **WHEN** `GET /api/nodes/:id` is called with `Authorization: Share <restricted-token>` and a
  valid JWT for the user whose email matches `Share.granteeEmail`
- **THEN** the response is `200` and the share principal is resolved with role `VIEWER`

#### Scenario: FR-SHARE-010 a PUBLIC share token is admitted without a JWT

- **WHEN** `GET /api/nodes/:id` is called with only `Authorization: Share <public-token>` and no
  Bearer header
- **THEN** the response is `200` and the share principal is resolved (unchanged behavior)

### Requirement: Every mutating handler asserts the write capability

Every handler that writes — create, rename, move, delete (nodes and files), create share, revoke
share — MUST call `assertCapability(principal, 'write')` before acting (BR-070). This includes
`FilesService.uploadFile`, which was missing the call. A `SharePrincipal` with `role = VIEWER` has
no `write` capability and MUST be rejected with `403 READ_ONLY`; no write reaches storage or the
database.

#### Scenario: BR-070 share VIEWER is rejected on file upload

- **WHEN** `POST /api/files` is called with a valid `Share` token (role `VIEWER`) and a
  multipart file payload
- **THEN** the response is `403` with code `READ_ONLY` and no `Node` row and no blob is created

#### Scenario: BR-070 share VIEWER is rejected on all node-mutating routes

- **WHEN** any of `POST /api/nodes/folders`, `PATCH /api/nodes/:id`, `POST /api/nodes/move`,
  `DELETE /api/nodes/:id` is called with a `Share` token (role `VIEWER`)
- **THEN** every response is `403` with code `READ_ONLY`

#### Scenario: BR-070 share VIEWER may read through the scope

- **WHEN** `GET /api/nodes/:id`, `GET /api/nodes/:id/children`, `GET /api/nodes/:id/path`,
  `GET /api/nodes/:id/stats`, `GET /api/files/:id/download`, `GET /api/files/:id/preview`
  are called with a `Share` token whose subtree contains the requested node
- **THEN** every response is `200`

### Requirement: SIGN_IN_REQUIRED and TOO_MANY_FILES MUST be emittable errors

The error table in docs/03 § Errors lists `SIGN_IN_REQUIRED` (401) and `TOO_MANY_FILES` (400);
both MUST exist in `ErrorCode` and have a corresponding `ApiException` subclass before any route
that can produce them ships (BR-100).

#### Scenario: BR-100 SIGN_IN_REQUIRED is in the error table

- **WHEN** a RESTRICTED share is opened by an anonymous visitor
- **THEN** the response body carries `"code": "SIGN_IN_REQUIRED"` with HTTP status `401`

#### Scenario: BR-100 TOO_MANY_FILES is in the error table

- **WHEN** a batch upload exceeds 20 files
- **THEN** the response body carries `"code": "TOO_MANY_FILES"` with HTTP status `400`
