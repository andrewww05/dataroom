import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClient } from '@/api/client';
import type { CopyNodesRequest, FsNode } from '@dataroom/shared';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useCopyNodes() {
  const queryClient = useQueryClient();
  const { dataRoom } = useAuth();

  return useMutation({
    mutationFn: async (req: CopyNodesRequest) => {
      const copiedNodes = await fetchClient<FsNode[]>('/nodes/copy', {
        method: 'POST',
        body: JSON.stringify(req),
      });
      return { copiedNodes, targetId: req.targetId };
    },
    onSuccess: ({ copiedNodes, targetId }) => {
      queryClient.invalidateQueries({ queryKey: ['nodes', targetId, 'children'] });
      
      if (dataRoom?.id) {
        queryClient.invalidateQueries({ queryKey: ['usage', dataRoom.id] });
      }

      // Invalidate stats for ancestors (we don't know them easily here, but we can invalidate all stats if needed, or targetId specifically)
      queryClient.invalidateQueries({ queryKey: ['nodes'] });

      const nameList = copiedNodes.map(n => n.name).join(', ');
      toast.success(`Pasted as ${nameList}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to copy');
    },
  });
}
