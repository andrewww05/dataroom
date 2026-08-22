import type { NodeType } from '@dataroom/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { NodeType as NODE_TYPE } from '../../generated/prisma/client';

/** docs/03 § Sorting and paging. The cap bounds one response; asking for more is a `400`. */
export const DEFAULT_PAGE_LIMIT = 100;
export const MAX_PAGE_LIMIT = 100;

export class ListChildrenQuery {
  /** Opaque to the caller; `decodeCursor` is what rejects one this endpoint did not issue. */
  @IsOptional()
  @IsString()
  cursor?: string;

  /**
   * The global `ValidationPipe` runs without `enableImplicitConversion`, so a query string needs
   * `@Type` to arrive as a number. `?limit=abc` becomes `NaN` and is refused by `@IsInt` rather
   * than silently clamped — a clamped page hides rows from a caller who asked for more.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit: number = DEFAULT_PAGE_LIMIT;

  /** FR-NAV-010's folders-only tree load. The values come from the schema's own enum. */
  @IsOptional()
  @IsIn(Object.values<string>(NODE_TYPE))
  type?: NodeType;
}
