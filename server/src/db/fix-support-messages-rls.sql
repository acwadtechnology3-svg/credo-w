-- Fix: support chat send fails with
-- "new row violates row-level security policy for table support_messages"
-- Run once in Supabase SQL Editor after phase-support-chat.sql.
-- (Or set SUPABASE_SERVICE_KEY to service_role in server .env to bypass RLS.)

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'support_messages',
    'support_attachments',
    'support_activity_logs',
    'support_agents'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)',
        t
      );
    END IF;
  END LOOP;
END $$;

-- Ticket updates from sendMessage (unread counts, status)
ALTER TABLE IF EXISTS public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS backend_all ON public.support_tickets;
CREATE POLICY backend_all ON public.support_tickets
  FOR ALL
  USING (true)
  WITH CHECK (true);
