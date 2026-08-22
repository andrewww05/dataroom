import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClient } from '../api/client';

export function useDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; parentId: string | null; ancestorIds?: string[] }) =>
      fetchClient<void>(`/nodes/${data.id}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, variables) => {
      if (variables.parentId) {
        queryClient.invalidateQueries({ queryKey: ['nodes', variables.parentId, 'children'] });
      }
      if (variables.ancestorIds) {
        for (const ancestorId of variables.ancestorIds) {
          queryClient.invalidateQueries({ queryKey: ['stats', ancestorId] });
        }
      }
    },
  });
}
