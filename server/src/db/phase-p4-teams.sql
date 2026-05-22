-- DEPRECATED: superseded by phase-p4-agencies.sql (Agency Ecosystem refactor).
-- Run phase-p4-agencies.sql instead. This file is kept for historical reference only.
--
-- Phase P4 — Team Foundation Ecosystem (run after phase-p0-foundation.sql)
-- Guild system: identity, hierarchy, reputation, missions, competitions, chat prep

-- ─── 1. Extend teams ───────────────────────────────────────────────
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS short_code VARCHAR(12),
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(16) DEFAULT '#534AB7',
ADD COLUMN IF NOT EXISTS glow_theme VARCHAR(32) DEFAULT 'purple_pulse',
ADD COLUMN IF NOT EXISTS team_type VARCHAR(32) DEFAULT 'leadership',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS mission TEXT,
ADD COLUMN IF NOT EXISTS leadership_statement TEXT,
ADD COLUMN IF NOT EXISTS activity_score INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_score INT NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20) NOT NULL DEFAULT 'new',
ADD COLUMN IF NOT EXISTS prestige_score INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS prestige_tier VARCHAR(20) DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS invite_conversions INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS welcome_video_url VARCHAR,
ADD COLUMN IF NOT EXISTS branding_json JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS chat_prep JSONB NOT NULL DEFAULT '{"channels":["announcements","general"],"voice_ready":false}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_short_code ON teams(short_code) WHERE short_code IS NOT NULL;

ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_status_check;
ALTER TABLE teams ADD CONSTRAINT teams_status_check CHECK (
  status IN ('active','suspended','archived','pending_review')
);

ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_team_type_check;
ALTER TABLE teams ADD CONSTRAINT teams_team_type_check CHECK (
  team_type IN ('competitive','leadership','trading','entrepreneurship','elite','regional','university','vip','general')
);

-- ─── 2. Expanded member roles ──────────────────────────────────────
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check CHECK (
  role IN ('founder','co_leader','leader','recruiter','mentor','elite_member','officer','member')
);

UPDATE team_members SET role = 'founder' WHERE role = 'leader';
UPDATE team_members SET role = 'co_leader' WHERE role = 'officer';

-- ─── 3. Team level definitions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_level_definitions (
  level INT PRIMARY KEY,
  title_en VARCHAR(80) NOT NULL,
  title_ar VARCHAR(80),
  min_power_score INT NOT NULL,
  min_members INT NOT NULL DEFAULT 0,
  max_members_cap INT NOT NULL DEFAULT 500,
  perks_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO team_level_definitions (level, title_en, title_ar, min_power_score, min_members, max_members_cap, perks_json) VALUES
  (1, 'Guild Initiate', 'مبتدئ', 0, 1, 25, '{"badge":"bronze"}'::jsonb),
  (2, 'Rising Clan', 'صاعد', 500, 5, 50, '{}'::jsonb),
  (3, 'War Band', 'فرقة', 2000, 15, 100, '{}'::jsonb),
  (4, 'Elite Order', 'نخبة', 8000, 40, 250, '{"verified_eligible":true}'::jsonb),
  (5, 'Legendary Empire', 'أسطوري', 25000, 100, 500, '{"prestige_glow":true}'::jsonb)
ON CONFLICT (level) DO NOTHING;

-- ─── 4. Team achievements ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_achievement_definitions (
  key VARCHAR(48) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  icon VARCHAR(16) DEFAULT '🏆',
  condition_type VARCHAR(48) NOT NULL,
  condition_value INT NOT NULL,
  pearl_reward INT DEFAULT 0,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS team_achievements_unlocked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  achievement_key VARCHAR(48) NOT NULL REFERENCES team_achievement_definitions(key),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, achievement_key)
);

INSERT INTO team_achievement_definitions (key, title, description, icon, condition_type, condition_value, pearl_reward, sort_order) VALUES
  ('first_recruit', 'First Recruit', 'First member joined your guild', '👤', 'members', 2, 100, 1),
  ('team_10', 'Squad of Ten', '10 members in your guild', '🛡️', 'members', 10, 300, 2),
  ('team_100', 'Century Guild', '100 members milestone', '💯', 'members', 100, 2000, 3),
  ('bv_10k', '10K Team BV', 'Collective 10,000 BV', '⚡', 'total_bv', 10000, 500, 4),
  ('legendary_recruiter', 'Legendary Recruiter', '50 invite conversions', '🌟', 'invite_conversions', 50, 1000, 5),
  ('elite_founder', 'Elite Founder', 'Reach guild level 4', '👑', 'team_level', 4, 750, 6),
  ('diamond_team', 'Diamond Team', '5000+ prestige score', '💎', 'prestige_score', 5000, 1500, 7)
ON CONFLICT (key) DO NOTHING;

-- ─── 5. Team missions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_mission_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(48) UNIQUE NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  mission_type VARCHAR(24) DEFAULT 'weekly' CHECK (mission_type IN ('daily','weekly','seasonal')),
  target_metric VARCHAR(48) NOT NULL,
  target_value INT NOT NULL,
  pearl_reward INT DEFAULT 0,
  xp_reward INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS team_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES team_mission_definitions(id),
  period_key VARCHAR(16) NOT NULL,
  current_value INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  reward_claimed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(team_id, mission_id, period_key)
);

INSERT INTO team_mission_definitions (key, title, description, mission_type, target_metric, target_value, pearl_reward, xp_reward) VALUES
  ('recruit_5', 'Recruit 5', 'Add 5 new members this week', 'weekly', 'new_members', 5, 200, 100),
  ('bv_10k_week', '10K BV Sprint', 'Generate 10,000 team BV', 'weekly', 'bv_delta', 10000, 400, 200),
  ('activate_3', 'Activate Three', '3 members complete activation', 'weekly', 'activations', 3, 150, 75)
ON CONFLICT (key) DO NOTHING;

-- ─── 6. Activity & reputation logs ───────────────────────────────
CREATE TABLE IF NOT EXISTS team_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  action VARCHAR(48) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_activity_team ON team_activity_logs(team_id, created_at DESC);

CREATE TABLE IF NOT EXISTS team_reputation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason VARCHAR(64) NOT NULL,
  score_after INT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 7. Team statistics snapshots ────────────────────────────────
CREATE TABLE IF NOT EXISTS team_statistics (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  members_active_7d INT DEFAULT 0,
  members_active_30d INT DEFAULT 0,
  growth_rate DECIMAL(8,4) DEFAULT 0,
  invite_open_rate DECIMAL(8,4) DEFAULT 0,
  invite_conversion_rate DECIMAL(8,4) DEFAULT 0,
  retention_rate DECIMAL(8,4) DEFAULT 0,
  top_performer_id UUID REFERENCES users(id),
  weak_branch_side VARCHAR(10),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 8. Team-scoped invite links ───────────────────────────────────
CREATE TABLE IF NOT EXISTS team_recruit_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  code VARCHAR(32) UNIQUE NOT NULL,
  placement_side VARCHAR(10) DEFAULT 'AUTO',
  theme VARCHAR(32) DEFAULT 'guild',
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_recruit_team ON team_recruit_links(team_id);

-- ─── 9. Competitions (seasonal prep) ─────────────────────────────
CREATE TABLE IF NOT EXISTS team_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  season_key VARCHAR(32) NOT NULL,
  metric VARCHAR(48) NOT NULL DEFAULT 'power_score',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rewards_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_competition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES team_competitions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  score DECIMAL(15,2) NOT NULL DEFAULT 0,
  rank_position INT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(competition_id, team_id)
);

-- ─── 10. Chat architecture prep (no realtime yet) ──────────────────
CREATE TABLE IF NOT EXISTS team_chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  channel_type VARCHAR(32) NOT NULL DEFAULT 'announcements',
  name VARCHAR(80) NOT NULL,
  is_archived BOOLEAN DEFAULT false,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, channel_type)
);

-- ─── 11. Moderation ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  reporter_id UUID NOT NULL REFERENCES users(id),
  reason VARCHAR(48) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved','dismissed')),
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(48) NOT NULL,
  target_user_id UUID REFERENCES users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 12. Onboarding checklist per member ───────────────────────────
CREATE TABLE IF NOT EXISTS team_member_onboarding (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  welcomed BOOLEAN DEFAULT false,
  viewed_intro BOOLEAN DEFAULT false,
  completed_checklist BOOLEAN DEFAULT false,
  starter_missions_done INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 13. System settings for SA ────────────────────────────────────
INSERT INTO system_settings (key, value) VALUES
  ('team_foundation_rules', '{"min_package_level":1,"reserved_slugs":["admin","credo","official","support"],"max_teams_per_user":1,"invite_throttle_per_hour":30}'::jsonb),
  ('team_role_permissions', '{"founder":["all"],"co_leader":["invite","moderate","analytics"],"recruiter":["invite"],"mentor":["invite"],"elite_member":["view"],"member":["view"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'team_level_definitions','team_achievement_definitions','team_achievements_unlocked',
    'team_mission_definitions','team_mission_progress','team_activity_logs',
    'team_reputation_logs','team_statistics','team_recruit_links',
    'team_competitions','team_competition_entries','team_chat_channels',
    'team_reports','team_moderation_logs','team_member_onboarding'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
      EXECUTE format('CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;
