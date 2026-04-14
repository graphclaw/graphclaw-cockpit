import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { SemanticMemoryPage } from '@/features/intelligence/SemanticMemoryPage';

describe('SemanticMemoryPage', () => {
  it('renders topic list', () => {
    renderWithProviders(<SemanticMemoryPage />);
    expect(screen.getByText('Topics')).toBeInTheDocument();
    expect(screen.getByText('Task Scoring')).toBeInTheDocument();
    expect(screen.getByText('API Patterns')).toBeInTheDocument();
    expect(screen.getByText('Task State Machine')).toBeInTheDocument();
  });

  it('renders editor for selected topic', () => {
    renderWithProviders(<SemanticMemoryPage />);
    expect(screen.getByTestId('semantic-editor')).toBeInTheDocument();
  });

  it('can create a new topic', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SemanticMemoryPage />);

    await user.click(screen.getAllByRole('button').find((b) => b.querySelector('svg'))!);
    const input = screen.getByTestId('new-topic-input');
    await user.type(input, 'New Topic');
    await user.click(screen.getByText('Add'));

    expect(screen.getByText('New Topic')).toBeInTheDocument();
  });
});
