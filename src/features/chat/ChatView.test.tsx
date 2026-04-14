import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ChatView } from '@/features/chat/ChatView';

describe('ChatView', () => {
  it('renders chat interface', () => {
    renderWithProviders(<ChatView />);
    expect(screen.getByTestId('chat-view')).toBeInTheDocument();
    expect(screen.getByText('GraphClaw Chat')).toBeInTheDocument();
  });

  it('renders mock messages', () => {
    renderWithProviders(<ChatView />);
    expect(
      screen.getByText('What are the top priority tasks right now?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Here are the top 3 tasks by priority score:'),
    ).toBeInTheDocument();
  });

  it('renders inline task cards', () => {
    renderWithProviders(<ChatView />);
    expect(screen.getByText('Deploy API v2.1')).toBeInTheDocument();
    expect(screen.getByText('Fix auth token refresh')).toBeInTheDocument();
  });

  it('renders suggestion pills', () => {
    renderWithProviders(<ChatView />);
    expect(screen.getByText('Show my tasks for today')).toBeInTheDocument();
    expect(screen.getByText('Run the daily briefing')).toBeInTheDocument();
  });

  it('can send a message', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatView />);

    const input = screen.getByTestId('chat-input');
    await user.type(input, 'Hello agent');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Hello agent')).toBeInTheDocument();
  });

  it('shows typing indicator after sending', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatView />);

    const input = screen.getByTestId('chat-input');
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });
});
