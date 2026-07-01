-- Sprint 1 foundations: Price it, schedule overrides, notify/discuss module data

-- Price it: merchant + catalogue item commercial pricing
CREATE TABLE IF NOT EXISTS merchant_price_it_commercial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  catalogue_item_id UUID NOT NULL,
  net_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  handling_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 5,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_it_unique
  ON merchant_price_it_commercial (merchant_id, catalogue_item_id);

CREATE INDEX IF NOT EXISTS idx_price_it_lookup
  ON merchant_price_it_commercial (merchant_id, catalogue_item_id, active);

CREATE OR REPLACE FUNCTION update_merchant_price_it_commercial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merchant_price_it_commercial_updated_at ON merchant_price_it_commercial;
CREATE TRIGGER merchant_price_it_commercial_updated_at
BEFORE UPDATE ON merchant_price_it_commercial
FOR EACH ROW
EXECUTE FUNCTION update_merchant_price_it_commercial_updated_at();

-- Collection / delivery override audit and operations notifications foundation
CREATE TABLE IF NOT EXISTS draft_job_schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_job_id UUID NOT NULL,
  field_name TEXT NOT NULL CHECK (field_name IN ('collection_date', 'collection_time', 'delivery_date', 'delivery_time')),
  old_value TEXT,
  new_value TEXT,
  reason TEXT NOT NULL,
  actor_user_id UUID,
  actor_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_draft_job_schedule_overrides_job
  ON draft_job_schedule_overrides (draft_job_id, created_at DESC);

CREATE TABLE IF NOT EXISTS operations_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_job_id UUID,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by_user_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operations_notifications_read
  ON operations_notifications (is_read, created_at DESC);

-- Notify it foundation
CREATE TABLE IF NOT EXISTS notify_it_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  draft_job_id UUID,
  subject TEXT NOT NULL,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notify_it_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_user_id UUID,
  sender_label TEXT,
  message TEXT NOT NULL,
  internal_only BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notify_it_messages_conversation
  ON notify_it_messages (conversation_id, created_at DESC);

-- Discuss it foundation
CREATE TABLE IF NOT EXISTS discuss_it_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  draft_job_id UUID,
  event_type TEXT NOT NULL,
  event_source TEXT,
  event_summary TEXT NOT NULL,
  payload JSONB,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discuss_it_timeline_job
  ON discuss_it_timeline (draft_job_id, created_at DESC);

-- Persist requested and overridden schedule values on draft jobs
ALTER TABLE draft_jobs
  ADD COLUMN IF NOT EXISTS requested_collection_date TEXT,
  ADD COLUMN IF NOT EXISTS requested_collection_time TEXT,
  ADD COLUMN IF NOT EXISTS requested_delivery_date TEXT,
  ADD COLUMN IF NOT EXISTS requested_delivery_time TEXT,
  ADD COLUMN IF NOT EXISTS override_collection_date TEXT,
  ADD COLUMN IF NOT EXISTS override_collection_time TEXT,
  ADD COLUMN IF NOT EXISTS override_delivery_date TEXT,
  ADD COLUMN IF NOT EXISTS override_delivery_time TEXT,
  ADD COLUMN IF NOT EXISTS collection_latitude TEXT,
  ADD COLUMN IF NOT EXISTS collection_longitude TEXT,
  ADD COLUMN IF NOT EXISTS delivery_latitude TEXT,
  ADD COLUMN IF NOT EXISTS delivery_longitude TEXT,
  ADD COLUMN IF NOT EXISTS route_distance_km TEXT,
  ADD COLUMN IF NOT EXISTS journey_time_minutes TEXT;
