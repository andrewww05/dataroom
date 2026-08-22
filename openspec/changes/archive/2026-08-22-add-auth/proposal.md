## Why

Slice 2 of [docs/05-build-order.md](../../../docs/05-build-order.md). Slice 1 shipped the tables;
nothing writes a row and every route is open. Auth is second because the principal is an argument to
every handler after it, and retrofitting it means touching all of them. It also lands FR-AUTH-050's
one-transaction invariant — the only place a `User`, their `DataRoom` and that room's root `Node`
are created.

## What Changes

- `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` per
  [docs/03 § API](../../../docs/03-domain-and-api.md#api). Emails lowercased and unique, passwords
  argon2-hashed and never logged; sign-up writes `User` + `DataRoom` + root `Node` in one
  transaction (FR-AUTH-050).
- The new Data Room is named `<email local part>'s Data Room` — FR-ROOM-010's server half.
- A global Passport JWT guard with a `@Public()` escape: every route answers `401 UNAUTHENTICATED`
  without a valid `Authorization: Bearer` token except `/auth/signup`, `/auth/login` and `/health`
  (FR-AUTH-030). Tokens last 7 days, no refresh (FR-AUTH-020).
- A global exception filter emitting the one envelope `{ code, message, details? }`, carrying
  `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `VALIDATION_FAILED` and — the one addition
  to docs/03's code table — `INTERNAL` for an unmapped failure.
- `JWT_SECRET` (required, no default) and `JWT_EXPIRES_IN` join the env contract; the demo
  `GET /api/documents` is marked `@Public()` so the placeholder page survives until slice 4.

Delivers: FR-AUTH-010/020/030/050, FR-ROOM-010 (name default), BR-010's 401 half. No requirement in
docs/02 changes.

## Capabilities

### New Capabilities

- `auth`: sign-up, sign-in, `/auth/me`, password hashing, token issuance, and the sign-up
  transaction that gives every user exactly one Data Room with exactly one root.
- `platform/authz`: routes are protected by default; a request without a resolvable principal is
  rejected before any handler runs.
- `platform/http`: the single error envelope every failure is reported in.

### Modified Capabilities

None — `platform/persistence` keeps its requirements; this change is its first writer.

## Impact

`apps/api` gains `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt` and `argon2`, plus `src/auth/` and
one global filter; `AppModule` gains the guard. `packages/shared` gains `AuthUser`, `DataRoom`,
`AuthResponse` and `ApiError`. No `apps/web` change, no migration, no schema change.

## Non-goals

Named deliberately, each left to its own slice:

- **Slice 3** — every `/nodes/*` route. The principal is attached to the request here; only
  `/auth/me` reads it.
- **Slice 4** — the sign-in and sign-up screens, where the token is kept, FR-AUTH-040's client-side
  sign-out, the Data Room title on screen, and retiring the `documents` demo.
- **Slice 9** — the owner-or-share principal and capability assertions (BR-070). This guard resolves
  an owner only; `Authorization: Share` is rejected like any other bad token.
- **FR-ROOM-010's rename** (`PATCH /data-rooms/:id`) — by decision, left to the slice whose UI
  renames in place. This change only sets the default name.
- Password reset, email verification, refresh tokens, rate limiting: none is in docs/02.
