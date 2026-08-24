import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Folder, File, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/hooks/useSearch';
import { useRouter } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-4 w-4 text-muted-foreground" />;
  if (mimeType.startsWith('image/')) return <File className="h-4 w-4 text-muted-foreground" />;
  if (mimeType === 'application/pdf') return <FileText className="h-4 w-4 text-muted-foreground" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useSearch(query);
  const router = useRouter();
  const { dataRoom } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full bg-background pl-9 md:w-[260px] lg:w-[320px]"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isLoading && query.trim().length >= 3 && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && query.trim().length >= 3 && data && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-96 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
          {data.items.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No results found.</div>
          ) : (
            <ul className="flex flex-col p-1">
              {data.items.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = hit.type === 'FOLDER' ? hit.id : hit.parentId;
                      if (targetId === dataRoom?.rootId || !targetId) {
                        router.navigate({ to: '/' });
                      } else {
                        router.navigate({ to: '/f/$folderId', params: { folderId: targetId } });
                      }
                      handleSelect();
                    }}
                    className="flex flex-col gap-1 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left w-full"
                  >
                    <div className="flex items-center gap-2">
                      {hit.type === 'FOLDER' ? (
                        <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                      ) : (
                        getFileIcon(hit.mimeType)
                      )}
                      <span className="font-medium truncate">{hit.name}</span>
                    </div>
                    <div className="flex items-center gap-1 px-6 text-xs text-muted-foreground">
                      <span className="truncate">
                        {hit.path.length > 0 ? hit.path.map((p) => p.name).join(' / ') : 'Home'}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
