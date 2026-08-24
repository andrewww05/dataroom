import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchClient } from '../api/client';
import { useUploadFiles, downloadFile } from '../hooks/useNodes';
import { useClipboard } from '../hooks/useClipboard';
import { useCopyNodes } from '../hooks/useCopyNodes';
import type { Page, FsNode } from '@dataroom/shared';
import { Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingSkeleton } from '@/components/skeletons';
import { ListingToolbar } from '@/components/ListingToolbar';
import { NewFolderDialog } from '@/components/dialogs/NewFolderDialog';
import { RenameDialog } from '@/components/dialogs/RenameDialog';
import { DeleteDialog } from '@/components/dialogs/DeleteDialog';
import { MoveDialog } from '@/components/dialogs/MoveDialog';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import { useMove } from '@/hooks/useMove';

import { FileViewer } from '@/components/FileViewer';
import { useSelection } from '../hooks/useSelection';
import { NodeRow } from '@/components/NodeRow';
import { NodeContextMenu } from '@/components/NodeContextMenu';
import { FolderBackgroundContextMenu } from '@/components/FolderBackgroundContextMenu';
import { useViewMode } from '@/hooks/useViewMode';
import { NodeTile } from '@/components/NodeTile';
import { useKeyboardMap } from '@/hooks/useKeyboardMap';

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
  const { selectedIds, toggle, clear, selectAll } = useSelection();
  const selectedNodeIdsArray = Array.from(selectedIds);
  // Get full nodes for the selected IDs by filtering items
  // Since items might be empty before query loads, we also need to ensure items is defined early
  // We can do this below or derive it in render.

  const uploadFilesMutation = useUploadFiles();
  const moveNodesMutation = useMove();
  const copyNodesMutation = useCopyNodes();
  const {
    ids: clipboardIds,
    mode: clipboardMode,
    sourceParentId,
    setClipboard,
    clearClipboard,
  } = useClipboard();
  const { mode: viewMode } = useViewMode();

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameNode, setRenameNode] = useState<FsNode | null>(null);
  const [deleteNodes, setDeleteNodes] = useState<FsNode[]>([]);
  const [moveNodesList, setMoveNodesList] = useState<FsNode[]>([]);
  const [shareNode, setShareNode] = useState<FsNode | null>(null);

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

  useEffect(() => {
    const handleDelete = (e: Event) => {
      setDeleteNodes((e as CustomEvent).detail);
    };
    const handleMove = (e: Event) => {
      setMoveNodesList((e as CustomEvent).detail);
    };
    const handleDownload = async (e: Event) => {
      const nodes = (e as CustomEvent).detail as FsNode[];
      const files = nodes.filter((n) => n.type === 'FILE');
      for (let i = 0; i < files.length; i++) {
        // staggered download
        setTimeout(async () => {
          const url = await downloadFile(files[i].id);
          window.location.assign(url);
        }, i * 500);
      }
    };

    document.addEventListener('dataroom:delete', handleDelete);
    document.addEventListener('dataroom:move', handleMove);
    document.addEventListener('dataroom:download-bulk', handleDownload);
    return () => {
      document.removeEventListener('dataroom:delete', handleDelete);
      document.removeEventListener('dataroom:move', handleMove);
      document.removeEventListener('dataroom:download-bulk', handleDownload);
    };
  }, []);

  const items = data?.items || [];
  const selectedNodesList = items.filter((n) => selectedIds.has(n.id));

  useKeyboardMap({
    onEscape: () => {
      if (activeFileId) {
        // Viewer is active - handled by FileViewer onClose (or dialog natively)
        // actually FileViewer onClose is triggered by its own Dialog's Esc handling.
        // We only clear selection if we reach here and it wasn't intercepted
        if (
          !newFolderOpen &&
          !renameNode &&
          !shareNode &&
          moveNodesList.length === 0 &&
          deleteNodes.length === 0
        ) {
          clear();
        }
      } else if (
        !newFolderOpen &&
        !renameNode &&
        !shareNode &&
        moveNodesList.length === 0 &&
        deleteNodes.length === 0
      ) {
        clear();
      }
    },
    onUp: (shift) => {
      if (items.length === 0) return;
      if (selectedNodesList.length === 0) {
        toggle(items[items.length - 1].id);
        return;
      }
      const activeId = selectedNodesList[selectedNodesList.length - 1].id;
      const index = items.findIndex((i) => i.id === activeId);
      if (index > 0) {
        if (!shift) clear();
        toggle(items[index - 1].id);
      }
    },
    onDown: (shift) => {
      if (items.length === 0) return;
      if (selectedNodesList.length === 0) {
        toggle(items[0].id);
        return;
      }
      const activeId = selectedNodesList[selectedNodesList.length - 1].id;
      const index = items.findIndex((i) => i.id === activeId);
      if (index >= 0 && index < items.length - 1) {
        if (!shift) clear();
        toggle(items[index + 1].id);
      }
    },
    onEnter: () => {
      if (selectedNodesList.length === 1) {
        handleDoubleClick(selectedNodesList[0]);
      }
    },
    onBackspace: () => {
      // Go up one folder
      if (dataRoom && folderId !== dataRoom.rootId) {
        // Need parent folder ID... unfortunately we don't have it natively in children list
        // Let's just navigate to parent using path if we had it, but we can also just use browser back or not.
        // Wait, the breadcrumb has it. We can just navigate to parent by fetching it or looking at history.
        // Actually, if we're not at root, we can go back.
        navigate({ to: '..' });
      }
    },
    onF2: () => {
      if (selectedNodesList.length === 1) {
        setRenameNode(selectedNodesList[0]);
      }
    },
    onDelete: () => {
      if (selectedNodesList.length > 0) {
        setDeleteNodes(selectedNodesList);
      }
    },
    onSelectAll: () => {
      if (items.length > 0) {
        selectAll(items);
      }
    },
    onCut: () => {
      if (selectedNodesList.length > 0 && folderId) {
        setClipboard(
          selectedNodesList.map((n) => n.id),
          'cut',
          folderId,
        );
        clear();
      }
    },
    onCopy: () => {
      if (selectedNodesList.length > 0 && folderId) {
        setClipboard(
          selectedNodesList.map((n) => n.id),
          'copy',
          folderId,
        );
        clear();
      }
    },
    onPaste: () => {
      if (!folderId || !sourceParentId || clipboardIds.length === 0) return;
      if (clipboardMode === 'cut') {
        moveNodesMutation.mutate({ ids: clipboardIds, targetId: folderId, sourceParentId });
        clearClipboard();
      } else if (clipboardMode === 'copy') {
        copyNodesMutation.mutate({ ids: clipboardIds, targetId: folderId });
      }
    },
    onSearch: () => {
      document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    },
  });

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
            onDelete={(nodes) => setDeleteNodes(nodes)}
            onShare={(node) => setShareNode(node)}
            onCut={(nodes) => {
              if (folderId)
                setClipboard(
                  nodes.map((n) => n.id),
                  'cut',
                  folderId,
                );
              clear();
            }}
            onCopy={(nodes) => {
              if (folderId)
                setClipboard(
                  nodes.map((n) => n.id),
                  'copy',
                  folderId,
                );
              clear();
            }}
            canPaste={clipboardIds.length > 0 && !!folderId}
            onPaste={() => {
              if (!folderId || !sourceParentId || clipboardIds.length === 0) return;
              if (clipboardMode === 'cut') {
                moveNodesMutation.mutate({ ids: clipboardIds, targetId: folderId, sourceParentId });
                clearClipboard();
              } else if (clipboardMode === 'copy') {
                copyNodesMutation.mutate({ ids: clipboardIds, targetId: folderId });
              }
            }}
          />
        )}
        <div className="h-full p-4">
          <ListingSkeleton />
        </div>
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
          onDelete={(nodes) => setDeleteNodes(nodes)}
          onShare={(node) => setShareNode(node)}
          onCut={(nodes) => {
            if (folderId)
              setClipboard(
                nodes.map((n) => n.id),
                'cut',
                folderId,
              );
            clear();
          }}
          onCopy={(nodes) => {
            if (folderId)
              setClipboard(
                nodes.map((n) => n.id),
                'copy',
                folderId,
              );
            clear();
          }}
          canPaste={clipboardIds.length > 0 && !!folderId}
          onPaste={() => {
            if (!folderId || !sourceParentId || clipboardIds.length === 0) return;
            if (clipboardMode === 'cut') {
              moveNodesMutation.mutate({ ids: clipboardIds, targetId: folderId, sourceParentId });
              clearClipboard();
            } else if (clipboardMode === 'copy') {
              copyNodesMutation.mutate({ ids: clipboardIds, targetId: folderId });
            }
          }}
        />
      )}

      {items.length === 0 ? (
        <FolderBackgroundContextMenu
          onCreateFolder={() => setNewFolderOpen(true)}
          onUploadFiles={() =>
            document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
          }
          canPaste={clipboardIds.length > 0 && !!folderId}
          onPaste={() => {
            if (!folderId || !sourceParentId || clipboardIds.length === 0) return;
            if (clipboardMode === 'cut') {
              moveNodesMutation.mutate({ ids: clipboardIds, targetId: folderId, sourceParentId });
              clearClipboard();
            } else if (clipboardMode === 'copy') {
              copyNodesMutation.mutate({ ids: clipboardIds, targetId: folderId });
            }
          }}
        >
          <div className="flex flex-col items-center justify-center py-24 text-center flex-1 h-full">
            <div className="rounded-full bg-muted/50 p-6 mb-4">
              <Folder className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">This folder is empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              There are no files or folders here yet. Wait for the owner to upload some documents.
            </p>
          </div>
        </FolderBackgroundContextMenu>
      ) : (
        <FolderBackgroundContextMenu
          onCreateFolder={() => setNewFolderOpen(true)}
          onUploadFiles={() =>
            document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
          }
          canPaste={clipboardIds.length > 0 && !!folderId}
          onPaste={() => {
            if (!folderId || !sourceParentId || clipboardIds.length === 0) return;
            if (clipboardMode === 'cut') {
              moveNodesMutation.mutate({ ids: clipboardIds, targetId: folderId, sourceParentId });
              clearClipboard();
            } else if (clipboardMode === 'copy') {
              copyNodesMutation.mutate({ ids: clipboardIds, targetId: folderId });
            }
          }}
        >
          <div className="h-full p-4">
            {viewMode === 'list' ? (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && selectedIds.size === items.length}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate =
                              selectedIds.size > 0 && selectedIds.size < items.length;
                          }
                        }}
                        onChange={(e) => {
                          if (e.target.checked) {
                            useSelection.getState().selectAll(items);
                          } else {
                            clear();
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium w-32">Size</th>
                    <th className="px-4 py-3 font-medium w-48">Modified</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((node) => {
                    const isSelected = selectedIds.has(node.id);
                    const contextNodes = isSelected ? selectedNodesList : [node];

                    return (
                      <NodeContextMenu
                        key={`ctx-${node.id}`}
                        selectedNodes={contextNodes}
                        onSelectIfNeeded={() => {
                          if (!isSelected) {
                            useSelection.getState().selectOne(node.id);
                          }
                        }}
                        onRename={setRenameNode}
                        onMove={setMoveNodesList}
                        onDelete={(nodes) => setDeleteNodes(nodes)}
                        onShare={setShareNode}
                        onCut={(nodes) => {
                          if (folderId)
                            setClipboard(
                              nodes.map((n) => n.id),
                              'cut',
                              folderId,
                            );
                          clear();
                        }}
                        onCopy={(nodes) => {
                          if (folderId)
                            setClipboard(
                              nodes.map((n) => n.id),
                              'copy',
                              folderId,
                            );
                          clear();
                        }}
                        canPaste={clipboardIds.length > 0 && !!folderId}
                        onPaste={() => {
                          if (!folderId || !sourceParentId || clipboardIds.length === 0) return;
                          if (clipboardMode === 'cut') {
                            moveNodesMutation.mutate({
                              ids: clipboardIds,
                              targetId: folderId,
                              sourceParentId,
                            });
                            clearClipboard();
                          } else if (clipboardMode === 'copy') {
                            copyNodesMutation.mutate({ ids: clipboardIds, targetId: folderId });
                          }
                        }}
                        onDownload={async (nodes) => {
                          const files = nodes.filter((n) => n.type === 'FILE');
                          for (let i = 0; i < files.length; i++) {
                            setTimeout(async () => {
                              const url = await downloadFile(files[i].id);
                              window.location.assign(url);
                            }, i * 500);
                          }
                        }}
                      >
                        <NodeRow
                          node={node}
                          isSelected={isSelected}
                          selectedNodeIds={selectedNodeIdsArray}
                          onSelectAction={(e) => {
                            if (e.shiftKey) {
                              useSelection.getState().selectRange(items, node.id);
                            } else if (e.metaKey || e.ctrlKey) {
                              toggle(node.id);
                            } else {
                              useSelection.getState().selectOne(node.id);
                            }
                          }}
                          onToggleSelection={() => toggle(node.id)}
                          onDoubleClick={handleDoubleClick}
                          onRenameAction={setRenameNode}
                          onDeleteAction={(node) => setDeleteNodes([node])}
                          onMoveNodes={(ids, targetId) => {
                            if (folderId) {
                              moveNodesMutation.mutate({ ids, targetId, sourceParentId: folderId });
                            }
                          }}
                        />
                      </NodeContextMenu>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
                {items.map((node) => {
                  const isSelected = selectedIds.has(node.id);
                  const contextNodes = isSelected ? selectedNodesList : [node];

                  return (
                    <NodeContextMenu
                      key={`ctx-${node.id}`}
                      selectedNodes={contextNodes}
                      onSelectIfNeeded={() => {
                        if (!isSelected) {
                          useSelection.getState().selectOne(node.id);
                        }
                      }}
                      onRename={setRenameNode}
                      onMove={setMoveNodesList}
                      onDelete={(nodes) => setDeleteNodes(nodes)}
                      onShare={setShareNode}
                      onCut={(nodes) => {
                        if (folderId)
                          setClipboard(
                            nodes.map((n) => n.id),
                            'cut',
                            folderId,
                          );
                        clear();
                      }}
                      onCopy={(nodes) => {
                        if (folderId)
                          setClipboard(
                            nodes.map((n) => n.id),
                            'copy',
                            folderId,
                          );
                        clear();
                      }}
                      canPaste={clipboardIds.length > 0 && !!folderId}
                      onPaste={() => {
                        if (!folderId || !sourceParentId || clipboardIds.length === 0) return;
                        if (clipboardMode === 'cut') {
                          moveNodesMutation.mutate({
                            ids: clipboardIds,
                            targetId: folderId,
                            sourceParentId,
                          });
                          clearClipboard();
                        } else if (clipboardMode === 'copy') {
                          copyNodesMutation.mutate({ ids: clipboardIds, targetId: folderId });
                        }
                      }}
                      onDownload={async (nodes) => {
                        const files = nodes.filter((n) => n.type === 'FILE');
                        for (let i = 0; i < files.length; i++) {
                          setTimeout(async () => {
                            const url = await downloadFile(files[i].id);
                            window.location.assign(url);
                          }, i * 500);
                        }
                      }}
                    >
                      <NodeTile
                        node={node}
                        isSelected={isSelected}
                        selectedNodeIds={selectedNodeIdsArray}
                        onSelectAction={(e) => {
                          if (e.shiftKey) {
                            useSelection.getState().selectRange(items, node.id);
                          } else if (e.metaKey || e.ctrlKey) {
                            toggle(node.id);
                          } else {
                            useSelection.getState().selectOne(node.id);
                          }
                        }}
                        onDoubleClick={handleDoubleClick}
                        onMoveNodes={(ids, targetId) => {
                          if (folderId) {
                            moveNodesMutation.mutate({ ids, targetId, sourceParentId: folderId });
                          }
                        }}
                      />
                    </NodeContextMenu>
                  );
                })}
              </div>
            )}
          </div>
        </FolderBackgroundContextMenu>
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
        key={deleteNodes.length > 0 ? deleteNodes[0].id : 'delete-closed'}
        open={deleteNodes.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteNodes([]);
            // clear selection if the nodes were deleted and they were selected
            deleteNodes.forEach((node) => {
              if (selectedIds.has(node.id)) {
                toggle(node.id);
              }
            });
          }
        }}
        nodes={deleteNodes}
      />

      <MoveDialog
        open={moveNodesList.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setMoveNodesList([]);
            clear();
          }
        }}
        nodesToMove={moveNodesList}
      />

      {shareNode && (
        <ShareDialog
          open={!!shareNode}
          onOpenChange={(open) => !open && setShareNode(null)}
          nodeId={shareNode.id}
          nodeName={shareNode.name}
          isRoomRoot={shareNode.id === dataRoom?.rootId}
        />
      )}

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
