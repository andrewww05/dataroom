import { create } from 'zustand';

interface ClipboardState {
  ids: string[];
  mode: 'cut' | 'copy' | null;
  sourceParentId: string | null;
  setClipboard: (ids: string[], mode: 'cut' | 'copy', sourceParentId: string) => void;
  clearClipboard: () => void;
}

export const useClipboard = create<ClipboardState>((set) => ({
  ids: [],
  mode: null,
  sourceParentId: null,
  setClipboard: (ids, mode, sourceParentId) => set({ ids, mode, sourceParentId }),
  clearClipboard: () => set({ ids: [], mode: null, sourceParentId: null }),
}));
