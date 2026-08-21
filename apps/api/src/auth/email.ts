/**
 * Emails are stored and looked up in one form, so `  Ada@Example.COM  ` and `ada@example.com` are
 * the same account and not two (FR-AUTH-010).
 *
 * Both DTOs run this before validation — `@IsEmail()` would otherwise reject the padded string as
 * malformed instead of the service recognising it as an address already taken — and the service
 * runs it again on the way to the database, so the rule holds for any caller, not just the
 * controller. It is idempotent, which is what makes both safe.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
