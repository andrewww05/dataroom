import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { API_PREFIX } from '@dataroom/shared';

export async function createE2eApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

export async function teardownE2eApp(app: INestApplication) {
  await app.close();
}

export async function createTestUser(app: INestApplication, email: string) {
  const res = await request(app.getHttpServer())
    .post(`/${API_PREFIX}/auth/signup`)
    .send({ email, password: 'password123!' });
  return res.body;
}
