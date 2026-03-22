-- Serial cache: skip Grok Vision on repeat serials — pure API cost control
-- Run: wrangler d1 execute waterheater-vault --file=migrations/0007_serial_cache.sql --remote

CREATE TABLE IF NOT EXISTS serial_cache (
  serial_number   TEXT PRIMARY KEY,
  grok_result_json TEXT NOT NULL,
  brand           TEXT,
  hit_count       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_hit_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_serial_cache_brand ON serial_cache(brand);
