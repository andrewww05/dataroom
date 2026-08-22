import type { NodeShares, ReceivedShare, Share, ShareMode } from '@dataroom/shared';
import { fetchClient } from './client';

/** Resolve a share token — `@Public()`, no auth needed for PUBLIC shares. */
export async function resolveShare(token: string) {
  return fetchClient<{
    node: import('@dataroom/shared').FsNode;
    mode: ShareMode;
    role: 'VIEWER' | 'EDITOR';
    rootNodeId: string;
    ownerEmail: string;
  }>(`/shares/resolve?token=${encodeURIComponent(token)}`);
}

/** List direct shares on a node plus the nearest shared ancestor (FR-SHARE-060). */
export function listNodeShares(nodeId: string) {
  return fetchClient<NodeShares>(`/nodes/${nodeId}/shares`);
}

/** Create a new share (FR-SHARE-010). */
export function createShare(dto: {
  nodeId: string;
  mode: ShareMode;
  granteeEmail?: string;
  expiresAt?: string;
}) {
  return fetchClient<Share>('/shares', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** Revoke a share (FR-SHARE-040). */
export function revokeShare(id: string) {
  return fetchClient<void>(`/shares/${id}`, { method: 'DELETE' });
}

/** List shares received by the current user (FR-SHARE-080). */
export function listReceivedShares() {
  return fetchClient<ReceivedShare[]>('/shares/received');
}
