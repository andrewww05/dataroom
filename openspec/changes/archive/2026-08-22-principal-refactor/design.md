## Context

The guard (`JwtAuthGuard`) already resolves both principals — it creates an `OwnerPrincipal` from a
JWT and a `SharePrincipal` from an `Authorization: Share <token>` header. `principal.ts` already
defines `CAPABILITIES`, `assertCapability`, and both principal shapes. `NodeScopeService.resolve`
already runs the ancestor walk for a share principal.

Two enforcement gaps remain before sharing ships:

1. `FilesService.uploadFile` omits `assertCapability(principal, 'write')`.
2. `RESTRICTED` shares skip the grantee check — any caller with the token is admitted.

Two error codes documented in docs/03 are not yet emittable: `SIGN_IN_REQUIRED` (401) and
`TOO_MANY_FILES` (400).

## Goals / Non-Goals

**Goals:**

- Close the `uploadFile` capability gap so every mutating handler asserts `write`.
- Enforce `RESTRICTED` grantee check in the guard: `SIGN_IN_REQUIRED` for anonymous callers;
  `NOT_FOUND` for signed-in callers with the wrong email (BR-010).
- Add `SignInRequiredException` and `TooManyFilesException` to `api.exception.ts` and
  `ErrorCode`.
- Extend `jwt-auth.guard.spec.ts` and add `share-capability.spec.ts` to prove BR-070.

**Non-Goals:**

- Sharing UI, share creation/revocation endpoints, `/s/{token}` view — slice 10.
- Any schema change (`Share.role` is already in the first migration).
- No additional capabilities beyond VIEWER and EDITOR.

## Decisions

### RESTRICTED grantee check — where it lives

**Decision:** the check runs in `JwtAuthGuard.canActivate`, not in `NodeScopeService`.

The guard is the boundary. Putting the grantee check inside `NodeScopeService` would mean an
anonymous RESTRICTED caller reaches the service before being stopped — and the service would have
to know about the HTTP request context (the Bearer token) to resolve the user's email. The guard
already sees both the share token and the optional Bearer header; adding four lines there keeps
the scope check inside `NodeScopeService` unchanged.

**Rejected:** a decorator on each handler — same as per-controller `@UseGuards()`: a handler added
without the decorator is silently open (AGENTS.md guardrails).

### Reading the JWT alongside a Share token

The guard currently branches `Share` and falls through to Passport. For RESTRICTED, it must
optionally parse the Bearer token without invoking the full Passport strategy (which would throw if
the header is absent). Implementation:

```ts
// inside the 'Share ...' branch, after resolving the Share row:
if (share.mode === 'RESTRICTED') {
  const bearerHeader = request.headers['x-bearer'] ?? request.headers.authorization;
  // If the Share header is present, authorization was consumed by it; read the Bearer via
  // a second header or re-read the original if both were sent as separate values.
  // Simpler: require both on one request via 'Authorization: Share <token>' plus
  // 'X-Bearer: <jwt>' — or decode the Bearer inline with jsonwebtoken.verify().
}
```

**Decision:** decode the Bearer token inline in the guard using `jsonwebtoken.verify(secret)` (the
same library Passport's `passport-jwt` uses under the hood). The JWT `email` claim is compared
directly against `share.granteeEmail` — no second DB lookup is needed because the email is already
in the JWT payload. No second HTTP header needed — the client sends both values in one header as
comma-separated tokens: `Authorization: Share <token>, Bearer <jwt>`. The guard splits on `,` and
finds each part by prefix. An anonymous caller (no Bearer) triggers `SIGN_IN_REQUIRED`; a caller
whose JWT email does not match `granteeEmail` triggers `NOT_FOUND`.

**Divergence from draft:** the initial design considered a separate `X-Bearer` header as a
fallback, and mentioned a `prisma.user.findUnique` call. The actual implementation uses a single
comma-separated `Authorization` header and reads the email directly from the JWT payload (one fewer
DB lookup). The `X-Bearer` fallback was dropped as it added complexity for no benefit.

### assertCapability in FilesService

Add `assertCapability(principal, 'write')` as the **first** line of `uploadFile`, before
`scope.resolve`. A share token that cannot write is refused before any row or blob is touched.

### Error codes

`SIGN_IN_REQUIRED` and `TOO_MANY_FILES` are added to `ErrorCode` and each gets an `ApiException`
subclass so `throw new SignInRequiredException()` and `throw new TooManyFilesException()` are the
only call sites. `TOO_MANY_FILES` is already thrown in `FilesController` as a plain `400`; this
change wraps it in the correct exception class.

## Risks / Trade-offs

- **JWT dependency in the guard.** The guard now imports `jsonwebtoken` directly. Passport's
  `passport-jwt` already depends on it transitively, so it is not a new package — but it is a new
  import at the boundary layer. Kept in a private helper function (`decodeBearer`) so it is easy
  to swap.
- **Two DB lookups for RESTRICTED.** Share lookup (already exists) + user lookup (new). Both are
  primary-key reads; at this traffic level the overhead is immeasurable.

**FR/BR IDs the validation script proves at runtime:**
`BR-070` (SIGN_IN_REQUIRED, NOT_FOUND on wrong grantee, 403 READ_ONLY on mutating routes),
`FR-SHARE-020` (PUBLIC admitted without JWT).

**Cannot prove at runtime (manual checklist):**
None — all observable behavior is HTTP-level and the script can assert it.
