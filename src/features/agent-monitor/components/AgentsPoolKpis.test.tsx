/**
 * GC-S-WRK-W50-001 - renders agents pool KPI values and fallbacks.
 *
 * Scenario: Agents panel should show pool KPI cards from pool status data and
 * gracefully fallback to related hooks when pool status fields are absent.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L2 Component
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - renders KPI values from agents pool status payload
 *  - falls back to agents and agent-status values when pool payload is empty
 *  - applies alert styling when stale heartbeats are non-zero
 */
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { useAgentPoolStatus, useAgents, useAgentStatus } from '@/lib/api-hooks';
import { AgentsPoolKpis } from './AgentsPoolKpis';

vi.mock('@/lib/api-hooks', () => ({
  useAgentPoolStatus: vi.fn(),
  useAgents: vi.fn(),
  useAgentStatus: vi.fn(),
}));

const mockUseAgentPoolStatus = vi.mocked(useAgentPoolStatus);
const mockUseAgents = vi.mocked(useAgents);
const mockUseAgentStatus = vi.mocked(useAgentStatus);

describe('AgentsPoolKpis', () => {
  beforeEach(() => {
    mockUseAgentPoolStatus.mockReturnValue({
      data: {
        active_runners: 3,
        total_runners: 5,
        queue_depth: 7,
        avg_duration_seconds: 42,
        stale_heartbeats: 2,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    mockUseAgents.mockReturnValue({
      data: [
        { agent_id: 'a-1', name: 'alpha', state: 'RUNNING' },
        { agent_id: 'a-2', name: 'beta', state: 'IDLE' },
      ],
      isLoading: false,
      error: null,
    } as never);

    mockUseAgentStatus.mockReturnValue({
      data: { queue_depth: 10 },
      isLoading: false,
      error: null,
    } as never);
  });

  it('renders KPI values from pool payload', () => {
    renderWithProviders(<AgentsPoolKpis />);

    expect(screen.getByTestId('agents-pool-kpis')).toBeInTheDocument();
    expect(screen.getByTestId('agents-kpi-active')).toHaveTextContent('3/5');
    expect(screen.getByTestId('agents-kpi-queue')).toHaveTextContent('7');
    expect(screen.getByTestId('agents-kpi-duration')).toHaveTextContent('42s');
    expect(screen.getByTestId('agents-kpi-stale')).toHaveTextContent('2');
  });

  it('falls back to agents and status values when pool payload is missing', () => {
    mockUseAgentPoolStatus.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<AgentsPoolKpis />);

    expect(screen.getByTestId('agents-kpi-active')).toHaveTextContent('1/2');
    expect(screen.getByTestId('agents-kpi-queue')).toHaveTextContent('10');
    expect(screen.getByTestId('agents-kpi-duration')).toHaveTextContent('--');
    expect(screen.getByTestId('agents-kpi-stale')).toHaveTextContent('0');
  });

  it('highlights stale heartbeat card when stale count is non-zero', () => {
    renderWithProviders(<AgentsPoolKpis />);

    expect(screen.getByTestId('agents-kpi-stale').className).toContain('border-[var(--state-blocked)]');
  });
});
