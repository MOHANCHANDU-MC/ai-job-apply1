import React, { useState, useEffect } from 'react';

export default function LandingPage({ onEnterApp }) {
  const [sandboxActive, setSandboxActive] = useState(false);
  const [sandboxLogs, setSandboxLogs] = useState([]);
  const [sandboxProgress, setSandboxProgress] = useState(0);

  const demoLogs = [
    "[DISCOVERY] Crawling job boards for 'Frontend Engineer'...",
    "[DISCOVERY] Found 3 matching posts on LinkedIn & Company career pages.",
    "[PARSING] Extracting candidate skills: React, TypeScript, HTML, CSS...",
    "[MATCHING] Stripe Frontend role: 85% match (Missing: Redux).",
    "[MATCHING] Canva UI role: 100% match!",
    "[APPLYING] Autofilling Canva application forms...",
    "[APPLYING] Inputting: Full Name, email, LinkedIn, portfolio link...",
    "[UPLOAD] Injecting resume.pdf...",
    "[SUBMIT] Bypassing reCAPTCHA checks and submitting...",
    "[SUCCESS] Applied successfully! Triggered confirmation email.",
    "[SIMULATION] Callback email from Canva HR scheduled."
  ];

  useEffect(() => {
    if (!sandboxActive) return;

    let index = 0;
    setSandboxLogs([]);
    setSandboxProgress(0);

    const interval = setInterval(() => {
      if (index < demoLogs.length) {
        setSandboxLogs(prev => [...prev, demoLogs[index]]);
        setSandboxProgress(Math.round(((index + 1) / demoLogs.length) * 100));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [sandboxActive]);

  return (
    <div className="landing-container tab-content">
      {/* Hero Section */}
      <header className="landing-hero">
        <h1>
          Your Autonomous <span>AI Career Agent</span>
        </h1>
        <p>
          Let your agent crawl job boards, match compatibility scores, autofill applications, 
          and track response emails 24/7. So you can focus on preparing for the interview.
        </p>
        <button className="glow-btn pulse-anim" onClick={onEnterApp}>
          Launch Agent Dashboard →
        </button>
      </header>

      {/* Illustrated Product Feature Section */}
      <section className="sandbox-widget glass-card" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '40px', 
        alignItems: 'stretch', 
        padding: '40px', 
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(168, 85, 247, 0.03) 50%, rgba(236, 72, 153, 0.03) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.12)',
        boxShadow: '0 10px 30px rgba(99, 102, 241, 0.03)',
        minHeight: '400px'
      }}>
        <div className="sandbox-left" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', animation: 'fadeIn 0.8s ease-out' }}>
          <span className="badge badge-primary" style={{ 
            display: 'inline-block', 
            marginBottom: '15px', 
            fontSize: '0.8rem', 
            padding: '5px 14px', 
            borderRadius: '99px', 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(236, 72, 153, 0.12))', 
            color: '#6366f1', 
            fontWeight: '700',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            alignSelf: 'flex-start'
          }}>
            Next-Gen Career Automation 🚀
          </span>
          <h2 style={{ 
            fontSize: '2.4rem', 
            marginBottom: '15px', 
            fontWeight: '800', 
            fontFamily: 'var(--font-display)', 
            lineHeight: '1.15',
            background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #db2777 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            Automate the Job Search Hustle
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '25px' }}>
            AI AutoApply handles the heavy lifting of job hunting. By automating candidate profile mapping, form submissions, and recruiter communications, our agent frees you up to do what matters most—preparing for interviews.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ 
                color: 'white', 
                background: 'linear-gradient(135deg, #4f46e5, #db2777)', 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                boxShadow: '0 3px 8px rgba(79, 70, 229, 0.3)',
                marginTop: '2px'
              }}>✓</div>
              <div>
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-main)' }}>Zero Form-Filling Fatigue</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>The agent instantly maps profiles and fills application questionnaires.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ 
                color: 'white', 
                background: 'linear-gradient(135deg, #4f46e5, #db2777)', 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                boxShadow: '0 3px 8px rgba(79, 70, 229, 0.3)',
                marginTop: '2px'
              }}>✓</div>
              <div>
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-main)' }}>Real-Time Status & Tracking</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Monitor recruiter emails and interview requests in a centralized inbox.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sandbox-right" style={{ display: 'flex', width: '100%', height: '100%', animation: 'fadeIn 1s ease-out' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #4f46e5, #db2777)',
            padding: '3px',
            borderRadius: '19px',
            boxShadow: '0 12px 36px rgba(79, 70, 229, 0.15)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer',
            width: '100%',
            height: '100%',
            display: 'flex'
          }}
          className="hero-image-hover"
          >
            <div style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/ai_agent_illustration.png" 
                alt="AI Career Agent Illustration" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'block', 
                  minHeight: '340px', 
                  objectFit: 'cover' 
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="features-grid">
        <div className="glass-card feature-card">
          <div style={{ fontSize: '2rem' }}>📁</div>
          <h3>AI Resume Structurer</h3>
          <p>Drag and drop your PDF resume. Our agent reads it, extracts your contact details, and maps your technology stack.</p>
        </div>

        <div className="glass-card feature-card">
          <div style={{ fontSize: '2rem' }}>🔍</div>
          <h3>Multi-Board Crawling</h3>
          <p>The agent automatically scans job openings across LinkedIn, Naukri, and directly from corporate career boards.</p>
        </div>

        <div className="glass-card feature-card">
          <div style={{ fontSize: '2rem' }}>📊</div>
          <h3>Compatibility Matching</h3>
          <p>Calculates a match percentage for each job. Tells you exactly which skills match and what tech keywords are missing.</p>
        </div>

        <div className="glass-card feature-card">
          <div style={{ fontSize: '2rem' }}>📬</div>
          <h3>Confirmation & Sync</h3>
          <p>Sends immediate confirmation emails after each submit and collects real recruiter response emails right in your inbox.</p>
        </div>
      </section>
    </div>
  );
}
