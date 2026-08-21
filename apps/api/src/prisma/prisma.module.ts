import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * Global, because every feature module from here on reads or writes rows and re-importing this
 * in each of them buys nothing.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
