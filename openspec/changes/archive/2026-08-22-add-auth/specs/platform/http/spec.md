## Purpose

Gives every failure the API returns one shape, so a client switches on a stable machine-readable code
and shows a human-readable message rather than parsing prose or guessing from a status.

## ADDED Requirements

### Requirement: Every failure is reported in one envelope

The API SHALL answer every failure with `{ code, message, details? }` and the HTTP status that
belongs to that code (BR-050). `code` is stable and switched on by the client, `message` is what a
toast shows, and `details` is present only when a payload was rejected field by field. No failure
SHALL escape in the framework's own error shape.

#### Scenario: BR-050 a rejected payload names the fields at fault

- **WHEN** a request body fails validation
- **THEN** the response is `400` with code `VALIDATION_FAILED`, a human-readable message, and
  `details` naming each rejected field

#### Scenario: BR-050 an unknown field is rejected rather than ignored

- **WHEN** a request body carries a field the endpoint does not define
- **THEN** the response is `400` with code `VALIDATION_FAILED`, so a misspelled field is never
  silently dropped

#### Scenario: BR-050 an authentication failure uses the same envelope

- **WHEN** a request is refused for a missing or invalid token
- **THEN** the body is `{ code: "UNAUTHENTICATED", message }` — the same shape as every other failure,
  not the framework's `statusCode`/`error` object

#### Scenario: BR-050 every error response carries a code and a message

- **WHEN** any failing request in this change's surface is examined — validation, credentials,
  duplicate email, unauthenticated
- **THEN** each body has a `code` and a `message`, and each code matches the documented status

### Requirement: An unexpected failure says nothing about the server's internals

An unhandled error SHALL be answered as a `500` in the same envelope, with a generic message and no
stack trace, SQL, file path or library name in the body (BR-050). The detail SHALL be logged
server-side instead, so it is diagnosable without being disclosed.

#### Scenario: BR-050 an unmapped exception becomes a generic 500

- **WHEN** a handler throws an error the filter has no code for
- **THEN** the response is `500` with a generic code and message, and the body contains no stack
  trace, SQL fragment, file path or dependency name

#### Scenario: BR-050 the detail is logged rather than returned

- **WHEN** that same request is served
- **THEN** the underlying error, including its stack, appears in the server log

#### Scenario: FR-AUTH-010 credentials are never echoed back

- **WHEN** a sign-up or sign-in request fails for any reason
- **THEN** neither the submitted password nor its hash appears in the response body or in the log
