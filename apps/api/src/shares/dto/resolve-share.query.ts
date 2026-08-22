import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveShareQuery {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
