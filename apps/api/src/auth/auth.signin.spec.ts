import { randomUUID } from 'node:crypto';

import { API_PREFIX } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';
import { createTestApp } from '../testing/test-app';

const LOGIN = `/${API_PREFIX}/auth/login`;
const ME = `/${API_PREFIX}/auth/me`;

/** FR-AUTH-020: the token a correct pair buys, and the answer a wrong one gets. */
describe('sign-in (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const run = randomUUID().slice(0, 8);
  const email = `signin-${run}@example.test`;
  const password = 'correct horse battery';

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email, password })
      .expect(201);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: run } } });
    await app.close();
  });

  const login = (body: unknown) =>
    request(app.getHttpServer())
      .post(LOGIN)
      .send(body as object);

  it('answers a correct pair with a token that opens a protected route', async () => {
    const response = await login({ email, password }).expect(200);

    expect(response.body.user.email).toBe(email);
    expect(response.body.dataRoom.name).toBe(`signin-${run}'s Data Room`);

    const me = await request(app.getHttpServer())
      .get(ME)
      .set('Authorization', `Bearer ${response.body.token as string}`)
      .expect(200);

    expect(me.body.id).toBe(response.body.user.id);
  });

  it('accepts the registered address in any case, with space around it', async () => {
    const response = await login({ email: `  ${email.toUpperCase()}  `, password }).expect(200);

    expect(response.body.user.email).toBe(email);
  });

  it('issues no refresh token alongside', async () => {
    const response = await login({ email, password }).expect(200);

    expect(Object.keys(response.body).sort()).toEqual(['dataRoom', 'token', 'user']);
  });

  it('answers a wrong password and an unknown email identically', async () => {
    const wrongPassword = await login({ email, password: 'not the password' }).expect(401);
    const unknownEmail = await login({
      email: `nobody-${run}@example.test`,
      password,
    }).expect(401);

    expect(wrongPassword.body).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: expect.any(String) as string,
    });
    // Byte-identical, so the response discloses nothing about which accounts exist.
    expect(JSON.stringify(unknownEmail.body)).toBe(JSON.stringify(wrongPassword.body));
    expect(unknownEmail.body.token).toBeUndefined();
  });

  it('leaves no room for a caller to sign in with the stored hash', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    await login({ email, password: user.passwordHash }).expect(401);
  });
});
