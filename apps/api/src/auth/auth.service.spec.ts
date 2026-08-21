import { dataRoomNameFor } from './auth.service';
import { normalizeEmail } from './email';

/** The two pure rules the sign-up transaction applies, tested without a database. */
describe('sign-up rules', () => {
  describe('FR-AUTH-010 email normalisation', () => {
    it.each([
      ['ada@example.com', 'ada@example.com'],
      ['  Ada@Example.COM  ', 'ada@example.com'],
      ['ADA@EXAMPLE.COM', 'ada@example.com'],
    ])('reads %j as %j', (raw, expected) => {
      expect(normalizeEmail(raw)).toBe(expected);
    });

    it('is idempotent, so the DTO and the service can both apply it', () => {
      expect(normalizeEmail(normalizeEmail('  Ada@Example.COM  '))).toBe('ada@example.com');
    });
  });

  describe('FR-ROOM-010 the default Data Room name', () => {
    it('uses the local part', () => {
      expect(dataRoomNameFor('ada@example.com')).toBe("ada's Data Room");
    });

    it('is never "Root"', () => {
      expect(dataRoomNameFor('root@example.com')).toBe("root's Data Room");
    });

    it('keeps the local part whole when the name fits', () => {
      const local = 'a'.repeat(60);

      expect(dataRoomNameFor(`${local}@example.com`)).toBe(`${local}'s Data Room`);
    });

    it('cuts the local part, never the suffix, when the column is too short', () => {
      // Longer than any address `@IsEmail()` admits, so this is the rule holding for a caller
      // that is not the HTTP route — a seed script, or a later import.
      const name = dataRoomNameFor(`${'a'.repeat(400)}@example.com`);

      expect(name.endsWith("'s Data Room")).toBe(true);
      expect(name.length).toBe(255);
    });
  });
});
