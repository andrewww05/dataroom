import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ViewerContent } from './FileViewer';
import * as reactQuery from '@tanstack/react-query';
import type { FsNode } from '@dataroom/shared';
import '@testing-library/jest-dom';

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

/** Wraps children in a QueryClientProvider so hooks that call useQuery work. */
function withQueryClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe('ViewerContent', () => {
  const baseNode: FsNode = { id: '123', parentId: 'folder1', name: 'test.pdf', type: 'FILE', sizeBytes: 1024, mimeType: 'application/pdf', createdAt: '', updatedAt: '' };

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error Mocking tanstack query response
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: 'https://example.com/preview',
      isLoading: false,
      isError: false,
    });
  });

  it('renders PdfViewer for PDF MIME types, ignoring filename extension (BR-040)', () => {
    const node = { ...baseNode, name: 'test.png', mimeType: 'application/pdf' };
    render(<ViewerContent file={node} onDownload={vi.fn()} />);
    
    const iframe = screen.getByTitle('test.png');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://example.com/preview');
  });

  it('renders ImageViewer for image MIME types', () => {
    const node = { ...baseNode, name: 'test.pdf', mimeType: 'image/jpeg' };
    render(<ViewerContent file={node} onDownload={vi.fn()} />);
    
    const img = screen.getByAltText('test.pdf');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/preview');
  });

  it('renders UnsupportedTypeViewer for unknown MIME types', () => {
    const node = { ...baseNode, name: 'test.docx', mimeType: 'application/msword' };
    render(<ViewerContent file={node} onDownload={vi.fn()} />);
    
    expect(screen.getByText('test.docx')).toBeInTheDocument();
    expect(screen.getByText(/1 KB/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
  });

  it('calls preview endpoint via useQuery instead of download (FR-VIEW-060)', () => {
    render(<ViewerContent file={baseNode} onDownload={vi.fn()} />);
    
    expect(reactQuery.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['preview', '123'],
        queryFn: expect.any(Function),
      })
    );
  });

  // --- FR-VIEW-060 new renderer branches ---

  it('3.1 renders <video> for video/mp4 MIME type with src set to the presigned URL (FR-VIEW-060)', () => {
    const node = { ...baseNode, name: 'demo.mp4', mimeType: 'video/mp4' };
    render(<ViewerContent file={node} onDownload={vi.fn()} />);

    // <video> has no implicit ARIA role accessible via getByRole; query by tag name directly.
    const videoEl = document.querySelector('video');
    expect(videoEl).toBeInTheDocument();
    expect(videoEl).toHaveAttribute('src', 'https://example.com/preview');
    // controls attribute must be present for native browser playback
    expect(videoEl).toHaveAttribute('controls');
  });

  it('3.2 renders <audio> with controls for audio/mpeg MIME type (FR-VIEW-060)', () => {
    const node = { ...baseNode, name: 'track.mp3', mimeType: 'audio/mpeg' };
    render(<ViewerContent file={node} onDownload={vi.fn()} />);

    const audioEl = document.querySelector('audio');
    expect(audioEl).toBeInTheDocument();
    expect(audioEl).toHaveAttribute('controls');
    expect(audioEl).toHaveAttribute('src', 'https://example.com/preview');
  });

  // For the text tests, useQuery is called twice: once for the presigned URL (already mocked
  // globally) and once inside useTextContent to fetch the text from that URL.  We restore the
  // mock so the second call returns the text content, then assert on the <pre> output.

  it('3.3 renders <pre> containing fetched text for text/plain MIME type (FR-VIEW-060)', async () => {
    const node = { ...baseNode, name: 'readme.txt', mimeType: 'text/plain' };

    // First call: presigned URL; second call: text content via useTextContent.
    vi.mocked(reactQuery.useQuery)
      // @ts-expect-error Mocking tanstack query response
      .mockReturnValueOnce({ data: 'https://example.com/preview', isLoading: false, error: null })
      // @ts-expect-error Mocking tanstack query response
      .mockReturnValueOnce({ data: 'hello', isLoading: false, error: null });

    render(withQueryClient(<ViewerContent file={node} onDownload={vi.fn()} />));

    await waitFor(() => {
      const pre = document.querySelector('pre');
      expect(pre).toBeInTheDocument();
      expect(pre).toHaveTextContent('hello');
    });
  });

  it('3.4 renders error state (Retry + Download buttons) when text fetch fails for text/plain (BR-050)', async () => {
    const node = { ...baseNode, name: 'data.txt', mimeType: 'text/plain' };

    vi.mocked(reactQuery.useQuery)
      // @ts-expect-error Mocking tanstack query response
      .mockReturnValueOnce({ data: 'https://example.com/preview', isLoading: false, error: null })
      // @ts-expect-error Mocking tanstack query response
      .mockReturnValueOnce({ data: undefined, isLoading: false, error: new Error('fetch failed') });

    render(withQueryClient(<ViewerContent file={node} onDownload={vi.fn()} />));

    await waitFor(() => {
      expect(screen.getByText(/Could not load preview/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download File/i })).toBeInTheDocument();
    });
  });
});
