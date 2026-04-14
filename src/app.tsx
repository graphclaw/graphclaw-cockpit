import { Route, Routes } from 'react-router';
import { LoginPage, CallbackPage, RequireAuth } from '@/features/auth';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
