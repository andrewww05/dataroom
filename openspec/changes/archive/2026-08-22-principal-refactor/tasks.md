## 1. Error infrastructure

- [x] 1.1 Add `SIGN_IN_REQUIRED` and `TOO_MANY_FILES` to `ErrorCode` in
  `apps/api/src/http/api.exception.ts`, and add `SignInRequiredException` (HTTP 401) and
  `TooManyFilesException` (HTTP 400) as `ApiException` subclasses (BR-100).

## 2. Guard — RESTRICTED grantee check

- [x] 2.1 In `apps/api/src/auth/jwt-auth.guard.ts`, after resolving a valid `Share` row: if
  `share.mode === 'RESTRICTED'`, decode the optional `Authorization: Bearer` JWT inline using
  `jsonwebtoken.verify(token, jwtSecret)` in a `try/catch`. If no Bearer token is present or the
  JWT is invalid, throw `new SignInRequiredException()`. If a user is found but
  `user.email !== share.granteeEmail` (case-insensitive comparison), throw `new
  NotFoundException()`. If the emails match, set `request.user` to the `SharePrincipal` as before
  (BR-010, BR-070, FR-SHARE-020).

## 3. FilesService — assert write capability

- [x] 3.1 Add `assertCapability(principal, 'write')` as the first statement of
  `FilesService.uploadFile` in `apps/api/src/files/files.service.ts`, before `scope.resolve` and
  before any blob write (BR-070). A `SharePrincipal` with `role = VIEWER` is refused here; no row
  or blob is touched.

## 4. FilesController — wrap TOO_MANY_FILES

- [x] 4.1 In `apps/api/src/files/files.controller.ts`, replace the existing bare `400` thrown
  for a batch exceeding 20 files with `throw new TooManyFilesException()` (BR-100).
  Note: Multer/NestJS wraps the limit error as a `BadRequestException`; a local `@Catch(BadRequestException)`
  filter on the upload route intercepts it and re-throws `TooManyFilesException`.

## 5. Tests

- [x] 5.1 Extend `apps/api/src/auth/jwt-auth.guard.spec.ts` with RESTRICTED grantee scenarios:
  - anonymous caller → `401 SIGN_IN_REQUIRED`
  - signed-in wrong email → `404 NOT_FOUND`
  - signed-in matching email → admitted with `SharePrincipal`
  - PUBLIC share, no JWT → admitted (regression guard)
- [x] 5.2 Create `apps/api/src/auth/share-capability.spec.ts` using `createTestApp()` with a real
  Prisma client, asserting BR-070 across all mutating routes: `POST /api/files` (upload),
  `POST /api/nodes/folders` (create folder), `PATCH /api/nodes/:id` (rename), `POST
  /api/nodes/move` (move), `DELETE /api/nodes/:id` (delete) — each must return `403 READ_ONLY`
  when called with a VIEWER share token.

## 6. Validation script

- [x] 6.1 Write `scripts/validate/principal-refactor.sh` (executable, `set -euo pipefail`).
  The script MUST:
  - Sign up two accounts (owner and grantee), create a folder in the owner's room, and create
    both a `PUBLIC` share and a `RESTRICTED` share on that folder.
  - Assert `BR-070`: anonymous visitor on RESTRICTED → `401 SIGN_IN_REQUIRED`.
  - Assert `BR-070`: signed-in wrong-email user on RESTRICTED → `404 NOT_FOUND`.
  - Assert `FR-SHARE-020`: signed-in matching grantee on RESTRICTED → `200`.
  - Assert `FR-SHARE-010`: no JWT on PUBLIC → `200`.
  - Assert `BR-070`: VIEWER share token on `POST /api/nodes/folders` → `403 READ_ONLY`.
  - Assert `BR-070`: VIEWER share token on `POST /api/files` → `403 READ_ONLY`.
  - Delete all created accounts and data, so two consecutive runs both pass.
  - Print the manual checklist (none for this change — all behavior is HTTP-level).

## 7. Docs sync

- [x] 7.1 Updated `design.md` to record two implementation divergences from the draft:
  - JWT email read directly from payload claim (no `prisma.user.findUnique`).
  - Both tokens carried in one comma-separated `Authorization` header instead of a separate `X-Bearer` header.
