// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { LoginPage } from '@/features/auth';
import { useAuthStore } from '@/stores/auth';

describe('LoginPage', () => {
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

  it('renders login form with OAuth buttons', () => {
    renderWithProviders(<LoginPage />, { initialRoute: '/login' });

    expect(screen.getByText('Sign in to your workspace')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    expect(screen.getByText('Sign in with GitHub')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
    expect(screen.getByText('Dev Token (Development)')).toBeInTheDocument();
  });

  it('dev login sets tokens and user', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { initialRoute: '/login' });

    await user.click(screen.getByText('Dev Token (Development)'));

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('mock-access-token');
      expect(state.userId).toBe('USER-dev-001');
      expect(state.role).toBe('ADMIN');
    });
  });
});
