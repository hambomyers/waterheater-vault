-- WaterHeaterPlan lead capture schema
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  manufacture_date TEXT,
  age_years INTEGER,
  fuel_type TEXT,
  replacement_cost INTEGER,
  remaining_life_years INTEGER,
  source TEXT NOT NULL DEFAULT 'scan',
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_age ON leads(age_years);
