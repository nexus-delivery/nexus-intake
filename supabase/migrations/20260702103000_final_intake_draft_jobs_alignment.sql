-- Final consolidated draft_jobs alignment for the unified intake layer.
--
-- Safe/idempotent: every statement uses ADD COLUMN IF NOT EXISTS.
-- This migration intentionally groups all operational draft_jobs columns used
-- by the Create-it intake service and downstream operational workflows.
--
-- Run this on production Supabase, then refresh the schema cache.

ALTER TABLE IF EXISTS draft_jobs
  -- Intake identity / source
  ADD COLUMN IF NOT EXISTS job_reference TEXT,
  ADD COLUMN IF NOT EXISTS integration_metadata JSONB,
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT,
  ADD COLUMN IF NOT EXISTS current_status TEXT,
  ADD COLUMN IF NOT EXISTS source_system TEXT,
  ADD COLUMN IF NOT EXISTS external_order_id TEXT,
  ADD COLUMN IF NOT EXISTS sales_channel_id UUID,
  ADD COLUMN IF NOT EXISTS sales_channel_name TEXT,
  ADD COLUMN IF NOT EXISTS customer TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,

  -- Collection stop
  ADD COLUMN IF NOT EXISTS collection_company TEXT,
  ADD COLUMN IF NOT EXISTS collection_contact TEXT,
  ADD COLUMN IF NOT EXISTS collection_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS collection_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS collection_address_line3 TEXT,
  ADD COLUMN IF NOT EXISTS collection_postcode TEXT,
  ADD COLUMN IF NOT EXISTS collection_country TEXT,
  ADD COLUMN IF NOT EXISTS collection_phone TEXT,
  ADD COLUMN IF NOT EXISTS collection_email TEXT,
  ADD COLUMN IF NOT EXISTS collection_instructions TEXT,
  ADD COLUMN IF NOT EXISTS collection_latitude TEXT,
  ADD COLUMN IF NOT EXISTS collection_longitude TEXT,

  -- Delivery stop
  ADD COLUMN IF NOT EXISTS delivery_company TEXT,
  ADD COLUMN IF NOT EXISTS delivery_contact TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address_line3 TEXT,
  ADD COLUMN IF NOT EXISTS delivery_postcode TEXT,
  ADD COLUMN IF NOT EXISTS delivery_country TEXT,
  ADD COLUMN IF NOT EXISTS delivery_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_email TEXT,
  ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
  ADD COLUMN IF NOT EXISTS delivery_latitude TEXT,
  ADD COLUMN IF NOT EXISTS delivery_longitude TEXT,

  -- Requested / override dates and route metrics
  ADD COLUMN IF NOT EXISTS requested_collection_date TEXT,
  ADD COLUMN IF NOT EXISTS requested_collection_time TEXT,
  ADD COLUMN IF NOT EXISTS requested_delivery_date TEXT,
  ADD COLUMN IF NOT EXISTS requested_delivery_time TEXT,
  ADD COLUMN IF NOT EXISTS override_collection_date TEXT,
  ADD COLUMN IF NOT EXISTS override_collection_time TEXT,
  ADD COLUMN IF NOT EXISTS override_delivery_date TEXT,
  ADD COLUMN IF NOT EXISTS override_delivery_time TEXT,
  ADD COLUMN IF NOT EXISTS route_distance_km TEXT,
  ADD COLUMN IF NOT EXISTS journey_time_minutes TEXT,

  -- Goods summary / service flags
  ADD COLUMN IF NOT EXISTS goods_description TEXT,
  ADD COLUMN IF NOT EXISTS total_quantity INT,
  ADD COLUMN IF NOT EXISTS total_packages INT,
  ADD COLUMN IF NOT EXISTS total_pallet_count INT,
  ADD COLUMN IF NOT EXISTS total_weight_kg NUMERIC(12,3),
  ADD COLUMN IF NOT EXISTS service_options JSONB,

  -- Commercial / Xero
  ADD COLUMN IF NOT EXISTS purchase_order TEXT,
  ADD COLUMN IF NOT EXISTS commercial_net TEXT,
  ADD COLUMN IF NOT EXISTS commercial_vat TEXT,
  ADD COLUMN IF NOT EXISTS commercial_total TEXT,
  ADD COLUMN IF NOT EXISTS commercial_cod TEXT,
  ADD COLUMN IF NOT EXISTS invoice_required BOOLEAN DEFAULT FALSE,

  -- Operational routing fields
  ADD COLUMN IF NOT EXISTS depot TEXT,
  ADD COLUMN IF NOT EXISTS warehouse TEXT,
  ADD COLUMN IF NOT EXISTS route_name TEXT,
  ADD COLUMN IF NOT EXISTS shipper TEXT,
  ADD COLUMN IF NOT EXISTS service_type TEXT,

  -- Existing foundational columns that Create-it and downstream flows rely on
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS primary_document_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trackpod_delivery_order_id TEXT,
  ADD COLUMN IF NOT EXISTS xero_draft_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS trackpod_collection_order_id TEXT,
  ADD COLUMN IF NOT EXISTS trackpod_collection_tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS trackpod_delivery_tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS document_url TEXT,
  ADD COLUMN IF NOT EXISTS document_filename TEXT,
  ADD COLUMN IF NOT EXISTS document_file_type TEXT,
  ADD COLUMN IF NOT EXISTS document_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_api_response JSONB,
  ADD COLUMN IF NOT EXISTS trackpod_error_detail JSONB,
  ADD COLUMN IF NOT EXISTS trackpod_error_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trackpod_push_attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trackpod_push_completed_at TIMESTAMPTZ;

-- Indexes for operational access patterns
CREATE INDEX IF NOT EXISTS idx_draft_jobs_job_reference
  ON draft_jobs (job_reference);

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

CREATE INDEX IF NOT EXISTS idx_draft_jobs_trackpod_delivery_order_id
  ON draft_jobs (trackpod_delivery_order_id);

CREATE INDEX IF NOT EXISTS idx_draft_jobs_trackpod_collection_order_id
  ON draft_jobs (trackpod_collection_order_id);

-- Refresh Supabase/PostgREST schema cache so API clients see the new columns.
NOTIFY pgrst, 'reload schema';
