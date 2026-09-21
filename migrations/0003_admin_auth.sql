ALTER TABLE admins ADD COLUMN password_hash TEXT;
ALTER TABLE admins ADD COLUMN password_salt TEXT;
ALTER TABLE admins ADD COLUMN password_iterations INTEGER;
ALTER TABLE admins ADD COLUMN last_login_at TEXT;
ALTER TABLE admins ADD COLUMN updated_at TEXT;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  user_agent TEXT,
  FOREIGN KEY(admin_id) REFERENCES admins(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
