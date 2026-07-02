-- Sprint 2 completion: customer portal identity and invite acceptance linkage

CREATE TABLE IF NOT EXISTS customer_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,
  company_id UUID NOT NULL,
  merchant_customer_id UUID NOT NULL REFERENCES merchant_customers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_portal_users_company
  ON customer_portal_users (company_id);

CREATE INDEX IF NOT EXISTS idx_customer_portal_users_customer
  ON customer_portal_users (merchant_customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_portal_users_email
  ON customer_portal_users (lower(email));

CREATE OR REPLACE FUNCTION update_customer_portal_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_portal_users_updated_at
  ON customer_portal_users;

CREATE TRIGGER customer_portal_users_updated_at
BEFORE UPDATE ON customer_portal_users
FOR EACH ROW
EXECUTE FUNCTION update_customer_portal_users_updated_at();

NOTIFY pgrst, 'reload schema';
