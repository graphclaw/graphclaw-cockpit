// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { OrgSwitcher } from '@/features/auth/OrgSwitcher';

describe('OrgSwitcher', () => {
  it('hides itself when user has no orgs', async () => {
    renderWithProviders(<OrgSwitcher />);
    // MSW returns empty list by default — component should not render
    await waitFor(() => {
      expect(screen.queryByTestId('org-switcher')).not.toBeInTheDocument();
    });
  });

  it('renders nothing while loading', () => {
    renderWithProviders(<OrgSwitcher />);
    // During load, org-switcher is hidden (returns null while loading)
    // The component mounts but renders null until data arrives
    expect(screen.queryByTestId('org-switcher-trigger')).not.toBeInTheDocument();
  });

  it('does not show menu when closed', async () => {
    renderWithProviders(<OrgSwitcher />);
    await waitFor(() => {
      expect(screen.queryByTestId('org-switcher-menu')).not.toBeInTheDocument();
    });
  });
});
