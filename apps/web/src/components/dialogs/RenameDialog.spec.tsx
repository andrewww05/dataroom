import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RenameDialog } from './RenameDialog';
import type { FsNode } from '@dataroom/shared';
import * as renameHook from '@/hooks/useRename';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useRename', () => ({
  useRename: vi.fn(),
}));

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

// #### Scenario: FR-FILE-030 happy path — file renamed, extension preserved
describe('RenameDialog', () => {
  it('preserves the extension when renaming a file', () => {
    const mutate = vi.fn();
    // @ts-expect-error Mocking
    vi.mocked(renameHook.useRename).mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
    });

    render(
      <RenameDialog
        open={true}
        onOpenChange={vi.fn()}
        node={mockNode}
      />,
    );

    const input = screen.getByDisplayValue('document.pdf');
    expect(input).toHaveValue('document.pdf');

    fireEvent.change(input, { target: { value: 'renamed-doc.pdf' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'renamed-doc.pdf' }),
      expect.anything()
    );
  });
});
