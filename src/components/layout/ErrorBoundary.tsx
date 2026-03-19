import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Synapse] Component error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          padding: '2rem',
          background: '#0A1628',
          color: '#EF9A9A',
          borderRadius: '12px',
          margin: '1rem',
          fontFamily: 'var(--font-mono)',
          direction: 'rtl',
        }}>
          <h3 style={{ color: '#4FC3F7', marginBottom: '0.5rem' }}>שגיאה בלתי צפויה</h3>
          <p style={{ color: '#90A4AE', fontSize: '0.9rem' }}>
            {this.state.error?.message ?? 'אירעה שגיאה. נסה לרענן את הדף.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#1A2A44',
              color: '#4FC3F7',
              border: '1px solid #4FC3F740',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            נסה שוב
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
