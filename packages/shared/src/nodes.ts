/**
 * The node contract both sides import, so neither redeclares a field. See docs/03 § Shared contract
 * for the whole table and § API for the routes these shapes belong to.
 */

/**
 * Mirrors the Prisma enum, declared folders-first there so `ORDER BY type` groups folders ahead of
 * files without a query naming either value (FR-NAV-030).
 */
export type NodeType = 'FOLDER' | 'FILE';

/**
 * One shape covers both kinds, because one table does: a folder is a node with no blob, a file is a
 * node with one. The file-only fields are `null` on a folder rather than absent, so a client reads
 * the same keys either way.
 */
export interface FsNode {
  id: string;
  /** `null` on the Data Room's root node only — how a client recognises the top of the tree. */
  parentId: string | null;
  type: NodeType;
  name: string;
  /** `BigInt` serialised as a number; 100 MB is far inside 2^53. Files only. */
  sizeBytes: number | null;
  /** Sniffed server-side on upload (BR-040). Files only. */
  mimeType: string | null;
  /** ISO 8601. */
  createdAt: string;
  updatedAt: string;
}

/** One navigable step of `GET /nodes/:id/path`, head segment first (FR-NAV-020). */
export interface Breadcrumb {
  id: string;
  name: string;
}

/**
 * What is *inside* a node — its whole subtree at any depth, never counting the node itself, so the
 * figures read aloud as "this removes N folders and M files" (FR-ACCT-020, BR-030).
 */
export interface NodeStats {
  folders: number;
  files: number;
  bytes: number;
}

/**
 * One keyset page. `nextCursor` is `null` on the last page rather than an empty page following it,
 * and no page carries a total: a count over a folder cannot stop early on the listing index
 * (FR-NAV-030, docs/03 § Sorting and paging).
 */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/** A search result hit extending FsNode with its path. */
export interface SearchHit extends FsNode {
  path: Breadcrumb[];
}

/** The response envelope for search results. */
export interface SearchResult {
  items: SearchHit[];
}

export interface RoomUsage {
  bytes: number;
  files: number;
}

export interface CopyNodesRequest {
  ids: string[];
  targetId: string;
}
