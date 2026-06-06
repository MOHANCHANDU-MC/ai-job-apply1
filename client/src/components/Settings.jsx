import React, { useState } from 'react';

export default function Settings({ smtpConfig, onSmtpConfigUpdate, geminiKey, onGeminiKeyUpdate }) {
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  // Update local SMTP field values
  const handleSmtpChange = (field, value) => {
    onSmtpConfigUpdate({
      ...smtpConfig,
      [field]: value
    });
  };

  // Trigger SMTP verify check
  const handleTestSmtp = async () => {
    if (!smtpConfig.email || !smtpConfig.password) {
      alert("Please fill in both Email and Password fields before testing.");
      return;
    }

    setTestingSmtp(true);
    setTestStatus({ type: 'info', msg: 'Verifying SMTP connection and sending test email...' });

    try {
      const response = await fetch('http://127.0.0.1:5000/api/settings/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig })
      });

      const data = await response.json();
      if (response.ok) {
        setTestStatus({ type: 'success', msg: data.message });
      } else {
        setTestStatus({ type: 'error', msg: data.error || 'SMTP test connection failed.' });
      }
    } catch (error) {
      setTestStatus({ type: 'error', msg: 'Could not connect to backend server. Make sure server is running.' });
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <div className="tab-content">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.2rem' }}>System Configurations</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure credentials to activate real email delivery and advanced AI parsing capabilities.</p>
      </div>

      <div className="settings-grid">
        {/* SMTP Setup */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📧</span> SMTP Email Integration
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Connect your email client to send real-time application confirmations and recruiter callbacks. 
            <em> (Recommended: use a Gmail App Password).</em>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>SMTP Host</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="smtp.gmail.com" 
                value={smtpConfig.host || ''}
                onChange={(e) => handleSmtpChange('host', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>SMTP Port</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="465" 
                  value={smtpConfig.port || ''}
                  onChange={(e) => handleSmtpChange('port', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Secure Transport</label>
                <select 
                  className="input-field"
                  value={smtpConfig.secure}
                  onChange={(e) => handleSmtpChange('secure', e.target.value)}
                >
                  <option value="true">SSL (port 465)</option>
                  <option value="false">TLS (port 587)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Sender Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="your.email@gmail.com" 
                value={smtpConfig.email || ''}
                onChange={(e) => handleSmtpChange('email', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>App Password / Token</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••••••••••" 
                value={smtpConfig.password || ''}
                onChange={(e) => handleSmtpChange('password', e.target.value)}
              />
            </div>

            <div style={{ marginTop: '10px' }}>
              <button 
                className="glow-btn btn-secondary" 
                onClick={handleTestSmtp}
                disabled={testingSmtp}
                style={{ width: '100%' }}
              >
                {testingSmtp ? "Verifying..." : "Verify Connection & Send Test Email"}
              </button>
            </div>

            {testStatus && (
              <div 
                style={{ 
                  fontSize: '0.85rem', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginTop: '10px',
                  background: testStatus.type === 'success' ? 'rgba(16,185,129,0.1)' : 
                              testStatus.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                  color: testStatus.type === 'success' ? 'var(--color-success)' : 
                         testStatus.type === 'error' ? 'var(--color-danger)' : 'var(--color-primary)',
                  border: `1px solid ${
                    testStatus.type === 'success' ? 'rgba(16,185,129,0.2)' : 
                    testStatus.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'
                  }`
                }}
              >
                {testStatus.msg}
              </div>
            )}
          </div>
        </div>

        {/* Gemini API Setup */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🤖</span> Gemini LLM Integration
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Enter a Gemini API Key to enable advanced, context-aware parsing of PDF resumes. 
            If left blank, local pattern-matching algorithms will be used.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>Gemini API Key</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="AIzaSy..." 
                value={geminiKey}
                onChange={(e) => onGeminiKeyUpdate(e.target.value)}
              />
            </div>
            
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              🔑 <strong>Note:</strong> Your key is stored locally in your browser's memory and is only sent directly to the server to parse uploads.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
