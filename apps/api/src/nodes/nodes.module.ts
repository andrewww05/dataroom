import { Module } from '@nestjs/common';

import { NodeScopeService } from './node-scope.service';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';
import { StorageModule } from '../storage/storage.module';

/**
 * `NodeScopeService` is exported because every later slice's routes — write, upload, share — resolve
 * their node through the same one check (BR-010), and a second copy of it would be a second place
 * ownership could be got wrong.
 */
@Module({
  imports: [StorageModule],
  controllers: [NodesController],
  providers: [NodesService, NodeScopeService],
  exports: [NodeScopeService],
})
export class NodesModule {}
