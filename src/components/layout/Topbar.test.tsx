// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/utils';
import { server } from '@/test/server';
import { Topbar } from '@/components/layout/Topbar';
import { useAuthStore } from '@/stores/auth';

describe('Topbar', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: true, userId: 'user-001', role: 'ADMIN' });
  });

  it('renders breadcrumbs', () => {
    renderWithProviders(<Topbar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders notification bell', () => {
    renderWithProviders(<Topbar />);
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('renders avatar with user initials', () => {
    renderWithProviders(<Topbar />);
    expect(screen.getByText('US')).toBeInTheDocument();
  });

  it('shows no badge when unread_count is 0', async () => {
    renderWithProviders(<Topbar />);
    await waitFor(() => {
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });
  });

  it('shows numeric badge when unread_count > 0', async () => {
    server.use(
      http.get('/app/v1/notifications', () =>
        HttpResponse.json({ items: [], unread_count: 3, next_cursor: null })
      )
    );
    renderWithProviders(<Topbar />);
    await waitFor(() => {
      expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('3');
    });
  });

  it('shows 9+ badge when unread_count > 9', async () => {
    server.use(
      http.get('/app/v1/notifications', () =>
        HttpResponse.json({ items: [], unread_count: 12, next_cursor: null })
      )
    );
    renderWithProviders(<Topbar />);
    await waitFor(() => {
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('9+');
    });
  });

  it('opens notification panel on bell click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Topbar />);
    await user.click(screen.getByTestId('notification-bell'));
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Topbar />);
    await user.click(screen.getByTestId('notification-bell'));
    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
  });

  it('renders notification items from API', async () => {
    server.use(
      http.get('/app/v1/notifications', () =>
        HttpResponse.json({
          items: [
            {
              id: 'notif-001',
              event_type: 'task.needs_attention',
              title: 'Task blocked: Deploy',
              body: 'Transitioned to BLOCKED',
              metadata: {},
              is_read: false,
              read_at: null,
              created_at: new Date().toISOString(),
            },
          ],
          unread_count: 1,
          next_cursor: null,
        })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<Topbar />);
    await user.click(screen.getByTestId('notification-bell'));
    await waitFor(() => {
      expect(screen.getByText('Task blocked: Deploy')).toBeInTheDocument();
      expect(screen.getByText('Transitioned to BLOCKED')).toBeInTheDocument();
    });
  });

  it('closes notification panel on close button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Topbar />);
    await user.click(screen.getByTestId('notification-bell'));
    await user.click(screen.getByLabelText('Close notifications'));
    expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument();
  });

  it('dismiss button calls delete endpoint', async () => {
    let deleteCalled = false;
    server.use(
      http.get('/app/v1/notifications', () =>
        HttpResponse.json({
          items: [
            {
              id: 'notif-001',
              event_type: 'task.needs_attention',
              title: 'Task blocked: Deploy',
              body: '',
              metadata: {},
              is_read: false,
              read_at: null,
              created_at: new Date().toISOString(),
            },
          ],
          unread_count: 1,
          next_cursor: null,
        })
      ),
      http.delete('/app/v1/notifications/:id', () => {
        deleteCalled = true;
        return HttpResponse.json({ id: 'notif-001', ok: true });
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<Topbar />);
    await user.click(screen.getByTestId('notification-bell'));
    await waitFor(() => screen.getByTestId('notification-dismiss'));
    await user.click(screen.getByTestId('notification-dismiss'));
    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('mark all read button calls read-all endpoint', async () => {
    let readAllCalled = false;
    server.use(
      http.get('/app/v1/notifications', () =>
        HttpResponse.json({ items: [], unread_count: 2, next_cursor: null })
      ),
      http.post('/app/v1/notifications/read-all', () => {
        readAllCalled = true;
        return HttpResponse.json({ updated: 2, ok: true });
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<Topbar />);
    await waitFor(() => screen.getByTestId('notification-badge'));
    await user.click(screen.getByTestId('notification-bell'));
    await waitFor(() => screen.getByTestId('notification-mark-all-read'));
    await user.click(screen.getByTestId('notification-mark-all-read'));
    await waitFor(() => expect(readAllCalled).toBe(true));
  });

  it('refreshes unread badge after notifications cache invalidation', async () => {
    let unread = 0;
    server.use(
      http.get('/app/v1/notifications', () =>
        HttpResponse.json({ items: [], unread_count: unread, next_cursor: null })
      )
    );

    const { queryClient } = renderWithProviders(<Topbar />);

    await waitFor(() => {
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });

    unread = 4;
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });

    await waitFor(() => {
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('4');
    });
  });
});
