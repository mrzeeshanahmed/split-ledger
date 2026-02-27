-- Platform Admin & Settings tables (public schema, not tenant-scoped)

CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(email);

CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  encrypted BOOLEAN DEFAULT FALSE,
  description VARCHAR(500),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES platform_admins(id)
);

-- Seed default platform settings
INSERT INTO platform_settings (key, value, encrypted, description) VALUES
  ('platform_name', 'Split-Ledger', FALSE, 'Platform display name'),
  ('platform_fee_percent', '15', FALSE, 'Platform fee percentage (owner share)'),
  ('smtp_host', '', FALSE, 'SMTP server hostname'),
  ('smtp_port', '587', FALSE, 'SMTP server port'),
  ('smtp_user', '', FALSE, 'SMTP username/email'),
  ('smtp_pass', '', TRUE, 'SMTP password (stored encrypted)'),
  ('smtp_from_email', '', FALSE, 'Default sender email address'),
  ('smtp_from_name', 'Split-Ledger', FALSE, 'Default sender display name'),
  ('smtp_secure', 'true', FALSE, 'Use TLS for SMTP connections')
ON CONFLICT (key) DO NOTHING;
