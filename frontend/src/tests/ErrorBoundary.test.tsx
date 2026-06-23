// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../components/ErrorBoundary';

const ProblemChild = () => {
  throw new Error('Test rendering crash');
};

describe('ErrorBoundary component', () => {
  beforeEach(() => {
    vi.stubGlobal('location', {
      href: ''
    });
    // Suppress console.error in tests for expected rendering errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Normal Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Normal Content');
    expect(screen.queryByText('System Exception Isolated')).not.toBeInTheDocument();
  });

  it('catches rendering errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('System Exception Isolated')).toBeInTheDocument();
    expect(screen.getByText('Test rendering crash')).toBeInTheDocument();
    expect(screen.getByText('Recover & Go to Dashboard')).toBeInTheDocument();
  });

  it('redirects to dashboard when recovery button is clicked', () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    const button = screen.getByText('Recover & Go to Dashboard');
    fireEvent.click(button);

    expect(window.location.href).toBe('/dashboard');
  });
});
