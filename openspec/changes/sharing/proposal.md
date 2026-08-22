## Why

Slice 10 of docs/05-build-order.md. The principal refactor (slice 9) wired the guard and capability
map so that a `SharePrincipal` is already admitted and scoped correctly; now the product surface
that creates, lists, and revokes shares must ship alongside the public route at `/s/{token}` that
consumers land on. This is one of the three functional areas the brief requires — folder/file
management and auth are done; sharing is last.

**FR/BR IDs delivered:** FR-SHARE-010, FR-SHARE-020, FR-SHARE-030, FR-SHARE-040, FR-SHARE-050,
FR-SHARE-060, FR-SHARE-070, FR-SHARE-080, BR-010, BR-030, BR-070, BR-100.

## What Changes

**API** — several endpoints are already scaffolded but incomplete:
- `POST /shares` and `DELETE /shares/:id` exist; the `GET /nodes/:id/shares` endpoint returning
  `NodeShares` (own shares + inherited ancestor) needs to be completed.
- `GET /shares/resolve` is scaffolded; it currently uses `resolve/:token` path — aligns to `?token`
  query param per the spec table.
- `GET /shares/received` is scaffolded but needs to be verified correct.
- Add `Referrer-Policy: no-referrer` header on `/s/*` routes (via a NestJS middleware or
  per-controller `@Header`).

**Web** — net-new UI:
- Share dialog (`ShareDialog`): mode tabs, email field for restricted, expiry, existing shares
  list with Copy link / Revoke, and the inherited-ancestor notice.
- Shared view (`/s/:token` route): the same three-pane layout reused read-only with a
  `SharedViewShell` banner, breadcrumbs stopping at the shared root, no write affordances.
- Removed-by-owner screen (`ShareRemovedScreen`): a centred message when the shared node is gone.
- Shared with me (`SharedWithMeList`): sidebar entry listing restricted shares, each opening `/s/:token`.
- Sign-in prompt for `SIGN_IN_REQUIRED` on restricted links opened anonymously.

## Capabilities

### New Capabilities
- `sharing`: create, list, revoke shares; the share dialog; `/s/{token}` shared view; removed-by-owner screen; Shared with me

### Modified Capabilities
- `auth`: `/shares/resolve` route changes from path param to query param (`?token`) per the spec

## Impact

- `apps/api/src/shares/` — controller, service, DTOs; possibly add `NodeSharesDto`
- `apps/api/src/nodes/` — add `GET /nodes/:id/shares` route returning `NodeShares`
- `apps/web/src/routes/` — new `/s/$token.tsx` route
- `apps/web/src/components/sharing/` — all sharing components
- `packages/shared/` — no type changes needed; types already defined
- `apps/web/src/routes/_authenticated.tsx` — sidebar `SharedWithMeList` entry

## Non-goals

- Slice 9 (principal refactor) — complete and archived.
- Slice 11 (README, demo seed) — separate change.
- Slice 12 (tests) — separate change; this change ships its own validation script only.
- Versioning (slice 18) — extra credit.
- Polish features (multi-select, tiles, dark mode, copy/paste).
- EDITOR role — `Share.role` is already in the schema; the UI shows no picker (BR-100).
