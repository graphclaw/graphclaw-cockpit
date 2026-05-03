import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { logger } from '../lib/logger';

export type UserRole = 'USER' | 'ADMIN' | 'OWNER';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  role: UserRole | null;
  displayName: string | null;
  email: string | null;
  isAuthenticated: boolean;
  activeOrgId: string | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (userId: string, role: UserRole, displayName?: string, email?: string) => void;
  setActiveOrgId: (orgId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      role: null,
      displayName: null,
      email: null,
      isAuthenticated: false,
      activeOrgId: null,
      setTokens: (access, refresh) => {
        logger.info('auth.login');
        localStorage.setItem('gc-access-token', access);
        localStorage.setItem('gc-refresh-token', refresh);
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
      },
      setUser: (userId, role, displayName, email) =>
        set({ userId, role, displayName: displayName ?? null, email: email ?? null }),
      setActiveOrgId: (orgId) => set({ activeOrgId: orgId }),
      logout: () => {
        logger.info('auth.logout');
        localStorage.removeItem('gc-access-token');
        localStorage.removeItem('gc-refresh-token');
        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          role: null,
          displayName: null,
          email: null,
          isAuthenticated: false,
          activeOrgId: null,
        });
      },
    }),
    { name: 'gc-auth' },
  ),
);
