// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useAuthStore } from '@/stores/auth';

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      userId: null,
      role: null,
      isAuthenticated: false,
    });
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.userId).toBeNull();
  });

  it('setTokens marks authenticated and persists to localStorage', () => {
    useAuthStore.getState().setTokens('access-123', 'refresh-456');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('access-123');
    expect(state.refreshToken).toBe('refresh-456');
    expect(localStorage.getItem('gc-access-token')).toBe('access-123');
    expect(localStorage.getItem('gc-refresh-token')).toBe('refresh-456');
  });

  it('setUser stores user info', () => {
    useAuthStore.getState().setUser('USER-001', 'ADMIN');
    const state = useAuthStore.getState();
    expect(state.userId).toBe('USER-001');
    expect(state.role).toBe('ADMIN');
  });

  it('logout clears everything', () => {
    useAuthStore.getState().setTokens('a', 'b');
    useAuthStore.getState().setUser('u', 'USER');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.userId).toBeNull();
    expect(state.role).toBeNull();
    expect(localStorage.getItem('gc-access-token')).toBeNull();
    expect(localStorage.getItem('gc-refresh-token')).toBeNull();
  });
});
