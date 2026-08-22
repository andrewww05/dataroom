import type { FsNode, NodeStats, NodeType } from '@dataroom/shared';

/**
 * The columns an `FsNode` is made of, named once so the scope service and the listing query cannot
 * select different sets and hand the serialiser a row with a field missing. `storageKey` is
 * deliberately absent: the object key never leaves the server.
 */
export const FS_NODE_SELECT = {
  id: true,
  parentId: true,
  type: true,
  name: true,
  sizeBytes: true,
  mimeType: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** A row selected with `FS_NODE_SELECT`: `BigInt` and `Date` still in their database form. */
export interface FsNodeRow {
  id: string;
  parentId: string | null;
  type: NodeType;
  name: string;
  sizeBytes: bigint | null;
  mimeType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * What the stats CTE returns. `folders` and `files` are cast to `int` in the query so the driver
 * yields numbers; `bytes` stays `bigint`, and the driver may hand an `int8` back as a `bigint` or as
 * a string depending on how it maps the column, so both are accepted here rather than guessed at.
 */
export interface NodeStatsRow {
  folders: number;
  files: number;
  bytes: bigint | number | string;
}

/**
 * The one `BigInt` boundary in this slice (docs/03 § Shared contract).
 *
 * `JSON.stringify` throws on a `BigInt` and renders a `Date` in a shape nobody asked for, so both
 * are converted here — the single place a database row becomes a response — and no other file in
 * `src/nodes/` touches either type. A file of 100 MB, or of 4 GiB, is far inside 2^53.
 *
 * The file-only fields stay `null` on a folder rather than being dropped, so a client reads the same
 * keys for both kinds (FR-NAV-020).
 */
export function toFsNode(row: FsNodeRow): FsNode {
  return {
    id: row.id,
    parentId: row.parentId,
    type: row.type,
    name: row.name,
    sizeBytes: row.sizeBytes === null ? null : Number(row.sizeBytes),
    mimeType: row.mimeType,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The other half of that boundary: `sum("sizeBytes")` crosses it as a plain number. */
export function toNodeStats(row: NodeStatsRow): NodeStats {
  return {
    folders: Number(row.folders),
    files: Number(row.files),
    bytes: Number(row.bytes),
  };
}
