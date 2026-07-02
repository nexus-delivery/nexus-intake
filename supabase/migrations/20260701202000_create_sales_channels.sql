-- Sales channels for reporting and booking autocomplete
CREATE TABLE IF NOT EXISTS sales_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_channels_company_id
  ON sales_channels (company_id);

CREATE INDEX IF NOT EXISTS idx_sales_channels_company_active
  ON sales_channels (company_id, active);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_channels_unique_name
  ON sales_channels (company_id, lower(name));

ALTER TABLE draft_jobs
  ADD COLUMN IF NOT EXISTS sales_channel_id UUID,
  ADD COLUMN IF NOT EXISTS sales_channel_name TEXT;
