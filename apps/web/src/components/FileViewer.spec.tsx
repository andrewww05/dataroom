import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
