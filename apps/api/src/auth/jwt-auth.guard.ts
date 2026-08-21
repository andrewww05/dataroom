import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';

import { UnauthenticatedException } from '../http/api.exception';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Registered as `APP_GUARD`, so every route is closed until `@Public()` opens it (FR-AUTH-030).
 *
 * Per-controller `@UseGuards()` was rejected: it is deny-by-omission — one unannotated controller
 * is an open route and the miss is invisible in review.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }

  /**
   * Passport's own failures — no header, a malformed one, an unresolvable scheme, an expired or
   * forged token — all mean the same thing to a caller, and they leave in the one envelope rather
   * than Nest's `UnauthorizedException` shape (BR-050).
   */
  override handleRequest<TUser>(error: unknown, user: TUser | false): TUser {
    if (error || !user) throw new UnauthenticatedException();

    return user;
  }
}
