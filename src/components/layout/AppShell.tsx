import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { useThemeStore } from '@/stores/theme';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarCollapsed = useThemeStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-page)]">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] transition-[width] duration-[220ms] ease-in-out"
        style={{ width: sidebarCollapsed ? 56 : 220 }}
      >
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
