import { useQuery } from '@tanstack/react-query';

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
      const res = await fetch('/app/v1/agent/status');
      if (!res.ok) throw new Error('Failed to fetch agent status');
      return (await res.json()) as AgentStatus;
    },
    refetchInterval: 10_000,
  });
}
