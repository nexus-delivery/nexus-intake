ALTER TABLE draft_jobs
  ADD COLUMN IF NOT EXISTS job_reference TEXT,
  ADD COLUMN IF NOT EXISTS trackpod_delivery_order_id TEXT,
  ADD COLUMN IF NOT EXISTS xero_draft_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS integration_metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_draft_jobs_trackpod_delivery_order_id
  ON draft_jobs(trackpod_delivery_order_id);

CREATE INDEX IF NOT EXISTS idx_draft_jobs_xero_draft_invoice_id
  ON draft_jobs(xero_draft_invoice_id);
