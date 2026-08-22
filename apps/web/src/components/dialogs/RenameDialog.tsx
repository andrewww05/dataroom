import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRenameNode } from '@/hooks/useNodes';
import type { FsNode } from '@dataroom/shared';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: FsNode | null;
}

export function RenameDialog({ open, onOpenChange, node }: RenameDialogProps) {
  const [name, setName] = useState(node?.name || '');
  const renameNode = useRenameNode();

  const handleRename = () => {
    if (!name.trim() || !node || !node.parentId) return;
    
    renameNode.mutate({ id: node.id, parentId: node.parentId, name }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="rename" className="sr-only">Name</Label>
          <Input 
            id="rename" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
            }}
            autoFocus
          />
          {renameNode.isError && (
            <p className="text-sm text-destructive mt-2">
              {renameNode.error instanceof Error ? renameNode.error.message : 'Error renaming item'}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRename} disabled={!name.trim() || name === node?.name || renameNode.isPending}>
            {renameNode.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
