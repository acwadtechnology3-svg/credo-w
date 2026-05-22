-- Phase P4 — Agency Operations Layer (run after phase-p4-agencies.sql)
-- Adds onboarding progress + realtime event log. Idempotent.

CREATE TABLE IF NOT EXISTS public.agency_member_onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  current_step_key VARCHAR(48) NOT NULL DEFAULT 'welcome',
  completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  interrupted_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_onboarding_progress_agency
  ON public.agency_member_onboarding_progress(agency_id);

CREATE TABLE IF NOT EXISTS public.agency_realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  event_type VARCHAR(48) NOT NULL,
  actor_id UUID REFERENCES public.users(id),
  target_user_id UUID REFERENCES public.users(id),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_realtime_agency_time
  ON public.agency_realtime_events(agency_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agency_realtime_type
  ON public.agency_realtime_events(event_type, created_at DESC);

ALTER TABLE public.agency_member_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_realtime_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS backend_all ON public.agency_member_onboarding_progress;
CREATE POLICY backend_all ON public.agency_member_onboarding_progress
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS backend_all ON public.agency_realtime_events;
CREATE POLICY backend_all ON public.agency_realtime_events
  FOR ALL USING (true) WITH CHECK (true);
