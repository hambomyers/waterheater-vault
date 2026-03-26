-- Add last_reminded_at to leads for quarterly reminder deduplication
-- Run: wrangler d1 execute waterheater-vault --file=migrations/0008_leads_reminder.sql --remote

ALTER TABLE leads ADD COLUMN last_reminded_at TEXT;
