import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useSkills, useUninstallSkill } from '@/lib/api-hooks';

export function SkillsPage() {
  const { data: skills = [], isLoading } = useSkills();
  const uninstall = useUninstallSkill();
  const [query, setQuery] = useState('');

  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()),
  );

  const activeCount = skills.filter((s) => s.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Skills</h1>
          <p className="text-sm text-[var(--text-tertiary)]" data-testid="skills-count">
            {activeCount} active / {skills.length} installed
          </p>
        </div>
        <Button size="sm">Browse Registry</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <Input
          placeholder="Filter skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="grid grid-cols-[1fr_100px_80px_100px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Skill</span>
            <span>Version</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-sm text-[var(--text-tertiary)] text-center">
              No skills installed yet.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]" data-testid="skills-list">
              {filtered.map((skill) => (
                <div
                  key={skill.skill_id}
                  className="grid grid-cols-[1fr_100px_80px_100px] items-center gap-4 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{skill.name}</div>
                    {skill.description && (
                      <div className="text-xs text-[var(--text-tertiary)]">{skill.description}</div>
                    )}
                  </div>
                  <span className="font-mono text-xs text-[var(--text-secondary)]">{skill.version}</span>
                  <Badge variant={skill.enabled ? 'active' : 'outline'}>
                    {skill.enabled ? 'enabled' : 'disabled'}
                  </Badge>
                  <div className="flex justify-end gap-1">
                    <button className="text-[var(--text-secondary)]">
                      {skill.enabled ? (
                        <ToggleRight size={20} className="text-[var(--state-active)]" />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Uninstall"
                      disabled={uninstall.isPending}
                      onClick={() => uninstall.mutate(skill.skill_id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
