import { Injectable } from '@nestjs/common';

import type { Principal } from '../auth/principal';
import { NotFoundException } from '../http/api.exception';
import { PrismaService } from '../prisma/prisma.service';
import { FS_NODE_SELECT, type FsNodeRow } from './node.serializer';

/**
 * A node the caller is entitled to, plus the scope every later query in the request filters on.
 *
 * `dataRoomName` rides along because `/path`'s head segment reads `DataRoom.name` rather than the
 * root row's copy of it (FR-ROOM-010) — so the rename endpoint, whenever it lands, touches nothing
 * here and no breadcrumb can fall behind a rename.
 */
export interface ScopedNode extends FsNodeRow {
  dataRoomId: string;
  dataRoomName: string;
  storageKey: string | null;
}

/**
 * The one place ownership is asserted (BR-010).
 *
 * Every handler that names a node starts here, so the check happens **once per request rather than
 * once per row**: the node is loaded by primary key with the room's owner in the same predicate,
 * and everything after it filters on the `dataRoomId` this returned. A route that forgot to call it
 * would be a route with no scope check at all, which is why there is nowhere else to get a row.
 *
 * Slice 9's share principal is an `if` in this method and nothing else.
 */
@Injectable()
export class NodeScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(principal: Principal, id: string): Promise<ScopedNode> {
    if (principal.kind === 'owner') {
      const node = await this.prisma.node.findFirst({
        where: { id, dataRoom: { ownerId: principal.userId } },
        select: {
          ...FS_NODE_SELECT,
          storageKey: true,
          dataRoomId: true,
          dataRoom: { select: { name: true } },
        },
      });

      if (!node) throw new NotFoundException();

      const { dataRoom, ...row } = node;
      return { ...row, dataRoomName: dataRoom.name };
    } else {
      const node = await this.prisma.node.findFirst({
        where: { id, dataRoomId: principal.dataRoomId },
        select: {
          ...FS_NODE_SELECT,
          storageKey: true,
          dataRoomId: true,
          dataRoom: { select: { name: true } },
        },
      });

      if (!node) throw new NotFoundException();

      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        WITH RECURSIVE ancestors AS (
          SELECT "id", "parentId" FROM "Node" WHERE "id" = ${id} AND "dataRoomId" = ${principal.dataRoomId}
          UNION ALL
          SELECT n."id", n."parentId" FROM "Node" n JOIN ancestors a ON n."id" = a."parentId"
           WHERE n."dataRoomId" = ${principal.dataRoomId}
        )
        SELECT "id" FROM ancestors WHERE "id" = ${principal.rootNodeId}`;

      if (rows.length === 0) throw new NotFoundException();

      const { dataRoom, ...row } = node;
      return { ...row, dataRoomName: dataRoom.name };
    }
  }
}
