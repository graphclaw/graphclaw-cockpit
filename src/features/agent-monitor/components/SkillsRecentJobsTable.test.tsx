/**
 * GC-S-SKL-W50-001 - renders recent skill jobs with friendly failure copy.
 *
 * Scenario: Skills panel should show the most recent completed jobs and convert
 * backend failure payloads into plain-language messages for non-technical users.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L2 Component
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - renders failed rows with mapped TimeoutError message
 *  - shows explicit empty state when completed_jobs is unavailable
 *  - caps rendered rows at the latest 20 jobs
 */
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { useSkillWorkers } from '@/lib/api-hooks';
import { SkillsRecentJobsTable } from './SkillsRecentJobsTable';

vi.mock('@/lib/api-hooks', () => ({
  useSkillWorkers: vi.fn(),
}));

const mockUseSkillWorkers = vi.mocked(useSkillWorkers);

describe('SkillsRecentJobsTable', () => {
  it('renders failed rows with friendly timeout mapping and token fallback', () => {
    mockUseSkillWorkers.mockReturnValue({
      data: {
        completed_jobs: [
          {
            job_id: 'job-2',
            skill_name: 'DraftReply',
            task_id: 'TASK-22',
            status: 'FAILED',
            completed_at: '2026-05-05T10:15:00Z',
            tokens_used: null,
            error_message: 'TimeoutError: execution timed out after 30s',
          },
          {
            job_id: 'job-1',
            skill_name: 'Summarizer',
            task_id: 'TASK-21',
            status: 'SUCCESS',
            completed_at: '2026-05-05T10:10:00Z',
            tokens_used: 413,
            summary: 'completed',
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<SkillsRecentJobsTable />);

    expect(screen.getByTestId('skills-recent-jobs')).toBeInTheDocument();
    expect(screen.getByTestId('skills-job-row-failed')).toBeInTheDocument();
    expect(screen.getByText('timed out after 30s')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('413')).toBeInTheDocument();
  });

  it('renders explicit empty state when no jobs are available', () => {
    mockUseSkillWorkers.mockReturnValue({
      data: {},
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<SkillsRecentJobsTable />);

    expect(screen.getByTestId('skills-recent-jobs-empty')).toBeInTheDocument();
    expect(screen.getByText('No recent skill jobs.')).toBeInTheDocument();
  });

  it('limits the table to the latest 20 jobs', () => {
    const completed_jobs = Array.from({ length: 25 }).map((_, index) => ({
      job_id: `job-${index}`,
      skill_name: 'Summarizer',
      task_id: `TASK-${index}`,
      status: 'SUCCESS',
      completed_at: `2026-05-05T10:${String(index).padStart(2, '0')}:00Z`,
      tokens_used: 100 + index,
      summary: 'completed',
    }));

    mockUseSkillWorkers.mockReturnValue({
      data: { completed_jobs },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<SkillsRecentJobsTable />);

    expect(screen.getAllByTestId(/skills-job-row/)).toHaveLength(20);
  });
});
