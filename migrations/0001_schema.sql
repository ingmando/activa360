-- Activa 360 v1.2 Cloud / Cloudflare D1
CREATE TABLE IF NOT EXISTS app_users (
  id INTEGER PRIMARY KEY,
  person_id INTEGER,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  role_name TEXT NOT NULL,
  scope TEXT,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES app_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON app_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON app_sessions(expires_at);

CREATE TABLE IF NOT EXISTS app_records (
  store_name TEXT NOT NULL,
  id INTEGER NOT NULL,
  data TEXT NOT NULL CHECK(json_valid(data)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(store_name,id)
);
CREATE INDEX IF NOT EXISTS idx_records_store ON app_records(store_name);

CREATE TABLE IF NOT EXISTS app_seed_records (
  store_name TEXT NOT NULL,
  id INTEGER NOT NULL,
  data TEXT NOT NULL CHECK(json_valid(data)),
  PRIMARY KEY(store_name,id)
);
CREATE INDEX IF NOT EXISTS idx_seed_store ON app_seed_records(store_name);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
