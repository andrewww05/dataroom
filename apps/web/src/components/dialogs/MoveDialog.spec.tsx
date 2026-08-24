import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MoveDialog } from './MoveDialog';
import * as moveHook from '@/hooks/useMove';
import * as reactQuery from '@tanstack/react-query';
import type { FsNode } from '@dataroom/shared';
import '@testing-library/jest-dom';

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: vi.fn(),
    useQuery: vi.fn(),
  };
});

vi.mock('@/hooks/useMove', () => ({
  useMove: vi.fn(),
}));

vi.mock('./FolderPicker', () => ({
  FolderPicker: ({ onSelect }: { onSelect: (folder: { id: string; name: string }) => void }) => (
    <div data-testid="folder-picker">
      <button onClick={() => onSelect({ id: 'target-folder', name: 'Target Folder' })}>
        Target Folder
      </button>
    </div>
  ),
}));

const mockFileNode: FsNode = {
  id: 'file-1',
  parentId: 'root',
  type: 'FILE',
  name: 'document.pdf',
  sizeBytes: 1024,
  mimeType: 'application/pdf',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockFolderNode: FsNode = {
  id: 'folder-1',
  parentId: 'root',
  type: 'FOLDER',
  name: 'Subfolder',
  sizeBytes: null,
  mimeType: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTargetFolder: FsNode = {
  id: 'target-folder',
  parentId: 'root',
  type: 'FOLDER',
  name: 'Target Folder',
  sizeBytes: null,
  mimeType: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('MoveDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error Mocking tanstack query response
    vi.mocked(reactQuery.useQuery).mockReturnValue({
      data: { items: [mockTargetFolder] },
      isLoading: false,
    });
  });

  // #### Scenario: FR-FILE-050 happy path — item moved via dialog
  it('moves a file via dialog', async () => {
    const mutate = vi.fn();
    // @ts-expect-error Mocking
    vi.mocked(moveHook.useMove).mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
    });

    render(<MoveDialog open={true} onOpenChange={vi.fn()} nodesToMove={[mockFileNode]} />);

    // Select the target folder
    fireEvent.click(screen.getByText('Target Folder'));

    // Click move button
    fireEvent.click(screen.getByRole('button', { name: /move/i }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ targetId: 'target-folder' }),
      expect.anything(),
    );
  });

  // #### Scenario: FR-FLDR-040 happy path — folder moved via dialog
  it('moves a folder via dialog', async () => {
    const mutate = vi.fn();
    // @ts-expect-error Mocking
    vi.mocked(moveHook.useMove).mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
    });

    render(<MoveDialog open={true} onOpenChange={vi.fn()} nodesToMove={[mockFolderNode]} />);

    // Select the target folder
    fireEvent.click(screen.getByText('Target Folder'));

    // Click move button
    fireEvent.click(screen.getByRole('button', { name: /move/i }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ targetId: 'target-folder' }),
      expect.anything(),
    );
  });
});
