// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Bell: () => <span data-testid="bell-icon">Bell</span>,
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
  Check: () => <span>Check</span>,
  RefreshCw: () => <span>Refresh</span>
}));

// Mock Sidebar
vi.mock('../components/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar Mock</div>
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>
  };
});

// Mock apiClient
vi.mock('../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mutable mock user for tests
let mockUser = {
  id: 'user_123',
  username: 'testathlete',
  email: 'athlete@test.com',
  isEmailVerified: true
};
const mockLogout = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout
  })
}));

describe('DashboardLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      id: 'user_123',
      username: 'testathlete',
      email: 'athlete@test.com',
      isEmailVerified: true
    };
    // Default mock resolve for get notifications
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          notifications: []
        }
      }
    });
  });

  it('renders DashboardLayout and children normally', async () => {
    render(<DashboardLayout />);

    expect(screen.getByText('Health Intelligence')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.queryByText(/Your email address is unverified/i)).not.toBeInTheDocument();
  });

  it('displays Email Verification Banner and dispatches email verification resend', async () => {
    mockUser.isEmailVerified = false;
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        success: true,
        data: { message: 'Verification email sent successfully!' }
      }
    });

    render(<DashboardLayout />);

    const banner = screen.getByText(/Your email address is unverified/i);
    expect(banner).toBeInTheDocument();

    const resendBtn = screen.getByRole('button', { name: /Resend Mail/i });
    expect(resendBtn).toBeInTheDocument();

    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/resend-verification');
      expect(toast.success).toHaveBeenCalledWith('Verification email sent successfully!');
    });
  });

  it('fetches notifications and displays badge when there are unread messages', async () => {
    const mockNotifications = [
      { _id: 'notif_1', title: 'Plan Ready', message: 'Your workout plan is ready.', read: false, createdAt: new Date().toISOString() },
      { _id: 'notif_2', title: 'Hydration Goal', message: 'Hydration goal met.', read: true, createdAt: new Date().toISOString() }
    ];

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          notifications: mockNotifications
        }
      }
    });

    render(<DashboardLayout />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications');
    });

    // Verify unread badge exists (since notif_1 is read: false, unreadCount = 1)
    const bellBtn = screen.getByTestId('bell-icon').parentElement;
    expect(bellBtn).toBeInTheDocument();
  });

  it('opens notifications panel and marks notification as read when clicked', async () => {
    const mockNotifications = [
      { _id: 'notif_1', title: 'Plan Ready', message: 'Your workout plan is ready.', read: false, createdAt: new Date().toISOString() }
    ];

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          notifications: mockNotifications
        }
      }
    });
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { success: true } });

    render(<DashboardLayout />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });

    // Click bell icon
    const bellBtn = screen.getByTestId('bell-icon');
    fireEvent.click(bellBtn);

    // Verify dropdown notifications are displayed
    expect(screen.getByText('Plan Ready')).toBeInTheDocument();
    expect(screen.getByText('Your workout plan is ready.')).toBeInTheDocument();

    // Click on the notification to mark it as read
    const notifItem = screen.getByText('Plan Ready').parentElement;
    fireEvent.click(notifItem!);

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith('/api/notifications/notif_1/read');
    });
  });

  it('marks all notifications as read when clicking Mark all read', async () => {
    const mockNotifications = [
      { _id: 'notif_1', title: 'Plan Ready', message: 'Your workout plan is ready.', read: false, createdAt: new Date().toISOString() }
    ];

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          notifications: mockNotifications
        }
      }
    });
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { success: true } });

    render(<DashboardLayout />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });

    // Click bell icon
    const bellBtn = screen.getByTestId('bell-icon');
    fireEvent.click(bellBtn);

    const markAllBtn = screen.getByRole('button', { name: /Mark all read/i });
    expect(markAllBtn).toBeInTheDocument();

    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith('/api/notifications/read-all');
      expect(toast.success).toHaveBeenCalledWith('All notifications marked as read.');
    });
  });

  it('deletes notification when clicking delete icon', async () => {
    const mockNotifications = [
      { _id: 'notif_1', title: 'Plan Ready', message: 'Your workout plan is ready.', read: false, createdAt: new Date().toISOString() }
    ];

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          notifications: mockNotifications
        }
      }
    });
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { success: true } });

    render(<DashboardLayout />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });

    // Click bell icon
    const bellBtn = screen.getByTestId('bell-icon');
    fireEvent.click(bellBtn);

    const deleteBtn = screen.getByTestId('trash-icon');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/api/notifications/notif_1');
      expect(toast.success).toHaveBeenCalledWith('Notification cleared.');
    });
  });
});
