-- Migration: 005_create_api_key_usage
-- Created at: 2025-02-19

-- UP
-- Create api_key_usage table in tenant_template schema
CREATE TABLE IF NOT EXISTS tenant_template.api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT api_key_usage_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES tenant_template.api_keys(id) ON DELETE CASCADE,
  CONSTRAINT api_key_usage_method_valid CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')),
  CONSTRAINT api_key_usage_status_code_valid CHECK (status_code >= 100 AND status_code <= 599),
  CONSTRAINT api_key_usage_response_time_ms_positive CHECK (response_time_ms IS NULL OR response_time_ms >= 0)
);

-- Create indexes for api_key_usage table
CREATE INDEX IF NOT EXISTS idx_api_key_usage_api_key_id ON tenant_template.api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_created_at ON tenant_template.api_key_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_endpoint ON tenant_template.api_key_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_status_code ON tenant_template.api_key_usage(status_code);

-- Create composite index for API key analytics
CREATE INDEX IF NOT EXISTS idx_api_key_usage_api_key_created_at ON tenant_template.api_key_usage(api_key_id, created_at DESC);

-- DOWN
DROP INDEX IF EXISTS idx_api_key_usage_api_key_created_at ON tenant_template.api_key_usage;
DROP INDEX IF EXISTS idx_api_key_usage_status_code ON tenant_template.api_key_usage;
DROP INDEX IF EXISTS idx_api_key_usage_endpoint ON tenant_template.api_key_usage;
DROP INDEX IF EXISTS idx_api_key_usage_created_at ON tenant_template.api_key_usage;
DROP INDEX IF EXISTS idx_api_key_usage_api_key_id ON tenant_template.api_key_usage;
DROP TABLE IF EXISTS tenant_template.api_key_usage;
