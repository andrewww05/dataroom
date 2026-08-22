import { create } from 'zustand';
import type { AuthUser, DataRoom } from '@dataroom/shared';
import { fetchClient } from '../api/client';

export interface AuthState {
  user: AuthUser | null;
  dataRoom: DataRoom | null;
  isInitializing: boolean;
  initialize: () => Promise<void>;
  setSession: (user: AuthUser, dataRoom: DataRoom, token: string) => void;
  clearSession: () => void;
}

interface AuthMeResponse {
  id: string;
  email: string;
  dataRoom: DataRoom;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  dataRoom: null,
  isInitializing: true,
  initialize: async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      set({ isInitializing: false, user: null, dataRoom: null });
      return;
    }
    
    try {
      const data = await fetchClient<AuthMeResponse>('/auth/me');
      set({ 
        user: { id: data.id, email: data.email }, 
        dataRoom: data.dataRoom,
        isInitializing: false 
      });
    } catch {
      localStorage.removeItem('jwt_token');
      set({ user: null, dataRoom: null, isInitializing: false });
    }
  },
  setSession: (user, dataRoom, token) => {
    localStorage.setItem('jwt_token', token);
    set({ user, dataRoom });
  },
  clearSession: () => {
    localStorage.removeItem('jwt_token');
    set({ user: null, dataRoom: null });
  },
}));
