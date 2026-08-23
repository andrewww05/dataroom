import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQuery } from './dto/search.query';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import { Principal } from '../auth/principal';
import { SearchResult } from '@dataroom/shared';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @CurrentPrincipal() principal: Principal,
    @Query() query: SearchQuery,
  ): Promise<SearchResult> {
    const items = await this.searchService.search(principal, query.q);
    return { items };
  }
}
