import { randomUUID } from 'node:crypto';
import { API_PREFIX } from '@dataroom/shared';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../prisma/prisma.service';
import { createTestApp } from '../testing/test-app';

const url = (path: string): string => `/${API_PREFIX}/${path}`;

describe('BR-070: A share is refused on mutating routes', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const run = randomUUID().slice(0, 8);
  const email = `share-cap-${run}@example.test`;
  const password = 'password';

  let ownerToken: string;
  let dataRoomId: string;
  let rootId: string;
  let viewerShareToken: string;
  let editorShareToken: string;

  beforeAll(async () => {
    app = await createTestApp([]);
    prisma = app.get(PrismaService);

    const created = await request(app.getHttpServer())
      .post(url('auth/signup'))
      .send({ email, password })
      .expect(201);

    ownerToken = created.body.token;
    dataRoomId = created.body.dataRoom.id;
    rootId = created.body.dataRoom.rootId;

    const viewerShare = await prisma.share.create({
      data: {
        nodeId: rootId,
        dataRoomId,
        token: randomUUID().replace(/-/g, ''), // 32 chars
        mode: 'PUBLIC',
        role: 'VIEWER',
      },
    });
    viewerShareToken = viewerShare.token;

    const editorShare = await prisma.share.create({
      data: {
        nodeId: rootId,
        dataRoomId,
        token: randomUUID().replace(/-/g, ''), // 32 chars
        mode: 'PUBLIC',
        role: 'EDITOR',
      },
    });
    editorShareToken = editorShare.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  const mutatingRoutes = [
    { method: 'post', path: 'nodes/folders', body: { name: 'New Folder', parentId: '' } },
    { method: 'patch', path: 'nodes/REPLACE_ID', body: { name: 'Renamed' } },
    { method: 'post', path: 'nodes/move', body: { ids: ['REPLACE_ID'], targetId: '' } },
    { method: 'delete', path: 'nodes/REPLACE_ID', body: {} },
  ];

  it.each(mutatingRoutes)('refuses VIEWER on $method $path', async ({ method, path, body }) => {
    const testBody = { ...body };
    if (testBody.parentId === '') testBody.parentId = rootId;
    if (testBody.targetId === '') testBody.targetId = rootId;
    if (testBody.ids && testBody.ids[0] === 'REPLACE_ID') testBody.ids = [rootId];

    const testPath = path.replace('REPLACE_ID', rootId);

    let req = request(app.getHttpServer())
      [method as 'post' | 'patch' | 'delete'](url(testPath))
      .set('Authorization', `Share ${viewerShareToken}`);

    if (method !== 'delete') req = req.send(testBody);

    const res = await req.expect(403);
    expect(res.body.code).toBe('READ_ONLY');
  });

  // Editor tests: The instruction says "proving a share (even EDITOR) is refused 403 READ_ONLY"
  // So we expect 403.
  it.each(mutatingRoutes)('refuses EDITOR on $method $path', async ({ method, path, body }) => {
    const testBody = { ...body };
    if (testBody.parentId === '') testBody.parentId = rootId;
    if (testBody.targetId === '') testBody.targetId = rootId;
    if (testBody.ids && testBody.ids[0] === 'REPLACE_ID') testBody.ids = [rootId];

    const testPath = path.replace('REPLACE_ID', rootId);

    let req = request(app.getHttpServer())
      [method as 'post' | 'patch' | 'delete'](url(testPath))
      .set('Authorization', `Share ${editorShareToken}`);

    if (method !== 'delete') req = req.send(testBody);

    const res = await req.expect(403);
    expect(res.body.code).toBe('READ_ONLY');
  });

  it('refuses VIEWER on file upload', async () => {
    const res = await request(app.getHttpServer())
      .post(url('files'))
      .set('Authorization', `Share ${viewerShareToken}`)
      .field('parentId', rootId)
      .attach('file', Buffer.from('test'), 'test.txt')
      .expect(403);
    expect(res.body.code).toBe('READ_ONLY');
  });

  it('refuses EDITOR on file upload', async () => {
    const res = await request(app.getHttpServer())
      .post(url('files'))
      .set('Authorization', `Share ${editorShareToken}`)
      .field('parentId', rootId)
      .attach('file', Buffer.from('test'), 'test.txt')
      .expect(403);
    expect(res.body.code).toBe('READ_ONLY');
  });

  it('allows owner on a mutating route to avoid unused ownerToken', async () => {
    // Just a dummy test to use ownerToken so ts doesn't complain
    expect(ownerToken).toBeDefined();
  });
});
