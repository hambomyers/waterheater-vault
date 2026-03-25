--- Scan images: store captured WH photos for verification and audit trail
--- Run: wrangler d1 execute waterheater-vault --file=migrations/0010_scan_images.sql --remote

CREATE TABLE IF NOT EXISTS scan_images (
  id              TEXT PRIMARY KEY,
  user_id         TEXT,                    -- nullable for anonymous scans
  serial_number   TEXT,                    -- link to the WH that was scanned
  image_data      TEXT NOT NULL,           -- base64 encoded JPEG
  thumbnail_data  TEXT,                    -- optional smaller preview (200x200)
  captured_at     TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  file_size_kb    INTEGER,                 -- track storage usage
  width           INTEGER,
  height          INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scan_images_user ON scan_images(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_images_serial ON scan_images(serial_number);
CREATE INDEX IF NOT EXISTS idx_scan_images_captured ON scan_images(captured_at);
