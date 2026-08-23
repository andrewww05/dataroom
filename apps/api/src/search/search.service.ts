import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Principal } from '../auth/principal';
import { SearchHit } from '@dataroom/shared';
import { ReadOnlyException } from '../http/api.exception';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(principal: Principal, q: string): Promise<SearchHit[]> {
    if (principal.kind !== 'owner') {
      throw new ReadOnlyException();
    }

    const dataRoom = await this.prisma.dataRoom.findFirst({
      where: { ownerId: principal.userId },
      select: { id: true },
    });
    if (!dataRoom) return [];

    const hits = await this.prisma.$queryRaw<any[]>`
      WITH RECURSIVE
      search_hits AS (
        SELECT id, "parentId", type::text, name, "sizeBytes", "mimeType", "createdAt", "updatedAt"
        FROM "Node"
        WHERE "dataRoomId" = ${dataRoom.id}
          AND name ILIKE '%' || ${q} || '%'
        LIMIT 50
      ),
      paths AS (
        SELECT
          sh.id AS hit_id,
          n.id,
          n."parentId",
          n.name,
          0 AS depth
        FROM search_hits sh
        JOIN "Node" n ON n.id = sh."parentId"
        
        UNION ALL
        
        SELECT
          p.hit_id,
          parent.id,
          parent."parentId",
          parent.name,
          p.depth + 1
        FROM paths p
        JOIN "Node" parent ON parent.id = p."parentId"
      )
      SELECT
        sh.id,
        sh."parentId",
        sh.type,
        sh.name,
        sh."sizeBytes",
        sh."mimeType",
        sh."createdAt",
        sh."updatedAt",
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', p.id, 'name', p.name) ORDER BY p.depth DESC)
            FROM paths p
            WHERE p.hit_id = sh.id
          ),
          '[]'::json
        ) AS path
      FROM search_hits sh;
    `;

    return hits.map(hit => ({
      id: hit.id,
      parentId: hit.parentId,
      type: hit.type as 'FILE' | 'FOLDER',
      name: hit.name,
      sizeBytes: hit.sizeBytes !== null ? Number(hit.sizeBytes) : null,
      mimeType: hit.mimeType,
      createdAt: new Date(hit.createdAt).toISOString(),
      updatedAt: new Date(hit.updatedAt).toISOString(),
      path: hit.path,
    }));
  }
}
