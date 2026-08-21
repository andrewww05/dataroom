import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { validateEnv } from './config/env';
import { DocumentsModule } from './documents/documents.module';
import { HealthModule } from './health/health.module';
import { ApiExceptionFilter } from './http/api-exception.filter';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    // `validate` runs before any provider is constructed, so a missing connection variable fails
    // the boot with the variable named rather than the first request with a 500.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    StorageModule,
    AuthModule,
    HealthModule,
    DocumentsModule,
  ],
  providers: [
    // One filter for every route, including the ones later slices add (BR-050).
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    // Closed by default: a route added without `@Public()` refuses an anonymous caller
    // (FR-AUTH-030), so protection is never a thing someone has to remember.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
