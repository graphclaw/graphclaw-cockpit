import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, MoreHorizontal } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'active' | 'suspended';
  joinedAt: string;
}

const MOCK_MEMBERS: Member[] = [
  { id: 'm-1', name: 'Alice Chen', email: 'alice@example.com', role: 'ADMIN', status: 'active', joinedAt: '2026-01-15' },
  { id: 'm-2', name: 'Bob Kumar', email: 'bob@example.com', role: 'MEMBER', status: 'active', joinedAt: '2026-02-01' },
  { id: 'm-3', name: 'Carol Park', email: 'carol@example.com', role: 'MEMBER', status: 'active', joinedAt: '2026-02-20' },
  { id: 'm-4', name: 'Dave Smith', email: 'dave@example.com', role: 'VIEWER', status: 'suspended', joinedAt: '2026-03-01' },
  { id: 'm-5', name: 'Eve Johnson', email: 'eve@example.com', role: 'MEMBER', status: 'active', joinedAt: '2026-03-15' },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'var(--state-error)',
  MEMBER: 'var(--brand-primary)',
  VIEWER: 'var(--text-tertiary)',
};

export function MembersPage() {
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'VIEWER'>('MEMBER');

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: inviteEmail.split('@')[0] ?? 'User',
      email: inviteEmail,
      role: inviteRole,
      status: 'active',
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteEmail('');
    setShowInvite(false);
  }

  function changeRole(id: string, role: Member['role']) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  function toggleSuspend(id: string) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.status === 'active' ? 'suspended' : 'active' } : m,
      ),
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
          <Button size="sm" onClick={handleInvite}>
            Send
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowInvite(false)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="grid grid-cols-[1fr_180px_100px_100px_80px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {members.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-[1fr_180px_100px_100px_80px] items-center gap-4 px-4 py-3 text-sm"
            >
              <span className="font-medium text-[var(--text-primary)]">{member.name}</span>
              <span className="text-xs text-[var(--text-tertiary)]">{member.email}</span>
              <select
                value={member.role}
                onChange={(e) => changeRole(member.id, e.target.value as Member['role'])}
                className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-transparent px-1 py-0.5 text-xs"
                style={{ color: ROLE_COLORS[member.role] }}
              >
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <Badge variant={member.status === 'active' ? 'default' : 'outline'}>
                {member.status}
              </Badge>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleSuspend(member.id)}
                  title={member.status === 'active' ? 'Suspend' : 'Reactivate'}
                >
                  <MoreHorizontal size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
