# search Specification

## Purpose

Substring name-search across the owner's Data Room: a trigram GIN index on `Node.name`, a
`GET /search` endpoint returning ranked hits with their breadcrumb paths, and a debounced UI box
that replaces the listing with results and navigates to the parent folder on selection.

## Requirements

### Requirement: FR-SRCH-010 — debounced substring search returning hits with paths

The search box in the app header filters the whole Data Room by case-insensitive substring on the
node name, debounced 300 ms. The query is only sent once the term reaches three characters
(trigram indexes need three characters to be selective — below that a leading-wildcard scan
degrades to a full-table scan). Results are capped at 50 rows, each carrying the `FsNode` fields
plus a `path: Breadcrumb[]` from the node to — but not including — the Data Room root. Clicking a
result navigates to the parent folder (`/f/:parentId`) with that item selected. While search is
active the breadcrumb bar reads `Search: "<q>"` with a Clear affordance.

#### Scenario: FR-SRCH-010 three-or-more characters triggers a query

- **WHEN** the owner types fewer than 3 characters in the search box
- **THEN** no request is sent to `GET /search` and the listing remains visible

#### Scenario: FR-SRCH-010 matching results returned with paths

- **WHEN** `GET /search?q=<term>` is called by an authenticated owner and nodes whose names contain
  `<term>` (case-insensitively) exist in their Data Room
- **THEN** the response is `200` with `{ items: SearchHit[] }` where each hit contains all `FsNode`
  fields plus `path: Breadcrumb[]` (segments from the Data Room root down to, but not including,
  the hit's parent), capped at 50 items

#### Scenario: FR-SRCH-010 empty result set

- **WHEN** `GET /search?q=<term>` finds no matches
- **THEN** the response is `200 { items: [] }` and the UI shows an empty-search illustration

#### Scenario: FR-SRCH-010 missing or empty query string rejected

- **WHEN** `GET /search` is called without `q`, or with `q` equal to an empty string
- **THEN** the response is `400 VALIDATION_FAILED` naming `q`

#### Scenario: FR-SRCH-010 scope enforced — owner sees only their own room

- **WHEN** two owners each have a node named "contract.pdf" and owner A searches for "contract"
- **THEN** owner A's results contain only their own node; owner B's node does not appear

#### Scenario: FR-SRCH-010 share principal cannot call /search

- **WHEN** `GET /search?q=<term>` is called with `Authorization: Share <token>`
- **THEN** the response is `403 READ_ONLY` (share principals have no `write` capability and search
  is owner-only — shares browse through the listing endpoints, not through global search)

### Requirement: FR-SRCH-020 — clearing search returns to the prior folder

Clearing the search box (pressing Esc, clicking Clear in the breadcrumb bar, or erasing the input)
discards the results list and returns to the folder that was open before the search began.

#### Scenario: FR-SRCH-020 clear restores the previous folder

- **WHEN** the user opened folder F, typed a search term, then cleared the box
- **THEN** the listing returns to folder F without a full page reload and without any additional
  server request beyond what TanStack Query already has cached
