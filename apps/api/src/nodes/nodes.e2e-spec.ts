import { API_PREFIX } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import * as crypto from 'crypto';

import { AppModule } from '../app.module';
import { configureApp } from '../bootstrap';
import { PrismaClient } from '../generated/prisma/client';
import { createTestClient } from '../prisma/test-client';

describe('Nodes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;
  let rootNodeId: string;

  beforeAll(async () => {
    prisma = createTestClient();
    
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const email = `test-${crypto.randomUUID()}@example.com`;
    const password = 'Password123!';
    
    const signUpRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email, password })
      .expect(201);
      
    token = signUpRes.body.token;

    const user = await prisma.user.findUnique({ where: { email } });
    const room = await prisma.dataRoom.findFirst({ where: { ownerId: user!.id } });
    const rootNode = await prisma.node.findFirst({ where: { dataRoomId: room!.id, parentId: null } });
    rootNodeId = rootNode!.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  let folderId: string;

  it('creates a folder (201 + FsNode)', async () => {
    const response = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/nodes/folders`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId: rootNodeId, name: 'E2E Folder' })
      .expect(201);

    expect(response.body.type).toBe('FOLDER');
    expect(response.body.name).toBe('E2E Folder');
    expect(response.body.parentId).toBe(rootNodeId);
    folderId = response.body.id;
  });

  it('renames a folder (200 + suffixed name on conflict)', async () => {
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/nodes/folders`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId: rootNodeId, name: 'Conflict Folder' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .patch(`/${API_PREFIX}/nodes/${folderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Conflict Folder' })
      .expect(200);

    expect(response.body.name).toBe('Conflict Folder (2)');
  });
  
  it('stats preflight (200 with real counts)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/nodes/${rootNodeId}/stats`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
      
    expect(response.body.folders).toBeGreaterThanOrEqual(2);
    expect(response.body.files).toBeGreaterThanOrEqual(0);
    expect(response.body.bytes).toBeGreaterThanOrEqual(0);
  });

  it('deletes a folder (204 + subsequent GET returns 404)', async () => {
    await request(app.getHttpServer())
      .delete(`/${API_PREFIX}/nodes/${folderId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/${API_PREFIX}/nodes/${folderId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
