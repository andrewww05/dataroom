## Purpose

Shares grant read-only access to a node (and its whole subtree) to either anyone holding a link
(PUBLIC) or a specific signed-in grantee (RESTRICTED). This capability covers creating, listing,
and revoking shares via the API; the `/s/{token}` shared view; the share dialog; the
removed-by-owner screen; and Shared with me.

## ADDED Requirements

### Requirement: Owner can create a share on any node they own

The owner POSTs `{ nodeId, mode, granteeEmail?, expiresAt? }` to `POST /shares` (FR-SHARE-010).
The server generates 32 bytes of URL-safe randomness as the token, persists the share with
`role = VIEWER`, and returns the `Share` object. Sharing the Data Room root is the same code
path — no special case; the dialog labels it "this entire Data Room" on the client side.

- `RESTRICTED` mode MUST have a `granteeEmail`; omitting it is `400 VALIDATION_FAILED`.
- `granteeEmail` is stored lowercased.
- A share principal (BR-070) MUST be rejected with `403 READ_ONLY`.

#### Scenario: FR-SHARE-010 owner creates a PUBLIC share

- **WHEN** the owner POSTs `{ nodeId, mode: "PUBLIC" }` to `POST /api/shares`
- **THEN** the response is `201` with a `Share` object containing a 32-byte `token`, `mode: "PUBLIC"`, `role: "VIEWER"`, and `granteeEmail: null`

#### Scenario: FR-SHARE-010 owner creates a RESTRICTED share

- **WHEN** the owner POSTs `{ nodeId, mode: "RESTRICTED", granteeEmail: "alice@example.com" }` to `POST /api/shares`
- **THEN** the response is `201` with `granteeEmail: "alice@example.com"` and `mode: "RESTRICTED"`

#### Scenario: FR-SHARE-010 RESTRICTED share missing granteeEmail is rejected

- **WHEN** the owner POSTs `{ nodeId, mode: "RESTRICTED" }` without `granteeEmail`
- **THEN** the response is `400` with code `VALIDATION_FAILED`

#### Scenario: BR-070 share principal cannot create a share

- **WHEN** `POST /api/shares` is called with an `Authorization: Share <token>` header
- **THEN** the response is `403` with code `READ_ONLY`

---

### Requirement: Owner can list the shares on a node

`GET /nodes/:id/shares` returns `NodeShares` (FR-SHARE-060): `own` (the direct shares on this
node) and `inheritedFrom` (the nearest shared ancestor, or `null`). A share principal MUST be
rejected with `403 READ_ONLY`.

#### Scenario: FR-SHARE-060 listing shows own shares on a node

- **WHEN** the owner calls `GET /api/nodes/:id/shares` for a node that has two active shares
- **THEN** the response is `200` with `{ own: [Share, Share], inheritedFrom: null }`

#### Scenario: FR-SHARE-060 listing shows inherited ancestor when node has no direct shares

- **WHEN** the owner calls `GET /api/nodes/:id/shares` for a node whose parent is shared but the node itself is not
- **THEN** the response is `200` with `{ own: [], inheritedFrom: { id, name } }` naming the shared ancestor

#### Scenario: FR-SHARE-060 node with neither own nor inherited shares

- **WHEN** the owner calls `GET /api/nodes/:id/shares` for a node with no shares in its ancestry
- **THEN** the response is `200` with `{ own: [], inheritedFrom: null }`

---

### Requirement: Owner can revoke a share

`DELETE /shares/:id` deletes the share row (FR-SHARE-040). The link stops working on the next
request. Only the owner of the Data Room may revoke. A share principal MUST be rejected with
`403 READ_ONLY`.

#### Scenario: FR-SHARE-040 owner revokes a share

- **WHEN** the owner calls `DELETE /api/shares/:id` with a valid share id
- **THEN** the response is `204` and a subsequent `GET /api/shares/resolve?token=<token>` returns `404`

#### Scenario: FR-SHARE-040 wrong owner cannot revoke another owner's share

- **WHEN** a different authenticated owner calls `DELETE /api/shares/:id`
- **THEN** the response is `404` with code `NOT_FOUND` (BR-010)

#### Scenario: BR-070 share principal cannot revoke

- **WHEN** `DELETE /api/shares/:id` is called with an `Authorization: Share <token>` header
- **THEN** the response is `403` with code `READ_ONLY`

---

### Requirement: Resolving a share token returns the shared node and context

`GET /shares/resolve?token=<token>` is `@Public()` (FR-AUTH-030 exception). It returns
`{ node, mode, role, rootNodeId, ownerEmail }` for a valid, unexpired token, or `404 NOT_FOUND`
for a missing, expired, or deleted share. A RESTRICTED share's grantee check is NOT done here
— the check is enforced when the resolved principal calls other routes (it happens in the guard).

#### Scenario: FR-SHARE-010 resolving a valid PUBLIC token succeeds without authentication

- **WHEN** `GET /api/shares/resolve?token=<token>` is called without any `Authorization` header for a valid PUBLIC share
- **THEN** the response is `200` with `{ node, mode: "PUBLIC", role: "VIEWER", rootNodeId, ownerEmail }`

#### Scenario: FR-SHARE-010 resolving an expired token returns NOT_FOUND

- **WHEN** `GET /api/shares/resolve?token=<token>` is called for a share whose `expiresAt` is in the past
- **THEN** the response is `404` with code `NOT_FOUND`

#### Scenario: FR-SHARE-050 resolving a token whose node has been deleted returns NOT_FOUND

- **WHEN** `GET /api/shares/resolve?token=<token>` is called for a share whose `nodeId` no longer exists
- **THEN** the response is `404` with code `NOT_FOUND`

---

### Requirement: The shared view enforces read-only access through the principal refactor's guard

`GET /nodes/:id`, `/nodes/:id/children`, `/nodes/:id/path`, `/nodes/:id/stats`,
`GET /files/:id/download`, `GET /files/:id/preview` all work for a share principal scoped to the
shared subtree (FR-SHARE-070, BR-070). Every mutating route is `403 READ_ONLY`.

These scenarios are already covered by the principal-refactor spec. This change does not add new
API routes for the shared view — it reuses the existing listing and file routes behind the guard.

---

### Requirement: Deleted or expired share shows a removal screen, not an error

When a share principal's token resolves to nothing (node deleted, share revoked, or share expired),
the web client shows "This folder was removed by its owner" (FR-SHARE-050). Detection is on the
next request; the listing refetches on window focus so an idle viewer sees it on return
(TanStack Query's `refetchOnWindowFocus`).

This is UI-only behavior. The API contract is `404 NOT_FOUND` from `GET /shares/resolve`.

#### Scenario: FR-SHARE-050 revoked share token resolves to 404

- **WHEN** `GET /api/shares/resolve?token=<revoked-token>` is called after the share has been deleted
- **THEN** the response is `404` with code `NOT_FOUND`

---

### Requirement: Signed-in users see the restricted shares granted to their email

`GET /shares/received` returns `ReceivedShare[]` — restricted shares where `granteeEmail` matches
the authenticated user's email, ordered by `createdAt desc` (FR-SHARE-080). A share principal
returns an empty list, not an error. An owner with no incoming shares returns `[]`.

#### Scenario: FR-SHARE-080 signed-in user sees their received shares

- **WHEN** a signed-in user calls `GET /api/shares/received` and one RESTRICTED share exists for their email
- **THEN** the response is `200` with a `ReceivedShare[]` containing that share's `token`, `node`, `ownerEmail`, `role`, and `createdAt`

#### Scenario: FR-SHARE-080 user with no received shares gets empty array

- **WHEN** a signed-in user calls `GET /api/shares/received` and no RESTRICTED shares exist for their email
- **THEN** the response is `200` with `[]`

---

### Requirement: Share tokens do not leak through the Referer header on the shared view

The API MUST respond with `Referrer-Policy: no-referrer` on every request to the `/s/*`
endpoint family (docs/05-build-order.md § Risks, docs/03 § Running it somewhere else, BR-100).
The web client serves the `/s/:token` route; the API enforces the header on the resolve endpoint
used by that route.

#### Scenario: BR-100 Referrer-Policy header is present on the shared view resolve call

- **WHEN** any request hits `GET /api/shares/resolve`
- **THEN** the response includes `Referrer-Policy: no-referrer`
