import { Route, Routes } from 'react-router';
import { LoginPage, CallbackPage } from '@/features/auth';
import { AppRoutes } from '@/routes';
import { CommandPalette } from '@/components/common/CommandPalette';

export function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
      <CommandPalette />
    </>
  );
}
