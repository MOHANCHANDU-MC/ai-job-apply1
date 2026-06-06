import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReturnHome = () => {
    // Clear any potentially corrupt state from localStorage and reload
    localStorage.removeItem('aa_user');
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f7',
          fontFamily: '"SF Pro Text", -apple-system, sans-serif',
          color: '#1d1d1f',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px' }}>Something went wrong</h1>
          <p style={{ color: '#6e6e73', fontSize: '1rem', maxWidth: '500px', marginBottom: '24px', lineHeight: '1.6' }}>
            We encountered an unexpected error while loading the page. Let's get you back on track.
          </p>
          <button 
            onClick={this.handleReturnHome}
            style={{
              background: '#0071e3',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              padding: '12px 30px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 113, 227, 0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
