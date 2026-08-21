import { Global, Module } from '@nestjs/common';

import { StorageService } from './storage.service';

/** Global for the same reason as PrismaModule: uploads, downloads and deletes all reach for it. */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
