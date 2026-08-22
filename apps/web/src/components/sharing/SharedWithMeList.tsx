import { useReceivedShares } from '@/hooks/useShares';
import { Link as LinkIcon } from 'lucide-react';

/**
 * Sidebar entry listing restricted shares the current user has received (FR-SHARE-080).
 * Hidden entirely when the list is empty (BR-100 — no placeholder).
 */
export function SharedWithMeList() {
  const { data: shares } = useReceivedShares();

  if (!shares || shares.length === 0) return null;

  return (
    <div className="space-y-1 mt-2">
      <h3 className="mb-1 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Shared with me
      </h3>
      {shares.map((share) => (
        <a
          key={share.token}
          href={`/s/${share.token}`}
          className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <LinkIcon className="h-3.5 w-3.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{share.node.name}</p>
            <p className="text-xs truncate">{share.ownerEmail}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
