import { useState } from 'react';
import { Search, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSearchSkills, useInstallSkill, type SkillSource, type SkillItem } from '@/lib/api-hooks';

interface BrowseTabProps {
  sources: SkillSource[];
  installedIds: string[];
}

export function BrowseTab({ sources, installedIds }: BrowseTabProps) {
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const { data: results = [], isLoading } = useSearchSkills(query);
  const install = useInstallSkill();

  const filtered = selectedSource === 'all'
    ? results
    : results.filter((r) => r.source_uri === selectedSource);

  const installedSet = new Set(installedIds);

  function handleInstall(skill: SkillItem) {
    install.mutate({
      skill_name: skill.name,
      source_uri: skill.source_uri ?? '',
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search skills by name, description, or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Source chips */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedSource('all')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedSource === 'all'
                ? 'bg-[var(--brand-primary)] text-white'
                : 'bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Sources
          </button>
          {sources.map((src) => (
            <button
              key={src.source_uri}
              onClick={() => setSelectedSource(src.source_uri)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedSource === src.source_uri
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {src.name}
            </button>
          ))}
        </div>
      </div>

      {/* No sources state */}
      {sources.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">No skill sources configured.</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Add sources in the <strong>Sources</strong> tab to browse remote skills.
          </p>
        </div>
      )}

      {/* Prompt to search */}
      {sources.length > 0 && query.length <= 1 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
          <Search size={28} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-tertiary)]">Type at least 2 characters to search across registered sources.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && query.length > 1 && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      )}

      {/* Results grid */}
      {!isLoading && query.length > 1 && (
        <>
          <p className="text-xs text-[var(--text-tertiary)]">
            {filtered.length} skill{filtered.length !== 1 ? 's' : ''} found
          </p>
          {filtered.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
              <p className="text-sm text-[var(--text-tertiary)]">No skills matched &ldquo;{query}&rdquo;.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((skill) => {
                const isInstalled = installedSet.has(skill.skill_id);
                return (
                  <SkillCard
                    key={skill.skill_id}
                    skill={skill}
                    isInstalled={isInstalled}
                    onInstall={() => handleInstall(skill)}
                    installPending={install.isPending}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface SkillCardProps {
  skill: SkillItem;
  isInstalled: boolean;
  onInstall: () => void;
  installPending: boolean;
}

function SkillCard({ skill, isInstalled, onInstall, installPending }: SkillCardProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm text-[var(--text-primary)] truncate">{skill.name}</div>
          <div className="text-xs text-[var(--text-tertiary)] font-mono">v{skill.version}</div>
        </div>
        {skill.source_type && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {skill.source_type.toUpperCase()}
          </Badge>
        )}
      </div>

      {skill.description && (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{skill.description}</p>
      )}

      {skill.tags && skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skill.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--bg-inset)] px-2 py-0.5 text-xs text-[var(--text-tertiary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Button
        size="sm"
        variant={isInstalled ? 'outline' : 'default'}
        className="w-full"
        disabled={isInstalled || installPending}
        onClick={onInstall}
      >
        {isInstalled ? (
          <><CheckCircle size={12} className="mr-1 text-[var(--state-success)]" /> Installed</>
        ) : (
          <><Download size={12} className="mr-1" /> Install</>
        )}
      </Button>
    </div>
  );
}
