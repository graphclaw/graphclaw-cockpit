// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';

interface CommandItem {
  label: string;
  path: string;
  section: string;
}

const COMMANDS: CommandItem[] = [
  { label: 'Dashboard', path: '/', section: 'Workspace' },
  { label: 'My Tasks', path: '/tasks', section: 'Workspace' },
  { label: 'Goals', path: '/goals', section: 'Workspace' },
  { label: 'Projects', path: '/projects', section: 'Workspace' },
  { label: 'Timeline', path: '/timeline', section: 'Workspace' },
  { label: 'Graph Explorer', path: '/graph-explorer', section: 'Workspace' },
  { label: 'Workforce', path: '/workforce', section: 'Workspace' },
  { label: 'Agent Monitor', path: '/agent-monitor', section: 'Intelligence' },
  { label: 'Chat', path: '/chat', section: 'Intelligence' },
  { label: 'Skills', path: '/skills', section: 'Intelligence' },
  { label: 'MCP Registry', path: '/mcp', section: 'Intelligence' },
  { label: 'Agent Canvas', path: '/canvas', section: 'Intelligence' },
  { label: 'Intelligence Hub', path: '/intelligence', section: 'Intelligence' },
  { label: 'Admin Panel', path: '/admin', section: 'Admin' },
  { label: 'Settings — Channels', path: '/settings/channels', section: 'Settings' },
  { label: 'Settings — LLM Providers', path: '/settings/llm', section: 'Settings' },
  { label: 'Settings — Scoring', path: '/settings/scoring', section: 'Settings' },
  { label: 'Settings — Briefing', path: '/settings/briefing', section: 'Settings' },
  { label: 'Settings — Triggers', path: '/settings/triggers', section: 'Settings' },
  { label: 'Settings — Agent-to-Agent', path: '/settings/a2a', section: 'Settings' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = query
    ? COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS;

  const handleSelect = useCallback(
    (item: CommandItem) => {
      navigate(item.path);
      setOpen(false);
      setQuery('');
    },
    [navigate],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleKeyNav(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex]);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={() => {
          setOpen(false);
          setQuery('');
        }}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] z-[61] w-full max-w-lg -translate-x-1/2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-3">
          <Search size={16} className="shrink-0 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyNav}
            className="flex-1 bg-transparent py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
          />
          <kbd className="rounded border border-[var(--border-default)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">
              No results found
            </div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.path}
                onClick={() => handleSelect(item)}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                  i === selectedIndex
                    ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-inset)]'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-xs text-[var(--text-tertiary)]">{item.section}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
