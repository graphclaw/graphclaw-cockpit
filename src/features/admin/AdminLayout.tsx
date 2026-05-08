// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { NavLink, Outlet, Navigate, useMatch } from 'react-router';
import {
  Users,
  ToggleLeft,
  Cpu,
  Scale,
  Shield,
  KeyRound,
  ScrollText,
  Server,
  Plug,
  Puzzle,
} from 'lucide-react';

const ADMIN_TABS = [
  { label: 'Members', path: 'members', icon: Users },
  { label: 'Feature Gates', path: 'features', icon: ToggleLeft },
  { label: 'Marketplace', path: 'marketplace', icon: Puzzle },
  { label: 'LLM Config', path: 'llm-config', icon: Cpu },
  { label: 'LLM-as-Judge', path: 'judge', icon: Scale },
  { label: 'Guardrails', path: 'guardrails', icon: Shield },
  { label: 'SSO', path: 'sso', icon: KeyRound },
  { label: 'Audit Log', path: 'audit', icon: ScrollText },
  { label: 'Infrastructure', path: 'infra', icon: Server },
  { label: 'Connectors', path: 'connectors', icon: Plug },
];

export function AdminLayout() {
  const isRoot = useMatch('/admin');

  if (isRoot) {
    return <Navigate to="members" replace />;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Admin Panel</h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          Organization settings and administration
        </p>
      </div>

      {/* Sub-navigation */}
      <nav className="flex flex-wrap gap-1 border-b border-[var(--border-default)] pb-px">
        {ADMIN_TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'border-[var(--brand-primary)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`
            }
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
