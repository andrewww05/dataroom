import { randomUUID } from 'node:crypto';

import { API_PREFIX } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { createTestApp } from '../testing/test-app';

describe('Node copy operations (FR-FILE-060, BR-060)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let storage: StorageService;

  const run = randomUUID().slice(0, 8);

  let ownerToken: string;
  let ownerDataRoomId: string;
  let ownerRootId: string;
  
  let otherToken: string;
  let otherRootId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    storage = app.get(StorageService);

    const resOwner = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email: `copy-owner-${run}@example.test`, password: 'correct horse battery' })
      .expect(201);
    ownerToken = resOwner.body.token;
    ownerDataRoomId = resOwner.body.dataRoom.id;
    ownerRootId = resOwner.body.dataRoom.rootId;

    const resOther = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email: `copy-other-${run}@example.test`, password: 'correct horse battery' })
      .expect(201);
    otherToken = resOther.body.token;
    otherRootId = resOther.body.dataRoom.rootId;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: run } } });
    await app.close();
  });

  async function folder(parentId: string, name: string): Promise<string> {
    const row = await prisma.node.create({
      data: { dataRoomId: ownerDataRoomId, parentId, type: 'FOLDER', name },
      select: { id: true },
    });
    return row.id;
  }
  
  async function file(parentId: string, name: string, content: string): Promise<string> {
    const id = randomUUID();
    const storageKey = `${ownerDataRoomId}/${id}`;
    
    await storage.putObject(storageKey, Buffer.from(content), 'text/plain');
    
    const row = await prisma.node.create({
      data: { 
        id,
        dataRoomId: ownerDataRoomId, 
        parentId, 
        type: 'FILE', 
        name,
        sizeBytes: content.length,
        mimeType: 'text/plain',
        storageKey
      },
      select: { id: true },
    });
    return row.id;
  }

  const post = (path: string, body: object, tokenToUse = ownerToken) =>
    request(app.getHttpServer())
      .post(path)
      .send(body)
      .set('Authorization', `Bearer ${tokenToUse}`);

  it('owner-copies-file', async () => {
    const target = await folder(ownerRootId, 'target-for-file');
    const sourceFile = await file(ownerRootId, 'file.txt', 'hello');

    const response = await post(`/${API_PREFIX}/nodes/copy`, {
      ids: [sourceFile],
      targetId: target,
    }).expect(201);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('file.txt');
    expect(response.body[0].id).not.toBe(sourceFile);
    expect(response.body[0].parentId).toBe(target);

    // Verify bytes
    const destNode = await prisma.node.findUniqueOrThrow({ where: { id: response.body[0].id } });
    const presigned = await storage.presignDownload(destNode.storageKey!, 'test');
    const dlResponse = await fetch(presigned.url);
    expect(await dlResponse.text()).toBe('hello');
  });

  it('owner-copies-subtree', async () => {
    const target = await folder(ownerRootId, 'target-for-subtree');
    const parent = await folder(ownerRootId, 'subtree-parent');
    await folder(parent, 'subtree-child');
    await file(parent, 'subtree-file.txt', 'test');

    const response = await post(`/${API_PREFIX}/nodes/copy`, {
      ids: [parent],
      targetId: target,
    }).expect(201);

    expect(response.body).toHaveLength(1);
    
    // Check subtree was copied
    const children = await prisma.node.findMany({ where: { parentId: response.body[0].id } });
    expect(children).toHaveLength(2);
  });

  it('rejects an INVALID_MOVE (target inside source)', async () => {
    const parent = await folder(ownerRootId, 'parent2');
    const child = await folder(parent, 'child2');

    const response = await post(`/${API_PREFIX}/nodes/copy`, {
      ids: [parent],
      targetId: child,
    }).expect(400);

    expect(response.body.code).toBe('INVALID_MOVE');
  });

  it('rejects with NOT_FOUND for a foreign id', async () => {
    const foreignFolder = await folder(ownerRootId, 'foreign');

    const response = await post(`/${API_PREFIX}/nodes/copy`, {
      ids: [foreignFolder],
      targetId: otherRootId, // foreign folder id inside other user's request
    }, otherToken).expect(404);

    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('rejects with READ_ONLY for a share token', async () => {
    const targetFolder = await folder(ownerRootId, 'share-target');
    const shareNode = await folder(ownerRootId, 'share-source');
    
    // Create share token
    const shareRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/shares`)
      .send({ nodeId: shareNode, mode: 'PUBLIC' })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);
      
    const shareToken = shareRes.body.token;

    const response = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/nodes/copy`)
      .send({
        ids: [shareNode],
        targetId: targetFolder,
      })
      .set('Authorization', `Share ${shareToken}`)
      .expect(403);

    expect(response.body.code).toBe('READ_ONLY');
  });

  it('rolls back on failure part-way through a subtree copy (BR-060)', async () => {
    const target = await folder(ownerRootId, 'rollback-target');
    const parent = await folder(ownerRootId, 'rollback-parent');
    await file(parent, 'good-file.txt', 'good');
    await file(parent, 'bad-file.txt', 'bad');

    // Spy on copyObject to throw an error on the second call
    let callCount = 0;
    const originalCopy = storage.copyObject.bind(storage);
    jest.spyOn(storage, 'copyObject').mockImplementation(async (src, dest) => {
      callCount++;
      if (callCount === 2) {
        throw new Error('Injected failure');
      }
      return originalCopy(src, dest);
    });

    await post(`/${API_PREFIX}/nodes/copy`, {
      ids: [parent],
      targetId: target,
    }).expect(500);
    
    // Because we mocked copyObject, the first object was copied, but the transaction aborted so it should have been deleted by catch
    // The spy cleanup restores original copy
    jest.restoreAllMocks();
    
    // Ensure the new node row was not created in target
    const childrenInTarget = await prisma.node.findMany({ where: { parentId: target } });
    expect(childrenInTarget).toHaveLength(0);
  });
});
