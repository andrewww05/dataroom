import { Button } from '@/components/ui/button';
import { FolderPlus, Pencil, Trash2 } from 'lucide-react';
import type { FsNode } from '@dataroom/shared';

interface ListingToolbarProps {
  selectedNodes?: FsNode[];
  onCreateFolder: () => void;
  onRename: (node: FsNode) => void;
  onDelete: (node: FsNode) => void;
}

export function ListingToolbar({ 
  selectedNodes = [],
  onCreateFolder,
  onRename,
  onDelete
}: ListingToolbarProps) {
  const singleSelected = selectedNodes.length === 1 ? selectedNodes[0] : null;

  return (
    <div className="flex items-center gap-2 mb-4 px-4 pt-4">
      <Button size="sm" onClick={onCreateFolder}>
        <FolderPlus className="h-4 w-4 mr-2" />
        New Folder
      </Button>

      {singleSelected && (
        <Button size="sm" variant="outline" onClick={() => onRename(singleSelected)}>
          <Pencil className="h-4 w-4 mr-2" />
          Rename
        </Button>
      )}

      {singleSelected && (
        <Button size="sm" variant="destructive" onClick={() => onDelete(singleSelected)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}
    </div>
  );
}
