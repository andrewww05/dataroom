import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClient } from '../api/client';
import type { FsNode } from '@dataroom/shared';
import { toast } from 'sonner';

export function useRename() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; parentId: string; name: string }) =>
      fetchClient<FsNode>(`/nodes/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: data.name }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nodes', variables.parentId, 'children'] });
      queryClient.invalidateQueries({ queryKey: ['nodes', variables.id, 'path'] });

      toast(`Saved as ${data.name}.`);
    },
  });
}
