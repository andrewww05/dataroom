import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

import { normalizeEmail } from '../email';

/**
 * FR-AUTH-010. `forbidNonWhitelisted` is on globally, so an extra field such as
 * `passwordConfirm` is a `400 VALIDATION_FAILED` rather than an ignored key.
 */
export class SignUpDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsEmail()
  email!: string;

  // Not trimmed: spaces are legitimate password characters, and silently altering one would let a
  // password sign up that then cannot sign in.
  @IsString()
  @MinLength(8)
  password!: string;
}
