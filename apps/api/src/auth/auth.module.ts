import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { readEnv } from '../config/env';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

/** `jsonwebtoken` types this as an `ms` template literal, which an env string cannot satisfy. */
type ExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      // Read here rather than at import time, so `validateEnv` has already refused to boot a
      // process without JWT_SECRET by the time this runs (BR-100).
      useFactory: () => {
        const { jwt } = readEnv();

        return {
          secret: jwt.secret,
          signOptions: { expiresIn: jwt.expiresIn as ExpiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
