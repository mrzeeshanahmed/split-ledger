-- Migration: 008_create_webhooks
-- Created at: 2026-02-21

-- UP
-- Create webhooks table in tenant_template schema
CREATE TABLE IF NOT EXISTS tenant_template.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url VARCHAR(2048) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  description VARCHAR(255),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT webhooks_url_not_empty CHECK (char_length(url) > 0),
  CONSTRAINT webhooks_secret_not_empty CHECK (char_length(secret) > 0),
  CONSTRAINT webhooks_created_by_fkey FOREIGN KEY (created_by) REFERENCES tenant_template.users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON tenant_template.webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_by ON tenant_template.webhooks(created_by);

CREATE TRIGGER update_webhooks_updated_at
    BEFORE UPDATE ON tenant_template.webhooks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create webhook_deliveries table in tenant_template schema
CREATE TABLE IF NOT EXISTS tenant_template.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES tenant_template.webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempt_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  last_response_status INTEGER,
  last_response_body TEXT,
  last_error TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT webhook_deliveries_status_valid CHECK (status IN ('pending', 'success', 'failed', 'dead'))
);

CREATE INDEX IF NOT EXISTS idx_deliveries_webhook_id ON tenant_template.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON tenant_template.webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_next_retry ON tenant_template.webhook_deliveries(next_retry_at) WHERE status = 'pending';

-- DOWN
DROP INDEX IF EXISTS idx_deliveries_next_retry ON tenant_template.webhook_deliveries;
DROP INDEX IF EXISTS idx_deliveries_status ON tenant_template.webhook_deliveries;
DROP INDEX IF EXISTS idx_deliveries_webhook_id ON tenant_template.webhook_deliveries;
DROP TABLE IF EXISTS tenant_template.webhook_deliveries;
DROP TRIGGER IF EXISTS update_webhooks_updated_at ON tenant_template.webhooks;
DROP INDEX IF EXISTS idx_webhooks_created_by ON tenant_template.webhooks;
DROP INDEX IF EXISTS idx_webhooks_is_active ON tenant_template.webhooks;
DROP TABLE IF EXISTS tenant_template.webhooks;
