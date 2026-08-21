import { API_PREFIX } from '@dataroom/shared';
import { Body, Controller, Get, INestApplication, Logger, Module, Post } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { IsEmail } from 'class-validator';
import request from 'supertest';

import { configureApp } from '../bootstrap';
import { ApiExceptionFilter } from './api-exception.filter';

class ProbeDto {
  @IsEmail()
  email!: string;
}

/**
 * Stands in for a route that fails in a way the filter has no code for. Kept to the test module so
 * no such route ships (BR-100).
 */
@Controller('probe')
class ProbeController {
  @Post()
  accept(@Body() body: ProbeDto): ProbeDto {
    return body;
  }

  @Get('boom')
  boom(): never {
    throw new Error('SELECT * FROM "User" -- /Users/someone/secret/path.ts');
  }
}

@Module({
  controllers: [ProbeController],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
})
class ProbeModule {}

/** BR-050: one envelope, and nothing escapes in the framework's own shape. */
describe('ApiExceptionFilter', () => {
  let app: INestApplication;
  const logged: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ProbeModule] }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(() => {
    logged.length = 0;
    jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation((...args: unknown[]) => void logged.push(args.map(String).join(' ')));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const url = (path: string): string => `/${API_PREFIX}/${path}`;

  it('rejects an unknown field, naming it in details', async () => {
    const response = await request(app.getHttpServer())
      .post(url('probe'))
      .send({ email: 'ada@example.test', passwordConfirm: 'extra' })
      .expect(400);

    expect(response.body.code).toBe('VALIDATION_FAILED');
    expect(typeof response.body.message).toBe('string');
    expect(Object.keys(response.body.details)).toEqual(['passwordConfirm']);
    expect(response.body.details.passwordConfirm.join(' ')).toContain('passwordConfirm');
  });

  it('names every rejected field without echoing what was submitted', async () => {
    const response = await request(app.getHttpServer())
      .post(url('probe'))
      .send({ email: 'not-an-email' })
      .expect(400);

    expect(response.body.details.email).toHaveLength(1);
    expect(JSON.stringify(response.body)).not.toContain('not-an-email');
  });

  it('answers an unmapped failure as a generic 500', async () => {
    const response = await request(app.getHttpServer()).get(url('probe/boom')).expect(500);

    expect(response.body).toEqual({
      code: 'INTERNAL',
      message: expect.stringMatching(/./) as unknown as string,
    });

    const body = JSON.stringify(response.body);
    expect(body).not.toContain('SELECT');
    expect(body).not.toContain('.ts');
    expect(body).not.toContain('at ');
  });

  it('logs the cause and its stack instead of returning it', async () => {
    await request(app.getHttpServer()).get(url('probe/boom')).expect(500);

    const entry = logged.join('\n');
    expect(entry).toContain('GET /api/probe/boom');
    expect(entry).toContain('SELECT * FROM "User"');
    expect(entry).toContain('api-exception.filter.spec.ts'); // the stack, not just the message
  });

  it('answers an unmatched route in the same envelope', async () => {
    const response = await request(app.getHttpServer()).get(url('nothing-here')).expect(404);

    expect(response.body).toEqual({ code: 'NOT_FOUND', message: expect.any(String) as string });
  });

  it('never answers in Nest own statusCode/error shape', async () => {
    const responses = await Promise.all([
      request(app.getHttpServer()).post(url('probe')).send({ nope: 1 }),
      request(app.getHttpServer()).get(url('probe/boom')),
      request(app.getHttpServer()).get(url('nothing-here')),
    ]);

    for (const response of responses) {
      expect(response.body).not.toHaveProperty('statusCode');
      expect(response.body).not.toHaveProperty('error');
      expect(response.body.code).toEqual(expect.any(String));
      expect(response.body.message).toEqual(expect.any(String));
    }
  });
});
