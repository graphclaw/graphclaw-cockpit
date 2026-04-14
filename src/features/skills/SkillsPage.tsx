import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ToggleLeft, ToggleRight, GitFork, Trash2 } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  source: string;
  description: string;
}

const MOCK_SKILLS: Skill[] = [
  { id: 'sk-1', name: 'email-triage', version: '1.2.0', enabled: true, source: 'built-in', description: 'Classify and route inbound emails' },
  { id: 'sk-2', name: 'meeting-summarizer', version: '0.9.1', enabled: true, source: 'marketplace', description: 'Summarize meeting transcripts' },
  { id: 'sk-3', name: 'code-review', version: '2.0.0', enabled: false, source: 'marketplace', description: 'Automated code review suggestions' },
  { id: 'sk-4', name: 'ticket-classifier', version: '1.0.3', enabled: true, source: 'custom', description: 'Classify support tickets by category' },
  { id: 'sk-5', name: 'data-extractor', version: '0.5.0', enabled: false, source: 'marketplace', description: 'Extract structured data from documents' },
];

export function SkillsPage() {
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [query, setQuery] = useState('');

  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()),
  );

  function toggleSkill(id: string) {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Skills</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            {skills.filter((s) => s.enabled).length} active / {skills.length} installed
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

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
        {/* Header */}
        <div className="grid grid-cols-[1fr_100px_80px_80px_100px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Skill</span>
          <span>Version</span>
          <span>Source</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border-subtle)]">
          {filtered.map((skill) => (
            <div
              key={skill.id}
              className="grid grid-cols-[1fr_100px_80px_80px_100px] items-center gap-4 px-4 py-3 text-sm"
            >
              <div>
                <div className="font-medium text-[var(--text-primary)]">{skill.name}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{skill.description}</div>
              </div>
              <span className="font-mono text-xs text-[var(--text-secondary)]">{skill.version}</span>
              <Badge variant="outline">{skill.source}</Badge>
              <button onClick={() => toggleSkill(skill.id)} className="text-[var(--text-secondary)]">
                {skill.enabled ? (
                  <ToggleRight size={20} className="text-[var(--state-active)]" />
                ) : (
                  <ToggleLeft size={20} />
                )}
              </button>
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" title="Fork">
                  <GitFork size={14} />
                </Button>
                <Button size="sm" variant="ghost" title="Uninstall">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
