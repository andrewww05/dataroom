import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID(4)
  parentId!: string;
}
