import { NavLink, Outlet, Navigate, useMatch } from 'react-router';
import { User, Brain, BookOpen, Tags, Wrench } from 'lucide-react';

const INTELLIGENCE_TABS = [
  { label: 'Agent Profile', path: 'profile', icon: User },
  { label: 'Working Memory', path: 'working-memory', icon: Brain },
  { label: 'Episodic Memory', path: 'episodic-memory', icon: BookOpen },
  { label: 'Semantic Memory', path: 'semantic-memory', icon: Tags },
  { label: 'Skill Authoring', path: 'skill-authoring', icon: Wrench },
];

const AGENTS = [
  { id: 'agent-main', name: 'Main Agent' },
  { id: 'agent-research', name: 'Research Agent' },
  { id: 'agent-code', name: 'Code Agent' },
];

export function IntelligenceLayout() {
  const isRoot = useMatch('/intelligence');

  if (isRoot) {
    return <Navigate to="profile" replace />;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Agent Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-[var(--text-secondary)]">Agent:</label>
        <select
          className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
          defaultValue="agent-main"
        >
          {AGENTS.map((a) => (
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
  );
}
