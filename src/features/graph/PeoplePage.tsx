import { Badge } from '@/components/ui/badge';
import { useAdminMembers } from '@/lib/api-hooks';

function initials(email: string): string {
  const name = email.split('@')[0] ?? '';
  return name
    .split(/[._-]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

export function PeoplePage() {
  const { data: members = [], isLoading } = useAdminMembers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">People</h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          {isLoading ? 'Loading…' : `${members.length} team member${members.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : members.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm text-[var(--text-tertiary)]">
          No team members found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.user_id}
              className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] text-xs font-bold text-white">
                  {initials(member.email)}
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{member.email}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{member.role}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{member.member_status}</Badge>
                <span className="text-xs text-[var(--text-tertiary)]">
                  Joined {new Date(member.joined_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
