-- WaterHeaterVault Pro: screened contractor directory
-- Run: wrangler d1 execute waterheater-vault --file=migrations/0003_pros.sql

CREATE TABLE IF NOT EXISTS pros (
  id          TEXT PRIMARY KEY,
  businessName TEXT NOT NULL,
  phone       TEXT NOT NULL,
  zip         TEXT NOT NULL,
  gbpUrl      TEXT,
  rating      REAL NOT NULL DEFAULT 0,
  reviewCount INTEGER NOT NULL DEFAULT 0,
  sentiment   TEXT,
  stripeCustomerId TEXT,
  stripeSubscriptionId TEXT,
  active      INTEGER NOT NULL DEFAULT 0,
  lastScreened TEXT,
  createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pros_zip ON pros(zip);
CREATE INDEX IF NOT EXISTS idx_pros_active ON pros(active);
