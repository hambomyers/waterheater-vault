-- Create scan_results table for storing water heater scan results
-- Replaces old scan_images approach with structured results storage

CREATE TABLE IF NOT EXISTS scan_results (
  id TEXT PRIMARY KEY,
  image_id TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  manufacture_date TEXT,
  fuel_type TEXT,
  tank_size_gallons INTEGER,
  age_years INTEGER,
  remaining_life_years INTEGER,
  status TEXT DEFAULT 'Normal',
  warnings TEXT,
  processing_method TEXT,
  confidence INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (image_id) REFERENCES scan_images(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scan_results_image_id ON scan_results(image_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_brand ON scan_results(brand);
CREATE INDEX IF NOT EXISTS idx_scan_results_created_at ON scan_results(created_at);
CREATE INDEX IF NOT EXISTS idx_scan_results_confidence ON scan_results(confidence);
