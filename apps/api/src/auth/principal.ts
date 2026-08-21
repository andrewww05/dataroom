/**
 * Who a request resolved to (BR-010). Exactly one principal per request, produced by the guard and
 * read by handlers through `@CurrentPrincipal()` — never from the `Authorization` header.
 *
 * There is one kind today. Slice 9 adds `{ kind: 'share', ... }` and the capability map that turns
 * a kind into `read` / `write` (BR-070); writing that map now, with one entry, would be guessing at
 * the share half.
 */
export interface OwnerPrincipal {
  kind: 'owner';
  userId: string;
}

export type Principal = OwnerPrincipal;
