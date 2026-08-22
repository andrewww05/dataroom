import { Button } from '@/components/ui/button';
import { FolderPlus, Pencil, Trash2, Upload } from 'lucide-react';
import type { FsNode } from '@dataroom/shared';
import { useRef } from 'react';

interface ListingToolbarProps {
  selectedNodes?: FsNode[];
  onCreateFolder: () => void;
  onUploadFiles: (files: FileList) => void;
  onRename: (node: FsNode) => void;
  onDelete: (node: FsNode) => void;
}

export function ListingToolbar({
  selectedNodes = [],
  onCreateFolder,
  onUploadFiles,
  onRename,
  onDelete,
}: ListingToolbarProps) {
  const singleSelected = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(e.target.files);
      // Reset input so the same files can be uploaded again if needed
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2 mb-4 px-4 pt-4">
      <Button size="sm" onClick={onCreateFolder}>
        <FolderPlus className="h-4 w-4 mr-2" />
        New Folder
      </Button>

      <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />
        Upload files
      </Button>
      <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileChange} />

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
