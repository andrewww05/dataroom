import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { fetchClient } from '../api/client';
import type { Page, FsNode } from '@dataroom/shared';
import { Folder, FileText, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_authenticated/')({
  component: Index,
});

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '--';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function Index() {
  const { dataRoom } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['nodes', dataRoom?.rootId, 'children'],
    queryFn: () => 
      fetchClient<Page<FsNode>>(`/nodes/${dataRoom?.rootId}/children`),
    enabled: !!dataRoom?.rootId,
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Modified</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Size</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b">
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
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-2">Error loading contents.</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const items = data?.items || [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-muted/50 p-6 mb-4">
          <Folder className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold mb-1">This folder is empty</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          There are no files or folders here yet. Wait for the owner to upload some documents.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase border-b">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium hidden sm:table-cell">Modified</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Size</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((node) => (
            <tr key={node.id} className="hover:bg-muted/30 transition-colors group cursor-pointer">
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
                  year: 'numeric', month: 'short', day: 'numeric' 
                })}
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                {node.type === 'FILE' ? formatBytes(node.sizeBytes) : '--'}
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
