import type { Breadcrumb, FsNode, NodeStats, Page } from '@dataroom/shared';
import { Controller, Get, Param, Query } from '@nestjs/common';

import { CurrentPrincipal } from '../auth/current-principal.decorator';
import type { Principal } from '../auth/principal';
import { ListChildrenQuery } from './dto/list-children.query';
import { NodesService } from './nodes.service';

/**
 * The read side of the tree (docs/03 § API). Nothing here carries `@Public()`, so the global guard
 * refuses an anonymous caller on all four routes.
 *
 * `:id` has no `@IsUUID()` pipe on purpose: an id that cannot name a node must be answered `404`
 * like any other node the caller has no claim on, not `400` — a `400` would tell a caller which of
 * their guesses were well-formed (FR-ROOM-030).
 */
@Controller('nodes')
export class NodesController {
  constructor(private readonly nodes: NodesService) {}

  @Get(':id')
  findOne(@CurrentPrincipal() principal: Principal, @Param('id') id: string): Promise<FsNode> {
    return this.nodes.findOne(principal, id);
  }

  @Get(':id/children')
  listChildren(
    @CurrentPrincipal() principal: Principal,
    @Param('id') id: string,
    @Query() query: ListChildrenQuery,
  ): Promise<Page<FsNode>> {
    return this.nodes.listChildren(principal, id, query);
  }

  @Get(':id/path')
  path(@CurrentPrincipal() principal: Principal, @Param('id') id: string): Promise<Breadcrumb[]> {
    return this.nodes.path(principal, id);
  }

  @Get(':id/stats')
  stats(@CurrentPrincipal() principal: Principal, @Param('id') id: string): Promise<NodeStats> {
    return this.nodes.stats(principal, id);
  }
}
