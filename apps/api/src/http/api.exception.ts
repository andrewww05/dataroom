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
  INVALID_NAME: 'INVALID_NAME',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INTERNAL: 'INTERNAL',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
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

/**
 * A row the caller has no claim on, and a row that does not exist (BR-010, FR-ROOM-030).
 *
 * No argument to vary, exactly as `InvalidCredentialsException` takes none: the two cases must be
 * byte-identical, or a refusal that confirmed the row existed would let the tree be mapped by
 * guessing ids. The message is the filter's own `NOT_FOUND` row, so a `404` raised by Nest for an
 * unrouted URL and one thrown here read the same.
 */
export class NotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'That does not exist.');
  }
}

export class EmailTakenException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, ErrorCode.EMAIL_TAKEN, 'That email is already registered.');
  }
}

export class ValidationFailedException extends ApiException {
  constructor(details: Record<string, string[]>) {
    super(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, 'Some fields need fixing.', details);
  }
}

/** Thrown when a file or folder name violates BR-020 constraints. */
export class InvalidNameException extends ApiException {
  constructor() {
    super(HttpStatus.BAD_REQUEST, ErrorCode.INVALID_NAME, 'That name is not allowed.');
  }
}

export class FileTooLargeException extends ApiException {
  constructor() {
    super(HttpStatus.PAYLOAD_TOO_LARGE, ErrorCode.FILE_TOO_LARGE, 'That file is too large.');
  }
}

export class UnsupportedTypeException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      ErrorCode.UNSUPPORTED_TYPE,
      'That file type is not allowed.',
    );
  }
}

export class StorageUnavailableException extends ApiException {
  constructor() {
    super(
      HttpStatus.BAD_GATEWAY,
      ErrorCode.STORAGE_UNAVAILABLE,
      'The storage service is temporarily unavailable.',
    );
  }
}
