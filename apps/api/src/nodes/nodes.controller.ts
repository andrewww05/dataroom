import type { Breadcrumb, FsNode, NodeShares, Page } from '@dataroom/shared';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';

import { CurrentPrincipal } from '../auth/current-principal.decorator';
import type { Principal } from '../auth/principal';
import { ListChildrenQuery } from './dto/list-children.query';
import { NodesService } from './nodes.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { MoveNodesDto } from './dto/move-nodes.dto';
import { RenameNodeDto } from './dto/rename-node.dto';

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

  @Post('folders')
  createFolder(
    @CurrentPrincipal() principal: Principal,
    @Body() dto: CreateFolderDto,
  ): Promise<FsNode> {
    return this.nodes.createFolder(principal, dto);
  }

  @Patch(':id')
  renameNode(
    @CurrentPrincipal() principal: Principal,
    @Param('id') id: string,
    @Body() dto: RenameNodeDto,
  ): Promise<FsNode> {
    return this.nodes.renameNode(principal, id, dto);
  }

  @Post('move')
  moveNodes(
    @CurrentPrincipal() principal: Principal,
    @Body() dto: MoveNodesDto,
  ): Promise<FsNode[]> {
    return this.nodes.moveNodes(principal, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteNode(@CurrentPrincipal() principal: Principal, @Param('id') id: string): Promise<void> {
    return this.nodes.deleteNode(principal, id);
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
  getNodeStats(@CurrentPrincipal() principal: Principal, @Param('id') id: string) {
    return this.nodes.stats(principal, id);
  }

  @Get(':id/shares')
  getShares(
    @CurrentPrincipal() principal: Principal,
    @Param('id') id: string,
  ): Promise<NodeShares> {
    return this.nodes.listShares(principal, id);
  }
}
