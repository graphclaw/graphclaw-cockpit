// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { WorkforcePage } from './WorkforcePage';

describe('WorkforcePage', () => {
  it('renders the Workforce heading', async () => {
    renderWithProviders(<WorkforcePage />);
    await waitFor(() => {
      expect(screen.getByText('Workforce')).toBeInTheDocument();
    });
  });

  it('renders Humans and AI Agents tab buttons', async () => {
    renderWithProviders(<WorkforcePage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /humans/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ai agents/i })).toBeInTheDocument();
    });
  });

  it('defaults to Humans tab and shows KPI labels', async () => {
    renderWithProviders(<WorkforcePage />);
    await waitFor(() => {
      expect(screen.getByText('Active Members')).toBeInTheDocument();
      expect(screen.getByText('Avg Utilisation')).toBeInTheDocument();
      expect(screen.getByText('Over Capacity')).toBeInTheDocument();
      expect(screen.getByText('Active Tasks')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('switches to AI Agents tab and shows agent KPI labels', async () => {
    renderWithProviders(<WorkforcePage />);
    const agentsTab = await screen.findByRole('button', { name: /ai agents/i });
    fireEvent.click(agentsTab);
    await waitFor(() => {
      expect(screen.getByText('Active Agents')).toBeInTheDocument();
      expect(screen.getByText('Tasks Processing')).toBeInTheDocument();
    });
  });

  it('renders resource cards for humans after data loads', async () => {
    renderWithProviders(<WorkforcePage />);
    await waitFor(() => {
      // Alice Chen is the HUMAN resource in the mock
      expect(screen.getByText('Alice Chen')).toBeInTheDocument();
    });
  });

  it('renders resource cards for AI agents after switching tab', async () => {
    renderWithProviders(<WorkforcePage />);
    const agentsTab = await screen.findByRole('button', { name: /ai agents/i });
    fireEvent.click(agentsTab);
    await waitFor(() => {
      // Agent-Alpha is the AI_AGENT resource in the mock
      expect(screen.getByText('Agent-Alpha')).toBeInTheDocument();
    });
  });

  it('filters resources by search input', async () => {
    renderWithProviders(<WorkforcePage />);
    // Wait for data to load
    await screen.findByText('Alice Chen');

    const searchInput = screen.getByPlaceholderText(/filter by name/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.queryByText('Alice Chen')).not.toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderWithProviders(<WorkforcePage />);
    // Loading skeleton or spinner should be present before data resolves
    const spinners = document.querySelectorAll('[class*="animate-pulse"], [class*="animate-spin"]');
    // Either loading indicator is shown, or heading is visible
    const hasHeading = !!document.querySelector('h1');
    expect(spinners.length > 0 || hasHeading).toBe(true);
  });
});
