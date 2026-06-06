import React from 'react';

export default function Dashboard({ stats, applications, activeLogs, onNavigate, onUpdateApplicationStatus }) {
  
  // Calculate success rates
  const appliedCount = applications.length;
  const shortlistCount = applications.filter(app => app.status === 'Shortlisted').length;
  const successRate = appliedCount > 0 ? Math.round((shortlistCount / appliedCount) * 100) : 0;

  // Kanban columns definition
  const columns = [
    { id: 'Applied', title: 'Applied', emoji: '📦', color: '#0071e3' },
    { id: 'In Review', title: 'In Review', emoji: '🔍', color: '#ff9500' },
    { id: 'Interviewing', title: 'Interview', emoji: '📞', color: '#af52de' },
    { id: 'Shortlisted', title: 'Offers', emoji: '🏆', color: '#34c759' }
  ];

  // Group applications by their active status
  const groupedApps = {
    'Applied': applications.filter(app => app.status === 'Applied' || !app.status || app.status === 'Rejected'),
    'In Review': applications.filter(app => app.status === 'In Review'),
    'Interviewing': applications.filter(app => app.status === 'Interviewing'),
    'Shortlisted': applications.filter(app => app.status === 'Shortlisted')
  };

  return (
    <div className="tab-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem' }}>Agent Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time overview of your autonomous career agent status.</p>
        </div>
        <button className="glow-btn" onClick={() => onNavigate('agent')}>
          Open Hunt Console ⚡
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="features-grid" style={{ marginBottom: '40px' }}>
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>TOTAL SEARCHED JOBS</span>
            <span style={{ fontSize: '1.5rem' }}>🔍</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
            {stats.searchedJobs}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Across 17 platforms</span>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px' }}>Active 🟢</span>
          </div>
          <div style={{ width: '100%', background: 'rgba(0, 113, 227, 0.08)', height: '6px', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(stats.searchedJobs, 100)}%`, background: 'var(--color-primary)', height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>APPLICATIONS SUBMITTED</span>
            <span style={{ fontSize: '1.5rem' }}>🚀</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', color: 'var(--color-success)' }}>
            {appliedCount}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Goal: 20 applications</span>
            <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px' }}>
              {Math.round(Math.min((appliedCount / 20) * 100, 100))}% Goal
            </span>
          </div>
          <div style={{ width: '100%', background: 'rgba(52, 199, 89, 0.08)', height: '6px', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((appliedCount / 20) * 100, 100)}%`, background: 'var(--color-success)', height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>AVG MATCH COMPATIBILITY</span>
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', color: 'var(--color-warning)' }}>
            {stats.avgMatchRate}%
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resume match strength</span>
            <span className={`badge ${stats.avgMatchRate >= 80 ? 'badge-success' : (stats.avgMatchRate >= 50 ? 'badge-warning' : 'badge-danger')}`} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px' }}>
              {stats.avgMatchRate >= 80 ? 'Excellent' : (stats.avgMatchRate >= 50 ? 'Good' : 'Needs Optimization')}
            </span>
          </div>
          <div style={{ width: '100%', background: 'rgba(255, 149, 0, 0.08)', height: '6px', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${stats.avgMatchRate}%`, 
              background: stats.avgMatchRate >= 80 ? 'var(--color-success)' : (stats.avgMatchRate >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'), 
              height: '100%', 
              borderRadius: '3px', 
              transition: 'width 0.5s ease' 
            }}></div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>INTERVIEW OFFERS</span>
            <span style={{ fontSize: '1.5rem' }}>🎉</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', color: '#af52de' }}>
            {stats.interviewsCount}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recruiter responses</span>
            <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(175, 82, 222, 0.1)', color: '#af52de', border: '1px solid rgba(175, 82, 222, 0.2)' }}>
              {stats.interviewsCount > 0 ? 'Shortlisted' : 'No calls yet'}
            </span>
          </div>
          <div style={{ width: '100%', background: 'rgba(175, 82, 222, 0.08)', height: '6px', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(stats.interviewsCount * 20, 100)}%`, background: '#af52de', height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>
      </div>

      {/* Applied Jobs Summary */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Applications Tracker</h3>
        {applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No applications submitted yet. Upload your resume and start applying.
          </div>
        ) : (
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Applied Date</th>
                <th>Apply Channel</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '500' }}>{app.title}</td>
                  <td>{app.company}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(app.appliedAt).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </td>
                  <td>
                    <span className="badge badge-primary">{app.source || 'Direct'}</span>
                  </td>
                  <td>
                    <span className={`badge ${
                      app.status === 'Shortlisted' ? 'badge-success' : 
                      app.status === 'Rejected' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {app.status === 'Shortlisted' ? 'Shortlisted' : 
                       app.status === 'Rejected' ? 'Rejected' : 'Applied'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
