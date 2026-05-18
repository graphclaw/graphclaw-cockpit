// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { Outlet, Link, useLocation } from 'react-router';
import {
  Radio,
  Cpu,
  BarChart2,
  Newspaper,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SettingsNavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  danger?: boolean;
}

const SETTINGS_NAV: SettingsNavItem[] = [
  { label: 'Channels', icon: Radio, path: '/settings/channels' },
  { label: 'LLM Providers', icon: Cpu, path: '/settings/llm' },
  { label: 'Scoring', icon: BarChart2, path: '/settings/scoring' },
  { label: 'Briefing', icon: Newspaper, path: '/settings/briefing' },
  { label: 'Triggers', icon: Zap, path: '/settings/triggers' },
  { label: 'Danger Zone', icon: AlertTriangle, path: '/settings/danger', danger: true },
];

export function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="flex gap-6">
      {/* Settings sub-nav */}
      <nav className="hidden w-48 shrink-0 lg:block">
        <div className="space-y-0.5">
          {SETTINGS_NAV.map((item) => {
            const active = location.pathname === item.path;
            const isDividerBefore = item.danger;
            return (
              <div key={item.path}>
                {isDividerBefore && (
                  <div className="my-2 border-b border-[var(--border-subtle)]" />
                )}
                <Link
                  to={item.path}
                  className={`flex items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm transition-colors ${
                    active
                      ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium'
                      : item.danger
                        ? 'text-[var(--state-blocked)] hover:bg-[var(--state-blocked)]/10'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Settings content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
