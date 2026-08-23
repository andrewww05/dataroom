import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Principal } from '../auth/principal';
import type { RoomUsage } from '@dataroom/shared';

interface RoomUsageRow {
  files: number;
  bytes: bigint | number | string;
}

@Injectable()
export class DataRoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsage(principal: Principal, dataRoomId: string): Promise<RoomUsage> {
    if (principal.kind !== 'owner') {
      throw new NotFoundException();
    }

    const room = await this.prisma.dataRoom.findFirst({
      where: { id: dataRoomId, ownerId: principal.userId },
    });
    if (!room) {
      throw new NotFoundException();
    }

    const [row] = await this.prisma.$queryRaw<RoomUsageRow[]>`
      SELECT count(*)::int AS files, coalesce(sum("sizeBytes"),0)::bigint AS bytes
        FROM "Node"
       WHERE "dataRoomId" = ${dataRoomId} AND "type" = 'FILE'
    `;

    return {
      files: Number(row.files),
      bytes: Number(row.bytes),
    };
  }
}
