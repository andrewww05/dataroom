import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { readEnv, validateEnv } from './env';

/** Enough to boot, minus whatever a test takes away. */
const COMPLETE = {
  DATABASE_URL: 'postgresql://dataroom:dataroom@localhost:5432/dataroom',
  JWT_SECRET: 'dev-only-not-a-secret',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_BUCKET: 'dataroom',
  S3_ACCESS_KEY: 'minioadmin',
  S3_SECRET_KEY: 'minioadmin',
};

describe('the environment contract', () => {
  describe('BR-100 a process without a signing secret refuses to start', () => {
    it.each([
      ['unset', undefined],
      ['empty', ''],
      ['blank', '   '],
    ])('names JWT_SECRET when it is %s', (_label, value) => {
      const source = { ...COMPLETE, JWT_SECRET: value };

      expect(() => validateEnv(source)).toThrow(/JWT_SECRET/);
    });

    it('aborts the module graph rather than the first request', async () => {
      // `AppModule`'s own composition — `ConfigModule.forRoot({ validate })` — minus the `.env`
      // file, which is the deployment case: the variable is absent from the process environment
      // and there is no file to fall back on. `compile()` rejecting is the boot failing, before
      // any provider is constructed and before a route can answer.
      const previous = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        await expect(
          Test.createTestingModule({
            imports: [ConfigModule.forRoot({ validate: validateEnv, ignoreEnvFile: true })],
          }).compile(),
        ).rejects.toThrow(/JWT_SECRET/);
      } finally {
        process.env.JWT_SECRET = previous;
      }
    });

    it('names every missing variable at once, not one boot at a time', () => {
      expect(() => validateEnv({})).toThrow(/DATABASE_URL.*JWT_SECRET/);
    });
  });

  describe('FR-AUTH-020 the token lifetime is configuration, not a constant', () => {
    it('defaults to seven days', () => {
      expect(readEnv(COMPLETE).jwt).toEqual({ secret: COMPLETE.JWT_SECRET, expiresIn: '7d' });
    });

    it('takes the configured lifetime when one is set', () => {
      expect(readEnv({ ...COMPLETE, JWT_EXPIRES_IN: '30m' }).jwt.expiresIn).toBe('30m');
    });
  });

  describe('BR-040 upload limits are configurable', () => {
    it('defaults maxFileBytes to 100 MB', () => {
      expect(readEnv(COMPLETE).maxFileBytes).toBe(104857600);
    });

    it('takes the configured MAX_FILE_BYTES when one is set', () => {
      expect(readEnv({ ...COMPLETE, MAX_FILE_BYTES: '1024' }).maxFileBytes).toBe(1024);
    });
  });
});
