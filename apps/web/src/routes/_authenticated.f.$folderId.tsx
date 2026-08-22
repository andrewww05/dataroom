import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchClient } from '../api/client';
import { useUploadFiles } from '../hooks/useNodes';
import type { Page, FsNode } from '@dataroom/shared';
import { Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { ListingToolbar } from '@/components/ListingToolbar';
import { NewFolderDialog } from '@/components/dialogs/NewFolderDialog';
import { RenameDialog } from '@/components/dialogs/RenameDialog';
import { DeleteDialog } from '@/components/dialogs/DeleteDialog';
import { MoveDialog } from '@/components/dialogs/MoveDialog';
import { useMove } from '@/hooks/useMove';

import { FileViewer } from '@/components/FileViewer';
import { useSelection } from '../hooks/useSelection';
import { NodeRow } from '@/components/NodeRow';

export const Route = createFileRoute('/_authenticated/f/$folderId')({
  validateSearch: (search: Record<string, unknown>): { file?: string } => {
    return {
      file: typeof search.file === 'string' ? search.file : undefined,
    };
  },
  component: FolderView,
});

export function FolderView() {
  const { dataRoom } = useAuth();
  const { folderId } = Route.useParams();
  const { file: activeFileId } = Route.useSearch();
  const navigate = useNavigate();
  const { selectedNodes, toggleSelect, clearSelection, removeNode } = useSelection();
  const selectedNodesList = Object.values(selectedNodes);
  const selectedIds = new Set(Object.keys(selectedNodes));
  const selectedNodeIdsArray = Array.from(selectedIds);

  const uploadFilesMutation = useUploadFiles();
  const moveNodesMutation = useMove();

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameNode, setRenameNode] = useState<FsNode | null>(null);
  const [deleteNode, setDeleteNode] = useState<FsNode | null>(null);
  const [moveNodesList, setMoveNodesList] = useState<FsNode[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['nodes', folderId, 'children'],
    queryFn: () => fetchClient<Page<FsNode>>(`/nodes/${folderId}/children`),
    enabled: !!folderId,
    retry: (failureCount, err: unknown) => {
      const status = (err as { status?: number })?.status;
      if (status === 404) return false;
      return failureCount < 3;
    },
  });

  const items = data?.items || [];

  const toggleSelectAll = () => {
    if (selectedNodesList.length === items.length && items.length > 0) {
      clearSelection();
    } else {
      items.forEach((item) => {
        if (!selectedIds.has(item.id)) {
          toggleSelect(item);
        }
      });
    }
  };

  const filesOnly = items.filter((n) => n.type === 'FILE');
  const activeFileIndex = activeFileId ? filesOnly.findIndex((n) => n.id === activeFileId) : -1;
  const activeFile = activeFileIndex >= 0 ? filesOnly[activeFileIndex] : null;

  const handleDoubleClick = async (node: FsNode) => {
    if (node.type === 'FOLDER') {
      navigate({ to: '/f/$folderId', params: { folderId: node.id } });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ search: { file: node.id } as any });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase border-b">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Modified</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Size</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-4 rounded" />
                </td>
                <td className="px-4 py-3 flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-48" />
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    const err = error as { status?: number; message: string };
    if (err?.status === 404) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted/50 p-6 mb-4">
            <Folder className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Folder not found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            This folder doesn't exist, is a file, or you don't have access to it.
          </p>
          <Button onClick={() => navigate({ to: '/' })}>Return to Room</Button>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-2">Error loading contents.</p>
        <p className="text-sm text-muted-foreground">{err.message}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full">
      {dataRoom?.rootId && (
        <ListingToolbar
          selectedNodes={selectedNodesList}
          onCreateFolder={() => setNewFolderOpen(true)}
          onUploadFiles={(files) => {
            if (folderId) {
              uploadFilesMutation.mutate({ parentId: folderId, files });
            }
          }}
          onRename={(node) => setRenameNode(node)}
          onMove={(nodes) => setMoveNodesList(nodes)}
          onDelete={(node) => setDeleteNode(node)}
        />
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center flex-1">
          <div className="rounded-full bg-muted/50 p-6 mb-4">
            <Folder className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-1">This folder is empty</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            There are no files or folders here yet. Wait for the owner to upload some documents.
          </p>
        </div>
      ) : (
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase border-b">
            <tr>
              <th className="px-4 py-3 w-10">
                <Checkbox
                  checked={selectedNodesList.length === items.length && items.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Modified</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Size</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((node) => (
              <NodeRow
                key={node.id}
                node={node}
                isSelected={selectedIds.has(node.id)}
                selectedNodeIds={selectedNodeIdsArray}
                toggleSelect={toggleSelect}
                onDoubleClick={handleDoubleClick}
                onRenameAction={setRenameNode}
                onDeleteAction={setDeleteNode}
                onMoveNodes={(ids, targetId) => {
                  if (folderId) {
                    moveNodesMutation.mutate({ ids, targetId, sourceParentId: folderId });
                  }
                }}
              />
            ))}
          </tbody>
        </table>
      )}

      {folderId && (
        <NewFolderDialog
          key={newFolderOpen ? 'new-folder-open' : 'new-folder-closed'}
          open={newFolderOpen}
          onOpenChange={setNewFolderOpen}
          parentId={folderId}
        />
      )}

      <RenameDialog
        key={renameNode?.id || 'rename-closed'}
        open={!!renameNode}
        onOpenChange={(open) => !open && setRenameNode(null)}
        node={renameNode}
      />

      <DeleteDialog
        key={deleteNode?.id || 'delete-closed'}
        open={!!deleteNode}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteNode(null);
            // clear selection if the node was deleted and it was selected
            if (deleteNode && selectedIds.has(deleteNode.id)) {
              removeNode(deleteNode.id);
            }
          }
        }}
        node={deleteNode}
      />

      <MoveDialog
        open={moveNodesList.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setMoveNodesList([]);
            clearSelection();
          }
        }}
        nodesToMove={moveNodesList}
      />

      {activeFile && (
        <FileViewer
          file={activeFile}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClose={() => navigate({ search: { file: undefined } as any })}
          onPrev={
            activeFileIndex > 0
              ? () => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  navigate({ search: { file: filesOnly[activeFileIndex - 1].id } as any });
                }
              : undefined
          }
          onNext={
            activeFileIndex < filesOnly.length - 1
              ? () => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  navigate({ search: { file: filesOnly[activeFileIndex + 1].id } as any });
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
