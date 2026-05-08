// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { RequireAuth } from '@/features/auth';
import { useAuthStore } from '@/stores/auth';
import { Route, Routes } from 'react-router';

function renderWithRoutes(initialRoute: string, requiredRole?: 'ADMIN' | 'OWNER') {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route
        path="/*"
        element={
          <RequireAuth requiredRole={requiredRole}>
            <div>Protected Content</div>
          </RequireAuth>
        }
      />
    </Routes>,
    { initialRoute },
  );
}

describe('RequireAuth', () => {
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

  it('redirects to /login when unauthenticated', () => {
    renderWithRoutes('/dashboard');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true, role: 'USER' });
    renderWithRoutes('/dashboard');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('blocks non-admin from admin routes', () => {
    useAuthStore.setState({ isAuthenticated: true, role: 'USER' });
    renderWithRoutes('/admin', 'ADMIN');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('allows ADMIN to see admin routes', () => {
    useAuthStore.setState({ isAuthenticated: true, role: 'ADMIN' });
    renderWithRoutes('/admin', 'ADMIN');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('allows OWNER to see admin routes', () => {
    useAuthStore.setState({ isAuthenticated: true, role: 'OWNER' });
    renderWithRoutes('/admin', 'ADMIN');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
