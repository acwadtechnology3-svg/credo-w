-- =============================================================================
-- Phase P4 — Agency Ecosystem & Organization Structure
-- =============================================================================
-- Prerequisites : phase-p0-foundation.sql (users, optional legacy teams/*)
-- Target        : Supabase PostgreSQL (public schema)
-- Re-run safe   : Yes — idempotent; supports fresh, partial, legacy, and mixed DBs
--
-- Migration order:
--   A. agencies
--   B. agency_members (+ users.org columns)
--   C. agency_role_definitions
--   D. agency_invitations (+ agency_join_requests)
--   E. agency_rank_definitions
--   F. achievements
--   G. missions / events
--   H. activity / statistics / rankings
--   I. treasury / moderation / onboarding / permissions / chat
--   J. p4_rename_team_id_columns() — after §H and §I renames
--   K. compatibility views (teams, team_members — P5 gamification)
--   L. system_settings seeds
--   M. RLS policies
--   N. verification report
-- =============================================================================

-- -----------------------------------------------------------------------------
-- §0  Migration helper (idempotent — safe to call multiple times)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.p4_rename_team_id_columns()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    INNER JOIN pg_tables t
      ON t.tablename = c.table_name AND t.schemaname = c.table_schema
    WHERE c.table_schema = 'public'
      AND c.column_name = 'team_id'
      AND c.table_name LIKE 'agency_%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I RENAME COLUMN team_id TO agency_id',
      r.table_name
    );
    RAISE NOTICE 'P4: %.team_id → agency_id', r.table_name;
  END LOOP;
END $$;

-- =============================================================================
-- §A  AGENCIES (core organization entity)
-- =============================================================================

-- A.1  Legacy table rename: teams → agencies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teams'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agencies'
  ) THEN
    ALTER TABLE public.teams RENAME TO agencies;
    RAISE NOTICE 'P4: renamed teams → agencies';
  END IF;
END $$;

-- A.2  Create agencies (skipped when table already exists from rename)
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(64) UNIQUE NOT NULL,
  short_code VARCHAR(12),
  name VARCHAR(120) NOT NULL,
  motto VARCHAR(240),
  slogan VARCHAR(240),
  mission TEXT,
  bio TEXT,
  leadership_statement TEXT,
  logo_url VARCHAR,
  banner_url VARCHAR,
  welcome_video_url VARCHAR,
  intro_video_url VARCHAR,
  primary_color VARCHAR(16) DEFAULT '#7B6CF6',
  secondary_color VARCHAR(16) DEFAULT '#534AB7',
  glow_theme VARCHAR(32) DEFAULT 'purple_pulse',
  agency_category VARCHAR(32) DEFAULT 'official',
  region VARCHAR(64) DEFAULT 'global',
  verification_status VARCHAR(24) DEFAULT 'pending',
  agency_rank VARCHAR(32) DEFAULT 'rising',
  rank_level INT DEFAULT 1,
  owner_id UUID REFERENCES public.users(id),
  leader_id UUID REFERENCES public.users(id),
  founder_id UUID REFERENCES public.users(id),
  total_bv DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_members INT NOT NULL DEFAULT 1,
  total_earnings DECIMAL(15,2) NOT NULL DEFAULT 0,
  power_score INT NOT NULL DEFAULT 0,
  activity_score INT NOT NULL DEFAULT 0,
  reputation_score INT NOT NULL DEFAULT 50,
  fraud_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  trust_level VARCHAR(20) NOT NULL DEFAULT 'new',
  prestige_score INT NOT NULL DEFAULT 0,
  prestige_tier VARCHAR(20) DEFAULT 'bronze',
  invite_conversions INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_discoverable BOOLEAN NOT NULL DEFAULT true,
  max_members INT NOT NULL DEFAULT 500,
  branding_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  chat_prep JSONB NOT NULL DEFAULT '{"channels":["announcements","general"],"voice_ready":false}'::jsonb,
  permissions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_staff_id UUID REFERENCES public.users(id),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A.3  Add columns on legacy / partial agencies (never reference columns before they exist)
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS short_code VARCHAR(12),
  ADD COLUMN IF NOT EXISTS slogan VARCHAR(240),
  ADD COLUMN IF NOT EXISTS intro_video_url VARCHAR,
  ADD COLUMN IF NOT EXISTS primary_color VARCHAR(16) DEFAULT '#7B6CF6',
  ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(16) DEFAULT '#534AB7',
  ADD COLUMN IF NOT EXISTS glow_theme VARCHAR(32) DEFAULT 'purple_pulse',
  ADD COLUMN IF NOT EXISTS agency_category VARCHAR(32) DEFAULT 'official',
  ADD COLUMN IF NOT EXISTS region VARCHAR(64) DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(24) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS agency_rank VARCHAR(32) DEFAULT 'rising',
  ADD COLUMN IF NOT EXISTS rank_level INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fraud_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS permissions_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by_staff_id UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activity_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reputation_score INT DEFAULT 50,
  ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20) DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS prestige_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prestige_tier VARCHAR(20) DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS invite_conversions INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS branding_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS chat_prep JSONB DEFAULT '{"channels":["announcements","general"],"voice_ready":false}'::jsonb;

-- A.4  Legacy column rename + data copy (only when source columns exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'team_color'
  ) THEN
    EXECUTE $q$
      UPDATE public.agencies SET primary_color = COALESCE(team_color, '#7B6CF6')
      WHERE primary_color IS NULL OR primary_color = '#7B6CF6'
    $q$;
    ALTER TABLE public.agencies DROP COLUMN IF EXISTS team_color;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'team_type'
  ) THEN
    EXECUTE $q$
      UPDATE public.agencies
      SET agency_category = COALESCE(team_type, agency_category, 'official')
    $q$;
    ALTER TABLE public.agencies DROP COLUMN IF EXISTS team_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'level'
  ) THEN
    EXECUTE $q$
      UPDATE public.agencies SET rank_level = COALESCE(level, rank_level, 1)
    $q$;
    ALTER TABLE public.agencies DROP COLUMN IF EXISTS level;
  END IF;
END $$;

-- A.5  Backfill ownership + verification (table must exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agencies') THEN
    UPDATE public.agencies SET owner_id = founder_id
      WHERE owner_id IS NULL AND founder_id IS NOT NULL;
    UPDATE public.agencies SET leader_id = COALESCE(leader_id, founder_id, owner_id)
      WHERE leader_id IS NULL;
    UPDATE public.agencies SET verification_status = 'verified'
      WHERE is_verified = true
        AND COALESCE(verification_status, 'pending') = 'pending';
    UPDATE public.agencies SET agency_rank = 'rising'
      WHERE agency_rank IS NULL;
    UPDATE public.agencies SET rank_level = 1 WHERE rank_level IS NULL;
  END IF;
END $$;

-- A.6  Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_agencies_short_code
  ON public.agencies(short_code) WHERE short_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agencies_owner ON public.agencies(owner_id);
CREATE INDEX IF NOT EXISTS idx_agencies_founder ON public.agencies(founder_id);
CREATE INDEX IF NOT EXISTS idx_agencies_power ON public.agencies(power_score DESC);
CREATE INDEX IF NOT EXISTS idx_agencies_region ON public.agencies(region);
CREATE INDEX IF NOT EXISTS idx_agencies_status ON public.agencies(status);
CREATE INDEX IF NOT EXISTS idx_agencies_verification ON public.agencies(verification_status);

-- A.7  Check constraints (drop → add for idempotency)
ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS agencies_status_check;
ALTER TABLE public.agencies ADD CONSTRAINT agencies_status_check CHECK (
  status IN ('active', 'suspended', 'archived', 'pending_review', 'merged', 'inactive')
);

ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS agencies_verification_check;
ALTER TABLE public.agencies ADD CONSTRAINT agencies_verification_check CHECK (
  verification_status IN ('pending', 'verified', 'featured', 'suspended', 'revoked')
);

ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS agencies_rank_check;
ALTER TABLE public.agencies ADD CONSTRAINT agencies_rank_check CHECK (
  agency_rank IN ('rising', 'growth', 'elite', 'diamond', 'royal', 'legendary')
);

ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS teams_status_check;
ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS teams_team_type_check;

-- =============================================================================
-- §B  AGENCY MEMBERS
-- =============================================================================

-- B.1  Resolve mixed state: team_members vs empty agency_members
DO $$
DECLARE
  v_team_rows BIGINT := 0;
  v_agency_rows BIGINT := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_members'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_members'
    ) THEN
      ALTER TABLE public.team_members RENAME TO agency_members;
      RAISE NOTICE 'P4: renamed team_members → agency_members';
    END IF;
  ELSIF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_members'
  ) AND EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_members'
  ) THEN
    EXECUTE 'SELECT COUNT(*) FROM public.team_members' INTO v_team_rows;
    EXECUTE 'SELECT COUNT(*) FROM public.agency_members' INTO v_agency_rows;
    IF v_team_rows > 0 AND v_agency_rows = 0 THEN
      DROP TABLE public.agency_members;
      ALTER TABLE public.team_members RENAME TO agency_members;
      RAISE NOTICE 'P4: recovered team_members → agency_members (dropped empty duplicate)';
    END IF;
  END IF;
END $$;

-- B.2  Create agency_members (requires agencies)
CREATE TABLE IF NOT EXISTS public.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(24) NOT NULL DEFAULT 'member',
  sponsor_within_agency UUID REFERENCES public.users(id),
  placement_preference VARCHAR(10) DEFAULT 'AUTO',
  contribution_bv DECIMAL(12,2) NOT NULL DEFAULT 0,
  permissions_override JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE (agency_id, user_id),
  UNIQUE (user_id)
);

-- B.3  Legacy column team_id → agency_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agency_members' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.agency_members RENAME COLUMN team_id TO agency_id;
  END IF;
END $$;

-- B.4  Extend columns
ALTER TABLE public.agency_members
  ADD COLUMN IF NOT EXISTS sponsor_within_agency UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS placement_preference VARCHAR(10) DEFAULT 'AUTO',
  ADD COLUMN IF NOT EXISTS permissions_override JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ;

-- B.5  Role migration BEFORE check constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_members') THEN
    ALTER TABLE public.agency_members DROP CONSTRAINT IF EXISTS agency_members_role_check;
    ALTER TABLE public.agency_members DROP CONSTRAINT IF EXISTS team_members_role_check;

    UPDATE public.agency_members SET role = 'owner'
      WHERE role IN ('founder', 'leader');
    UPDATE public.agency_members SET role = 'manager'
      WHERE role IN ('co_leader', 'officer');
    UPDATE public.agency_members SET role = 'member'
      WHERE role IS NULL
         OR role NOT IN (
           'owner', 'manager', 'recruiter', 'moderator', 'mentor', 'elite_member', 'member'
         );

    ALTER TABLE public.agency_members DROP CONSTRAINT IF EXISTS agency_members_role_check;
    ALTER TABLE public.agency_members ADD CONSTRAINT agency_members_role_check CHECK (
      role IN ('owner', 'manager', 'recruiter', 'moderator', 'mentor', 'elite_member', 'member')
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON public.agency_members(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_user ON public.agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_role ON public.agency_members(agency_id, role);

-- B.6  Users — organizational identity (separate from sponsor_id / tree_nodes)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id),
  ADD COLUMN IF NOT EXISTS agency_join_mode VARCHAR(24),
  ADD COLUMN IF NOT EXISTS agency_onboarding_status VARCHAR(24) DEFAULT 'not_started';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'agency_onboarding_status'
  ) THEN
    UPDATE public.users SET agency_onboarding_status = 'not_started'
      WHERE agency_onboarding_status IS NULL;
  END IF;
END $$;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_agency_join_mode_check;
ALTER TABLE public.users ADD CONSTRAINT users_agency_join_mode_check CHECK (
  agency_join_mode IS NULL
  OR agency_join_mode IN ('direct_agency', 'recruiter_sponsor', 'auto_placement', 'join_request')
);

-- Sync users.agency_id from active membership (supports team_id if rename not done yet)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_members') THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agency_members' AND column_name = 'agency_id'
  ) THEN
    UPDATE public.users u
    SET agency_id = m.agency_id
    FROM public.agency_members m
    WHERE m.user_id = u.id
      AND COALESCE(m.status, 'active') = 'active'
      AND (u.agency_id IS NULL OR u.agency_id IS DISTINCT FROM m.agency_id);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agency_members' AND column_name = 'team_id'
  ) THEN
    UPDATE public.users u
    SET agency_id = m.team_id
    FROM public.agency_members m
    WHERE m.user_id = u.id
      AND (u.agency_id IS NULL OR u.agency_id IS DISTINCT FROM m.team_id);
  END IF;
END $$;

-- =============================================================================
-- §C  AGENCY ROLE DEFINITIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agency_role_definitions (
  role VARCHAR(24) PRIMARY KEY,
  rank INT NOT NULL DEFAULT 0,
  label_en VARCHAR(80) NOT NULL,
  label_ar VARCHAR(80),
  permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
);

INSERT INTO public.agency_role_definitions (role, rank, label_en, label_ar, permissions) VALUES
  ('owner', 100, 'Agency Owner', 'مالك الوكالة', ARRAY['all']),
  ('manager', 90, 'Agency Manager', 'مدير الوكالة',
    ARRAY['recruit','invite','manage_placements','analytics','moderate','reports','assign_roles']),
  ('recruiter', 70, 'Recruiter', 'مجند', ARRAY['recruit','invite','view_analytics']),
  ('moderator', 65, 'Moderator', 'مشرف', ARRAY['moderate','view_members','reports']),
  ('mentor', 60, 'Mentor', 'موجه', ARRAY['invite','view_members']),
  ('elite_member', 40, 'Elite Member', 'عضو نخبة', ARRAY['view_members']),
  ('member', 10, 'Member', 'عضو', ARRAY['view_members'])
ON CONFLICT (role) DO UPDATE SET
  rank = EXCLUDED.rank,
  label_en = EXCLUDED.label_en,
  label_ar = EXCLUDED.label_ar,
  permissions = EXCLUDED.permissions;

-- =============================================================================
-- §D  AGENCY INVITATIONS & JOIN REQUESTS
-- =============================================================================

-- D.1  Rename legacy table BEFORE create (preserves data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_recruit_links'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_invitations'
  ) THEN
    ALTER TABLE public.team_recruit_links RENAME TO agency_invitations;
    RAISE NOTICE 'P4: renamed team_recruit_links → agency_invitations';
  END IF;
END $$;

-- D.2  CREATE invitations (only when still missing)
CREATE TABLE IF NOT EXISTS public.agency_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id),
  code VARCHAR(32) UNIQUE NOT NULL,
  invite_type VARCHAR(24) NOT NULL DEFAULT 'agency_link',
  placement_side VARCHAR(10) DEFAULT 'AUTO',
  sponsor_user_id UUID REFERENCES public.users(id),
  theme VARCHAR(32) DEFAULT 'elite',
  qr_payload TEXT,
  open_count INT NOT NULL DEFAULT 0,
  click_count INT NOT NULL DEFAULT 0,
  conversion_count INT NOT NULL DEFAULT 0,
  throttle_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D.3  Mixed state: copy remaining recruit links into invitations
DO $$
DECLARE
  v_src BIGINT := 0;
  v_dst BIGINT := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_recruit_links'
  ) AND EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_invitations'
  ) THEN
    EXECUTE 'SELECT COUNT(*) FROM public.team_recruit_links' INTO v_src;
    EXECUTE 'SELECT COUNT(*) FROM public.agency_invitations' INTO v_dst;
    IF v_src > 0 AND v_dst = 0 THEN
      INSERT INTO public.agency_invitations (
        id, agency_id, created_by, code, placement_side, theme,
        open_count, click_count, conversion_count, is_active, expires_at, created_at
      )
      SELECT
        id,
        team_id,
        created_by,
        code,
        COALESCE(placement_side, 'AUTO'),
        COALESCE(theme, 'elite'),
        COALESCE(open_count, 0),
        COALESCE(click_count, 0),
        COALESCE(conversion_count, 0),
        COALESCE(is_active, true),
        expires_at,
        created_at
      FROM public.team_recruit_links;
      DROP TABLE public.team_recruit_links;
      RAISE NOTICE 'P4: migrated % rows from team_recruit_links', v_src;
    ELSIF v_src > 0 AND v_dst > 0 THEN
      RAISE NOTICE 'P4: team_recruit_links still has % rows — merge manually if needed', v_src;
    END IF;
  END IF;
END $$;

-- D.4  Legacy column + new columns on invitations (table guaranteed to exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agency_invitations' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.agency_invitations RENAME COLUMN team_id TO agency_id;
  END IF;
END $$;

ALTER TABLE public.agency_invitations
  ADD COLUMN IF NOT EXISTS invite_type VARCHAR(24) DEFAULT 'agency_link',
  ADD COLUMN IF NOT EXISTS sponsor_user_id UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS qr_payload TEXT,
  ADD COLUMN IF NOT EXISTS throttle_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_invitations') THEN
    UPDATE public.agency_invitations SET invite_type = 'recruiter_link'
      WHERE invite_type IS NULL OR invite_type = 'recruit_link';
    UPDATE public.agency_invitations SET invite_type = 'agency_link'
      WHERE invite_type IS NULL;
    UPDATE public.agency_invitations SET sponsor_user_id = created_by
      WHERE sponsor_user_id IS NULL AND invite_type IN ('recruiter_link', 'recruit_link');
  END IF;
END $$;

ALTER TABLE public.agency_invitations DROP CONSTRAINT IF EXISTS agency_invitations_type_check;
ALTER TABLE public.agency_invitations ADD CONSTRAINT agency_invitations_type_check CHECK (
  invite_type IN ('agency_link', 'recruiter_link', 'agency_code', 'qr', 'staff_invite')
);

CREATE INDEX IF NOT EXISTS idx_agency_invitations_agency ON public.agency_invitations(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_invitations_code ON public.agency_invitations(code);
CREATE INDEX IF NOT EXISTS idx_agency_invitations_active
  ON public.agency_invitations(agency_id) WHERE is_active = true;

-- D.5  Join requests (recruiter / placement approval flow)
CREATE TABLE IF NOT EXISTS public.agency_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sponsor_user_id UUID REFERENCES public.users(id),
  placement_side VARCHAR(10) DEFAULT 'AUTO',
  request_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  invite_code VARCHAR(32),
  message TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agency_join_requests DROP CONSTRAINT IF EXISTS agency_join_requests_status_check;
ALTER TABLE public.agency_join_requests ADD CONSTRAINT agency_join_requests_status_check CHECK (
  request_status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_join_requests_pending
  ON public.agency_join_requests(agency_id, user_id)
  WHERE request_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_agency_join_requests_agency
  ON public.agency_join_requests(agency_id, request_status);
CREATE INDEX IF NOT EXISTS idx_agency_join_requests_user
  ON public.agency_join_requests(user_id);

-- =============================================================================
-- §E  AGENCY RANK DEFINITIONS
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_level_definitions'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_rank_definitions'
  ) THEN
    ALTER TABLE public.team_level_definitions RENAME TO agency_rank_definitions;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agency_rank_definitions' AND column_name = 'level'
    ) THEN
      ALTER TABLE public.agency_rank_definitions RENAME COLUMN level TO rank_level;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.agency_rank_definitions (
  rank_level INT PRIMARY KEY,
  rank_key VARCHAR(32) NOT NULL,
  title_en VARCHAR(80) NOT NULL,
  title_ar VARCHAR(80),
  min_power_score INT NOT NULL DEFAULT 0,
  min_members INT NOT NULL DEFAULT 0,
  min_retention_rate DECIMAL(5,2) DEFAULT 0,
  max_members_cap INT NOT NULL DEFAULT 500,
  perks_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.agency_rank_definitions
  ADD COLUMN IF NOT EXISTS rank_key VARCHAR(32),
  ADD COLUMN IF NOT EXISTS min_retention_rate DECIMAL(5,2) DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_rank_definitions') THEN
    UPDATE public.agency_rank_definitions SET rank_key = 'rising' WHERE rank_key IS NULL AND rank_level = 1;
    UPDATE public.agency_rank_definitions SET rank_key = 'elite' WHERE rank_key IS NULL AND rank_level = 3;
  END IF;
END $$;

INSERT INTO public.agency_rank_definitions (
  rank_level, rank_key, title_en, title_ar, min_power_score, min_members, perks_json
) VALUES
  (1, 'rising', 'Rising Agency', 'وكالة صاعدة', 0, 1, '{"badge":"bronze"}'::jsonb),
  (2, 'growth', 'Growth Agency', 'نمو', 500, 5, '{}'::jsonb),
  (3, 'elite', 'Elite Agency', 'نخبة', 2000, 15, '{}'::jsonb),
  (4, 'diamond', 'Diamond Agency', 'ماسية', 8000, 40, '{"verified_eligible":true}'::jsonb),
  (5, 'royal', 'Royal Agency', 'ملكية', 25000, 100, '{"prestige_glow":true}'::jsonb),
  (6, 'legendary', 'Legendary Organization', 'أسطورية', 75000, 250, '{"featured_eligible":true}'::jsonb)
ON CONFLICT (rank_level) DO NOTHING;

-- =============================================================================
-- §F  ACHIEVEMENTS
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_achievement_definitions'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_achievement_definitions'
  ) THEN
    ALTER TABLE public.team_achievement_definitions RENAME TO agency_achievement_definitions;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_achievements_unlocked'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_achievements_unlocked'
  ) THEN
    ALTER TABLE public.team_achievements_unlocked RENAME TO agency_achievements_unlocked;
  END IF;
END $$;

SELECT public.p4_rename_team_id_columns();

CREATE TABLE IF NOT EXISTS public.agency_achievement_definitions (
  key VARCHAR(48) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  icon VARCHAR(16) DEFAULT '🏆',
  condition_type VARCHAR(48) NOT NULL,
  condition_value INT NOT NULL,
  pearl_reward INT DEFAULT 0,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.agency_achievements_unlocked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  achievement_key VARCHAR(48) NOT NULL REFERENCES public.agency_achievement_definitions(key),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agency_id, achievement_key)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agency_achievements_unlocked' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.agency_achievements_unlocked RENAME COLUMN team_id TO agency_id;
  END IF;
END $$;

SELECT public.p4_rename_team_id_columns();

INSERT INTO public.agency_achievement_definitions (
  key, title, description, icon, condition_type, condition_value, pearl_reward, sort_order
) VALUES
  ('first_recruit', 'First Recruit', 'First member joined agency', '👤', 'members', 2, 100, 1),
  ('agency_10', 'Squad of Ten', '10 members', '🛡️', 'members', 10, 300, 2),
  ('agency_100', 'Century Organization', '100 members', '💯', 'members', 100, 2000, 3),
  ('bv_10k', '10K Agency BV', '10,000 collective BV', '⚡', 'total_bv', 10000, 500, 4),
  ('legendary_recruiter', 'Legendary Recruiter', '50 invite conversions', '🌟', 'invite_conversions', 50, 1000, 5),
  ('elite_agency', 'Elite Agency', 'Reach rank level 4', '👑', 'rank_level', 4, 750, 6),
  ('diamond_agency', 'Diamond Agency', '5000+ prestige', '💎', 'prestige_score', 5000, 1500, 7)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- §G  MISSIONS & EVENTS
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_mission_definitions')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_mission_definitions') THEN
    ALTER TABLE public.team_mission_definitions RENAME TO agency_mission_definitions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_mission_progress')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_mission_progress') THEN
    ALTER TABLE public.team_mission_progress RENAME TO agency_mission_progress;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_competitions')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_events') THEN
    ALTER TABLE public.team_competitions RENAME TO agency_events;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_competition_entries')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_event_entries') THEN
    ALTER TABLE public.team_competition_entries RENAME TO agency_event_entries;
  END IF;
END $$;

SELECT public.p4_rename_team_id_columns();

CREATE TABLE IF NOT EXISTS public.agency_mission_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(48) UNIQUE NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  mission_type VARCHAR(24) DEFAULT 'weekly',
  target_metric VARCHAR(48) NOT NULL,
  target_value INT NOT NULL,
  pearl_reward INT DEFAULT 0,
  xp_reward INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.agency_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.agency_mission_definitions(id) ON DELETE CASCADE,
  period_key VARCHAR(16) NOT NULL,
  current_value INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  reward_claimed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE (agency_id, mission_id, period_key)
);

CREATE TABLE IF NOT EXISTS public.agency_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  event_type VARCHAR(32) NOT NULL DEFAULT 'competition',
  season_key VARCHAR(32) NOT NULL,
  metric VARCHAR(48) NOT NULL DEFAULT 'power_score',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rewards_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_event_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.agency_events(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  score DECIMAL(15,2) NOT NULL DEFAULT 0,
  rank_position INT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, agency_id)
);

ALTER TABLE public.agency_mission_definitions DROP CONSTRAINT IF EXISTS agency_mission_definitions_mission_type_check;
ALTER TABLE public.agency_mission_definitions ADD CONSTRAINT agency_mission_definitions_mission_type_check CHECK (
  mission_type IN ('daily', 'weekly', 'seasonal')
);

INSERT INTO public.agency_mission_definitions (
  key, title, description, mission_type, target_metric, target_value, pearl_reward, xp_reward
) VALUES
  ('recruit_5', 'Recruit 5', 'Add 5 new members this week', 'weekly', 'new_members', 5, 200, 100),
  ('bv_10k_week', '10K BV Sprint', 'Generate 10,000 agency BV', 'weekly', 'bv_delta', 10000, 400, 200),
  ('activate_3', 'Activate Three', '3 members complete activation', 'weekly', 'activations', 3, 150, 75)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- §H  ACTIVITY, REPUTATION, STATISTICS, RANKINGS
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_activity_logs')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_activity_logs') THEN
    ALTER TABLE public.team_activity_logs RENAME TO agency_activity_logs;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_reputation_logs')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_reputation_logs') THEN
    ALTER TABLE public.team_reputation_logs RENAME TO agency_reputation_logs;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_statistics')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_statistics') THEN
    ALTER TABLE public.team_statistics RENAME TO agency_statistics;
  END IF;
END $$;

-- Renamed team_* tables still have team_id until this runs (before indexes/inserts)
SELECT public.p4_rename_team_id_columns();

CREATE TABLE IF NOT EXISTS public.agency_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id),
  action VARCHAR(48) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_reputation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason VARCHAR(64) NOT NULL,
  score_after INT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_statistics (
  agency_id UUID PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
  members_active_7d INT DEFAULT 0,
  members_active_30d INT DEFAULT 0,
  growth_rate DECIMAL(8,4) DEFAULT 0,
  retention_rate DECIMAL(8,4) DEFAULT 0,
  invite_open_rate DECIMAL(8,4) DEFAULT 0,
  invite_conversion_rate DECIMAL(8,4) DEFAULT 0,
  fraud_signals INT DEFAULT 0,
  leadership_activity_score INT DEFAULT 0,
  top_recruiter_id UUID REFERENCES public.users(id),
  weak_branch_side VARCHAR(10),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_key VARCHAR(48) NOT NULL,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  score DECIMAL(15,2) NOT NULL DEFAULT 0,
  rank_position INT,
  period_key VARCHAR(16) NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ranking_key, agency_id, period_key)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agency_activity_logs' AND column_name = 'agency_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_agency_activity_agency
      ON public.agency_activity_logs(agency_id, created_at DESC);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agency_reputation_logs' AND column_name = 'agency_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_agency_reputation_agency
      ON public.agency_reputation_logs(agency_id, created_at DESC);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agency_rankings' AND column_name = 'agency_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_agency_rankings_key
      ON public.agency_rankings(ranking_key, period_key, score DESC);
  END IF;
END $$;

-- =============================================================================
-- §I  TREASURY, MODERATION, ONBOARDING, PERMISSIONS, CHAT
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agency_treasury (
  agency_id UUID PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
  bonus_pool_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  rewards_reserved DECIMAL(15,2) NOT NULL DEFAULT 0,
  seasonal_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'EGP',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_reports')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_reports') THEN
    ALTER TABLE public.team_reports RENAME TO agency_reports;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_moderation_logs')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_moderation_logs') THEN
    ALTER TABLE public.team_moderation_logs RENAME TO agency_moderation_logs;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_member_onboarding')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_member_onboarding') THEN
    ALTER TABLE public.team_member_onboarding RENAME TO agency_member_onboarding;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_chat_channels')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_chat_channels') THEN
    ALTER TABLE public.team_chat_channels RENAME TO agency_chat_channels;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.agency_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.users(id),
  reason VARCHAR(48) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'open',
  reviewed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.users(id),
  action VARCHAR(48) NOT NULL,
  target_user_id UUID REFERENCES public.users(id),
  note TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_member_onboarding (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  welcomed BOOLEAN DEFAULT false,
  viewed_intro BOOLEAN DEFAULT false,
  viewed_founder_message BOOLEAN DEFAULT false,
  viewed_recruiter_card BOOLEAN DEFAULT false,
  completed_checklist BOOLEAN DEFAULT false,
  starter_missions_done INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agency_member_onboarding
  ADD COLUMN IF NOT EXISTS viewed_founder_message BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS viewed_recruiter_card BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.agency_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  permission_key VARCHAR(48) NOT NULL,
  granted_to_role VARCHAR(24),
  granted_to_user_id UUID REFERENCES public.users(id),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_permissions_unique
  ON public.agency_permissions(
    agency_id,
    permission_key,
    COALESCE(granted_to_role, ''),
    COALESCE(granted_to_user_id::text, '')
  );

CREATE TABLE IF NOT EXISTS public.agency_transfer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  from_owner_id UUID REFERENCES public.users(id),
  to_owner_id UUID REFERENCES public.users(id),
  transfer_type VARCHAR(24) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  rollback_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  channel_type VARCHAR(32) NOT NULL DEFAULT 'announcements',
  name VARCHAR(80) NOT NULL,
  is_archived BOOLEAN DEFAULT false,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agency_id, channel_type)
);

ALTER TABLE public.agency_reports DROP CONSTRAINT IF EXISTS agency_reports_status_check;
ALTER TABLE public.agency_reports ADD CONSTRAINT agency_reports_status_check CHECK (
  status IN ('open', 'reviewed', 'resolved', 'dismissed')
);

-- §I legacy renames may reintroduce team_id columns
SELECT public.p4_rename_team_id_columns();

-- Ensure treasury + statistics rows for every agency (column-aware)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agencies') THEN
    RETURN;
  END IF;

  IF to_regclass('public.agency_statistics') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'agency_statistics' AND column_name = 'agency_id'
     ) THEN
    EXECUTE $q$
      INSERT INTO public.agency_statistics (agency_id)
      SELECT a.id FROM public.agencies a
      WHERE NOT EXISTS (
        SELECT 1 FROM public.agency_statistics s WHERE s.agency_id = a.id
      )
    $q$;
  END IF;

  IF to_regclass('public.agency_treasury') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'agency_treasury' AND column_name = 'agency_id'
     ) THEN
    EXECUTE $q$
      INSERT INTO public.agency_treasury (agency_id)
      SELECT a.id FROM public.agencies a
      WHERE NOT EXISTS (
        SELECT 1 FROM public.agency_treasury t WHERE t.agency_id = a.id
      )
    $q$;
  END IF;
END $$;

-- Final pass: any agency_* table still on team_id
SELECT public.p4_rename_team_id_columns();

-- =============================================================================
-- §K  LEGACY COMPATIBILITY VIEWS (P5 game_team_progress, legacy API reads)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agencies') THEN
    EXECUTE $v$
      CREATE OR REPLACE VIEW public.teams AS
      SELECT
        id,
        slug,
        name,
        motto,
        logo_url,
        banner_url,
        primary_color AS team_color,
        rank_level AS level,
        owner_id,
        leader_id,
        founder_id,
        total_bv,
        total_members,
        power_score,
        is_public,
        max_members,
        created_at,
        updated_at
      FROM public.agencies
    $v$;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_members') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agency_members' AND column_name = 'agency_id'
    ) THEN
      EXECUTE $v$
        CREATE OR REPLACE VIEW public.team_members AS
        SELECT
          id,
          agency_id AS team_id,
          user_id,
          role,
          contribution_bv,
          joined_at
        FROM public.agency_members
        WHERE COALESCE(status, 'active') = 'active'
      $v$;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agency_members' AND column_name = 'team_id'
    ) THEN
      EXECUTE $v$
        CREATE OR REPLACE VIEW public.team_members AS
        SELECT id, team_id, user_id, role, contribution_bv, joined_at
        FROM public.agency_members
      $v$;
    END IF;
  END IF;
END $$;

-- =============================================================================
-- §L  SYSTEM SETTINGS
-- =============================================================================

-- system_settings.value is TEXT in schema.sql — store JSON as text, parse with ::jsonb when updating
INSERT INTO public.system_settings (key, value) VALUES
  (
    'agency_ecosystem_rules',
    '{
      "creation_roles": ["super_admin", "admin"],
      "staff_roles": ["super_admin", "admin", "franchise"],
      "reserved_slugs": ["admin", "credo", "official", "support", "api", "join"],
      "max_agencies_per_staff_day": 20,
      "invite_throttle_per_hour": 30,
      "allow_agency_switch": false,
      "require_verified_for_public": true,
      "user_can_create_team": false
    }'
  ),
  (
    'agency_role_permissions',
    '{
      "owner": ["all"],
      "manager": ["recruit", "invite", "manage_placements", "analytics", "moderate", "reports", "assign_roles"],
      "recruiter": ["recruit", "invite", "view_analytics"],
      "moderator": ["moderate", "view_members", "reports"],
      "member": ["view_members"]
    }'
  )
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

DO $$
DECLARE
  v_rules TEXT;
  v_patched TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'team_foundation_rules') THEN
    RETURN;
  END IF;

  SELECT value INTO v_rules FROM public.system_settings WHERE key = 'team_foundation_rules';

  BEGIN
    v_patched := jsonb_set(
      COALESCE(NULLIF(trim(v_rules), '')::jsonb, '{}'::jsonb),
      '{user_can_create_team}',
      'false'::jsonb
    )::text;
  EXCEPTION WHEN OTHERS THEN
    v_patched := '{"user_can_create_team":false}'::text;
  END;

  UPDATE public.system_settings
  SET value = v_patched, updated_at = NOW()
  WHERE key = 'team_foundation_rules';
END $$;

-- =============================================================================
-- §M  ROW LEVEL SECURITY (backend service_role bypass pattern)
-- =============================================================================

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'agencies',
    'agency_members',
    'agency_role_definitions',
    'agency_invitations',
    'agency_join_requests',
    'agency_rank_definitions',
    'agency_achievement_definitions',
    'agency_achievements_unlocked',
    'agency_mission_definitions',
    'agency_mission_progress',
    'agency_events',
    'agency_event_entries',
    'agency_activity_logs',
    'agency_reputation_logs',
    'agency_statistics',
    'agency_rankings',
    'agency_treasury',
    'agency_reports',
    'agency_moderation_logs',
    'agency_member_onboarding',
    'agency_permissions',
    'agency_transfer_logs',
    'agency_chat_channels'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)',
        t
      );
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- §N  VERIFICATION REPORT
-- =============================================================================

DO $$
DECLARE
  v_agencies BIGINT := 0;
  v_members BIGINT := 0;
  v_invites BIGINT := 0;
  v_rankings BIGINT := 0;
  v_achievements BIGINT := 0;
  v_join_requests BIGINT := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agencies') THEN
    EXECUTE 'SELECT COUNT(*) FROM public.agencies' INTO v_agencies;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_members') THEN
    EXECUTE 'SELECT COUNT(*) FROM public.agency_members' INTO v_members;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_invitations') THEN
    EXECUTE 'SELECT COUNT(*) FROM public.agency_invitations' INTO v_invites;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_rankings') THEN
    EXECUTE 'SELECT COUNT(*) FROM public.agency_rankings' INTO v_rankings;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_achievements_unlocked') THEN
    EXECUTE 'SELECT COUNT(*) FROM public.agency_achievements_unlocked' INTO v_achievements;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_join_requests') THEN
    EXECUTE 'SELECT COUNT(*) FROM public.agency_join_requests' INTO v_join_requests;
  END IF;

  RAISE NOTICE '=== P4 Agency Migration Verification ===';
  RAISE NOTICE 'agencies:              %', v_agencies;
  RAISE NOTICE 'agency_members:        %', v_members;
  RAISE NOTICE 'agency_invitations:    %', v_invites;
  RAISE NOTICE 'agency_rankings:       %', v_rankings;
  RAISE NOTICE 'achievements_unlocked: %', v_achievements;
  RAISE NOTICE 'agency_join_requests:  %', v_join_requests;
END $$;

-- Human-readable verification (SQL Editor Results tab)
SELECT entity, total FROM (
  SELECT 'agencies'::text AS entity,
    CASE WHEN to_regclass('public.agencies') IS NOT NULL
      THEN (SELECT COUNT(*)::bigint FROM public.agencies) ELSE 0::bigint END AS total
  UNION ALL
  SELECT 'agency_members',
    CASE WHEN to_regclass('public.agency_members') IS NOT NULL
      THEN (SELECT COUNT(*)::bigint FROM public.agency_members) ELSE 0::bigint END
  UNION ALL
  SELECT 'agency_invitations',
    CASE WHEN to_regclass('public.agency_invitations') IS NOT NULL
      THEN (SELECT COUNT(*)::bigint FROM public.agency_invitations) ELSE 0::bigint END
  UNION ALL
  SELECT 'agency_rankings',
    CASE WHEN to_regclass('public.agency_rankings') IS NOT NULL
      THEN (SELECT COUNT(*)::bigint FROM public.agency_rankings) ELSE 0::bigint END
  UNION ALL
  SELECT 'agency_achievements_unlocked',
    CASE WHEN to_regclass('public.agency_achievements_unlocked') IS NOT NULL
      THEN (SELECT COUNT(*)::bigint FROM public.agency_achievements_unlocked) ELSE 0::bigint END
  UNION ALL
  SELECT 'agency_join_requests',
    CASE WHEN to_regclass('public.agency_join_requests') IS NOT NULL
      THEN (SELECT COUNT(*)::bigint FROM public.agency_join_requests) ELSE 0::bigint END
) report
ORDER BY entity;
