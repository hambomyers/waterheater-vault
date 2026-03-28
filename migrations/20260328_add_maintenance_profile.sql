-- Add maintenance profile to existing scans
ALTER TABLE scan_results 
  ADD COLUMN maintenance_profile JSON DEFAULT '{}';

ALTER TABLE scan_results 
  ADD COLUMN checklist_items JSON DEFAULT '[]';
