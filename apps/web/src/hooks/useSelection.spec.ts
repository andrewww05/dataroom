import { describe, it, expect, beforeEach } from 'vitest';
import { useSelection } from './useSelection';
import type { FsNode } from '@dataroom/shared';

describe('useSelection', () => {
  const items: FsNode[] = [
    {
      id: '1',
      name: 'File 1',
      type: 'FILE',
      parentId: null,
      sizeBytes: 10,
      mimeType: 'text/plain',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2',
      name: 'File 2',
      type: 'FILE',
      parentId: null,
      sizeBytes: 20,
      mimeType: 'text/plain',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '3',
      name: 'File 3',
      type: 'FILE',
      parentId: null,
      sizeBytes: 30,
      mimeType: 'text/plain',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '4',
      name: 'File 4',
      type: 'FILE',
      parentId: null,
      sizeBytes: 40,
      mimeType: 'text/plain',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '5',
      name: 'File 5',
      type: 'FILE',
      parentId: null,
      sizeBytes: 50,
      mimeType: 'text/plain',
      createdAt: '',
      updatedAt: '',
    },
  ];

  beforeEach(() => {
    useSelection.getState().clear();
  });

  it('handles plain click (selectOne)', () => {
    const { selectOne } = useSelection.getState();
    selectOne('1');
    expect(useSelection.getState().selectedIds).toEqual(new Set(['1']));
    expect(useSelection.getState().anchorId).toBe('1');

    selectOne('2');
    expect(useSelection.getState().selectedIds).toEqual(new Set(['2']));
    expect(useSelection.getState().anchorId).toBe('2');
  });

  it('handles Ctrl+click (toggle)', () => {
    const { toggle } = useSelection.getState();

    toggle('1');
    expect(useSelection.getState().selectedIds).toEqual(new Set(['1']));
    expect(useSelection.getState().anchorId).toBe('1');

    toggle('3');
    expect(useSelection.getState().selectedIds).toEqual(new Set(['1', '3']));
    expect(useSelection.getState().anchorId).toBe('3');

    toggle('1'); // deselect
    expect(useSelection.getState().selectedIds).toEqual(new Set(['3']));
    expect(useSelection.getState().anchorId).toBe('1');
  });

  it('handles Shift+click forwards (selectRange)', () => {
    const { selectOne, selectRange } = useSelection.getState();

    selectOne('2');
    selectRange(items, '4');

    expect(useSelection.getState().selectedIds).toEqual(new Set(['2', '3', '4']));
    // Anchor should remain unchanged
    expect(useSelection.getState().anchorId).toBe('2');
  });

  it('handles Shift+click backwards (selectRange)', () => {
    const { selectOne, selectRange } = useSelection.getState();

    selectOne('4');
    selectRange(items, '2');

    expect(useSelection.getState().selectedIds).toEqual(new Set(['2', '3', '4']));
    expect(useSelection.getState().anchorId).toBe('4');
  });

  it('handles Ctrl+A (selectAll)', () => {
    const { selectAll } = useSelection.getState();

    selectAll(items);
    expect(useSelection.getState().selectedIds).toEqual(new Set(['1', '2', '3', '4', '5']));
    expect(useSelection.getState().anchorId).toBe('1');
  });

  it('clears selection on folder change', () => {
    const { selectOne, onFolderChange } = useSelection.getState();

    selectOne('1');
    expect(useSelection.getState().selectedIds.size).toBe(1);

    onFolderChange();
    expect(useSelection.getState().selectedIds.size).toBe(0);
    expect(useSelection.getState().anchorId).toBeNull();
  });
});
