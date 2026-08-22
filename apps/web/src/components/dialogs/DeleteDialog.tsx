import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteNode, useNodeStats } from '@/hooks/useNodes';
import type { FsNode } from '@dataroom/shared';

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '--';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface DeleteImpactProps {
  nodeId: string;
}

function DeleteImpact({ nodeId }: DeleteImpactProps) {
  const { data: stats, isLoading, isError } = useNodeStats(nodeId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground mt-4">Calculating impact...</p>;
  }

  if (isError || !stats) {
    return <p className="text-sm text-destructive mt-4">Failed to calculate impact.</p>;
  }

  return (
    <p className="text-sm text-muted-foreground mt-4">
      This removes {stats.folders} folder{stats.folders === 1 ? '' : 's'} and {stats.files} file
      {stats.files === 1 ? '' : 's'} ({formatBytes(stats.bytes)}). This cannot be undone.
    </p>
  );
}

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: FsNode | null;
}

export function DeleteDialog({ open, onOpenChange, node }: DeleteDialogProps) {
  const deleteNode = useDeleteNode();

  const { isLoading: statsLoading } = useNodeStats(node?.id || '', open && !!node);

  const handleDelete = () => {
    if (!node) return;
    deleteNode.mutate(
      { id: node.id, parentId: node.parentId, ancestorId: node.parentId || undefined },
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
          {node && open && <DeleteImpact nodeId={node.id} />}

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
            disabled={statsLoading || deleteNode.isPending}
          >
            {deleteNode.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
