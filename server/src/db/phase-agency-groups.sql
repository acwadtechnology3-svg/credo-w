-- =============================================================================
-- Agency Communication & Group Infrastructure
-- Prerequisites: phase-p4-agencies.sql (agencies, agency_members)
-- Run in Supabase SQL Editor — idempotent, safe to re-run
-- =============================================================================

-- Migrate legacy agency_chat_channels → agency_group_channels (after groups exist)
CREATE TABLE IF NOT EXISTS public.agency_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  group_type VARCHAR(32) NOT NULL DEFAULT 'main'
    CHECK (group_type IN ('main', 'event', 'training', 'voice')),
  name VARCHAR(120) NOT NULL,
  description TEXT,
  visibility VARCHAR(24) NOT NULL DEFAULT 'members_only'
    CHECK (visibility IN ('members_only', 'leadership', 'public_preview')),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  voice_ready BOOLEAN NOT NULL DEFAULT false,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_groups_main
  ON public.agency_groups(agency_id) WHERE group_type = 'main' AND NOT is_archived;

CREATE INDEX IF NOT EXISTS idx_agency_groups_agency ON public.agency_groups(agency_id);

CREATE TABLE IF NOT EXISTS public.agency_group_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.agency_groups(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  channel_type VARCHAR(48) NOT NULL DEFAULT 'main',
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(64),
  is_read_only BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  voice_ready BOOLEAN NOT NULL DEFAULT false,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, channel_type)
);

CREATE INDEX IF NOT EXISTS idx_agency_group_channels_agency
  ON public.agency_group_channels(agency_id, sort_order);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agency_group_channels'
  ) THEN
    ALTER TABLE public.agency_group_channels
      DROP CONSTRAINT IF EXISTS agency_group_channels_channel_type_check;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.agency_group_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  role_key VARCHAR(32) NOT NULL,
  label VARCHAR(64) NOT NULL,
  label_ar VARCHAR(64),
  rank INT NOT NULL DEFAULT 10,
  permissions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agency_id, role_key)
);

CREATE TABLE IF NOT EXISTS public.agency_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.agency_groups(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_role VARCHAR(32) NOT NULL DEFAULT 'member',
  can_post BOOLEAN NOT NULL DEFAULT true,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  muted_until TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'left', 'banned', 'pending')),
  last_read_at TIMESTAMPTZ,
  last_read_channel_id UUID REFERENCES public.agency_group_channels(id),
  unread_count INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_group_members_user
  ON public.agency_group_members(user_id, agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_group_members_agency
  ON public.agency_group_members(agency_id, status);

CREATE TABLE IF NOT EXISTS public.agency_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.agency_group_channels(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.agency_groups(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id),
  sender_role VARCHAR(32),
  body TEXT,
  message_type VARCHAR(32) NOT NULL DEFAULT 'text'
    CHECK (message_type IN (
      'text', 'image', 'file', 'voice', 'system', 'onboarding_card',
      'achievement_card', 'rank_card', 'package_card', 'welcome', 'ai'
    )),
  reply_to_id UUID REFERENCES public.agency_messages(id),
  mentions JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_by UUID REFERENCES public.users(id),
  deleted_for_all_at TIMESTAMPTZ,
  deleted_for_all_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agency_messages_channel
  ON public.agency_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agency_messages_agency
  ON public.agency_messages(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agency_messages_pinned
  ON public.agency_messages(channel_id) WHERE is_pinned AND NOT is_deleted;

CREATE TABLE IF NOT EXISTS public.agency_message_user_hides (
  message_id UUID NOT NULL REFERENCES public.agency_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_message_user_hides_user
  ON public.agency_message_user_hides(user_id);

CREATE TABLE IF NOT EXISTS public.agency_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.agency_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.agency_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.agency_messages(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  mime_type VARCHAR(128),
  size_bytes INT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_group_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES public.users(id),
  ban_type VARCHAR(20) NOT NULL DEFAULT 'temporary'
    CHECK (ban_type IN ('temporary', 'permanent')),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  lifted_at TIMESTAMPTZ,
  lifted_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_group_bans_active
  ON public.agency_group_bans(agency_id, user_id) WHERE is_active;

CREATE TABLE IF NOT EXISTS public.agency_group_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  muted_by UUID REFERENCES public.users(id),
  mute_type VARCHAR(20) NOT NULL DEFAULT 'temporary'
    CHECK (mute_type IN ('temporary', 'permanent')),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_group_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  warned_by UUID REFERENCES public.users(id),
  reason TEXT NOT NULL,
  severity VARCHAR(16) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.agency_groups(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.agency_group_channels(id) ON DELETE SET NULL,
  code VARCHAR(24) NOT NULL UNIQUE,
  created_by UUID REFERENCES public.users(id),
  max_uses INT DEFAULT 0,
  use_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_group_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.agency_groups(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES public.agency_group_channels(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.users(id),
  action VARCHAR(64) NOT NULL,
  target_user_id UUID REFERENCES public.users(id),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_group_activity_agency
  ON public.agency_group_activity_logs(agency_id, created_at DESC);

-- Voice / live rooms (future-ready)
CREATE TABLE IF NOT EXISTS public.agency_voice_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.agency_groups(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.agency_group_channels(id) ON DELETE SET NULL,
  room_type VARCHAR(32) NOT NULL DEFAULT 'voice'
    CHECK (room_type IN ('voice', 'live_onboarding', 'leadership_meeting', 'training')),
  title VARCHAR(120) NOT NULL,
  host_id UUID REFERENCES public.users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'ended')),
  max_participants INT DEFAULT 50,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bootstrap function: default group structure for an agency
CREATE OR REPLACE FUNCTION public.bootstrap_agency_group_infra(
  p_agency_id UUID,
  p_owner_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_group_id UUID;
  v_agency_name VARCHAR(120);
BEGIN
  SELECT name INTO v_agency_name FROM public.agencies WHERE id = p_agency_id;
  IF v_agency_name IS NULL THEN
    RAISE EXCEPTION 'Agency not found';
  END IF;

  SELECT id INTO v_group_id FROM public.agency_groups
  WHERE agency_id = p_agency_id AND group_type = 'main' AND NOT is_archived
  LIMIT 1;

  IF v_group_id IS NULL THEN
    INSERT INTO public.agency_groups (agency_id, group_type, name, created_by, voice_ready)
    VALUES (p_agency_id, 'main', COALESCE(v_agency_name, 'Agency') || ' HQ', p_owner_id, true)
    RETURNING id INTO v_group_id;
  END IF;

  INSERT INTO public.agency_group_channels (group_id, agency_id, channel_type, name, is_read_only, sort_order, voice_ready)
  VALUES
    (v_group_id, p_agency_id, 'main', 'القناة العامة', false, 10, false),
    (v_group_id, p_agency_id, 'announcements', 'الإعلانات', true, 20, false),
    (v_group_id, p_agency_id, 'leadership', 'غرفة القيادة', false, 30, true),
    (v_group_id, p_agency_id, 'onboarding', 'الترحيب والانضمام', false, 40, false),
    (v_group_id, p_agency_id, 'support', 'الدعم الداخلي', false, 50, false)
  ON CONFLICT (group_id, channel_type) DO NOTHING;

  INSERT INTO public.agency_group_roles (agency_id, role_key, label, label_ar, rank, permissions_json)
  VALUES
    (p_agency_id, 'owner', 'Agency Owner', 'مالك الوكالة', 100, '["all"]'::jsonb),
    (p_agency_id, 'agency_admin', 'Agency Admin', 'مدير الوكالة', 95, '["moderate","manage","announce","invite","analytics"]'::jsonb),
    (p_agency_id, 'recruiter_leader', 'Recruiter Leader', 'قائد التجنيد', 70, '["invite","onboarding","moderate_lite"]'::jsonb),
    (p_agency_id, 'moderator', 'Moderator', 'مشرف', 65, '["moderate","delete_messages"]'::jsonb),
    (p_agency_id, 'member', 'Member', 'عضو', 10, '["send","react","media","voice"]'::jsonb)
  ON CONFLICT (agency_id, role_key) DO NOTHING;

  IF p_owner_id IS NOT NULL THEN
    INSERT INTO public.agency_group_members (group_id, agency_id, user_id, group_role, can_post, status)
    VALUES (v_group_id, p_agency_id, p_owner_id, 'owner', true, 'active')
    ON CONFLICT (group_id, user_id) DO UPDATE SET
      group_role = 'owner',
      status = 'active',
      can_post = true,
      left_at = NULL;
  END IF;

  RETURN v_group_id;
END;
$$;

-- Backfill all agencies missing group infra
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT a.id, a.owner_id FROM public.agencies a WHERE a.status = 'active' OR a.status IS NULL
  LOOP
    PERFORM public.bootstrap_agency_group_infra(r.id, r.owner_id);
  END LOOP;
END $$;

-- RLS
ALTER TABLE public.agency_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_group_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_group_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_message_user_hides ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.agency_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_group_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_group_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_group_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_group_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_voice_rooms ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'agency_groups', 'agency_group_channels', 'agency_group_roles', 'agency_group_members',
    'agency_messages', 'agency_message_user_hides', 'agency_message_reactions', 'agency_message_attachments',
    'agency_group_bans', 'agency_group_mutes', 'agency_group_warnings',
    'agency_group_invites', 'agency_group_activity_logs', 'agency_voice_rooms'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_group_channels TO authenticated;
GRANT SELECT ON public.agency_group_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_message_user_hides TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.agency_messages TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.agency_message_reactions TO authenticated;
GRANT SELECT, INSERT ON public.agency_message_attachments TO authenticated;
GRANT SELECT ON public.agency_voice_rooms TO authenticated;

-- Realtime (enable in Supabase dashboard if using client subscriptions)
-- ALTER PUBLICATION supabase_realtime ADD TABLE agency_messages;
