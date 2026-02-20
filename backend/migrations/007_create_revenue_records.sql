-- Migration: 007_create_revenue_records
-- Created at: 2025-02-19

-- UP
-- Create revenue_records table in public schema
-- Financial records need cross-tenant visibility for platform reporting
CREATE TABLE IF NOT EXISTS revenue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  billing_period TEXT NOT NULL,
  charge_type TEXT NOT NULL DEFAULT 'usage' CHECK (charge_type IN ('subscription', 'usage', 'overage', 'adjustment')),
  gross_amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  net_amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_charge_id TEXT,
  stripe_transfer_id TEXT,
  stripe_customer_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT revenue_records_amounts_positive CHECK (
    gross_amount_cents >= 0 AND 
    platform_fee_cents >= 0 AND 
    net_amount_cents >= 0
  ),
  CONSTRAINT revenue_records_platform_fee_check CHECK (
    platform_fee_cents <= gross_amount_cents
  ),
  CONSTRAINT revenue_records_tenant_period_unique UNIQUE (tenant_id, billing_period, charge_type, stripe_charge_id)
);

-- Create indexes for revenue_records table
CREATE INDEX IF NOT EXISTS idx_revenue_records_tenant_id ON revenue_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_records_billing_period ON revenue_records(billing_period);
CREATE INDEX IF NOT EXISTS idx_revenue_records_status ON revenue_records(status);
CREATE INDEX IF NOT EXISTS idx_revenue_records_stripe_charge_id ON revenue_records(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_revenue_records_stripe_transfer_id ON revenue_records(stripe_transfer_id);
CREATE INDEX IF NOT EXISTS idx_revenue_records_created_at ON revenue_records(created_at DESC);

-- Create composite indexes for reporting
CREATE INDEX IF NOT EXISTS idx_revenue_records_tenant_period ON revenue_records(tenant_id, billing_period);
CREATE INDEX IF NOT EXISTS idx_revenue_records_period_status ON revenue_records(billing_period, status);

-- Add foreign key constraint to tenants table
ALTER TABLE revenue_records 
  ADD CONSTRAINT revenue_records_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- DOWN
DROP INDEX IF EXISTS idx_revenue_records_period_status ON revenue_records;
DROP INDEX IF EXISTS idx_revenue_records_tenant_period ON revenue_records;
DROP INDEX IF EXISTS idx_revenue_records_created_at ON revenue_records;
DROP INDEX IF EXISTS idx_revenue_records_stripe_transfer_id ON revenue_records;
DROP INDEX IF EXISTS idx_revenue_records_stripe_charge_id ON revenue_records;
DROP INDEX IF EXISTS idx_revenue_records_status ON revenue_records;
DROP INDEX IF EXISTS idx_revenue_records_billing_period ON revenue_records;
DROP INDEX IF EXISTS idx_revenue_records_tenant_id ON revenue_records;
ALTER TABLE revenue_records DROP CONSTRAINT IF EXISTS revenue_records_tenant_id_fkey;
ALTER TABLE revenue_records DROP CONSTRAINT IF EXISTS revenue_records_tenant_period_unique;
DROP TABLE IF EXISTS revenue_records;
