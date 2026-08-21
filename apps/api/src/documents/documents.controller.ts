import type { DocumentSummary, ListResponse } from '@dataroom/shared';
import { Controller, Get, Param, Query } from '@nestjs/common';

import { Public } from '../auth/public.decorator';
import { DocumentsService } from './documents.service';
import { ListDocumentsQuery } from './dto/list-documents.query';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  /**
   * Public only so the placeholder page keeps loading until **slice 4** replaces it with the real
   * shell and deletes this module. It reads a hardcoded array; there are no rows behind it.
   */
  @Public()
  @Get()
  list(@Query() query: ListDocumentsQuery): ListResponse<DocumentSummary> {
    return this.documents.list(query.status);
  }

  @Get(':id')
  findOne(@Param('id') id: string): DocumentSummary {
    return this.documents.findOne(id);
  }
}
