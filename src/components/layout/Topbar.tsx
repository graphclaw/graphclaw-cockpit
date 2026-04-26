import { useLocation, Link } from 'react-router';
import { ThemePicker } from '@/components/common/ThemePicker';
import { Bell, Search, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/tasks': 'My Tasks',
  '/goals': 'Goals',
  '/projects': 'Projects',
  '/timeline': 'Timeline',
  '/people': 'People',
  '/agent-monitor': 'Agent Monitor',
  '/chat': 'Chat',
  '/skills': 'Skills',
  '/mcp': 'MCP Registry',
  '/canvas': 'Canvas',
  '/intelligence': 'Intelligence Hub',
  '/admin': 'Admin Panel',
  '/settings': 'Settings',
  '/settings/channels': 'Channels',
  '/settings/llm': 'LLM Providers',
  '/settings/scoring': 'Scoring',
  '/settings/briefing': 'Briefing',
  '/settings/triggers': 'Triggers',
  '/settings/a2a': 'Agent-to-Agent',
};

function getBreadcrumbs(pathname: string): Array<{ label: string; path?: string }> {
  const crumbs: Array<{ label: string; path?: string }> = [];

  if (pathname.startsWith('/settings/')) {
    crumbs.push({ label: 'Settings', path: '/settings/channels' });
    crumbs.push({ label: ROUTE_LABELS[pathname] ?? pathname.split('/').pop() ?? '' });
  } else if (pathname.startsWith('/admin')) {
    crumbs.push({ label: 'Admin Panel' });
  } else if (pathname.startsWith('/intelligence')) {
    crumbs.push({ label: 'Intelligence Hub' });
  } else {
    const baseRoute = '/' + (pathname.split('/')[1] ?? '');
    crumbs.push({ label: ROUTE_LABELS[baseRoute] ?? ROUTE_LABELS[pathname] ?? 'Dashboard' });
  }

  return crumbs;
}

export function Topbar() {
  const location = useLocation();
  const userId = useAuthStore((s) => s.userId);
  const displayName = useAuthStore((s) => s.displayName);
  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const initials = (() => {
    if (displayName) {
      const parts = displayName.trim().split(/\s+/).filter(Boolean);
      const first = parts[0] ?? '';
      const last = parts[parts.length - 1] ?? '';
      if (parts.length >= 2) return (first.charAt(0) + last.charAt(0)).toUpperCase();
      return first.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    if (userId) return userId.slice(0, 2).toUpperCase();
    return 'GC';
  })();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={14} className="text-[var(--text-tertiary)]" />}
            {crumb.path ? (
              <Link to={crumb.path} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-[var(--text-primary)]">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Search */}
      <div className="mx-auto hidden max-w-[360px] flex-1 md:block">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search goals, tasks, people..."
            className="h-8 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] pl-8 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--state-blocked)]" />
        </button>

        <div className="hidden h-5 w-px bg-[var(--border-default)] md:block" />

        <ThemePicker />

        <button
          onClick={logout}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}
          title="Sign out"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
