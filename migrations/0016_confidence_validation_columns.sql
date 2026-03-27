-- Add confidence and validation columns to scan_results table
-- Supports two-stage confidence system: base confidence + Brave validation

ALTER TABLE scan_results ADD COLUMN base_confidence INTEGER;
ALTER TABLE scan_results ADD COLUMN validation_status TEXT DEFAULT 'verifying';
ALTER TABLE scan_results ADD COLUMN validation_score INTEGER;
ALTER TABLE scan_results ADD COLUMN verified_fields TEXT;
ALTER TABLE scan_results ADD COLUMN questionable_fields TEXT;
ALTER TABLE scan_results ADD COLUMN search_query TEXT;
ALTER TABLE scan_results ADD COLUMN search_results TEXT;
ALTER TABLE scan_results ADD COLUMN validation_completed_at TEXT;

-- Index for validation lookups
CREATE INDEX IF NOT EXISTS idx_scan_results_validation 
ON scan_results (validation_status, base_confidence);

-- Index for finding scans that need validation
CREATE INDEX IF NOT EXISTS idx_scan_results_pending_validation 
ON scan_results (validation_status = 'verifying');
