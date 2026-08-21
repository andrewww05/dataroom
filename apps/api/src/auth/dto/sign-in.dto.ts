import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { normalizeEmail } from '../email';

/**
 * Deliberately not `@MinLength(8)`: sign-in tests a submitted password against a stored hash, and
 * the length rule is the sign-up rule. A short one is simply wrong, and wrong is
 * `401 INVALID_CREDENTIALS` like every other wrong password (FR-AUTH-020).
 */
export class SignInDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
