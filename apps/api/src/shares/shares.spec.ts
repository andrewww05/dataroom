import { randomUUID } from 'node:crypto';

import { API_PREFIX } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';
import { createTestApp } from '../testing/test-app';

describe('Shares', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const run = randomUUID().slice(0, 8);

  let tokenA: string;
  let tokenB: string;
  let rootIdA: string;
  const userAEmail = `shares-a-${run}@example.test`;
  const userBEmail = `shares-b-${run}@example.test`;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const resA = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email: userAEmail, password: 'passwordA' })
      .expect(201);
    tokenA = resA.body.token;
    rootIdA = resA.body.dataRoom.rootId;

    const resB = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email: userBEmail, password: 'passwordB' })
      .expect(201);
    tokenB = resB.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: run } } });
    await app.close();
  });

  async function createFolder(token: string, parentId: string, name: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/nodes/folders`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId, name })
      .expect(201);
    return res.body.id;
  }

  async function createShare(token: string, nodeId: string, mode: 'PUBLIC' | 'RESTRICTED', granteeEmail?: string) {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/shares`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nodeId, mode, granteeEmail })
      .expect(201);
    return res.body;
  }

  it('FR-SHARE-040 owner revokes a share', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'revoke-test');
    const share = await createShare(tokenA, folderId, 'PUBLIC');
    
    // Resolve works
    await request(app.getHttpServer()).get(`/${API_PREFIX}/shares/resolve/${share.token}`).expect(200);

    // Revoke
    await request(app.getHttpServer())
      .delete(`/${API_PREFIX}/shares/${share.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    // Resolve fails
    await request(app.getHttpServer()).get(`/${API_PREFIX}/shares/resolve/${share.token}`).expect(404);
  });

  it('FR-SHARE-050 resolving a token whose node has been deleted returns NOT_FOUND', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'delete-node-test');
    const share = await createShare(tokenA, folderId, 'PUBLIC');

    // Resolve works
    await request(app.getHttpServer()).get(`/${API_PREFIX}/shares/resolve/${share.token}`).expect(200);

    // Delete node
    await request(app.getHttpServer())
      .delete(`/${API_PREFIX}/nodes/${folderId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(204);

    // Resolve fails
    await request(app.getHttpServer()).get(`/${API_PREFIX}/shares/resolve/${share.token}`).expect(404);
  });

  it('FR-SHARE-060 listing shows own shares on a node', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'list-shares-test');
    const share1 = await createShare(tokenA, folderId, 'PUBLIC');
    const share2 = await createShare(tokenA, folderId, 'RESTRICTED', userBEmail);

    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/nodes/${folderId}/shares`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const shareIds = res.body.map((s: any) => s.id);
    expect(shareIds).toContain(share1.id);
    expect(shareIds).toContain(share2.id);
  });

  it('FR-SHARE-080 signed-in user sees their received shares', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'received-shares-test');
    const share = await createShare(tokenA, folderId, 'RESTRICTED', userBEmail);

    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/shares/received`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const tokens = res.body.map((s: any) => s.token);
    expect(tokens).toContain(share.token);
  });
});
