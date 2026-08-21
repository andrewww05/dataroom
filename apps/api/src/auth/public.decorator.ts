import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opens one route — or one controller — to an anonymous caller. Everything else is closed by the
 * global `JwtAuthGuard`, so a route added without any annotation is protected rather than open
 * (FR-AUTH-030).
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
