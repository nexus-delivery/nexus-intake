ALTER TABLE draft_jobs
  ADD COLUMN IF NOT EXISTS trackpod_collection_order_id TEXT,
  ADD COLUMN IF NOT EXISTS trackpod_collection_tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS trackpod_delivery_tracking_url TEXT;

CREATE INDEX IF NOT EXISTS idx_draft_jobs_trackpod_collection_order_id
  ON draft_jobs(trackpod_collection_order_id);
