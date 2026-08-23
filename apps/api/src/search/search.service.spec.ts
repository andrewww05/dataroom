import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { Principal } from '../auth/principal';
import { ReadOnlyException } from '../http/api.exception';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
            dataRoom: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('throws READ_ONLY for share principal', async () => {
      const principal: Principal = {
        kind: 'share',
        shareId: 'share-1',
        role: 'VIEWER',
        rootNodeId: 'node-1',
        dataRoomId: 'room-1',
      };

      await expect(service.search(principal, 'test')).rejects.toThrow(ReadOnlyException);
    });

    it('returns hits scoped to the correct room for owner', async () => {
      const principal: Principal = {
        kind: 'owner',
        userId: 'user-1',
      };

      const mockDate = new Date();
      const mockDbHits = [
        {
          id: 'hit-1',
          parentId: 'folder-1',
          type: 'FILE',
          name: 'test file',
          sizeBytes: 1024n,
          mimeType: 'text/plain',
          createdAt: mockDate,
          updatedAt: mockDate,
          path: [{ id: 'folder-1', name: 'folder' }],
        },
      ];

      jest.spyOn(prisma.dataRoom, 'findFirst').mockResolvedValue({ id: 'room-1' } as any);
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue(mockDbHits);

      const result = await service.search(principal, 'test');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'hit-1',
        parentId: 'folder-1',
        type: 'FILE',
        name: 'test file',
        sizeBytes: 1024,
        mimeType: 'text/plain',
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString(),
        path: [{ id: 'folder-1', name: 'folder' }],
      });
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('returns empty result set', async () => {
      const principal: Principal = {
        kind: 'owner',
        userId: 'user-1',
      };

      jest.spyOn(prisma.dataRoom, 'findFirst').mockResolvedValue({ id: 'room-1' } as any);
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([]);

      const result = await service.search(principal, 'test');
      expect(result).toHaveLength(0);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });
  });
});
