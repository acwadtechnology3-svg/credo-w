-- WhatsApp-style delete: hide for self + delete for everyone (admins still see content)
-- Run after phase-agency-groups.sql

ALTER TABLE public.agency_messages
  ADD COLUMN IF NOT EXISTS deleted_for_all_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_for_all_by UUID REFERENCES public.users(id);

CREATE TABLE IF NOT EXISTS public.agency_message_user_hides (
  message_id UUID NOT NULL REFERENCES public.agency_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_message_user_hides_user
  ON public.agency_message_user_hides(user_id);

ALTER TABLE public.agency_message_user_hides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS backend_all ON public.agency_message_user_hides;
CREATE POLICY backend_all ON public.agency_message_user_hides FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, DELETE ON public.agency_message_user_hides TO authenticated;
