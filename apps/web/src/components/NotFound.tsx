import { Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Compass } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Rendered by the root route for any URL the route tree does not match.
 *
 * The primary action points at `/` rather than branching on whether anyone is signed in: the
 * authenticated layout's guard already sends an anonymous caller to the login screen, so one link
 * is correct in both states and there is no session check to keep in sync here.
 */
export function NotFound() {
  const router = useRouter();

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center max-w-sm mx-auto px-4">
        <div className="rounded-full bg-muted/50 p-6 mb-4 inline-block">
          <Compass className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This link may be broken, or whatever was here has since been moved or deleted.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => router.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </Button>
          <Button asChild>
            <Link to="/">Take me home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
