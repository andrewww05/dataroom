import { randomUUID } from 'node:crypto';

import { API_PREFIX } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';
import { createTestApp } from '../testing/test-app';
import { encodeCursor } from './cursor';

/**
 * BR-010 and FR-ROOM-030 through the HTTP surface: two owners in one database, and every route that
 * names a node refusing alike. The rule itself is asserted at service level in
 * `node-scope.service.spec.ts`; this is the part that catches a route which forgot to ask.
 *
 * Requires the compose stack and an applied migration.
 */
describe('BR-010 scope on the node read routes', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const run = randomUUID().slice(0, 8);
  const password = 'correct horse battery';

  let myToken: string;
  let myRootId: string;
  let myFolderId: string;
  let theirRootId: string;
  let theirFolderId: string;

  /** Every shape of id a caller can name and not be entitled to. */
  let refusedIds: { label: string; id: string }[];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const mine = await signUp(`scope-mine-${run}`);
    myToken = mine.token;
    myRootId = mine.rootId;
    myFolderId = (await createFolder(mine.dataRoomId, mine.rootId, 'Mine')).id;

    const theirs = await signUp(`scope-theirs-${run}`);
    theirRootId = theirs.rootId;
    theirFolderId = (await createFolder(theirs.dataRoomId, theirs.rootId, 'Theirs')).id;

    refusedIds = [
      { label: "another owner's root", id: theirRootId },
      { label: "another owner's folder", id: theirFolderId },
      { label: 'an id no row has', id: randomUUID() },
      // `Node.id` is TEXT, so this matches nothing rather than raising: `404`, never `500`.
      { label: 'an id that is not well-formed', id: 'not-an-id-at-all' },
    ];
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: run } } });
    await app.close();
  });

  async function signUp(
    slug: string,
  ): Promise<{ token: string; dataRoomId: string; rootId: string }> {
    const response = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email: `${slug}@example.test`, password })
      .expect(201);

    return {
      token: response.body.token,
      dataRoomId: response.body.dataRoom.id,
      rootId: response.body.dataRoom.rootId,
    };
  }

  function createFolder(
    dataRoomId: string,
    parentId: string,
    name: string,
  ): Promise<{ id: string }> {
    // Written straight to the database: no write route exists until slice 5.
    return prisma.node.create({
      data: { dataRoomId, parentId, type: 'FOLDER', name },
      select: { id: true },
    });
  }

  /** The four routes, so no single one can be the one that leaks. */
  const routes = (id: string) => [
    { label: 'GET /nodes/:id', path: `/${API_PREFIX}/nodes/${id}` },
    { label: 'GET /nodes/:id/children', path: `/${API_PREFIX}/nodes/${id}/children` },
    { label: 'GET /nodes/:id/path', path: `/${API_PREFIX}/nodes/${id}/path` },
    { label: 'GET /nodes/:id/stats', path: `/${API_PREFIX}/nodes/${id}/stats` },
  ];

  it('answers 404 NOT_FOUND on every route for every id the caller has no claim on', async () => {
    for (const { label, id } of refusedIds) {
      for (const route of routes(id)) {
        const response = await request(app.getHttpServer())
          .get(route.path)
          .set('Authorization', `Bearer ${myToken}`);

        expect({ route: route.label, id: label, status: response.status }).toEqual({
          route: route.label,
          id: label,
          // Never 403: a refusal that confirmed the row existed would let the tree be mapped.
          status: 404,
        });
        expect(response.body.code).toBe('NOT_FOUND');
      }
    }
  });

  it('makes a foreign node and a missing one byte-identical', async () => {
    const bodies = new Set<string>();

    for (const { id } of refusedIds) {
      for (const route of routes(id)) {
        const response = await request(app.getHttpServer())
          .get(route.path)
          .set('Authorization', `Bearer ${myToken}`)
          .expect(404);

        bodies.add(JSON.stringify(response.body));
      }
    }

    // One body for all sixteen: nothing discloses which of the two cases it was.
    expect(bodies.size).toBe(1);
  });

  it('names nothing about the other room in a refusal', async () => {
    const response = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/nodes/${theirFolderId}/stats`)
      .set('Authorization', `Bearer ${myToken}`)
      .expect(404);

    const body = JSON.stringify(response.body);

    expect(Object.keys(response.body).sort()).toEqual(['code', 'message']);
    for (const leak of ['Theirs', 'Data Room', run, theirRootId, theirFolderId]) {
      expect(body).not.toContain(leak);
    }
  });

  it('refuses a foreign folder carrying a valid cursor without returning a row of it', async () => {
    // A well-formed cursor from this endpoint's own codec, so the refusal is the scope check rather
    // than cursor validation — the check has to precede the listing query (BR-010).
    const cursor = encodeCursor({ type: 'FOLDER', name: '', id: '' });

    const response = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/nodes/${theirRootId}/children`)
      .query({ cursor })
      .set('Authorization', `Bearer ${myToken}`)
      .expect(404);

    expect(response.body).toEqual({ code: 'NOT_FOUND', message: expect.any(String) });
    expect(response.body.items).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('Theirs');
  });

  it('refuses every route with no Authorization header', async () => {
    for (const route of routes(myRootId)) {
      const response = await request(app.getHttpServer()).get(route.path).expect(401);

      expect(response.body.code).toBe('UNAUTHENTICATED');
    }
  });

  it("keeps the caller's own reads working with a second room in the database", async () => {
    for (const route of routes(myFolderId)) {
      await request(app.getHttpServer())
        .get(route.path)
        .set('Authorization', `Bearer ${myToken}`)
        .expect(200);
    }

    const node = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/nodes/${myFolderId}`)
      .set('Authorization', `Bearer ${myToken}`)
      .expect(200);

    expect(node.body.name).toBe('Mine');
  });
});
