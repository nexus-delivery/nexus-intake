-- CRM booking profiles: reusable defaults owned by customer and merchant company.

CREATE TABLE IF NOT EXISTS merchant_customer_booking_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  merchant_customer_id UUID NOT NULL REFERENCES merchant_customers(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  collection_address_id UUID REFERENCES merchant_customer_addresses(id) ON DELETE SET NULL,
  delivery_address_id UUID REFERENCES merchant_customer_addresses(id) ON DELETE SET NULL,
  collection_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivery_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  service_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
  goods_defaults JSONB NOT NULL DEFAULT '[]'::jsonb,
  commercial_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
  instructions TEXT,
  archived_at TIMESTAMPTZ,
  created_by_user_id UUID,
  updated_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_profiles_company_customer
  ON merchant_customer_booking_profiles (company_id, merchant_customer_id, archived_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_profiles_company_name
  ON merchant_customer_booking_profiles (company_id, profile_name);

CREATE OR REPLACE FUNCTION update_merchant_customer_booking_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merchant_customer_booking_profiles_updated_at
  ON merchant_customer_booking_profiles;

CREATE TRIGGER merchant_customer_booking_profiles_updated_at
BEFORE UPDATE ON merchant_customer_booking_profiles
FOR EACH ROW
EXECUTE FUNCTION update_merchant_customer_booking_profiles_updated_at();

-- Add missing operational address types required by CRM workflow.
ALTER TABLE IF EXISTS merchant_customer_addresses
  DROP CONSTRAINT IF EXISTS merchant_customer_addresses_address_type_check;

ALTER TABLE IF EXISTS merchant_customer_addresses
  ADD CONSTRAINT merchant_customer_addresses_address_type_check
  CHECK (address_type IN ('collection', 'delivery', 'warehouse', 'billing', 'branch', 'depot', 'supplier'));

NOTIFY pgrst, 'reload schema';
