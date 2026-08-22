import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchClient } from '../api/client';
import { useUploadFiles } from '../hooks/useNodes';
import type { Page, FsNode } from '@dataroom/shared';
import { Folder, FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { ListingToolbar } from '@/components/ListingToolbar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NewFolderDialog } from '@/components/dialogs/NewFolderDialog';
import { RenameDialog } from '@/components/dialogs/RenameDialog';
import { DeleteDialog } from '@/components/dialogs/DeleteDialog';

import { FileViewer } from '@/components/FileViewer';
import { formatBytes } from '../lib/utils';
import { useSelection } from '../hooks/useSelection';

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

  const uploadFilesMutation = useUploadFiles();

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameNode, setRenameNode] = useState<FsNode | null>(null);
  const [deleteNode, setDeleteNode] = useState<FsNode | null>(null);

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
            {items.map((node) => {
              const isSelected = selectedIds.has(node.id);
              return (
                <tr
                  key={node.id}
                  className={`hover:bg-muted/30 transition-colors group cursor-pointer ${isSelected ? 'bg-muted/30' : ''}`}
                  onClick={(e: React.MouseEvent) => {
                    // Prevent row click if clicking checkbox or action button
                    if (
                      (e.target as HTMLElement).closest('button') ||
                      (e.target as HTMLElement).closest('div[role="checkbox"]')
                    ) {
                      return;
                    }
                    toggleSelect(node);
                  }}
                  onDoubleClick={() => handleDoubleClick(node)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDoubleClick(node);
                  }}
                  tabIndex={0}
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
                      <Folder className="h-5 w-5 text-blue-500 fill-blue-500/20" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="font-medium truncate">{node.name}</span>
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
                        <DropdownMenuItem onClick={() => setRenameNode(node)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteNode(node)}
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
            })}
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
