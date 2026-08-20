import type { DocumentSummary, ListResponse } from '@dataroom/shared';
import { Controller, Get, Param, Query } from '@nestjs/common';

import { DocumentsService } from './documents.service';
import { ListDocumentsQuery } from './dto/list-documents.query';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(@Query() query: ListDocumentsQuery): ListResponse<DocumentSummary> {
    return this.documents.list(query.status);
  }

  @Get(':id')
  findOne(@Param('id') id: string): DocumentSummary {
    return this.documents.findOne(id);
  }
}
