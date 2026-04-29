import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { WorkforceCard } from './WorkforceCard';
import type { WorkforceResource } from '../hooks/useWorkforceData';

const humanResource: WorkforceResource = {
  id: 'RES-001',
  name: 'Alice Chen',
  type: 'HUMAN',
  capacity: 8,
  task_counts: { pending: 1, in_progress: 2, review: 1, blocked: 0, done: 3, total: 7 },
  load_factor: 0.375, // 3 in-flight / 8 capacity
  tasks: [
    { id: 'TSK-001', title: 'Set up CI/CD', state: 'IN_PROGRESS', score: 0.85, priority: 'HIGH', deadline: '2025-12-31T00:00:00Z' },
    { id: 'TSK-002', title: 'Write API docs', state: 'BACKLOG', score: 0.42, priority: 'LOW' },
  ],
};

const agentResource: WorkforceResource = {
  id: 'RES-002',
  name: 'Agent-Alpha',
  type: 'AI_AGENT',
  capacity: 5,
  task_counts: { pending: 0, in_progress: 6, review: 0, blocked: 0, done: 1, total: 7 },
  load_factor: 1.2, // 6 in-flight / 5 capacity — over capacity
  tasks: [
    { id: 'TSK-003', title: 'Train model', state: 'ACTIVE', score: 0.77 },
  ],
};

describe('WorkforceCard', () => {
  it('renders the resource name', () => {
    renderWithProviders(<WorkforceCard resource={humanResource} />);
    expect(screen.getByText('Alice Chen')).toBeInTheDocument();
  });

  it('renders Human type badge', () => {
    renderWithProviders(<WorkforceCard resource={humanResource} />);
    expect(screen.getByText('Human')).toBeInTheDocument();
  });

  it('renders AI Agent type badge', () => {
    renderWithProviders(<WorkforceCard resource={agentResource} />);
    expect(screen.getByText('AI Agent')).toBeInTheDocument();
  });

  it('card starts collapsed (aria-expanded=false)', () => {
    renderWithProviders(<WorkforceCard resource={humanResource} />);
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands on click (aria-expanded=true)', () => {
    renderWithProviders(<WorkforceCard resource={humanResource} />);
    const toggle = screen.getByRole('button');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows task titles after expanding', () => {
    renderWithProviders(<WorkforceCard resource={humanResource} />);
    const toggle = screen.getByRole('button');
    fireEvent.click(toggle);
    expect(screen.getByText('Set up CI/CD')).toBeInTheDocument();
    expect(screen.getByText('Write API docs')).toBeInTheDocument();
  });

  it('shows task column headers after expanding', () => {
    renderWithProviders(<WorkforceCard resource={humanResource} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('State')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Due')).toBeInTheDocument();
  });

  it('collapses on second click', () => {
    renderWithProviders(<WorkforceCard resource={humanResource} />);
    const toggle = screen.getByRole('button');
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Set up CI/CD')).not.toBeInTheDocument();
  });

  it('formats deadline date in expanded task row', () => {
    renderWithProviders(<WorkforceCard resource={humanResource} />);
    fireEvent.click(screen.getByRole('button'));
    // The deadline '2025-12-31T00:00:00Z' should produce a formatted date
    // (locale-dependent, but should not be '—')
    const rows = document.querySelectorAll('[class*="grid-cols-"]');
    const dueCells = Array.from(rows).flatMap((r) =>
      Array.from(r.querySelectorAll('div:last-child')),
    );
    const hasFormattedDate = dueCells.some(
      (el) => el.textContent && el.textContent !== '—' && el.textContent.trim() !== '',
    );
    expect(hasFormattedDate).toBe(true);
  });

  it('uses agent label remapping (Processing instead of In Progress)', () => {
    renderWithProviders(<WorkforceCard resource={agentResource} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
  });

  it('over-capacity card has blocked border class', () => {
    const { container } = renderWithProviders(<WorkforceCard resource={agentResource} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/border-l-\[var\(--state-blocked\)\]/);
  });
});
