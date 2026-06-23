import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // You could post the error stack to an error tracking endpoint like /api/telemetry/errors
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#020617', // slate-950
          color: '#f8fafc', // slate-50
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)', // slate-900/60
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(51, 65, 85, 0.4)', // slate-700/40
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3.5rem',
              marginBottom: '1rem',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
              ⚠️
            </div>
            
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#ffffff',
              marginBottom: '0.75rem',
              letterSpacing: '-0.025em'
            }}>
              System Exception Isolated
            </h1>

            <p style={{
              fontSize: '0.875rem',
              color: '#94a3b8', // slate-400
              lineHeight: '1.5',
              marginBottom: '1.5rem'
            }}>
              A component rendering exception has been safely caught. Your logged data and session targets remain active.
            </p>

            <div style={{
              backgroundColor: '#020617',
              borderRadius: '0.75rem',
              padding: '1rem',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: '#f1f5f9',
              textAlign: 'left',
              overflowX: 'auto',
              marginBottom: '2rem',
              border: '1px solid rgba(51, 65, 85, 0.2)'
            }}>
              {this.state.error?.message || 'Unknown render exception'}
            </div>

            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#ccff00', // Neon lime accent
                color: '#020617',
                fontWeight: 'bold',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px 0 rgba(204, 255, 0, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              Recover & Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
