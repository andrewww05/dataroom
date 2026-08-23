import { IsArray, IsString, IsUUID, ArrayMinSize } from 'class-validator';
import type { CopyNodesRequest } from '@dataroom/shared';

export class CopyNodesDto implements CopyNodesRequest {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(4, { each: true })
  ids!: string[];

  @IsString()
  @IsUUID(4)
  targetId!: string;
}
