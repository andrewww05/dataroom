import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { SharesService } from './shares.service';
import { CreateShareDto } from './dto/create-share.dto';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import { Principal } from '../auth/principal';
import { Public } from '../auth/public.decorator';

@Controller('shares')
export class SharesController {
  constructor(private readonly shares: SharesService) {}

  @Post()
  createShare(@CurrentPrincipal() principal: Principal, @Body() dto: CreateShareDto) {
    return this.shares.createShare(principal, dto);
  }

  @Delete(':id')
  revokeShare(@CurrentPrincipal() principal: Principal, @Param('id') id: string) {
    return this.shares.revokeShare(principal, id);
  }

  @Public()
  @Get('resolve/:token')
  resolveShare(@Param('token') token: string) {
    return this.shares.resolveShare(token);
  }

  @Get('received')
  listReceived(@CurrentPrincipal() principal: Principal) {
    return this.shares.listReceived(principal);
  }
}
