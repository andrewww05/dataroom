import { randomUUID } from 'node:crypto';

import { ErrorCode, ValidationFailedException } from '../http/api.exception';
import { decodeCursor, encodeCursor } from './cursor';

describe('FR-NAV-030 the listing cursor', () => {
  it('round-trips a name that would break a delimited encoding', () => {
    // Why the token is JSON in base64url rather than `type:name:id`: a name is 255 characters of
    // anything, so any delimiter is a name a caller can pick.
    const rows = [
      { type: 'FILE' as const, name: 'q3/q4 report.pdf', id: randomUUID() },
      { type: 'FOLDER' as const, name: 'Someone\'s "notes"', id: randomUUID() },
      { type: 'FILE' as const, name: 'Übersicht — 決算.pdf', id: randomUUID() },
      { type: 'FOLDER' as const, name: 'a:b|c,d', id: randomUUID() },
    ];

    for (const row of rows) {
      expect(decodeCursor(encodeCursor(row))).toEqual({ t: row.type, n: row.name, i: row.id });
    }
  });

  it('emits a token that survives a query string unescaped', () => {
    const token = encodeCursor({ type: 'FILE', name: 'a/b+c=d', id: randomUUID() });

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeURIComponent(token)).toBe(token);
  });

  it('refuses a truncated token, an unknown type and a token that is not base64', () => {
    const valid = encodeCursor({ type: 'FOLDER', name: 'reports', id: randomUUID() });

    const rejected = [
      valid.slice(0, Math.floor(valid.length / 2)),
      Buffer.from(JSON.stringify({ t: 'SYMLINK', n: 'x', i: 'y' })).toString('base64url'),
      'not base64!!',
      // Decodes and parses, but is not a position: `t` missing, `i` not a string.
      Buffer.from(JSON.stringify({ n: 'x', i: 'y' })).toString('base64url'),
      Buffer.from(JSON.stringify({ t: 'FILE', n: 'x', i: 42 })).toString('base64url'),
      Buffer.from(JSON.stringify(['FILE', 'x', 'y'])).toString('base64url'),
      Buffer.from('null').toString('base64url'),
    ];

    for (const token of rejected) {
      let thrown: unknown;
      try {
        decodeCursor(token);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(ValidationFailedException);
      const failure = thrown as ValidationFailedException;
      expect(failure.body.code).toBe(ErrorCode.VALIDATION_FAILED);
      // The field is named, so the client knows which input to drop rather than which page to retry.
      expect(Object.keys(failure.body.details ?? {})).toEqual(['cursor']);
    }
  });

  it('gives every bad token the same reason, because the difference is not actionable', () => {
    const reasons = ['not base64!!', Buffer.from('{').toString('base64url')].map((token) => {
      try {
        decodeCursor(token);
      } catch (error) {
        return JSON.stringify((error as ValidationFailedException).body);
      }
      return 'accepted';
    });

    expect(new Set(reasons).size).toBe(1);
    expect(reasons[0]).not.toBe('accepted');
  });
});
