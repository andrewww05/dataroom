import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { UnauthenticatedException } from '../http/api.exception';
import type { Principal } from './principal';

/**
 * The principal the guard resolved (BR-070). A handler asks for this and never for the
 * `Authorization` header, the raw token or a role name, which is what lets slice 9 add the share
 * kind in one file instead of a pass over every controller.
 *
 * The guard has already run on any route that is not `@Public()`, so a missing principal means the
 * decorator is on a public route — a wiring mistake, and refusing is the safe way to fail.
 */
export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal => {
    const request = context.switchToHttp().getRequest<{ user?: Principal }>();

    if (!request.user) throw new UnauthenticatedException();

    return request.user;
  },
);
