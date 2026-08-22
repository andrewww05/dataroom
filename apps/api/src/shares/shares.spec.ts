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

  async function createShare(
    token: string,
    nodeId: string,
    mode: 'PUBLIC' | 'RESTRICTED',
    granteeEmail?: string,
  ) {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/shares`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nodeId, mode, granteeEmail })
      .expect(201);
    return res.body;
  }

  // --- FR-SHARE-010 ---

  it('FR-SHARE-010 owner creates a PUBLIC share', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'public-create-test');
    const share = await createShare(tokenA, folderId, 'PUBLIC');
    expect(share.token).toBeDefined();
    expect(share.mode).toBe('PUBLIC');
    expect(share.role).toBe('VIEWER');
    expect(share.granteeEmail).toBeNull();
  });

  it('FR-SHARE-010 owner creates a RESTRICTED share', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'restricted-create-test');
    const share = await createShare(tokenA, folderId, 'RESTRICTED', userBEmail);
    expect(share.mode).toBe('RESTRICTED');
    expect(share.granteeEmail).toBe(userBEmail);
  });

  it('FR-SHARE-010 RESTRICTED share missing granteeEmail → 400', async () => {
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/shares`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nodeId: rootIdA, mode: 'RESTRICTED' })
      .expect(400)
      .expect((res) => expect(res.body.code).toBe('VALIDATION_FAILED'));
  });

  // --- FR-SHARE-020 ---

  it('FR-SHARE-020 PUBLIC token resolves without auth', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'public-resolve-test');
    const share = await createShare(tokenA, folderId, 'PUBLIC');
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/shares/resolve?token=${share.token}`)
      .expect(200);
    expect(res.body.mode).toBe('PUBLIC');
    expect(res.body.role).toBe('VIEWER');
    expect(res.body.rootNodeId).toBe(folderId);
  });

  // --- FR-SHARE-040 ---

  it('FR-SHARE-040 owner revokes a share', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'revoke-test');
    const share = await createShare(tokenA, folderId, 'PUBLIC');

    // Resolve works
    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/shares/resolve?token=${share.token}`)
      .expect(200);

    // Revoke
    await request(app.getHttpServer())
      .delete(`/${API_PREFIX}/shares/${share.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(204);

    // Resolve fails
    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/shares/resolve?token=${share.token}`)
      .expect(404);
  });

  it('FR-SHARE-040 wrong owner cannot revoke → 404 (BR-010)', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'wrong-owner-revoke');
    const share = await createShare(tokenA, folderId, 'PUBLIC');

    await request(app.getHttpServer())
      .delete(`/${API_PREFIX}/shares/${share.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  // --- FR-SHARE-050 ---

  it('FR-SHARE-050 resolving a token whose node has been deleted returns NOT_FOUND', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'delete-node-test');
    const share = await createShare(tokenA, folderId, 'PUBLIC');

    // Resolve works
    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/shares/resolve?token=${share.token}`)
      .expect(200);

    // Delete node
    await request(app.getHttpServer())
      .delete(`/${API_PREFIX}/nodes/${folderId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(204);

    // Resolve fails — cascaded delete removes the share row
    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/shares/resolve?token=${share.token}`)
      .expect(404);
  });

  // --- FR-SHARE-060 ---

  it('FR-SHARE-060 listing shows own shares on a node', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'list-shares-test');
    const share1 = await createShare(tokenA, folderId, 'PUBLIC');
    const share2 = await createShare(tokenA, folderId, 'RESTRICTED', userBEmail);

    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/nodes/${folderId}/shares`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.own).toHaveLength(2);
    const shareIds = res.body.own.map((s: { id: string }) => s.id);
    expect(shareIds).toContain(share1.id);
    expect(shareIds).toContain(share2.id);
    expect(res.body.inheritedFrom).toBeNull();
  });

  it('FR-SHARE-060 listing shows inherited ancestor when parent is shared', async () => {
    const parentId = await createFolder(tokenA, rootIdA, 'inherited-parent');
    await createShare(tokenA, parentId, 'PUBLIC');
    const childId = await createFolder(tokenA, parentId, 'inherited-child');

    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/nodes/${childId}/shares`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.own).toHaveLength(0);
    expect(res.body.inheritedFrom).toEqual({ id: parentId, name: 'inherited-parent' });
  });

  it('FR-SHARE-060 node with neither own nor inherited shares', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'no-shares');

    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/nodes/${folderId}/shares`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.own).toHaveLength(0);
    expect(res.body.inheritedFrom).toBeNull();
  });

  // --- FR-SHARE-080 ---

  it('FR-SHARE-080 signed-in user sees their received shares', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'received-shares-test');
    const share = await createShare(tokenA, folderId, 'RESTRICTED', userBEmail);

    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/shares/received`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const tokens = res.body.map((s: { token: string }) => s.token);
    expect(tokens).toContain(share.token);
  });

  it('FR-SHARE-080 user with no received shares gets empty array', async () => {
    // Create a third user with no shares
    const run3 = randomUUID().slice(0, 8);
    const userCEmail = `shares-c-${run3}@example.test`;
    const resC = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email: userCEmail, password: 'passwordC' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/shares/received`)
      .set('Authorization', `Bearer ${resC.body.token}`)
      .expect(200);

    expect(res.body).toEqual([]);

    // Cleanup
    await prisma.user.deleteMany({ where: { email: userCEmail } });
  });

  // --- BR-070 ---

  it('BR-070 share principal cannot create a share', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'share-cant-create');
    const share = await createShare(tokenA, folderId, 'PUBLIC');

    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/shares`)
      .set('Authorization', `Share ${share.token}`)
      .send({ nodeId: folderId, mode: 'PUBLIC' })
      .expect(403)
      .expect((res) => expect(res.body.code).toBe('READ_ONLY'));
  });

  // --- BR-100 ---

  it('BR-100 Referrer-Policy header is present on the resolve endpoint', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'referrer-test');
    const share = await createShare(tokenA, folderId, 'PUBLIC');

    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/shares/resolve?token=${share.token}`)
      .expect(200);

    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });

  // --- FR-AUTH-030 old path-segment form → 404 ---

  it('FR-AUTH-030 old path-segment resolve form returns 404', async () => {
    const folderId = await createFolder(tokenA, rootIdA, 'old-path-test');
    const share = await createShare(tokenA, folderId, 'PUBLIC');

    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/shares/resolve/${share.token}`)
      .expect(404);
  });
});
