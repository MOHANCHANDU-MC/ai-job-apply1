const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../db.json');

/**
 * Initializes the database file with default tables if not present
 */
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultStructure = {
      users: [],
      profiles: {},
      applications: {},
      mailbox: {}
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultStructure, null, 2), 'utf-8');
    console.log("[Database] Initialized new persistent db.json storage.");
  }
}

/**
 * Reads data from db.json file
 */
function readDb() {
  initDb();
  try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("[Database] Error reading database file:", error);
    return { users: [], profiles: {}, applications: {}, mailbox: {} };
  }
}

/**
 * Writes data back to db.json file
 */
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error("[Database] Error writing database file:", error);
    return false;
  }
}

// ==========================================
// USER DATABASE METHODS
// ==========================================

function findUser(email) {
  const db = readDb();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function createUser(name, email, password) {
  const db = readDb();
  const emailClean = email.toLowerCase().trim();
  
  const existing = db.users.find(u => u.email.toLowerCase() === emailClean);
  if (existing) return null;

  const newUser = {
    id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    email: emailClean,
    password: password // In production, hash passwords using bcrypt
  };

  db.users.push(newUser);
  writeDb(db);
  return newUser;
}

// ==========================================
// PROFILE DATABASE METHODS
// ==========================================

function getProfile(userId) {
  const db = readDb();
  return db.profiles[userId] || null;
}

function saveProfile(userId, profileData) {
  const db = readDb();
  db.profiles[userId] = profileData;
  writeDb(db);
  return profileData;
}

// ==========================================
// APPLICATIONS DATABASE METHODS
// ==========================================

function getApplications(userId) {
  const db = readDb();
  return db.applications[userId] || [];
}

function addApplication(userId, appData) {
  const db = readDb();
  if (!db.applications[userId]) {
    db.applications[userId] = [];
  }
  db.applications[userId].push(appData);
  writeDb(db);
  return db.applications[userId];
}

function updateApplicationStatus(userId, jobId, newStatus) {
  const db = readDb();
  if (db.applications[userId]) {
    const app = db.applications[userId].find(a => a.jobId === jobId);
    if (app) {
      app.status = newStatus;
      writeDb(db);
      return app;
    }
  }
  return null;
}

// ==========================================
// MAILBOX DATABASE METHODS
// ==========================================

function getMailbox(userId) {
  const db = readDb();
  return db.mailbox[userId] || [];
}

function addMail(userId, mailData) {
  const db = readDb();
  if (!db.mailbox[userId]) {
    db.mailbox[userId] = [];
  }
  db.mailbox[userId].unshift(mailData);
  writeDb(db);
  return db.mailbox[userId];
}

module.exports = {
  findUser,
  createUser,
  getProfile,
  saveProfile,
  getApplications,
  addApplication,
  updateApplicationStatus,
  getMailbox,
  addMail
};
