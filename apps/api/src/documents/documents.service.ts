import type { DocumentStatus, DocumentSummary, ListResponse } from '@dataroom/shared';
import { Injectable, NotFoundException } from '@nestjs/common';

/** Placeholder data — swap for a real repository when persistence lands. */
const SEED: readonly DocumentSummary[] = [
  {
    id: 'doc_term_sheet',
    name: 'Term Sheet.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 284_512,
    status: 'published',
    updatedAt: '2026-08-14T09:12:00.000Z',
  },
  {
    id: 'doc_cap_table',
    name: 'Cap Table.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sizeBytes: 51_204,
    status: 'in_review',
    updatedAt: '2026-08-18T16:40:00.000Z',
  },
  {
    id: 'doc_diligence_notes',
    name: 'Diligence Notes.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 18_930,
    status: 'draft',
    updatedAt: '2026-08-20T11:02:00.000Z',
  },
];

@Injectable()
export class DocumentsService {
  private readonly documents: DocumentSummary[] = [...SEED];

  list(status?: DocumentStatus): ListResponse<DocumentSummary> {
    const items = status ? this.documents.filter((doc) => doc.status === status) : this.documents;

    return { items, total: items.length };
  }

  findOne(id: string): DocumentSummary {
    const document = this.documents.find((doc) => doc.id === id);

    if (!document) {
      throw new NotFoundException(`Document "${id}" not found`);
    }

    return document;
  }
}
