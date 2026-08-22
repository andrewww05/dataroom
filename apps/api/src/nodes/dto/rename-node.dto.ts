import { IsNotEmpty, IsString } from 'class-validator';

export class RenameNodeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
