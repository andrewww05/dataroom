import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClient } from '../api/client';
import type { FsNode } from '@dataroom/shared';
import { toast } from 'sonner';

export function useMove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { ids: string[]; targetId: string; sourceParentId: string }) =>
      fetchClient<FsNode[]>('/nodes/move', {
        method: 'POST',
        body: JSON.stringify({ ids: data.ids, targetId: data.targetId }),
      }),
    onSuccess: (movedNodes, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nodes', variables.sourceParentId, 'children'] });
      queryClient.invalidateQueries({ queryKey: ['nodes', variables.targetId, 'children'] });

      for (const node of movedNodes) {
        queryClient.invalidateQueries({ queryKey: ['nodes', node.id, 'path'] });
      }

      toast(`Moved ${movedNodes.length} item(s) to destination.`);
    },
    onError: (error: Error) => {
      toast.error(`Move failed: ${error.message}`);
    },
  });
}
