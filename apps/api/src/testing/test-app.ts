import type { INestApplication, ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../app.module';
import { configureApp } from '../bootstrap';

/**
 * The whole application, wired exactly as `main.ts` wires it — global prefix, validation pipe,
 * exception filter and the guard that closes every route.
 *
 * Tests build this rather than a hand-assembled subset, because half of what they assert *is* the
 * wiring: a missing `APP_GUARD` or a `ValidationPipe` configured only in `main.ts` would pass
 * every test against a narrower graph.
 *
 * Needs the compose stack: `docker compose up -d` and
 * `pnpm --filter @dataroom/api db:migrate`.
 */
export async function createTestApp(
  extraImports: NonNullable<ModuleMetadata['imports']> = [],
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule, ...extraImports],
  }).compile();

  // Boot chatter would bury the assertions. Spies on `Logger.prototype` still see every call, so
  // the tests that assert on what was logged are unaffected.
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();

  return app;
}
