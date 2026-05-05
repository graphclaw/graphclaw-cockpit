/**
 * GC-S-TSK-W50-011 - renders active delegations rows with stale and blocked highlighting.
 *
 * Scenario: Agents delegations table should show key columns and row emphasis
 * for stale heartbeat and blocked states, with empty fallback when no data exists.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L2 Component
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - renders delegations rows with task chip and status badge
 *  - marks stale heartbeat rows with stale row test id
 *  - marks blocked rows with blocked row test id
 *  - renders empty state when no delegations are returned
 */
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ActiveDelegationsTable } from './ActiveDelegationsTable';
import { useAgentDelegations } from '@/lib/api-hooks';

vi.mock('@/lib/api-hooks', () => ({
  useAgentDelegations: vi.fn(),
}));

const mockUseAgentDelegations = vi.mocked(useAgentDelegations);

function queryState<T>(data: T) {
  return {
    data,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };
}

describe('ActiveDelegationsTable', () => {
  beforeEach(() => {
    mockUseAgentDelegations.mockReturnValue(queryState([]) as ReturnType<typeof useAgentDelegations>);
  });

  it('renders delegations rows with core columns', () => {
    mockUseAgentDelegations.mockReturnValue(
      queryState([
        {
          agent_id: 'agent-alpha',
          task_id: 'task-123',
          session_id: 'session-abcdef12345',
          status: 'RUNNING',
          started_at: '2026-05-05T10:00:00Z',
          heartbeat_age_seconds: 45,
          duration_seconds: 121,
        },
      ]) as ReturnType<typeof useAgentDelegations>,
    );

    renderWithProviders(<ActiveDelegationsTable />);

    expect(screen.getByTestId('active-delegations-table')).toBeInTheDocument();
    expect(screen.getByText('agent-alpha')).toBeInTheDocument();
    expect(screen.getByText('task-123')).toBeInTheDocument();
    expect(screen.getByText('RUNNING')).toBeInTheDocument();
    expect(screen.getAllByTestId('active-delegation-row')).toHaveLength(1);
  });

  it('flags stale heartbeat rows', () => {
    mockUseAgentDelegations.mockReturnValue(
      queryState([
        {
          agent_id: 'agent-stale',
          task_id: 'task-stale',
          session_id: 'session-stale-01',
          status: 'RUNNING',
          heartbeat_age_seconds: 610,
          duration_seconds: 630,
        },
      ]) as ReturnType<typeof useAgentDelegations>,
    );

    renderWithProviders(<ActiveDelegationsTable />);

    expect(screen.getAllByTestId('active-delegation-row-stale')).toHaveLength(1);
  });

  it('flags blocked rows', () => {
    mockUseAgentDelegations.mockReturnValue(
      queryState([
        {
          agent_id: 'agent-blocked',
          task_id: 'task-blocked',
          session_id: 'session-blocked-01',
          status: 'BLOCKED',
          heartbeat_age_seconds: 95,
          duration_seconds: 140,
        },
      ]) as ReturnType<typeof useAgentDelegations>,
    );

    renderWithProviders(<ActiveDelegationsTable />);

    expect(screen.getAllByTestId('active-delegation-row-blocked')).toHaveLength(1);
  });

  it('renders empty state with no delegations', () => {
    mockUseAgentDelegations.mockReturnValue(queryState([]) as ReturnType<typeof useAgentDelegations>);

    renderWithProviders(<ActiveDelegationsTable />);

    expect(screen.getByTestId('active-delegations-empty')).toBeInTheDocument();
    expect(screen.getByText('No active delegations.')).toBeInTheDocument();
  });
});
