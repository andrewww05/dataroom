import { create } from 'zustand';
import type { FsNode } from '@dataroom/shared';

export interface SelectionState {
  selectedIds: Set<string>;
  anchorId: string | null;
  selectOne: (id: string) => void;
  toggle: (id: string) => void;
  selectRange: (orderedItems: FsNode[], id: string) => void;
  selectAll: (items: FsNode[]) => void;
  clear: () => void;
  onFolderChange: () => void;
}

export const useSelection = create<SelectionState>((set) => ({
  selectedIds: new Set<string>(),
  anchorId: null,

  selectOne: (id: string) =>
    set({
      selectedIds: new Set([id]),
      anchorId: id,
    }),

  toggle: (id: string) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return {
        selectedIds: next,
        anchorId: id, // Shift-click after a toggle uses this as the new anchor
      };
    }),

  selectRange: (orderedItems: FsNode[], id: string) =>
    set((state) => {
      if (!state.anchorId || !orderedItems.some((n) => n.id === state.anchorId)) {
        // No valid anchor, fall back to selectOne
        return {
          selectedIds: new Set([id]),
          anchorId: id,
        };
      }

      const anchorIndex = orderedItems.findIndex((n) => n.id === state.anchorId);
      const targetIndex = orderedItems.findIndex((n) => n.id === id);

      if (anchorIndex === -1 || targetIndex === -1) {
        return state;
      }

      const start = Math.min(anchorIndex, targetIndex);
      const end = Math.max(anchorIndex, targetIndex);

      const next = new Set<string>();
      for (let i = start; i <= end; i++) {
        next.add(orderedItems[i].id);
      }

      // Anchor remains unchanged during a range selection
      return { selectedIds: next };
    }),

  selectAll: (items: FsNode[]) =>
    set({
      selectedIds: new Set(items.map((n) => n.id)),
      anchorId: items.length > 0 ? items[0].id : null,
    }),

  clear: () =>
    set({
      selectedIds: new Set(),
      anchorId: null,
    }),

  onFolderChange: () =>
    set({
      selectedIds: new Set(),
      anchorId: null,
    }),
}));
