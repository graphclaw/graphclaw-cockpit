import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ScoreExplainer } from '@/features/scoring/ScoreExplainer';

describe('ScoreExplainer', () => {
  it('renders score value', () => {
    renderWithProviders(<ScoreExplainer score={0.72} />);
    const scoreElements = screen.getAllByText('0.72');
    expect(scoreElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders all 7 scoring factors', () => {
    renderWithProviders(<ScoreExplainer score={0.72} />);
    expect(screen.getByText('Urgency')).toBeInTheDocument();
    expect(screen.getByText('Importance')).toBeInTheDocument();
    expect(screen.getByText('Dependencies')).toBeInTheDocument();
    expect(screen.getByText('Recency')).toBeInTheDocument();
    expect(screen.getByText('Effort')).toBeInTheDocument();
    expect(screen.getByText('Alignment')).toBeInTheDocument();
    expect(screen.getByText('Capacity')).toBeInTheDocument();
  });

  it('renders NL explanation', () => {
    renderWithProviders(<ScoreExplainer score={0.72} />);
    expect(screen.getByText(/high urgency and alignment/)).toBeInTheDocument();
  });
});
