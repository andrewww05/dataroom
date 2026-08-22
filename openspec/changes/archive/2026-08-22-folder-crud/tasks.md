## 1. API — name helper and nodes module

- [x] 1.1 Create `src/nodes/name.helper.ts` with `resolveUniqueName(tx, dataRoomId, parentId, name, excludeId?)`: trim → validate (empty / `.` / `..` / `/` / `\` / >255 chars → `INVALID_NAME`) → case-insensitive collision check → suffix loop → return resolved name; verify unit tests cover no-conflict, conflict-with-extension, conflict-without-extension, and case-insensitive match (BR-020 spec scenarios).

- [x] 1.2 Create `src/nodes/nodes.module.ts`, `src/nodes/nodes.service.ts`, and `src/nodes/nodes.controller.ts` with `POST /nodes/folders`, `PATCH /nodes/:id`, `DELETE /nodes/:id`; register the module in `app.module.ts`; verify `pnpm typecheck --filter @dataroom/api` passes.

- [x] 1.3 Add DTOs `src/nodes/dto/create-folder.dto.ts` (`parentId: string`, `name: string`) and `src/nodes/dto/rename-node.dto.ts` (`name: string`) with `class-validator` decorators; verify the global `ValidationPipe` rejects missing fields with `400 VALIDATION_FAILED`.

## 2. API — service logic and authorization

- [x] 2.1 Implement `createFolder`: resolve the parent node (BR-010 scope check via `dataRoomId`), call `resolveUniqueName` inside a `$transaction`, insert the `FOLDER` node, return `toFsNode(node)`; verify `POST /nodes/folders` with an unknown `parentId` returns `404 NOT_FOUND`.

- [x] 2.2 Implement `renameNode`: load node by id + dataRoomId (BR-010), assert `write` capability on the principal, call `resolveUniqueName` with `excludeId = node.id`, update name + `updatedAt`, return `toFsNode`; verify `PATCH /nodes/:id` on a foreign-room node returns `404 NOT_FOUND`.

- [x] 2.3 Implement `deleteNode`: load node (BR-010 scope check), assert `write` capability, call `prisma.node.delete({ where: { id } })` inside a transaction (cascade handles the subtree and `Share` rows), return `204`; verify `DELETE /nodes/:id` on a deleted node returns `404 NOT_FOUND`.

## 3. API — tests (BR-020, BR-030)

- [x] 3.1 Write `src/nodes/name.helper.spec.ts` covering: happy path no conflict, suffix ` (2)` / ` (3)` with and without extension, case-insensitive collision, empty-name rejection, forbidden-char rejection, >255-char rejection; verify `pnpm test --filter @dataroom/api` passes.

- [x] 3.2 Write `src/nodes/nodes.e2e-spec.ts` covering: create folder (201 + `FsNode`), rename (200 + suffixed name on conflict), delete (204 + subsequent GET returns 404), stats preflight (200 with real counts); verify `pnpm test:e2e --filter @dataroom/api` passes.

## 4. Web — dialogs and toolbar

- [x] 4.1 Add `NewFolderDialog` (shadcn `Dialog` + controlled `Input`), `RenameDialog`, `DeleteDialog` + `DeleteImpact` components in `apps/web/src/components/dialogs/`; `DeleteImpact` calls `GET /nodes/:id/stats` via TanStack Query key `['stats', id]` and disables the confirm button while loading (BR-030); on success all three mutations call `queryClient.invalidateQueries(['children', parentId])` and `['stats', ancestorId]`; a suffix toast fires when `response.name !== submitted name` (BR-020).

- [x] 4.2 Wire New-folder, Rename, Delete buttons into `ListingToolbar` (which receives `selectedNodes`) and the per-row action menu; implement `Folder` icons in the list; Delete visible when any selection exists (BR-100 — absent when inapplicable, never disabled); verify the toolbar renders correctly with Vitest + Testing Library and that the suffix toast scenario from BR-020 is covered.
