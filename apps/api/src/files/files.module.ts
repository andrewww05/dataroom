import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { NodesModule } from '../nodes/nodes.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [NodesModule, StorageModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
