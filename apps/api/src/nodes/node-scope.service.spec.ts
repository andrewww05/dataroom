import { randomUUID } from 'node:crypto';

import { HttpStatus } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import type { Principal } from '../auth/principal';
import { ErrorCode } from '../http/api.exception';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { NodeScopeService } from './node-scope.service';

/**
 * BR-010 and FR-ROOM-030 at the level the rule actually lives: one method, two owners, real rows.
 * No HTTP surface is under test here — task 3.1 asserts the same rule through all four routes.
 *
 * Requires the compose stack and an applied migration.
 */
describe('BR-010 NodeScopeService', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let scope: NodeScopeService;

  const run = randomUUID().slice(0, 8);

  let mine: Principal;
  let myRoomId: string;
  let myRootId: string;
  let theirRootId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [NodeScopeService],
    }).compile();
    moduleRef.useLogger(false);
    await moduleRef.init();

    prisma = moduleRef.get(PrismaService);
    scope = moduleRef.get(NodeScopeService);

    const owned = await seedOwner(`scope-mine-${run}`, 'My Data Room');
    mine = { kind: 'owner', userId: owned.userId };
    myRoomId = owned.dataRoomId;
    myRootId = owned.rootId;

    const theirs = await seedOwner(`scope-theirs-${run}`, 'Their Data Room');
    theirRootId = theirs.rootId;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: run } } });
    await moduleRef.close();
  });

  async function seedOwner(
    slug: string,
    name: string,
  ): Promise<{ userId: string; dataRoomId: string; rootId: string }> {
    const user = await prisma.user.create({
      data: { email: `${slug}@example.test`, passwordHash: 'not-a-real-hash' },
    });
    const dataRoom = await prisma.dataRoom.create({ data: { ownerId: user.id, name } });
    const root = await prisma.node.create({
      data: { dataRoomId: dataRoom.id, parentId: null, type: 'FOLDER', name },
    });

    return { userId: user.id, dataRoomId: dataRoom.id, rootId: root.id };
  }

  it("resolves the caller's own node with its Data Room's id and name", async () => {
    const resolved = await scope.resolve(mine, myRootId);

    expect(resolved.id).toBe(myRootId);
    expect(resolved.parentId).toBeNull();
    expect(resolved.dataRoomId).toBe(myRoomId);
    // Read from the room, not from the root row's copy of the name (FR-ROOM-010).
    expect(resolved.dataRoomName).toBe('My Data Room');
  });

  it('refuses a node in another owner’s Data Room, an unknown id and a malformed id alike', async () => {
    const refusals = await Promise.all(
      [theirRootId, randomUUID(), 'not-an-id-at-all'].map((id) =>
        scope.resolve(mine, id).then(
          () => null,
          (error: unknown) => error,
        ),
      ),
    );

    for (const refusal of refusals) {
      // A malformed id must not reach the client as a 500 or a database error: `Node.id` is TEXT,
      // so it matches nothing rather than raising (FR-ROOM-030).
      expect(refusal).toBeInstanceOf(Error);
      const thrown = refusal as { getStatus?: () => number; body?: unknown };
      expect(thrown.getStatus?.()).toBe(HttpStatus.NOT_FOUND);
      expect(thrown.body).toEqual({ code: ErrorCode.NOT_FOUND, message: expect.any(String) });
    }

    // Byte-identical, so no refusal says which of the three it was.
    const bodies = refusals.map((r) => JSON.stringify((r as { body: unknown }).body));
    expect(new Set(bodies).size).toBe(1);
    // And nothing about the other room travels in it: no room name, no node name, no email.
    expect(bodies[0]).not.toContain('Their');
    expect(bodies[0]).not.toContain(run);
  });
});
