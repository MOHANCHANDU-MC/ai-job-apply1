import React, { useState, useEffect } from 'react';

// Import components
import AuthPage from './components/AuthPage';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ResumeUpload from './components/ResumeUpload';
import AgentConsole from './components/AgentConsole';
import Mailbox from './components/Mailbox';
import Settings from './components/Settings';

window.API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:5000';

export default function App() {
  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Set default view to 'features' (Landing Page)
  const [activeTab, setActiveTab] = useState('features');
  
  // App States
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [mailbox, setMailbox] = useState([]);
  const [activeLogs, setActiveLogs] = useState([]);
  
  const [stats, setStats] = useState({
    searchedJobs: 0,
    interviewsCount: 0,
    avgMatchRate: 0
  });

  // Target Hunt States (Shared between Left Filters and Right Table)
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [selectedBoards, setSelectedBoards] = useState(['LinkedIn', 'Naukri', 'Company Careers']);
  const [searching, setSearching] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [jobs, setJobs] = useState([]);

  // Config States
  const [geminiKey, setGeminiKey] = useState('');
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: '465',
    secure: 'true',
    email: '',
    password: ''
  });

  // On mount: Load user and config from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('aa_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }

    const savedGeminiKey = localStorage.getItem('aa_gemini_key');
    if (savedGeminiKey) setGeminiKey(savedGeminiKey);

    const savedSmtp = localStorage.getItem('aa_smtp_config');
    if (savedSmtp) {
      try {
        setSmtpConfig(JSON.parse(savedSmtp));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync profile, applications, mailbox from backend when user changes
  useEffect(() => {
    if (!user || !user.id) {
      setProfile(null);
      setApplications([]);
      setMailbox([]);
      return;
    }

    const syncBackendData = async () => {
      try {
        const headers = { 'x-user-id': user.id };

        const profileResponse = await fetch(`${window.API_BASE_URL}/api/profile`, { headers });
        const profileData = await profileResponse.json();
        if (profileResponse.ok && profileData.skills) {
          setProfile(profileData);
          if (profileData.smtpConfig) {
            setSmtpConfig(profileData.smtpConfig);
            localStorage.setItem('aa_smtp_config', JSON.stringify(profileData.smtpConfig));
          }
        } else {
          // If no profile yet structured, set default fields using user details
          setProfile({
            name: user.name,
            email: user.email,
            phone: '',
            linkedin: '',
            portfolio: '',
            summary: 'Professional applicant looking for job match opportunities.',
            skills: [],
            experience: []
          });
        }

        const appsResponse = await fetch(`${window.API_BASE_URL}/api/applications`, { headers });
        const appsData = await appsResponse.json();
        if (appsResponse.ok) {
          setApplications(appsData);
        }

        const mailResponse = await fetch(`${window.API_BASE_URL}/api/mailbox`, { headers });
        const mailData = await mailResponse.json();
        if (mailResponse.ok) {
          setMailbox(mailData);
        }
      } catch (error) {
        console.log("Sync error on user update:", error);
      }
    };

    syncBackendData();
  }, [user]);

  const fetchJobs = async () => {
    try {
      const headers = {};
      if (user && user.id) {
        headers['x-user-id'] = user.id;
      }
      const response = await fetch(`${window.API_BASE_URL}/api/jobs`, { headers });
      const data = await response.json();
      if (response.ok) {
        setJobs(data);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  // Fetch pre-populated jobs when user or profile updates
  useEffect(() => {
    fetchJobs();
  }, [user, profile]);

  // Update interview counters
  useEffect(() => {
    const interviews = mailbox.filter(m => m.status === 'shortlist').length;
    setStats(prev => ({
      ...prev,
      interviewsCount: interviews
    }));
  }, [mailbox]);

  // Handle successful login
  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('aa_user', JSON.stringify(userData));
    
    // Auto-populate the parsed resume details with login details if profile is empty
    setProfile(prev => {
      const currentProfile = prev || { skills: [], experience: [] };
      return {
        ...currentProfile,
        name: userData.name,
        email: userData.email
      };
    });
    
    setActiveTab('apply');
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setShowUserDropdown(false);
    localStorage.removeItem('aa_user');
    setActiveTab('features');
  };

  const handleGeminiKeyChange = (key) => {
    setGeminiKey(key);
    localStorage.setItem('aa_gemini_key', key);
  };

  const handleSmtpChange = async (config) => {
    setSmtpConfig(config);
    localStorage.setItem('aa_smtp_config', JSON.stringify(config));
    
    if (user && user.id) {
      try {
        const updatedProfile = {
          ...profile,
          smtpConfig: config
        };
        setProfile(updatedProfile);
        
        await fetch(`${window.API_BASE_URL}/api/profile`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user.id
          },
          body: JSON.stringify(updatedProfile)
        });
      } catch (e) {
        console.error("Failed to sync SMTP to backend profile", e);
      }
    }
  };

  // Toggle job boards checkmark list
  const handleBoardCheckbox = (board) => {
    setSelectedBoards(prev => 
      prev.includes(board) ? prev.filter(b => b !== board) : [...prev, board]
    );
  };

  // Search & Match Jobs Express API Call
  const handleSearch = async () => {
    if (!profile || !profile.skills) {
      alert("Please upload your resume on the left first before starting the agent scan!");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/jobs/search`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          keywords,
          location,
          boards: selectedBoards
        })
      });

      const data = await response.json();
      if (response.ok) {
        setJobs(data);
        setStats(prev => ({
          ...prev,
          searchedJobs: prev.searchedJobs + data.length,
          avgMatchRate: data.length > 0 ? Math.round(data.reduce((acc, cur) => acc + cur.matchPercent, 0) / data.length) : 0
        }));
        
        setActiveLogs(prev => [
          { time: new Date().toLocaleTimeString(), text: `Scan complete. Found ${data.length} matched listings.` },
          ...prev
        ]);
      } else {
        alert(data.error || "Search crawl failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to backend server. Make sure it is running.");
    } finally {
      setSearching(false);
    }
  };

  const handleApplySuccess = (job, application) => {
    // Mark applied locally in queue
    setJobs(prevJobs => 
      prevJobs.map(j => j.id === job.id ? { ...j, applied: true } : j)
    );

    // Add application entry to list
    setApplications(prevApps => {
      if (prevApps.some(a => a.jobId === job.id)) return prevApps;
      return [...prevApps, application];
    });

    // Add dashboard activity log
    setActiveLogs(prev => [
      { time: new Date().toLocaleTimeString(), text: `Applied successfully to ${job.title} at ${job.company}.` },
      ...prev
    ]);
  };

  // Auto-Apply Express API Call (immediate response execution)
  const handleApply = async (job) => {
    if (applyingJobId) return;
    setApplyingJobId(job.id);

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/jobs/apply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          jobId: job.id,
          smtpConfig
        })
      });

      const data = await response.json();
      if (response.ok) {
        handleApplySuccess(job, data.application);
      } else {
        alert("Failed to apply: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("Connection failure during apply process.");
    } finally {
      setApplyingJobId(null);
    }
  };

  // Apply to all match percentage >= 75% sequentially
  const handleApplyAll = async () => {
    const qualifiedJobs = jobs.filter(j => j.matchPercent >= 75 && !j.applied);
    if (qualifiedJobs.length === 0) {
      alert("No qualified pending jobs found (Match Score >= 75%).");
      return;
    }

    for (let i = 0; i < qualifiedJobs.length; i++) {
      const job = qualifiedJobs[i];
      await handleApply(job);
    }
  };

  const handleUpdateApplicationStatus = async (jobId, newStatus) => {
    if (!user || !user.id) return;
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/applications/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ jobId, status: newStatus })
      });
      const data = await response.json();
      if (response.ok) {
        setApplications(prev => 
          prev.map(app => app.jobId === jobId ? { ...app, status: newStatus } : app)
        );
      } else {
        alert("Failed to update application status: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to update application status:", error);
    }
  };

  return (
    <div className="main-wrapper">
      {/* Sleek Top Navigation Bar */}
      <header className="top-navbar">
        <div className="nav-container">
          <div className="nav-brand" onClick={() => setActiveTab('features')}>
            <span className="brand-logo"></span>
            <span className="brand-name">AI AutoApply</span>
          </div>

          <nav className="nav-menu">
            <button 
              className={`nav-link-btn ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
            <button 
              className={`nav-link-btn ${activeTab === 'apply' ? 'active' : ''}`}
              onClick={() => setActiveTab('apply')}
            >
              Auto Apply for Jobs
            </button>
            <button 
              className={`nav-link-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab(isLoggedIn ? 'dashboard' : 'auth')}
            >
              Dashboard
            </button>
             <button 
              className={`nav-link-btn ${activeTab === 'mailbox' ? 'active' : ''}`}
              onClick={() => setActiveTab(isLoggedIn ? 'mailbox' : 'auth')}
            >
              Inbox <span className="inbox-count-badge">{mailbox.length}</span>
            </button>
          </nav>

          {/* User Account Avatar / Sign In CTA */}
          <div className="nav-actions" style={{ position: 'relative' }}>
            {isLoggedIn ? (
              <>
                <button 
                  className="profile-avatar-btn"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))',
                    border: 'none',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: 'white',
                    fontWeight: '800',
                    fontFamily: 'var(--font-display)',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(79, 70, 229, 0.3)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </button>

                {showUserDropdown && (
                  <div className="glass-card" style={{
                    position: 'absolute',
                    top: '48px',
                    right: '0',
                    width: '200px',
                    padding: '16px',
                    zIndex: 1100,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                        {user?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.email}
                      </div>
                    </div>
                    
                    <button 
                      className="nav-link-btn" 
                      style={{ padding: '4px 0', width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem' }}
                      onClick={() => { setActiveTab('dashboard'); setShowUserDropdown(false); }}
                    >
                      📊 Dashboard
                    </button>
                    
                    <button 
                      className="glow-btn btn-secondary" 
                      style={{ 
                        width: '100%', 
                        padding: '8px', 
                        fontSize: '0.8rem', 
                        color: 'var(--color-danger)', 
                        borderColor: 'rgba(239, 68, 68, 0.25)',
                        background: 'rgba(239, 68, 68, 0.02)'
                      }}
                      onClick={handleLogout}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button className="glow-btn navbar-cta" onClick={() => setActiveTab('auth')}>
                Sign In 🔑
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Work Container */}
      <main className="content-container">
        {activeTab === 'features' && (
          <LandingPage onEnterApp={() => setActiveTab(isLoggedIn ? 'apply' : 'auth')} />
        )}
        
        {activeTab === 'auth' && (
          <AuthPage onLogin={handleLogin} />
        )}
        
        {activeTab === 'apply' && (
          <div className="apply-workspace-grid tab-content">
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontSize: '2.2rem' }}>Job Apply Command Station</h1>
              <p style={{ color: 'var(--text-muted)' }}>Explore postings from top startups and MNCs, view compatibility reports, and apply automatically.</p>
            </div>
            <div className="apply-full-layout">
              <AgentConsole 
                profile={profile} 
                jobs={jobs}
                applyingJobId={applyingJobId}
                handleApply={handleApply}
                handleApplyAll={handleApplyAll}
                onProfileUpdate={setProfile}
                isLoggedIn={isLoggedIn}
                onLogin={handleLogin}
                refreshJobs={fetchJobs}
                onApplySuccess={handleApplySuccess}
              />
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats} 
            applications={applications} 
            activeLogs={activeLogs}
            onNavigate={setActiveTab}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
          />
        )}

        {activeTab === 'mailbox' && (
          <Mailbox 
            mailbox={mailbox} 
            onMailboxUpdate={setMailbox} 
            userId={user?.id}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            smtpConfig={smtpConfig} 
            onSmtpConfigUpdate={handleSmtpChange} 
            geminiKey={geminiKey} 
            onGeminiKeyUpdate={handleGeminiKeyChange}
          />
        )}
      </main>
    </div>
  );
}
