import type { NodeType } from '@dataroom/shared';

import { NodeType as NODE_TYPE } from '../generated/prisma/client';
import { ValidationFailedException } from '../http/api.exception';

/**
 * A position in the listing order, not an offset (FR-NAV-030).
 *
 * The listing is ordered `type, name, id`, so the cursor is that whole tuple — `id` is what makes it
 * unique, and carrying it means the next page's predicate needs no lookup of the row it resumes
 * after. Keys are one letter because the token travels in a query string on every page.
 */
export interface NodeCursor {
  t: NodeType;
  n: string;
  i: string;
}

/** The alphabet `base64url` uses. `Buffer.from` ignores anything outside it instead of failing. */
const BASE64URL = /^[A-Za-z0-9_-]+$/;

function isNodeType(value: unknown): value is NodeType {
  return typeof value === 'string' && Object.values<string>(NODE_TYPE).includes(value);
}

/**
 * One reason for every way a token can be wrong, because the caller cannot act on the difference:
 * a cursor is opaque and the only correct value is one this endpoint handed out.
 */
function badCursor(): ValidationFailedException {
  return new ValidationFailedException({
    cursor: ['cursor is not a page position issued by this endpoint'],
  });
}

export function encodeCursor(row: { type: NodeType; name: string; id: string }): string {
  const payload: NodeCursor = { t: row.type, n: row.name, i: row.id };

  // `utf8` both ways, so a name holding a quote, a slash or a multi-byte character survives.
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/**
 * A token that did not come from `encodeCursor` is a `400 VALIDATION_FAILED` naming `cursor`, never
 * a silent page from the beginning: a caller who thinks it resumed would see rows hidden from it.
 */
export function decodeCursor(token: string): NodeCursor {
  if (!BASE64URL.test(token)) throw badCursor();

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    // A truncated token is a truncated JSON document, so it lands here rather than below.
    throw badCursor();
  }

  if (typeof parsed !== 'object' || parsed === null) throw badCursor();

  const { t, n, i } = parsed as Record<string, unknown>;

  // `t` goes straight into a `type` comparison, so a value the enum does not have is refused here
  // rather than by Postgres as a 500.
  if (!isNodeType(t) || typeof n !== 'string' || typeof i !== 'string') throw badCursor();

  return { t, n, i };
}
