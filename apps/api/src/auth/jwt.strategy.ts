import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { readEnv } from '../config/env';
import type { Principal } from './principal';

interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Turns a bearer token into a principal, and nothing more: no query runs here, so the guard costs
 * no round trip and slice 9 adds its share branch beside this one.
 *
 * `sub` is trusted without a lookup — a token outlives its user until it expires. `/auth/me` is
 * where that is caught, and every scoped query in a later slice finds nothing for a deleted user
 * anyway, which is BR-010's `404`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const { jwt } = readEnv();

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwt.secret,
      ignoreExpiration: false,
      // Named explicitly so a token claiming `alg: none`, or any algorithm this deployment does
      // not sign with, is refused instead of being verified on the token's own terms.
      algorithms: ['HS256'],
    });
  }

  validate(payload: JwtPayload): Principal {
    return { kind: 'owner', userId: payload.sub };
  }
}
