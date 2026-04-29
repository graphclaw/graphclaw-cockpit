import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { SemanticMemoryPage } from '@/features/intelligence/SemanticMemoryPage';

describe('SemanticMemoryPage', () => {
  it('renders topic list header', () => {
    renderWithProviders(<SemanticMemoryPage />);
    expect(screen.getByText('Topics')).toBeInTheDocument();
  });

  it('shows empty state when no topics', () => {
    renderWithProviders(<SemanticMemoryPage />);
    // agentId is empty in tests so query is disabled — empty state shown
    expect(screen.getByText('No topics yet.')).toBeInTheDocument();
  });

  it('can create a new topic and editor appears', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SemanticMemoryPage />);

    // Click the + button (has an SVG child)
    const plusBtn = screen.getAllByRole('button').find((b) => b.querySelector('svg'))!;
    await user.click(plusBtn);
    const input = screen.getByTestId('new-topic-input');
    await user.type(input, 'my-new-topic');
    await user.click(screen.getByText('Add'));

    expect(screen.getByText('my-new-topic')).toBeInTheDocument();
    expect(screen.getByTestId('semantic-editor')).toBeInTheDocument();
  });
});
