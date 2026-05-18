// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useLocation, Link } from 'react-router';
import { ThemePicker } from '@/components/common/ThemePicker';
import { Bell, ChevronRight, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { OrgSwitcher } from '@/features/auth/OrgSwitcher';
import { useState, useRef, useEffect } from 'react';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useDismissNotification,
} from '@/features/notifications/hooks/useNotifications';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/tasks': 'My Tasks',
  '/goals': 'Goals',
  '/projects': 'Projects',
  '/timeline': 'Timeline',
  '/workforce': 'Workforce',
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
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { data: notifData, isLoading: notifLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const dismiss = useDismissNotification();
  const unreadCount = notifData?.unread_count ?? 0;

  useEffect(() => {
    if (!notifOpen) return;
    function onOutsideClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setNotifOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, [notifOpen]);

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

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        <OrgSwitcher />

        <div ref={notifRef} className="relative">
          <button
            data-testid="notification-bell"
            className="relative flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Notifications"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((o) => !o)}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                data-testid="notification-badge"
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--state-blocked)] text-[9px] font-bold text-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              data-testid="notification-panel"
              role="dialog"
              aria-label="Notifications panel"
              className="absolute right-0 top-full mt-2 w-80 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      data-testid="notification-mark-all-read"
                      onClick={() => markAllRead.mutate()}
                      className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label="Close notifications"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-80 overflow-y-auto">
                {notifLoading ? (
                  <div className="flex flex-col gap-2 px-4 py-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 rounded bg-[var(--bg-inset)] animate-pulse" />
                    ))}
                  </div>
                ) : !notifData?.items.length ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                    <Bell size={28} className="text-[var(--text-tertiary)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">No notifications</p>
                    <p className="text-xs text-[var(--text-tertiary)]">You're all caught up.</p>
                  </div>
                ) : (
                  notifData.items.map((n) => (
                    <div
                      key={n.id}
                      data-testid="notification-item"
                      className={`flex items-start gap-3 border-b border-[var(--border-default)] px-4 py-3 last:border-b-0 ${
                        !n.is_read ? 'bg-[var(--bg-inset)]' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[var(--text-primary)]">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">{n.body}</p>
                        )}
                        <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        data-testid="notification-dismiss"
                        onClick={() => dismiss.mutate(n.id)}
                        className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Dismiss notification"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden h-5 w-px bg-[var(--border-default)] md:block" />

        <ThemePicker />

        <button
          onClick={logout}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
          style={{ background: 'var(--avatar-gradient-purple)' }}
          title="Sign out"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
