import { Badge } from '@/components/ui/badge';

interface Person {
  id: string;
  name: string;
  role: string;
  email: string;
  activeTasks: number;
  completedTasks: number;
  avatar: string;
}

const MOCK_PEOPLE: Person[] = [
  { id: 'u-1', name: 'Alice Chen', role: 'Engineering Lead', email: 'alice@example.com', activeTasks: 5, completedTasks: 23, avatar: 'AC' },
  { id: 'u-2', name: 'Bob Kumar', role: 'Backend Engineer', email: 'bob@example.com', activeTasks: 3, completedTasks: 18, avatar: 'BK' },
  { id: 'u-3', name: 'Carol Park', role: 'Frontend Engineer', email: 'carol@example.com', activeTasks: 4, completedTasks: 15, avatar: 'CP' },
  { id: 'u-4', name: 'Dave Smith', role: 'DevOps', email: 'dave@example.com', activeTasks: 2, completedTasks: 12, avatar: 'DS' },
  { id: 'u-5', name: 'Eve Johnson', role: 'Designer', email: 'eve@example.com', activeTasks: 1, completedTasks: 8, avatar: 'EJ' },
  { id: 'u-6', name: 'GraphClaw Agent', role: 'AI Agent', email: 'agent@graphclaw', activeTasks: 7, completedTasks: 142, avatar: 'GA' },
];

export function PeoplePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">People</h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          {MOCK_PEOPLE.length} team members and agents
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_PEOPLE.map((person) => (
          <div
            key={person.id}
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] text-xs font-bold text-white">
                {person.avatar}
              </div>
              <div>
                <div className="font-semibold text-[var(--text-primary)]">{person.name}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{person.role}</div>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
              <div>
                <span className="font-semibold text-[var(--text-primary)]">
                  {person.activeTasks}
                </span>{' '}
                active
              </div>
              <div>
                <span className="font-semibold text-[var(--text-primary)]">
                  {person.completedTasks}
                </span>{' '}
                completed
              </div>
            </div>
            <Badge variant="outline">{person.email}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
