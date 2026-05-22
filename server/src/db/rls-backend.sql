-- Run in Supabase SQL Editor AFTER schema.sql
-- Required when the server uses the publishable (anon) key instead of service_role.
-- service_role bypasses RLS; without it, signup/login inserts are blocked.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;
