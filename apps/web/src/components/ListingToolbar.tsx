import { Button } from '@/components/ui/button';
import {
  FolderPlus,
  Pencil,
  Share2,
  Trash2,
  Upload,
  Scissors,
  Copy,
  ClipboardPaste,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { FsNode } from '@dataroom/shared';
import { useRef } from 'react';
import { useViewMode } from '@/hooks/useViewMode';

interface ListingToolbarProps {
  selectedNodes?: FsNode[];
  onCreateFolder: () => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onRename: (node: FsNode) => void;
  onMove: (nodes: FsNode[]) => void;
  onDelete: (nodes: FsNode[]) => void;
  onShare?: (node: FsNode) => void;
  onCut?: (nodes: FsNode[]) => void;
  onCopy?: (nodes: FsNode[]) => void;
  onPaste?: () => void;
  canPaste?: boolean;
}

export function ListingToolbar({
  selectedNodes = [],
  onCreateFolder,
  onUploadFiles,
  onRename,
  onMove,
  onDelete,
  onShare,
  onCut,
  onCopy,
  onPaste,
  canPaste = false,
}: ListingToolbarProps) {
  const singleSelected = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mode: viewMode, setMode: setViewMode } = useViewMode();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onUploadFiles(filesArray);
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

      {selectedNodes.length > 0 && onCut && (
        <Button size="sm" variant="outline" onClick={() => onCut(selectedNodes)}>
          <Scissors className="h-4 w-4 mr-2" />
          Cut
        </Button>
      )}

      {selectedNodes.length > 0 && onCopy && (
        <Button size="sm" variant="outline" onClick={() => onCopy(selectedNodes)}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
      )}

      {canPaste && onPaste && (
        <Button size="sm" variant="outline" onClick={onPaste}>
          <ClipboardPaste className="h-4 w-4 mr-2" />
          Paste
        </Button>
      )}

      {selectedNodes.length > 0 && (
        <Button size="sm" variant="outline" onClick={() => onMove(selectedNodes)}>
          <FolderPlus className="h-4 w-4 mr-2" />
          Move
        </Button>
      )}

      {singleSelected && onShare && (
        <Button size="sm" variant="outline" onClick={() => onShare(singleSelected)}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      )}

      {selectedNodes.length > 0 && (
        <Button size="sm" variant="destructive" onClick={() => onDelete(selectedNodes)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}

      <div className="flex-1" />

      <div className="flex items-center ml-2 pl-2 border-l space-x-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          aria-label={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
        >
          {viewMode === 'list' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
