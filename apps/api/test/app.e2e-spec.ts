import { API_PREFIX } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(API_PREFIX);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`GET /${API_PREFIX}/health`, async () => {
    const response = await request(app.getHttpServer()).get(`/${API_PREFIX}/health`).expect(200);

    expect(response.body.status).toBe('ok');
  });

  it(`GET /${API_PREFIX}/documents`, async () => {
    const response = await request(app.getHttpServer()).get(`/${API_PREFIX}/documents`).expect(200);

    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.total).toBe(response.body.items.length);
  });
});
