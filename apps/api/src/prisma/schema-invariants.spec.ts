import { randomUUID } from 'node:crypto';

import { PrismaClient } from '../generated/prisma/client';
import { createTestClient } from './test-client';

/**
 * The invariants this change buys in the database rather than in service code, so no later code
 * path can bypass them: BR-020 (names unique per folder, case-insensitively), FR-AUTH-050 (one root
 * per Data Room), FR-FLDR-030 (a folder delete takes its subtree and its shares), BR-070
 * (Share.role defaults to VIEWER and already admits EDITOR).
 *
 * Requires the compose stack and an applied migration.
 */
describe('schema invariants', () => {
  let prisma: PrismaClient;
  const userIds: string[] = [];

  beforeAll(() => {
    prisma = createTestClient();
  });

  afterAll(async () => {
    // Deleting the users cascades to their rooms, nodes and shares (FR-ROOM-020).
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  /** A user with one Data Room and its single root node — the shape signup will create in slice 3. */
  async function makeRoom(): Promise<{ dataRoomId: string; rootId: string; userId: string }> {
    const user = await prisma.user.create({
      data: { email: `${randomUUID()}@example.test`, passwordHash: 'not-a-real-hash' },
    });
    userIds.push(user.id);

    const dataRoom = await prisma.dataRoom.create({
      data: { ownerId: user.id, name: 'Diligence' },
    });

    const root = await prisma.node.create({
      data: { dataRoomId: dataRoom.id, parentId: null, type: 'FOLDER', name: 'Diligence' },
    });

    return { dataRoomId: dataRoom.id, rootId: root.id, userId: user.id };
  }

  const SUCCEEDED = Symbol('succeeded');

  /**
   * The rejection a write produced, or a failure if it was accepted.
   *
   * Prisma reports a unique violation as `P2002` plus the *fields* the index covers — it does not
   * carry the index name — so the field list is what tells `node_name_unique` and
   * `node_single_root` apart.
   */
  async function rejectionOf(write: Promise<unknown>): Promise<{ code?: string; message: string }> {
    const outcome: unknown = await write.then(
      () => SUCCEEDED,
      (error: unknown) => error,
    );

    if (outcome === SUCCEEDED) {
      throw new Error('expected the write to be rejected, but the database accepted it');
    }

    return outcome as { code?: string; message: string };
  }

  function file(dataRoomId: string, parentId: string, name: string) {
    return {
      dataRoomId,
      parentId,
      type: 'FILE' as const,
      name,
      sizeBytes: BigInt(1024),
      mimeType: 'application/pdf',
      storageKey: `${dataRoomId}/${randomUUID()}`,
    };
  }

  describe('BR-020 names are unique within a folder, case-insensitively', () => {
    it('rejects a duplicate name under the same parent', async () => {
      const { dataRoomId, rootId } = await makeRoom();
      await prisma.node.create({ data: file(dataRoomId, rootId, 'Report.pdf') });

      const error = await rejectionOf(
        prisma.node.create({ data: file(dataRoomId, rootId, 'Report.pdf') }),
      );

      expect(error.code).toBe('P2002');
      expect(error.message).toContain('lower(name'); // node_name_unique, not another index
      await expect(prisma.node.count({ where: { dataRoomId, parentId: rootId } })).resolves.toBe(1);
    });

    it('rejects a name differing only in case', async () => {
      const { dataRoomId, rootId } = await makeRoom();
      await prisma.node.create({ data: file(dataRoomId, rootId, 'Report.pdf') });

      const error = await rejectionOf(
        prisma.node.create({ data: file(dataRoomId, rootId, 'report.PDF') }),
      );

      expect(error.code).toBe('P2002');
      expect(error.message).toContain('lower(name');
    });

    it('allows the same name under a different parent', async () => {
      const { dataRoomId, rootId } = await makeRoom();
      const [a, b] = await Promise.all([
        prisma.node.create({
          data: { dataRoomId, parentId: rootId, type: 'FOLDER', name: 'Q3' },
        }),
        prisma.node.create({
          data: { dataRoomId, parentId: rootId, type: 'FOLDER', name: 'Q4' },
        }),
      ]);

      await prisma.node.create({ data: file(dataRoomId, a.id, 'Report.pdf') });
      await prisma.node.create({ data: file(dataRoomId, b.id, 'Report.pdf') });

      await expect(prisma.node.count({ where: { dataRoomId, name: 'Report.pdf' } })).resolves.toBe(
        2,
      );
    });

    it('allows the same name in a different Data Room', async () => {
      const first = await makeRoom();
      const second = await makeRoom();

      await prisma.node.create({ data: file(first.dataRoomId, first.rootId, 'Report.pdf') });
      await prisma.node.create({ data: file(second.dataRoomId, second.rootId, 'Report.pdf') });

      await expect(
        prisma.node.count({
          where: { dataRoomId: { in: [first.dataRoomId, second.dataRoomId] }, name: 'Report.pdf' },
        }),
      ).resolves.toBe(2);
    });
  });

  describe('FR-AUTH-050 a Data Room has exactly one root', () => {
    it('accepts the first parentless node', async () => {
      const { dataRoomId } = await makeRoom();

      await expect(prisma.node.count({ where: { dataRoomId, parentId: null } })).resolves.toBe(1);
    });

    it('rejects a second parentless node', async () => {
      const { dataRoomId } = await makeRoom();

      const error = await rejectionOf(
        prisma.node.create({
          data: { dataRoomId, parentId: null, type: 'FOLDER', name: 'Another root' },
        }),
      );

      expect(error.code).toBe('P2002');
      // node_single_root covers dataRoomId alone — the name index would also list parentId.
      expect(error.message).toMatch(/fields: \(`"dataRoomId"`\)/);
    });

    it('gives each Data Room its own root', async () => {
      const first = await makeRoom();
      const second = await makeRoom();

      await expect(
        prisma.node.count({
          where: { dataRoomId: { in: [first.dataRoomId, second.dataRoomId] }, parentId: null },
        }),
      ).resolves.toBe(2);
    });
  });

  describe('FR-FLDR-030 deleting a container deletes everything beneath it', () => {
    it('removes the subtree under a deleted folder', async () => {
      const { dataRoomId, rootId } = await makeRoom();
      const folder = await prisma.node.create({
        data: { dataRoomId, parentId: rootId, type: 'FOLDER', name: 'Q3 Diligence' },
      });
      const nested = await prisma.node.create({
        data: { dataRoomId, parentId: folder.id, type: 'FOLDER', name: 'Contracts' },
      });
      await prisma.node.create({ data: file(dataRoomId, nested.id, 'msa.pdf') });

      await prisma.node.delete({ where: { id: folder.id } });

      await expect(prisma.node.count({ where: { dataRoomId } })).resolves.toBe(1); // the root
    });

    it('removes the shares on every node it deletes', async () => {
      const { dataRoomId, rootId } = await makeRoom();
      const folder = await prisma.node.create({
        data: { dataRoomId, parentId: rootId, type: 'FOLDER', name: 'Shared folder' },
      });
      const nested = await prisma.node.create({
        data: { dataRoomId, parentId: folder.id, type: 'FILE', name: 'nda.pdf' },
      });
      await prisma.share.createMany({
        data: [
          { nodeId: folder.id, dataRoomId, token: randomUUID(), mode: 'PUBLIC' },
          {
            nodeId: nested.id,
            dataRoomId,
            token: randomUUID(),
            mode: 'RESTRICTED',
            granteeEmail: 'buyer@example.test',
          },
        ],
      });

      await prisma.node.delete({ where: { id: folder.id } });

      await expect(prisma.share.count({ where: { dataRoomId } })).resolves.toBe(0);
    });

    it('FR-ROOM-020 removes a deleted user’s rooms, nodes and shares', async () => {
      const { dataRoomId, rootId, userId } = await makeRoom();
      await prisma.share.create({
        data: { nodeId: rootId, dataRoomId, token: randomUUID(), mode: 'PUBLIC' },
      });

      await prisma.user.delete({ where: { id: userId } });

      await expect(prisma.dataRoom.count({ where: { id: dataRoomId } })).resolves.toBe(0);
      await expect(prisma.node.count({ where: { dataRoomId } })).resolves.toBe(0);
      await expect(prisma.share.count({ where: { dataRoomId } })).resolves.toBe(0);
    });
  });

  describe('BR-070 a share carries a role, and today it is only VIEWER', () => {
    it('defaults the role to VIEWER', async () => {
      const { dataRoomId, rootId } = await makeRoom();
      const share = await prisma.share.create({
        data: { nodeId: rootId, dataRoomId, token: randomUUID(), mode: 'PUBLIC' },
      });

      expect(share.role).toBe('VIEWER');
    });

    it('already admits EDITOR, so the second role needs no migration', async () => {
      const { dataRoomId, rootId } = await makeRoom();
      const share = await prisma.share.create({
        data: { nodeId: rootId, dataRoomId, token: randomUUID(), mode: 'PUBLIC', role: 'EDITOR' },
      });

      expect(share.role).toBe('EDITOR');
    });

    it('rejects a role outside the enum', async () => {
      const { dataRoomId, rootId } = await makeRoom();

      // Bypasses the generated types on purpose: the guarantee under test is the database's.
      await expect(
        prisma.$executeRawUnsafe(
          `INSERT INTO "Share" ("id", "nodeId", "dataRoomId", "token", "mode", "role")
           VALUES ($1, $2, $3, $4, 'PUBLIC', 'OWNER')`,
          randomUUID(),
          rootId,
          dataRoomId,
          randomUUID(),
        ),
      ).rejects.toThrow();
    });
  });
});
