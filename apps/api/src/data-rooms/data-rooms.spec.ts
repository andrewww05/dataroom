import { randomUUID } from 'node:crypto';

import { API_PREFIX } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';
import { createTestApp } from '../testing/test-app';

describe('DataRooms usage (FR-ACCT-010)', () => {
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
      .send({ email: `usage-${run}@example.test`, password: 'correct horse battery' })
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

  async function file(parentId: string, name: string, sizeBytes: number | bigint): Promise<string> {
    const row = await prisma.node.create({
      data: {
        id: randomUUID(),
        dataRoomId,
        parentId,
        type: 'FILE',
        name,
        sizeBytes,
        mimeType: 'text/plain',
        storageKey: `${dataRoomId}/${randomUUID()}`,
      },
      select: { id: true },
    });
    return row.id;
  }

  it('answers with plain numbers', async () => {
    await folder(rootId, 'empty-folder');
    const f1 = await folder(rootId, 'folder');
    await file(f1, 'file1.txt', 100);
    await file(f1, 'file2.txt', 250);
    // big file
    await file(rootId, 'file3.txt', 3n * 1024n * 1024n * 1024n); // 3 GiB

    const expectedBytes = 100 + 250 + 3 * 1024 * 1024 * 1024;

    const response = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/data-rooms/${dataRoomId}/usage`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      files: 3,
      bytes: expectedBytes,
    });

    expect(typeof response.body.files).toBe('number');
    expect(typeof response.body.bytes).toBe('number');
  });

  it('returns 404 for a different data room', async () => {
    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/data-rooms/some-other-id/usage`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('returns 404 for a share token (BR-010)', async () => {
    const f1 = await folder(rootId, 'share-folder');

    // Create share token
    const shareRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/shares`)
      .send({ nodeId: f1, mode: 'PUBLIC' })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const shareToken = shareRes.body.token;

    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/data-rooms/${dataRoomId}/usage`)
      .set('Authorization', `Share ${shareToken}`)
      .expect(404);
  });
});
