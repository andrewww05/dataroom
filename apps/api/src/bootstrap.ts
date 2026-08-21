import { API_PREFIX } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';

import { validationExceptionFactory } from './http/validation-error.factory';

/**
 * Everything the HTTP surface needs that cannot be declared inside a module: the global prefix and
 * the validation pipe.
 *
 * `main.ts` and the tests both call this, so a test exercises the same prefix and the same pipe the
 * server runs — a `ValidationPipe` configured only in `main.ts` is a pipe no test ever sees.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // An unknown field is a `400`, not an ignored key: a misspelled property is a bug worth
      // hearing about rather than one silently dropped.
      forbidNonWhitelisted: true,
      // Rejections leave as the one envelope rather than Nest's own shape (BR-050).
      exceptionFactory: validationExceptionFactory,
    }),
  );
}
