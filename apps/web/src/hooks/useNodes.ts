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

export function useUploadFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ parentId, files }: { parentId: string; files: FileList | File[] }) => {
      // Import here to avoid circular dependency if any, or we can just import at the top
      // Wait, let's just import it at the top of the file in another step
      const { useUploads } = await import('./useUploads');
      const { addUploads, updateStatus, setModalOpen } = useUploads.getState();

      const fileArray = Array.from(files);
      const newUploads = fileArray.map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        parentId,
        status: 'uploading' as const,
      }));

      addUploads(newUploads);
      setModalOpen(true);

      for (const upload of newUploads) {
        const formData = new FormData();
        formData.append('parentId', parentId);
        formData.append('file', upload.file);

        try {
          await fetchClient<FsNode>('/files', {
            method: 'POST',
            body: formData as unknown as string,
          });
          updateStatus(upload.id, 'success');
        } catch (error) {
          const e = error as Error;
          updateStatus(upload.id, 'error', e.message || 'Upload failed');
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nodes', variables.parentId, 'children'] });
    },
    onError: (error: Error) => {
      toast.error(`Upload batch failed: ${error.message}`);
    },
  });
}

export async function downloadFile(fileId: string) {
  const res = await fetchClient<{ url: string; expiresAt: string }>(`/files/${fileId}/download`);
  return res.url;
}

export async function previewFile(fileId: string) {
  const res = await fetchClient<{ url: string; expiresAt: string }>(`/files/${fileId}/preview`);
  return res.url;
}
