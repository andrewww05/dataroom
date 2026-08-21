import { randomUUID } from 'node:crypto';

import { API_PREFIX } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';
import { createTestApp } from '../testing/test-app';
import { AuthService } from './auth.service';

const SIGNUP = `/${API_PREFIX}/auth/signup`;
const LOGIN = `/${API_PREFIX}/auth/login`;
const ME = `/${API_PREFIX}/auth/me`;
const PASSWORD = 'correct horse battery';

/**
 * The account rules against the compose Postgres: FR-AUTH-010, FR-AUTH-050, FR-ROOM-010 and
 * BR-060's rollback. Needs `docker compose up -d` and
 * `pnpm --filter @dataroom/api db:migrate`.
 */
describe('sign-up (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  /** Every address in this file carries it, so the run cleans up only after itself. */
  const run = randomUUID().slice(0, 8);
  const emailFor = (name: string): string => `${name}-${run}@example.test`;

  /** Everything the Nest logger was handed while these requests were served. */
  const logged: string[] = [];

  beforeAll(async () => {
    for (const level of ['log', 'error', 'warn', 'debug', 'verbose', 'fatal'] as const) {
      jest.spyOn(Logger.prototype, level).mockImplementation((...args: unknown[]): void => {
        logged.push(
          args
            .map((arg) => (arg instanceof Error ? (arg.stack ?? arg.message) : String(arg)))
            .join(' '),
        );
      });
    }

    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Deleting the users cascades to their rooms and nodes (FR-ROOM-020).
    await prisma.user.deleteMany({ where: { email: { contains: run } } });
    await app.close();
    jest.restoreAllMocks();
  });

  const signUp = (email: string, password = PASSWORD) =>
    request(app.getHttpServer()).post(SIGNUP).send({ email, password });

  /** Rows for one address, counted across all three tables at once. */
  async function rowsFor(email: string): Promise<{ users: number; rooms: number; nodes: number }> {
    const [users, rooms, nodes] = await Promise.all([
      prisma.user.count({ where: { email } }),
      prisma.dataRoom.count({ where: { owner: { email } } }),
      prisma.node.count({ where: { dataRoom: { owner: { email } } } }),
    ]);

    return { users, rooms, nodes };
  }

  describe('FR-AUTH-010 the happy path', () => {
    it('answers 201 with the user and their room, and no credential anywhere in the body', async () => {
      const email = emailFor('happy');

      const response = await signUp(email).expect(201);

      expect(response.body).toEqual({
        token: expect.any(String) as string,
        user: { id: expect.any(String) as string, email },
        dataRoom: {
          id: expect.any(String) as string,
          name: `happy-${run}'s Data Room`,
          rootId: expect.any(String) as string,
        },
      });

      const body = JSON.stringify(response.body);
      expect(body).not.toContain(PASSWORD);
      expect(body).not.toContain('$argon2');
    });

    it('FR-AUTH-050 leaves exactly one room holding exactly one parentless folder', async () => {
      const email = emailFor('one-room');

      const response = await signUp(email).expect(201);

      const rooms = await prisma.dataRoom.findMany({ where: { owner: { email } } });
      expect(rooms).toHaveLength(1);
      expect(rooms[0].id).toBe(response.body.dataRoom.id);

      const nodes = await prisma.node.findMany({ where: { dataRoomId: rooms[0].id } });
      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toMatchObject({
        id: response.body.dataRoom.rootId as string,
        parentId: null,
        type: 'FOLDER',
      });
    });

    it('stores the password as an argon2 hash and nothing else', async () => {
      const email = emailFor('hashed');

      await signUp(email).expect(201);

      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      expect(user.passwordHash).not.toContain(PASSWORD);
      expect(user.passwordHash.startsWith('$argon2id$')).toBe(true);
      await expect(
        request(app.getHttpServer()).post(LOGIN).send({ email, password: PASSWORD }),
      ).resolves.toMatchObject({ status: 200 });
    });

    it('FR-AUTH-050 gives two emails their own room and their own root', async () => {
      const first = await signUp(emailFor('first')).expect(201);
      const second = await signUp(emailFor('second')).expect(201);

      expect(first.body.dataRoom.id).not.toBe(second.body.dataRoom.id);
      expect(first.body.dataRoom.rootId).not.toBe(second.body.dataRoom.rootId);

      await expect(
        prisma.node.count({ where: { dataRoomId: first.body.dataRoom.id } }),
      ).resolves.toBe(1);
    });
  });

  describe('FR-AUTH-010 one address is one account', () => {
    it('refuses a second sign-up on the same email', async () => {
      const email = emailFor('duplicate');
      await signUp(email).expect(201);

      const response = await signUp(email, 'a different password').expect(409);

      expect(response.body.code).toBe('EMAIL_TAKEN');
      await expect(rowsFor(email)).resolves.toEqual({ users: 1, rooms: 1, nodes: 1 });
    });

    it('refuses a variant differing only in case and surrounding space', async () => {
      const email = emailFor('variant');
      await signUp(email).expect(201);

      const response = await signUp(`  ${email.toUpperCase()}  `).expect(409);

      expect(response.body.code).toBe('EMAIL_TAKEN');
      await expect(rowsFor(email)).resolves.toEqual({ users: 1, rooms: 1, nodes: 1 });
    });

    it('FR-AUTH-050 answers two concurrent sign-ups with one 201 and one 409', async () => {
      const email = emailFor('race');

      const statuses = (await Promise.all([signUp(email), signUp(email)])).map(
        (response) => response.status,
      );

      expect(statuses.slice().sort((a, b) => a - b)).toEqual([201, 409]);
      await expect(rowsFor(email)).resolves.toEqual({ users: 1, rooms: 1, nodes: 1 });
    });
  });

  describe('FR-AUTH-010 a rejected payload creates nothing', () => {
    it('refuses a 7-character password, naming the field but not its value', async () => {
      const email = emailFor('short');

      const response = await signUp(email, '1234567').expect(400);

      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(Object.keys(response.body.details)).toEqual(['password']);
      expect(JSON.stringify(response.body)).not.toContain('1234567');
      await expect(rowsFor(email)).resolves.toEqual({ users: 0, rooms: 0, nodes: 0 });
    });

    it('refuses an address that is not an email', async () => {
      const response = await signUp('not-an-email').expect(400);

      expect(response.body.code).toBe('VALIDATION_FAILED');
      await expect(prisma.user.count({ where: { email: 'not-an-email' } })).resolves.toBe(0);
    });

    it('BR-060 leaves nothing behind when the write fails after the user row', async () => {
      const email = emailFor('rollback');
      const real = prisma.$transaction.bind(prisma) as (
        callback: (tx: object) => Promise<unknown>,
      ) => Promise<unknown>;

      // The failure has to land *inside* the transaction — after the user insert, before the root
      // node — so it is injected into the transaction client the service's own callback is handed.
      // The service still writes the user and the room; only the last write fails, and what is
      // under test is that the rollback takes the other two rows with it.
      const spy = jest.spyOn(prisma, '$transaction').mockImplementation(((
        callback: (tx: object) => Promise<unknown>,
      ) =>
        real((tx) =>
          callback(
            new Proxy(tx, {
              get: (target, property) =>
                property === 'node'
                  ? { create: (): Promise<never> => Promise.reject(new Error('injected failure')) }
                  : (Reflect.get(target, property) as unknown),
            }),
          ),
        )) as unknown as typeof prisma.$transaction);

      try {
        await signUp(email).expect(500);
      } finally {
        spy.mockRestore();
      }

      await expect(rowsFor(email)).resolves.toEqual({ users: 0, rooms: 0, nodes: 0 });
    });
  });

  describe('FR-ROOM-010 the room is named after the local part', () => {
    it('names it in the sign-up body and in /auth/me alike', async () => {
      const email = emailFor('named');
      const expected = `named-${run}'s Data Room`;

      const created = await signUp(email).expect(201);
      expect(created.body.dataRoom.name).toBe(expected);

      const me = await request(app.getHttpServer())
        .get(ME)
        .set('Authorization', `Bearer ${created.body.token as string}`)
        .expect(200);

      expect(me.body).toEqual({
        id: created.body.user.id,
        email,
        dataRoom: created.body.dataRoom,
      });
    });

    it('calls neither the room nor its root folder "Root"', async () => {
      const created = await signUp(emailFor('not-root')).expect(201);

      expect(created.body.dataRoom.name).not.toBe('Root');

      const root = await prisma.node.findUniqueOrThrow({
        where: { id: created.body.dataRoom.rootId as string },
      });
      expect(root.name).not.toBe('Root');
      expect(root.name).toBe(created.body.dataRoom.name);
    });

    it('cuts the local part, never the suffix, when the column is too short', async () => {
      // Straight at the service: `@IsEmail()` enforces the RFC's 64-character local part, so no
      // request can reach this branch — but a seed script or an import could.
      const email = `${'a'.repeat(300)}-${run}@example.test`;

      const created = await app.get(AuthService).signUp({ email, password: PASSWORD });

      expect(created.dataRoom.name).toHaveLength(255);
      expect(created.dataRoom.name.endsWith("'s Data Room")).toBe(true);

      const room = await prisma.dataRoom.findUniqueOrThrow({ where: { id: created.dataRoom.id } });
      expect(room.name).toBe(created.dataRoom.name);
    });
  });

  /**
   * Last on purpose: it asserts on what every request above logged (FR-AUTH-010, BR-050). The
   * hashes come from the rows those requests wrote, so this catches a hash reaching a log line
   * even though no test knows it in advance.
   */
  it('logged neither a submitted password nor a stored hash', async () => {
    const users = await prisma.user.findMany({
      where: { email: { contains: run } },
      select: { passwordHash: true },
    });

    expect(users.length).toBeGreaterThan(0);
    expect(logged.length).toBeGreaterThan(0); // the capture is wired, not silently empty

    const transcript = logged.join('\n');
    expect(transcript).not.toContain(PASSWORD);
    expect(transcript).not.toContain('$argon2');

    for (const { passwordHash } of users) {
      expect(transcript).not.toContain(passwordHash);
    }
  });
});
