import { Module } from '@nestjs/common';
import { DataRoomsController } from './data-rooms.controller';
import { DataRoomsService } from './data-rooms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DataRoomsController],
  providers: [DataRoomsService],
})
export class DataRoomsModule {}
