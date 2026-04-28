import { useLocation, Link } from 'react-router';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { useSkills } from '@/lib/api-hooks';
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  FolderKanban,
  CalendarRange,
  Users,
  Cpu,
  MessageCircle,
  Puzzle,
  Plug,
  Brain,
  Shield,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: { count: number; color: string };
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const WORKSPACE_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'My Tasks', icon: CheckSquare, path: '/tasks', badge: { count: 5, color: 'var(--state-blocked)' } },
  { label: 'Goals', icon: Target, path: '/goals' },
  { label: 'Projects', icon: FolderKanban, path: '/projects' },
  { label: 'Timeline', icon: CalendarRange, path: '/timeline' },
  { label: 'People', icon: Users, path: '/people' },
];

const INTELLIGENCE_NAV: NavItem[] = [
  { label: 'Agent Monitor', icon: Cpu, path: '/agent-monitor', badge: { count: 7, color: 'var(--state-progress)' } },
  { label: 'Chat', icon: MessageCircle, path: '/chat' },
  { label: 'Skills', icon: Puzzle, path: '/skills' },
  { label: 'MCP Registry', icon: Plug, path: '/mcp' },
  { label: 'Agent Canvas', icon: Brain, path: '/canvas' },
  { label: 'Intelligence', icon: Brain, path: '/intelligence' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Admin Panel', icon: Shield, path: '/admin' },
];

const SECTIONS: NavSection[] = [
  { title: 'Workspace', items: WORKSPACE_NAV },
  { title: 'Intelligence', items: INTELLIGENCE_NAV },
  { title: 'Admin', items: ADMIN_NAV },
];

const PAGE_ALIASES: Record<string, string> = {
  '/chat/full': '/chat',
  '/task-detail': '/tasks',
};

function isActive(currentPath: string, itemPath: string): boolean {
  const resolved = PAGE_ALIASES[currentPath] ?? currentPath;
  if (itemPath === '/') return resolved === '/';
  return resolved.startsWith(itemPath);
}

export function Sidebar() {
  const location = useLocation();
  const collapsed = useThemeStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useThemeStore((s) => s.toggleSidebar);
  const role = useAuthStore((s) => s.role);
  const { data: skills = [] } = useSkills();
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
            <img src="/logo.png" alt="GraphClaw" className="h-6 w-6 shrink-0 rounded" />
            <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
              GraphClaw
            </span>
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
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = isActive(location.pathname, item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mx-1 flex items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm transition-colors ${
                      active
                        ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]'
                    } ${collapsed ? 'justify-center px-0 mx-1' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: item.badge.color }}
                          >
                            {item.badge.count}
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

      {/* Footer: Settings + User */}
      <div className="border-t border-[var(--border-default)] p-2">
        <Link
          to="/settings/channels"
          className={`flex items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm transition-colors ${
            location.pathname.startsWith('/settings')
              ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]'
          } ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span className="truncate">Settings</span>}
        </Link>
      </div>
    </div>
  );
}
