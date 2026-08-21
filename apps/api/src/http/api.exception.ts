import type { ApiError } from '@dataroom/shared';
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * The codes this slice emits. docs/03 § Errors is the whole table; a slice adds the rows for the
 * failures its routes can actually produce, so no code exists without a way to reach it (BR-100).
 */
export const ErrorCode = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INTERNAL: 'INTERNAL',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** `details` is absent rather than empty when a failure is not field-by-field. */
function envelope(code: ErrorCode, message: string, details?: Record<string, string[]>): ApiError {
  return details ? { code, message, details } : { code, message };
}

/**
 * A failure that already knows its code, its message and its status (BR-050).
 *
 * It carries the response body Nest would otherwise invent, so `ApiExceptionFilter` writes it
 * straight out and every handler throws in the same shape.
 */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    code: ErrorCode,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(envelope(code, message, details), status);
  }

  /** Narrower than `HttpException.getResponse()`, which is typed as `string | object`. */
  get body(): ApiError {
    return this.getResponse() as ApiError;
  }
}

/** No principal could be resolved: the token is absent, malformed, expired, forged or orphaned. */
export class UnauthenticatedException extends ApiException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHENTICATED, 'Sign in to continue.');
  }
}

/**
 * A wrong password and an unknown email both throw this, with no argument to vary — the two
 * responses are byte-identical, so neither discloses which accounts exist (FR-AUTH-020).
 */
export class InvalidCredentialsException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      ErrorCode.INVALID_CREDENTIALS,
      'That email and password do not match an account.',
    );
  }
}

export class EmailTakenException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, ErrorCode.EMAIL_TAKEN, 'That email is already registered.');
  }
}

/** Thrown by the `ValidationPipe`'s `exceptionFactory`; `details` names each rejected field. */
export class ValidationFailedException extends ApiException {
  constructor(details: Record<string, string[]>) {
    super(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, 'Some fields need fixing.', details);
  }
}
