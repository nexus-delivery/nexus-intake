-- Process-it lifecycle status columns
-- Tracks the READY_FOR_TRACKPOD → READY_FOR_ROUTE → TRACKPOD_ERROR lifecycle
-- mirroring the documented blueprint state machine exactly.

ALTER TABLE draft_jobs
  ADD COLUMN IF NOT EXISTS lifecycle_status            TEXT,
  ADD COLUMN IF NOT EXISTS trackpod_error_detail       JSONB,
  ADD COLUMN IF NOT EXISTS trackpod_error_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trackpod_push_attempted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trackpod_push_completed_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_draft_jobs_lifecycle_status
  ON draft_jobs(lifecycle_status);

-- Back-fill: confirmed jobs that already have TrackPOD IDs → READY_FOR_ROUTE
UPDATE draft_jobs
SET lifecycle_status = 'READY_FOR_ROUTE'
WHERE trackpod_delivery_order_id IS NOT NULL
  AND lifecycle_status IS NULL;

-- Back-fill: confirmed jobs without TrackPOD IDs → READY_FOR_TRACKPOD
UPDATE draft_jobs
SET lifecycle_status = 'READY_FOR_TRACKPOD'
WHERE status = 'job_created'
  AND trackpod_delivery_order_id IS NULL
  AND lifecycle_status IS NULL;
