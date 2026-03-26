-- R2 Storage Upgrade: Update scan_images table for production R2 integration
-- Run: wrangler d1 execute waterheater-vault --file=migrations/0012_r2_upgrade.sql --remote

-- Add new R2-compatible columns
ALTER TABLE scan_images ADD COLUMN r2_key TEXT;
ALTER TABLE scan_images ADD COLUMN image_hash TEXT;  
ALTER TABLE scan_images ADD COLUMN image_preview TEXT;

-- Update file_size to bytes instead of KB and rename for consistency
ALTER TABLE scan_images ADD COLUMN file_size INTEGER;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_scan_images_r2_key ON scan_images(r2_key);
CREATE INDEX IF NOT EXISTS idx_scan_images_hash ON scan_images(image_hash);

-- Note: Keep old columns for backward compatibility during transition
-- image_data can be removed in a future migration once all data is migrated to R2
