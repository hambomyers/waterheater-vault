-- Add phone + sms_consent to leads table for TCPA-compliant SMS reminders
-- Run: wrangler d1 execute waterheater-vault --file=migrations/0006_leads_sms.sql

ALTER TABLE leads ADD COLUMN phone TEXT;
ALTER TABLE leads ADD COLUMN sms_consent INTEGER NOT NULL DEFAULT 0;
