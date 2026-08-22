import { create } from 'zustand';
import type { FsNode } from '@dataroom/shared';

interface SelectionState {
  selectedNodes: Record<string, FsNode>;
  toggleSelect: (node: FsNode) => void;
  clearSelection: () => void;
  removeNode: (id: string) => void;
}

export const useSelection = create<SelectionState>((set) => ({
  selectedNodes: {},
  toggleSelect: (node) =>
    set((state) => {
      const next = { ...state.selectedNodes };
      if (next[node.id]) {
        delete next[node.id];
      } else {
        next[node.id] = node;
      }
      return { selectedNodes: next };
    }),
  clearSelection: () => set({ selectedNodes: {} }),
  removeNode: (id) =>
    set((state) => {
      const next = { ...state.selectedNodes };
      delete next[id];
      return { selectedNodes: next };
    }),
}));
