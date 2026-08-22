import { FsNode } from './nodes';

export type ShareMode = 'PUBLIC' | 'RESTRICTED';
export type ShareRole = 'VIEWER' | 'EDITOR';

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
