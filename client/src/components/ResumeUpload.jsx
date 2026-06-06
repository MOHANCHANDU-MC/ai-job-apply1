import React, { useState } from 'react';

export default function ResumeUpload({ profile, onProfileUpdate, geminiKey, searchParams, user }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [skillInput, setSkillInput] = useState('');

  const {
    keywords, setKeywords,
    location, setLocation,
    selectedBoards, handleBoardCheckbox,
    onSearch, searching
  } = searchParams || {};

  // Handle Drag Events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle file drop
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file click select
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFile(e.target.files[0]);
    }
  };

  // Perform upload to Express Backend API
  const handleUploadFile = async (file) => {
    setUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('resume', file);

    const progressTimer = setInterval(() => {
      setUploadProgress(prev => (prev < 80 ? prev + 10 : prev));
    }, 200);

    try {
      const headers = {};
      if (geminiKey) {
        headers['x-gemini-key'] = geminiKey;
      }
      if (user && user.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch('http://127.0.0.1:5000/api/resume', {
        method: 'POST',
        headers,
        body: formData
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await response.json();
      if (response.ok) {
        onProfileUpdate(data.profile);
      } else {
        alert(data.error || 'Failed to parse resume');
      }
    } catch (error) {
      clearInterval(progressTimer);
      console.error('Upload error:', error);
      alert('Connection to backend failed. Make sure your server is running.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  // Modify local fields in profile state
  const handleFieldChange = (field, value) => {
    const updatedProfile = { ...profile, [field]: value };
    onProfileUpdate(updatedProfile);
  };

  // Add new skill to tag cloud
  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (newSkill && !profile.skills.some(s => s.toLowerCase() === newSkill.toLowerCase())) {
        const updatedSkills = [...profile.skills, newSkill];
        const updatedProfile = { ...profile, skills: updatedSkills };
        onProfileUpdate(updatedProfile);
        setSkillInput('');
      }
    }
  };

  // Remove skill tag
  const handleRemoveSkill = (skillToRemove) => {
    const updatedSkills = profile.skills.filter(s => s !== skillToRemove);
    const updatedProfile = { ...profile, skills: updatedSkills };
    onProfileUpdate(updatedProfile);
  };

  // Save manual modifications back to backend memory
  const handleSaveProfile = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (user && user.id) {
        headers['x-user-id'] = user.id;
      }
      const response = await fetch('http://127.0.0.1:5000/api/profile', {
        method: 'POST',
        headers,
        body: JSON.stringify(profile)
      });
      if (response.ok) {
        alert('Profile saved successfully!');
      } else {
        alert('Failed to save profile on backend.');
      }
    } catch (error) {
      console.error(error);
      alert('Save failed.');
    }
  };

  const hasProfile = profile && profile.skills;

  return (
    <div className="tab-content">
      <div className="upload-grid" style={{ gridTemplateColumns: '1fr', gap: '20px', marginTop: '10px' }}>
        {/* Upload Dropzone */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ marginBottom: '15px' }}>Upload Resume</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Supports PDF and TXT formats. Max file size: 5MB.
          </p>

          <form 
            onDragEnter={handleDrag} 
            onDragOver={handleDrag} 
            onDragLeave={handleDrag} 
            onDrop={handleDrop}
            onClick={() => document.getElementById('resume-file-input').click()}
            className={`dropzone ${dragActive ? 'drag-active' : ''}`}
            style={{ pointerEvents: uploading ? 'none' : 'auto' }}
          >
            <input 
              id="resume-file-input"
              type="file" 
              accept=".pdf,.txt"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p style={{ fontWeight: '600', marginBottom: '5px' }}>
              {uploading ? "Parsing File..." : "Drag & Drop Resume here"}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {uploading ? `Progress: ${uploadProgress}%` : "or click to browse from files"}
            </p>
            {uploading && (
              <div style={{ 
                width: '80%', 
                background: 'rgba(0,0,0,0.05)', 
                height: '6px', 
                borderRadius: '3px',
                marginTop: '15px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${uploadProgress}%`, 
                  background: 'var(--color-primary)', 
                  height: '100%', 
                  transition: 'width 0.2s ease'
                }}></div>
              </div>
            )}
          </form>
        </div>

        {/* Profile Details (Parsed Output) */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px' }}>Structured Profile Details</h3>
          
          {!hasProfile ? (
            <div style={{ 
              height: '300px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--text-dark)', 
              fontSize: '0.95rem',
              textAlign: 'center' 
            }}>
              No profile structured. Upload your resume on the left to extract details automatically.
            </div>
          ) : (
            <div className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={profile.name || ''} 
                  onChange={(e) => handleFieldChange('name', e.target.value)} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={profile.email || ''} 
                    onChange={(e) => handleFieldChange('email', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={profile.phone || ''} 
                    onChange={(e) => handleFieldChange('phone', e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={profile.linkedin || ''} 
                    onChange={(e) => handleFieldChange('linkedin', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Portfolio / Website</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={profile.portfolio || ''} 
                    onChange={(e) => handleFieldChange('portfolio', e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Professional Bio</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={profile.summary || ''} 
                  onChange={(e) => handleFieldChange('summary', e.target.value)}
                />
              </div>

              {/* Skills Tag Cloud Editor */}
              <div className="form-group">
                <label>Skills Dictionary Tag Cloud</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Type a skill (e.g. React) and press Enter" 
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                  />
                  <button className="glow-btn" style={{ padding: '0 20px' }} onClick={handleAddSkill}>Add</button>
                </div>
                <div className="tag-cloud">
                  {profile.skills.map((skill, idx) => (
                    <div key={idx} className="tag-item">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button className="glow-btn" onClick={handleSaveProfile}>
                  Save Changes 💾
                </button>
              </div>

              {/* Search preferences directly following Save Changes button */}
              {searchParams && (
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '15px', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>AGENT HUNT PREFERENCES</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label>Job Keywords</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. React Developer, Node.js" 
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Location Preference</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Remote, Sydney" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Target Job Channels</label>
                      <div style={{ display: 'flex', gap: '15px', marginTop: '6px', fontSize: '0.8rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <input type="checkbox" checked={selectedBoards.includes('LinkedIn')} onChange={() => handleBoardCheckbox('LinkedIn')} />
                          LinkedIn
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <input type="checkbox" checked={selectedBoards.includes('Naukri')} onChange={() => handleBoardCheckbox('Naukri')} />
                          Naukri
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <input type="checkbox" checked={selectedBoards.includes('Company Careers')} onChange={() => handleBoardCheckbox('Company Careers')} />
                          Careers
                        </label>
                      </div>
                    </div>

                    <button 
                      className="glow-btn pulse-anim" 
                      onClick={onSearch} 
                      disabled={searching}
                      style={{ marginTop: '10px', width: '100%', padding: '12px' }}
                    >
                      {searching ? "Searching..." : "Initiate Agent Hunt ⚡"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
