import { randomUUID } from 'node:crypto';

import { API_PREFIX } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';
import { createTestApp } from '../testing/test-app';

describe('Node move operations (BR-060)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const run = randomUUID().slice(0, 8);

  let token: string;
  let dataRoomId: string;
  let rootId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const response = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email: `move-${run}@example.test`, password: 'correct horse battery' })
      .expect(201);

    token = response.body.token;
    dataRoomId = response.body.dataRoom.id;
    rootId = response.body.dataRoom.rootId;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: run } } });
    await app.close();
  });

  async function folder(parentId: string, name: string): Promise<string> {
    const row = await prisma.node.create({
      data: { dataRoomId, parentId, type: 'FOLDER', name },
      select: { id: true },
    });
    return row.id;
  }

  const post = (path: string, body: object) =>
    request(app.getHttpServer())
      .post(path)
      .send(body)
      .set('Authorization', `Bearer ${token}`);

  it('rejects a self-move with INVALID_MOVE', async () => {
    const folderA = await folder(rootId, 'self-move-test');

    const response = await post(`/${API_PREFIX}/nodes/move`, {
      ids: [folderA],
      targetId: folderA,
    }).expect(400);

    expect(response.body.code).toBe('INVALID_MOVE');
  });

  it('rejects a descendant-move with INVALID_MOVE', async () => {
    const parent = await folder(rootId, 'parent');
    const child = await folder(parent, 'child');
    const grandChild = await folder(child, 'grandchild');

    const response = await post(`/${API_PREFIX}/nodes/move`, {
      ids: [parent],
      targetId: grandChild,
    }).expect(400);

    expect(response.body.code).toBe('INVALID_MOVE');
  });

  it('allows a valid move', async () => {
    const src = await folder(rootId, 'src-folder');
    const target = await folder(rootId, 'target-folder');
    const itemToMove = await folder(src, 'item-to-move');

    await post(`/${API_PREFIX}/nodes/move`, {
      ids: [itemToMove],
      targetId: target,
    }).expect(201);

    // Verify it moved
    const moved = await prisma.node.findUniqueOrThrow({ where: { id: itemToMove } });
    expect(moved.parentId).toBe(target);
  });
});
