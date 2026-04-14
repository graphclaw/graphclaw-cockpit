import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import type { ReactNode } from 'react';

interface RequireAuthProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'OWNER';
}

export function RequireAuth({ children, requiredRole }: RequireAuthProps) {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole && role !== 'OWNER') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
