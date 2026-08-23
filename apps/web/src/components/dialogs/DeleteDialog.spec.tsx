import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DeleteDialog } from './DeleteDialog';
import type { FsNode } from '@dataroom/shared';
import * as deleteHook from '@/hooks/useDelete';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useDelete', () => ({
  useDelete: vi.fn(),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueries: vi.fn(() => []),
  };
});

const mockNode: FsNode = {
  id: 'file-1',
  parentId: 'root',
  type: 'FILE',
  name: 'document.pdf',
  sizeBytes: 1024,
  mimeType: 'application/pdf',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// #### Scenario: FR-FILE-040 happy path — file deleted after confirm
describe('DeleteDialog', () => {
  it('calls onDelete when confirm button is clicked', () => {
    const mutateAsync = vi.fn();
    // @ts-expect-error Mocking
    vi.mocked(deleteHook.useDelete).mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
    });

    render(
      <DeleteDialog
        open={true}
        onOpenChange={vi.fn()}
        nodes={[mockNode]}
      />,
    );

    // The user must confirm the deletion
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    expect(mutateAsync).toHaveBeenCalled();
  });
});
