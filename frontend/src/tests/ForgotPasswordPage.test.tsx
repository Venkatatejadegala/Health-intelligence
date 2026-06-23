// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
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

describe('ForgotPasswordPage component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders forgot password page inputs and submit button', () => {
    render(<ForgotPasswordPage />);
    
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dispatch Reset Link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Login/i })).toBeInTheDocument();
  });

  it('navigates back to login when back button is clicked', () => {
    render(<ForgotPasswordPage />);
    
    const backButton = screen.getByRole('button', { name: /Back to Login/i });
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('successfully submits email and shows success message state', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true } });
    
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const submitButton = screen.getByRole('button', { name: /Dispatch Reset Link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'test@example.com' });
      expect(toast.success).toHaveBeenCalledWith('Reset link dispatched successfully');
      expect(screen.getByText('Reset Link Dispatched')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('handles api errors gracefully during submission', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: { data: { error: 'User does not exist' } }
    });
    
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const submitButton = screen.getByRole('button', { name: /Dispatch Reset Link/i });
    
    fireEvent.change(emailInput, { target: { value: 'missing@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'missing@example.com' });
      expect(toast.error).toHaveBeenCalledWith('User does not exist');
      expect(screen.queryByText('Reset Link Dispatched')).not.toBeInTheDocument();
    });
  });
});
