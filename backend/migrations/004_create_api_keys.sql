-- Migration: 004_create_api_keys
-- Created at: 2025-02-19

-- UP
-- Create api_keys table in tenant_template schema
CREATE TABLE IF NOT EXISTS tenant_template.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read']::TEXT[],
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  rate_limit_per_day INTEGER NOT NULL DEFAULT 1000,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT api_keys_name_unique UNIQUE (name),
  CONSTRAINT api_keys_key_prefix_unique UNIQUE (key_prefix),
  CONSTRAINT api_keys_scopes_not_empty CHECK (array_length(scopes, 1) > 0),
  CONSTRAINT api_keys_rate_limits_positive CHECK (rate_limit_per_minute > 0 AND rate_limit_per_day > 0),
  CONSTRAINT api_keys_created_by_fkey FOREIGN KEY (created_by) REFERENCES tenant_template.users(id) ON DELETE RESTRICT
);

-- Create indexes for api_keys table
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON tenant_template.api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON tenant_template.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON tenant_template.api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON tenant_template.api_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON tenant_template.api_keys(expires_at);

-- Create trigger for api_keys updated_at
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON tenant_template.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- DOWN
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON tenant_template.api_keys;
DROP INDEX IF EXISTS idx_api_keys_expires_at ON tenant_template.api_keys;
DROP INDEX IF EXISTS idx_api_keys_created_by ON tenant_template.api_keys;
DROP INDEX IF EXISTS idx_api_keys_is_active ON tenant_template.api_keys;
DROP INDEX IF EXISTS idx_api_keys_key_hash ON tenant_template.api_keys;
DROP INDEX IF EXISTS idx_api_keys_key_prefix ON tenant_template.api_keys;
DROP TABLE IF EXISTS tenant_template.api_keys;
