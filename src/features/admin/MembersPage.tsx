import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, MoreHorizontal } from 'lucide-react';
import { useAdminMembers, useInviteMember } from '@/lib/api-hooks';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'var(--state-error)',
  OWNER: 'var(--state-error)',
  MEMBER: 'var(--brand-primary)',
  VIEWER: 'var(--text-tertiary)',
};

export function MembersPage() {
  const { data: members = [], isLoading } = useAdminMembers();
  const invite = useInviteMember();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'VIEWER'>('MEMBER');

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    invite.mutate(
      { email: inviteEmail, role: inviteRole },
      { onSuccess: () => { setInviteEmail(''); setShowInvite(false); } },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Members ({members.length})
        </h2>
        <Button size="sm" onClick={() => setShowInvite(true)}>
          <UserPlus size={14} className="mr-1" /> Invite
        </Button>
      </div>

      {showInvite && (
        <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
          <input
            type="email"
            placeholder="email@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-1.5 text-sm"
            data-testid="invite-email"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'VIEWER')}
            className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-sm"
          >
            <option value="MEMBER">Member</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <Button size="sm" onClick={handleInvite} disabled={invite.isPending}>
            Send
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowInvite(false)}>
            Cancel
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">No members yet.</p>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]" data-testid="members-table">
          <div className="grid grid-cols-[1fr_180px_100px_100px_80px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="grid grid-cols-[1fr_180px_100px_100px_80px] items-center gap-4 px-4 py-3 text-sm"
              >
                <span className="font-medium text-[var(--text-primary)]">{member.user_id}</span>
                <span className="text-xs text-[var(--text-tertiary)]">{member.email}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: ROLE_COLORS[member.role] ?? 'var(--text-primary)' }}
                >
                  {member.role}
                </span>
                <Badge variant={member.status === 'active' ? 'default' : 'outline'}>
                  {member.status}
                </Badge>
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" title="Actions">
                    <MoreHorizontal size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
