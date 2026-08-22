import type { Breadcrumb, FsNode, NodeShares, NodeStats, NodeType, Page, Share } from '@dataroom/shared';
import { Injectable, Logger } from '@nestjs/common';

import { assertCapability, type Principal } from '../auth/principal';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { decodeCursor, encodeCursor } from './cursor';
import type { ListChildrenQuery } from './dto/list-children.query';
import { NodeScopeService } from './node-scope.service';
import { toFsNode, toNodeStats, type FsNodeRow, type NodeStatsRow } from './node.serializer';
import { CreateFolderDto } from './dto/create-folder.dto';
import { RenameNodeDto } from './dto/rename-node.dto';
import { MoveNodesDto } from './dto/move-nodes.dto';
import { resolveUniqueName } from './name.helper';
import { StorageService } from '../storage/storage.service';
import { InvalidMoveException } from '../http/api.exception';

/** One row of the `/path` walk. `depth` counts up towards the root; the root has the highest. */
interface AncestorRow {
  id: string;
  parentId: string | null;
  name: string;
  depth: number;
}

/**
 * One page of children, as the row-value comparison Postgres can start an index scan on.
 *
 * Prisma's own `where` cannot express this. Its enum filter has no `gt`, so the tuple becomes an
 * `OR` of three branches, and Postgres then plans that as a `Filter` *inside* the scan rather than
 * as its start condition: measured over a 20,000-row folder, page 190 discarded 19,001 index entries
 * before returning a row and cost 3.0ms against 0.03ms here. FR-NAV-030 says a page may not cost
 * more for being deep in the folder, so this one method is raw SQL and the rest of the slice is not.
 *
 * `("type","name","id") > (…)` lands in `Index Cond` on
 * `Node_dataRoomId_parentId_type_name_id_idx`, which is the index's own column order, so the scan
 * starts exactly at the cursor and stops at `LIMIT`. `ORDER BY` names the columns qualified — an
 * unqualified `"type"` would bind to an output column, and a text ordering would put files first.
 *
 * The limit asks for one row more than the caller wanted: that row is how the next cursor is known
 * without a `count(*)`, the one query in this path that could not stop early.
 *
 * Identifiers are quoted camelCase because the schema carries no `@map`; every value is a bound
 * parameter. Exported so the plan test explains the query the service issues rather than a copy.
 */
export function childrenPageQuery(
  dataRoomId: string,
  parentId: string,
  page: { limit: number; type?: NodeType; after?: { t: NodeType; n: string; i: string } },
): Prisma.Sql {
  return Prisma.sql`
    SELECT n."id", n."parentId", n."type", n."name", n."sizeBytes", n."mimeType",
           n."createdAt", n."updatedAt"
      FROM "Node" n
     WHERE n."dataRoomId" = ${dataRoomId}
       AND n."parentId" = ${parentId}
       ${page.type ? Prisma.sql`AND n."type" = ${page.type}::"NodeType"` : Prisma.empty}
       ${
         page.after
           ? Prisma.sql`AND (n."type", n."name", n."id") >
                            (${page.after.t}::"NodeType", ${page.after.n}, ${page.after.i})`
           : Prisma.empty
       }
     ORDER BY n."type", n."name", n."id"
     LIMIT ${page.limit + 1}`;
}

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: NodeScopeService,
    private readonly storage: StorageService,
  ) {}

  /** Nothing more than the scope check itself: it already returns the row (BR-010). */
  async findOne(principal: Principal, id: string): Promise<FsNode> {
    return toFsNode(await this.scope.resolve(principal, id));
  }

  async createFolder(principal: Principal, dto: CreateFolderDto): Promise<FsNode> {
    assertCapability(principal, 'write');
    const parent = await this.scope.resolve(principal, dto.parentId);

    const node = await this.prisma.$transaction(async (tx) => {
      const resolvedName = await resolveUniqueName(tx, parent.dataRoomId, parent.id, dto.name);
      return tx.node.create({
        data: {
          dataRoomId: parent.dataRoomId,
          parentId: parent.id,
          type: 'FOLDER',
          name: resolvedName,
        },
      });
    });

    return toFsNode({
      ...node,
      sizeBytes: null,
      mimeType: null,
    });
  }

  async renameNode(principal: Principal, id: string, dto: RenameNodeDto): Promise<FsNode> {
    assertCapability(principal, 'write');
    const existing = await this.scope.resolve(principal, id);

    const node = await this.prisma.$transaction(async (tx) => {
      const resolvedName = await resolveUniqueName(
        tx,
        existing.dataRoomId,
        existing.parentId,
        dto.name,
        existing.id,
      );
      return tx.node.update({
        where: { id: existing.id },
        data: { name: resolvedName },
      });
    });

    return toFsNode({
      ...existing,
      name: node.name,
      updatedAt: node.updatedAt,
    });
  }

  async moveNodes(principal: Principal, dto: MoveNodesDto): Promise<FsNode[]> {
    assertCapability(principal, 'write');
    const target = await this.scope.resolve(principal, dto.targetId);
    if (target.type !== 'FOLDER') {
      throw new InvalidMoveException();
    }

    // Verify all nodes exist and are in the same scope
    const existingNodes = await Promise.all(
      dto.ids.map((id) => this.scope.resolve(principal, id)),
    );

    // Cycle check: target path cannot contain any of the moving nodes
    const targetPath = await this.path(principal, target.id);
    const targetPathIds = new Set(targetPath.map((p) => p.id));
    for (const id of dto.ids) {
      if (targetPathIds.has(id)) {
        throw new InvalidMoveException();
      }
    }

    const movedNodes: FsNodeRow[] = [];
    
    await this.prisma.$transaction(async (tx) => {
      for (const existing of existingNodes) {
        const resolvedName = await resolveUniqueName(
          tx,
          target.dataRoomId,
          target.id,
          existing.name,
          existing.parentId === target.id ? existing.id : undefined,
        );
        
        const updated = await tx.node.update({
          where: { id: existing.id },
          data: { parentId: target.id, name: resolvedName },
        });
        
        movedNodes.push(updated);
      }
    });

    return movedNodes.map(n => toFsNode({
      ...n,
      sizeBytes: n.sizeBytes,
      mimeType: n.mimeType,
    } as FsNodeRow));
  }

  async deleteNode(principal: Principal, id: string): Promise<void> {
    assertCapability(principal, 'write');
    const existing = await this.scope.resolve(principal, id);

    const keys = await this.prisma.$queryRaw<{ storageKey: string }[]>`
      WITH RECURSIVE subtree AS (
        SELECT "id", "storageKey"
          FROM "Node" WHERE "id" = ${existing.id} AND "dataRoomId" = ${existing.dataRoomId}
        UNION ALL
        SELECT n."id", n."storageKey"
          FROM "Node" n JOIN subtree s ON n."parentId" = s."id"
         WHERE n."dataRoomId" = ${existing.dataRoomId}
      )
      SELECT "storageKey" FROM subtree WHERE "storageKey" IS NOT NULL`;

    const storageKeys = keys.map((k) => k.storageKey);

    await this.prisma.$transaction(async (tx) => {
      await tx.node.delete({
        where: { id: existing.id },
      });
    });

    if (storageKeys.length > 0) {
      try {
        await this.storage.deleteObjects(storageKeys);
      } catch (e) {
        this.logger.error(
          `Failed to delete ${storageKeys.length} objects for node ${existing.id}`,
          e,
        );
      }
    }
  }

  /**
   * One keyset page of a folder's immediate children (FR-NAV-030).
   *
   * The decoded cursor is the scan's start condition, so no row before it is read and no `count(*)`
   * is issued: page 500 costs what page 1 costs, which `children-paging.spec.ts` holds on the query
   * plan. The row the limit fetched beyond the page never leaves this method — it only decides
   * whether there is a next cursor.
   *
   * A file answers an empty page rather than an error: nothing is inside a file, and no code in
   * docs/03 § Errors describes that (BR-100).
   */
  async listChildren(
    principal: Principal,
    id: string,
    query: ListChildrenQuery,
  ): Promise<Page<FsNode>> {
    // Before the listing query, not after it: a request that will be refused reads no row of the
    // folder it named (BR-010).
    const { dataRoomId } = await this.scope.resolve(principal, id);
    const after = query.cursor === undefined ? undefined : decodeCursor(query.cursor);

    const rows = await this.prisma.$queryRaw<FsNodeRow[]>(
      childrenPageQuery(dataRoomId, id, { limit: query.limit, type: query.type, after }),
    );

    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    const last = items.at(-1);

    return {
      items: items.map(toFsNode),
      // `null` rather than a cursor onto an empty page, so a walk ends where the rows do.
      nextCursor: hasMore && last ? encodeCursor(last) : null,
    };
  }

  /**
   * The trail from the Data Room down to the node (FR-NAV-020).
   *
   * Recursion has no Prisma form, so this is `$queryRaw` with the camelCase columns quoted — the
   * schema carries no `@map`. The same walk is slice 8's cycle check and slice 9's scope walk.
   */
  async path(principal: Principal, id: string): Promise<Breadcrumb[]> {
    const { dataRoomId, dataRoomName } = await this.scope.resolve(principal, id);

    const rows = await this.prisma.$queryRaw<AncestorRow[]>`
      WITH RECURSIVE ancestors AS (
        SELECT "id", "parentId", "name", 0 AS depth
          FROM "Node" WHERE "id" = ${id} AND "dataRoomId" = ${dataRoomId}
        UNION ALL
        SELECT n."id", n."parentId", n."name", a.depth + 1
          FROM "Node" n JOIN ancestors a ON n."id" = a."parentId"
         WHERE n."dataRoomId" = ${dataRoomId}
      )
      SELECT "id", "parentId", "name", depth FROM ancestors ORDER BY depth DESC`;

    // The head segment is the Data Room, read from the room rather than from the root row's copy of
    // its name, so a rename cannot leave a stale breadcrumb and no segment ever reads "Root"
    // (FR-ROOM-010).
    return rows.map((row) => ({
      id: row.id,
      name: row.parentId === null ? dataRoomName : row.name,
    }));
  }

  /**
   * What is inside one node, at any depth (FR-ACCT-020).
   *
   * `depth > 0` excludes the node itself, which is what makes the figures readable as "this removes
   * N folders and M files" (BR-030) — and correct for a file, where docs/03's `count(*) - 1` would
   * report minus one folder. Exact, never sampled: one index scan per level, and the whole subtree
   * of a Data Room this size is a bounded walk.
   */
  async stats(principal: Principal, id: string): Promise<NodeStats> {
    const { dataRoomId } = await this.scope.resolve(principal, id);

    const [row] = await this.prisma.$queryRaw<NodeStatsRow[]>`
      WITH RECURSIVE subtree AS (
        SELECT "id", "type", "sizeBytes", 0 AS depth
          FROM "Node" WHERE "id" = ${id} AND "dataRoomId" = ${dataRoomId}
        UNION ALL
        SELECT n."id", n."type", n."sizeBytes", s.depth + 1
          FROM "Node" n JOIN subtree s ON n."parentId" = s."id"
         WHERE n."dataRoomId" = ${dataRoomId}
      )
      SELECT (count(*) FILTER (WHERE "type" = 'FOLDER' AND depth > 0))::int AS folders,
             (count(*) FILTER (WHERE "type" = 'FILE'   AND depth > 0))::int AS files,
             (coalesce(sum("sizeBytes") FILTER (WHERE depth > 0), 0))::bigint AS bytes
        FROM subtree`;

    return toNodeStats(row);
  }

  /**
   * Direct shares on this node, plus the nearest ancestor that also carries a share (FR-SHARE-060).
   *
   * The ancestor walk reuses the same recursive CTE as `/path`; for each ancestor (nearest first)
   * it checks whether at least one Share exists. At most 32 levels (FR-FLDR-010), each a PK read.
   */
  async listShares(principal: Principal, id: string): Promise<NodeShares> {
    assertCapability(principal, 'read');
    const node = await this.scope.resolve(principal, id);

    const shares = await this.prisma.share.findMany({
      where: { nodeId: node.id },
      orderBy: { createdAt: 'desc' },
    });

    const own: Share[] = shares.map((share) => ({
      id: share.id,
      nodeId: share.nodeId,
      token: share.token,
      mode: share.mode,
      role: share.role,
      granteeEmail: share.granteeEmail,
      expiresAt: share.expiresAt?.toISOString() || null,
      createdAt: share.createdAt.toISOString(),
    }));

    // Walk ancestors (nearest first) to find the first one with at least one share.
    const ancestors = await this.prisma.$queryRaw<AncestorRow[]>`
      WITH RECURSIVE ancestors AS (
        SELECT "id", "parentId", "name", 0 AS depth
          FROM "Node" WHERE "id" = ${node.parentId ?? ''} AND "dataRoomId" = ${node.dataRoomId}
        UNION ALL
        SELECT n."id", n."parentId", n."name", a.depth + 1
          FROM "Node" n JOIN ancestors a ON n."id" = a."parentId"
         WHERE n."dataRoomId" = ${node.dataRoomId}
      )
      SELECT "id", "parentId", "name", depth FROM ancestors ORDER BY depth ASC`;

    let inheritedFrom: { id: string; name: string } | null = null;
    for (const ancestor of ancestors) {
      const count = await this.prisma.share.count({ where: { nodeId: ancestor.id } });
      if (count > 0) {
        inheritedFrom = { id: ancestor.id, name: ancestor.name };
        break;
      }
    }

    return { own, inheritedFrom };
  }
}

