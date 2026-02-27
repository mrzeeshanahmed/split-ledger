-- 011: Add Stripe Connect columns to tenants table
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tenants_stripe_account_id
  ON tenants(stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;
