import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
  useParams,
  Link,
} from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchClient } from '../api/client';
import type { Breadcrumb } from '@dataroom/shared';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Share2 } from 'lucide-react';
import { DetailsPane } from '@/components/DetailsPane';
import { UploadProgressModal } from '@/components/UploadProgressModal';
import { FolderPicker } from '@/components/dialogs/FolderPicker';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import { SharedWithMeList } from '@/components/sharing/SharedWithMeList';
import { useMove } from '@/hooks/useMove';
import { SearchBox } from '@/components/SearchBox';

function BreadcrumbsNav({ dataRoomName }: { dataRoomName: string }) {
  const { folderId } = useParams({ strict: false }) as { folderId?: string };

  const { data: pathNodes = [] } = useQuery({
    queryKey: ['nodes', folderId, 'path'],
    queryFn: () => fetchClient<Breadcrumb[]>(`/nodes/${folderId}/path`),
    enabled: !!folderId,
  });

  return (
    <nav className="flex items-center text-sm font-medium text-muted-foreground overflow-hidden">
      <Link
        to="/"
        className="hover:text-foreground transition-colors shrink-0 truncate max-w-[120px] sm:max-w-[200px]"
      >
        {dataRoomName}
      </Link>

      {pathNodes.map((node) => (
        <div key={node.id} className="flex items-center shrink-0">
          <span className="mx-1 text-muted-foreground/50">/</span>
          <Link
            to="/f/$folderId"
            params={{ folderId: node.id }}
            className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-[200px]"
            activeProps={{ className: 'text-foreground' }}
          >
            {node.name}
          </Link>
        </div>
      ))}
    </nav>
  );
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // The token lives in localStorage, so whether a session exists is only known once `/auth/me`
    // has answered. Awaiting that is what makes this guard real: the previous version bailed out
    // while `isInitializing` was still true — which it always is on the first navigation — so an
    // anonymous caller reached the layout and got an empty render instead of the login screen.
    await useAuth.getState().ensureInitialized();

    if (!useAuth.getState().user) {
      // `next` carries the blocked URL so signing in returns the caller where they were headed
      // rather than to the root. /s/$token already redirects with this key for restricted shares.
      throw redirect({ to: '/login', search: { next: location.href } });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, dataRoom, clearSession } = useAuth();
  const router = useRouter();
  const { folderId } = useParams({ strict: false }) as { folderId?: string };
  const moveNodesMutation = useMove();
  const [shareRoomOpen, setShareRoomOpen] = useState(false);

  // `beforeLoad` has already resolved the session and redirected anyone without one, so this
  // narrows the type rather than guarding a state the user can actually observe.
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-background">
      {/* Sidebar - Pane 1 */}
      <aside className="w-full md:w-64 border-r bg-muted/20 flex flex-col h-full shrink-0 hidden md:flex">
        <div className="p-4 border-b flex items-center h-14 shrink-0">
          <span className="font-semibold truncate">{dataRoom?.name || 'My Data Room'}</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <Button variant="secondary" className="w-full justify-start">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <SharedWithMeList />
          <div className="pt-4 mt-4">
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Folders
            </h3>
            <FolderPicker
              movingNodeIds={[]}
              currentParentId={folderId || null}
              selectedFolderId={folderId || null}
              onSelect={(folder) => {
                if (folder.id === dataRoom?.rootId) {
                  router.navigate({ to: '/' });
                } else {
                  router.navigate({ to: '/f/$folderId', params: { folderId: folder.id } });
                }
              }}
              onDropNodes={(ids, targetId) => {
                if (folderId) {
                  moveNodesMutation.mutate({ ids, targetId, sourceParentId: folderId });
                }
              }}
            />
          </div>
        </nav>
        <div className="p-4 border-t shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm truncate text-muted-foreground">{user.email}</span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              clearSession();
              router.navigate({ to: '/login' });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content Area - Pane 2 */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header with Breadcrumbs */}
        <header className="h-14 border-b flex items-center px-4 shrink-0 gap-2">
          {/* Mobile menu trigger could go here */}
          <BreadcrumbsNav dataRoomName={dataRoom?.name || 'Data Room'} />
          <div className="flex-1 px-4 flex justify-end max-w-xl ml-auto">
            <SearchBox />
          </div>
          <div className="ml-2">
            {dataRoom?.rootId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShareRoomOpen(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </header>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          <Outlet />
        </div>
      </main>

      <DetailsPane />
      <UploadProgressModal />

      {dataRoom?.rootId && (
        <ShareDialog
          open={shareRoomOpen}
          onOpenChange={setShareRoomOpen}
          nodeId={dataRoom.rootId}
          nodeName={dataRoom.name}
          isRoomRoot
        />
      )}
    </div>
  );
}
