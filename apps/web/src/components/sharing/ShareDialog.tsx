import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNodeShares, useCreateShare, useRevokeShare } from '@/hooks/useShares';
import type { Share, ShareMode } from '@dataroom/shared';
import { Copy, Link, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  nodeName: string;
  /** When true, the node is the Data Room root — the dialog labels it differently. */
  isRoomRoot?: boolean;
}

function ShareLink({ share, onRevoke }: { share: Share; onRevoke: (share: Share) => void }) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const shareUrl = `${window.location.origin}/s/${share.token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">
            {share.mode === 'PUBLIC' ? 'Public link' : share.granteeEmail}
          </span>
        </div>
        {share.expiresAt && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Expires {new Date(share.expiresAt).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={handleCopy} title="Copy link">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        {confirmRevoke ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              onRevoke(share);
              setConfirmRevoke(false);
            }}
          >
            Confirm
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmRevoke(true)}
            title="Revoke"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ShareDialog({
  open,
  onOpenChange,
  nodeId,
  nodeName,
  isRoomRoot,
}: ShareDialogProps) {
  const [mode, setMode] = useState<ShareMode>('PUBLIC');
  const [granteeEmail, setGranteeEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const { data: nodeShares, isLoading } = useNodeShares(nodeId, open);
  const createShareMutation = useCreateShare();
  const revokeShareMutation = useRevokeShare();

  const title = isRoomRoot ? 'Share this entire Data Room' : `Share "${nodeName}"`;

  const handleCreate = async () => {
    const dto: { nodeId: string; mode: ShareMode; granteeEmail?: string; expiresAt?: string } = {
      nodeId,
      mode,
    };
    if (mode === 'RESTRICTED') {
      if (!granteeEmail.trim()) {
        toast.error('Email is required for restricted shares');
        return;
      }
      dto.granteeEmail = granteeEmail.trim();
    }
    if (expiresAt) {
      dto.expiresAt = new Date(expiresAt).toISOString();
    }

    createShareMutation.mutate(dto, {
      onSuccess: (data) => {
        const url = `${window.location.origin}/s/${data.token}`;
        navigator.clipboard.writeText(url).then(
          () => toast.success('Share link copied to clipboard'),
          () => toast('Share created'),
        );
        setGranteeEmail('');
        setExpiresAt('');
      },
    });
  };

  const handleRevoke = (share: Share) => {
    revokeShareMutation.mutate({ id: share.id, nodeId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === 'PUBLIC'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMode('PUBLIC')}
            >
              Anyone with the link
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === 'RESTRICTED'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMode('RESTRICTED')}
            >
              Only a specific person
            </button>
          </div>

          {/* RESTRICTED email field */}
          {mode === 'RESTRICTED' && (
            <div className="space-y-1.5">
              <Label htmlFor="share-email">Email address</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="name@example.com"
                value={granteeEmail}
                onChange={(e) => setGranteeEmail(e.target.value)}
              />
            </div>
          )}

          {/* Optional expiry */}
          <div className="space-y-1.5">
            <Label htmlFor="share-expiry">Expires (optional)</Label>
            <Input
              id="share-expiry"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={createShareMutation.isPending}
          >
            {createShareMutation.isPending ? 'Creating...' : 'Create link'}
          </Button>

          {/* Inherited share notice */}
          {nodeShares?.inheritedFrom && (
            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                A link to <strong>{nodeShares.inheritedFrom.name}</strong> also exposes this item.
              </p>
            </div>
          )}

          {/* Existing shares list */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading shares…</p>
          ) : nodeShares && nodeShares.own.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium mb-2">Active links</h4>
              <div className="max-h-48 overflow-y-auto">
                {nodeShares.own.map((share) => (
                  <ShareLink key={share.id} share={share} onRevoke={handleRevoke} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Revoke confirmation */}
          {revokeShareMutation.isPending && (
            <p className="text-sm text-muted-foreground">Revoking…</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
