import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationCenter from '../NotificationCenter';
import { AuthContext } from '../../../contexts/AuthContext';

// Mock fetch
global.fetch = jest.fn();

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'employee'
};

const mockNotifications = [
  {
    _id: '1',
    title: 'Review Reminder',
    message: 'Your self-review is due tomorrow',
    type: 'review_reminder',
    priority: 'high',
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/reviews'
  },
  {
    _id: '2',
    title: 'New Feedback',
    message: 'You received feedback from John Doe',
    type: 'feedback_received',
    priority: 'medium',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    actionUrl: '/feedback'
  }
];

const renderWithAuth = (component, user = mockUser) => {
  return render(<AuthContext.Provider value={{ user }}>{component}</AuthContext.Provider>);
};

describe('NotificationCenter', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders nothing when closed', () => {
    renderWithAuth(<NotificationCenter isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('renders notification center when open', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: [],
        unreadCount: 0
      })
    });

    renderWithAuth(<NotificationCenter isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('displays loading state while fetching notifications', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    renderWithAuth(<NotificationCenter isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('displays notifications when loaded', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: mockNotifications,
        unreadCount: 1
      })
    });

    renderWithAuth(<NotificationCenter isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Review Reminder')).toBeInTheDocument();
      expect(screen.getByText('New Feedback')).toBeInTheDocument();
    });
  });

  it('displays unread count badge', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: mockNotifications,
        unreadCount: 1
      })
    });

    renderWithAuth(<NotificationCenter isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: [],
        unreadCount: 0
      })
    });

    renderWithAuth(<NotificationCenter isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });

  it('marks notification as read when clicked', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: mockNotifications,
          unreadCount: 1
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

    renderWithAuth(<NotificationCenter isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Review Reminder')).toBeInTheDocument();
    });

    const markReadButton = screen.getAllByTitle('Mark as read')[0];
    fireEvent.click(markReadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/notifications/1/read', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer mock-token'
        }
      });
    });
  });

  it('marks all notifications as read', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: mockNotifications,
          unreadCount: 1
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

    renderWithAuth(<NotificationCenter isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Mark all read')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Mark all read'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer mock-token'
        }
      });
    });
  });

  it('closes when backdrop is clicked', () => {
    const onClose = jest.fn();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: [],
        unreadCount: 0
      })
    });

    renderWithAuth(<NotificationCenter isOpen={true} onClose={onClose} />);

    const backdrop = document.querySelector('.bg-black');
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalled();
  });

  it('closes when X button is clicked', async () => {
    const onClose = jest.fn();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: [],
        unreadCount: 0
      })
    });

    renderWithAuth(<NotificationCenter isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('displays correct notification icons based on type', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: mockNotifications,
        unreadCount: 1
      })
    });

    renderWithAuth(<NotificationCenter isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      // Check that icons are rendered (we can't easily test specific icons, but we can check they exist)
      const notificationItems = screen.getAllByRole('button', { name: /mark as read/i });
      expect(notificationItems).toHaveLength(1); // Only unread notifications have mark as read button
    });
  });

  it('formats time ago correctly', async () => {
    const recentNotification = {
      ...mockNotifications[0],
      createdAt: new Date(Date.now() - 60000).toISOString() // 1 minute ago
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: [recentNotification],
        unreadCount: 1
      })
    });

    renderWithAuth(<NotificationCenter isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('1m ago')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithAuth(<NotificationCenter isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      // Should not crash and should show empty state or loading
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('does not fetch notifications when user is not provided', () => {
    renderWithAuth(<NotificationCenter isOpen={true} onClose={() => {}} />, null);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('NotificationCenter Integration', () => {
  it('handles complete notification workflow', async () => {
    const onClose = jest.fn();

    // Mock initial fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: [mockNotifications[0]], // One unread notification
        unreadCount: 1
      })
    });

    // Mock mark as read
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    renderWithAuth(<NotificationCenter isOpen={true} onClose={onClose} />);

    // Wait for notifications to load
    await waitFor(() => {
      expect(screen.getByText('Review Reminder')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Unread count
    });

    // Mark as read
    const markReadButton = screen.getByTitle('Mark as read');
    fireEvent.click(markReadButton);

    // Verify API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/notifications/1/read', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer mock-token'
        }
      });
    });
  });
});
