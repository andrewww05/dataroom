import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NodeScopeService } from '../nodes/node-scope.service';
import { Principal, assertCapability } from '../auth/principal';
import { CreateShareDto } from './dto/create-share.dto';
import { Share, ReceivedShare } from '@dataroom/shared';
import { randomBytes } from 'crypto';
import { toFsNode, type FsNodeRow } from '../nodes/node.serializer';
import { NotFoundException, ValidationFailedException } from '../http/api.exception';

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: NodeScopeService,
  ) {}

  async createShare(principal: Principal, dto: CreateShareDto): Promise<Share> {
    assertCapability(principal, 'write');
    const node = await this.scope.resolve(principal, dto.nodeId);

    if (dto.mode === 'RESTRICTED' && !dto.granteeEmail) {
      throw new ValidationFailedException({ granteeEmail: ['Required for RESTRICTED mode'] });
    }

    const token = randomBytes(32).toString('base64url');

    const share = await this.prisma.share.create({
      data: {
        nodeId: node.id,
        dataRoomId: node.dataRoomId,
        token,
        mode: dto.mode,
        role: 'VIEWER',
        granteeEmail: dto.mode === 'RESTRICTED' ? dto.granteeEmail?.toLowerCase() : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return {
      id: share.id,
      nodeId: share.nodeId,
      token: share.token,
      mode: share.mode,
      role: share.role,
      granteeEmail: share.granteeEmail,
      expiresAt: share.expiresAt?.toISOString() || null,
      createdAt: share.createdAt.toISOString(),
    };
  }

  async revokeShare(principal: Principal, id: string): Promise<void> {
    assertCapability(principal, 'write');
    if (principal.kind !== 'owner') throw new NotFoundException();

    const share = await this.prisma.share.findFirst({
      where: { id, dataRoom: { ownerId: principal.userId } },
    });

    if (!share) throw new NotFoundException();

    await this.prisma.share.delete({ where: { id: share.id } });
  }

  async resolveShare(token: string) {
    const share = await this.prisma.share.findUnique({
      where: { token },
      include: {
        node: {
          include: {
            dataRoom: { include: { owner: true } },
          },
        },
      },
    });

    if (!share || (share.expiresAt && share.expiresAt < new Date())) {
      throw new NotFoundException();
    }

    const { node } = share;
    return {
      node: toFsNode({
        ...node,
        dataRoomId: node.dataRoomId,
        sizeBytes: node.sizeBytes,
        mimeType: node.mimeType,
      } as FsNodeRow),
      mode: share.mode,
      role: share.role,
      rootNodeId: share.nodeId,
      ownerEmail: node.dataRoom.owner.email,
    };
  }

  async listReceived(principal: Principal): Promise<ReceivedShare[]> {
    if (principal.kind !== 'owner') return [];

    const user = await this.prisma.user.findUnique({ where: { id: principal.userId } });
    if (!user) return [];

    const shares = await this.prisma.share.findMany({
      where: { granteeEmail: user.email, mode: 'RESTRICTED' },
      include: {
        node: {
          include: {
            dataRoom: { include: { owner: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shares.map((share) => ({
      token: share.token,
      node: toFsNode({
        ...share.node,
        dataRoomId: share.node.dataRoomId,
        sizeBytes: share.node.sizeBytes,
        mimeType: share.node.mimeType,
      } as FsNodeRow),
      ownerEmail: share.node.dataRoom.owner.email,
      role: share.role,
      createdAt: share.createdAt.toISOString(),
    }));
  }
}
