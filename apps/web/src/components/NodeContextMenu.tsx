import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { FolderPlus, Pencil, Share2, Trash2, Scissors, Copy, ClipboardPaste, Download } from 'lucide-react';
import type { FsNode } from '@dataroom/shared';

interface NodeContextMenuProps {
  children: React.ReactNode;
  selectedNodes: FsNode[];
  onRename?: (node: FsNode) => void;
  onMove?: (nodes: FsNode[]) => void;
  onDelete?: (nodes: FsNode[]) => void;
  onShare?: (node: FsNode) => void;
  onCut?: (nodes: FsNode[]) => void;
  onCopy?: (nodes: FsNode[]) => void;
  onPaste?: () => void;
  canPaste?: boolean;
  onDownload?: (nodes: FsNode[]) => void;
  onSelectIfNeeded?: () => void;
}

export function NodeContextMenu({
  children,
  selectedNodes,
  onRename,
  onMove,
  onDelete,
  onShare,
  onCut,
  onCopy,
  onPaste,
  canPaste = false,
  onDownload,
  onSelectIfNeeded,
}: NodeContextMenuProps) {
  const singleSelected = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const foldersOnly = selectedNodes.every((n) => n.type === 'FOLDER');

  const handleContextMenu = () => {
    if (onSelectIfNeeded) onSelectIfNeeded();
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild onContextMenu={handleContextMenu}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {singleSelected && onRename && (
          <ContextMenuItem onClick={() => onRename(singleSelected)}>
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
        )}

        {selectedNodes.length > 0 && onCut && (
          <ContextMenuItem onClick={() => onCut(selectedNodes)}>
            <Scissors className="h-4 w-4 mr-2" />
            Cut
          </ContextMenuItem>
        )}

        {selectedNodes.length > 0 && onCopy && (
          <ContextMenuItem onClick={() => onCopy(selectedNodes)}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </ContextMenuItem>
        )}

        {canPaste && onPaste && (
          <ContextMenuItem onClick={onPaste}>
            <ClipboardPaste className="h-4 w-4 mr-2" />
            Paste
          </ContextMenuItem>
        )}

        {selectedNodes.length > 0 && onMove && (
          <ContextMenuItem onClick={() => onMove(selectedNodes)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Move
          </ContextMenuItem>
        )}

        {selectedNodes.length > 0 && !foldersOnly && onDownload && (
          <ContextMenuItem onClick={() => onDownload(selectedNodes)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </ContextMenuItem>
        )}

        {singleSelected && onShare && (
          <ContextMenuItem onClick={() => onShare(singleSelected)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </ContextMenuItem>
        )}

        {selectedNodes.length > 0 && onDelete && (
          <ContextMenuItem onClick={() => onDelete(selectedNodes)} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
