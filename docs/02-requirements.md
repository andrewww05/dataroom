# 02 — Requirements

IDs are stable. `FR-<AREA>-<nnn>` is a thing the system does; `BR-<nnn>` is a rule that
constrains several of them. Field names, endpoints and error codes are defined in
[03-domain-and-api.md](./03-domain-and-api.md) and only cited here. Tiers (Core / Polish / Extra
credit) are defined in [01-scope.md](./01-scope.md#how-the-work-is-tiered); the sections below are
in tier order, so everything up to the Polish heading is required.

`FR-SRCH-030`, `FR-SRCH-040`, `FR-SRCH-050` and `BR-090` covered semantic search and are
**retired** — see [01 § Cut](./01-scope.md#cut). The numbers are not reused.

# Core

## Auth

| ID          | Requirement                                                                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-AUTH-010 | A visitor signs up with email and password. Email is unique, lowercased. Password is at least 8 characters, stored as an argon2 hash — never in plaintext, never in a log.                |
| FR-AUTH-020 | Sign-in returns a JWT valid for 7 days. The client sends it as `Authorization: Bearer`. No refresh token.                                                                                 |
| FR-AUTH-030 | Every route except `/auth/*`, `/shares/resolve` and `/health` requires a valid token; a missing or expired one gives `401`.                                                               |
| FR-AUTH-040 | Sign-out is client-side: drop the token and clear the query cache.                                                                                                                        |
| FR-AUTH-050 | Sign-up creates the user, their Data Room and that room's root folder in one transaction, so every user has exactly one room, every room exactly one root, and every other node a parent. |

## Data Room

| ID          | Requirement                                                                                                                                                                                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-ROOM-010 | A Data Room has a name, shown wherever the brief's "top-level folder or drive" would be — the breadcrumb head, the tree head, the share dialog. It defaults to `<email local part>'s Data Room` and is renamable in place. Nothing in the UI ever says "Root".                                                              |
| FR-ROOM-020 | The model allows a user several Data Rooms; the app creates and shows exactly one, and no UI creates a second. This is the seam the brief's scaling questions are asked across — every node, index and query is scoped by `dataRoomId`, not by `ownerId` — but an unbuilt room switcher is not shown as a disabled control. |
| FR-ROOM-030 | Opening a Data Room, folder or file that does not exist, or that the caller has no principal for, shows the same "not found" screen (BR-010).                                                                                                                                                                               |

## Navigation

| ID         | Requirement                                                                                                                                                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-NAV-010 | The sidebar shows the folder tree, rooted at the Data Room. Children load when a node is expanded, not before. Expanded state survives navigation within the session. The same component is the folder picker in FR-FLDR-040 and FR-FILE-050, which is why it is Core rather than Polish. |
| FR-NAV-020 | Breadcrumbs show the path from the Data Room to the open folder, each segment a link. The open folder is the URL (`/f/$folderId`; `/` redirects to the room's `rootId` from `GET /auth/me`), so back, forward, reload and a pasted link all land in the same place.                       |
| FR-NAV-030 | A listing is fetched one page at a time (default 100 rows) with a cursor, and the next page loads as the user scrolls. Sort is folders-first, then name ascending — the same order the cursor walks.                                                                                      |
| FR-NAV-040 | A listing has an explicit empty state (New folder + Upload), a skeleton loading state that does not shift layout, and an inline error state with Retry (BR-050).                                                                                                                          |

## Folders

| ID          | Requirement                                                                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-FLDR-010 | Create a folder inside the open folder, or inside any folder picked in the tree. Nesting is unlimited in the model; the UI caps new paths at 32 levels to keep breadcrumbs sane.                                                                                      |
| FR-FLDR-020 | Rename a folder in place. BR-020 applies.                                                                                                                                                                                                                             |
| FR-FLDR-030 | Delete a folder. Before deleting, the app asks the server how much is inside and shows it: "Delete **Q3 Diligence**? This removes 4 folders and 37 files (112 MB). This cannot be undone." Confirm deletes the whole subtree and the blobs under it.                  |
| FR-FLDR-040 | Move a folder into another folder, from the same "Move to…" picker as FR-FILE-050. Moving a folder into itself or into one of its own descendants is rejected (`INVALID_MOVE`) and the picker disables those rows rather than letting the user find out from a toast. |

## Files

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-FILE-010 | Upload one or many files at once, by button or by dropping them on the listing or on a tree folder. Each file gets its own progress row with a percentage and a cancel button. One failure does not abort the others.                                                                                                                                                                      |
| FR-FILE-020 | Download a file — the browser navigates to a short-lived presigned URL, so bytes never round-trip through the API.                                                                                                                                                                                                                                                                         |
| FR-FILE-030 | Rename a file. The extension is preserved unless the user deliberately changes it. BR-020 applies.                                                                                                                                                                                                                                                                                         |
| FR-FILE-040 | Delete a file, after a confirm, together with its blob.                                                                                                                                                                                                                                                                                                                                    |
| FR-FILE-050 | Move files and folders to another folder through a "Move to…" dialog: the FR-NAV-010 tree as a picker, with the current parent and every invalid target disabled, and a Move button that reports where things landed. Dragging an item onto a folder does the same thing; the dialog exists because drag is not discoverable and does not work from the keyboard. BR-020 applies per item. |

## Viewing

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-VIEW-020 | Selecting exactly one item opens the details pane: name, kind, size, created, modified, the active shares (FR-SHARE-060), and for a folder its recursive stats (FR-ACCT-020). Files show a small preview that opens the viewer on click; other types show a type icon.                                                                                                                                                                                                                                                                         |
| FR-ACCT-020 | The details pane for a folder shows its recursive size and item count, computed on the server with one recursive query. The BR-030 delete dialog reads the same endpoint, which is why this is Core rather than Polish.                                                                                                                                                                                                                                                                                                                        |
| FR-VIEW-060 | **View a file in the UI.** Double-click, Enter or clicking the preview opens a full-screen viewer over the listing: PDFs rendered at full width in an `<iframe>` on the presigned inline URL, images fitted to the viewport, anything else an icon plus a Download button. The viewer has the file name, a Download action, a close button, `Esc` to close, and `←` / `→` to step through the other files in the same folder without going back to the listing. Downloading is a button inside the viewer, never the result of opening a file. |

## Sharing

| ID           | Requirement                                                                                                                                                                                                                                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-SHARE-010 | The owner shares the Data Room, any folder, or any single file as a link `/s/{token}`, where the token is 32 bytes of URL-safe randomness. A share may carry an expiry; without one it lasts until revoked. Sharing the Data Room is a share on its root node — the same row, the same code path, and the dialog says "this Data Room" rather than the folder name.        |
| FR-SHARE-020 | Two modes, per the brief. **Public** — anyone holding the link. **Restricted** — the link only opens for a signed-in user whose email matches the share's `granteeEmail`. Several people means several rows, so revoking one does not touch the others.                                                                                                                    |
| FR-SHARE-030 | A share grants read only, and the server enforces it: a request authenticated by a share token is rejected on every mutating route, not merely denied a button (BR-070).                                                                                                                                                                                                   |
| FR-SHARE-040 | The owner revokes a share by deleting it. The link stops working on the next request — there is no grace window and no cached token to outlive it.                                                                                                                                                                                                                         |
| FR-SHARE-050 | If the shared node is deleted or moved out from under a viewer, their next request returns `404` and the viewer sees "This folder was removed by its owner" instead of an error. Detection is on the next request; nothing is pushed. The listing refetches on window focus, so a viewer who leaves the tab open and comes back sees the message rather than a stale tree. |
| FR-SHARE-060 | The details pane lists the active shares on the selected node — mode, grantee, created, expiry — each with a Copy link and a Revoke action. A node inside a shared subtree says so, and names the shared ancestor, so the owner is never surprised by inherited access.                                                                                                    |
| FR-SHARE-070 | A share on a folder or Data Room exposes that node's whole subtree, browsable with the same listing, breadcrumbs and viewer as the owner's view, minus every write affordance. Breadcrumbs stop at the shared root; nothing above it is nameable.                                                                                                                          |
| FR-SHARE-080 | A signed-in user sees the restricted shares granted to their email in a "Shared with me" list — item name, owner, mode, granted at — each opening the shared view. Without it a grantee who loses the email has no route back in, and the owner has no way to hand over access other than pasting a URL.                                                                   |

## Delivery

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-OPS-010 | The app runs end to end from a clean clone with no cloud account: `docker compose up -d` for Postgres and the blob store, `pnpm install`, one migration command, `pnpm dev`. Nothing in the code names a host or a vendor — every environment-dependent value is an env var with a local default ([03 § Configuration](./03-domain-and-api.md#configuration)), so putting it on a server is configuration, not a code change.                                                                |
| FR-OPS-020 | The root README carries: the design decisions and their trade-offs, setup instructions that work from a clean clone, the ERD, the three "How it scales" answers ([03 § How it scales](./03-domain-and-api.md#how-it-scales)), a note on where and how AI was used, and what any host has to provide to run it ([03 § Running it somewhere else](./03-domain-and-api.md#running-it-somewhere-else)). It replaces the current boilerplate README, including its `/api/documents` demo section. |
| FR-OPS-030 | A seeded demo account (credentials in the README) opens onto a populated Data Room — a few nested folders, a handful of PDFs, one active public share — so the app can be assessed without signing up and uploading first. The seed is idempotent and refuses to touch a database where that email already exists with different data.                                                                                                                                                       |

# Polish

Built only after Core is green and demonstrable end to end.

| ID          | Requirement                                                                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-VIEW-010 | List and tiles views, toggled from the toolbar, remembered in `localStorage`. List shows name, size, type, modified; tiles show an icon, name and size. Core ships the list; tiles are the Polish half.                                                               |
| FR-VIEW-030 | Every action reachable from the toolbar is also on the right-click context menu, and the menu only offers what the current selection allows.                                                                                                                          |
| FR-VIEW-040 | Keyboard: arrows move, Enter opens, Backspace goes up, F2 renames, Delete deletes, Ctrl+A selects all, Ctrl+X/C/V cut/copy/paste, Esc clears or closes, `/` focuses search.                                                                                           |
| FR-VIEW-050 | Light and dark themes, following the OS by default, overridable from the header, remembered. One CSS variable set drives Tailwind and every shadcn component.                                                                                                         |
| FR-VIEW-070 | No surface renders blank while it loads — the shell, the media frame, and `/s/{token}` show placeholders that resolve with no layout shift.                                                                                                                           |
| FR-FILE-060 | Copy / paste duplicates the selection into the target. A copied folder copies its whole subtree. Blobs are copied server-side (S3 `CopyObject`), never downloaded and re-uploaded. If this ships partially it does not ship at all — no disabled menu entry (BR-100). |
| FR-FILE-070 | Multi-select with click, Ctrl+click, Shift+click and Ctrl+A. Delete, move and download act on the whole selection.                                                                                                                                                    |
| FR-ACCT-010 | The sidebar footer shows total bytes stored and total file count for the Data Room.                                                                                                                                                                                   |

# Extra credit

The brief's optional list. Search first — it is half an hour and a diligence room with 100,000
files is unusable without it.

## Search

| ID          | Requirement                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-SRCH-010 | The search box filters the whole Data Room by case-insensitive substring on name, debounced 300 ms, capped at 50 results. Each result shows its parent path and clicking it opens that folder with the item selected. |
| FR-SRCH-020 | Clearing the box returns to the folder that was open before the search.                                                                                                                                               |

## Versioning

| ID         | Requirement                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-VER-010 | Uploading a file whose name already exists in the target folder offers two choices: **Keep both**, which is BR-020's rename and stays the default, or **Save as a new version** of the existing file. |
| FR-VER-020 | The details pane for a file lists its versions newest first — number, size, uploaded at — and any version can be downloaded.                                                                          |
| FR-VER-030 | Restoring an old version copies it forward as a new newest version. Nothing is rewritten and nothing is lost (BR-080).                                                                                |
| FR-VER-040 | Deleting a file deletes every version and every blob behind it. All versions count toward the storage total in FR-ACCT-010, and the pane says so — a 10 MB file with four versions is 40 MB.          |

---

## Business rules

**BR-010 — Access is a principal plus a scope, and a miss is always `404`.** Every request resolves
to exactly one principal: the **owner** of a Data Room (JWT), or a **share** on one node (token,
BR-070). Owner queries filter on `dataRoomId` after one check that the room belongs to the caller;
share queries filter on `dataRoomId` and are additionally confined to the shared subtree. A node the
principal has no claim on is indistinguishable from a node that does not exist: both return
`404 NOT_FOUND`, never `403`. The one deliberate exception is `SIGN_IN_REQUIRED`, argued in
[03 § Errors](./03-domain-and-api.md#errors).

**BR-020 — Name conflicts resolve by suffixing.** Names are unique per `(dataRoomId, parentId)`,
enforced by a database constraint, and compared case-insensitively. When create, rename, move or
copy would collide, the server appends ` (2)`, then ` (3)`, and so on, before the extension:
`report.pdf` → `report (2).pdf`. The response carries the name that was actually used, and the
UI says so ("Saved as report (2).pdf"). Names are trimmed, may not be empty, `.` or `..`, may
not contain `/` or `\`, and are capped at 255 characters.

**BR-030 — Destructive actions are confirmed, and the confirm states the blast radius.** Any
delete asks first. For a folder, the dialog names the folder and gives the recursive folder
count, file count and byte total from `GET /nodes/:id/stats` — it never says "and its
contents" without the numbers. Deleting a node with active shares says how many links it will
break. Deletion is permanent: there is no trash.

**BR-040 — Uploads are validated on the server.** 100 MB per file, 20 files per batch. MIME
type is taken from the sniffed content, not the client's claim, and must be in the allow list:
PDF, plain text, CSV, Markdown, PNG, JPEG, GIF, WebP, and the Office and OpenDocument formats.
Anything else is `415 UNSUPPORTED_TYPE`; anything larger is `413 FILE_TOO_LARGE`. The blob is
only written after validation passes. SVG is deliberately **not** on the list: it is a script
container, and the brief only needs PDFs — accepting it to render it inline is a stored-XSS
trade nobody asked for.

**BR-050 — Failures are visible and uploads retry.** Every mutation surfaces its error in a
toast carrying the server's message. Uploads retry twice with backoff on a network error or a
5xx; a 4xx never retries. Reads are retried once by TanStack Query and otherwise show an inline
retry button. A cancelled or failed upload leaves no `Node` row and no orphan blob.

**BR-060 — Writes are transactional.** A node row and its blob are consistent or neither
exists: the blob is written first, the row second, and a failed row write deletes the blob.
Subtree operations (delete, copy, move) run in one Prisma transaction.

**BR-070 — A share is a read-only principal scoped to one subtree, and the check is on a
capability, not on the token.** The guard resolves either an owner (JWT) or a share (token) and puts
the principal on the request; every handler asks the principal what it may do. A share principal
carries `role = VIEWER`, whose capability set is `read`, so any mutating verb is `403 READ_ONLY`, and
any node outside the shared subtree is `404` — including the shared node's own ancestors, so the
surrounding tree cannot be probed by walking `parentId` upward. A share whose node has been deleted,
or whose `expiresAt` has passed, resolves to nothing and behaves exactly like a token that was never
issued. `Share.role` exists in the first migration and only ever holds `VIEWER` today; `EDITOR`
becomes a second capability set in this one guard, which is the whole of the brief's
viewer/editor question — no schema change, no new tables, no re-modelled sharing. The UI shows no
role picker until there is a second role to pick.

**BR-080 — Versions are append-only.** _(Extra credit.)_ A new version increments `version` within
the file and becomes `currentVersionId`; existing rows and blobs are never mutated or reordered.
Restore appends rather than rewinds, so the history after restoring v1 over v3 reads v1, v2, v3, v4 —
where v4 is v1's bytes. The cap is 20 versions per file; past that the oldest is dropped, blob
and all, and the pane says which. `sizeBytes` on the node tracks the current version, while
FR-ACCT-010's total sums every version.

**BR-100 — Nothing ships disabled, and nothing is wired to one machine.** A slice is finished when
it works end to end in the running app, not when the code merely compiles. Two consequences worth
stating. First, a feature that cannot be finished is **removed** from the UI rather than shipped
greyed out — the brief asks for no unimplemented features, and a disabled menu entry is one.
Second, no host, port, origin or bucket name is hardcoded: every one of them is an env var with a
local default, so the same build runs on a laptop and on a server without an edit. Where the app is
eventually hosted is deliberately not this plan's decision — see
[03 § Running it somewhere else](./03-domain-and-api.md#running-it-somewhere-else).
