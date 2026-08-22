import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Folder, File, Home } from 'lucide-react';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const { user, isInitializing } = useAuth.getState();
    if (!isInitializing && !user) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, dataRoom, isInitializing, initialize, clearSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null; // Redirect will happen or we are waiting for state to update
  }

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-background">
      {/* Sidebar - Pane 1 */}
      <aside className="w-full md:w-64 border-r bg-muted/20 flex flex-col h-full shrink-0 hidden md:flex">
        <div className="p-4 border-b flex items-center h-14 shrink-0">
          <span className="font-semibold truncate">
            {dataRoom?.name || 'My Data Room'}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <Button variant="secondary" className="w-full justify-start">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            <Folder className="mr-2 h-4 w-4" />
            Shared with me
          </Button>
        </nav>
        <div className="p-4 border-t shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm truncate text-muted-foreground">{user.email}</span>
          </div>
          <Button variant="outline" className="w-full" onClick={() => {
            clearSession();
            router.navigate({ to: '/login' });
          }}>
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
          <nav className="flex items-center text-sm font-medium text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors">
              {dataRoom?.name || 'Data Room'}
            </span>
            <span className="mx-2">/</span>
            <span className="text-foreground">Current Folder</span>
          </nav>
        </header>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          <Outlet />
        </div>
      </main>

      {/* Details Pane - Pane 3 (placeholder for later slices) */}
      <aside className="w-72 border-l bg-muted/10 h-full hidden lg:block shrink-0">
        <div className="p-4 border-b h-14 flex items-center shrink-0">
          <span className="font-semibold text-sm">Details</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center h-[calc(100%-3.5rem)] text-muted-foreground text-sm text-center">
          <File className="h-12 w-12 mb-4 opacity-20" />
          Select an item to view details
        </div>
      </aside>
    </div>
  );
}
