import { create } from 'zustand';

export type UploadStatus = 'uploading' | 'success' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  parentId: string;
  status: UploadStatus;
  error?: string;
}

interface UploadState {
  uploads: UploadItem[];
  addUploads: (items: UploadItem[]) => void;
  updateStatus: (id: string, status: UploadStatus, error?: string) => void;
  clearCompleted: () => void;
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export const useUploads = create<UploadState>((set) => ({
  uploads: [],
  isModalOpen: false,
  setModalOpen: (open) => set({ isModalOpen: open }),
  addUploads: (items) =>
    set((state) => ({
      uploads: [...state.uploads, ...items],
    })),
  updateStatus: (id, status, error) =>
    set((state) => ({
      uploads: state.uploads.map((u) => (u.id === id ? { ...u, status, error } : u)),
    })),
  clearCompleted: () =>
    set((state) => ({
      uploads: state.uploads.filter((u) => u.status === 'uploading'),
    })),
}));
