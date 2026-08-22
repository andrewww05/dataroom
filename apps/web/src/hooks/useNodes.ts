import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { fetchClient } from '../api/client';
import type { FsNode, NodeStats } from '@dataroom/shared';
import { toast } from 'sonner';

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { parentId: string; name: string }) =>
      fetchClient<FsNode>('/nodes/folders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nodes', variables.parentId, 'children'] });
      
      if (data.name !== variables.name) {
        toast(`Saved as ${data.name}.`);
      }
    },
  });
}

export function useRenameNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; parentId: string; name: string }) =>
      fetchClient<FsNode>(`/nodes/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: data.name }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nodes', variables.parentId, 'children'] });
      
      if (data.name !== variables.name) {
        toast(`Saved as ${data.name}.`);
      }
    },
  });
}

export function useDeleteNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; parentId: string | null; ancestorId?: string }) =>
      fetchClient<void>(`/nodes/${data.id}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, variables) => {
      if (variables.parentId) {
        queryClient.invalidateQueries({ queryKey: ['nodes', variables.parentId, 'children'] });
      }
      if (variables.ancestorId) {
        queryClient.invalidateQueries({ queryKey: ['stats', variables.ancestorId] });
      }
    },
  });
}

export function useNodeStats(id: string, enabled = true) {
  return useQuery({
    queryKey: ['stats', id],
    queryFn: () => fetchClient<NodeStats>(`/nodes/${id}/stats`),
    enabled,
  });
}
