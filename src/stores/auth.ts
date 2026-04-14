import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'USER' | 'ADMIN' | 'OWNER';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUser: (userId: string, role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      role: null,
      isAuthenticated: false,
      setTokens: (access, refresh) => {
        localStorage.setItem('gc-access-token', access);
        localStorage.setItem('gc-refresh-token', refresh);
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
      },
      setUser: (userId, role) => set({ userId, role }),
      logout: () => {
        localStorage.removeItem('gc-access-token');
        localStorage.removeItem('gc-refresh-token');
        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          role: null,
          isAuthenticated: false,
        });
      },
    }),
    { name: 'gc-auth' },
  ),
);
