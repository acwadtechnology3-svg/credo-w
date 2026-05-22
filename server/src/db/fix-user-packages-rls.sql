-- Fix: package purchase fails with
-- "new row violates row-level security policy for table user_packages"
-- Run once in Supabase SQL Editor.

ALTER TABLE IF EXISTS public.user_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS backend_all ON public.user_packages;
CREATE POLICY backend_all ON public.user_packages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Related purchase tables (safe if already applied)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_packages','package_snapshots','purchase_transactions',
    'purchase_steps','purchase_transition_log','checkout_sessions'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)', t
      );
    END IF;
  END LOOP;
END $$;
