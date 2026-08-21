import { randomUUID } from 'node:crypto';

import { API_PREFIX } from '@dataroom/shared';
import { Controller, Get, INestApplication, Module, Query } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';
import { createTestApp } from '../testing/test-app';
import { CurrentPrincipal } from './current-principal.decorator';
import type { Principal } from './principal';

/**
 * A route with no annotation at all, which is the point: it has to refuse an anonymous caller
 * because protection is the default, not something someone remembered to add (FR-AUTH-030).
 */
@Controller('probe')
class ProbeController {
  @Get('who')
  who(
    @CurrentPrincipal() principal: Principal,
    // Named by the caller and ignored on purpose: a handler acts as the token's owner, never as
    // whoever the query or body says (BR-010).
    @Query('userId') _claimed?: string,
  ): Principal {
    return principal;
  }
}

@Module({ controllers: [ProbeController] })
class ProbeModule {}

const url = (path: string): string => `/${API_PREFIX}/${path}`;
const encode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');

describe('JwtAuthGuard (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  const run = randomUUID().slice(0, 8);
  const email = `guard-${run}@example.test`;
  const password = 'correct horse battery';

  let userId: string;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp([ProbeModule]);
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    const created = await request(app.getHttpServer())
      .post(url('auth/signup'))
      .send({ email, password })
      .expect(201);

    userId = created.body.user.id;
    token = created.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: run } } });
    await app.close();
  });

  const get = (path: string, authorization?: string) => {
    const pending = request(app.getHttpServer()).get(url(path));

    return authorization ? pending.set('Authorization', authorization) : pending;
  };

  describe('FR-AUTH-030 a request with no resolvable principal is refused', () => {
    const refused: [string, () => string | undefined][] = [
      ['no Authorization header', () => undefined],
      ['Bearer with nothing after it', () => 'Bearer'],
      ['a Basic header', () => `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`],
      // The scheme slice 9 will resolve to a read-only principal, and which resolves to nothing
      // today: unresolvable is refused, never partially trusted (BR-070).
      ['a Share scheme this deployment cannot resolve', () => `Share ${randomUUID()}`],
      ['a token that is not a token', () => 'Bearer not.a.token'],
      [
        'an expired token',
        () => `Bearer ${jwt.sign({ sub: userId, email }, { expiresIn: '-10s' })}`,
      ],
      [
        'a token signed with another secret',
        () =>
          `Bearer ${jwt.sign({ sub: userId, email }, { secret: 'not-this-deployments-secret' })}`,
      ],
      [
        'a token with no signature',
        () => `Bearer ${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: userId, email })}.`,
      ],
      [
        'a token claiming alg: none',
        () => `Bearer ${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: userId, email })}.`,
      ],
      [
        'a token whose payload was edited under a kept signature',
        () => {
          const [header, , signature] = token.split('.');

          return `Bearer ${header}.${encode({ sub: randomUUID(), email: 'someone@else.test' })}.${signature}`;
        },
      ],
    ];

    it.each(refused)('refuses %s', async (_label, authorization) => {
      const response = await get('auth/me', authorization()).expect(401);

      expect(response.body).toEqual({
        code: 'UNAUTHENTICATED',
        message: expect.any(String) as string,
      });
    });

    it('refuses an anonymous call to a route that carries no annotation', async () => {
      const response = await get('probe/who').expect(401);

      expect(response.body.code).toBe('UNAUTHENTICATED');
    });

    it('refuses a well-formed token whose user row is gone', async () => {
      const created = await request(app.getHttpServer())
        .post(url('auth/signup'))
        .send({ email: `deleted-${run}@example.test`, password })
        .expect(201);

      await prisma.user.delete({ where: { id: created.body.user.id } });

      const response = await get('auth/me', `Bearer ${created.body.token as string}`).expect(401);

      expect(response.body.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('BR-010 a valid token resolves to exactly one principal', () => {
    it('reaches the handler as the token owner', async () => {
      const response = await get('probe/who', `Bearer ${token}`).expect(200);

      expect(response.body).toEqual({ kind: 'owner', userId });
    });

    it('ignores a caller naming another user', async () => {
      const response = await request(app.getHttpServer())
        .get(`${url('probe/who')}?userId=${randomUUID()}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.userId).toBe(userId);
    });
  });

  describe('FR-AUTH-030 the public routes answer without a token', () => {
    it('serves health and the demo listing anonymously', async () => {
      await get('health').expect(200);
      await get('documents').expect(200);
    });

    it('serves sign-in anonymously, which is how a token is obtained', async () => {
      await request(app.getHttpServer())
        .post(url('auth/login'))
        .send({ email, password })
        .expect(200);
    });
  });
});
