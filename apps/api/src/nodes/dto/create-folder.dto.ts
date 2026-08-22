import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateFolderDto {
  @IsUUID(4)
  @IsNotEmpty()
  parentId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
