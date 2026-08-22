## 1. API — Fix resolve route and add Referrer-Policy

- [x] 1.1 In `SharesController`, change `@Get('resolve/:token')` → `@Get('resolve')` and the
  param decorator from `@Param('token')` → `@Query('token')` using a new `ResolveShareQuery` DTO
  (`IsString()`, `IsNotEmpty()`). Add `@Header('Referrer-Policy', 'no-referrer')` to that handler.
  Verify `GET /api/shares/resolve?token=<x>` works and the old path-segment URL 404s.

## 2. API — Add GET /nodes/:id/shares

- [x] 2.1 Add `listShares(principal, id): Promise<NodeShares>` to `SharesService`. For `own`:
  `prisma.share.findMany({ where: { nodeId: id } })`, serialised to `Share[]`. For
  `inheritedFrom`: walk the ancestor path (via the existing `NodeScopeService` path query or a
  recursive CTE) looking for the nearest ancestor node that has at least one share, returning
  `{ id, name }` of that node or `null`. Both owner and share principals can call this; a share
  principal is already scope-checked by the guard.
- [x] 2.2 Add `@Get(':id/shares')` to `NodesController`, returning `NodeShares`. Assert
  `assertCapability(principal, 'read')` and `scope.resolve(principal, id)` before the service call.

## 3. API — Shares service integration tests

- [x] 3.1 Add `shares.service.spec.ts` (or extend the existing e2e spec if one exists) covering:
  create PUBLIC share, create RESTRICTED share, create RESTRICTED without `granteeEmail` → 400,
  revoke own share, revoke wrong-owner share → 404, resolve valid token, resolve expired token →
  404, list received shares, `GET /nodes/:id/shares` own + inherited, `Referrer-Policy` header.
  These cover FR-SHARE-010/020/040/050/060/080, BR-010, BR-070, BR-100.

## 4. Web — API client and query hooks for sharing

- [x] 4.1 Add to `apps/web/src/api/`: `resolveShare(token)`, `listNodeShares(nodeId)`,
  `createShare(dto)`, `revokeShare(id)`, `listReceivedShares()`. Authorization header: for the
  `/s/:token` route the client sends `Authorization: Share <token>` (and `Authorization: Share
  <token>, Bearer <jwt>` for RESTRICTED when the user is signed in — the guard already handles
  comma-separated parsing from the principal-refactor).
- [x] 4.2 Add TanStack Query hooks: `useNodeShares(nodeId)` (key `['shares', nodeId]`),
  `useReceivedShares()` (key `['shares', 'received']`); mutations `useCreateShare` (invalidates
  `['shares', nodeId]`), `useRevokeShare` (same invalidation).

## 5. Web — ShareDialog component

- [x] 5.1 Implement `apps/web/src/components/sharing/ShareDialog.tsx` (docs/04 § Flows: Share):
  - Two-tab segmented control: "Anyone with the link" (PUBLIC) / "Only a specific person"
    (RESTRICTED — reveals an email field).
  - Optional expiry date input.
  - On submit: call `useCreateShare`, copy resulting link (`${window.location.origin}/s/${token}`)
    to clipboard, show toast with the link.
  - Below the form: `ShareList` — list of existing shares from `useNodeShares`, each with mode,
    grantee, expiry, Copy link, and Revoke (with a one-step confirm: "Revoke this link? Anyone
    holding it loses access immediately.").
  - `InheritedShareNotice`: if `inheritedFrom` is non-null, display "A link to [name] also exposes
    this item."
  - When `nodeId === dataRoom.rootId`, the dialog header says "Share this entire Data Room".
- [x] 5.2 Wire the dialog: Share button in `ListingToolbar` opens it with the selected node's id.
  Share button in `AppHeader` (no selection) opens it with `dataRoom.rootId`. Both are
  single-selection-only (header button always points at the room root).

## 6. Web — /s/:token route and shared view shell

- [x] 6.1 Create `apps/web/src/routes/s.$token.tsx`. On mount: call `resolveShare(token)`. If 401
  SIGN_IN_REQUIRED → render `SignInRequiredScreen` (says a link exists, nothing about what is
  behind it, with a "Sign in" button going to `/login?next=/s/<token>`). If 404 → render
  `ShareRemovedScreen` ("This folder was removed by its owner"). On success → render
  `SharedViewShell`.
- [x] 6.2 Implement `SharedViewShell`: the same three-pane layout as the authenticated view but:
  - Header strip: "Shared by {ownerEmail} · read only".
  - Tree rooted at `rootNodeId` (breadcrumbs and children calls use the share principal's scope —
    breadcrumbs already stop at the shared root because `GET /nodes/:id/path` can't walk above it
    for a share principal).
  - Toolbar: Download and view-toggle only. No New folder, Upload, Rename, Move, Delete, or Share
    buttons (BR-100 — absent, not disabled).
  - All API calls from this shell carry `Authorization: Share <token>` (and optionally Bearer
    if signed in — the guard handles it).
  - No context menu.

## 7. Web — Shared with me sidebar entry

- [x] 7.1 Implement `SharedWithMeList` in `apps/web/src/components/tree/SharedWithMeList.tsx`:
  fetches `useReceivedShares()`, renders only when the list is non-empty (hidden when empty, no
  placeholder — BR-100). Each entry shows item name and owner email; clicking opens `/s/<token>`.
  Place it below the folder tree in the sidebar (docs/04 layout diagram).

## 8. Validation script

- [x] 8.1 Write `scripts/validate/sharing.sh` (Bash, `set -euo pipefail`, executable). Asserts:
  - FR-SHARE-010: create PUBLIC share → 201 with token.
  - FR-SHARE-010: create RESTRICTED share with granteeEmail → 201.
  - FR-SHARE-010: RESTRICTED without granteeEmail → 400 VALIDATION_FAILED.
  - FR-SHARE-020: PUBLIC token resolves without auth → 200.
  - FR-SHARE-030: share principal on `POST /nodes/folders` → 403 READ_ONLY.
  - FR-SHARE-040: revoke share → 204; subsequent resolve → 404 NOT_FOUND.
  - FR-SHARE-050: resolve revoked token → 404.
  - FR-SHARE-060: `GET /nodes/:id/shares` with own shares → 200, both in `own`.
  - FR-SHARE-060: `GET /nodes/:id/shares` for a child of a shared node → `inheritedFrom` non-null.
  - FR-SHARE-080: `GET /shares/received` for grantee returns the share.
  - BR-010: revoke another owner's share → 404.
  - BR-070: `POST /api/shares` with share token → 403 READ_ONLY.
  - BR-100: `GET /api/shares/resolve?token=<x>` response includes `Referrer-Policy: no-referrer`.
  Cleans up all created accounts, shares, nodes at the end.
  Prints manual checklist for: ShareDialog UX, clipboard copy, `/s/:token` read-only layout,
  breadcrumb stopping at shared root, ShareRemovedScreen on revoke + window-focus, SIGN_IN_REQUIRED
  in incognito, Shared with me sidebar entry.

## 9. Docs update

- [x] 9.1 If the implementation diverges from design.md (e.g. the ancestor-walk strategy changes,
  or the Authorization header shape for `/s/:token` differs), update this file with the actual
  approach and the reason. If it did not diverge, drop this task.
