import { Controller, Get, Param } from '@nestjs/common';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import type { Principal } from '../auth/principal';
import { DataRoomsService } from './data-rooms.service';
import type { RoomUsage } from '@dataroom/shared';

@Controller('data-rooms')
export class DataRoomsController {
  constructor(private readonly dataRooms: DataRoomsService) {}

  @Get(':id/usage')
  getUsage(@CurrentPrincipal() principal: Principal, @Param('id') id: string): Promise<RoomUsage> {
    return this.dataRooms.getUsage(principal, id);
  }
}
