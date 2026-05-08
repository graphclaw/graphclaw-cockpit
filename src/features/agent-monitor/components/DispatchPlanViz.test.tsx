// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-S-TSK-W50-012 - renders dispatch swim-lanes from active delegation sessions.
 *
 * Scenario: Dispatch plan panel should resolve an active session from delegations,
 * fetch tier lanes, and show state-specific job chips.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L2 Component
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - renders empty state when no active delegation session exists
 *  - renders dispatch tiers and running job chips for active session
 *  - renders blocked job chips when dispatch payload includes failed statuses
 */
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { DispatchPlanViz } from './DispatchPlanViz';
import { useAgentDelegations, useAgentDispatchPlan } from '@/lib/api-hooks';

vi.mock('@/lib/api-hooks', () => ({
  useAgentDelegations: vi.fn(),
  useAgentDispatchPlan: vi.fn(),
}));

const mockUseAgentDelegations = vi.mocked(useAgentDelegations);
const mockUseAgentDispatchPlan = vi.mocked(useAgentDispatchPlan);

function queryState<T>(data: T) {
  return {
    data,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };
}

describe('DispatchPlanViz', () => {
  beforeEach(() => {
    mockUseAgentDelegations.mockReturnValue(queryState([]) as ReturnType<typeof useAgentDelegations>);
    mockUseAgentDispatchPlan.mockReturnValue(queryState([]) as ReturnType<typeof useAgentDispatchPlan>);
  });

  it('renders empty state when no active session is available', () => {
    mockUseAgentDelegations.mockReturnValue(
      queryState([
        {
          session_id: 'ses-complete',
          status: 'COMPLETED',
        },
      ]) as ReturnType<typeof useAgentDelegations>,
    );

    renderWithProviders(<DispatchPlanViz />);

    expect(screen.getByTestId('dispatch-plan-viz-empty')).toBeInTheDocument();
    expect(screen.getByText('No active dispatch session.')).toBeInTheDocument();
  });

  it('renders tiers and running jobs for active session', () => {
    mockUseAgentDelegations.mockReturnValue(
      queryState([
        {
          session_id: 'ses-live',
          status: 'RUNNING',
        },
      ]) as ReturnType<typeof useAgentDelegations>,
    );

    mockUseAgentDispatchPlan.mockReturnValue(
      queryState([
        {
          tier: 1,
          status: 'RUNNING',
          jobs: [
            {
              agent_id: 'agent-alpha',
              task_id: 'TSK-1',
              status: 'RUNNING',
            },
          ],
        },
      ]) as ReturnType<typeof useAgentDispatchPlan>,
    );

    renderWithProviders(<DispatchPlanViz />);

    expect(screen.getByTestId('dispatch-plan-viz')).toBeInTheDocument();
    expect(screen.getByTestId('dispatch-plan-session')).toHaveTextContent('ses-live');
    expect(screen.getByText('Tier 1')).toBeInTheDocument();
    expect(screen.getByText('agent-alpha')).toBeInTheDocument();
    expect(screen.getByText('TSK-1')).toBeInTheDocument();
    expect(screen.getAllByTestId('dispatch-plan-job-running')).toHaveLength(1);
  });

  it('normalizes failed job statuses as blocked chips', () => {
    mockUseAgentDelegations.mockReturnValue(
      queryState([
        {
          session_id: 'ses-live',
          status: 'RUNNING',
        },
      ]) as ReturnType<typeof useAgentDelegations>,
    );

    mockUseAgentDispatchPlan.mockReturnValue(
      queryState([
        {
          tier: 2,
          status: 'RUNNING',
          jobs: [
            {
              agent_id: 'agent-beta',
              task_id: 'TSK-2',
              status: 'FAILED',
            },
          ],
        },
      ]) as ReturnType<typeof useAgentDispatchPlan>,
    );

    renderWithProviders(<DispatchPlanViz />);

    expect(screen.getByText('agent-beta')).toBeInTheDocument();
    expect(screen.getAllByTestId('dispatch-plan-job-blocked')).toHaveLength(1);
  });
});
