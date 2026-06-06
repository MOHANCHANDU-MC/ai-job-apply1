const { PDFParse } = require('pdf-parse');

// A large, predefined list of industry-standard tech skills to match against
const SKILLS_DICTIONARY = [
  // Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'nosql', 'r', 'matlab', 'scala', 'perl', 'shell',
  // Frontend
  'react', 'react.js', 'angular', 'vue', 'vue.js', 'next.js', 'nextjs', 'nuxt.js', 'svelte', 'solid.js', 'jquery', 'html', 'html5', 'css', 'css3', 'sass', 'less', 'tailwind', 'tailwindcss', 'bootstrap', 'material-ui', 'mui', 'chakra-ui', 'redux', 'mobx', 'zustand', 'webpack', 'vite', 'parcel',
  // Backend
  'node.js', 'nodejs', 'express', 'express.js', 'nest.js', 'nestjs', 'django', 'flask', 'fastapi', 'spring boot', 'laravel', 'asp.net', 'rails', 'graphql', 'rest api', 'grpc', 'websocket',
  // Database
  'mongodb', 'postgresql', 'postgres', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'mariadb', 'oracle', 'firebase', 'firestore', 'supabase',
  // DevOps & Cloud
  'docker', 'kubernetes', 'k8s', 'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'terraform', 'ansible', 'jenkins', 'github actions', 'gitlab ci', 'ci/cd', 'nginx', 'linux', 'unix',
  // AI & Data Science
  'machine learning', 'deep learning', 'artificial intelligence', 'ai', 'nlp', 'natural language processing', 'computer vision', 'pytorch', 'tensorflow', 'keras', 'scikit-learn', 'pandas', 'numpy', 'opencv', 'llm', 'langchain', 'prompt engineering',
  // Testing & Agile
  'jest', 'mocha', 'cypress', 'selenium', 'playwright', 'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'scrum', 'agile'
];

/**
 * Extracts email address from text using regex
 */
function extractEmail(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : '';
}

/**
 * Extracts phone number from text using regex
 */
function extractPhone(text) {
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : '';
}

/**
 * Extracts URLs (LinkedIn, Portfolio) from text
 */
function extractUrls(text) {
  const linkedinRegex = /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/;
  const portfolioRegex = /(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?!\.com\/in\/|\.com\/company\/)/;
  
  const linkedinMatch = text.match(linkedinRegex);
  const linkedin = linkedinMatch ? linkedinMatch[0] : '';
  
  // Find other potential portfolio links
  const matches = text.match(/(https?:\/\/[^\s]+)/g) || [];
  const portfolioMatches = matches.filter(url => !url.includes('linkedin.com'));
  const portfolio = portfolioMatches.length > 0 ? portfolioMatches[0] : '';

  return { linkedin, portfolio };
}

/**
 * Attempts to extract candidate name (usually top lines)
 */
function extractName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  // Take first non-empty line as name, filtering out headers
  if (lines.length > 0) {
    const candidate = lines[0];
    if (candidate.length < 50 && !candidate.toLowerCase().includes('resume') && !candidate.toLowerCase().includes('curriculum')) {
      return candidate;
    }
  }
  return 'Applicant';
}

/**
 * Normalizes skill string for matching (e.g. "React.js" -> "react")
 */
function normalizeSkill(skill) {
  let s = skill.toLowerCase();
  if (s === 'react.js') return 'react';
  if (s === 'nextjs') return 'next.js';
  if (s === 'tailwindcss') return 'tailwind';
  if (s === 'nodejs') return 'node.js';
  if (s === 'expressjs') return 'express';
  if (s === 'golang') return 'go';
  if (s === 'postgres') return 'postgresql';
  return s;
}

/**
 * Parses text and matches it against our skills dictionary
 */
function extractSkills(text) {
  const textLower = text.toLowerCase();
  const matchedSkills = new Set();

  SKILLS_DICTIONARY.forEach(skill => {
    // Escape regex characters
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Look for exact word boundary match or specific symbols like c++
    let regex;
    if (skill.includes('+') || skill.includes('.')) {
      regex = new RegExp(escaped, 'i');
    } else {
      regex = new RegExp(`\\b${escaped}\\b`, 'i');
    }
    
    if (regex.test(textLower)) {
      matchedSkills.add(normalizeSkill(skill));
    }
  });

  return Array.from(matchedSkills).map(s => {
    // Capitalize nicely
    if (['html', 'css', 'sql', 'nosql', 'api', 'aws', 'gcp', 'nlp', 'ai', 'llm', 'cv', 'ci/cd', 'k8s'].includes(s)) {
      return s.toUpperCase();
    }
    if (s === 'javascript') return 'JavaScript';
    if (s === 'typescript') return 'TypeScript';
    if (s === 'mongodb') return 'MongoDB';
    if (s === 'postgresql') return 'PostgreSQL';
    if (s === 'node.js') return 'Node.js';
    if (s === 'next.js') return 'Next.js';
    if (s === 'react') return 'React';
    if (s === 'vue') return 'Vue';
    if (s === 'angular') return 'Angular';
    if (s === 'github') return 'GitHub';
    // Capitalize first letter of each word
    return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  });
}

/**
 * Fallback AI Parser using the Gemini API if a key is provided
 */
async function parseWithGemini(text, apiKey) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = `
      You are a world-class candidate profiling agent. Parse the following resume text and output a JSON object containing the applicant's profile details.
      Output ONLY valid JSON. Do not include markdown formatting like \`\`\`json or \`\`\`.
      
      JSON format structure:
      {
        "name": "Full Name",
        "email": "Email Address",
        "phone": "Phone Number",
        "linkedin": "LinkedIn URL",
        "portfolio": "Portfolio or Website URL",
        "skills": ["Skill1", "Skill2", ...],
        "summary": "A brief 2-3 sentence profile summary/bio based on experience",
        "experience": [
          {
            "role": "Job Title",
            "company": "Company Name",
            "duration": "e.g. Jan 2022 - Present",
            "description": "Summary of work done"
          }
        ]
      }

      Resume Text:
      ${text}
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!resultText) throw new Error("Empty response from Gemini API");

    // Clean up markdown block format if LLM includes it
    const cleanJson = resultText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini API parsing failed, falling back to local regex parser:", error);
    return null;
  }
}

/**
 * Main parse entry point
 */
async function parseResume(fileBuffer, fileMimetype, apiKey = null) {
  let text = '';
  
  if (fileMimetype === 'application/pdf') {
    const parser = new PDFParse(new Uint8Array(fileBuffer));
    const data = await parser.getText();
    text = data.text;
  } else {
    // Fallback/txt
    text = fileBuffer.toString('utf-8');
  }

  // If Gemini API Key is available, try parsing with AI
  if (apiKey) {
    const aiResult = await parseWithGemini(text, apiKey);
    if (aiResult) return aiResult;
  }

  // Local parser fallback
  const name = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const { linkedin, portfolio } = extractUrls(text);
  const skills = extractSkills(text);

  // Generate a mock summary
  let summary = `Qualified professional with skills in ${skills.slice(0, 4).join(', ')}.`;
  if (skills.length === 0) {
    summary = "Professional applicant looking for job match opportunities.";
  }

  // Guess experience from lines containing numbers/dates
  const experience = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  lines.forEach((line, idx) => {
    if (/(developer|engineer|manager|lead|analyst)/i.test(line) && /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|20\d{2})/i.test(line)) {
      experience.push({
        role: line.split(' at ')[0] || line,
        company: line.split(' at ')[1] || 'Company',
        duration: 'Duration',
        description: lines[idx + 1] || 'Responsible for development and team collaboration.'
      });
    }
  });

  if (experience.length === 0) {
    experience.push({
      role: 'Software Developer',
      company: 'Previous Company',
      duration: '2 Years',
      description: 'Worked on building robust applications, writing clean code, and fixing bugs.'
    });
  }

  return {
    name,
    email,
    phone,
    linkedin,
    portfolio,
    skills,
    summary,
    experience
  };
}

module.exports = {
  parseResume
};
