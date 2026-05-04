import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { useSkillWorkerStatuses } from '@/lib/api-hooks';
import { SkillsWorkerPool } from './SkillsWorkerPool';

vi.mock('@/lib/api-hooks', () => ({
  useSkillWorkerStatuses: vi.fn(),
}));

const mockUseSkillWorkerStatuses = vi.mocked(useSkillWorkerStatuses);

describe('SkillsWorkerPool', () => {
  beforeEach(() => {
    mockUseSkillWorkerStatuses.mockReturnValue({
      data: [
        {
          worker_id: 'worker-a',
          state: 'RUNNING',
          current_job_id: 'JOB-1',
          last_heartbeat: new Date().toISOString(),
          jobs_completed: 8,
          jobs_failed: 1,
        },
        {
          worker_id: 'worker-b',
          state: 'RUNNING',
          current_job_id: 'JOB-2',
          last_heartbeat: new Date(Date.now() - 20 * 60_000).toISOString(),
          jobs_completed: 2,
          jobs_failed: 3,
        },
        {
          worker_id: 'worker-c',
          state: 'IDLE',
          current_job_id: null,
          last_heartbeat: new Date().toISOString(),
          jobs_completed: 4,
          jobs_failed: 0,
        },
        {
          worker_id: 'worker-d',
          state: 'BUSY',
          current_job_id: 'JOB-4',
          last_heartbeat: new Date().toISOString(),
          jobs_completed: 5,
          jobs_failed: 0,
        },
        {
          worker_id: 'worker-e',
          state: 'RUNNING',
          current_job_id: 'JOB-5',
          last_heartbeat: new Date().toISOString(),
          jobs_completed: 1,
          jobs_failed: 0,
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);
  });

  it('renders utilization summary and tone', () => {
    renderWithProviders(<SkillsWorkerPool />);

    expect(screen.getByTestId('skills-worker-pool')).toBeInTheDocument();
    expect(screen.getByTestId('skills-util-value')).toHaveTextContent('4/5 active (80%)');
    expect(screen.getByTestId('skills-util-tone-amber')).toBeInTheDocument();
  });

  it('marks stale workers with stale pill', () => {
    renderWithProviders(<SkillsWorkerPool />);

    expect(screen.getByText('Stale')).toBeInTheDocument();
  });

  it('supports show all toggle when more than four workers exist', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SkillsWorkerPool />);

    expect(screen.getAllByTestId('skills-worker-card')).toHaveLength(4);

    await user.click(screen.getByTestId('skills-show-all'));
    expect(screen.getAllByTestId('skills-worker-card')).toHaveLength(5);
  });
});
