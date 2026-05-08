// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { EpisodicMemoryPage } from '@/features/intelligence/EpisodicMemoryPage';

describe('EpisodicMemoryPage', () => {
  it('renders the episode list panel', () => {
    renderWithProviders(<EpisodicMemoryPage />);
    expect(screen.getByTestId('episodic-list')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    renderWithProviders(<EpisodicMemoryPage />);
    // agentId is empty in tests so query is disabled — empty state shown
    expect(screen.getByText('No episodic memory entries yet.')).toBeInTheDocument();
  });

  it('shows placeholder when no entry selected', () => {
    renderWithProviders(<EpisodicMemoryPage />);
    expect(screen.getByText('Select an entry to view its content')).toBeInTheDocument();
  });
});
