import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import type { FsNode } from '@dataroom/shared';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: vi.fn(),
    createFileRoute: vi.fn(() => vi.fn((config) => {
      const Comp = config.component;
      Comp.useParams = vi.fn(() => ({ token: 'mock-token' }));
      return Comp;
    })),
  };
});

vi.mock('../api/client', () => ({
  fetchClient: vi.fn(),
  fetchShareClient: vi.fn(),
}));

vi.mock('../hooks/useNodes', () => ({
  previewFile: vi.fn(),
  downloadFile: vi.fn(),
}));

function withQueryClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe('Shared View (s.$token)', () => {
  const mockFileNode: FsNode = { id: 'file1', name: 'File 1', type: 'FILE', parentId: 'root', sizeBytes: 100, mimeType: 'text/plain', createdAt: '', updatedAt: '' };
  const mockFolderNode: FsNode = { id: 'folder1', name: 'Folder 1', type: 'FOLDER', parentId: 'root', sizeBytes: null, mimeType: null, createdAt: '', updatedAt: '' };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders viewer instead of a download card for a file share', async () => {
    const { fetchClient } = await import('../api/client');
    vi.mocked(fetchClient).mockResolvedValueOnce({ node: mockFileNode, ownerEmail: 'test@example.com', mode: 'READ', role: 'VIEWER', rootNodeId: 'file1' });
    
    const { previewFile } = await import('../hooks/useNodes');
    vi.mocked(previewFile).mockResolvedValueOnce('https://example.com/preview');
    // Global fetch for useTextContent
    global.fetch = vi.fn().mockResolvedValueOnce({ text: () => Promise.resolve('file contents'), ok: true });

    const { Route } = await import('./s.$token');
    // @ts-expect-error mock provider
    render(withQueryClient(<Route />));

    expect(await screen.findByText('file contents')).toBeInTheDocument();
    expect(screen.queryByText('Opening…')).not.toBeInTheDocument(); // old card text
  });

  it('opens viewer on double-click of a file row in a folder share', async () => {
    const { fetchClient, fetchShareClient } = await import('../api/client');
    vi.mocked(fetchClient).mockResolvedValueOnce({ node: mockFolderNode, ownerEmail: 'test@example.com', mode: 'READ', role: 'VIEWER', rootNodeId: 'folder1' });
    vi.mocked(fetchShareClient)
      .mockResolvedValueOnce([{ id: 'folder1', name: 'Folder 1' }]) // path
      .mockResolvedValueOnce({ items: [mockFileNode] }); // children
    
    const { previewFile } = await import('../hooks/useNodes');
    vi.mocked(previewFile).mockResolvedValueOnce('https://example.com/preview');
    global.fetch = vi.fn().mockResolvedValueOnce({ text: () => Promise.resolve('file contents'), ok: true });

    const { Route } = await import('./s.$token');
    // @ts-expect-error mock provider
    render(withQueryClient(<Route />));

    const fileRow = await screen.findByText('File 1');
    fireEvent.doubleClick(fileRow.closest('tr')!);

    expect(await screen.findByText('file contents')).toBeInTheDocument();
  });

  it('navigates on double-click of a folder row in a folder share', async () => {
    const childFolder: FsNode = { ...mockFolderNode, id: 'child-folder', name: 'Child Folder', parentId: 'folder1' };
    
    const { fetchClient, fetchShareClient } = await import('../api/client');
    vi.mocked(fetchClient).mockResolvedValueOnce({ node: mockFolderNode, ownerEmail: 'test@example.com', mode: 'READ', role: 'VIEWER', rootNodeId: 'folder1' });
    
    let callCount = 0;
    vi.mocked(fetchShareClient).mockImplementation(async (_token: string, path: string) => {
      if (path.endsWith('/path')) return [{ id: 'folder1', name: 'Folder 1' }];
      if (path.endsWith('folder1/children')) return { items: [childFolder] };
      if (path.endsWith('child-folder/children')) {
        callCount++;
        return { items: [] };
      }
      return {};
    });

    const { Route } = await import('./s.$token');
    // @ts-expect-error mock provider
    render(withQueryClient(<Route />));

    const folderRow = await screen.findByText('Child Folder');
    fireEvent.doubleClick(folderRow.closest('tr')!);

    await waitFor(() => {
      expect(callCount).toBe(1);
    });
  });

  it('renders the Retry + Download error state on failure (BR-050)', async () => {
    const { fetchClient } = await import('../api/client');
    vi.mocked(fetchClient).mockResolvedValueOnce({ node: mockFileNode, ownerEmail: 'test@example.com', mode: 'READ', role: 'VIEWER', rootNodeId: 'file1' });
    
    const { previewFile } = await import('../hooks/useNodes');
    vi.mocked(previewFile).mockRejectedValueOnce(new Error('fetch failed'));

    const { Route } = await import('./s.$token');
    // @ts-expect-error mock provider
    render(withQueryClient(<Route />));

    expect(await screen.findByText(/Could not load preview/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download File/i })).toBeInTheDocument();
  });
});
