-- Align sales_channels with company-scoped model.
-- Safe to run multiple times (all statements are idempotent).
-- Does NOT drop any columns so it cannot break a live database that may still
-- have merchant_id / source_type / updated_at columns.

-- 1. Ensure core columns exist (handles databases created from older migrations)
ALTER TABLE IF EXISTS sales_channels
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE IF EXISTS sales_channels
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Ensure clean indexes
DROP INDEX IF EXISTS idx_sales_channels_company_merchant_active;
DROP INDEX IF EXISTS idx_sales_channels_unique_name;

CREATE INDEX IF NOT EXISTS idx_sales_channels_company_active
  ON sales_channels (company_id, active);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_channels_unique_name
  ON sales_channels (company_id, lower(name));

-- 3. Ensure draft_jobs has the sales channel columns
ALTER TABLE draft_jobs
  ADD COLUMN IF NOT EXISTS sales_channel_id UUID,
  ADD COLUMN IF NOT EXISTS sales_channel_name TEXT;
