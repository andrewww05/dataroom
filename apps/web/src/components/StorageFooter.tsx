import { useUsage } from '@/hooks/useUsage';
import { useAuth } from '@/hooks/useAuth';
import { formatBytes } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export function StorageFooter() {
  const { dataRoom } = useAuth();
  const { data: usage, isLoading } = useUsage(dataRoom?.id);

  if (!dataRoom || isLoading || !usage) {
    return <div className="p-4 border-t shrink-0 h-24" />;
  }

  const quotaBytes = 5 * 1024 * 1024 * 1024;
  const percentage = Math.min(100, Math.max(0, (usage.bytes / quotaBytes) * 100));
  const isDanger = percentage >= 90;

  return (
    <div className="p-4 border-t shrink-0">
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="font-medium text-muted-foreground">Storage</span>
        <span className="text-muted-foreground">
          {formatBytes(usage.bytes)} / {formatBytes(quotaBytes)}
        </span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${isDanger ? '[&>div]:bg-destructive' : ''}`}
      />
    </div>
  );
}
