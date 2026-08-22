import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  File as FileIcon,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { previewFile, downloadFile } from '../hooks/useNodes';
import type { FsNode } from '@dataroom/shared';
import { formatBytes } from '../lib/utils';

interface FileViewerProps {
  file: FsNode;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function FileViewer({ file, onClose, onPrev, onNext }: FileViewerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && onPrev) onPrev();
      else if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  const handleDownload = async () => {
    try {
      const url = await downloadFile(file.id);
      window.location.assign(url);
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
      <header className="flex h-14 items-center justify-between border-b px-4 shrink-0 bg-background">
        <div className="flex items-center gap-2 truncate">
          <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="font-semibold truncate">{file.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-muted/30">
        {onPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 shadow-sm"
            onClick={onPrev}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        <ViewerContent file={file} onDownload={handleDownload} />

        {onNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 shadow-sm"
            onClick={onNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ViewerContent({ file, onDownload }: { file: FsNode; onDownload: () => void }) {
  const {
    data: previewUrl,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['preview', file.id],
    queryFn: () => previewFile(file.id),
    retry: false,
  });

  if (isLoading) {
    return <div className="text-muted-foreground animate-pulse">Loading preview...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Could not load preview</h3>
        <p className="text-sm text-muted-foreground mb-6">
          There was an error loading this file for preview.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
          <Button onClick={onDownload}>Download File</Button>
        </div>
      </div>
    );
  }

  if (!previewUrl) return null;

  const mime = file.mimeType || '';

  if (mime === 'application/pdf') {
    return <iframe src={previewUrl} className="w-full h-full border-0" title={file.name} />;
  }

  if (mime.startsWith('image/')) {
    return (
      <div className="w-full h-full p-8 flex items-center justify-center bg-zinc-950">
        <img
          src={previewUrl}
          alt={file.name}
          className="max-w-full max-h-full object-contain drop-shadow-lg"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-md bg-background rounded-lg border shadow-sm">
      <div className="rounded-full bg-muted p-6 mb-6">
        <FileIcon className="h-12 w-12 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold mb-1 truncate w-full">{file.name}</h3>
      <p className="text-sm text-muted-foreground mb-8">{formatBytes(file.sizeBytes)}</p>

      <p className="text-sm mb-6 text-balance">
        Previews for this file type are not supported. Please download the file to view its
        contents.
      </p>

      <Button onClick={onDownload} className="w-full sm:w-auto">
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  );
}
