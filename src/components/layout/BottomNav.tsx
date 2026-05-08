// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useLocation, Link } from 'react-router';
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Cpu,
  MessageCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface BottomNavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { label: 'Goals', icon: Target, path: '/goals' },
  { label: 'Agent', icon: Cpu, path: '/agent-monitor' },
  { label: 'Chat', icon: MessageCircle, path: '/chat' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-[var(--border-default)] bg-[var(--bg-surface)] md:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors ${
              active
                ? 'text-[var(--brand-primary)]'
                : 'text-[var(--text-tertiary)]'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
