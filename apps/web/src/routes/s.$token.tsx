import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchClient, fetchShareClient } from '../api/client';
import type { Breadcrumb, FsNode, Page } from '@dataroom/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, FileIcon, Download, ShieldAlert, FolderX, LogIn } from 'lucide-react';


export const Route = createFileRoute('/s/$token')({
  component: SharedView,
});

// --- Screens ---

function SignInRequiredScreen({ token }: { token: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center max-w-sm mx-auto px-4">
        <div className="rounded-full bg-muted/50 p-6 mb-4 inline-block">
          <ShieldAlert className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
        <p className="text-sm text-muted-foreground mb-6">
          A shared link exists, but you need to sign in to access it.
        </p>
        <Button onClick={() => navigate({ to: '/login', search: { next: `/s/${token}` } as never })}>
          <LogIn className="h-4 w-4 mr-2" />
          Sign in
        </Button>
      </div>
    </div>
  );
}

function ShareRemovedScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center max-w-sm mx-auto px-4">
        <div className="rounded-full bg-muted/50 p-6 mb-4 inline-block">
          <FolderX className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-semibold mb-2">This folder was removed by its owner</h2>
        <p className="text-sm text-muted-foreground">
          The shared link is no longer available. The owner may have revoked access or deleted the
          content.
        </p>
      </div>
    </div>
  );
}

// --- Shared View Shell ---

interface SharedViewShellProps {
  shareToken: string;
  rootNodeId: string;
  ownerEmail: string;
}

function SharedViewShell({ shareToken, rootNodeId, ownerEmail }: SharedViewShellProps) {
  const [currentFolderId, setCurrentFolderId] = useState(rootNodeId);

  const { data: pathData = [] } = useQuery({
    queryKey: ['shared', shareToken, 'path', currentFolderId],
    queryFn: () =>
      fetchShareClient<Breadcrumb[]>(shareToken, `/nodes/${currentFolderId}/path`),
    enabled: !!currentFolderId,
  });

  const {
    data: childrenData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['shared', shareToken, 'children', currentFolderId],
    queryFn: () =>
      fetchShareClient<Page<FsNode>>(shareToken, `/nodes/${currentFolderId}/children`),
    enabled: !!currentFolderId,
  });

  const items = childrenData?.items || [];

  const handleNavigate = (node: FsNode) => {
    if (node.type === 'FOLDER') {
      setCurrentFolderId(node.id);
    }
  };

  const handleDownload = async (node: FsNode) => {
    if (node.type !== 'FILE') return;
    try {
      const res = await fetchShareClient<{ url: string }>(
        shareToken,
        `/files/${node.id}/download`,
      );
      window.open(res.url, '_blank');
    } catch {
      // silently fail — the toast would require a provider
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Header strip */}
      <header className="h-14 border-b flex items-center px-4 shrink-0 gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Shared by <strong className="text-foreground">{ownerEmail}</strong>
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span>read only</span>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="border-b px-4 py-2 flex items-center text-sm text-muted-foreground overflow-hidden">
        {pathData.map((crumb, i) => (
          <div key={crumb.id} className="flex items-center shrink-0">
            {i > 0 && <span className="mx-1 text-muted-foreground/50">/</span>}
            <button
              type="button"
              onClick={() => setCurrentFolderId(crumb.id)}
              className={`hover:text-foreground transition-colors truncate max-w-[200px] ${
                crumb.id === currentFolderId ? 'text-foreground font-medium' : ''
              }`}
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4">
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
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-2">Error loading contents.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-muted/50 p-6 mb-4">
              <Folder className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">This folder is empty</h3>
            <p className="text-sm text-muted-foreground">
              There are no files or folders here yet.
            </p>
          </div>
        ) : (
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
                <SharedNodeRow
                  key={node.id}
                  node={node}
                  onDoubleClick={handleNavigate}
                  onDownload={handleDownload}
                />
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

// --- Shared Node Row (read-only) ---

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '--';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function SharedNodeRow({
  node,
  onDoubleClick,
  onDownload,
}: {
  node: FsNode;
  onDoubleClick: (node: FsNode) => void;
  onDownload: (node: FsNode) => void;
}) {
  return (
    <tr
      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
      onDoubleClick={() => onDoubleClick(node)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {node.type === 'FOLDER' ? (
            <Folder className="h-5 w-5 text-blue-500 shrink-0" />
          ) : (
            <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
        {new Date(node.updatedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
        {node.type === 'FILE' ? formatBytes(node.sizeBytes) : '--'}
      </td>
      <td className="px-4 py-3 text-right">
        {node.type === 'FILE' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(node);
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </td>
    </tr>
  );
}

// --- Main Component ---

function SharedView() {
  const { token } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['shared', token, 'resolve'],
    queryFn: () =>
      fetchClient<{
        node: FsNode;
        mode: string;
        role: string;
        rootNodeId: string;
        ownerEmail: string;
      }>(`/shares/resolve?token=${encodeURIComponent(token)}`),
    retry: false,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading shared content…</p>
        </div>
      </div>
    );
  }

  if (error) {
    const apiError = error as { code?: string };
    if (apiError.code === 'SIGN_IN_REQUIRED') {
      return <SignInRequiredScreen token={token} />;
    }
    // NOT_FOUND, expired, revoked — all get the removed screen (FR-SHARE-050)
    return <ShareRemovedScreen />;
  }

  if (!data) {
    return <ShareRemovedScreen />;
  }

  return (
    <SharedViewShell
      shareToken={token}
      rootNodeId={data.rootNodeId}
      ownerEmail={data.ownerEmail}
    />
  );
}
