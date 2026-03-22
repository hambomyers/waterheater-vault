-- WaterHeaterVault: pro_claims — plumbers who claimed a unit via homeowner invite (free tier)
-- Run: wrangler d1 execute waterheater-vault --file=migrations/0005_pro_claims.sql

CREATE TABLE IF NOT EXISTS pro_claims (
  id              TEXT PRIMARY KEY,
  business_name   TEXT NOT NULL,
  phone           TEXT NOT NULL,
  zip             TEXT,
  gbp_url         TEXT,
  brand           TEXT,
  model           TEXT,
  age_years       REAL,
  remaining_life_years REAL,
  sms_consent     INTEGER NOT NULL DEFAULT 0,
  ref             TEXT,
  status          TEXT NOT NULL DEFAULT 'claimed',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pro_claims_phone ON pro_claims(phone);
CREATE INDEX IF NOT EXISTS idx_pro_claims_zip   ON pro_claims(zip);
