import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDelete } from '@/hooks/useDelete';
import { fetchClient } from '@/api/client';
import type { FsNode, NodeShares, NodeStats } from '@dataroom/shared';
import { useQueries } from '@tanstack/react-query';

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '--';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface DeleteImpactProps {
  nodes: FsNode[];
}

function DeleteImpact({ nodes }: DeleteImpactProps) {
  const folderNodes = nodes.filter((n) => n.type === 'FOLDER');

  const statsQueries = useQueries({
    queries: folderNodes.map((n) => ({
      queryKey: ['nodes', n.id, 'stats'],
      queryFn: () => fetchClient<NodeStats>(`/nodes/${n.id}/stats`),
    })),
  });

  const sharesQueries = useQueries({
    queries: nodes.map((n) => ({
      queryKey: ['shares', n.id],
      queryFn: () => fetchClient<NodeShares>(`/nodes/${n.id}/shares`),
    })),
  });

  const statsLoading = statsQueries.some((q) => q.isLoading);
  const sharesLoading = sharesQueries.some((q) => q.isLoading);

  if (statsLoading || sharesLoading) {
    return <p className="text-sm text-muted-foreground mt-4">Calculating impact...</p>;
  }

  const statsError = statsQueries.some((q) => q.isError);
  const sharesError = sharesQueries.some((q) => q.isError);

  if (statsError || sharesError) {
    return <p className="text-sm text-destructive mt-4">Failed to calculate impact.</p>;
  }

  let totalFolders = 0;
  let totalFiles = 0;
  let totalBytes = 0;
  let totalLinks = 0;

  nodes.forEach((n) => {
    if (n.type === 'FILE') {
      totalFiles += 1;
      totalBytes += n.sizeBytes || 0;
    }
  });

  statsQueries.forEach((q) => {
    if (q.data) {
      totalFolders += q.data.folders;
      totalFiles += q.data.files;
      totalBytes += q.data.bytes;
    }
  });

  sharesQueries.forEach((q) => {
    if (q.data) {
      totalLinks += q.data.own.length;
    }
  });

  const text =
    totalFolders === 0 && totalFiles === 1
      ? `This removes 1 file (${formatBytes(totalBytes)}). This cannot be undone.`
      : `This removes ${totalFolders} folder${totalFolders === 1 ? '' : 's'} and ${totalFiles} file${totalFiles === 1 ? '' : 's'} (${formatBytes(totalBytes)}). This cannot be undone.`;

  return (
    <>
      <p className="text-sm text-muted-foreground mt-4">{text}</p>
      {totalLinks > 0 && (
        <p className="text-sm font-medium text-destructive mt-2">
          This also revokes {totalLinks} link{totalLinks === 1 ? '' : 's'}.
        </p>
      )}
    </>
  );
}

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: FsNode[];
}

export function DeleteDialog({ open, onOpenChange, nodes }: DeleteDialogProps) {
  const deleteNode = useDelete();

  const folderNodes = nodes.filter((n) => n.type === 'FOLDER');
  const statsQueries = useQueries({
    queries: folderNodes.map((n) => ({
      queryKey: ['nodes', n.id, 'stats'],
      queryFn: () => fetchClient<NodeStats>(`/nodes/${n.id}/stats`),
      enabled: open && nodes.length > 0,
    })),
  });

  const sharesQueries = useQueries({
    queries: nodes.map((n) => ({
      queryKey: ['shares', n.id],
      queryFn: () => fetchClient<NodeShares>(`/nodes/${n.id}/shares`),
      enabled: open && nodes.length > 0,
    })),
  });

  const isLoading = statsQueries.some((q) => q.isLoading) || sharesQueries.some((q) => q.isLoading);

  const handleDelete = async () => {
    if (nodes.length === 0) return;

    // Deleting sequentially or all at once?
    // The API deletes one node per call currently.
    // If we have multiple nodes, we iterate and delete.
    // Wait, the API deletes one by one. Or does it support bulk?
    // Wait, the task says: "Extend DeleteDialog to take FsNode[] ...".

    for (const node of nodes) {
      try {
        await deleteNode.mutateAsync({
          id: node.id,
          parentId: node.parentId,
          ancestorIds: node.parentId ? [node.parentId] : undefined,
        });
      } catch {
        // ignorep on first error or continue?
        // Let's continue for others or stop?
        // Typically stop on first error is safer.
        break;
      }
    }

    if (!deleteNode.isError) {
      onOpenChange(false);
    }
  };

  const nameText =
    nodes.length === 1 ? <strong>{nodes[0].name}</strong> : <strong>{nodes.length} items</strong>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {nodes.length > 0 && <p className="text-sm">Delete {nameText}?</p>}
          {nodes.length > 0 && open && <DeleteImpact nodes={nodes} />}

          {deleteNode.isError && (
            <p className="text-sm text-destructive mt-4">
              {deleteNode.error instanceof Error ? deleteNode.error.message : 'Error deleting item'}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || deleteNode.isPending}
          >
            {deleteNode.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
