-- Persist booking profile linkage on operational jobs for CRM-to-operations traceability.

ALTER TABLE IF EXISTS draft_jobs
  ADD COLUMN IF NOT EXISTS booking_profile_id UUID REFERENCES merchant_customer_booking_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_draft_jobs_booking_profile_id
  ON draft_jobs (booking_profile_id);

NOTIFY pgrst, 'reload schema';
