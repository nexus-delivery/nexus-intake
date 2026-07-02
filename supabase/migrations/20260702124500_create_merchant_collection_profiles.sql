-- Merchant default collection profiles for depot-first booking mode.
-- One active default collection profile per company.

CREATE TABLE IF NOT EXISTS merchant_collection_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE,
  profile_name TEXT NOT NULL DEFAULT 'Default depot',
  company_name TEXT,
  contact_name TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  address_line3 TEXT,
  postcode TEXT,
  country TEXT NOT NULL DEFAULT 'UK',
  phone TEXT,
  email TEXT,
  instructions TEXT,
  created_by_user_id UUID,
  updated_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_collection_profiles_company_id
  ON merchant_collection_profiles (company_id);

CREATE OR REPLACE FUNCTION update_merchant_collection_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merchant_collection_profiles_updated_at
  ON merchant_collection_profiles;

CREATE TRIGGER merchant_collection_profiles_updated_at
BEFORE UPDATE ON merchant_collection_profiles
FOR EACH ROW
EXECUTE FUNCTION update_merchant_collection_profiles_updated_at();

NOTIFY pgrst, 'reload schema';
