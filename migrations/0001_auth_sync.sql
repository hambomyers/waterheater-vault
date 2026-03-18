-- WarrantyFile auth + vault sync schema
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS vault_items (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data)),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_updated_at ON vault_items(updated_at);
