-- Sprint 4 operational cutover: support unlimited reusable customer addresses.
-- Reuses existing merchant_customers and company scoping.

CREATE TABLE IF NOT EXISTS merchant_customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  merchant_customer_id UUID NOT NULL REFERENCES merchant_customers(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('collection', 'delivery')),
  label TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  address_line3 TEXT,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'UK',
  instructions TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_by_user_id UUID,
  updated_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_customer_addresses_company_customer
  ON merchant_customer_addresses (company_id, merchant_customer_id, address_type);

CREATE INDEX IF NOT EXISTS idx_merchant_customer_addresses_company_active
  ON merchant_customer_addresses (company_id, archived_at, updated_at DESC);

-- Only one active default per customer and address type.
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_customer_addresses_default_unique
  ON merchant_customer_addresses (company_id, merchant_customer_id, address_type)
  WHERE is_default = TRUE AND archived_at IS NULL;

CREATE OR REPLACE FUNCTION update_merchant_customer_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merchant_customer_addresses_updated_at
  ON merchant_customer_addresses;

CREATE TRIGGER merchant_customer_addresses_updated_at
BEFORE UPDATE ON merchant_customer_addresses
FOR EACH ROW
EXECUTE FUNCTION update_merchant_customer_addresses_updated_at();

NOTIFY pgrst, 'reload schema';
