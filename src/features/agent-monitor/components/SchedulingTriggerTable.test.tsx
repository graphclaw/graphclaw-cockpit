// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-S-TSK-W50-014 - renders scheduling trigger list with snooze/resume actions.
 *
 * Scenario: Scheduling panel trigger table should normalize trigger payloads,
 * show active/snoozed status, support row expansion, and trigger mutations.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L2 Component
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - renders trigger rows with statuses and schedule fields
 *  - executes snooze for enabled trigger and resume for snoozed trigger
 *  - renders empty state when trigger list has no rows
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import {
  useAgentTriggers,
  useResumeAgentTrigger,
  useSnoozeAgentTrigger,
} from '@/lib/api-hooks';
import { SchedulingTriggerTable } from './SchedulingTriggerTable';

vi.mock('@/lib/api-hooks', () => ({
  useAgentTriggers: vi.fn(),
  useSnoozeAgentTrigger: vi.fn(),
  useResumeAgentTrigger: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUseAgentTriggers = vi.mocked(useAgentTriggers);
const mockUseSnoozeAgentTrigger = vi.mocked(useSnoozeAgentTrigger);
const mockUseResumeAgentTrigger = vi.mocked(useResumeAgentTrigger);

describe('SchedulingTriggerTable', () => {
  const snoozeMutate = vi.fn();
  const resumeMutate = vi.fn();

  beforeEach(() => {
    snoozeMutate.mockReset();
    resumeMutate.mockReset();

    mockUseSnoozeAgentTrigger.mockReturnValue({
      mutate: snoozeMutate,
      isPending: false,
    } as never);

    mockUseResumeAgentTrigger.mockReturnValue({
      mutate: resumeMutate,
      isPending: false,
    } as never);

    mockUseAgentTriggers.mockReturnValue({
      data: [
        {
          trigger_id: 'tr-active',
          name: 'Daily Briefing',
          trigger_type: 'time_based',
          cron_expression: '0 9 * * *',
          enabled: true,
          last_fired_at: '2026-05-05T09:00:00Z',
          next_fire_at: '2026-05-06T09:00:00Z',
        },
        {
          trigger_id: 'tr-snoozed',
          name: 'Inbox Scan',
          trigger_type: 'event',
          schedule: 'inbound email',
          enabled: false,
          next_fire_at: null,
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);
  });

  it('renders trigger rows and expands details', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchedulingTriggerTable />);

    expect(screen.getByTestId('scheduling-trigger-table')).toBeInTheDocument();
    expect(screen.getAllByTestId('scheduling-trigger-row')).toHaveLength(2);
    expect(screen.getByText('Daily Briefing')).toBeInTheDocument();
    expect(screen.getByText('SNOOZED')).toBeInTheDocument();

    await user.click(screen.getAllByTestId('scheduling-trigger-row')[0]);
    expect(screen.getByTestId('scheduling-trigger-details')).toBeInTheDocument();
    expect(screen.getByText(/tr-active/)).toBeInTheDocument();
  });

  it('runs snooze and resume mutations from row actions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchedulingTriggerTable />);

    const actionButtons = screen.getAllByTestId('scheduling-trigger-action');
    await user.click(actionButtons[0]);
    await user.click(actionButtons[1]);

    expect(snoozeMutate).toHaveBeenCalledWith('tr-active', expect.any(Object));
    expect(resumeMutate).toHaveBeenCalledWith('tr-snoozed', expect.any(Object));
  });

  it('renders empty state when no triggers exist', () => {
    mockUseAgentTriggers.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<SchedulingTriggerTable />);

    expect(screen.getByTestId('scheduling-trigger-table-empty')).toBeInTheDocument();
    expect(screen.getByText('No scheduling triggers configured.')).toBeInTheDocument();
  });
});
