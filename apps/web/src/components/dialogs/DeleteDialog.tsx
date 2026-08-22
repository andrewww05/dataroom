import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDelete } from '@/hooks/useDelete';
import { useNodeStats } from '@/hooks/useNodes';
import { useQuery } from '@tanstack/react-query';
import { fetchClient } from '@/api/client';
import type { FsNode, NodeShares } from '@dataroom/shared';

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '--';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface DeleteImpactProps {
  node: FsNode;
}

function DeleteImpact({ node }: DeleteImpactProps) {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useNodeStats(node.id);
  const { data: shares, isLoading: sharesLoading, isError: sharesError } = useQuery({
    queryKey: ['shares', node.id],
    queryFn: () => fetchClient<NodeShares>(`/nodes/${node.id}/shares`),
  });

  if (statsLoading || sharesLoading) {
    return <p className="text-sm text-muted-foreground mt-4">Calculating impact...</p>;
  }

  if (statsError || sharesError || !stats || !shares) {
    return <p className="text-sm text-destructive mt-4">Failed to calculate impact.</p>;
  }

  const text = node.type === 'FILE' 
    ? `This removes 1 file (${formatBytes(node.sizeBytes)}). This cannot be undone.`
    : `This removes ${stats.folders} folder${stats.folders === 1 ? '' : 's'} and ${stats.files} file${stats.files === 1 ? '' : 's'} (${formatBytes(stats.bytes)}). This cannot be undone.`;

  return (
    <>
      <p className="text-sm text-muted-foreground mt-4">{text}</p>
      {shares.own.length > 0 && (
        <p className="text-sm font-medium text-destructive mt-2">
          This also revokes {shares.own.length} link{shares.own.length === 1 ? '' : 's'}.
        </p>
      )}
    </>
  );
}

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: FsNode | null;
}

export function DeleteDialog({ open, onOpenChange, node }: DeleteDialogProps) {
  const deleteNode = useDelete();

  const { isLoading: statsLoading } = useNodeStats(node?.id || '', open && !!node);
  const { isLoading: sharesLoading } = useQuery({
    queryKey: ['shares', node?.id],
    queryFn: () => fetchClient<NodeShares>(`/nodes/${node?.id}/shares`),
    enabled: open && !!node,
  });

  const handleDelete = () => {
    if (!node) return;
    deleteNode.mutate(
      { id: node.id, parentId: node.parentId, ancestorIds: node.parentId ? [node.parentId] : undefined },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {node && (
            <p className="text-sm">
              Delete <strong>{node.name}</strong>?
            </p>
          )}
          {node && open && <DeleteImpact node={node} />}

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
            disabled={statsLoading || sharesLoading || deleteNode.isPending}
          >
            {deleteNode.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
