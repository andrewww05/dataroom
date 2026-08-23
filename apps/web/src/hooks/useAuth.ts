import { create } from 'zustand';
import type { AuthUser, DataRoom } from '@dataroom/shared';
import { fetchClient } from '../api/client';

export interface AuthState {
  user: AuthUser | null;
  dataRoom: DataRoom | null;
  isInitializing: boolean;
  initialize: () => Promise<void>;
  /** Resolves once the session is known, so a route guard can await it instead of a flag. */
  ensureInitialized: () => Promise<void>;
  setSession: (user: AuthUser, dataRoom: DataRoom, token: string) => void;
  clearSession: () => void;
}

interface AuthMeResponse {
  id: string;
  email: string;
  dataRoom: DataRoom;
}

/**
 * The in-flight (or settled) session lookup.
 *
 * It lives outside the store because a route guard needs something to *await*, and a boolean flag
 * cannot be awaited — checking `isInitializing` is what let the first navigation through before the
 * session was known. Module scope also memoises the `/auth/me` round trip: the guard runs on every
 * navigation, and one request per route change would be pure waste.
 */
let sessionResolution: Promise<void> | null = null;

export const useAuth = create<AuthState>((set, get) => ({
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
        isInitializing: false,
      });
    } catch {
      localStorage.removeItem('jwt_token');
      set({ user: null, dataRoom: null, isInitializing: false });
    }
  },
  ensureInitialized: () => {
    sessionResolution ??= get().initialize();
    return sessionResolution;
  },
  setSession: (user, dataRoom, token) => {
    localStorage.setItem('jwt_token', token);
    // Signing in *is* a resolved session, so the guard must not go back to asking `/auth/me`
    // whether one exists — that would race the navigation that follows.
    sessionResolution = Promise.resolve();
    set({ user, dataRoom, isInitializing: false });
  },
  clearSession: () => {
    localStorage.removeItem('jwt_token');
    sessionResolution = Promise.resolve();
    set({ user: null, dataRoom: null, isInitializing: false });
  },
}));
