import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { API_PREFIX } from '@dataroom/shared';

// Set a tiny max file bytes for this test so we don't have to upload 100MB
process.env.MAX_FILE_BYTES = '1024';

import type { PrismaClient } from '../generated/prisma/client';
import type { StorageService } from '../storage/storage.service';

describe('FilesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let storage: StorageService;
  let ErrorCode: Record<string, string>;
  let token: string;
  let otherToken: string;
  let rootFolderId: string;
  let otherRootFolderId: string;

  beforeAll(async () => {
    const { createTestApp } = await import('../testing/test-app');
    const { createTestClient } = await import('../prisma/test-client');
    const { StorageService } = await import('../storage/storage.service');
    const { ErrorCode: ec } = await import('../http/api.exception');
    ErrorCode = ec;

    app = await createTestApp();
    prisma = createTestClient();
    storage = app.get(StorageService);

    // Clean up before starting
    await prisma.user.deleteMany();

    // Create user and get token
    const email = `test-${crypto.randomUUID()}@example.com`;
    const password = 'Password123!';
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email, password })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email, password })
      .expect(200);
    token = loginRes.body.token;

    // Get their root folder
    const meRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/auth/me`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    rootFolderId = meRes.body.dataRoom.rootId;

    // Create another user
    const otherEmail = `other-${crypto.randomUUID()}@example.com`;
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email: otherEmail, password })
      .expect(201);
    const otherLoginRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: otherEmail, password })
      .expect(200);
    otherToken = otherLoginRes.body.token;
    const otherMeRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/auth/me`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    otherRootFolderId = otherMeRes.body.dataRoom.rootId;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany();
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  const checkObjectExists = async (key: string) => {
    try {
      await storage.client.send(new HeadObjectCommand({ Bucket: storage.bucket, Key: key }));
      return true;
    } catch (e: unknown) {
      if ((e as Error).name === 'NotFound') return false;
      throw e;
    }
  };

  const TXT_BUFFER = Buffer.from('hello world', 'utf-8');
  const PDF_BUFFER = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\n0000000000 65535 f\n0000000009 00000 n\ntrailer\n<<\n/Size 2\n/Root 1 0 R\n>>\nstartxref\n49\n%%EOF',
    'utf-8',
  );
  const SVG_BUFFER = Buffer.from('<svg></svg>', 'utf-8');

  it('uploads a file successfully', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', rootFolderId)
      .attach('file', TXT_BUFFER, 'test.txt')
      .expect(201);

    expect(res.body).toMatchObject({
      type: 'FILE',
      name: 'test.txt',
      mimeType: 'text/plain',
      sizeBytes: TXT_BUFFER.length,
    });
    expect(res.body.id).toBeDefined();

    // Verify object was put in storage
    const { dataRoomId } = await prisma.node.findUniqueOrThrow({ where: { id: rootFolderId } });
    const exists = await checkObjectExists(`${dataRoomId}/${res.body.id}`);
    expect(exists).toBe(true);
  });

  it('suffixes taken names (BR-020)', async () => {
    // upload same file again
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', rootFolderId)
      .attach('file', TXT_BUFFER, 'test.txt')
      .expect(201);

    expect(res.body.name).toBe('test (2).txt');
  });

  it('refuses SVG (BR-040)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', rootFolderId)
      .attach('file', SVG_BUFFER, 'vector.svg')
      .expect(415);

    expect(res.body.code).toBe(ErrorCode.UNSUPPORTED_TYPE);
  });

  it('refuses mislabelled file (BR-040)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', rootFolderId)
      .attach('file', TXT_BUFFER, 'document.pdf') // fake pdf extension for text content
      .expect(415);

    expect(res.body.code).toBe(ErrorCode.UNSUPPORTED_TYPE);
  });

  it('refuses large file (BR-040)', async () => {
    const largeBuffer = Buffer.alloc(2048); // 2KB > 1KB limit
    const res = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', rootFolderId)
      .attach('file', largeBuffer, 'big.txt')
      .expect(413);

    expect(res.body.code).toBe(ErrorCode.FILE_TOO_LARGE);
  });

  it('refuses unknown parentId (BR-010)', async () => {
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', crypto.randomUUID())
      .attach('file', TXT_BUFFER, 'file.txt')
      .expect(404);
  });

  it('refuses foreign parentId (BR-010)', async () => {
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', otherRootFolderId)
      .attach('file', TXT_BUFFER, 'file.txt')
      .expect(404);
  });

  it('refuses non-folder parentId (BR-010)', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', rootFolderId)
      .attach('file', TXT_BUFFER, 'parent.txt')
      .expect(201);

    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', uploadRes.body.id)
      .attach('file', TXT_BUFFER, 'child.txt')
      .expect(404);
  });

  it('refuses anonymous call', async () => {
    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .field('parentId', rootFolderId)
      .attach('file', TXT_BUFFER, 'anon.txt')
      .expect(401);
  });

  it('generates presigned download url', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', rootFolderId)
      .attach('file', PDF_BUFFER, 'doc.pdf')
      .expect(201);

    const downloadRes = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/files/${uploadRes.body.id}/download`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(downloadRes.body.url).toBeDefined();
    expect(downloadRes.body.url).toContain('http://localhost:9000');
    expect(downloadRes.body.expiresAt).toBeDefined();

    // Actual fetch against minio to verify it yields the uploaded bytes
    const minioRes = await fetch(downloadRes.body.url);
    expect(minioRes.status).toBe(200);
    const bytes = await minioRes.arrayBuffer();
    expect(Buffer.from(bytes).equals(PDF_BUFFER)).toBe(true);
  });

  describe('preview', () => {
    let fileId: string;
    let folderId: string;

    beforeAll(async () => {
      const folderRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/nodes/folders`)
        .set('Authorization', `Bearer ${token}`)
        .send({ parentId: rootFolderId, name: 'preview-folder' })
        .expect(201);
      folderId = folderRes.body.id;

      const uploadRes = await request(app.getHttpServer())
        .post(`/${API_PREFIX}/files`)
        .set('Authorization', `Bearer ${token}`)
        .field('parentId', rootFolderId)
        .attach('file', PDF_BUFFER, 'preview.pdf')
        .expect(201);
      fileId = uploadRes.body.id;
    });

    it('generates presigned preview url', async () => {
      const previewRes = await request(app.getHttpServer())
        .get(`/${API_PREFIX}/files/${fileId}/preview`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(previewRes.body.url).toBeDefined();
      expect(previewRes.body.url).toContain('http://localhost:9000');
      expect(previewRes.body.expiresAt).toBeDefined();

      const minioRes = await fetch(previewRes.body.url);
      expect(minioRes.status).toBe(200);
      expect(minioRes.headers.get('content-disposition')).toContain('inline');
      expect(minioRes.headers.get('content-type')).toContain('application/pdf');
    });

    it('refuses folder id (BR-010)', async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/files/${folderId}/preview`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('refuses unknown id (BR-010)', async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/files/${crypto.randomUUID()}/preview`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('refuses file in another Data Room (BR-010)', async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/files/${fileId}/preview`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    });

    it('refuses anonymous call (FR-AUTH-030)', async () => {
      await request(app.getHttpServer()).get(`/${API_PREFIX}/files/${fileId}/preview`).expect(401);
    });

    it('refuses malformed id (VALIDATION_FAILED)', async () => {
      await request(app.getHttpServer())
        .get(`/${API_PREFIX}/files/not-a-uuid/preview`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  it('deletes object when file is deleted (BR-060)', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', rootFolderId)
      .attach('file', TXT_BUFFER, 'to-delete.txt')
      .expect(201);

    const { dataRoomId } = await prisma.node.findUniqueOrThrow({ where: { id: rootFolderId } });
    const storageKey = `${dataRoomId}/${uploadRes.body.id}`;

    expect(await checkObjectExists(storageKey)).toBe(true);

    await request(app.getHttpServer())
      .delete(`/${API_PREFIX}/nodes/${uploadRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(await checkObjectExists(storageKey)).toBe(false);
  });

  it('deletes objects when folder is deleted (BR-060)', async () => {
    const folderRes = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/nodes/folders`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId: rootFolderId, name: 'folder-to-delete' })
      .expect(201);

    const uploadRes1 = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', folderRes.body.id)
      .attach('file', TXT_BUFFER, 'f1.txt')
      .expect(201);

    const uploadRes2 = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', folderRes.body.id)
      .attach('file', TXT_BUFFER, 'f2.txt')
      .expect(201);

    const { dataRoomId } = await prisma.node.findUniqueOrThrow({ where: { id: rootFolderId } });
    const key1 = `${dataRoomId}/${uploadRes1.body.id}`;
    const key2 = `${dataRoomId}/${uploadRes2.body.id}`;

    expect(await checkObjectExists(key1)).toBe(true);
    expect(await checkObjectExists(key2)).toBe(true);

    await request(app.getHttpServer())
      .delete(`/${API_PREFIX}/nodes/${folderRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(await checkObjectExists(key1)).toBe(false);
    expect(await checkObjectExists(key2)).toBe(false);
  });
});
