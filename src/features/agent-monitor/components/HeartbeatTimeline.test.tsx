// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-S-TSK-W50-010 - renders agents heartbeat timeline with endpoint fallback behavior.
 *
 * Scenario: Timeline rows should render from runner payload, color stale heartbeats,
 * and fall back or empty-state safely when optional endpoints are unavailable.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L2 Component
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - renders runner rows and timeline segments from /agents/pool/runners data
 *  - marks stale heartbeat segments in red tone when age is above timeout
 *  - falls back to empty panel when no runner or agent records exist
 */
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { HeartbeatTimeline } from './HeartbeatTimeline';
import { useAgentPoolRunners, useAgents } from '@/lib/api-hooks';

vi.mock('@/lib/api-hooks', () => ({
  useAgentPoolRunners: vi.fn(),
  useAgents: vi.fn(),
}));

const mockUseAgentPoolRunners = vi.mocked(useAgentPoolRunners);
const mockUseAgents = vi.mocked(useAgents);

function queryState<T>(data: T) {
  return {
    data,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };
}

describe('HeartbeatTimeline', () => {
  beforeEach(() => {
    mockUseAgentPoolRunners.mockReturnValue(queryState([]) as ReturnType<typeof useAgentPoolRunners>);
    mockUseAgents.mockReturnValue(queryState([]) as ReturnType<typeof useAgents>);
  });

  it('renders runner rows and timeline segments', () => {
    mockUseAgentPoolRunners.mockReturnValue(
      queryState([
        {
          runner_id: 'runner-1',
          agent_name: 'Planner',
          state: 'RUNNING',
          heartbeat_age_seconds: 20,
        },
      ]) as ReturnType<typeof useAgentPoolRunners>,
    );

    renderWithProviders(<HeartbeatTimeline />);

    expect(screen.getByTestId('heartbeat-timeline')).toBeInTheDocument();
    expect(screen.getByText('Planner')).toBeInTheDocument();
    expect(screen.getByText(/RUNNING/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('heartbeat-segment').length).toBeGreaterThan(0);
  });

  it('renders red segments for stale heartbeat rows', () => {
    mockUseAgentPoolRunners.mockReturnValue(
      queryState([
        {
          runner_id: 'runner-2',
          agent_name: 'Reviewer',
          state: 'RUNNING',
          heartbeat_age_seconds: 610,
        },
      ]) as ReturnType<typeof useAgentPoolRunners>,
    );

    renderWithProviders(<HeartbeatTimeline />);

    expect(screen.getAllByTestId('heartbeat-segment-red').length).toBeGreaterThan(0);
  });

  it('renders empty state when no runners or agents are available', () => {
    mockUseAgentPoolRunners.mockReturnValue(queryState([]) as ReturnType<typeof useAgentPoolRunners>);
    mockUseAgents.mockReturnValue(queryState([]) as ReturnType<typeof useAgents>);

    renderWithProviders(<HeartbeatTimeline />);

    expect(screen.getByTestId('heartbeat-timeline')).toBeInTheDocument();
    expect(screen.getByText('No runner heartbeat data yet.')).toBeInTheDocument();
  });
});
