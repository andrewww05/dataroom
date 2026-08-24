import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ShareMode } from '@dataroom/shared';

import { createShare, listNodeShares, listReceivedShares, revokeShare } from '../api/shares';

/** Direct shares on a node + inherited ancestor (FR-SHARE-060). */
export function useNodeShares(nodeId: string, enabled = true) {
  return useQuery({
    queryKey: ['shares', nodeId],
    queryFn: () => listNodeShares(nodeId),
    enabled,
  });
}

/** Restricted shares granted to the current user (FR-SHARE-080). */
export function useReceivedShares() {
  return useQuery({
    queryKey: ['shares', 'received'],
    queryFn: listReceivedShares,
  });
}

/** Create a new share and invalidate the node's share list (FR-SHARE-010). */
export function useCreateShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: {
      nodeId: string;
      mode: ShareMode;
      granteeEmail?: string;
      expiresAt?: string;
    }) => createShare(dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shares', variables.nodeId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create share');
    },
  });
}

/** Revoke a share and invalidate the node's share list (FR-SHARE-040). */
export function useRevokeShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; nodeId: string }) => revokeShare(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shares', variables.nodeId] });
      queryClient.invalidateQueries({ queryKey: ['shares', 'received'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revoke share');
    },
  });
}
