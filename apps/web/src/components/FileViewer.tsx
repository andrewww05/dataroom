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

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function FileViewer({ file, onClose, onPrev, onNext }: FileViewerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape is handled by Dialog natively
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      else if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext]);

  const handleDownload = async () => {
    try {
      const url = await downloadFile(file.id);
      window.location.assign(url);
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-full w-full h-full p-0 flex flex-col m-0 border-0 rounded-none overflow-hidden bg-background/95 backdrop-blur-sm shadow-none [&>button]:hidden"
      >
        <DialogTitle className="sr-only">File Viewer</DialogTitle>
        <DialogDescription className="sr-only">Viewing {file.name}</DialogDescription>
        
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
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close viewer">
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
              aria-label="Previous file"
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
              aria-label="Next file"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Fetches the text content of a presigned URL from the object store.
 * Uses the same useQuery pattern as the presigned-URL query above so that
 * loading and error states flow through the existing UI (BR-050).
 */
function useTextContent(url: string) {
  return useQuery({
    queryKey: ['text-content', url],
    queryFn: () => fetch(url).then((r) => r.text()),
    retry: false,
  });
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

  // image/* covers raster formats (PNG, JPEG, GIF, WebP) and image/svg+xml.
  // SVG is rendered via <img>, which the browser sandboxes safely — no inline <svg> or
  // dangerouslySetInnerHTML. SVG upload is blocked server-side (BR-040); this handles files
  // that pre-date that rule. (FR-VIEW-060 task 1.4 — no code change needed here.)
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

  // video/* — stream bytes directly from the object store via the presigned URL (FR-VIEW-060).
  // Native controls only — no custom player (BR-100: nothing half-implemented).
  if (mime.startsWith('video/')) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950">
        <video controls src={previewUrl} className="max-w-full max-h-full" />
      </div>
    );
  }

  // audio/* — stream bytes from the object store; file name shown above the player (FR-VIEW-060).
  if (mime.startsWith('audio/')) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8">
        <p className="text-sm font-medium text-foreground truncate max-w-xs">{file.name}</p>
          <audio controls src={previewUrl} className="w-full max-w-lg" />
      </div>
    );
  }

  // text/plain, text/csv, text/markdown, text/x-markdown — fetch bytes from the presigned URL
  // (never through the API) and display verbatim in a <pre> (FR-VIEW-060, BR-050).
  const TEXT_TYPES = ['text/plain', 'text/csv', 'text/markdown', 'text/x-markdown'];
  if (TEXT_TYPES.includes(mime)) {
    return <TextViewer url={previewUrl} onDownload={onDownload} />;
  }

  // Honest fallback for Office, proprietary binary, and any other format the browser cannot
  // render natively. Shows file identity and a Download button; never an empty frame (FR-VIEW-060).
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

/**
 * Renders a plain-text file fetched from a presigned URL inside a <pre> block.
 * Delegates to ViewerContent's error UI pattern on fetch failure (BR-050).
 */
function TextViewer({
  url,
  onDownload,
}: {
  url: string;
  onDownload: () => void;
}) {
  const { data: text, isLoading, error, refetch } = useTextContent(url);

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

  return (
    <pre className="overflow-auto whitespace-pre-wrap font-mono text-sm p-6 w-full h-full text-left">
      {text ?? ''}
    </pre>
  );
}
