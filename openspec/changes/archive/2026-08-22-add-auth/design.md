## Context

`apps/api` boots `ConfigModule.forRoot({ validate: validateEnv })` from `src/config/env.ts`, a global
`PrismaModule` (`PrismaService` on the `@prisma/adapter-pg` driver adapter), `StorageModule`,
`HealthModule` and the in-memory `DocumentsModule`. `main.ts` sets the global prefix `api` from
`API_PREFIX` and one `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`.
Rows exist for `User`, `DataRoom`, `Node` and `Share`; nothing writes one. See proposal.md — Why.

## Goals / Non-Goals

**Goals:** three endpoints, one global guard, one exception filter, one transaction, and the shared
types the responses are made of.

**Non-Goals (design-level):** no `PrincipalService` or capability map — the map has one entry until
slice 9, and writing it now guesses at the share half. No user repository either: two Prisma calls in
one service is not an abstraction worth having yet.

## Decisions

**Endpoints and shapes.** Under the `api` prefix:

```
POST /api/auth/signup  { email, password }  → 201 { token, user, dataRoom }
POST /api/auth/login   { email, password }  → 200 { token, user, dataRoom }
GET  /api/auth/me                          → 200 { id, email, dataRoom: { id, name, rootId } }
```

New in `packages/shared` (`src/auth.ts`, re-exported from `index.ts`), so neither side redeclares them:

```ts
export interface AuthUser {
  id: string;
  email: string;
}
export interface DataRoom {
  id: string;
  name: string;
  rootId: string;
}
export interface AuthResponse {
  token: string;
  user: AuthUser;
  dataRoom: DataRoom;
}
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
```

**One global guard, not twenty decorators.** `{ provide: APP_GUARD, useClass: JwtAuthGuard }` in
`AppModule`; `JwtAuthGuard extends AuthGuard('jwt')` and returns `true` when the handler or its
controller carries `@Public()` (`SetMetadata('isPublic', true)`). `@Public()` goes on
`POST /auth/signup`, `POST /auth/login`, `GET /health` and — with a comment naming slice 4 —
`GET /documents`. **Rejected:** per-controller `@UseGuards(JwtAuthGuard)`. It is deny-by-omission:
one unannotated controller is an open route, and the miss is invisible in review. That is the same
argument docs/05 makes for doing slice 9 as one guard rather than twenty handler edits.

**The strategy resolves a principal, never a user row.** `JwtStrategy` validates
`{ sub, email }` and returns `{ kind: 'owner', userId: sub }` onto `request.user`, so the guard costs
no query and slice 9 adds a `{ kind: 'share', ... }` branch in one file. Handlers read the principal
through a `@CurrentPrincipal()` param decorator, never the `Authorization` header. `/auth/me` is the
one place that loads the row, and answers `401 UNAUTHENTICATED` when it is gone.

**Passwords.** `argon2.hash` with the library's argon2id defaults; `argon2.verify` on sign-in. An
unknown email verifies against a fixed decoy hash before returning `401 INVALID_CREDENTIALS`, so a
missing account and a wrong password cost the same and neither response distinguishes them. `argon2`
builds natively, so it is added to `onlyBuiltDependencies` in `pnpm-workspace.yaml` alongside
`@nestjs/core`.

**Tokens.** `JwtModule.registerAsync` signing `{ sub, email }` with `JWT_SECRET` and
`expiresIn: JWT_EXPIRES_IN` (default `7d`). No refresh token, no denylist: a token is valid until it
expires, which is what FR-AUTH-020 buys and FR-AUTH-040's client-side sign-out accepts.

**The sign-up transaction.** One `prisma.$transaction`:

```ts
const SUFFIX = "'s Data Room";
const email = raw.email.trim().toLowerCase();
const local = email.slice(0, email.indexOf('@'));
// The local part gives way, never the suffix: truncating the whole string would leave a long
// address named `aaaa…aaa` with no "'s Data Room" on the end at all.
const name = local.slice(0, 255 - SUFFIX.length) + SUFFIX;
// 1. User { email, passwordHash }
// 2. DataRoom { ownerId: user.id, name }
// 3. Node { dataRoomId: room.id, parentId: null, type: 'FOLDER', name }
```

The root `Node` carries the room's name for want of anything better; nothing displays it — the
breadcrumb head reads `DataRoom.name` (slice 3), which is also why the rename endpoint can land later
without touching this row. `rootId` in the response is that node's id. A `P2002` on `User.email` —
including from two concurrent sign-ups — maps to `409 EMAIL_TAKEN` and the transaction leaves nothing.

**One filter, one envelope.** `{ provide: APP_FILTER, useClass: ApiExceptionFilter }` maps:

| Thrown                                                 | Code                  | HTTP |
| ------------------------------------------------------ | --------------------- | ---- |
| Guard rejection / expired, forged or absent token      | `UNAUTHENTICATED`     | 401  |
| Bad email or password                                  | `INVALID_CREDENTIALS` | 401  |
| `P2002` on `User.email`                                | `EMAIL_TAKEN`         | 409  |
| `ValidationPipe` rejection (`details` from its errors) | `VALIDATION_FAILED`   | 400  |
| Anything else                                          | `INTERNAL`            | 500  |

`ValidationPipe` gets an `exceptionFactory` that folds class-validator's errors into
`details: Record<string, string[]>`. `INTERNAL` is the one code docs/03's table lacks; the last task
adds it there. A 500 logs the cause with its stack and returns neither.

**Env.** `JWT_SECRET` joins `REQUIRED` in `src/config/env.ts` and `readEnv` gains
`jwt: { secret, expiresIn }`. `.env.example` ships `JWT_SECRET=dev-only-not-a-secret` and
`JWT_EXPIRES_IN=7d`, so `cp .env.example .env` still needs no editing while a deployment that forgets
the variable fails at boot with it named.

## Invariants touched

- **BR-010** — the 401 half: every request resolves to exactly one principal or is refused before a
  handler runs. The 404-rather-than-403 scope half arrives with the first scoped query (slice 3).
- **BR-050** — one envelope from one filter, so every later failure has a code to switch on and a
  message to toast; an unmapped error is a generic 500 with the detail in the log, not the body.
- **BR-060** — sign-up's three rows are one transaction: a partial account is not reachable.
- **BR-070** — the guard's output is a principal with a `kind`, and handlers ask it for the caller.
  Adding the share kind and the capability map is then one file, not a pass over every controller.
- **BR-100** — the secret and the lifetime are env vars with a local default and nothing is hardcoded;
  no sign-out control, role picker or rename affordance ships half-built.

## Risks / Trade-offs

- **`argon2`'s native build is blocked by pnpm's default** → add it to `onlyBuiltDependencies`;
  `@node-rs/argon2` is the prebuilt drop-in if a platform still fails.
- **A stolen token is good for 7 days** → the documented trade (FR-AUTH-020). A denylist needs a
  store and a check on every request; revocation today is deleting the user or rotating the secret.
- **`forbidNonWhitelisted` is already on** → an extra field such as `passwordConfirm` is a `400`, not
  an ignored key. Intended, and worth knowing before slice 4 writes the form.
- **The demo `/documents` route goes public** → visible in the diff, annotated with the slice that
  deletes it, and it reads a hardcoded array with no rows behind it.
- **`sub` is trusted without a lookup** → a token outlives its user until it expires. `/auth/me`
  catches the common case; every scoped query in slice 3 finds nothing anyway, which is BR-010's
  `404`.

## Migration Plan

No database migration and no schema change: `prisma migrate` is not run. Deployment adds `JWT_SECRET`
to the environment — a process without it refuses to start, which is the intended failure. Rollback is
reverting the commit; no row written by this change is unusable by the previous one.
