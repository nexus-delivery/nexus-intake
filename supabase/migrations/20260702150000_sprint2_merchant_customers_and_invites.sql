-- Sprint 2 foundation: merchant-owned customers, invitations, and intake linkage

CREATE TABLE IF NOT EXISTS merchant_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  company TEXT,
  contact_name TEXT,
  email TEXT,
  mobile TEXT,
  phone TEXT,
  billing_address TEXT,
  default_collection_address TEXT,
  default_delivery_address TEXT,
  delivery_instructions TEXT,
  vat_number TEXT,
  account_number TEXT,
  pricing_profile TEXT,
  default_service TEXT,
  notes TEXT,
  archived_at TIMESTAMPTZ,
  created_by_user_id UUID,
  updated_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_customers_company_id
  ON merchant_customers (company_id);

CREATE INDEX IF NOT EXISTS idx_merchant_customers_company_archived
  ON merchant_customers (company_id, archived_at);

CREATE INDEX IF NOT EXISTS idx_merchant_customers_company_email
  ON merchant_customers (company_id, email);

CREATE INDEX IF NOT EXISTS idx_merchant_customers_search
  ON merchant_customers (company_id, customer_name, company, email);

CREATE OR REPLACE FUNCTION update_merchant_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merchant_customers_updated_at
  ON merchant_customers;

CREATE TRIGGER merchant_customers_updated_at
BEFORE UPDATE ON merchant_customers
FOR EACH ROW
EXECUTE FUNCTION update_merchant_customers_updated_at();

CREATE TABLE IF NOT EXISTS merchant_customer_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  merchant_customer_id UUID NOT NULL REFERENCES merchant_customers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  invited_by_user_id UUID,
  accepted_by_user_id UUID,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_customer_invites_company_email
  ON merchant_customer_invitations (company_id, email);

CREATE INDEX IF NOT EXISTS idx_merchant_customer_invites_customer
  ON merchant_customer_invitations (merchant_customer_id);

ALTER TABLE IF EXISTS draft_jobs
  ADD COLUMN IF NOT EXISTS customer_id UUID,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS pricing_profile TEXT,
  ADD COLUMN IF NOT EXISTS default_service TEXT;

CREATE INDEX IF NOT EXISTS idx_draft_jobs_customer_id
  ON draft_jobs (customer_id);

CREATE INDEX IF NOT EXISTS idx_draft_jobs_customer_email
  ON draft_jobs (customer_email);

NOTIFY pgrst, 'reload schema';
