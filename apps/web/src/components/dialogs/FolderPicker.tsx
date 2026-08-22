import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchClient } from '@/api/client';
import { ChevronRight, ChevronDown, Folder as FolderIcon } from 'lucide-react';
import type { FsNode, Page } from '@dataroom/shared';
import { useAuth } from '@/hooks/useAuth';

/** The minimal info FolderPicker passes back on selection. */
export interface PickedFolder {
  id: string;
  name: string;
}

interface FolderPickerProps {
  movingNodeIds: string[];
  currentParentId: string | null;
  selectedFolderId: string | null;
  onSelect?: (folder: PickedFolder) => void;
  onDropNodes?: (ids: string[], targetId: string) => void;
}

export function FolderPicker({
  movingNodeIds,
  currentParentId,
  selectedFolderId,
  onSelect,
  onDropNodes,
}: FolderPickerProps) {
  const { dataRoom } = useAuth();

  if (!dataRoom?.rootId) return null;

  return (
    <div className="border rounded-md p-2 overflow-y-auto max-h-[300px]">
      <FolderPickerItem
        nodeId={dataRoom.rootId}
        nodeName={dataRoom.name}
        movingNodeIds={movingNodeIds}
        currentParentId={currentParentId}
        selectedFolderId={selectedFolderId}
        onSelect={onSelect}
        onDropNodes={onDropNodes}
        level={0}
        disabledIds={new Set(movingNodeIds)} // Initialize disabled set with moving nodes
        isRoot={true}
      />
    </div>
  );
}

interface FolderPickerItemProps {
  nodeId: string;
  nodeName: string;
  movingNodeIds: string[];
  currentParentId: string | null;
  selectedFolderId: string | null;
  onSelect?: (folder: PickedFolder) => void;
  onDropNodes?: (ids: string[], targetId: string) => void;
  level: number;
  disabledIds: Set<string>;
  isRoot?: boolean;
}

function FolderPickerItem({
  nodeId,
  nodeName,
  movingNodeIds,
  currentParentId,
  selectedFolderId,
  onSelect,
  onDropNodes,
  level,
  disabledIds,
  isRoot,
}: FolderPickerItemProps) {
  const [expanded, setExpanded] = useState(isRoot || false);
  const [isDragOver, setIsDragOver] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['nodes', nodeId, 'children', 'folders'],
    queryFn: () => fetchClient<Page<FsNode>>(`/nodes/${nodeId}/children?type=FOLDER&limit=100`),
    enabled: expanded,
  });

  const children = data?.items || [];
  
  // A node is disabled if it is one of the moving nodes, or if its parent is disabled
  const isDisabled = disabledIds.has(nodeId);
  const isCurrentParent = nodeId === currentParentId;
  const cannotSelect = isDisabled || isCurrentParent;

  // Pass down disabled state: if this node is disabled, all its children are effectively disabled
  const childDisabledIds = new Set(disabledIds);
  if (isDisabled) {
    for (const child of children) {
      childDisabledIds.add(child.id);
    }
  } else {
    // Also disable children that are explicitly in movingNodeIds
    for (const id of movingNodeIds) {
      childDisabledIds.add(id);
    }
  }

  const handleSelect = () => {
    if (cannotSelect) return;
    if (selectedFolderId === nodeId) {
      setExpanded(!expanded);
    } else {
      setExpanded(true);
      if (onSelect) onSelect({ id: nodeId, name: nodeName });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (cannotSelect) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (cannotSelect) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (_e: React.DragEvent) => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    if (cannotSelect) return;
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/x-dataroom-nodes'));
      if (data && data.ids && onDropNodes) {
        if (!data.ids.includes(nodeId)) {
          onDropNodes(data.ids, nodeId);
        }
      }
    } catch {
      // ignore invalid data
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 rounded-sm cursor-pointer hover:bg-muted/50 ${
          selectedFolderId === nodeId ? 'bg-primary/10 text-primary' : ''
        } ${cannotSelect ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''} ${
          isDragOver ? 'ring-2 ring-primary bg-muted/50' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className="w-6 h-6 flex items-center justify-center cursor-pointer text-muted-foreground mr-1"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
        <FolderIcon className="w-4 h-4 mr-2 text-blue-500 fill-blue-500/20" />
        <span className="truncate flex-1 text-sm">{nodeName}</span>
        {isCurrentParent && (
          <span className="text-xs text-muted-foreground ml-2">(current folder)</span>
        )}
      </div>

      {expanded && (
        <div className="flex flex-col">
          {isLoading && (
            <div
              className="py-1 text-xs text-muted-foreground"
              style={{ paddingLeft: `${(level + 1) * 16 + 36}px` }}
            >
              Loading...
            </div>
          )}
          {children.map((child) => (
            <FolderPickerItem
              key={child.id}
              nodeId={child.id}
              nodeName={child.name}
              movingNodeIds={movingNodeIds}
              currentParentId={currentParentId}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onDropNodes={onDropNodes}
              level={level + 1}
              disabledIds={childDisabledIds}
            />
          ))}
          {!isLoading && children.length === 0 && (
            <div
              className="py-1 text-xs text-muted-foreground"
              style={{ paddingLeft: `${(level + 1) * 16 + 36}px` }}
            >
              No folders
            </div>
          )}
        </div>
      )}
    </div>
  );
}
