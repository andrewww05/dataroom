# sharing Specification

## Purpose

Shares grant read-only access to a node (and its whole subtree) to either anyone holding a link
(PUBLIC) or a specific signed-in grantee (RESTRICTED). This capability covers creating, listing,
and revoking shares via the API; the `/s/{token}` shared view; the share dialog; the
removed-by-owner screen; and Shared with me.

## Requirements

### Requirement: Owner can create a share on any node they own

The owner POSTs `{ nodeId, mode, granteeEmail?, expiresAt? }` to `POST /shares` (FR-SHARE-010).
The server generates a 32-byte token and persists the share with `role = VIEWER`. 
Sharing the root is the same code path.

- `RESTRICTED` mode MUST have a `granteeEmail`.
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

### Requirement: Resolving a share token MUST return the shared node and context

Resolving a share token MUST return the shared node and context. `GET /shares/resolve?token=<token>` is `@Public()` (FR-AUTH-030 exception). It returns
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

### Requirement: The shared view MUST enforce read-only access through the principal refactor's guard

The shared view MUST enforce read-only access through the principal refactor's guard. `GET /nodes/:id`, `/nodes/:id/children`, `/nodes/:id/path`, `/nodes/:id/stats`,
`GET /files/:id/download`, `GET /files/:id/preview` all work for a share principal scoped to the
shared subtree (FR-SHARE-070, BR-070). Every mutating route is `403 READ_ONLY`.

These scenarios are already covered by the principal-refactor spec. This change does not add new
API routes for the shared view — it reuses the existing listing and file routes behind the guard.

#### Scenario: FR-SHARE-070 shared view uses existing routes

- **WHEN** existing read routes are called with a share token
- **THEN** they behave as specified in the principal-refactor spec

### Requirement: Deleted or expired share MUST show a removal screen, not an error

A deleted or expired share MUST show a removal screen, not an error. When a share principal's token resolves to nothing (node deleted, share revoked, or share expired),
the web client shows "This folder was removed by its owner" (FR-SHARE-050). Detection is on the
next request; the listing refetches on window focus so an idle viewer sees it on return
(TanStack Query's `refetchOnWindowFocus`).

This is UI-only behavior. The API contract is `404 NOT_FOUND` from `GET /shares/resolve`.

#### Scenario: FR-SHARE-050 revoked share token resolves to 404

- **WHEN** `GET /api/shares/resolve?token=<revoked-token>` is called after the share has been deleted
- **THEN** the response is `404` with code `NOT_FOUND`

### Requirement: Signed-in users MUST see the restricted shares granted to their email

Signed-in users MUST see the restricted shares granted to their email. `GET /shares/received` returns `ReceivedShare[]` — restricted shares where `granteeEmail` matches
the authenticated user's email, ordered by `createdAt desc` (FR-SHARE-080). A share principal
returns an empty list, not an error. An owner with no incoming shares returns `[]`.

#### Scenario: FR-SHARE-080 signed-in user sees their received shares

- **WHEN** a signed-in user calls `GET /api/shares/received` and one RESTRICTED share exists for their email
- **THEN** the response is `200` with a `ReceivedShare[]` containing that share's `token`, `node`, `ownerEmail`, `role`, and `createdAt`

#### Scenario: FR-SHARE-080 user with no received shares gets empty array

- **WHEN** a signed-in user calls `GET /api/shares/received` and no RESTRICTED shares exist for their email
- **THEN** the response is `200` with `[]`

### Requirement: Share tokens do not leak through the Referer header on the shared view

The API MUST respond with `Referrer-Policy: no-referrer` on every request to the `/s/*`
endpoint family (docs/05-build-order.md § Risks, docs/03 § Running it somewhere else, BR-100).
The web client serves the `/s/:token` route; the API enforces the header on the resolve endpoint
used by that route.

#### Scenario: BR-100 Referrer-Policy header is present on the shared view resolve call

- **WHEN** any request hits `GET /api/shares/resolve`
- **THEN** the response includes `Referrer-Policy: no-referrer`

### Requirement: Opening a file in the shared view shows it, it does not download it

The shared view at `/s/{token}` SHALL open a file in the same full-screen viewer the owner's view
uses, with the same open gestures and the same render behaviour already recorded in the viewing
capability — PDF inline, images fitted, video and audio with native controls, plain text verbatim,
and the honest icon-plus-Download fallback for everything else (FR-SHARE-070, FR-VIEW-060). A share
on a **file** SHALL land in the viewer directly, because the shared node is the file and there is
nothing to browse. A share on a **folder** SHALL open the viewer on double-click of a file row, the
same gesture the owner uses.

Opening SHALL NOT start a download. A download SHALL happen only when the visitor activates the
Download control inside the viewer, and it SHALL save the file under the name it has in the Data
Room.

The bytes SHALL travel from the object store to the browser over a short-lived inline URL and SHALL
NOT be routed through the API (BR-050), exactly as for the owner. No control that writes — rename,
move, delete, upload, share — SHALL appear anywhere in the shared viewer (FR-SHARE-070, BR-070).

#### Scenario: FR-SHARE-070 a shared image opens in the viewer rather than as a download card

- **WHEN** a visitor opens a PUBLIC link to a shared PNG while signed in to nothing
- **THEN** the image is shown fitted to the viewport, and nothing is saved to the browser's downloads

#### Scenario: FR-SHARE-070 a shared PDF renders inline for an anonymous visitor

- **WHEN** a visitor holding a PUBLIC link to a shared PDF opens it
- **THEN** the document renders inline at full height, and the file's name is the viewer's title

#### Scenario: FR-SHARE-070 double-clicking a file inside a shared folder opens the viewer

- **WHEN** a visitor browsing a shared folder double-clicks a file row
- **THEN** the viewer opens over the shared listing on that file, and the listing does not navigate

#### Scenario: FR-SHARE-070 double-clicking a folder inside a shared folder is still navigation

- **WHEN** a visitor browsing a shared folder double-clicks a folder row
- **THEN** the shared listing navigates into that folder and no viewer opens

#### Scenario: FR-SHARE-070 the arrows step through the shared folder's files

- **WHEN** a visitor viewing a file in a shared folder holding several files presses `→`
- **THEN** the viewer shows the next file of that folder, skipping folders, and stops at the last
  file without wrapping and without a disabled control on display (BR-100)

#### Scenario: FR-SHARE-070 closing the shared viewer returns to the shared listing

- **WHEN** a visitor presses `Esc` or activates the close control in the shared viewer
- **THEN** the viewer closes and the shared listing is shown at the folder it was opened from,
  breadcrumbs still stopping at the shared root

#### Scenario: FR-SHARE-070 a file share has no close control, because there is nothing behind it

- **WHEN** the shared node is a file, so the viewer is the whole screen rather than an overlay over a
  listing
- **THEN** no close control and no stepping arrows are on display, since there is no listing to
  return to and no sibling file to step to — and no disabled control stands in their place (BR-100)

#### Scenario: FR-SHARE-070 Download inside the shared viewer still saves the file

- **WHEN** a visitor activates Download inside the shared viewer
- **THEN** the file is saved under the name it has in the Data Room and the viewer stays open on it

#### Scenario: FR-SHARE-070 an unrenderable type shows the honest fallback, not an empty frame

- **WHEN** a visitor opens a shared `.docx`, `.xlsx` or other type the browser cannot render
- **THEN** the viewer shows a type icon, the file's name and size, and a Download button — no empty
  frame and no spinner that never resolves

#### Scenario: FR-SHARE-070 no write affordance is reachable from the shared viewer

- **WHEN** a visitor has the shared viewer open on any file
- **THEN** the only actions on screen are Download, close and stepping between files — no rename,
  move, delete, upload or share control exists

### Requirement: A shared preview is authorized by the share token, never by a signed-in session

The inline URL the shared viewer renders SHALL be obtained by presenting the share token, so a
visitor who is signed in to nothing can view a PUBLIC share (FR-SHARE-020, BR-010, BR-070). A
`RESTRICTED` share SHALL additionally require the matching signed-in grantee, exactly as every other
read route in the shared subtree does. A preview request for a node outside the shared subtree SHALL
be refused with `404 NOT_FOUND`, never `403`, and no URL SHALL be handed out (BR-010).

#### Scenario: FR-SHARE-020 an anonymous visitor previews a PUBLIC shared file

- **WHEN** `GET /api/files/:id/preview` is called with `Authorization: Share <public-token>` and no
  signed-in session, for a file inside that share's subtree
- **THEN** the response is `200` carrying an inline URL and the moment it expires

#### Scenario: BR-010 a preview outside the shared subtree is refused

- **WHEN** `GET /api/files/:id/preview` is called with a share token for a file that sits outside
  that share's subtree, or in another Data Room
- **THEN** the response is `404` with code `NOT_FOUND`, never `403`, and no URL is handed out

#### Scenario: FR-SHARE-020 a RESTRICTED preview without the matching grantee is refused

- **WHEN** `GET /api/files/:id/preview` is called with a `RESTRICTED` share token and no signed-in
  session
- **THEN** the response is `401` with code `SIGN_IN_REQUIRED` and no URL is handed out

#### Scenario: FR-SHARE-050 a preview on a revoked or expired share is refused

- **WHEN** the owner revokes the share, or its expiry passes, and a preview is then requested with
  that token
- **THEN** the response is `401` with code `UNAUTHENTICATED`, so a viewer left open on the screen
  cannot keep signing fresh URLs after access ends

#### Scenario: BR-050 a shared preview that cannot be fetched fails visibly

- **WHEN** the URL the shared viewer was given is refused or unreachable
- **THEN** the viewer shows a message saying the file could not be loaded, with a way to retry and a
  Download button, and never a blank frame
