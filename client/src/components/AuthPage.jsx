import React, { useState } from 'react';

export default function AuthPage({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all required fields.");
      return;
    }
    if (isSignUp) {
      if (!name) {
        alert("Please enter your name.");
        return;
      }
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const payload = isSignUp ? { name, email, password } : { email, password };
      
      const response = await fetch(`${window.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (response.ok) {
        // Triggers successful login hook with database user object
        onLogin(data.user);
      } else {
        alert(data.error || "Authentication failed.");
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert("Could not connect to authentication server. Make sure it is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (socialName, socialEmail) => {
    setLoading(true);
    try {
      // First try to login
      let response = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: socialEmail, password: 'social-auth-password' })
      });
      
      let data = await response.json();
      if (!response.ok) {
        // If login failed, try to register
        response = await fetch(`${window.API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: socialName, email: socialEmail, password: 'social-auth-password' })
        });
        data = await response.json();
      }
      
      if (response.ok) {
        onLogin(data.user);
      } else {
        alert(data.error || "Social authentication failed.");
      }
    } catch (error) {
      console.error("Social auth error:", error);
      alert("Could not connect to authentication server. Make sure it is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg-main)',
      backgroundImage: 'radial-gradient(at 50% 50%, rgba(0, 113, 227, 0.08) 0px, transparent 50%)'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '35px' }}>
        {/* Brand Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span style={{ fontSize: '3rem' }}>🦆</span>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', marginTop: '10px' }}>
            AI AutoApply
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '5px' }}>
            Your Autonomous Career Agent Portal
          </p>
        </div>

        {/* Auth Toggle Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '25px'
        }}>
          <button 
            style={{
              flex: 1,
              background: !isSignUp ? 'var(--color-primary)' : 'none',
              border: 'none',
              borderRadius: '6px',
              color: !isSignUp ? 'white' : 'var(--text-muted)',
              padding: '8px',
              fontFamily: 'var(--font-display)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            onClick={() => setIsSignUp(false)}
          >
            Sign In
          </button>
          <button 
            style={{
              flex: 1,
              background: isSignUp ? 'var(--color-primary)' : 'none',
              border: 'none',
              borderRadius: '6px',
              color: isSignUp ? 'white' : 'var(--text-muted)',
              padding: '8px',
              fontFamily: 'var(--font-display)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </button>
        </div>

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="profile-form">
          {isSignUp && (
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="John Doe" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="you@example.com" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="glow-btn" 
            disabled={loading}
            style={{ width: '100%', marginTop: '15px', padding: '12px' }}
          >
            {loading ? "Authenticating..." : (isSignUp ? "Create Account" : "Access Portal")}
          </button>
        </form>

        {/* Mock social auth */}
        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px',
            fontSize: '0.8rem',
            color: 'var(--text-dark)',
            marginBottom: '15px' 
          }}>
            <div style={{ height: '1px', background: 'var(--border-glass)', flexGrow: 1 }}></div>
            <span>OR CONTINUE WITH</span>
            <div style={{ height: '1px', background: 'var(--border-glass)', flexGrow: 1 }}></div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="glow-btn btn-secondary" 
              style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
              onClick={() => handleSocialLogin("Google Developer", "dev@google.com")}
              disabled={loading}
            >
              Google
            </button>
            <button 
              className="glow-btn btn-secondary" 
              style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
              onClick={() => handleSocialLogin("LinkedIn Professional", "pro@linkedin.com")}
              disabled={loading}
            >
              LinkedIn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
