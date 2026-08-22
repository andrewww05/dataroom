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
