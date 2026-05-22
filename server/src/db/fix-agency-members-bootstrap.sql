-- Optional shortcut: bootstraps agency_members only.
-- Prefer running the full phase-p4-agencies.sql (production migration).
-- Use this file only if members table is missing mid-migration.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_members') THEN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_members') THEN
      ALTER TABLE public.team_members RENAME TO agency_members;
    END IF;
  END IF;
END $$;

-- Then run phase-p4-agencies.sql from §B onward, or the full file.
