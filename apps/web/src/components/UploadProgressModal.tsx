import { useUploads } from '../hooks/useUploads';
import { X, CheckCircle2, AlertCircle, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

export function UploadProgressModal() {
  const { uploads, isModalOpen, setModalOpen, clearCompleted } = useUploads();

  // If there are no uploads at all, don't show the modal
  if (uploads.length === 0) return null;

  const uploadingCount = uploads.filter((u) => u.status === 'uploading').length;
  const isComplete = uploads.length > 0 && uploadingCount === 0;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-background border rounded-lg shadow-xl z-50 flex flex-col max-h-[400px]">
      <div
        className="bg-muted px-4 py-3 flex items-center justify-between rounded-t-lg cursor-pointer"
        onClick={() => setModalOpen(!isModalOpen)}
      >
        <h4 className="font-medium text-sm flex items-center gap-2">
          {uploadingCount > 0 ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading {uploadingCount} item{uploadingCount !== 1 ? 's' : ''}</span>
            </>
          ) : isComplete ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{uploads.length} upload{uploads.length !== 1 ? 's' : ''} complete</span>
            </>
          ) : (
            'Uploads'
          )}
        </h4>
        <div className="flex items-center gap-1 text-muted-foreground">
          {isModalOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-1 hover:bg-muted-foreground/20"
            onClick={(e) => {
              e.stopPropagation();
              clearCompleted();
              setModalOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isModalOpen && (
        <ScrollArea className="flex-1 p-0 border-t bg-background rounded-b-lg">
          <div className="flex flex-col">
            {uploads.slice().reverse().map((upload) => (
              <div key={upload.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/50">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.file.name}</p>
                  {upload.status === 'error' && (
                    <p className="text-xs text-destructive truncate">{upload.error}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {upload.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {upload.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {upload.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
