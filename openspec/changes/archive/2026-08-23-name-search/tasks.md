## 1. Database migration

- [x] 1.1 Create a new Prisma migration (`pnpm --filter @dataroom/api db:migrate`) that runs `CREATE EXTENSION IF NOT EXISTS pg_trgm` and `CREATE INDEX "node_name_trgm" ON "Node" USING gin ("name" gin_trgm_ops)`. Verify the migration applies cleanly on a fresh `db:reset` and that `\d "Node"` in psql shows the GIN index.
- [x] 1.2 Confirm the migration file lands in `apps/api/prisma/migrations/` with a timestamp prefix and is the _only_ change in that file (no schema DDL mixed in). Verify `pnpm typecheck` still passes.

## 2. Shared types

- [x] 2.1 Export `SearchHit` from `packages/shared/src/index.ts` (the type is already specified in `docs/03` as `SearchHit extends FsNode { path: Breadcrumb[] }`). Add `SearchResult` page wrapper if needed. Verify `pnpm build --filter @dataroom/shared` succeeds and the type is importable in the API and web.

## 3. API — SearchModule

- [ ] 3.1 Create `apps/api/src/search/search.module.ts`, `search.controller.ts`, `search.service.ts`, and `dto/search.query.ts`. Register `SearchModule` in `AppModule`. Verify the app still starts (`pnpm dev --filter @dataroom/api`).
- [ ] 3.2 Implement `SearchQuery` DTO with a required `q: string` decorated `@IsString()` and `@MinLength(1)` (global `ValidationPipe` applies `whitelist` + `forbidNonWhitelisted`). Verify that `GET /api/search` without `q` returns `400 VALIDATION_FAILED`.
- [ ] 3.3 Implement `SearchService.search(principal, q)` using `$queryRaw` with a single recursive CTE that (a) finds up to 50 `Node` rows in the principal's `dataRoomId` where `"name" ILIKE '%' || $1 || '%'`, (b) for each hit walks `parentId` up to the root and collects breadcrumbs. The service throws `READ_ONLY` (403) if `principal.kind !== 'owner'`. Verify that a search for an existing filename returns the hit with a non-empty `path` array.
- [ ] 3.4 Wire the controller: `@Get()` on `SearchController`, `@Public()` removed (route is protected by the global guard), `@CurrentPrincipal()` injected, delegates to `SearchService`. Response shape: `{ items: SearchHit[] }`. Verify `GET /api/search?q=<term>` returns `200` with the correct shape for an authenticated owner.
- [ ] 3.5 Write unit tests in `apps/api/src/search/search.service.spec.ts` covering: (a) valid owner query returns hits scoped to the correct room, (b) share principal receives `READ_ONLY`, (c) empty result set returns `{ items: [] }`. Verify `pnpm test --filter @dataroom/api` passes.

## 4. Web — search hook and routing

- [ ] 4.1 Add a `q` search param to the folder route in TanStack Router (`apps/web/src/routes/f.$folderId.tsx` or the root route index). When `q` is present the listing panel switches to search results; when absent it shows the folder listing. Verify that navigating to `/f/<id>?q=foo` renders a different panel from `/f/<id>`.
- [ ] 4.2 Implement `apps/web/src/hooks/useSearch.ts` wrapping `useQuery(['search', q])` from TanStack Query. The hook returns `{ data, isLoading, isError }` and skips the fetch when `q.length < 3` (FR-SRCH-010 3-char minimum). Verify with Vitest that the hook does not call the API for short queries.
- [x] 4.1 Add a `q` search param to the folder route in TanStack Router (`apps/web/src/routes/f.$folderId.tsx` or the root route index). When `q` is present the listing panel switches to search results; when absent it shows the folder listing. Verify that navigating to `/f/<id>?q=foo` renders a different panel from `/f/<id>`.
- [x] 4.2 Implement `apps/web/src/hooks/useSearch.ts` wrapping `useQuery(['search', q])` from TanStack Query. The hook returns `{ data, isLoading, isError }` and skips the fetch when `q.length < 3` (FR-SRCH-010 3-char minimum). Verify with Vitest that the hook does not call the API for short queries.
- [x] 4.3 Create `apps/web/src/components/search/SearchInput.tsx`: a controlled `<input>` in the `AppHeader` that writes `?q=` into the router's search params via `useNavigate` / `useSearch`, debounced 300 ms with a `useRef`-held timeout. The input holds the display value immediately; the router param updates after the debounce. Esc clears the input and removes `q` from the URL. Verify the 300 ms debounce does not fire on every keystroke.
- [x] 4.4 Create `apps/web/src/components/search/SearchResults.tsx` and `SearchResultRow.tsx`. `SearchResults` renders a list of `SearchHit`s — name, `NodeIcon`, path as breadcrumb chips — inside a scroll area replacing the `ListingPanel`. `SearchResultRow` on click navigates to `/f/<hit.parentId>?selected=<hit.id>` (or the room root if `parentId` is null) and clears `q`. Verify clicking a result takes the user to the correct folder.
- [x] 4.5 While `q` is set, render `Search: "<q>"` in place of the normal breadcrumbs (or prepend it as the first segment) with a Clear button that removes `?q` from the URL and returns to the current folder (FR-SRCH-020). Verify Clear lands back on the folder that was open, not the root.

## 5. Integration

- [x] 5.1 Render `SearchInput` in `AppHeader` (between the Data Room title and the share/sign-out controls, as shown in `docs/04` § Layout). Ensure it does not appear in the shared view (`SharedViewShell`) — search is owner-only (D2 in design.md). Verify the input is absent on `/s/<token>`.
- [x] 5.2 Run `pnpm typecheck && pnpm lint && pnpm test` from the repo root and fix any failures. Paste the output before marking complete.

## 6. Validation script

- [x] 6.1 Write `scripts/validate/name-search.sh` (Bash, `set -euo pipefail`, executable). The script: signs up a test user, creates a folder and uploads a file via the API, calls `GET /api/search?q=<3-char substring>` and asserts `200` + the hit appears with a non-empty `path` (FR-SRCH-010); calls `GET /api/search` without `q` and asserts `400 VALIDATION_FAILED` (FR-SRCH-010 validation); calls `GET /api/search?q=<term>` with `Authorization: Share <token>` and asserts `403 READ_ONLY` (FR-SRCH-010 scope); calls with fewer than 3 chars via the API and asserts `200 { items: [] }` or that the server still responds correctly even without the client-side guard. Cleans up the test account at the end. Prints the manual checklist for browser verification (debounce timing, clear-to-folder, keyboard `/` focus). Verify the script exits 0 against the running stack.
