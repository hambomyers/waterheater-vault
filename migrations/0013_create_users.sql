-- Create users table to satisfy foreign key constraint in scan_images
-- Run: wrangler d1 execute waterheater-vault --file=migrations/0013_create_users.sql --remote

CREATE TABLE IF NOT EXISTS users (
  id      TEXT PRIMARY KEY,
  email   TEXT UNIQUE,
  name    TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);
