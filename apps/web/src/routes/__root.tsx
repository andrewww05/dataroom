import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { NotFound } from '@/components/NotFound';
import { ThemeProvider } from '@/components/ThemeProvider';

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="system" storageKey="dataroom-ui-theme">
      <Outlet />
      <Toaster />
      {/* <TanStackRouterDevtools /> */}
    </ThemeProvider>
  ),
  // Declared on the root route so it covers every unmatched URL, not just the ones under a layout
  // that happens to define its own. Without it the router falls back to its bare built-in text.
  notFoundComponent: NotFound,
});
