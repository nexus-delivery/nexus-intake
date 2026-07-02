-- Intake operational columns for draft_jobs
-- Adds dedicated queryable columns for every field needed by:
-- Route Planning, Warehouse, Driver App, Track-POD, Xero, POD, Notifications
--
-- All columns are nullable (no NOT NULL) so this migration is safe to apply
-- to an existing table with data.
-- All statements use ADD COLUMN IF NOT EXISTS so this is idempotent.
--
-- REQUIRED: Run this migration on the live Supabase database before deploying
-- any application code that writes to these columns.

ALTER TABLE draft_jobs
  -- Source / audit
  ADD COLUMN IF NOT EXISTS source_system        TEXT,           -- merchant_portal | public_webform | woocommerce | api | csv_import | admin_manual | mobile_app
  ADD COLUMN IF NOT EXISTS external_order_id    TEXT,           -- WooCommerce / Shopify / API order id
  ADD COLUMN IF NOT EXISTS customer             TEXT,           -- customer-facing name / order owner
  ADD COLUMN IF NOT EXISTS priority             TEXT DEFAULT 'Normal', -- High | Normal | Low
  ADD COLUMN IF NOT EXISTS notes                TEXT,           -- free-text notes

  -- Collection stop
  ADD COLUMN IF NOT EXISTS collection_company   TEXT,
  ADD COLUMN IF NOT EXISTS collection_contact   TEXT,
  ADD COLUMN IF NOT EXISTS collection_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS collection_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS collection_address_line3 TEXT,
  ADD COLUMN IF NOT EXISTS collection_postcode  TEXT,
  ADD COLUMN IF NOT EXISTS collection_country   TEXT,
  ADD COLUMN IF NOT EXISTS collection_phone     TEXT,
  ADD COLUMN IF NOT EXISTS collection_email     TEXT,
  ADD COLUMN IF NOT EXISTS collection_instructions TEXT,

  -- Delivery stop
  ADD COLUMN IF NOT EXISTS delivery_company     TEXT,
  ADD COLUMN IF NOT EXISTS delivery_contact     TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address_line3 TEXT,
  ADD COLUMN IF NOT EXISTS delivery_postcode    TEXT,
  ADD COLUMN IF NOT EXISTS delivery_country     TEXT,
  ADD COLUMN IF NOT EXISTS delivery_phone       TEXT,
  ADD COLUMN IF NOT EXISTS delivery_email       TEXT,
  ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,

  -- Goods summary (top-level for quick display / search)
  ADD COLUMN IF NOT EXISTS goods_description    TEXT,           -- primary goods description
  ADD COLUMN IF NOT EXISTS total_quantity       INT,
  ADD COLUMN IF NOT EXISTS total_packages       INT,
  ADD COLUMN IF NOT EXISTS total_pallet_count   INT,
  ADD COLUMN IF NOT EXISTS total_weight_kg      NUMERIC(12,3),

  -- Service options (boolean flags as JSONB for flexibility)
  ADD COLUMN IF NOT EXISTS service_options      JSONB,          -- { fragile, two_man, room_of_choice, assembly, tail_lift_required, dedicated_vehicle, northern_ireland_delivery, same_day }

  -- Commercial (for Xero)
  ADD COLUMN IF NOT EXISTS purchase_order       TEXT,
  ADD COLUMN IF NOT EXISTS commercial_net       TEXT,
  ADD COLUMN IF NOT EXISTS commercial_vat       TEXT,
  ADD COLUMN IF NOT EXISTS commercial_total     TEXT,
  ADD COLUMN IF NOT EXISTS commercial_cod       TEXT,
  ADD COLUMN IF NOT EXISTS invoice_required     BOOLEAN DEFAULT FALSE,

  -- Operations / routing
  ADD COLUMN IF NOT EXISTS depot                TEXT,
  ADD COLUMN IF NOT EXISTS warehouse            TEXT,
  ADD COLUMN IF NOT EXISTS route_name           TEXT,
  ADD COLUMN IF NOT EXISTS shipper              TEXT,
  ADD COLUMN IF NOT EXISTS service_type         TEXT;

-- Indexes for common operational queries
CREATE INDEX IF NOT EXISTS idx_draft_jobs_source_system
  ON draft_jobs (source_system);

CREATE INDEX IF NOT EXISTS idx_draft_jobs_lifecycle_company
  ON draft_jobs (company_id, lifecycle_status);

CREATE INDEX IF NOT EXISTS idx_draft_jobs_collection_postcode
  ON draft_jobs (collection_postcode);

CREATE INDEX IF NOT EXISTS idx_draft_jobs_delivery_postcode
  ON draft_jobs (delivery_postcode);

CREATE INDEX IF NOT EXISTS idx_draft_jobs_external_order_id
  ON draft_jobs (external_order_id) WHERE external_order_id IS NOT NULL;
