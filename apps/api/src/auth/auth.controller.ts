import type { AuthResponse, AuthUser, DataRoom } from '@dataroom/shared';
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UnauthenticatedException } from '../http/api.exception';

import { AuthService } from './auth.service';
import { CurrentPrincipal } from './current-principal.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import type { Principal } from './principal';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Public: a caller with no token is how one is obtained. */
  @Public()
  @Post('signup')
  signUp(@Body() body: SignUpDto): Promise<AuthResponse> {
    return this.auth.signUp(body);
  }

  @Public()
  @Post('login')
  // Signing in creates nothing, so it answers `200` where sign-up answers Nest's `201`.
  @HttpCode(HttpStatus.OK)
  signIn(@Body() body: SignInDto): Promise<AuthResponse> {
    return this.auth.signIn(body);
  }

  /** The caller, their room and its root in one call, so the shell needs no second request. */
  @Get('me')
  me(@CurrentPrincipal() principal: Principal): Promise<AuthUser & { dataRoom: DataRoom }> {
    if (principal.kind !== 'owner') {
      throw new UnauthenticatedException();
    }
    return this.auth.me(principal);
  }
}
