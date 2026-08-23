## Why

Slice 13 from docs/05-build-order.md. A diligence room with thousands of files is unusable without
search — the brief lists it first among optional items for exactly that reason. All the infrastructure
(the `pg_trgm` extension note, the `SearchHit` type, and the `/search` endpoint row) is already
documented in `docs/03`; this slice builds it out and wires it to the UI.

## What Changes

- **New migration** — enables `pg_trgm` and creates a GIN index on `Node.name` using
  `gin_trgm_ops`, scoped by `dataRoomId` at query time. The extension and index are in their own
  migration, separate from the schema migrations, as noted in `docs/03`.
- **New endpoint** — `GET /search?q=<term>` returns up to 50 `SearchHit` objects (each an `FsNode`
  extended with a `path: Breadcrumb[]`). The query uses `ILIKE '%q%'` against the GIN index, scoped
  to the caller's `dataRoomId`. Three characters minimum before the database is hit (trigram indexes
  need three to be selective).
- **UI** — the `SearchInput` box in the header (already sketched in the layout in `docs/04`),
  debounced 300 ms, with a `SearchResults` list replacing the listing panel. Selecting a hit
  navigates to the parent folder with the item selected (FR-SRCH-010). Clearing the box returns to
  the folder that was open before the search (FR-SRCH-020). The breadcrumb bar shows `Search: "q"`
  with a Clear affordance while search is active.

## Capabilities

### New Capabilities

- `search`: substring name-search across the owner's Data Room — migration, endpoint, and UI

### Modified Capabilities

## Impact

- `apps/api/prisma/migrations/` — one new migration file
- `apps/api/src/` — new `SearchModule` / `SearchController` / `SearchService`; new `SearchQuery` DTO
- `packages/shared/src/index.ts` — `SearchHit` type (already specified, not yet exported)
- `apps/web/src/` — `SearchInput`, `SearchResults`, `SearchResultRow` components; `useSearch` hook; routing/navigation integration
- No existing routes, schemas or migrations are touched
