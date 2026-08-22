import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateFolder } from '@/hooks/useNodes';

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
}

export function NewFolderDialog({ open, onOpenChange, parentId }: NewFolderDialogProps) {
  const [name, setName] = useState('');
  const createFolder = useCreateFolder();



  const handleCreate = () => {
    if (!name.trim()) return;
    createFolder.mutate({ parentId, name }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="name" className="sr-only">Folder name</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Folder name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
            autoFocus
          />
          {createFolder.isError && (
            <p className="text-sm text-destructive mt-2">
              {createFolder.error instanceof Error ? createFolder.error.message : 'Error creating folder'}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || createFolder.isPending}>
            {createFolder.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
