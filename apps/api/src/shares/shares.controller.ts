import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, Header } from '@nestjs/common';
import { SharesService } from './shares.service';
import { CreateShareDto } from './dto/create-share.dto';
import { ResolveShareQuery } from './dto/resolve-share.query';
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
  @HttpCode(204)
  revokeShare(@CurrentPrincipal() principal: Principal, @Param('id') id: string) {
    return this.shares.revokeShare(principal, id);
  }

  @Public()
  @Get('resolve')
  @Header('Referrer-Policy', 'no-referrer')
  resolveShare(@Query() query: ResolveShareQuery) {
    return this.shares.resolveShare(query.token);
  }

  @Get('received')
  listReceived(@CurrentPrincipal() principal: Principal) {
    return this.shares.listReceived(principal);
  }

  @Public()
  @Get('preview/:token')
  @Header('Content-Type', 'text/html')
  async previewShare(@Param('token') token: string) {
    const shareInfo = await this.shares.resolveShare(token);
    const title = shareInfo.node.name;
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - Dataroom</title>
  <meta property="og:title" content="${title}">
  <meta property="og:site_name" content="Dataroom">
</head>
<body></body>
</html>`;
  }
}
