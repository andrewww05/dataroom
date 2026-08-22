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
    const node = await this.prisma.node.findFirst({
      // The join is the check. Asking for the row first and comparing owners afterwards would read
      // a row the caller has no claim on, and one day forget to compare.
      where: { id, dataRoom: { ownerId: principal.userId } },
      select: { ...FS_NODE_SELECT, dataRoomId: true, dataRoom: { select: { name: true } } },
    });

    // A foreign node, an id no row has, and an id that cannot name a node at all are the same
    // answer: `404 NOT_FOUND` with no argument to vary, so the bodies are byte-identical and none
    // of them confirms a row exists (FR-ROOM-030). Never `403` — that would confirm it.
    if (!node) throw new NotFoundException();

    const { dataRoom, ...row } = node;

    return { ...row, dataRoomName: dataRoom.name };
  }
}
