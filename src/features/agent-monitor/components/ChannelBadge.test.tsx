import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ChannelBadge } from './ChannelBadge';

describe('ChannelBadge', () => {
  it('renders known channel badges with normalized casing', () => {
    renderWithProviders(<ChannelBadge channel="Email" />);

    expect(screen.getByTestId('channel-badge-email')).toBeInTheDocument();
    expect(screen.getByText('EMAIL')).toBeInTheDocument();
  });

  it('renders unknown channel fallback', () => {
    renderWithProviders(<ChannelBadge channel="sms" />);

    expect(screen.getByTestId('channel-badge-unknown')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });

  it('renders UNKNOWN when channel is missing', () => {
    renderWithProviders(<ChannelBadge channel={undefined} />);

    expect(screen.getByTestId('channel-badge-unknown')).toBeInTheDocument();
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });
});
