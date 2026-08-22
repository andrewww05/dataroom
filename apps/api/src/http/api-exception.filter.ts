import type { ApiError } from '@dataroom/shared';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { Prisma } from '../generated/prisma/client';
import { ApiException, ErrorCode } from './api.exception';

/**
 * Statuses Nest raises on its own behalf, before or around a handler. Without these rows a
 * mistyped URL would be answered as an `INTERNAL` 500 by the catch-all below.
 *
 * The rows for statuses no route can produce yet — `413`, `415` — arrive with the slice whose
 * upload route can produce them (BR-100).
 */
const BY_STATUS: Partial<Record<HttpStatus, { code: ErrorCode; message: string }>> = {
  [HttpStatus.UNAUTHORIZED]: { code: ErrorCode.UNAUTHENTICATED, message: 'Sign in to continue.' },
  [HttpStatus.NOT_FOUND]: { code: ErrorCode.NOT_FOUND, message: 'That does not exist.' },
  [HttpStatus.PAYLOAD_TOO_LARGE]: {
    code: ErrorCode.FILE_TOO_LARGE,
    message: 'That file is too large.',
  },
};

const INTERNAL: ApiError = {
  code: ErrorCode.INTERNAL,
  message: 'Something went wrong. Please try again.',
};

/**
 * Was this a unique violation on the one unique column `User` has?
 *
 * Prisma reports `P2002` with the *fields* the index covers rather than its name, and the pg
 * driver adapter puts them under `driverAdapterError`. The model name alone would do — `User.email`
 * is its only unique index — so the field list is read when present and not depended on.
 */
function isDuplicateEmail(exception: unknown): boolean {
  if (!(exception instanceof Prisma.PrismaClientKnownRequestError) || exception.code !== 'P2002') {
    return false;
  }

  const meta = exception.meta as
    | {
        modelName?: string;
        driverAdapterError?: { cause?: { constraint?: { fields?: string[] } } };
      }
    | undefined;

  if (meta?.modelName !== 'User') return false;

  const fields = meta.driverAdapterError?.cause?.constraint?.fields;
  return fields === undefined || fields.includes('email');
}

/**
 * The one place a failure becomes a response (BR-050). Registered as `APP_FILTER`, so it covers
 * every route including the ones a later slice adds, and `@Catch()` with no argument means nothing
 * escapes in the framework's `{ statusCode, error }` shape.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (exception instanceof ApiException) {
      response.status(exception.getStatus()).json(exception.body);
      return;
    }

    if (isDuplicateEmail(exception)) {
      response
        .status(HttpStatus.CONFLICT)
        .json({ code: ErrorCode.EMAIL_TAKEN, message: 'That email is already registered.' });
      return;
    }

    if (exception instanceof HttpException) {
      const mapped = BY_STATUS[exception.getStatus() as HttpStatus];
      if (mapped) {
        response.status(exception.getStatus()).json(mapped);
        return;
      }
    }

    // Nothing mapped this, so the client learns only that it failed: no stack, no SQL, no file
    // path, no library name. The detail is logged instead, which is the only place it belongs.
    this.logger.error(
      `Unhandled failure on ${request.method} ${request.originalUrl}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(INTERNAL);
  }
}
