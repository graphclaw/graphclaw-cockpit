import { Check, ChevronDown, Palette } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useThemeStore, THEMES } from '@/stores/theme';

export function ThemePicker() {
  const { theme, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0]!;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
      if (!buttons) return;
      const arr = Array.from(buttons);
      const idx = arr.indexOf(document.activeElement as HTMLButtonElement);
      const next = e.key === 'ArrowDown' ? (idx + 1) % arr.length : (idx - 1 + arr.length) % arr.length;
      arr[next]?.focus();
    }
  }

  return (
    <div ref={containerRef} className="relative inline-flex items-center" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Theme: ${current.name}`}
        className="flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-3 h-[30px] text-xs font-[var(--weight-medium)] text-[var(--text-secondary)] transition-all duration-[var(--duration-normal)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
      >
        <Palette className="h-3.5 w-3.5" />
        <span
          className="h-[11px] w-[11px] shrink-0 rounded-full border-[1.5px]"
          style={{ background: current.swatch, borderColor: 'var(--border-strong)' }}
        />
        <span>{current.name}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-[var(--z-dropdown)] min-w-[190px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] p-1.5 shadow-[var(--shadow-3)] animate-in fade-in-0 zoom-in-95"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--text-tertiary)]">
            Appearance
          </div>
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={t.id === theme}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-[7px] text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]',
                t.id === theme && 'bg-[var(--brand-primary-light)] text-[var(--text-brand)] font-semibold',
              )}
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px]"
                style={{ background: t.swatch, borderColor: 'var(--border-strong)' }}
              />
              <span>{t.name}</span>
              <Check
                className={cn(
                  'ml-auto h-3 w-3 text-[var(--brand-primary)]',
                  t.id === theme ? 'opacity-100' : 'opacity-0',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
