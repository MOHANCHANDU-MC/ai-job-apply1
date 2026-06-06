const nodemailer = require('nodemailer');

// Extensive database of mockup jobs representing LinkedIn, Naukri, and Company Career pages
const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'Frontend React Developer',
    company: 'Stripe',
    location: 'Remote',
    source: 'LinkedIn Jobs',
    description: 'We are looking for a Senior React Developer to join our dashboard team. Requirements: 3+ years experience with React, Redux, HTML, CSS, JavaScript, and Tailwind CSS. Experience with TypeScript is a plus.',
    skillsRequired: ['React', 'Redux', 'HTML', 'CSS', 'JavaScript', 'Tailwind', 'TypeScript'],
    url: 'https://stripe.com/careers/frontend-developer'
  },
  {
    id: 'job-2',
    title: 'Backend Node.js Engineer',
    company: 'Canva',
    location: 'Sydney (Hybrid)',
    source: 'Naukri',
    description: 'Canva is seeking a Backend Engineer skilled in Node.js, Express, and PostgreSQL. You will build highly scalable APIs. Experience with Docker, Kubernetes, AWS, and MongoDB is helpful.',
    skillsRequired: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'MongoDB'],
    url: 'https://canva.com/careers/backend-node'
  },
  {
    id: 'job-3',
    title: 'Full Stack JavaScript Engineer',
    company: 'Atlassian',
    location: 'Remote (US/India)',
    source: 'Foundit',
    description: 'Join Atlassian as a Full Stack Engineer! Work on Jira with React, Node.js, Express, AWS, Git, and PostgreSQL. Must understand agile and REST APIs.',
    skillsRequired: ['React', 'Node.js', 'Express', 'AWS', 'Git', 'PostgreSQL', 'Agile', 'REST API'],
    url: 'https://atlassian.com/careers/full-stack-engineer'
  },
  {
    id: 'job-4',
    title: 'Frontend Web Developer Intern',
    company: 'Swiggy',
    location: 'Bengaluru (Startup)',
    source: 'Internshala',
    description: 'Swiggy is seeking engineering interns. Work on micro-frontends using React, JavaScript, HTML, CSS, Git, and responsive web layouts.',
    skillsRequired: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
    url: 'https://careers.swiggy.com/intern'
  },
  {
    id: 'job-5',
    title: 'Fullstack JavaScript Developer',
    company: 'Paytm',
    location: 'Noida (Startup)',
    source: 'Cutshort',
    description: 'Join our wallet team. Build full-stack payment solutions using Node.js, React, Express, MongoDB, Redis, and REST APIs.',
    skillsRequired: ['React', 'Node.js', 'Express', 'MongoDB', 'Redis', 'REST API'],
    url: 'https://careers.paytm.com/fullstack'
  },
  {
    id: 'job-6',
    title: 'Staff Frontend Engineer',
    company: 'Airbnb',
    location: 'Remote',
    source: 'Wellfound',
    description: 'Lead engineering for host matching systems. Requires expert skills in React, TypeScript, GraphQL, Webpack, and clean system architecture.',
    skillsRequired: ['React', 'TypeScript', 'GraphQL', 'Webpack', 'CSS', 'Architecture'],
    url: 'https://careers.airbnb.com/staff-frontend'
  },
  {
    id: 'job-7',
    title: 'Data Platform Engineer',
    company: 'Netflix',
    location: 'Los Gatos (MNC)',
    source: 'Indeed',
    description: 'Netflix data systems are scaling. Seeking engineers with experience in AWS cloud, Terraform, Python scripting, PostgreSQL, and Docker container structures.',
    skillsRequired: ['AWS', 'Terraform', 'Python', 'PostgreSQL', 'Docker'],
    url: 'https://netflix.com/careers/data-engineer'
  },
  {
    id: 'job-8',
    title: 'AI Machine Learning Engineer',
    company: 'OpenAI',
    location: 'San Francisco',
    source: 'Glassdoor',
    description: 'OpenAI is looking for an ML Engineer. Key requirements: Python, PyTorch, TensorFlow, Deep Learning, NLP, LLM development, and Docker.',
    skillsRequired: ['Python', 'PyTorch', 'TensorFlow', 'Deep Learning', 'NLP', 'LLM', 'Docker'],
    url: 'https://openai.com/careers/ml-engineer'
  },
  {
    id: 'job-9',
    title: 'Node.js Developer',
    company: 'Uber',
    location: 'Bengaluru (MNC)',
    source: 'Monster',
    description: 'Uber scaling dispatch systems. Node.js backend developer expert in microservices, Redis caches, MongoDB databases, and high scalability APIs.',
    skillsRequired: ['Node.js', 'Express', 'MongoDB', 'Redis', 'Microservices', 'REST API'],
    url: 'https://careers.uber.com/node-dev'
  },
  {
    id: 'job-10',
    title: 'Mobile Developer (iOS/Android)',
    company: 'Zomato',
    location: 'Gurugram (Startup)',
    source: 'Shine',
    description: 'Develop features for food ordering app. Required: React Native mobile components, JavaScript, Redux state control, iOS Swift, and Android SDK tooling.',
    skillsRequired: ['React Native', 'JavaScript', 'Redux', 'iOS', 'Android'],
    url: 'https://careers.zomato.com/mobile-dev'
  },
  {
    id: 'job-11',
    title: 'Senior DevOps Specialist',
    company: 'Figma',
    location: 'San Francisco',
    source: 'TimesJobs',
    description: 'Manage canvas performance deployments. Skills: Docker container configurations, Kubernetes orchestration, AWS, GCP, Jenkins, and CI/CD automation.',
    skillsRequired: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Jenkins', 'CI/CD'],
    url: 'https://figma.com/careers/devops'
  },
  {
    id: 'job-12',
    title: 'Junior React Engineer',
    company: 'Freshworks',
    location: 'Chennai (Startup)',
    source: 'Freshersworld',
    description: 'Entry level software roles. Requirements: Fundamental skills in React, JavaScript, HTML5, CSS3, Jest testing, and Git version control.',
    skillsRequired: ['React', 'JavaScript', 'HTML', 'CSS', 'Jest', 'Git'],
    url: 'https://careers.freshworks.com/junior'
  },
  {
    id: 'job-13',
    title: 'Python Django Backend Developer',
    company: 'Spotify',
    location: 'Stockholm (Remote)',
    source: 'Remote OK',
    description: 'Build backend pipelines. Required: Python, Django frameworks, PostgreSQL databases, Docker containerization, Redis caches, and REST APIs.',
    skillsRequired: ['Python', 'Django', 'PostgreSQL', 'Docker', 'Redis', 'REST API'],
    url: 'https://spotify.com/careers/python-django'
  },
  {
    id: 'job-14',
    title: 'UI Component Engineer',
    company: 'Slack',
    location: 'San Francisco (Remote)',
    source: 'We Work Remotely',
    description: 'Craft components for communication panels. Requirements: React design systems, TypeScript, HTML, CSS variables, and Webpack modules.',
    skillsRequired: ['React', 'TypeScript', 'HTML', 'CSS', 'Webpack'],
    url: 'https://slack.com/careers/ui-engineer'
  },
  {
    id: 'job-15',
    title: 'Ruby on Rails Engineer',
    company: 'Basecamp',
    location: 'Remote',
    source: 'FlexJobs',
    description: 'Maintain collaboration web services. Requires robust skills in Ruby, Rails framework, PostgreSQL databases, JavaScript, HTML, and CSS layout setups.',
    skillsRequired: ['Ruby', 'Rails', 'PostgreSQL', 'JavaScript', 'HTML', 'CSS'],
    url: 'https://basecamp.com/careers/rails'
  },
  {
    id: 'job-16',
    title: 'Golang Systems Developer',
    company: 'Linear',
    location: 'Remote',
    source: 'Y Combinator Jobs',
    description: 'Linear speed engine optimizations. Requirements: Golang systems code, microservices setups, GraphQL APIs, Redis data management, and PostgreSQL.',
    skillsRequired: ['Go', 'Microservices', 'GraphQL', 'Redis', 'PostgreSQL'],
    url: 'https://linear.app/careers/go'
  },
  {
    id: 'job-17',
    title: 'Cloud Architect & Security Developer',
    company: 'HashiCorp',
    location: 'Remote',
    source: 'Dice',
    description: 'Maintain cloud vault secrets. Required: Go language, AWS, GCP, cloud system architecture, Docker containerization, and REST APIs.',
    skillsRequired: ['Go', 'AWS', 'GCP', 'Architecture', 'Docker', 'REST API'],
    url: 'https://hashicorp.com/careers/security'
  },
  {
    id: 'job-18',
    title: 'Lead Software Architect',
    company: 'Google',
    location: 'Mountain View (MNC)',
    source: 'Google Careers',
    description: 'Google Cloud core team: Lead architect. Systems coding in Go, Python, Docker containers, Kubernetes clusters, GCP architecture, and REST API controls.',
    skillsRequired: ['Go', 'Python', 'Docker', 'Kubernetes', 'GCP', 'REST API'],
    url: 'https://google.com/careers/lead-architect'
  },
  {
    id: 'job-19',
    title: 'Software Engineer II (Cloud)',
    company: 'Microsoft',
    location: 'Redmond (MNC)',
    source: 'Microsoft Careers',
    description: 'Develop azure cloud features. Required: C#, .NET Core frameworks, Azure web services, SQL Server databases, and TypeScript components.',
    skillsRequired: ['C#', '.NET', 'Azure', 'SQL', 'TypeScript'],
    url: 'https://careers.microsoft.com/us/en/job-software-engineer'
  },
  {
    id: 'job-20',
    title: 'Cloud Systems Engineer',
    company: 'Amazon',
    location: 'Seattle (MNC)',
    source: 'Amazon Careers',
    description: 'Build storage endpoints. Required: Java backend systems, AWS computing, Docker container setups, REST API controls, and PostgreSQL databases.',
    skillsRequired: ['Java', 'AWS', 'Docker', 'REST API', 'PostgreSQL'],
    url: 'https://amazon.jobs/systems-engineer'
  },
  {
    id: 'job-21',
    title: 'Systems Analyst & Developer',
    company: 'Infosys',
    location: 'Bengaluru (MNC)',
    source: 'Infosys Careers',
    description: 'Consult client applications. Required: Java backend modules, Spring Boot architectures, Oracle SQL databases, JavaScript, HTML, and CSS layouts.',
    skillsRequired: ['Java', 'Spring Boot', 'SQL', 'JavaScript', 'HTML', 'CSS'],
    url: 'https://infosys.com/careers'
  },
  {
    id: 'job-22',
    title: 'Full Stack Engineer',
    company: 'TCS',
    location: 'Mumbai (MNC)',
    source: 'TCS Careers',
    description: 'Deliver enterprise scale apps. Required: React frontend rendering, Node.js backend controllers, Express, MongoDB databases, Git version systems, and HTML/CSS.',
    skillsRequired: ['React', 'Node.js', 'Express', 'MongoDB', 'Git', 'HTML', 'CSS'],
    url: 'https://tcs.com/careers'
  },
  {
    id: 'job-23',
    title: 'Backend Developer',
    company: 'Wipro',
    location: 'Pune (MNC)',
    source: 'Wipro Careers',
    description: 'Wipro cloud consultancy: Build backend API portals. Required: Python frameworks, Django components, PostgreSQL databases, Docker containers, and REST APIs.',
    skillsRequired: ['Python', 'Django', 'PostgreSQL', 'Docker', 'REST API'],
    url: 'https://wipro.com/careers'
  },
  {
    id: 'job-24',
    title: 'Consultant Developer (Enterprise)',
    company: 'Accenture',
    location: 'Gurugram (MNC)',
    source: 'Accenture Careers',
    description: 'Accenture consulting: Build customer portal backends. Required: Java programming, Node.js scripts, AWS cloud, REST APIs, and Agile workflows.',
    skillsRequired: ['Java', 'Node.js', 'AWS', 'REST API', 'Agile'],
    url: 'https://accenture.com/careers'
  },
  {
    id: 'job-25',
    title: 'UI Specialist & Designer',
    company: 'Capgemini',
    location: 'Hyderabad (MNC)',
    source: 'Capgemini Careers',
    description: 'Capgemini user portal team: Design components. Required: React libraries, JavaScript, HTML5 markup, CSS3 stylesheets, Git systems, and responsive templates.',
    skillsRequired: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
    url: 'https://capgemini.com/careers'
  }
];

/**
 * Searches the mock database based on keywords and location
 */
function searchJobs(keywords, location, boards = []) {
  const keywordClean = (keywords || '').toLowerCase().trim();
  const locationClean = (location || '').toLowerCase().trim();
  
  let jobs = MOCK_JOBS;
  
  if (keywordClean) {
    jobs = jobs.filter(job => 
      job.title.toLowerCase().includes(keywordClean) || 
      job.company.toLowerCase().includes(keywordClean) ||
      job.description.toLowerCase().includes(keywordClean)
    );
  }
  
  if (locationClean) {
    jobs = jobs.filter(job => 
      job.location.toLowerCase().includes(locationClean) || 
      locationClean === 'remote' && job.location.toLowerCase().includes('remote')
    );
  }

  if (boards && boards.length > 0) {
    jobs = jobs.filter(job => boards.includes(job.source));
  }
  
  return jobs;
}

/**
 * Performs skill matching and scores compatibility
 */
function calculateMatch(userSkills, job) {
  const userSkillsLower = userSkills.map(s => s.toLowerCase().trim());
  const matched = [];
  const missing = [];

  job.skillsRequired.forEach(skill => {
    const sLower = skill.toLowerCase().trim();
    // Allow fuzzy sub-matches, e.g. "React" matches "React.js" or "Tailwind" matches "Tailwind CSS"
    const isMatched = userSkillsLower.some(uSkill => 
      uSkill.includes(sLower) || sLower.includes(uSkill)
    );

    if (isMatched) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  const matchPercent = job.skillsRequired.length > 0 
    ? Math.round((matched.length / job.skillsRequired.length) * 100)
    : 0;

  return {
    matchPercent,
    matched,
    missing
  };
}

/**
 * Helper to setup nodemailer transport using user credentials
 */
function createMailTransporter(smtpConfig) {
  if (!smtpConfig || !smtpConfig.email || !smtpConfig.password) {
    return null;
  }
  return nodemailer.createTransport({
    host: smtpConfig.host || 'smtp.gmail.com',
    port: parseInt(smtpConfig.port) || 465,
    secure: smtpConfig.secure !== 'false', // default secure
    auth: {
      user: smtpConfig.email,
      pass: smtpConfig.password
    }
  });
}

/**
 * Sends a job application confirmation email to the user
 */
async function sendApplyConfirmationEmail(job, userProfile, smtpConfig) {
  const transporter = createMailTransporter(smtpConfig);
  if (!transporter) {
    console.log(`[Email Mock] Application Confirmation: Success! Job: ${job.title} at ${job.company} (No SMTP configured)`);
    return false;
  }

  const mailOptions = {
    from: `"AI AutoApply" <${smtpConfig.email}>`,
    to: userProfile.email || smtpConfig.email,
    subject: `✉️ Thank you for applying: ${job.title} at ${job.company}`,
    html: `
      <div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 16px; border: 1px solid #1f2937;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #a78bfa; font-size: 2.2rem; font-weight: 800; margin: 0; letter-spacing: -0.025em;">AI AutoApply</h1>
          <p style="color: #9ca3af; font-size: 0.9rem; margin-top: 5px;">Your Autonomous Career Agent Portal</p>
        </div>
        
        <div style="background-color: #111827; border: 1px solid #374151; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
          <h2 style="color: #ffffff; font-size: 1.5rem; font-weight: 700; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #1f2937; padding-bottom: 10px;">Application Submitted!</h2>
          <p style="color: #d1d5db; font-size: 0.95rem; line-height: 1.6;">
            Dear <strong>${userProfile.name || 'Applicant'}</strong>,
          </p>
          <p style="color: #d1d5db; font-size: 0.95rem; line-height: 1.6;">
            Thank you for applying for the position of <strong>${job.title}</strong> at <strong>${job.company}</strong>. Your autonomous agent has successfully submitted your application.
          </p>
          
          <div style="background-color: #1f2937; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 0.85rem; border: 1px solid #374151;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #9ca3af; padding: 6px 0; width: 35%;">Job Title:</td>
                <td style="color: #ffffff; font-weight: 500;">${job.title}</td>
              </tr>
              <tr>
                <td style="color: #9ca3af; padding: 6px 0;">Company:</td>
                <td style="color: #ffffff; font-weight: 500;">${job.company}</td>
              </tr>
              <tr>
                <td style="color: #9ca3af; padding: 6px 0;">Channel:</td>
                <td style="color: #ffffff;">${job.source}</td>
              </tr>
              <tr>
                <td style="color: #9ca3af; padding: 6px 0;">Applicant Name:</td>
                <td style="color: #ffffff;">${userProfile.name || 'Applicant'}</td>
              </tr>
              <tr>
                <td style="color: #9ca3af; padding: 6px 0;">Contact Email:</td>
                <td style="color: #ffffff;">${userProfile.email || 'N/A'}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #d1d5db; font-size: 0.95rem; line-height: 1.6;">
            Your structured profile details have been transmitted. We will notify you here as the hiring team updates your candidacy status.
          </p>
        </div>
        
        <div style="text-align: center; color: #6b7280; font-size: 0.75rem;">
          <p>This is an official system notification from your AI AutoApply career automation service.</p>
          <p>&copy; 2026 AI AutoApply. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email SMTP] Application Confirmation sent to ${userProfile.email}`);
    return true;
  } catch (error) {
    console.error(`[Email SMTP] Failed to send email confirmation:`, error);
    return false;
  }
}

/**
 * Sends a recruiter response callback email to the user (mock callback)
 */
async function sendRecruiterCallbackEmail(job, userProfile, responseType, smtpConfig) {
  const transporter = createMailTransporter(smtpConfig);
  if (!transporter) {
    return false;
  }

  const isShortlist = responseType === 'shortlist';
  const subject = isShortlist 
    ? `🎉 Interview Request: ${job.company} - ${job.title}`
    : `Update: Application for ${job.title} at ${job.company}`;

  const messageContent = isShortlist
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Invitation to Interview</h2>
        <p>Dear ${userProfile.name},</p>
        <p>Thank you for applying to the <strong>${job.title}</strong> position at <strong>${job.company}</strong>.</p>
        <p>We reviewed your resume and were highly impressed by your skills (especially in ${job.matched ? job.matched.join(', ') : 'your area of expertise'}). We would love to schedule a 30-minute introductory call to discuss your experience.</p>
        <p>Please select a convenient slot in our schedule calendar link: <a href="https://calendly.com/${job.company.toLowerCase()}-hiring" style="color: #6366f1; font-weight: bold;">Schedule Discussion</a></p>
        <br />
        <p>Best regards,</p>
        <p><strong>Recruiting Team</strong><br/>${job.company}</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <p>Dear ${userProfile.name},</p>
        <p>Thank you for your interest in the <strong>${job.title}</strong> position at <strong>${job.company}</strong>.</p>
        <p>We received a large number of applications for this role, and while your background is impressive, we have decided to move forward with other candidates whose profiles align more closely with our current requirements.</p>
        <p>We appreciate the time you invested in applying and wish you the best in your job search.</p>
        <br />
        <p>Sincerely,</p>
        <p><strong>Talent Acquisition</strong><br/>${job.company}</p>
      </div>
    `;

  const mailOptions = {
    from: `"${job.company} Careers" <${smtpConfig.email}>`, // sent via user SMTP for demo
    to: userProfile.email || smtpConfig.email,
    subject: subject,
    html: messageContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email SMTP] Recruiter callback (${responseType}) sent to ${userProfile.email}`);
    return true;
  } catch (error) {
    console.error(`[Email SMTP] Failed to send recruiter callback email:`, error);
    return false;
  }
}

/**
 * Sends a security login notification email to the user
 */
async function sendLoginConfirmationEmail(user, smtpConfig) {
  const transporter = createMailTransporter(smtpConfig);
  if (!transporter) {
    return false;
  }

  const mailOptions = {
    from: `"AI AutoApply" <${smtpConfig.email}>`,
    to: user.email,
    subject: `🔑 Security Alert: Successful Login to AI AutoApply`,
    html: `
      <div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 16px; border: 1px solid #1f2937;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #a78bfa; font-size: 2.2rem; font-weight: 800; margin: 0; letter-spacing: -0.025em;">AI AutoApply</h1>
        </div>
        
        <div style="background-color: #111827; border: 1px solid #374151; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
          <h2 style="color: #ffffff; font-size: 1.5rem; font-weight: 700; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #1f2937; padding-bottom: 10px;">Successful Login</h2>
          <p style="color: #d1d5db; font-size: 0.95rem; line-height: 1.6;">
            Hi <strong>${user.name}</strong>,
          </p>
          <p style="color: #d1d5db; font-size: 0.95rem; line-height: 1.6;">
            This confirms that you have successfully logged into your <strong>AI AutoApply</strong> account.
          </p>
          <div style="background-color: #1f2937; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 0.85rem; border: 1px solid #374151;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #9ca3af; padding: 4px 0; width: 30%;">Account:</td>
                <td style="color: #ffffff; font-weight: 500;">${user.email}</td>
              </tr>
              <tr>
                <td style="color: #9ca3af; padding: 4px 0;">Time:</td>
                <td style="color: #ffffff; font-weight: 500;">${new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td style="color: #9ca3af; padding: 4px 0;">Status:</td>
                <td style="color: #10b981; font-weight: bold;">Authorized</td>
              </tr>
            </table>
          </div>
          <p style="color: #9ca3af; font-size: 0.85rem; margin-top: 20px;">
            If this was not you, please secure your account credentials immediately.
          </p>
        </div>

        <div style="text-align: center; color: #6b7280; font-size: 0.75rem;">
          <p>This is an automated security alert from AI AutoApply.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email SMTP] Login Confirmation sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`[Email SMTP] Failed to send login confirmation email:`, error);
    return false;
  }
}

module.exports = {
  searchJobs,
  calculateMatch,
  sendApplyConfirmationEmail,
  sendRecruiterCallbackEmail,
  sendLoginConfirmationEmail
};
