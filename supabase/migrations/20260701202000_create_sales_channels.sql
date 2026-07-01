-- Sales channels for reporting and booking autocomplete
CREATE TABLE IF NOT EXISTS sales_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  merchant_id UUID NULL,
  name TEXT NOT NULL,
  source_type TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_channels_company_id
  ON sales_channels (company_id);

CREATE INDEX IF NOT EXISTS idx_sales_channels_company_merchant_active
  ON sales_channels (company_id, merchant_id, active);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_channels_unique_name
  ON sales_channels (company_id, COALESCE(merchant_id::text, ''), lower(name));

CREATE OR REPLACE FUNCTION update_sales_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sales_channels_updated_at ON sales_channels;
CREATE TRIGGER sales_channels_updated_at
BEFORE UPDATE ON sales_channels
FOR EACH ROW
EXECUTE FUNCTION update_sales_channels_updated_at();

ALTER TABLE draft_jobs
  ADD COLUMN IF NOT EXISTS sales_channel_id UUID,
  ADD COLUMN IF NOT EXISTS sales_channel_name TEXT;
