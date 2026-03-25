--- Image hash cache: avoid re-processing identical photos
--- Run: wrangler d1 execute waterheater-vault --file=migrations/0011_image_cache.sql --remote

CREATE TABLE IF NOT EXISTS image_cache (
  image_hash      TEXT PRIMARY KEY,     -- SHA-256 or perceptual hash of image
  result_json     TEXT NOT NULL,        -- cached extraction result
  hit_count       INTEGER DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  last_hit_at     TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  expires_at      TEXT                  -- optional TTL (30 days)
);

CREATE INDEX IF NOT EXISTS idx_image_cache_expires ON image_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_image_cache_hits ON image_cache(hit_count DESC);
