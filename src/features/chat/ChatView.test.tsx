// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ChatView } from '@/features/chat/ChatView';

// Simulate an ongoing stream so isStreaming stays true after send
vi.mock('@/lib/chat-stream', () => ({
  startChatStream: () => new Promise(() => {}),
}));

describe('ChatView', () => {
  it('renders chat interface', () => {
    renderWithProviders(<ChatView />);
    expect(screen.getByTestId('chat-view')).toBeInTheDocument();
    expect(screen.getByText('GraphClaw Chat')).toBeInTheDocument();
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

    expect(input).toHaveValue('');
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
