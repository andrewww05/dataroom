## Context

The `Share` table, the guard's share-token branch, `NodeScopeService.resolve`, `assertCapability`,
and the four existing `SharesService` methods (`createShare`, `revokeShare`, `resolveShare`,
`listReceived`) were written in earlier slices. The principal-refactor (slice 9) closed every
capability enforcement gap and verified the read-only enforcement end-to-end. What remains is the
surface the user and the link consumer actually see:

- **`GET /nodes/:id/shares`** is missing — the `NodeShares` response shape (`{ own, inheritedFrom }`)
  requires an ancestor walk to find the nearest shared parent.
- **`GET /shares/resolve`** is registered as `resolve/:token` (path param) but docs/03 specifies
  `resolve?token=` (query param) — a one-line fix.
- **`Referrer-Policy: no-referrer`** is not yet sent on the resolve route (docs/03 § Running it
  somewhere else, docs/05 § Risks).
- The entire web UI for sharing is missing: the dialog, the `/s/:token` route, the removed-by-owner
  screen, and Shared with me.

## Goals / Non-Goals

**Goals:**
- Add `GET /nodes/:id/shares` returning `NodeShares` (FR-SHARE-060).
- Fix `GET /shares/resolve` to use a `?token` query param (docs/03 API table).
- Add `Referrer-Policy: no-referrer` header on the resolve endpoint (docs/05 § Risks, BR-100).
- Implement `ShareDialog` with mode tabs, email field, expiry, existing shares list, Copy link,
  Revoke, and inherited-ancestor notice (FR-SHARE-010/020/040/060).
- Implement `/s/:token` route: resolve → three-pane read-only layout with `SharedViewShell` banner,
  breadcrumbs stopping at the shared root (FR-SHARE-070).
- Implement `ShareRemovedScreen` for revoked/expired/deleted share (FR-SHARE-050).
- Implement `SharedWithMeList` in the sidebar for RESTRICTED shares (FR-SHARE-080).
- Implement `SIGN_IN_REQUIRED` prompt for anonymous visitors on RESTRICTED links.
- Ship `scripts/validate/sharing.sh`.

**Non-Goals:**
- EDITOR role UI (BR-100 — the schema already has the column; the picker ships only when a second
  role exists).
- Slice 11 (README, demo seed), slice 12 (tests).

## Decisions

### `GET /nodes/:id/shares` — ancestor walk for `inheritedFrom`

**Decision:** reuse `NodeScopeService`'s existing ancestor walk to find the nearest ancestor with
a share. The endpoint calls `scope.resolve(principal, id)` (validates the node and scope), then
`prisma.share.findMany({ where: { nodeId: id } })` for own shares, then walks ancestors via
`prisma.$queryRaw` (the same `path` CTE already used by `/nodes/:id/path`) checking for any share
on each ancestor, stopping at the first hit. Returns `NodeShares = { own: Share[], inheritedFrom: Breadcrumb | null }`.

**Rejected:** computing `inheritedFrom` with a JOIN on the full ancestor chain in one query —
requires a lateral join or a recursive CTE that filters on the `Share` table; correct but harder
to read than the two-query approach, and the path CTE result is already in memory.

### `/shares/resolve` — query param fix

Change `@Get('resolve/:token')` → `@Get('resolve')`, change `@Param('token')` →
`@Query('token')`. Missing `token` param: `400 VALIDATION_FAILED` from the `ValidationPipe`
(add `IsString()`, `IsNotEmpty()` to a `ResolveShareQuery` DTO). Also add
`@Header('Referrer-Policy', 'no-referrer')` on this method.

### `/s/:token` route — reusing existing listing components

The web route `apps/web/src/routes/s.$token.tsx` calls `GET /shares/resolve?token=<token>` first,
stores `{ node, mode, role, rootNodeId, ownerEmail }`, then renders `SharedViewShell` wrapping the
same `ListingPanel` and `DetailsPanel`. The listing tree is rooted at `rootNodeId`; breadcrumbs
are produced by `GET /nodes/:id/path` which already stops at the shared root (the guard won't
walk above it for a share principal). The Authorization header sent by the web client is
`Authorization: Share <token>` (no Bearer for PUBLIC; Bearer + Share for RESTRICTED). A 404 from
resolve → `ShareRemovedScreen`.

**RESTRICTED anonymous visitor:** If resolve returns `401 SIGN_IN_REQUIRED`, render a
`SignInRequiredScreen` that says a link exists but names nothing behind it. Navigation to `/login`
carries `?next=/s/<token>` so the user returns after signing in.

### Share dialog — toolbar button wiring

The Share button in `ListingToolbar` is single-selection-only and opens `ShareDialog` with the
selected node's id. When nothing is selected, the Share button in the header (`AppHeader`) opens it
with `dataRoom.rootId` — that is the Data Room share path (FR-SHARE-010). The dialog labels the
node "this entire Data Room" when `nodeId === rootId`.

### `PUBLIC_BASE_URL` for link construction

Share links are `${PUBLIC_BASE_URL}/s/${token}`. `PUBLIC_BASE_URL` is already in the env contract
in docs/03 (`http://localhost:5173` local default). The API returns only the `token`; the web
client builds the full URL using the window's own origin (no env var needed on the web side in dev
since the `/s/` route is on the same origin; use `window.location.origin` rather than a hardcoded
value, BR-100).

### Revoke — confirmation modal

BR-030 requires destructive actions to confirm. Revoke opens a one-button confirm: "Revoke this
link? Anyone holding it loses access immediately." No stats fetch needed (a share has no subtree).

## Risks / Trade-offs

- **`inheritedFrom` walk cost.** The ancestor path is at most 32 segments (FR-FLDR-010 cap), each
  a primary-key read, so the worst case is 32 extra lookups. Negligible at this scale; acceptable.
- **Presigned URLs for share principals.** The existing download/preview handlers already work for
  any principal that passes the scope check — the share principal flows through unchanged.
- **`refetchOnWindowFocus` as the removed-share detector.** TanStack Query's default is `true`
  (state ownership in docs/04). A tab left open re-fetches on focus, which is when FR-SHARE-050
  fires. No push mechanism needed.

**FR/BR IDs the validation script proves at runtime:**
`FR-SHARE-010` (create PUBLIC + RESTRICTED), `FR-SHARE-020` (mode enforcement),
`FR-SHARE-030` (READ_ONLY on mutating routes via share token),
`FR-SHARE-040` (revoke kills the link), `FR-SHARE-050` (revoked resolve = 404),
`FR-SHARE-060` (list shares on node, inherited ancestor), `FR-SHARE-080` (received shares list),
`BR-010` (wrong-owner revoke = 404), `BR-070` (share principal write rejection),
`BR-100` (`Referrer-Policy` header on resolve).

**Cannot prove at runtime (manual checklist):**
- Share dialog renders correctly: mode tabs switch, email field appears for RESTRICTED, expiry
  optional, existing shares list shows, Copy link copies to clipboard, Revoke asks confirm.
- `/s/:token` shared view: breadcrumbs stop at shared root, no write affordances visible, banner
  shows "Shared by {email} · read only".
- Removed-by-owner screen appears instead of an error after a share is revoked and the page is
  focused.
- `SIGN_IN_REQUIRED` screen for a RESTRICTED link opened in an incognito window.
- Shared with me list in sidebar shows restricted shares granted to the logged-in user's email.
