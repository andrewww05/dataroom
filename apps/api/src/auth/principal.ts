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

export interface SharePrincipal {
  kind: 'share';
  shareId: string;
  role: 'VIEWER' | 'EDITOR';
  rootNodeId: string;
  dataRoomId: string;
}

export type Principal = OwnerPrincipal | SharePrincipal;

export type Capability = 'read' | 'write';
export const CAPABILITIES: Record<'VIEWER' | 'EDITOR', Capability[]> = {
  VIEWER: ['read'],
  EDITOR: ['read', 'write'],
};

import { ReadOnlyException } from '../http/api.exception';

export function assertCapability(principal: Principal, required: Capability): void {
  if (principal.kind === 'owner') return;
  const capabilities = CAPABILITIES[principal.role];
  if (!capabilities.includes(required)) {
    throw new ReadOnlyException();
  }
}
