import { ArrayNotEmpty, IsArray, IsString, IsUUID } from 'class-validator';

export class MoveNodesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsString()
  @IsUUID('4')
  targetId!: string;
}
