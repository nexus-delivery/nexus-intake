-- Sprint 3A: allow multiple saved collection addresses per merchant.

ALTER TABLE IF EXISTS merchant_collection_profiles
  DROP CONSTRAINT IF EXISTS merchant_collection_profiles_company_id_key;

ALTER TABLE IF EXISTS merchant_collection_profiles
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Backfill existing single profile rows so each merchant has one default.
UPDATE merchant_collection_profiles
SET is_default = TRUE
WHERE is_default = FALSE
  AND id IN (
    SELECT DISTINCT ON (company_id) id
    FROM merchant_collection_profiles
    ORDER BY company_id, updated_at DESC NULLS LAST, created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_merchant_collection_profiles_company_active
  ON merchant_collection_profiles (company_id, archived_at, is_default, updated_at DESC);

-- Ensure only one default active profile per merchant.
CREATE UNIQUE INDEX IF NOT EXISTS uq_merchant_collection_profiles_default
  ON merchant_collection_profiles (company_id)
  WHERE is_default = TRUE AND archived_at IS NULL;

NOTIFY pgrst, 'reload schema';
