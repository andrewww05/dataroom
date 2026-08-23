import { useState, forwardRef } from 'react';
import type { FsNode } from '@dataroom/shared';
import { Folder, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { useRenameNode } from '@/hooks/useNodes';
import { Input } from '@/components/ui/input';

export interface NodeTileProps {
  node: FsNode;
  isSelected: boolean;
  selectedNodeIds?: string[];
  onSelectAction: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onDoubleClick: (node: FsNode) => void;
  onMoveNodes: (ids: string[], targetId: string) => void;
}

export const NodeTile = forwardRef<HTMLDivElement, NodeTileProps>(({
  node,
  isSelected,
  onSelectAction,
  onDoubleClick,
  onMoveNodes,
  selectedNodeIds = [],
}, ref) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const renameNode = useRenameNode();

  const handleDragStart = (e: React.DragEvent) => {
    const idsToMove = isSelected && selectedNodeIds.length > 0 ? selectedNodeIds : [node.id];
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'MOVE_NODES', ids: idsToMove }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (node.type !== 'FOLDER') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (node.type !== 'FOLDER') return;
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'MOVE_NODES' && data.ids && Array.isArray(data.ids)) {
        if (!data.ids.includes(node.id)) {
          onMoveNodes(data.ids, node.id);
        }
      }
    } catch {
      // ignore
    }
  };

  const isImage = node.mimeType?.startsWith('image/');
  const isVideo = node.mimeType?.startsWith('video/');

  return (
    <div
      ref={ref}
      aria-selected={isSelected}
      className={`relative group rounded-md border p-3 flex flex-col items-center cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50 border-transparent'
      } ${isDragOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
      onClick={onSelectAction}
      onDoubleClick={() => onDoubleClick(node)}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex-1 w-full flex items-center justify-center mb-2 overflow-hidden bg-muted/20 rounded aspect-square">
        {node.type === 'FOLDER' ? (
          <Folder className="h-16 w-16 text-blue-500 fill-blue-500/20" />
        ) : isImage ? (
          <ImageIcon className="h-16 w-16 text-muted-foreground" />
        ) : isVideo ? (
          <Video className="h-16 w-16 text-muted-foreground" />
        ) : (
          <FileText className="h-16 w-16 text-muted-foreground" />
        )}
      </div>

      <div className="w-full text-center">
        {isRenaming ? (
          <Input
            autoFocus
            defaultValue={node.name}
            className="h-7 text-xs text-center"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value.trim();
                if (val && val !== node.name) {
                  renameNode.mutate({ id: node.id, name: val, parentId: node.parentId! });
                }
                setIsRenaming(false);
              } else if (e.key === 'Escape') {
                setIsRenaming(false);
              }
            }}
            onBlur={() => setIsRenaming(false)}
          />
        ) : (
          <div className="truncate text-sm font-medium" title={node.name}>
            {node.name}
          </div>
        )}
      </div>
    </div>
  );
});
