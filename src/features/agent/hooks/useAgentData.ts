import { useQuery } from '@tanstack/react-query';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('gc-access-token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export interface AgentStatus {
  agent_id: string;
  state: string;
  last_heartbeat: string;
  tasks_completed: number;
  tasks_pending: number;
}

export function useAgentStatus() {
  return useQuery({
    queryKey: ['agent', 'status'],
    queryFn: async () => {
      const res = await fetch('/app/v1/agent/status', { headers: authHeaders() });
      if (!res.ok) throw new Error(`Failed to fetch agent status: ${res.status}`);
      return (await res.json()) as AgentStatus;
    },
    refetchInterval: 10_000,
  });
}
