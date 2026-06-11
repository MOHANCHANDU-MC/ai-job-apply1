import React, { useState, useEffect } from 'react';

export default function AgentConsole({ profile, jobs, applyingJobId, handleApply, handleApplyAll, onProfileUpdate, isLoggedIn, onLogin, refreshJobs, onApplySuccess }) {
  const [activeModalJob, setActiveModalJob] = useState(null);
  const [modalUploading, setModalUploading] = useState(false);
  const [modalProgress, setModalProgress] = useState(0);
  const [modalDragActive, setModalDragActive] = useState(false);
  const [modalLogs, setModalLogs] = useState([]);
  const [modalApplyingState, setModalApplyingState] = useState('idle'); // 'idle' | 'applying' | 'success'
  
  // Crawler states
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlLogs, setCrawlLogs] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);

  // Auto-reset uploaded filename state when active modal job is closed
  useEffect(() => {
    if (!activeModalJob) {
      setUploadedFileName(null);
    }
  }, [activeModalJob]);

  // Inline Modal Auth states
  const [modalAuthMode, setModalAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleApplyClick = (job) => {
    setActiveModalJob(job);
    setModalApplyingState('idle');
    setModalLogs([]);
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setAuthConfirmPassword('');
  };

  const handleTriggerCrawlAgent = () => {
    setIsCrawling(true);
    setHasSearched(false);

    if (refreshJobs) {
      refreshJobs();
    }

    // Simulate a brief, sleek loading state for 800ms to fetch jobs from platforms, then display directly
    setTimeout(() => {
      setIsCrawling(false);
      setHasSearched(true);
    }, 800);
  };

  const handleModalDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setModalDragActive(true);
    } else if (e.type === "dragleave") {
      setModalDragActive(false);
    }
  };

  const handleModalDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setModalDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleModalFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleModalFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleModalFileUpload(e.target.files[0]);
    }
  };

  const handleModalFileUpload = async (file) => {
    if (!activeModalJob) return;
    setModalUploading(true);
    setModalProgress(20);

    const progressTimer = setInterval(() => {
      setModalProgress(prev => (prev < 80 ? prev + 10 : prev));
    }, 150);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const headers = {};
      const savedUser = localStorage.getItem('aa_user');
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;
      const savedGeminiKey = localStorage.getItem('aa_gemini_key') || null;
      if (savedGeminiKey) {
        headers['x-gemini-key'] = savedGeminiKey;
      }
      if (parsedUser && parsedUser.id) {
        headers['x-user-id'] = parsedUser.id;
      }

      const response = await fetch(`${window.API_BASE_URL}/api/resume`, {
        method: 'POST',
        headers,
        body: formData
      });

      clearInterval(progressTimer);
      setModalProgress(100);

      const data = await response.json();
      if (response.ok) {
        if (onProfileUpdate) {
          onProfileUpdate(data.profile);
        }
        setUploadedFileName(file.name);
      } else {
        alert(data.error || 'Failed to parse resume');
      }
    } catch (error) {
      clearInterval(progressTimer);
      console.error('Upload error:', error);
      alert('Connection to server failed.');
    } finally {
      setTimeout(() => {
        setModalUploading(false);
        setModalProgress(0);
      }, 500);
    }
  };

  const handleModalAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      alert("Please fill in required credentials.");
      return;
    }
    if (modalAuthMode === 'signup') {
      if (!authName) {
        alert("Please enter your name.");
        return;
      }
      if (authPassword !== authConfirmPassword) {
        alert("Passwords do not match!");
        return;
      }
    }

    setAuthLoading(true);
    try {
      const endpoint = modalAuthMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const payload = modalAuthMode === 'signup'
        ? { name: authName, email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword };

      const response = await fetch(`${window.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        onLogin(data.user);
      } else {
        alert(data.error || 'Authentication failed.');
      }
    } catch (error) {
      console.error(error);
      alert('Connection to authentication server failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleModalSocialLogin = async (socialName, socialEmail) => {
    setAuthLoading(true);
    try {
      let response = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: socialEmail, password: 'social-auth-password' })
      });
      let data = await response.json();
      if (!response.ok) {
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
        alert(data.error || 'Social authentication failed.');
      }
    } catch (error) {
      console.error(error);
      alert('Connection failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleModalApplySubmit = async (job) => {
    setModalApplyingState('applying');
    
    try {
      const savedUser = localStorage.getItem('aa_user');
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;
      const headers = { 'Content-Type': 'application/json' };
      if (parsedUser && parsedUser.id) {
        headers['x-user-id'] = parsedUser.id;
      }
      
      const smtpConfig = localStorage.getItem('aa_smtp_config');
      const parsedSmtp = smtpConfig ? JSON.parse(smtpConfig) : {};

      const response = await fetch(`${window.API_BASE_URL}/api/jobs/apply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobId: job.id,
          smtpConfig: parsedSmtp
        })
      });

      const data = await response.json();
      if (response.ok) {
        // Maintain a smooth 1.2s loading state transition to keep the visual feedback premium
        setTimeout(() => {
          setModalApplyingState('success');
          onApplySuccess(job, data.application);
        }, 1200);
      } else {
        setModalApplyingState('error');
      }
    } catch (e) {
      console.error(e);
      setModalApplyingState('error');
    }
  };

  return (
    <div className="tab-content" style={{ marginTop: '10px' }}>
      
      {/* 1. Crawl Agent Interface (Rendered before search) */}
      {!hasSearched && (
        <div className="glass-card" style={{ padding: '50px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
          {!isCrawling ? (
            <>
              <div style={{ fontSize: '4rem', animation: 'fadeIn 0.5s ease' }}>🤖</div>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
                  Search for Jobs with AI Agent
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
                  Let your autonomous agent automatically search, crawl, and fetch developer job postings from LinkedIn, Naukri, and career platforms.
                </p>
              </div>
              <button 
                className="glow-btn pulse-anim" 
                onClick={handleTriggerCrawlAgent}
                style={{ padding: '14px 36px', fontSize: '1.1rem', fontWeight: '600' }}
              >
                Search for Jobs 🤖
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '16px', animation: 'fadeIn 0.3s ease-out' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
                Searching job platforms (LinkedIn, Naukri, Company Careers)...
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. Discovered Jobs Queue (Rendered after search completes) */}
      {hasSearched && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Discovered Jobs Queue</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                Found {jobs.length} roles from startups & MNCs on LinkedIn, Naukri, and career pages.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {profile && profile.skills && profile.skills.length > 0 && (
                <button 
                  className="glow-btn btn-secondary" 
                  onClick={handleApplyAll} 
                  disabled={applyingJobId !== null}
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  Batch Apply (Score &ge; 75%)
                </button>
              )}
              <button 
                className="glow-btn btn-secondary"
                onClick={handleTriggerCrawlAgent}
                style={{ padding: '8px 18px', fontSize: '0.85rem', borderColor: 'var(--border-glass)', color: 'var(--text-main)' }}
              >
                Search Again 🔄
              </button>
            </div>
          </div>

          <table className="jobs-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Channel</th>
                <th>Skills Required</th>
                <th>Match Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const isApplied = job.applied || false;
                const isApplying = applyingJobId === job.id;
                const score = job.matchPercent;
                
                let scoreBadge = "badge-danger";
                let scoreText = "N/A";
                if (score !== null) {
                  scoreText = `${score}% Match`;
                  if (score >= 80) scoreBadge = "badge-success";
                  else if (score >= 60) scoreBadge = "badge-warning";
                } else {
                  scoreBadge = "badge-primary";
                  scoreText = "Pending Resume";
                }

                return (
                  <tr key={job.id}>
                    <td>
                      <a 
                        href={job.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          fontWeight: '600', 
                          color: 'var(--text-main)', 
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        className="job-title-link"
                      >
                        {job.title} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>↗</span>
                      </a>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{job.location}</div>
                    </td>
                    <td>{job.company}</td>
                    <td>
                      <a 
                        href={job.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ textDecoration: 'none' }}
                      >
                        <span className="badge badge-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          {job.source} <span style={{ fontSize: '0.65rem' }}>↗</span>
                        </span>
                      </a>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '250px' }}>
                        {job.skillsRequired.map((s, i) => {
                          const isMatched = job.matched && job.matched.includes(s);
                          return (
                            <span 
                              key={i} 
                              style={{ 
                                fontSize: '0.7rem', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                background: isMatched ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 0, 0, 0.03)',
                                color: isMatched ? 'var(--color-success)' : 'var(--text-dark)',
                                border: `1px solid ${isMatched ? 'rgba(52, 199, 89, 0.2)' : 'var(--border-glass)'}`
                              }}
                            >
                              {s}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${scoreBadge}`} style={{ fontSize: '0.85rem' }}>
                        {scoreText}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="glow-btn"
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.8rem',
                          background: isApplied ? 'rgba(52, 199, 89, 0.1)' : (isApplying ? '#e5e5ea' : 'var(--color-primary)'),
                          border: isApplied ? '1px solid rgba(52, 199, 89, 0.25)' : 'none',
                          color: isApplied ? 'var(--color-success)' : (isApplying ? 'var(--text-muted)' : 'white'),
                          borderRadius: '9999px'
                        }}
                        disabled={isApplied || isApplying || applyingJobId !== null}
                        onClick={() => handleApplyClick(job)}
                      >
                        {isApplying ? "Applying..." : (isApplied ? "Applied ✓" : "Auto-Apply")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Interactive Verification Modal */}
      {activeModalJob && (() => {
        const currentJob = jobs.find(j => j.id === activeModalJob.id) || activeModalJob;
        const hasResume = uploadedFileName !== null;
        const score = currentJob.matchPercent;
        const matchedSkills = currentJob.matched || [];
        const missingSkills = currentJob.missing || [];
        const isApplied = currentJob.applied || false;

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <div className="glass-card" style={{
              width: '90%',
              maxWidth: '600px',
              padding: '30px',
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              color: 'var(--text-main)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              {/* Close Button */}
              <button 
                onClick={() => {
                  if (modalApplyingState !== 'applying') {
                    setActiveModalJob(null);
                    setModalApplyingState('idle');
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#f5f5f7',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'var(--transition-fast)'
                }}
                disabled={modalApplyingState === 'applying'}
              >
                &times;
              </button>

              {/* Modal Header */}
              <div style={{ marginBottom: '24px' }}>
                <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
                  {isLoggedIn ? `${currentJob.source} Channel` : 'Authentication Required'}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: '1.2' }}>
                  {currentJob.title}
                </h2>
                <p style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem', marginTop: '4px' }}>
                  {currentJob.company} &bull; <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>{currentJob.location}</span>
                </p>
              </div>

              {/* STEP A: Authentication Gate inside Modal (if not logged in) */}
              {!isLoggedIn ? (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                    Please sign in or create an account to activate the AI agent, analyze your resume, and auto-apply for this role.
                  </p>

                  {/* Auth Switch Tabs */}
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
                    <button 
                      style={{ flex: 1, background: modalAuthMode === 'signin' ? 'var(--color-primary)' : 'none', border: 'none', borderRadius: '6px', color: modalAuthMode === 'signin' ? 'white' : 'var(--text-muted)', padding: '8px', fontFamily: 'var(--font-sans)', fontWeight: '500', cursor: 'pointer' }}
                      onClick={() => setModalAuthMode('signin')}
                    >
                      Sign In
                    </button>
                    <button 
                      style={{ flex: 1, background: modalAuthMode === 'signup' ? 'var(--color-primary)' : 'none', border: 'none', borderRadius: '6px', color: modalAuthMode === 'signup' ? 'white' : 'var(--text-muted)', padding: '8px', fontFamily: 'var(--font-sans)', fontWeight: '500', cursor: 'pointer' }}
                      onClick={() => setModalAuthMode('signup')}
                    >
                      Sign Up
                    </button>
                  </div>

                  <form onSubmit={handleModalAuthSubmit} className="profile-form">
                    {modalAuthMode === 'signup' && (
                      <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" className="input-field" placeholder="John Doe" required value={authName} onChange={(e) => setAuthName(e.target.value)} />
                      </div>
                    )}
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" className="input-field" placeholder="you@example.com" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input type="password" className="input-field" placeholder="••••••••" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
                    </div>
                    {modalAuthMode === 'signup' && (
                      <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" className="input-field" placeholder="••••••••" required value={authConfirmPassword} onChange={(e) => setAuthConfirmPassword(e.target.value)} />
                      </div>
                    )}

                    <button type="submit" className="glow-btn" disabled={authLoading} style={{ width: '100%', marginTop: '15px', padding: '12px' }}>
                      {authLoading ? "Authenticating..." : (modalAuthMode === 'signup' ? "Create Account" : "Access Portal")}
                    </button>
                  </form>

                  {/* Mock Social Bypass */}
                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justify: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-dark)', marginBottom: '12px' }}>
                      <div style={{ height: '1px', background: 'var(--border-glass)', flexGrow: 1 }}></div>
                      <span>OR BYPASS WITH</span>
                      <div style={{ height: '1px', background: 'var(--border-glass)', flexGrow: 1 }}></div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="glow-btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} onClick={() => handleModalSocialLogin("Google User", "google-demo@gmail.com")}>Google</button>
                      <button className="glow-btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} onClick={() => handleModalSocialLogin("LinkedIn User", "linkedin-demo@gmail.com")}>LinkedIn</button>
                    </div>
                  </div>
                </div>
              ) : (
                /* STEP B: Authenticated Flow (Resume Upload & Match check) */
                <div>
                  {modalApplyingState === 'idle' && (
                    <div>
                      {/* Step 1: Upload / Tailor Resume Uploader */}
                      <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>
                          {hasResume ? "Tailor Your Resume (Optional)" : "1. Upload Resume"}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                          {hasResume 
                            ? "We found a parsed resume on file. You can drop a tailored resume to override it specifically for this role."
                            : "Before the agent can match requirements and apply, please upload your resume."}
                        </p>

                        <div 
                          onDragEnter={handleModalDrag} 
                          onDragOver={handleModalDrag} 
                          onDragLeave={handleModalDrag} 
                          onDrop={handleModalDrop}
                          onClick={() => document.getElementById('modal-resume-file-input').click()}
                          className={`dropzone ${modalDragActive ? 'drag-active' : ''}`}
                          style={{ padding: '24px 15px', background: '#f5f5f7', border: '1.5px dashed #d2d2d7', borderRadius: '16px', textAlign: 'center', cursor: 'pointer' }}
                        >
                          <input 
                            id="modal-resume-file-input"
                            type="file" 
                            accept=".pdf,.txt"
                            style={{ display: 'none' }}
                            onChange={handleModalFileChange}
                            disabled={modalUploading}
                          />
                          {uploadedFileName ? (
                            <>
                              <span style={{ fontSize: '2.5rem' }}>✅</span>
                              <p style={{ fontWeight: '700', fontSize: '0.95rem', marginTop: '6px', color: 'var(--color-success)' }}>
                                Resume uploaded successfully!
                              </p>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                File: {uploadedFileName}
                              </p>
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: '2rem' }}>📁</span>
                              <p style={{ fontWeight: '600', fontSize: '0.9rem', marginTop: '6px' }}>
                                {modalUploading ? "Analyzing Document..." : "Click to select or drop resume file"}
                              </p>
                            </>
                          )}
                          {modalUploading && (
                            <div style={{ width: '80%', background: 'rgba(0,0,0,0.05)', height: '6px', borderRadius: '3px', marginTop: '10px', margin: '10px auto 0 auto', overflow: 'hidden' }}>
                              <div style={{ width: `${modalProgress}%`, background: 'var(--color-primary)', height: '100%', transition: 'width 0.2s ease' }}></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 2: Compatibility Matching Check */}
                      {hasResume && (
                        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                          <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>
                            2. Compatibility & Skill Matching Report
                          </h3>

                          {/* Matching KPI Score */}
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#fafafa', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
                            <div style={{
                              width: '72px',
                              height: '72px',
                              borderRadius: '50%',
                              background: `conic-gradient(${score >= 70 ? 'var(--color-success)' : 'var(--color-warning)'} ${score}%, #e5e5ea ${score}% 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '1.15rem'
                            }}>
                              <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {score !== null ? `${score}%` : 'N/A'}
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                                {score >= 80 ? "Highly Compatible Match" : (score >= 60 ? "Moderate Match" : "Requirements Mismatch")}
                              </h4>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                                {score >= 80 
                                  ? "Your skills cover nearly all job requisites. High application success rate."
                                  : "Some requirements are missing. Review key tags below before final apply."}
                              </p>
                            </div>
                          </div>

                          {/* Matched and Missing Skills list */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Matched Skills ({matchedSkills.length})
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                {matchedSkills.length === 0 ? (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None matched</span>
                                ) : (
                                  matchedSkills.map((s, i) => (
                                    <span key={i} className="badge badge-success" style={{ fontSize: '0.75rem' }}>{s}</span>
                                  ))
                                )}
                              </div>
                            </div>

                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: score >= 80 ? 'var(--text-dark)' : 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Missing Requirements ({missingSkills.length})
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                {missingSkills.length === 0 ? (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None missing ✓</span>
                                ) : (
                                  missingSkills.map((s, i) => (
                                    <span key={i} className="badge" style={{ fontSize: '0.75rem', background: 'rgba(255, 59, 48, 0.08)', border: '1px solid rgba(255, 59, 48, 0.15)', color: '#d11a12' }}>{s}</span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Confirm Apply Button */}
                          <button 
                            className="glow-btn"
                            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                            onClick={() => handleModalApplySubmit(currentJob)}
                          >
                            Apply for this Job 🚀
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Auto-Apply States UI */}
                  {modalApplyingState === 'applying' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '16px', animation: 'fadeIn 0.3s ease-out' }}>
                      <div className="spinner"></div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
                        Submitting application to {currentJob.company}...
                      </p>
                    </div>
                  )}

                  {modalApplyingState === 'success' && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out', textAlign: 'center', padding: '20px 0' }}>
                      <span style={{ fontSize: '3rem', marginBottom: '16px', display: 'block' }}>✅</span>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-success)', marginBottom: '8px' }}>
                        Applied for this job!
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                        Thank you for applying to <strong>{currentJob.company}</strong>. Your profile details have been successfully transmitted.
                      </p>
                      <button 
                        className="glow-btn"
                        style={{ width: '100%', padding: '12px' }}
                        onClick={() => {
                          setActiveModalJob(null);
                          setModalApplyingState('idle');
                        }}
                      >
                        Close Report & Return to Queue
                      </button>
                    </div>
                  )}

                  {modalApplyingState === 'error' && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out', textAlign: 'center', padding: '20px 0' }}>
                      <span style={{ fontSize: '3rem', marginBottom: '16px', display: 'block' }}>⚠️</span>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-danger)', marginBottom: '8px' }}>
                        Failed to Apply
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                        The autonomous agent encountered an issue while submitting your application.
                      </p>
                      <button 
                        className="glow-btn btn-secondary"
                        style={{ width: '100%', padding: '12px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        onClick={() => {
                          setActiveModalJob(null);
                          setModalApplyingState('idle');
                          window.location.href = '/';
                        }}
                      >
                        Return to Home
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
