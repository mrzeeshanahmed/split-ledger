-- Migration: 006_create_usage_records
-- Created at: 2025-02-19

-- UP
-- Create usage_records table in tenant_template schema (ADR-001 compliant)
CREATE TABLE IF NOT EXISTS tenant_template.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER DEFAULT 0,
  total_price_cents INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT usage_records_quantity_positive CHECK (quantity >= 0),
  CONSTRAINT usage_records_unit_price_cents_positive CHECK (unit_price_cents >= 0),
  CONSTRAINT usage_records_total_price_cents_positive CHECK (total_price_cents >= 0)
);

-- Create indexes for usage_records table
CREATE INDEX IF NOT EXISTS idx_usage_records_metric ON tenant_template.usage_records(metric);
CREATE INDEX IF NOT EXISTS idx_usage_records_recorded_at ON tenant_template.usage_records(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_records_metric_recorded_at ON tenant_template.usage_records(metric, recorded_at DESC);

-- DOWN
DROP INDEX IF EXISTS idx_usage_records_metric_recorded_at ON tenant_template.usage_records;
DROP INDEX IF EXISTS idx_usage_records_recorded_at ON tenant_template.usage_records;
DROP INDEX IF EXISTS idx_usage_records_metric ON tenant_template.usage_records;
DROP TABLE IF EXISTS tenant_template.usage_records;
