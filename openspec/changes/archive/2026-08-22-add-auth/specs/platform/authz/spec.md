## Purpose

Decides who is allowed to reach a handler at all. Every route is closed until it is opted out, and a
request that cannot be resolved to a principal is refused before any handler or query runs.

## ADDED Requirements

### Requirement: Routes are closed by default

The system SHALL reject any request that carries no valid bearer token with `401 UNAUTHENTICATED`
before the handler runs, and SHALL admit an anonymous caller only on a route explicitly marked public
(FR-AUTH-030). Public today: sign-up, sign-in, health, and the demo document listing that the web
shell slice removes along with the module behind it. A route added later is protected by default, not
by someone remembering to protect it.

#### Scenario: FR-AUTH-030 an anonymous request to a protected route is refused

- **WHEN** `GET /api/auth/me` is called with no `Authorization` header
- **THEN** the response is `401` with code `UNAUTHENTICATED` and the handler never runs

#### Scenario: FR-AUTH-030 the public routes answer without a token

- **WHEN** sign-up, sign-in, `GET /api/health` and the demo `GET /api/documents` listing are called
  with no `Authorization` header
- **THEN** each answers normally, so no token is needed to obtain one, to check liveness, or to load
  the placeholder page that the demo listing still feeds

#### Scenario: BR-010 a valid token resolves to exactly one principal

- **WHEN** a protected route is called with a token issued to a known user
- **THEN** the request succeeds and the handler acts as that one caller, not as whoever the request
  body or query names

#### Scenario: FR-AUTH-030 a newly added route is protected without being annotated

- **WHEN** a route that carries no public marker is called anonymously
- **THEN** the response is `401 UNAUTHENTICATED`, because protection is the default rather than an
  opt-in

#### Scenario: FR-AUTH-030 an expired token is refused

- **WHEN** a protected route is called with a correctly signed token whose expiry has passed
- **THEN** the response is `401` with code `UNAUTHENTICATED`

#### Scenario: FR-AUTH-030 a malformed authorization header is refused

- **WHEN** a protected route is called with `Authorization: Bearer` and nothing after it, or with a
  `Basic` header
- **THEN** each response is `401` with code `UNAUTHENTICATED`, never a `500` and never a partial
  success

#### Scenario: BR-070 an authorization scheme this system cannot resolve is refused

- **WHEN** a protected route is called with an `Authorization: Share <token>` header — the scheme a
  later slice will resolve to a read-only principal, and which resolves to nothing today
- **THEN** the response is `401` with code `UNAUTHENTICATED`, so an unresolvable scheme is never
  treated as partially trusted

### Requirement: Only tokens this deployment issued are accepted

The system SHALL verify a token's signature against the configured secret and SHALL refuse any token
it did not issue (FR-AUTH-030). The secret SHALL come from the environment with no default, and the
process SHALL refuse to start without it rather than issuing tokens anyone can forge (BR-100).

#### Scenario: FR-AUTH-030 a token signed with another secret is refused

- **WHEN** a protected route is called with a well-formed token signed with a different secret
- **THEN** the response is `401` with code `UNAUTHENTICATED`

#### Scenario: FR-AUTH-030 an unsigned token is refused

- **WHEN** a protected route is called with a token whose signature is absent or whose algorithm
  claims to be none
- **THEN** the response is `401` with code `UNAUTHENTICATED`

#### Scenario: FR-AUTH-030 a tampered payload is refused

- **WHEN** a valid token's payload is edited to name another user and the original signature is kept
- **THEN** the response is `401 UNAUTHENTICATED` and no request is served as the named user

#### Scenario: BR-100 the process refuses to start without a signing secret

- **WHEN** the API is started with the JWT secret variable unset or empty
- **THEN** startup fails with a message naming that variable, and no route is served
