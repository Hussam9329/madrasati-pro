-- ────────────────────────────────────────────────────────
--  Admin Sessions Table — Revocable JWT Sessions
--
--  Run this migration in Supabase SQL Editor to enable
--  session revocation support. Without this table, sessions
--  will still work but cannot be revoked individually.
-- ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_sessions (
  id       TEXT PRIMARY KEY,
  adminId  TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  jti      TEXT NOT NULL UNIQUE,
  createdAt  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiresAt  TIMESTAMPTZ NOT NULL,
  revokedAt  TIMESTAMPTZ,
  userAgent  TEXT,
  ip         TEXT
);

-- Index for quick revocation lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(adminId);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_jti ON admin_sessions(jti);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_revoked ON admin_sessions(revokedAt) WHERE revokedAt IS NOT NULL;

-- Enable RLS
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on admin_sessions"
  ON admin_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup: delete expired sessions older than 7 days
-- (Run periodically or as a cron job)
-- DELETE FROM admin_sessions WHERE expiresAt < now() - interval '7 days';
