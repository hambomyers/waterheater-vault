-- Date Format Pattern Learning Table
-- Tracks which date formats each brand commonly uses
-- Helps optimize date parsing and improve accuracy

CREATE TABLE IF NOT EXISTS date_format_patterns (
  brand TEXT NOT NULL,
  date_format TEXT NOT NULL,
  sample_count INTEGER DEFAULT 1,
  last_seen TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (brand, date_format)
);

-- Index for fast lookup of dominant date format by brand
CREATE INDEX IF NOT EXISTS idx_date_format_brand_count 
ON date_format_patterns (brand, sample_count DESC);

-- Index for finding recently used formats
CREATE INDEX IF NOT EXISTS idx_date_format_last_seen 
ON date_format_patterns (last_seen DESC);
