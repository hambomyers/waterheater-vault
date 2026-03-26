-- Add columns for storing scan results
-- Run: wrangler d1 execute waterheater-vault --file=migrations/0014_scan_results_columns.sql --remote

ALTER TABLE scan_images ADD COLUMN brand TEXT;
ALTER TABLE scan_images ADD COLUMN model TEXT;
ALTER TABLE scan_images ADD COLUMN manufacture_date TEXT;
ALTER TABLE scan_images ADD COLUMN confidence REAL;
ALTER TABLE scan_images ADD COLUMN processed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_scan_images_brand ON scan_images(brand);
CREATE INDEX IF NOT EXISTS idx_scan_images_serial ON scan_images(serial_number);
CREATE INDEX IF NOT EXISTS idx_scan_images_processed ON scan_images(processed_at);
