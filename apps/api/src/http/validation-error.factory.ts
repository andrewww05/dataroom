import type { ValidationError } from '@nestjs/common';

import { ValidationFailedException } from './api.exception';

/**
 * Folds class-validator's tree into `details: Record<string, string[]>` — the field name mapped to
 * the reasons it was rejected, which is what a form needs to put a message under each input.
 *
 * Only the constraint messages travel. The `value` class-validator carries alongside them never
 * does, so a rejected password is not echoed back to the caller (FR-AUTH-010).
 */
function fold(
  errors: ValidationError[],
  prefix: string,
  into: Record<string, string[]>,
): Record<string, string[]> {
  for (const error of errors) {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    const messages = Object.values(error.constraints ?? {});

    if (messages.length > 0) {
      into[path] = [...(into[path] ?? []), ...messages];
    }

    if (error.children && error.children.length > 0) {
      fold(error.children, path, into);
    }
  }

  return into;
}

/**
 * Passed to the global `ValidationPipe` so a rejected payload arrives in the one envelope rather
 * than Nest's own `{ statusCode, message, error }` (BR-050).
 */
export function validationExceptionFactory(errors: ValidationError[]): ValidationFailedException {
  return new ValidationFailedException(fold(errors, '', {}));
}
