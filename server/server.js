const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { parseResume } = require('./services/parser');
const { 
  searchJobs, 
  calculateMatch, 
  sendApplyConfirmationEmail,
  sendLoginConfirmationEmail
} = require('./services/agent');

const {
  findUser,
  createUser,
  getProfile,
  saveProfile,
  getApplications,
  addApplication,
  updateApplicationStatus,
  getMailbox,
  addMail
} = require('./services/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so client can connect
app.use(cors());
app.use(express.json());

// Setup multer for uploading PDF/Text resumes
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf|txt)$/)) {
      return cb(new Error('Please upload a PDF or TXT file'));
    }
    cb(undefined, true);
  }
});

// ==========================================
// 1. USER AUTHENTICATION ROUTING
// ==========================================

/**
 * Register new user
 */
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide your name, email, and password.' });
    }

    const newUser = createUser(name, email, password);
    if (!newUser) {
      return res.status(400).json({ error: 'Email address already registered.' });
    }

    // Initialize an empty profile for the new user immediately
    const defaultProfile = {
      name: newUser.name,
      email: newUser.email,
      phone: '',
      linkedin: '',
      portfolio: '',
      summary: 'Professional applicant looking for job match opportunities.',
      skills: [],
      experience: []
    };
    saveProfile(newUser.id, defaultProfile);

    res.json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

/**
 * Log in existing user
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const user = findUser(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    // Check if user has SMTP settings configured in their profile to send a login notification email
    const profile = getProfile(user.id);
    if (profile && profile.smtpConfig && profile.smtpConfig.email && profile.smtpConfig.password) {
      sendLoginConfirmationEmail(user, profile.smtpConfig).catch(err => {
        console.error("Failed to send login confirmation email:", err);
      });
    }

    res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});


// ==========================================
// 2. CANDIDATE PROFILE & RESUME API
// ==========================================

/**
 * Upload & Parse Resume
 */
app.post('/api/resume', upload.single('resume'), async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Session missing' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const geminiApiKey = req.headers['x-gemini-key'] || null;
    
    // Parse the PDF/Txt file buffer
    const parsedData = await parseResume(
      req.file.buffer, 
      req.file.mimetype,
      geminiApiKey
    );

    // Merge parsed details with existing user metadata
    const existingProfile = getProfile(userId) || {};
    const updatedProfile = {
      ...existingProfile,
      ...parsedData,
      // Maintain login details if present
      email: existingProfile.email || parsedData.email,
      name: existingProfile.name || parsedData.name
    };

    saveProfile(userId, updatedProfile);
    res.json({ message: 'Resume parsed successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ error: 'Failed to parse resume: ' + error.message });
  }
});

/**
 * Get active profile
 */
app.get('/api/profile', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }

  const profile = getProfile(userId);
  res.json(profile || { message: 'No profile structured yet' });
});

/**
 * Update profile manually
 */
app.post('/api/profile', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }

  const updatedProfile = saveProfile(userId, req.body);
  res.json({ message: 'Profile updated successfully', profile: updatedProfile });
});


// ==========================================
// 3. JOB HUNTER & AUTO-APPLY AGENT API
// ==========================================

/**
 * Get all pre-populated jobs (Startups and MNCs)
 * If user profile exists, calculate matching details.
 */
app.get('/api/jobs', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || null;
    const jobs = searchJobs('', ''); // returns all MOCK_JOBS
    
    let userProfile = null;
    let userApps = [];
    if (userId) {
      userProfile = getProfile(userId);
      userApps = getApplications(userId);
    }

    const calculatedJobs = jobs.map(job => {
      let matchDetails = { matchPercent: null, matched: [], missing: [] };
      if (userProfile && userProfile.skills && userProfile.skills.length > 0) {
        matchDetails = calculateMatch(userProfile.skills, job);
      }
      const isApplied = userApps.some(app => app.jobId === job.id);
      return {
        ...job,
        ...matchDetails,
        applied: isApplied
      };
    });

    res.json(calculatedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search & Match Jobs
 */
app.post('/api/jobs/search', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Session missing' });
    }

    const { keywords, location, boards } = req.body;
    const profile = getProfile(userId);
    
    if (!profile || !profile.skills || profile.skills.length === 0) {
      return res.status(400).json({ error: 'Please upload a resume first to scan matching jobs' });
    }

    // Get applications list to check applied states
    const userApps = getApplications(userId);

    const matchedJobs = searchJobs(keywords, location, boards).map(job => {
      const matchDetails = calculateMatch(profile.skills, job);
      const isApplied = userApps.some(app => app.jobId === job.id);
      return {
        ...job,
        ...matchDetails,
        applied: isApplied
      };
    });

    // Sort by match percentage descending
    matchedJobs.sort((a, b) => b.matchPercent - a.matchPercent);

    res.json(matchedJobs);
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Auto-Apply to Job
 */
app.post('/api/jobs/apply', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Session missing' });
    }

    const { jobId, smtpConfig } = req.body;
    const profile = getProfile(userId);
    
    if (!profile) {
      return res.status(400).json({ error: 'No user profile loaded' });
    }

    // Fallback to SMTP config stored in database if frontend passes empty config
    let activeSmtpConfig = smtpConfig;
    if (!activeSmtpConfig || !activeSmtpConfig.email || !activeSmtpConfig.password) {
      if (profile.smtpConfig) {
        activeSmtpConfig = profile.smtpConfig;
      }
    }

    // Find job details
    const jobs = searchJobs('', '');
    const job = jobs.find(j => j.id === jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already applied in database
    const userApps = getApplications(userId);
    const alreadyApplied = userApps.some(app => app.jobId === jobId);
    if (alreadyApplied) {
      return res.status(400).json({ error: 'Already applied for this job' });
    }

    // Calculate match info for email context
    const matchInfo = calculateMatch(profile.skills, job);
    const jobWithMatch = { ...job, ...matchInfo };

    // Record application status in database
    const newApp = {
      jobId: job.id,
      title: job.title,
      company: job.company,
      appliedAt: new Date().toISOString(),
      status: 'Applied',
      source: job.source
    };
    addApplication(userId, newApp);

    // Send the confirmation email from the website application to the user!
    let emailSent = false;
    if (activeSmtpConfig && activeSmtpConfig.email) {
      emailSent = await sendApplyConfirmationEmail(jobWithMatch, profile, activeSmtpConfig);
    }

    // Pre-create simulated logs for visual feedback
    const applyLogs = [
      `[INIT] Booting Agent apply protocol for ${job.title} at ${job.company}...`,
      `[AUTH] Loading candidate resume and profile details...`,
      `[DISPATCH] Navigating to career endpoint: ${job.url}`,
      `[SCRAPING] Inspecting form fields and selectors...`,
      `[FILL] Inputting full name: "${profile.name}"`,
      `[FILL] Inputting contact details: Email "${profile.email || 'N/A'}", Phone "${profile.phone || 'N/A'}"`,
      `[FILL] Adding social links: ${profile.linkedin || 'No LinkedIn provided'}`,
      `[UPLOAD] Attaching parsed resume file...`,
      `[SKILLS] Populating core tags: ${profile.skills.slice(0, 5).join(', ')}`,
      `[SUBMIT] Bypassing anti-bot checks and submitting form...`,
      `[SUCCESS] Application successfully submitted to ${job.company}!`,
      emailSent 
        ? `[EMAIL] Confirmation email sent successfully to ${profile.email || smtpConfig.email}!` 
        : `[EMAIL] Confirmation alert registered (SMTP settings not fully configured - sent simulated notification).`
    ];

    // Create AI AutoApply confirmation email for the In-App Mailbox
    const confirmationEmail = {
      id: `email-${Date.now()}`,
      from: `AI AutoApply <notifications@aiautoapply.com>`,
      to: profile.email || 'user@example.com',
      subject: `✉️ Thank you for applying: ${job.title} at ${job.company}`,
      receivedAt: new Date().toISOString(),
      body: `Hi ${profile.name || 'Applicant'},\n\nThank you for applying for the position of ${job.title} at ${job.company}.\n\nThis confirms that your job application has been successfully submitted via the AI AutoApply portal. We have parsed your resume and structured profile details and successfully transmitted them to the candidate portal for ${job.company}.\n\nApplication Details:\n- Applicant: ${profile.name || 'Applicant'}\n- Job Title: ${job.title}\n- Company: ${job.company}\n- Channel: ${job.source}\n- Timestamp: ${new Date().toLocaleString()}\n\nWe will notify you here as the hiring team processes your candidacy.\n\nBest regards,\nAI AutoApply Team`,
      jobTitle: job.title,
      company: job.company,
      status: 'confirmed'
    };

    // Save mail notification to user's database inbox
    addMail(userId, confirmationEmail);
    console.log(`[Database] Saved application confirmation to mailbox for user: ${userId}`);

    res.json({
      message: 'Application submission completed',
      logs: applyLogs,
      application: newApp,
      responseDelaySeconds: 0
    });

  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Applications List
 */
app.get('/api/applications', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }

  const userApps = getApplications(userId);
  res.json(userApps);
});

/**
 * Update Application Status
 */
app.post('/api/applications/status', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }

  const { jobId, status } = req.body;
  if (!jobId || !status) {
    return res.status(400).json({ error: 'Missing jobId or status' });
  }

  const updated = updateApplicationStatus(userId, jobId, status);
  if (updated) {
    res.json({ message: 'Application status updated successfully', application: updated });
  } else {
    res.status(404).json({ error: 'Application not found' });
  }
});

/**
 * Get Mailbox (Incoming Recruiter Emails)
 */
app.get('/api/mailbox', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }

  const userMail = getMailbox(userId);
  res.json(userMail);
});

// ==========================================
// 4. SMTP SETTINGS UTILITY
// ==========================================

/**
 * Test SMTP Settings
 */
app.post('/api/settings/test-smtp', async (req, res) => {
  const { smtpConfig } = req.body;
  if (!smtpConfig || !smtpConfig.email || !smtpConfig.password) {
    return res.status(400).json({ error: 'Please provide complete SMTP settings' });
  }

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host || 'smtp.gmail.com',
    port: parseInt(smtpConfig.port) || 465,
    secure: smtpConfig.secure !== 'false',
    auth: {
      user: smtpConfig.email,
      pass: smtpConfig.password
    }
  });

  const mailOptions = {
    from: `"AI AutoApply" <${smtpConfig.email}>`,
    to: smtpConfig.email,
    subject: "Welcome to AI AutoApply — here's how to get started 🚀",
    html: `
      <div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 16px; border: 1px solid #1f2937;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #a78bfa; font-size: 2.2rem; font-weight: 800; margin: 0; letter-spacing: -0.025em;">AI AutoApply</h1>
          <p style="color: #9ca3af; font-size: 0.9rem; margin-top: 5px;">Your Autonomous Career Agent Portal</p>
        </div>
        
        <div style="background-color: #111827; border: 1px solid #374151; border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
          <h2 style="color: #ffffff; font-size: 1.8rem; font-weight: 700; margin-top: 0; margin-bottom: 10px;">Welcome aboard! 🎉</h2>
          <p style="color: #d1d5db; font-size: 1rem; line-height: 1.6; max-width: 400px; margin: 0 auto 20px auto;">
            Your account is ready. Here's everything you can do with AI AutoApply — all free to start.
          </p>
          <div style="height: 1px; background-color: #1f2937; margin: 20px 0;"></div>
          
          <div style="text-align: left; margin-top: 20px;">
            <div style="background-color: #1f2937; padding: 15px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 12px;">
              <span style="font-size: 1.2rem; margin-right: 8px;">📄</span>
              <strong style="color: #ffffff; font-size: 0.95rem;">Resume Match Score</strong>
              <p style="color: #9ca3af; font-size: 0.85rem; margin: 5px 0 0 0;">Upload your resume and get an instant AI compatibility score for any job listing.</p>
            </div>
            <div style="background-color: #1f2937; padding: 15px; border-radius: 8px; border: 1px solid #374151;">
              <span style="font-size: 1.2rem; margin-right: 8px;">🔍</span>
              <strong style="color: #ffffff; font-size: 0.95rem;">Automated Job Search</strong>
              <p style="color: #9ca3af; font-size: 0.85rem; margin: 5px 0 0 0;">Scan multiple career channels (LinkedIn, Naukri, Company Portals) simultaneously.</p>
            </div>
          </div>
        </div>

        <div style="text-align: center; color: #6b7280; font-size: 0.75rem;">
          <p>This is a confirmation email for verification of your SMTP connection to AI AutoApply.</p>
          <p>&copy; 2026 AI AutoApply. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Test email sent successfully! Please check your inbox.' });
  } catch (error) {
    console.error('SMTP test failed:', error);
    res.status(500).json({ error: 'SMTP connection failed: ' + error.message });
  }
});

/**
 * Start Server
 */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
