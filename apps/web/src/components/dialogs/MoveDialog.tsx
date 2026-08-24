import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMove } from '@/hooks/useMove';
import type { FsNode } from '@dataroom/shared';
import { FolderPicker, type PickedFolder } from './FolderPicker';

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodesToMove: FsNode[];
}

export function MoveDialog({ open, onOpenChange, nodesToMove }: MoveDialogProps) {
  const [selectedTarget, setSelectedTarget] = useState<PickedFolder | null>(null);
  const moveNodes = useMove();

  const handleMove = () => {
    if (!selectedTarget || nodesToMove.length === 0) return;

    // All nodes to move are in the same folder in this app
    const sourceParentId = nodesToMove[0].parentId!;
    const ids = nodesToMove.map((n) => n.id);

    moveNodes.mutate(
      { ids, targetId: selectedTarget.id, sourceParentId },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedTarget(null);
        },
      },
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setSelectedTarget(null);
    }
  };

  if (nodesToMove.length === 0) return null;
  const currentParentId = nodesToMove[0].parentId;
  const movingNodeIds = nodesToMove.map((n) => n.id);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Move {nodesToMove.length} item{nodesToMove.length === 1 ? '' : 's'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-muted-foreground mb-4">Select a destination folder.</p>
          <FolderPicker
            movingNodeIds={movingNodeIds}
            currentParentId={currentParentId}
            selectedFolderId={selectedTarget?.id || null}
            onSelect={(folder) => setSelectedTarget(folder)}
          />
          {moveNodes.isError && (
            <p className="text-sm text-destructive mt-4">
              {moveNodes.error instanceof Error ? moveNodes.error.message : 'Error moving items'}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={!selectedTarget || moveNodes.isPending}>
            {moveNodes.isPending ? 'Moving...' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
