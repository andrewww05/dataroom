import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { FolderPlus, Upload, ClipboardPaste } from 'lucide-react';

interface FolderBackgroundContextMenuProps {
  children: React.ReactNode;
  onCreateFolder?: () => void;
  onUploadFiles?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
}

export function FolderBackgroundContextMenu({
  children,
  onCreateFolder,
  onUploadFiles,
  onPaste,
  canPaste = false,
}: FolderBackgroundContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild className="h-full w-full block">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {onCreateFolder && (
          <ContextMenuItem onClick={onCreateFolder}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </ContextMenuItem>
        )}
        {onUploadFiles && (
          <ContextMenuItem onClick={onUploadFiles}>
            <Upload className="h-4 w-4 mr-2" />
            Upload files
          </ContextMenuItem>
        )}
        {canPaste && onPaste && (
          <ContextMenuItem onClick={onPaste}>
            <ClipboardPaste className="h-4 w-4 mr-2" />
            Paste
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
