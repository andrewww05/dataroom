## Context

See proposal.md — Why.

The `Node` table currently has a covering index `(dataRoomId, parentId, type, name, id)` for
listing. Full-text or substring search needs a separate structure. `docs/03` already specifies the
approach: `pg_trgm` extension + GIN index on `Node.name`, queried with `ILIKE '%q%'`, scoped by
`dataRoomId`. The `SearchHit` type is already specified in `packages/shared` (currently exported as
a comment; it just needs activating). The `/search` endpoint row already exists in the API surface
table in `docs/03`.

## Goals / Non-Goals

**Goals:**

- Add `pg_trgm` and the GIN index in an isolated migration (no touch to existing schema)
- Implement `GET /search?q=` scoped to the owner's `dataRoomId`, returning up to 50 `SearchHit`s with paths
- Debounced `SearchInput` in the header, 300 ms, minimum 3 characters before querying
- `SearchResults` list replaces the listing pane while active; breadcrumb bar shows `Search: "q"` + Clear
- Selecting a hit navigates to its parent folder with that item selected (via URL state)
- Clearing returns to the prior folder (FR-SRCH-020)
- Validation script `scripts/validate/name-search.sh`

**Non-Goals:**

- Search inside a shared view (share principals use `/nodes/:id/children`; FR-SRCH-010 is
  owner-only — adding it to shares is a separate decision requiring scope design)
- Relevance ranking or full-text search (trigram similarity is enough for name substring at 100 k files)
- Pagination of search results (capped at 50; adding a cursor is a separate slice)
- Folder-scoped search (all results come from the whole room)

## Decisions

### D1 — Separate migration for the extension + index

**Choice:** A new migration file that only adds `CREATE EXTENSION IF NOT EXISTS pg_trgm` and
`CREATE INDEX "node_name_trgm" ON "Node" USING gin ("name" gin_trgm_ops)`.

**Why:** `docs/03` calls this out explicitly — "the trigram index arrives later, with the search
slice that needs it." Mixing DDL into the schema migration would force a re-run of the first
migration on any environment that already applied it. `IF NOT EXISTS` on the extension makes the
migration safely re-runnable in CI where the extension might already be present.

**Alternative considered:** Adding the index to the original schema migration. Rejected — it
requires altering an already-applied migration, which the guardrails forbid.

### D2 — `GET /search` is owner-only; returns `403 READ_ONLY` for share principals

**Choice:** The guard already exposes the principal kind. The search service reads
`principal.dataRoomId` (owner) and returns the hits scoped to that room. A share principal lacks
a room-level `dataRoomId` (it has a subtree root, not a room), and the brief does not ask for
share-scoped search. The controller asserts `write` capability — no, actually `read` — but the
handler additionally checks `principal.kind === 'owner'` and throws `READ_ONLY` otherwise, because
the spec says `403 READ_ONLY` for share tokens.

**Correction:** Handlers should ask the principal for a capability, not check `kind` (BR-070).
Because `VIEWER` only has `read`, a share token cannot be rejected by capability alone on a
read-only endpoint. Instead, the `SearchService` resolves the `dataRoomId` from the owner principal
and throws `READ_ONLY` (403) if the principal is not an owner. This is consistent with BR-070: the
handler still delegates to the service; it is the service that determines the principal has
insufficient scope for a room-wide operation.

### D3 — Minimum 3-character guard is client-side only

**Choice:** The server accepts any non-empty `q` and returns whatever the index gives; the 3-char
floor is enforced in the `useSearch` hook before a request is issued.

**Why:** The spec (FR-SRCH-010) says "the box waits for the third before querying". Server-side
enforcement would mean the search endpoint returns a special error for short strings, which is
unnecessary complexity and a worse UX (the box would flash an error on keystroke 1-2). Keeping it
client-side is simpler and honest about why: trigram performance, not a security boundary.

### D4 — `path` built from `GET /nodes/:id/path` per hit, or in the search query

**Choice:** Build the path inside the search SQL using a recursive CTE, identical in shape to
`GET /nodes/:id/path`, so a single query returns all hits with their paths. No N+1 round-trips.

**Why:** Calling `/nodes/:id/path` once per hit would fire up to 50 extra queries. The recursive
CTE is already written and tested in the nodes service; the search query duplicates its logic in
raw SQL. At 50 results this is one query.

**Alternative considered:** Accepting N+1 hits with lazy path loading in the UI. Rejected — a
search panel that loads paths one at a time is visibly slow.

### D5 — URL/router state holds the search term

**Choice:** The search term lives in a TanStack Router search param (`?q=<term>`) so that the
browser's Back button clears it and the URL is shareable. The "prior folder" (FR-SRCH-020) is the
current route without the `q` param — navigating to the same route without `q` restores it.

**Why:** `docs/04` states "TanStack Router — which folder is open … and the search term. The URL
is the state." Putting `q` in Zustand would break the Back button and make the route non-shareable.

## Risks / Trade-offs

- **`pg_trgm` must be installed in Postgres.** It ships with the standard `postgresql-contrib`
  package and is present in the `postgres:17` Docker image used locally. On managed Postgres
  (RDS, Supabase, etc.) it is a supported extension but requires `CREATE EXTENSION` permission.
  Mitigation: `IF NOT EXISTS` in the migration; the migration fails loudly if the extension is
  absent rather than silently degrading.

- **GIN index build time on a large table.** Building the index with `CREATE INDEX` locks the table.
  At the sizes this slice targets (tens of thousands of rows) it is milliseconds. For a migration
  on a live table with millions of rows, `CREATE INDEX CONCURRENTLY` is the safe form — but that
  cannot run inside a transaction, which Prisma's migrate wraps everything in. Mitigation: accept
  the lock for now; document the `CONCURRENTLY` path in `design.md` for when it matters.

- **Three-character floor is not a security boundary.** A determined client can send `q=ab` and get
  a (slow) scan. Mitigation: the server caps results at 50 and the endpoint is authenticated
  owner-only, so the exposure is the owner scanning their own room.

## Migration Plan

1. `pnpm --filter @dataroom/api db:migrate` — applies the new migration (extension + index) on top
   of the existing schema; safe to run while the API is down or up, because the migration only adds.
2. Deploy the new API code with `SearchModule` registered.
3. Deploy the new web code. `SearchInput` renders in the header; if `q` is absent, behaviour is
   unchanged for existing users.
4. Rollback: drop the index and remove the module. The `pg_trgm` extension can stay; it harms
   nothing. The endpoint simply disappears.
