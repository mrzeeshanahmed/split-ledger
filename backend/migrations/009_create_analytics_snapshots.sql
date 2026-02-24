-- Migration: 009_create_analytics_snapshots
-- Purpose: Schema for tracking MRR, churn, and tenant growth

CREATE TABLE IF NOT EXISTS mrr_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE NOT NULL UNIQUE,
  total_mrr INTEGER NOT NULL,          -- in cents
  new_mrr INTEGER NOT NULL DEFAULT 0,  -- from new subscriptions
  expansion_mrr INTEGER NOT NULL DEFAULT 0, -- from upgrades
  contraction_mrr INTEGER NOT NULL DEFAULT 0, -- from downgrades
  churned_mrr INTEGER NOT NULL DEFAULT 0,  -- from cancellations
  active_subscriptions INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mrr_snapshots_date ON mrr_snapshots(snapshot_date);

CREATE TABLE IF NOT EXISTS tenant_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'signup', 'upgrade', 'downgrade', 'churn'
  plan_from VARCHAR(20),
  plan_to VARCHAR(20),
  mrr_impact INTEGER DEFAULT 0,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_events_tenant_time ON tenant_events(tenant_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_tenant_events_type_time ON tenant_events(event_type, occurred_at);
