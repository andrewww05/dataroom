import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FolderView } from './_authenticated.f.$folderId';
import * as reactQuery from '@tanstack/react-query';
import * as router from '@tanstack/react-router';
import type { FsNode } from '@dataroom/shared';
import '@testing-library/jest-dom';

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(() => ({ mutate: vi.fn() })),
  };
});

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: vi.fn(),
    createFileRoute: vi.fn(() => vi.fn(() => ({
      useParams: vi.fn(() => ({ folderId: 'folder1' })),
      useSearch: vi.fn(() => ({ file: 'file1' })),
    }))),
  };
});

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ dataRoom: { rootId: 'root1' } })),
}));

vi.mock('../hooks/useNodes', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useUploadFiles: vi.fn(() => ({ mutate: vi.fn() })),
    useCreateFolder: vi.fn(() => ({ mutate: vi.fn() })),
    useRenameNode: vi.fn(() => ({ mutate: vi.fn() })),
    useDeleteNode: vi.fn(() => ({ mutate: vi.fn() })),
  };
});

// Mock the viewer so we can inspect props passed to it
vi.mock('@/components/FileViewer', () => ({
  FileViewer: ({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) => (
    <div data-testid="mock-viewer">
      <button data-testid="prev-btn" onClick={onPrev} disabled={!onPrev}>Prev</button>
      <button data-testid="next-btn" onClick={onNext} disabled={!onNext}>Next</button>
    </div>
  ),
}));

// No need to mock the module, we can just spy on the exported Route's methods

describe('FolderView stepping logic', () => {
  const navigateMock = vi.fn();
  
  const mockNodes: FsNode[] = [
    { id: 'folder1', name: 'Folder 1', type: 'FOLDER', parentId: 'root', sizeBytes: null, mimeType: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'file1', name: 'File 1', type: 'FILE', parentId: 'folder1', sizeBytes: 100, mimeType: 'text/plain', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'folder2', name: 'Folder 2', type: 'FOLDER', parentId: 'folder1', sizeBytes: null, mimeType: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'file2', name: 'File 2', type: 'FILE', parentId: 'folder1', sizeBytes: 200, mimeType: 'image/png', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(router.useNavigate).mockReturnValue(navigateMock);
    // @ts-expect-error Mocking tanstack query response
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: { items: mockNodes },
      isLoading: false,
    });
  });

  it('skips folders when stepping and does not wrap at start', async () => {
    // When file1 (first file) is active
    const { Route } = await import('./_authenticated.f.$folderId');
    vi.mocked(Route.useSearch).mockReturnValue({ file: 'file1' });
    vi.mocked(Route.useParams).mockReturnValue({ folderId: 'folder1' });
    
    render(<FolderView />);
    
    // Previous should be disabled (no wrapping)
    expect(screen.getByTestId('prev-btn')).toBeDisabled();
    
    // Next should go to file2 (skipping folderB)
    expect(screen.getByTestId('next-btn')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('next-btn'));
    
    expect(navigateMock).toHaveBeenCalledWith({ search: { file: 'file2' } });
  });

  it('skips folders when stepping and does not wrap at end', async () => {
    // When file2 (last file) is active
    const { Route } = await import('./_authenticated.f.$folderId');
    vi.mocked(Route.useSearch).mockReturnValue({ file: 'file2' });
    vi.mocked(Route.useParams).mockReturnValue({ folderId: 'folder1' });
    
    render(<FolderView />);
    
    // Next should be disabled (no wrapping)
    expect(screen.getByTestId('next-btn')).toBeDisabled();
    
    // Prev should go to file1 (skipping folderB)
    expect(screen.getByTestId('prev-btn')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('prev-btn'));
    
    expect(navigateMock).toHaveBeenCalledWith({ search: { file: 'file1' } });
  });
});
