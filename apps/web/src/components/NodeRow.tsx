import { useState, useRef } from 'react';
import { Folder, FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { FsNode } from '@dataroom/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { formatBytes } from '../lib/utils';
import { useRename } from '../hooks/useRename';

interface NodeRowProps {
  node: FsNode;
  isSelected: boolean;
  toggleSelect: (node: FsNode) => void;
  onDoubleClick: (node: FsNode) => void;
  onRenameAction: (node: FsNode) => void;
  onDeleteAction: (node: FsNode) => void;
  onMoveNodes?: (ids: string[], targetId: string) => void;
  selectedNodeIds?: string[];
}

export function NodeRow({
  node,
  isSelected,
  toggleSelect,
  onDoubleClick,
  onRenameAction,
  onDeleteAction,
  onMoveNodes,
  selectedNodeIds = [],
}: NodeRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const renameNode = useRename();
  const inputRef = useRef<HTMLInputElement>(null);

  const getStemAndExt = (name: string, type: 'FILE' | 'FOLDER') => {
    if (type === 'FOLDER') return { stem: name, ext: '' };
    const lastDot = name.lastIndexOf('.');
    if (lastDot <= 0) return { stem: name, ext: '' };
    return { stem: name.substring(0, lastDot), ext: name.substring(lastDot) };
  };

  const { stem, ext } = getStemAndExt(node.name, node.type);
  // editValue is kept in sync by enterRename() below, which resets it before entering rename mode.
  const [editValue, setEditValue] = useState(stem);

  /** Enter rename mode: reset the edit value to the current stem and focus the input. */
  const enterRename = () => {
    setEditValue(getStemAndExt(node.name, node.type).stem);
    setIsRenaming(true);
    // Wait for input to render before focusing
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const submitRename = () => {
    if (editValue.trim() === '' || editValue === stem) {
      setIsRenaming(false);
      return;
    }
    const newName = node.type === 'FILE' ? `${editValue}${ext}` : editValue;
    if (node.parentId) {
      renameNode.mutate(
        { id: node.id, parentId: node.parentId, name: newName },
        {
          onSuccess: () => setIsRenaming(false),
          onError: () => {
            // Keep editing state if failed, or optionally revert
            setIsRenaming(false);
          },
        }
      );
    } else {
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isRenaming) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitRename();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsRenaming(false);
      }
      return;
    }

    if (e.key === 'Enter') {
      onDoubleClick(node);
    } else if (e.key === 'F2') {
      enterRename();
    }
  };


  const handleDragStart = (e: React.DragEvent) => {
    if (isRenaming) {
      e.preventDefault();
      return;
    }
    // Set dragged ids. If this node is selected, drag all selected nodes.
    // If not selected, just drag this node. (But for simplicity, we pass node.id)
    // To drag multiple, FolderView would need to handle it or we pass selectedIds here.
    // Let's pass a JSON of ids.
    const idsToMove = isSelected && selectedNodeIds.length > 0 ? selectedNodeIds : [node.id];
    e.dataTransfer.setData('application/x-dataroom-nodes', JSON.stringify({ ids: idsToMove }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (node.type === 'FOLDER' && !isRenaming) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (node.type === 'FOLDER' && !isRenaming) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (_e: React.DragEvent) => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    if (node.type !== 'FOLDER' || isRenaming) return;
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/x-dataroom-nodes'));
      if (data && data.ids && onMoveNodes) {
        // Prevent moving a node into itself
        if (!data.ids.includes(node.id)) {
          onMoveNodes(data.ids, node.id);
        }
      }
    } catch {
      // ignore invalid data
    }
  };

  return (
    <tr
      className={`hover:bg-muted/30 transition-colors group cursor-pointer ${
        isSelected ? 'bg-muted/30' : ''
      } ${isDragOver ? 'ring-2 ring-primary bg-muted/50' : ''}`}
      onDoubleClick={() => {
        if (!isRenaming) onDoubleClick(node);
      }}
      onKeyDown={handleKeyDown}
      tabIndex={isRenaming ? -1 : 0}
      draggable={!isRenaming}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <td className="px-4 py-3 w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleSelect(node)}
          aria-label={`Select ${node.name}`}
        />
      </td>
      <td className="px-4 py-3 flex items-center gap-3">
        {node.type === 'FOLDER' ? (
          <Folder className="h-5 w-5 text-blue-500 fill-blue-500/20 flex-shrink-0" />
        ) : (
          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
        {isRenaming ? (
          <div className="flex items-center w-full relative">
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => submitRename()}
              className="h-7 py-1 px-2 w-full text-sm -ml-2"
              onClick={(e) => e.stopPropagation()}
              disabled={renameNode.isPending}
            />
            {ext && <span className="text-muted-foreground ml-1 text-sm absolute right-2 bg-background/80 px-1 pointer-events-none">{ext}</span>}
          </div>
        ) : (
          <span
            className="font-medium truncate flex-1"
          >
            {node.name}
          </span>
        )}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
        {new Date(node.updatedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </td>
      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
        {node.type === 'FILE' ? formatBytes(node.sizeBytes) : '--'}
      </td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRenameAction(node)}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteAction(node)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
