import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, ToggleLeft, ToggleRight, Trash2, Eye,
  Plus, Puzzle,
} from 'lucide-react';
import {
  useSkills, useUninstallSkill, useToggleSkill,
  useSkillSources,
  type SkillItem,
} from '@/lib/api-hooks';
import { SkillDetailDrawer } from './components/SkillDetailDrawer';
import { SourcesTab } from './components/SourcesTab';
import { BrowseTab } from './components/BrowseTab';
import { Link } from 'react-router';

type Tab = 'installed' | 'browse' | 'my-skills' | 'sources';

const SOURCE_BADGE: Record<string, string> = {
  local: 'LOCAL',
  system: 'SYSTEM',
  github: 'GITHUB',
  website: 'WEB',
  registry: 'REG',
};

export function SkillsPage() {
  const { data: skills = [], isLoading } = useSkills();
  const { data: sources = [] } = useSkillSources();
  const uninstall = useUninstallSkill();
  const toggle = useToggleSkill();

  const [tab, setTab] = useState<Tab>('installed');
  const [query, setQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);

  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    (s.description ?? '').toLowerCase().includes(query.toLowerCase()),
  );

  const activeCount = skills.filter((s) => s.enabled).length;
  const totalExecutions = skills.reduce((sum, s) => sum + (s.usage_count ?? 0), 0);
  const avgQuality = skills.length
    ? (skills.reduce((sum, s) => sum + (s.avg_quality_score ?? 0), 0) / skills.length).toFixed(1)
    : '—';

  const TABS: { id: Tab; label: string }[] = [
    { id: 'installed', label: 'Installed' },
    { id: 'browse', label: 'Browse Remote' },
    { id: 'my-skills', label: 'My Skills' },
    { id: 'sources', label: 'Sources' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Skills</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            Install, configure, and manage AI skills for your task graph
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/intelligence/skill-authoring">
            <Button size="sm" variant="outline">
              <Plus size={14} className="mr-1" /> Create Skill
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Installed', value: `${skills.length}`, sub: `${activeCount} enabled` },
          { label: 'Executions', value: totalExecutions.toLocaleString(), sub: 'all time' },
          { label: 'Avg Quality', value: avgQuality === '—' ? '—' : `${avgQuality}/5`, sub: 'EMA score' },
          { label: 'Sources', value: `${sources.length}`, sub: 'registered' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3"
          >
            <div className="text-xs text-[var(--text-tertiary)]">{kpi.label}</div>
            <div className="text-xl font-semibold text-[var(--text-primary)]">{kpi.value}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border-default)]">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-testid={`skills-tab-${t.id}`}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
              {t.id === 'installed' && skills.length > 0 && (
                <span className="ml-1.5 rounded-full bg-[var(--bg-inset)] px-1.5 py-0.5 text-xs">
                  {skills.length}
                </span>
              )}
              {t.id === 'sources' && sources.length > 0 && (
                <span className="ml-1.5 rounded-full bg-[var(--bg-inset)] px-1.5 py-0.5 text-xs">
                  {sources.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'installed' && (
        <InstalledTab
          skills={filtered}
          isLoading={isLoading}
          query={query}
          onQueryChange={setQuery}
          onView={setSelectedSkill}
          onToggle={(s) => toggle.mutate({ skillId: s.skill_id, enabled: !s.enabled })}
          onUninstall={(s) => uninstall.mutate(s.skill_id)}
          togglePending={toggle.isPending}
          uninstallPending={uninstall.isPending}
        />
      )}
      {tab === 'browse' && <BrowseTab sources={sources} installedIds={skills.map((s) => s.skill_id)} />}
      {tab === 'my-skills' && <MySkillsTab />}
      {tab === 'sources' && <SourcesTab sources={sources} />}

      {/* Detail Drawer */}
      {selectedSkill && (
        <SkillDetailDrawer
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Installed Tab
// ---------------------------------------------------------------------------

interface InstalledTabProps {
  skills: SkillItem[];
  isLoading: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onView: (s: SkillItem) => void;
  onToggle: (s: SkillItem) => void;
  onUninstall: (s: SkillItem) => void;
  togglePending: boolean;
  uninstallPending: boolean;
}

function InstalledTab({
  skills, isLoading, query, onQueryChange, onView, onToggle, onUninstall,
  togglePending, uninstallPending,
}: InstalledTabProps) {
  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <Input
          placeholder="Filter skills..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-8"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="grid grid-cols-[1fr_80px_90px_80px_140px] gap-3 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Skill</span>
            <span>Version</span>
            <span>Source</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {skills.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Puzzle size={32} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-tertiary)]">No skills installed yet.</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Browse the registry to find and install skills.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]" data-testid="skills-list">
              {skills.map((skill) => (
                <div
                  key={skill.skill_id}
                  className="grid grid-cols-[1fr_80px_90px_80px_140px] items-center gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{skill.name}</div>
                    {skill.description && (
                      <div className="text-xs text-[var(--text-tertiary)] truncate max-w-xs">{skill.description}</div>
                    )}
                  </div>
                  <span className="font-mono text-xs text-[var(--text-secondary)]">{skill.version}</span>
                  <Badge variant="outline" className="text-xs w-fit">
                    {SOURCE_BADGE[skill.source_type ?? 'local'] ?? skill.source_type ?? 'LOCAL'}
                  </Badge>
                  <Badge variant={skill.enabled ? 'active' : 'outline'}>
                    {skill.enabled ? 'enabled' : 'disabled'}
                  </Badge>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="View details"
                      onClick={() => onView(skill)}
                    >
                      <Eye size={14} />
                    </Button>
                    <button
                      title={skill.enabled ? 'Disable' : 'Enable'}
                      disabled={togglePending}
                      onClick={() => onToggle(skill)}
                      className="p-1 text-[var(--text-secondary)] disabled:opacity-50"
                    >
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
                      disabled={uninstallPending}
                      onClick={() => onUninstall(skill)}
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

// ---------------------------------------------------------------------------
// My Skills Tab (link to SkillAuthoringPage)
// ---------------------------------------------------------------------------

function MySkillsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          Author, edit, and publish your own skill definitions (SKILL.md format).
        </p>
        <Link to="/intelligence/skill-authoring">
          <Button size="sm">
            <Plus size={14} className="mr-1" /> Open Skill Editor
          </Button>
        </Link>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
        <Puzzle size={32} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-sm font-medium text-[var(--text-primary)]">Create your own skills</p>
        <p className="mt-1 text-xs text-[var(--text-tertiary)] max-w-sm mx-auto">
          Use the Skill Editor to write SKILL.md definitions. Your skills are stored privately
          and can be installed, forked, and shared.
        </p>
        <Link to="/intelligence/skill-authoring">
          <Button size="sm" className="mt-4">
            Open Skill Editor
          </Button>
        </Link>
      </div>
    </div>
  );
}
