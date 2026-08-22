import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom } from 'rxjs';

import { UnauthenticatedException } from '../http/api.exception';
import { IS_PUBLIC_KEY } from './public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { SharePrincipal } from './principal';

/**
 * Registered as `APP_GUARD`, so every route is closed until `@Public()` opens it (FR-AUTH-030).
 *
 * Per-controller `@UseGuards()` was rejected: it is deny-by-omission — one unannotated controller
 * is an open route and the miss is invisible in review.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (authHeader?.startsWith('Share ')) {
      const token = authHeader.substring(6);
      const share = await this.prisma.share.findUnique({
        where: { token },
      });

      if (!share || (share.expiresAt && share.expiresAt < new Date())) {
        throw new UnauthenticatedException();
      }

      const principal: SharePrincipal = {
        kind: 'share',
        shareId: share.id,
        role: share.role,
        rootNodeId: share.nodeId,
        dataRoomId: share.dataRoomId,
      };

      request.user = principal;
      return true;
    }

    const result = super.canActivate(context);
    // Nest's AuthGuard returns a Promise or an Observable. Passport usually returns boolean | Promise
    if (result instanceof Promise) {
      return await result;
    } else if (typeof result === 'boolean') {
      return result;
    } else {
      // In case it's an observable (rxjs), though passport-jwt guard does not use observables.
      // We will assume it's a promise or boolean for simplicity.
      return await firstValueFrom(result);
    }
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
