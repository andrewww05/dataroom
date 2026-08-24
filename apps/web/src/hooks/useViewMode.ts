import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ViewModeState {
  mode: 'list' | 'grid';
  setMode: (mode: 'list' | 'grid') => void;
}

export const useViewMode = create<ViewModeState>()(
  persist(
    (set) => ({
      mode: 'list',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'dataroom-view-mode',
    },
  ),
);
