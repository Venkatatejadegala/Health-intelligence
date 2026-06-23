// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';

// Mock useNavigate and useParams
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ token: 'test-token-123' })
}));

// Mock apiClient
vi.mock('../services/apiClient', () => ({
  default: {
    post: vi.fn()
  },
  getErrorMessage: vi.fn((error, fallback) => error.response?.data?.error || fallback)
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('ResetPasswordPage component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reset password inputs and buttons', () => {
    render(<ResetPasswordPage />);
    
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel & Sign In/i })).toBeInTheDocument();
  });

  it('navigates back to login when cancel is clicked', () => {
    render(<ResetPasswordPage />);
    
    const cancelButton = screen.getByRole('button', { name: /Cancel & Sign In/i });
    fireEvent.click(cancelButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('validates that passwords match', async () => {
    render(<ResetPasswordPage />);
    
    const passInput = screen.getByLabelText(/New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    
    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password456' } });
    fireEvent.click(submitButton);
    
    expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('validates password length threshold', async () => {
    render(<ResetPasswordPage />);
    
    const passInput = screen.getByLabelText(/New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    
    fireEvent.change(passInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);
    
    expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters long');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('successfully submits valid new password and redirects to login', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true } });
    
    render(<ResetPasswordPage />);
    
    const passInput = screen.getByLabelText(/New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    
    fireEvent.change(passInput, { target: { value: 'ValidPassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'ValidPassword123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/reset-password/test-token-123', { password: 'ValidPassword123!' });
      expect(toast.success).toHaveBeenCalledWith('Password updated successfully');
      expect(screen.getByText('Password Updated')).toBeInTheDocument();
    });

    const signInButton = screen.getByRole('button', { name: /Sign In Now/i });
    fireEvent.click(signInButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('handles reset token expiration api errors correctly', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: { data: { error: 'Invalid or expired token' } }
    });
    
    render(<ResetPasswordPage />);
    
    const passInput = screen.getByLabelText(/New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    
    fireEvent.change(passInput, { target: { value: 'ValidPassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'ValidPassword123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/reset-password/test-token-123', { password: 'ValidPassword123!' });
      expect(toast.error).toHaveBeenCalledWith('Invalid or expired token');
    });
  });
});
