const Database = require('better-sqlite3');
const path = require('path');

// Create SQLite database
const db = new Database('./ainspect.db');

// Create users table
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  profile_image_url TEXT,
  role TEXT NOT NULL DEFAULT 'inspector',
  license_number TEXT,
  manager_id TEXT,
  branch_office_id TEXT,
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  invited_by TEXT,
  invited_at DATETIME,
  last_login_at DATETIME,
  tos_accepted_at DATETIME,
  privacy_accepted_at DATETIME,
  opt_in_non_flagged_at DATETIME,
  digital_signature TEXT,
  signature_date DATETIME,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

// Create sessions table
db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expire DATETIME NOT NULL
)
`);

// Create branch_offices table
db.exec(`
CREATE TABLE IF NOT EXISTS branch_offices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

// Create contractors table
db.exec(`
CREATE TABLE IF NOT EXISTS contractors (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  company_name TEXT,
  contact_name TEXT,
  phone TEXT,
  license_number TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

// Create bookings table
db.exec(`
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  inspector_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  property_address TEXT NOT NULL,
  inspection_date DATETIME NOT NULL,
  inspection_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inspector_id) REFERENCES users(id)
)
`);

// Create reports table
db.exec(`
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6)))),
  booking_id TEXT NOT NULL,
  inspector_id TEXT NOT NULL,
  report_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  data TEXT, -- JSON data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (inspector_id) REFERENCES users(id)
)
`);

console.log('Database initialized successfully!');
db.close();
