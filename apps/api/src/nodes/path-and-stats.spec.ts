import { randomUUID } from 'node:crypto';

import { API_PREFIX, type Breadcrumb, type FsNode, type NodeStats } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';
import { createTestApp } from '../testing/test-app';

/**
 * FR-NAV-020 the breadcrumb trail, FR-ROOM-010 its head segment, and FR-ACCT-020 the recursive
 * figures behind the details pane and BR-030's delete dialog.
 *
 * Requires the compose stack and an applied migration.
 */
describe('the path and the contents of a node', () => {
  const DEPTH = 33;
  const GIB = 1_024 ** 3;

  let app: INestApplication;
  let prisma: PrismaService;

  const run = randomUUID().slice(0, 8);

  let token: string;
  let dataRoomId: string;
  let rootId: string;
  /** Held so the rename test can put the Data Room's own name back. */
  let roomName: string;

  /** `deep[0]` is a child of the root; `deep[DEPTH - 2]` is the deepest folder. */
  let deep: string[];
  let deepFileId: string;
  let emptyId: string;
  let shallowId: string;
  let nestedId: string;
  let flatFileId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const mine = await signUp(`tree-${run}`);
    token = mine.token;
    dataRoomId = mine.dataRoomId;
    rootId = mine.rootId;
    roomName = mine.name;

    // A chain deep enough that a recursion limit or a truncation would show (FR-FLDR-010).
    deep = [];
    let parentId = rootId;
    for (let level = 1; level < DEPTH; level += 1) {
      parentId = await folder(parentId, `level-${String(level).padStart(2, '0')}`);
      deep.push(parentId);
    }
    deepFileId = await file(parentId, 'bottom.pdf', 3n * BigInt(GIB));

    emptyId = await folder(rootId, 'empty');

    // The same two files, once one level down and once at the bottom of a 32-level chain: the
    // figures must not depend on how deep they sit.
    shallowId = await folder(rootId, 'shallow');
    const shallowChild = await folder(shallowId, 'child');
    await file(shallowChild, 'a.pdf', 2n * BigInt(GIB));
    await file(shallowChild, 'b.pdf', 3n * BigInt(GIB));

    nestedId = await folder(rootId, 'nested');
    let bottom = nestedId;
    for (let level = 0; level < 31; level += 1) bottom = await folder(bottom, `d-${level}`);
    await file(bottom, 'a.pdf', 2n * BigInt(GIB));
    await file(bottom, 'b.pdf', 3n * BigInt(GIB));

    flatFileId = await file(rootId, 'flat.pdf', 512n);
  }, 120_000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: run } } });
    await app.close();
  });

  async function signUp(
    slug: string,
  ): Promise<{ token: string; dataRoomId: string; rootId: string; name: string }> {
    const response = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email: `${slug}@example.test`, password: 'correct horse battery' })
      .expect(201);

    return {
      token: response.body.token,
      dataRoomId: response.body.dataRoom.id,
      rootId: response.body.dataRoom.rootId,
      name: response.body.dataRoom.name,
    };
  }

  async function folder(parentId: string, name: string): Promise<string> {
    const row = await prisma.node.create({
      data: { dataRoomId, parentId, type: 'FOLDER', name },
      select: { id: true },
    });

    return row.id;
  }

  async function file(parentId: string, name: string, sizeBytes: bigint): Promise<string> {
    const row = await prisma.node.create({
      data: {
        dataRoomId,
        parentId,
        type: 'FILE',
        name,
        sizeBytes,
        mimeType: 'application/pdf',
        storageKey: `${dataRoomId}/${name}`,
      },
      select: { id: true },
    });

    return row.id;
  }

  const get = (path: string) =>
    request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${token}`);

  const pathOf = async (id: string): Promise<Breadcrumb[]> =>
    (await get(`/${API_PREFIX}/nodes/${id}/path`).expect(200)).body as Breadcrumb[];

  const statsOf = async (id: string): Promise<NodeStats> =>
    (await get(`/${API_PREFIX}/nodes/${id}/stats`).expect(200)).body as NodeStats;

  describe('FR-NAV-020 the path', () => {
    it('runs from the Data Room down to the node, with every level in between', async () => {
      const segments = await pathOf(deepFileId);

      expect(segments).toHaveLength(DEPTH + 1);
      expect(segments[0].id).toBe(rootId);
      expect(segments.at(-1)?.id).toBe(deepFileId);
      expect(segments.at(-1)?.name).toBe('bottom.pdf');
      // Outermost first, one level per segment, none skipped.
      expect(segments.slice(1, DEPTH).map((segment) => segment.id)).toEqual(deep);
      expect(segments[1].name).toBe('level-01');
    });

    it('carries the Data Room’s name in the head segment, and never "Root"', async () => {
      const segments = await pathOf(deepFileId);
      const room = await prisma.dataRoom.findUniqueOrThrow({ where: { id: dataRoomId } });

      expect(segments[0].name).toBe(room.name);
      expect(segments.some((segment) => segment.name === 'Root')).toBe(false);
    });

    it('follows a rename of the Data Room rather than the root row’s copy of its name', async () => {
      await prisma.dataRoom.update({
        where: { id: dataRoomId },
        data: { name: 'Renamed Room' },
      });

      try {
        expect((await pathOf(deepFileId))[0].name).toBe('Renamed Room');
        // The root row's own name is untouched and is not what the breadcrumb reads.
        const root = await prisma.node.findUniqueOrThrow({ where: { id: rootId } });
        expect(root.name).not.toBe('Renamed Room');
      } finally {
        await prisma.dataRoom.update({ where: { id: dataRoomId }, data: { name: roomName } });
      }
    });

    it('gives every segment an id that reads back as a node', async () => {
      const segments = await pathOf(deep[2]);

      for (const segment of segments) {
        const node = (await get(`/${API_PREFIX}/nodes/${segment.id}`).expect(200)).body as FsNode;

        expect(node.id).toBe(segment.id);
      }
    });

    it('answers the root with one segment', async () => {
      const segments = await pathOf(rootId);

      expect(segments).toHaveLength(1);
      expect(segments[0].id).toBe(rootId);
    });

    it('ends a file’s path at the file, its container before it', async () => {
      const segments = await pathOf(flatFileId);

      expect(segments.map((segment) => segment.id)).toEqual([rootId, flatFileId]);
    });

    it('carries only an id and a name per segment', async () => {
      for (const segment of await pathOf(deep[0])) {
        expect(Object.keys(segment).sort()).toEqual(['id', 'name']);
      }
    });
  });

  describe('FR-ACCT-020 the contents figures', () => {
    it('covers the whole subtree rather than the immediate children', async () => {
      const stats = await statsOf(shallowId);

      // One subfolder and the two files inside it, not "one folder, no files".
      expect(stats).toEqual({ folders: 1, files: 2, bytes: 5 * GIB });
    });

    it('does not count the node itself', async () => {
      const parent = await folder(rootId, `container-${run}`);
      await folder(parent, 'one-empty-subfolder');
      await file(parent, 'one-file.pdf', 10n);

      expect(await statsOf(parent)).toEqual({ folders: 1, files: 1, bytes: 10 });
    });

    it('reports zeros for an empty folder, none of them null or negative', async () => {
      const stats = await statsOf(emptyId);

      expect(stats).toEqual({ folders: 0, files: 0, bytes: 0 });
      for (const value of Object.values(stats)) {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });

    it('reports zeros for a file rather than minus one folder or its own size', async () => {
      // docs/03's `count(*) - 1` returns -1 folders here; `depth > 0` is why this is zero.
      expect(await statsOf(flatFileId)).toEqual({ folders: 0, files: 0, bytes: 0 });
    });

    it('sums only files, and is exact beyond 4 GiB', async () => {
      const stats = await statsOf(rootId);
      const files = await prisma.node.aggregate({
        where: { dataRoomId, type: 'FILE' },
        _sum: { sizeBytes: true },
        _count: true,
      });

      expect(stats.bytes).toBe(Number(files._sum.sizeBytes));
      expect(stats.bytes).toBeGreaterThan(4 * GIB);
      expect(stats.files).toBe(files._count);
      expect(Number.isInteger(stats.bytes)).toBe(true);
    });

    it('gives the same answer for the same files nested shallowly and 32 levels deep', async () => {
      const shallow = await statsOf(shallowId);
      const nested = await statsOf(nestedId);

      expect(shallow.files).toBe(nested.files);
      expect(shallow.bytes).toBe(nested.bytes);
      expect(nested.folders).toBe(31);
      expect(nested.bytes).toBe(5 * GIB);
    });

    it('never appears on a listing row', async () => {
      const response = await get(`/${API_PREFIX}/nodes/${rootId}/children`).expect(200);

      for (const item of response.body.items as FsNode[]) {
        expect(item).not.toHaveProperty('folders');
        expect(item).not.toHaveProperty('files');
        expect(item).not.toHaveProperty('bytes');
      }
    });
  });
});
