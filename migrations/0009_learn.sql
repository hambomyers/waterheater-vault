-- serial_patterns: one row per brand, tracks how many serials we've decoded
-- and which date-encoding pattern we used. When sample_count >= 10 and
-- confidence >= 0.9, fast-lookup can decode without calling the LLM.
CREATE TABLE IF NOT EXISTS serial_patterns (
  brand           TEXT PRIMARY KEY,   -- normalized lowercase brand, e.g. 'rheem'
  pattern_type    TEXT NOT NULL,      -- 'WWYY'|'YYWW'|'BWL'|'YYMM'|'YYYYWW'|'LETTER_YY'|'UNKNOWN'
  sample_count    INTEGER DEFAULT 0,  -- total confirmed decode attempts
  correct_count   INTEGER DEFAULT 0,  -- decodes that produced a plausible year (2000-2040)
  confidence      REAL    DEFAULT 0.0,-- correct_count / sample_count
  last_updated    TEXT
);

-- model_catalog: one row per (brand, model_prefix), stores fuel + tank specs
-- discovered from actual scans. Used by fast-lookup to skip LLM for spec fields.
CREATE TABLE IF NOT EXISTS model_catalog (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  brand               TEXT NOT NULL,
  model_prefix        TEXT NOT NULL,  -- first 8 chars of model number, uppercased
  fuel_type           TEXT,           -- 'gas'|'electric'|'tankless-gas'|'tankless-electric'|'heat-pump'
  tank_size_gallons   INTEGER,        -- 30|40|50|75|80 or NULL for tankless
  expected_life_years INTEGER,        -- derived from fuel_type
  sample_count        INTEGER DEFAULT 0,
  last_seen           TEXT,
  UNIQUE(brand, model_prefix)
);
