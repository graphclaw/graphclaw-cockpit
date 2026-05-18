// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useLocation, Link } from 'react-router';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { useSkills } from '@/lib/api-hooks';
import { useAttentionItems } from '@/features/agent-monitor/hooks/useAttentionItems';
import { useMyTaskCount } from '@/features/graph/hooks/useGraphData';
import {
  SquaresFour,
  CheckSquare,
  Crosshair,
  Kanban,
  CalendarDots,
  ShareNetwork,
  UsersThree,
  MonitorPlay,
  ChatTeardropDots,
  Lightning,
  TreeStructure,
  PaintBrush,
  Circuitry,
  Gear,
  ShieldCheck,
} from '@phosphor-icons/react';
import { PanelLeft, PanelLeftClose } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  path: string;
  badge?: { count: number; color: string };
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const WORKSPACE_NAV: NavItem[] = [
  { label: 'Dashboard',      icon: SquaresFour,       iconColor: '#3B82F6', path: '/' },
  { label: 'My Tasks',       icon: CheckSquare,        iconColor: '#F59E0B', path: '/tasks' },
  { label: 'Goals',          icon: Crosshair,          iconColor: '#EF4444', path: '/goals' },
  { label: 'Projects',       icon: Kanban,             iconColor: '#8B5CF6', path: '/projects' },
  { label: 'Timeline',       icon: CalendarDots,       iconColor: '#10B981', path: '/timeline' },
  { label: 'Graph Explorer', icon: ShareNetwork,        iconColor: '#06B6D4', path: '/graph-explorer' },
  { label: 'Workforce',      icon: UsersThree,         iconColor: '#6366F1', path: '/workforce' },
];

const INTELLIGENCE_NAV: NavItem[] = [
  { label: 'Agent Monitor',  icon: MonitorPlay,        iconColor: '#F97316', path: '/agent-monitor' },
  { label: 'Chat',           icon: ChatTeardropDots,   iconColor: '#EC4899', path: '/chat' },
  { label: 'Skills',         icon: Lightning,          iconColor: '#EAB308', path: '/skills' },
  { label: 'Agent Canvas',   icon: PaintBrush,         iconColor: '#F43F5E', path: '/canvas' },
  { label: 'MCP Registry',   icon: TreeStructure,      iconColor: '#0EA5E9', path: '/mcp' },
  { label: 'Intelligence',   icon: Circuitry,          iconColor: '#A855F7', path: '/intelligence' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Admin Panel',    icon: ShieldCheck,        iconColor: '#64748B', path: '/admin' },
];

const SECTIONS: NavSection[] = [
  { title: 'Workspace',    items: WORKSPACE_NAV },
  { title: 'Intelligence', items: INTELLIGENCE_NAV },
  { title: 'Admin',        items: ADMIN_NAV },
];

const PAGE_ALIASES: Record<string, string> = {
  '/chat/full': '/chat',
  '/task-detail': '/tasks',
};

function isActive(currentPath: string, itemPath: string): boolean {
  const resolved = PAGE_ALIASES[currentPath] ?? currentPath;
  if (itemPath === '/') return resolved === '/';
  if (itemPath === '/agent-monitor') return resolved.startsWith('/agent-monitor');
  return resolved.startsWith(itemPath);
}

export function Sidebar() {
  const location = useLocation();
  const collapsed = useThemeStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useThemeStore((s) => s.toggleSidebar);
  const role = useAuthStore((s) => s.role);
  const { data: skills = [] } = useSkills();
  const { count: attentionCount } = useAttentionItems();
  const userId = useAuthStore((s) => s.userId);
  const { data: myTaskCount = 0 } = useMyTaskCount(userId);
  const disabledSkillCount = skills.filter((s) => !s.enabled).length;

  return (
    <div className="flex h-full flex-col">
      {/* Logo area */}
      <div className="flex h-14 items-center gap-2 border-b border-[var(--border-default)] px-3">
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            <img src="/logo.svg" alt="GraphClaw" className="h-7 w-7 shrink-0" />
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                GraphClaw
              </span>
              <span className="text-[10px] italic text-[var(--text-tertiary)]">
                Cockpit
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-2">
        {SECTIONS.map((section) => {
          if (section.title === 'Admin' && role !== 'ADMIN' && role !== 'OWNER') return null;
          return (
            <div key={section.title} className="mb-1">
              {!collapsed && (
                <div
                  className="px-3 py-1.5 text-[length:var(--text-caption)] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--text-tertiary)]"
                >
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = isActive(location.pathname, item.path);
                const isAgentMonitorItem = item.path === '/agent-monitor';
                const isMyTasksItem = item.path === '/tasks';
                const badgeCount = isAgentMonitorItem ? attentionCount : isMyTasksItem ? myTaskCount : item.badge?.count;
                const badgeColor = (isAgentMonitorItem || isMyTasksItem) ? 'var(--state-blocked)' : item.badge?.color;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mx-1 flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-1.5 text-sm transition-colors ${
                      active
                        ? 'bg-[var(--brand-primary)]/10 font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]'
                    } ${collapsed ? 'justify-center px-0 mx-1' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Icon pill — subtle tinted container, Apple sidebar style */}
                    <span
                      className="flex shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors"
                      style={{
                        width: 28,
                        height: 28,
                        color: item.iconColor,
                        backgroundColor: `${item.iconColor}${active ? '22' : '14'}`,
                      }}
                    >
                      <item.icon
                        size={16}
                        weight="duotone"
                        style={{
                          color: item.iconColor,
                          opacity: active ? 1 : 0.55,
                        }}
                      />
                    </span>

                    {!collapsed && (
                      <>
                        <span
                          className="flex-1 truncate"
                          style={{ color: active ? item.iconColor : undefined }}
                        >
                          {item.label}
                        </span>
                        {badgeCount != null && badgeCount > 0 && badgeColor && (
                          <span
                            data-testid={isAgentMonitorItem ? 'sidebar-agent-monitor-badge' : undefined}
                            className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: badgeColor }}
                          >
                            {badgeCount}
                          </span>
                        )}
                        {item.path === '/skills' && disabledSkillCount > 0 && (
                          <span
                            className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: 'var(--state-delayed)' }}
                          >
                            {disabledSkillCount}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
              {section.title !== 'Admin' && (
                <div className="mx-3 my-1.5 border-b border-[var(--border-subtle)]" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer: Settings */}
      <div className="border-t border-[var(--border-default)] p-2">
        <Link
          to="/settings/channels"
          className={`flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-1.5 text-sm transition-colors ${
            location.pathname.startsWith('/settings')
              ? 'bg-[var(--brand-primary)]/10 font-medium'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]'
          } ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? 'Settings' : undefined}
        >
          <span
            className="flex shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors"
            style={{
              width: 28,
              height: 28,
              color: '#94A3B8',
              backgroundColor: `#94A3B8${location.pathname.startsWith('/settings') ? '22' : '14'}`,
            }}
          >
            <Gear
              size={16}
              weight="duotone"
              style={{
                color: '#94A3B8',
                opacity: location.pathname.startsWith('/settings') ? 1 : 0.55,
              }}
            />
          </span>
          {!collapsed && (
            <span
              className="truncate"
              style={{ color: location.pathname.startsWith('/settings') ? '#94A3B8' : undefined }}
            >
              Settings
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
