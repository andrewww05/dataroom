import { Skeleton } from '@/components/ui/skeleton';

export function AppShellSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-background">
      <aside className="w-full md:w-64 border-r bg-muted/20 flex flex-col h-full shrink-0 hidden md:flex">
        <div className="p-4 border-b flex items-center h-14 shrink-0">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="pt-4 mt-4 space-y-2">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <div className="p-4 border-t shrink-0">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-14 border-b flex items-center px-4 shrink-0 gap-2">
          <Skeleton className="h-6 w-48" />
          <div className="flex-1 px-4 flex justify-end">
            <Skeleton className="h-9 w-64" />
          </div>
          <Skeleton className="h-9 w-20 ml-2" />
          <Skeleton className="h-9 w-9" />
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          <ListingSkeleton />
        </div>
      </main>
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="w-full">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase border-b">
          <tr>
            <th className="px-4 py-3 w-10"></th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium hidden sm:table-cell">Modified</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Size</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="border-b">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-4 rounded" />
              </td>
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

export function FolderTreeSkeleton({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={className || 'space-y-2 py-1'} style={style}>
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="h-4 w-3/4 max-w-[150px]" />
        </div>
      ))}
    </div>
  );
}
