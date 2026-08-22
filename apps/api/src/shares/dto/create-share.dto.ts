import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ShareMode } from '@dataroom/shared';

export class CreateShareDto {
  @IsString()
  @IsUUID('4')
  nodeId!: string;

  @IsEnum(['PUBLIC', 'RESTRICTED'])
  mode!: ShareMode;

  @IsOptional()
  @IsEmail()
  granteeEmail?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
