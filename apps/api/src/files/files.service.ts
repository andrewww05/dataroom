import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

import { Principal, assertCapability } from '../auth/principal';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NodeScopeService } from '../nodes/node-scope.service';
import { resolveUniqueName } from '../nodes/name.helper';
import { toFsNode, type FsNodeRow } from '../nodes/node.serializer';
import { NotFoundException } from '../http/api.exception';
import type { PresignedUrl, FsNode } from '@dataroom/shared';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly scope: NodeScopeService,
  ) {}

  async uploadFile(
    principal: Principal,
    parentId: string,
    file: Express.Multer.File,
    mimeType: string,
  ): Promise<FsNode> {
    assertCapability(principal, 'write');
    const parent = await this.scope.resolve(principal, parentId);
    if (parent.type !== 'FOLDER') {
      throw new NotFoundException();
    }

    const nodeId = crypto.randomUUID();
    const storageKey = `${parent.dataRoomId}/${nodeId}`;

    await this.storage.putObject(storageKey, file.buffer, mimeType);

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const uniqueName = await resolveUniqueName(
          tx,
          parent.dataRoomId,
          parentId,
          file.originalname,
        );

        return tx.node.create({
          data: {
            id: nodeId,
            dataRoomId: parent.dataRoomId,
            parentId,
            name: uniqueName,
            type: 'FILE',
            mimeType,
            sizeBytes: BigInt(file.size),
            storageKey,
          },
        });
      });
      return toFsNode(row as FsNodeRow);
    } catch (error) {
      this.logger.error(
        `Failed to create row for file upload, deleting object ${storageKey}`,
        error,
      );
      await this.storage.deleteObjects([storageKey]);
      throw error;
    }
  }

  async presignDownload(principal: Principal, id: string): Promise<PresignedUrl> {
    const node = await this.scope.resolve(principal, id);
    if (node.type !== 'FILE' || !node.storageKey) {
      throw new NotFoundException();
    }
    return this.storage.presignDownload(node.storageKey, node.name);
  }

  async presignPreview(principal: Principal, id: string): Promise<PresignedUrl> {
    const node = await this.scope.resolve(principal, id);
    if (node.type !== 'FILE' || !node.storageKey) {
      throw new NotFoundException();
    }
    return this.storage.presignInline(node.storageKey, node.name, node.mimeType!);
  }
}
