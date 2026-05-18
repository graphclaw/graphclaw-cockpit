// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { NavLink, Outlet, Navigate, useMatch } from 'react-router';
import { User, Brain, BookOpen, Tags, Wrench, ShieldCheck } from 'lucide-react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useIntelligenceAgents } from '@/lib/api-hooks';
import { useAuthStore } from '@/stores/auth';

const INTELLIGENCE_TABS = [
  { label: 'Agent Profile', path: 'profile', icon: User },
  { label: 'Working Memory', path: 'working-memory', icon: Brain },
  { label: 'Episodic Memory', path: 'episodic-memory', icon: BookOpen },
  { label: 'Semantic Memory', path: 'semantic-memory', icon: Tags },
  { label: 'Skill Authoring', path: 'skill-authoring', icon: Wrench },
  { label: 'Policies', path: 'policies', icon: ShieldCheck },
];

// Shared context so child pages can read the selected agentId
export const AgentIdContext = createContext<string>('');
export function useSelectedAgentId() {
  return useContext(AgentIdContext);
}

export function IntelligenceLayout() {
  const isRoot = useMatch('/intelligence');
  const userId = useAuthStore((s) => s.userId) ?? 'test-user';
  const { data: agents = [] } = useIntelligenceAgents();
  const [selectedId, setSelectedId] = useState<string>('');

  // Build agent options from Intelligence Hub MinIO scan
  const agentOptions = useMemo(
    () =>
      agents.length > 0
        ? agents.map((a) => ({ id: a.agent_id, name: `${a.name}${a.source === 'system' ? ' (system)' : ''}` }))
        : [{ id: userId, name: `My Agent (${userId})` }],
    [agents, userId],
  );

  useEffect(() => {
    const hasSelection = agentOptions.some((a) => a.id === selectedId);
    if (!hasSelection) {
      setSelectedId(agentOptions[0]?.id ?? userId);
    }
  }, [agentOptions, selectedId, userId]);

  if (isRoot) {
    return <Navigate to="profile" replace />;
  }

  return (
    <AgentIdContext.Provider value={selectedId}>
      <div className="flex h-full flex-col gap-4">
        {/* Agent Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Agent:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
            data-testid="agent-selector"
          >
            {agentOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-navigation */}
        <nav className="flex gap-1 border-b border-[var(--border-default)] pb-px">
          {INTELLIGENCE_TABS.map((tab) => (
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
    </AgentIdContext.Provider>
  );
}
