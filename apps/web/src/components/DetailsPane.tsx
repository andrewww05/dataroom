import { useSelection } from '../hooks/useSelection';
import { useNodeStats, downloadFile } from '../hooks/useNodes';
import { File as FileIcon, Folder as FolderIcon, Info } from 'lucide-react';
import { formatBytes } from '../lib/utils';
import { ViewerContent } from './FileViewer';

import { useParams } from '@tanstack/react-router';

export function DetailsPane() {
  const { selectedNodes } = useSelection();
  const selectedNodesList = Object.values(selectedNodes);
  const { folderId } = useParams({ strict: false }) as { folderId?: string };

  if (selectedNodesList.length === 0 && folderId) {
    return (
      <aside className="w-72 border-l bg-muted/10 h-full hidden lg:flex flex-col shrink-0">
        <div className="p-4 border-b h-14 flex items-center shrink-0">
          <span className="font-semibold text-sm">Folder Details</span>
        </div>
        <div className="p-4">
          <FolderStats id={folderId} />
        </div>
      </aside>
    );
  }

  if (selectedNodesList.length !== 1) {
    return (
      <aside className="w-72 border-l bg-muted/10 h-full hidden lg:flex flex-col shrink-0">
        <div className="p-4 border-b h-14 flex items-center shrink-0">
          <span className="font-semibold text-sm">Details</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center h-[calc(100%-3.5rem)] text-muted-foreground text-sm text-center">
          <Info className="h-12 w-12 mb-4 opacity-20" />
          {selectedNodesList.length === 0
            ? 'Select an item to view details'
            : `${selectedNodesList.length} items selected`}
        </div>
      </aside>
    );
  }

  const node = selectedNodesList[0];

  return (
    <aside className="w-72 border-l bg-muted/10 h-full hidden lg:flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b h-14 flex items-center shrink-0">
        <span className="font-semibold text-sm">Details</span>
      </div>

      <div className="p-4 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            {node.type === 'FOLDER' ? (
              <FolderIcon className="h-16 w-16 text-blue-500/80" />
            ) : (
              <FileIcon className="h-16 w-16 text-muted-foreground/80" />
            )}
          </div>
          <h3 className="font-semibold text-base break-all">{node.name}</h3>
          <p className="text-sm text-muted-foreground capitalize mt-1">{node.type.toLowerCase()}</p>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Created
            </h4>
            <p>{new Date(node.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Modified
            </h4>
            <p>{new Date(node.updatedAt).toLocaleString()}</p>
          </div>

          {node.type === 'FILE' && (
            <div>
              <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Size
              </h4>
              <p>{formatBytes(node.sizeBytes)}</p>
            </div>
          )}

          {node.type === 'FOLDER' && <FolderStats id={node.id} />}
        </div>

        {node.type === 'FILE' && (
          <div className="mt-4 border rounded-md overflow-hidden bg-background aspect-square relative flex items-center justify-center">
            <ViewerContent
              file={node}
              onDownload={async () => {
                const url = await downloadFile(node.id);
                window.location.assign(url);
              }}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

function FolderStats({ id }: { id: string }) {
  const { data, isLoading } = useNodeStats(id);

  if (isLoading) {
    return <div className="text-muted-foreground text-sm animate-pulse">Loading stats...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Contents
        </h4>
        <p>
          {data.folders} folders, {data.files} files
        </p>
      </div>
      <div>
        <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Total Size
        </h4>
        <p>{formatBytes(data.bytes)}</p>
      </div>
    </div>
  );
}
