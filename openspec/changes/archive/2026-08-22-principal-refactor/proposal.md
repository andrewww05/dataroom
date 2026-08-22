## Why

Slice 9 of docs/05-build-order.md. The guard already resolves both an owner (JWT) and a share
(token) and the `SharePrincipal` + `assertCapability` helpers already exist, but two gaps remain
before sharing can safely ship:

1. **Capability enforcement is not complete.** `FilesService.uploadFile` is the one mutating
   handler that does not yet call `assertCapability(principal, 'write')`. Any other handler added
   without that call is silently open to a share token.
2. **RESTRICTED shares skip the grantee check.** The guard resolves any valid, unexpired share
   token unconditionally. A RESTRICTED share should only authenticate a signed-in user whose email
   matches `Share.granteeEmail`; an anonymous visitor should get `SIGN_IN_REQUIRED` (401) and a
   signed-in user with the wrong email should get `NOT_FOUND` (BR-010).
3. **`SIGN_IN_REQUIRED` and `TOO_MANY_FILES` are missing from `ErrorCode`.** Both codes are
   documented in docs/03 § Errors but are not yet emitted.

Doing this before the sharing UI (slice 10) keeps BR-070's invariant — "the check is on a
capability, not on the token" — provable against one guard and one test suite rather than against
twenty controllers. Missing it and retrofitting after slice 10 means touching every handler again
and the second pass is where a route gets missed.

## What Changes

- **Guard**: add the RESTRICTED grantee check; emit `SIGN_IN_REQUIRED` when the visitor is
  anonymous, `NOT_FOUND` when signed in as the wrong person.
- **FilesService**: add `assertCapability(principal, 'write')` before `uploadFile`.
- **ErrorCode / exceptions**: add `SIGN_IN_REQUIRED` and `TOO_MANY_FILES` (the latter was needed
  for file uploads from the previous slice but was omitted).
- **Tests**: `jwt-auth.guard.spec.ts` extended for RESTRICTED grantee paths; a new
  `share-capability.spec.ts` proves every mutating route rejects a VIEWER share token with
  `403 READ_ONLY`.

## Capabilities

### New Capabilities
_None — all behavior is already required by BR-070; this change implements the missing enforcement._

### Modified Capabilities
- `auth`: guard now validates RESTRICTED grantee email; `SIGN_IN_REQUIRED` added to error table.

## Impact

- `apps/api/src/auth/jwt-auth.guard.ts` — grantee check
- `apps/api/src/files/files.service.ts` — assertCapability on uploadFile
- `apps/api/src/http/api.exception.ts` — SIGN_IN_REQUIRED, TOO_MANY_FILES
- `apps/api/src/auth/jwt-auth.guard.spec.ts` — RESTRICTED test cases
- `apps/api/src/` — new `share-capability.spec.ts`

## Non-goals

- Sharing UI (slice 10): share creation, revocation, the `/s/{token}` public view — not touched here.
- Scope-check refactor across other services (NodeScopeService already handles the ancestor walk).
- Any capability beyond VIEWER and EDITOR; the map already has both entries.
- Data-room rename (slice 11), tests slice (12), search (13).
