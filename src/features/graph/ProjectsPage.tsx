import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  taskCount: number;
  completedCount: number;
  status: 'active' | 'archived';
}

const MOCK_PROJECTS: Project[] = [
  { id: 'p-1', name: 'API Gateway v2', description: 'Rebuild the gateway with FastAPI', taskCount: 24, completedCount: 18, status: 'active' },
  { id: 'p-2', name: 'Cockpit Frontend', description: 'React SPA for GraphClaw management', taskCount: 48, completedCount: 32, status: 'active' },
  { id: 'p-3', name: 'Scoring Engine', description: 'Task priority scoring system', taskCount: 12, completedCount: 12, status: 'active' },
  { id: 'p-4', name: 'MCP Integration', description: 'Model Context Protocol connectors', taskCount: 8, completedCount: 3, status: 'active' },
  { id: 'p-5', name: 'Auth System', description: 'OAuth 2.0 + JWT authentication', taskCount: 15, completedCount: 15, status: 'archived' },
];

export function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Projects</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            {MOCK_PROJECTS.filter((p) => p.status === 'active').length} active projects
          </p>
        </div>
        <Button size="sm">
          <Plus size={14} className="mr-1" /> New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_PROJECTS.map((project) => (
          <div
            key={project.id}
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban size={16} className="text-[var(--brand-primary)]" />
                <span className="font-semibold text-[var(--text-primary)]">{project.name}</span>
              </div>
              <Badge variant={project.status === 'active' ? 'default' : 'outline'}>
                {project.status}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">{project.description}</p>
            <div>
              <div className="mb-1 flex justify-between text-xs text-[var(--text-tertiary)]">
                <span>Progress</span>
                <span>
                  {project.completedCount}/{project.taskCount} tasks
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg-inset)]">
                <div
                  className="h-full rounded-full bg-[var(--brand-primary)]"
                  style={{
                    width: `${(project.completedCount / project.taskCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
