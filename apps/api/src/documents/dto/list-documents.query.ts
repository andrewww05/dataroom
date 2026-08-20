import { DOCUMENT_STATUSES, type DocumentStatus } from '@dataroom/shared';
import { IsIn, IsOptional } from 'class-validator';

export class ListDocumentsQuery {
  @IsOptional()
  @IsIn([...DOCUMENT_STATUSES])
  status?: DocumentStatus;
}
