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
      const response = await fetch('/app/v1/agent/status', { headers: authHeaders() });

      if (!response.ok) {
        throw new Error(`Failed to fetch agent status: ${response.status}`);
      }

      return (await response.json()) as AgentStatus;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
