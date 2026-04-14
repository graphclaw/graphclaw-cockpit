import { Badge } from '@/components/ui/badge';

interface TimelineItem {
  id: string;
  name: string;
  project: string;
  start: string;
  end: string;
  status: 'done' | 'in-progress' | 'upcoming';
  progress: number;
}

const MOCK_ITEMS: TimelineItem[] = [
  { id: 't-1', name: 'Wave 1: Scaffold', project: 'Cockpit', start: '2026-04-01', end: '2026-04-03', status: 'done', progress: 100 },
  { id: 't-2', name: 'Wave 2: API Client', project: 'Cockpit', start: '2026-04-03', end: '2026-04-05', status: 'done', progress: 100 },
  { id: 't-3', name: 'Wave 3: App Shell', project: 'Cockpit', start: '2026-04-05', end: '2026-04-07', status: 'done', progress: 100 },
  { id: 't-4', name: 'Wave 4-5: Graph + Agent', project: 'Cockpit', start: '2026-04-07', end: '2026-04-10', status: 'done', progress: 100 },
  { id: 't-5', name: 'Wave 6-8: Settings + Canvas', project: 'Cockpit', start: '2026-04-10', end: '2026-04-12', status: 'done', progress: 100 },
  { id: 't-6', name: 'Wave 9-11: Intel + Chat + Admin', project: 'Cockpit', start: '2026-04-12', end: '2026-04-14', status: 'in-progress', progress: 80 },
  { id: 't-7', name: 'Wave 12: Polish + E2E', project: 'Cockpit', start: '2026-04-14', end: '2026-04-16', status: 'upcoming', progress: 0 },
  { id: 't-8', name: 'API v2.1 Release', project: 'Gateway', start: '2026-04-08', end: '2026-04-15', status: 'in-progress', progress: 60 },
];

const STATUS_COLORS: Record<string, string> = {
  done: 'var(--state-success)',
  'in-progress': 'var(--brand-primary)',
  upcoming: 'var(--text-tertiary)',
};

export function TimelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Timeline</h1>
        <p className="text-sm text-[var(--text-tertiary)]">Project timeline and milestones</p>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="grid grid-cols-[1fr_120px_100px_100px_80px_120px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Task</span>
          <span>Project</span>
          <span>Start</span>
          <span>End</span>
          <span>Status</span>
          <span>Progress</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {MOCK_ITEMS.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_120px_100px_100px_80px_120px] items-center gap-4 px-4 py-3 text-sm"
            >
              <span className="font-medium text-[var(--text-primary)]">{item.name}</span>
              <Badge variant="outline">{item.project}</Badge>
              <span className="text-xs text-[var(--text-tertiary)]">{item.start}</span>
              <span className="text-xs text-[var(--text-tertiary)]">{item.end}</span>
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] }}
                title={item.status}
              />
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-[var(--bg-inset)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.progress}%`,
                      backgroundColor: STATUS_COLORS[item.status],
                    }}
                  />
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{item.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
