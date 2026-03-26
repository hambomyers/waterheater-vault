-- WaterHeaterVault: scan event telemetry for pro dashboard
-- Run: wrangler d1 execute waterheater-vault --file=migrations/0004_scan_events.sql

CREATE TABLE IF NOT EXISTS scan_events (
  id          TEXT PRIMARY KEY,
  zip         TEXT,
  brand       TEXT,
  age_years   INTEGER,
  fuel_type   TEXT,
  remaining_life_years INTEGER,
  scanned_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scan_events_zip ON scan_events(zip);
CREATE INDEX IF NOT EXISTS idx_scan_events_scanned_at ON scan_events(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scan_events_zip_date ON scan_events(zip, scanned_at);
