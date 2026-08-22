## Purpose

Turns a visitor into an owner: sign-up, sign-in, and the one call a signed-in client makes to learn
who it is and which Data Room and root folder to open. Owns the transaction that gives every user
exactly one Data Room with exactly one root node.

## Requirements

### Requirement: A visitor signs up with an email and a password

The system SHALL accept a sign-up of an email and a password of at least 8 characters, store the
email lowercased and unique, and store the password only as an argon2 hash (FR-AUTH-010). A
successful sign-up SHALL answer with a token, the user and their Data Room. Neither the password nor
its hash SHALL appear in any response or in a log line.

#### Scenario: FR-AUTH-010 a new email is accepted

- **WHEN** `POST /api/auth/signup` is called with an unused email and an 8-character password
- **THEN** the response is `201` carrying a token, the user's id and lowercased email, and the Data
  Room's id, name and root node id — and no password or hash field anywhere in the body

#### Scenario: FR-AUTH-010 email case and surrounding space do not create a second account

- **WHEN** `ada@example.com` has signed up and `  Ada@Example.COM  ` is submitted to sign-up
- **THEN** the response is `409` with code `EMAIL_TAKEN` and exactly one user exists for that address

#### Scenario: FR-AUTH-010 a password under 8 characters is rejected

- **WHEN** sign-up is called with a 7-character password
- **THEN** the response is `400` with code `VALIDATION_FAILED`, its `details` names the password
  field without echoing the submitted value, and no user, Data Room or node row is created

#### Scenario: FR-AUTH-010 an address that is not an email is rejected

- **WHEN** sign-up is called with `not-an-email` and a valid password
- **THEN** the response is `400` with code `VALIDATION_FAILED` and nothing is created

#### Scenario: FR-AUTH-010 the stored credential is an argon2 hash

- **WHEN** a user has signed up
- **THEN** the stored credential is an argon2 hash rather than the submitted password, and the
  password appears in no log line emitted during the request

### Requirement: Signing in returns a bearer token good for seven days

The system SHALL issue a bearer token on a correct email and password pair, valid for the configured
lifetime and 7 days by default, and SHALL issue no refresh token (FR-AUTH-020). A wrong password and
an unknown email SHALL be answered identically, so neither reveals whether an account exists.

#### Scenario: FR-AUTH-020 correct credentials return a usable token

- **WHEN** `POST /api/auth/login` is called with a registered email — in any case — and its password
- **THEN** the response is `200` carrying a token, the user and their Data Room, and that token is
  accepted on a protected route

#### Scenario: FR-AUTH-020 the token expires at the configured lifetime, seven days by default

- **WHEN** a token issued by sign-up or sign-in is inspected under the default configuration
- **THEN** its expiry is 7 days after issue; a different configured lifetime moves the expiry with it,
  and in neither case is a refresh token returned alongside

#### Scenario: FR-AUTH-020 a wrong password is refused

- **WHEN** sign-in is called with a registered email and the wrong password
- **THEN** the response is `401` with code `INVALID_CREDENTIALS` and no token

#### Scenario: FR-AUTH-020 an unknown email is indistinguishable from a wrong password

- **WHEN** sign-in is called with an email that was never registered
- **THEN** the response is `401` with the same `INVALID_CREDENTIALS` code and the same message as a
  wrong password, so the response does not disclose which accounts exist

### Requirement: A signed-in client resolves itself, its Data Room and its root folder in one call

`GET /api/auth/me` SHALL answer the caller's id and email together with their Data Room's id, name
and root node id, so the client can send `/` to the room's root folder without a second request
(FR-AUTH-020, FR-NAV-020). A token whose user no longer exists SHALL be refused rather than answered.

#### Scenario: FR-AUTH-020 me answers with the caller's room and root

- **WHEN** `GET /api/auth/me` is called with a valid token
- **THEN** the response is `200` with the caller's id and email and a Data Room carrying its id, its
  name and the id of the room's parentless node

#### Scenario: FR-NAV-020 the reported root is the room's only parentless node

- **WHEN** the root node id from `/auth/me` is compared against the room's nodes
- **THEN** it is the one node in that room with no parent

#### Scenario: FR-AUTH-030 a token whose user is gone is refused

- **WHEN** `/auth/me` is called with a well-formed, unexpired token whose user row no longer exists
- **THEN** the response is `401` with code `UNAUTHENTICATED`

### Requirement: Sign-up creates the user, their Data Room and its root node in one transaction

Sign-up SHALL create all three rows or none of them (FR-AUTH-050), so every user has exactly one Data
Room, every Data Room exactly one root node, and every other node a parent. A failure at any point
SHALL leave no partial account behind.

#### Scenario: FR-AUTH-050 one sign-up yields one room with one root

- **WHEN** a sign-up succeeds
- **THEN** the user owns exactly one Data Room, that room holds exactly one node, and that node has
  no parent and is of the folder type

#### Scenario: BR-060 a failure part-way through leaves nothing

- **WHEN** the sign-up write fails after the user row and before the root node
- **THEN** no user, Data Room or node row exists for that email, and the caller sees an error rather
  than a token

#### Scenario: FR-AUTH-050 two sign-ups do not share a room

- **WHEN** two different emails sign up
- **THEN** each has its own Data Room and its own root node, and neither room contains the other's
  nodes

#### Scenario: FR-AUTH-050 racing sign-ups on one email produce one account

- **WHEN** two sign-ups for the same email are submitted concurrently
- **THEN** one answers `201` and the other `409 EMAIL_TAKEN`, and exactly one user, one Data Room and
  one root node exist for that email

### Requirement: A new Data Room is named after the email's local part

The Data Room created at sign-up SHALL be named `<local part>'s Data Room`, taken from the email
before the `@` (FR-ROOM-010). The name SHALL always end in `'s Data Room`: where the column's
255-character limit forces a cut, the local part is what gives way. No response SHALL name the room
or its root folder "Root".

#### Scenario: FR-ROOM-010 the default name uses the local part

- **WHEN** `ada@example.com` signs up
- **THEN** the Data Room returned by sign-up and by `/auth/me` is named `ada's Data Room`

#### Scenario: FR-ROOM-010 an over-long local part is shortened, not the suffix

- **WHEN** an email whose local part would push the name past the 255-character column signs up
- **THEN** sign-up succeeds, the stored name fits the column, and it still ends in `'s Data Room` —
  the local part is what was cut, so the room is never named a bare truncated address

#### Scenario: FR-ROOM-010 nothing is called Root

- **WHEN** the sign-up and `/auth/me` responses are read
- **THEN** neither the room nor its root folder is named `Root`

### Requirement: Sign-in and Sign-up UI

The client application MUST provide forms for users to authenticate or create new accounts.

#### Scenario: FR-AUTH-010 Sign-in validation and feedback

- **WHEN** the user submits the sign-in form with invalid credentials
- **THEN** the UI displays an appropriate error message and retains the inputted email.

#### Scenario: FR-AUTH-020 Sign-up validation and feedback

- **WHEN** the user submits the sign-up form with an existing email or invalid password
- **THEN** the UI displays the respective validation errors.

#### Scenario: FR-AUTH-030 Client-side session persistence

- **WHEN** the user successfully authenticates
- **THEN** the client stores the JWT securely (in a token file/memory) and redirects the user to the application home.

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

### Requirement: /shares/resolve uses a query parameter, not a path segment

The resolve route currently uses `GET /shares/resolve/:token` (path segment). Per the API table
in docs/03-domain-and-api.md, it MUST be `GET /shares/resolve?token=<token>` (query parameter).
This is a breaking change to the URL shape but not to the behavior contract (FR-AUTH-030).

#### Scenario: FR-AUTH-030 resolving a share token via query param succeeds

- **WHEN** `GET /api/shares/resolve?token=<token>` is called for a valid PUBLIC share without authentication
- **THEN** the response is `200` with the share context object

#### Scenario: FR-AUTH-030 old path-segment form returns 404

- **WHEN** `GET /api/shares/resolve/<token>` (path-segment form) is called
- **THEN** the response is `404` (no route registered for that shape)

