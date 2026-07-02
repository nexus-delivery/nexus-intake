-- Document-it visibility: ensure route and ETA sync fields exist on draft_jobs.
-- Safe to run multiple times.

ALTER TABLE IF EXISTS draft_jobs
  ADD COLUMN IF NOT EXISTS route_status TEXT,
  ADD COLUMN IF NOT EXISTS route_date TEXT,
  ADD COLUMN IF NOT EXISTS eta_window TEXT,
  ADD COLUMN IF NOT EXISTS eta_from TEXT,
  ADD COLUMN IF NOT EXISTS eta_to TEXT,
  ADD COLUMN IF NOT EXISTS driver_name TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_name TEXT,
  ADD COLUMN IF NOT EXISTS collection_status TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT,
  ADD COLUMN IF NOT EXISTS pod_available BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_draft_jobs_route_status
  ON draft_jobs (company_id, route_status);

CREATE INDEX IF NOT EXISTS idx_draft_jobs_route_date
  ON draft_jobs (company_id, route_date);

CREATE INDEX IF NOT EXISTS idx_draft_jobs_eta_from
  ON draft_jobs (company_id, eta_from);

CREATE INDEX IF NOT EXISTS idx_draft_jobs_eta_to
  ON draft_jobs (company_id, eta_to);

NOTIFY pgrst, 'reload schema';
