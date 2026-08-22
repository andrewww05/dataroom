import type { Breadcrumb, FsNode } from './nodes';

export type ShareMode = 'PUBLIC' | 'RESTRICTED';
export type ShareRole = 'VIEWER' | 'EDITOR';

/**
 * What `GET /nodes/:id/shares` returns (FR-SHARE-060): direct shares on this node, plus the
 * nearest ancestor that has at least one share (or `null`).
 */
export interface NodeShares {
  own: Share[];
  inheritedFrom: Breadcrumb | null;
}

export interface Share {
  id: string;
  nodeId: string;
  token: string;
  mode: ShareMode;
  role: ShareRole;
  granteeEmail: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ReceivedShare {
  token: string;
  node: FsNode;
  ownerEmail: string;
  role: ShareRole;
  createdAt: string;
}
