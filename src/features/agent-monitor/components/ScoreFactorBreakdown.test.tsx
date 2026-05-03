import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ScoreFactorBreakdown } from '@/features/agent-monitor/components/ScoreFactorBreakdown';

describe('ScoreFactorBreakdown', () => {
  it('renders score value', () => {
    renderWithProviders(<ScoreFactorBreakdown score={0.72} />);

    expect(screen.getAllByText('0.72').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all 7 scoring factors', () => {
    renderWithProviders(<ScoreFactorBreakdown score={0.72} />);

    expect(screen.getByText('Timeline urgency')).toBeInTheDocument();
    expect(screen.getByText('Dependency weight')).toBeInTheDocument();
    expect(screen.getByText('Critical path')).toBeInTheDocument();
    expect(screen.getByText('Blocker status')).toBeInTheDocument();
    expect(screen.getByText('Human override')).toBeInTheDocument();
    expect(screen.getByText('Resource risk')).toBeInTheDocument();
    expect(screen.getByText('Constraint pressure')).toBeInTheDocument();
  });

  it('renders default summary text', () => {
    renderWithProviders(<ScoreFactorBreakdown score={0.72} />);

    expect(screen.getByText(/timeline urgency, dependency pressure/)).toBeInTheDocument();
  });
});
