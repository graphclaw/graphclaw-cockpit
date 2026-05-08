// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useUserOrgs } from '@/lib/api-hooks';
import { useAuthStore } from '@/stores/auth';

/**
 * OrgSwitcher — multi-org context switcher for the Topbar. (FR-UI-002)
 *
 * Shows the active org name + a dropdown to switch between the orgs the
 * authenticated user belongs to.  The selected org_id is persisted in the
 * auth Zustand store (activeOrgId) so API calls can pick it up via the
 * X-Org-Id header if needed.
 *
 * If the user has no orgs (single-user mode) the switcher is hidden.
 */
export function OrgSwitcher() {
  const { data: orgs = [], isLoading } = useUserOrgs();
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const setActiveOrgId = useAuthStore((s) => s.setActiveOrgId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Auto-select the first org on load when none is active yet
  useEffect(() => {
    if (!activeOrgId && orgs.length > 0 && orgs[0]) {
      setActiveOrgId(orgs[0].org_id);
    }
  }, [orgs, activeOrgId, setActiveOrgId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Don't render when loading or when user has zero orgs (single-user)
  if (isLoading || orgs.length === 0) return null;

  const activeOrg = orgs.find((o) => o.org_id === activeOrgId) ?? orgs[0];

  return (
    <div className="relative" ref={ref} data-testid="org-switcher">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid="org-switcher-trigger"
      >
        <Building2 size={13} className="shrink-0" />
        <span className="max-w-[140px] truncate" data-testid="org-switcher-label">
          {activeOrg?.name ?? 'Select org'}
        </span>
        {isLoading ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <ChevronDown size={11} />
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg"
          data-testid="org-switcher-menu"
        >
          {orgs.map((org) => (
            <li key={org.org_id} role="option" aria-selected={org.org_id === activeOrgId}>
              <button
                type="button"
                onClick={() => {
                  setActiveOrgId(org.org_id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--bg-inset)]"
                data-testid={`org-option-${org.org_id}`}
              >
                <span className="flex-1 truncate text-[var(--text-primary)]">{org.name}</span>
                <span className="shrink-0 text-[10px] text-[var(--text-tertiary)]">{org.role}</span>
                {org.org_id === activeOrgId && (
                  <Check size={12} className="shrink-0 text-[var(--brand-primary)]" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
