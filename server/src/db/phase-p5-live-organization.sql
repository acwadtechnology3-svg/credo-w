-- Phase 5: Live Organization — activity feed, agency XP/prestige, missions, leaderboards
-- Run after: schema.sql, phase-p5-gamification.sql, phase-p4-agencies.sql (agencies optional for FK block)
-- Extends existing game_* and agency_* systems — does not replace them.

-- =============================================================================
-- Live activity feed (user-facing, realtime-ready)
-- =============================================================================
CREATE TABLE IF NOT EXISTS agency_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID,
  event_type VARCHAR(48) NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(160) NOT NULL,
  body TEXT,
  icon VARCHAR(16) DEFAULT '⚡',
  severity VARCHAR(16) DEFAULT 'info' CHECK (severity IN ('info','success','warning','epic','legendary')),
  sound_key VARCHAR(32),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_activity_feed_agency
  ON agency_activity_feed(agency_id, created_at DESC) WHERE agency_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agency_activity_feed_global
  ON agency_activity_feed(created_at DESC) WHERE agency_id IS NULL;

-- =============================================================================
-- Agency-scoped member XP & levels
-- =============================================================================
CREATE TABLE IF NOT EXISTS agency_member_levels (
  level INT PRIMARY KEY,
  title_en VARCHAR(80) NOT NULL,
  title_ar VARCHAR(80),
  xp_required INT NOT NULL,
  unlocks_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agency_member_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID,
  xp_total INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  mission_score INT NOT NULL DEFAULT 0,
  prestige_points INT NOT NULL DEFAULT 0,
  recruiter_score INT NOT NULL DEFAULT 0,
  last_xp_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, agency_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_member_xp_agency ON agency_member_xp(agency_id, xp_total DESC);

CREATE TABLE IF NOT EXISTS agency_xp_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID,
  amount INT NOT NULL,
  source VARCHAR(64) NOT NULL,
  reference_id UUID,
  idempotency_key VARCHAR(128) UNIQUE,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_xp_ledger_user ON agency_xp_ledger(user_id, created_at DESC);

-- =============================================================================
-- Agency prestige tiers
-- =============================================================================
CREATE TABLE IF NOT EXISTS agency_prestige_tiers (
  tier_key VARCHAR(32) PRIMARY KEY,
  title_en VARCHAR(64) NOT NULL,
  title_ar VARCHAR(64),
  min_level INT NOT NULL DEFAULT 1,
  min_xp INT NOT NULL DEFAULT 0,
  min_prestige_points INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  visual_effect VARCHAR(32) NOT NULL DEFAULT 'glow_bronze',
  unlocks_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS agency_member_prestige (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID,
  tier_key VARCHAR(32) NOT NULL REFERENCES agency_prestige_tiers(tier_key),
  prestige_count INT NOT NULL DEFAULT 0,
  equipped_frame VARCHAR(64),
  equipped_aura VARCHAR(64),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, agency_id)
);

-- =============================================================================
-- Agency missions & seasonal events
-- =============================================================================
CREATE TABLE IF NOT EXISTS agency_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(64) UNIQUE NOT NULL,
  agency_id UUID,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  icon VARCHAR(16) DEFAULT '🎯',
  mission_type VARCHAR(24) NOT NULL DEFAULT 'daily'
    CHECK (mission_type IN ('daily','weekly','monthly','seasonal','flash')),
  action_trigger VARCHAR(64) NOT NULL,
  target_count INT NOT NULL DEFAULT 1,
  xp_reward INT NOT NULL DEFAULT 0,
  pearl_reward INT NOT NULL DEFAULT 0,
  prestige_points INT NOT NULL DEFAULT 0,
  cosmetic_reward_key VARCHAR(64),
  min_level INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  event_tag VARCHAR(48)
);

CREATE TABLE IF NOT EXISTS agency_member_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES agency_missions(id) ON DELETE CASCADE,
  agency_id UUID,
  period_key VARCHAR(24) NOT NULL,
  current_count INT NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  UNIQUE(user_id, mission_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_agency_member_missions_user ON agency_member_missions(user_id, period_key);

CREATE TABLE IF NOT EXISTS agency_seasonal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(48) UNIQUE NOT NULL,
  agency_id UUID,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  xp_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  theme_key VARCHAR(32) DEFAULT 'neon',
  rewards_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- =============================================================================
-- Agency leaderboards
-- =============================================================================
CREATE TABLE IF NOT EXISTS agency_leaderboards (
  key VARCHAR(48) PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  metric VARCHAR(32) NOT NULL CHECK (metric IN (
    'recruiter','bv','cv','xp','prestige','mission_score','onboarding','growth','referrals'
  )),
  scope VARCHAR(24) NOT NULL DEFAULT 'agency' CHECK (scope IN ('agency','global')),
  refresh_minutes INT NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS agency_leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_key VARCHAR(48) NOT NULL REFERENCES agency_leaderboards(key) ON DELETE CASCADE,
  agency_id UUID,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_key VARCHAR(16) NOT NULL,
  score DECIMAL(15,2) NOT NULL DEFAULT 0,
  rank_position INT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(leaderboard_key, user_id, period_key, agency_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_lb_entries ON agency_leaderboard_entries(leaderboard_key, period_key, score DESC);

CREATE TABLE IF NOT EXISTS agency_leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_key VARCHAR(48) NOT NULL,
  agency_id UUID,
  period_key VARCHAR(16) NOT NULL,
  snapshot_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Online presence (tree indicators)
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  socket_id VARCHAR(64)
);

-- =============================================================================
-- Seeds
-- =============================================================================
INSERT INTO agency_member_levels (level, title_en, title_ar, xp_required, sort_order) VALUES
  (1, 'Recruit', 'مجند', 0, 1),
  (2, 'Agent', 'وكيل', 500, 2),
  (3, 'Operative', 'عميل ميداني', 1500, 3),
  (4, 'Strategist', 'استراتيجي', 4000, 4),
  (5, 'Commander', 'قائد', 9000, 5),
  (6, 'Elite', 'نخبة', 18000, 6),
  (7, 'Legend', 'أسطورة', 35000, 7)
ON CONFLICT (level) DO NOTHING;

INSERT INTO agency_prestige_tiers (tier_key, title_en, title_ar, min_level, min_xp, min_prestige_points, sort_order, visual_effect) VALUES
  ('bronze', 'Bronze', 'برونزي', 1, 0, 0, 1, 'glow_bronze'),
  ('silver', 'Silver', 'فضي', 2, 500, 50, 2, 'glow_silver'),
  ('gold', 'Gold', 'ذهبي', 3, 2000, 200, 3, 'glow_gold'),
  ('diamond', 'Diamond', 'ماسي', 4, 6000, 600, 4, 'glow_diamond'),
  ('master', 'Master', 'ماستر', 5, 12000, 1200, 5, 'holographic'),
  ('legend', 'Legend', 'أسطوري', 6, 25000, 2500, 6, 'aura_legend'),
  ('immortal', 'Immortal', 'خالد', 7, 50000, 5000, 7, 'founder_aura')
ON CONFLICT (tier_key) DO NOTHING;

INSERT INTO agency_leaderboards (key, label, metric, scope) VALUES
  ('global_recruiter', 'Top Recruiters', 'recruiter', 'global'),
  ('monthly_recruiter', 'Monthly Recruiters', 'recruiter', 'global'),
  ('agency_growth', 'Agency Growth', 'growth', 'agency'),
  ('agency_bv', 'BV Leaders', 'bv', 'agency'),
  ('agency_prestige', 'Prestige', 'prestige', 'agency'),
  ('mission_score', 'Mission Heroes', 'mission_score', 'global'),
  ('onboarding_champions', 'Onboarding Champions', 'onboarding', 'global')
ON CONFLICT (key) DO NOTHING;

INSERT INTO agency_missions (key, title, description, icon, mission_type, action_trigger, target_count, xp_reward, pearl_reward, prestige_points, sort_order) VALUES
  ('daily_login', 'Daily Check-in', 'Log in today', '🔥', 'daily', 'login', 1, 25, 5, 2, 1),
  ('recruit_one', 'Fresh Blood', 'Enroll 1 new member', '⚔️', 'daily', 'referral_join', 1, 100, 20, 10, 2),
  ('bv_500_week', 'Volume Surge', '500 BV this week', '💎', 'weekly', 'bv_credit', 500, 300, 50, 25, 3),
  ('onboarding_complete', 'Guide the Path', 'Complete tree onboarding', '🎓', 'weekly', 'onboarding_complete', 1, 200, 30, 15, 4),
  ('balance_legs', 'Binary Balance', 'Balance left/right legs', '⚖️', 'weekly', 'leg_balance', 1, 250, 40, 20, 5),
  ('rank_up_month', 'Rank Climber', 'Achieve rank promotion', '🏆', 'monthly', 'rank_up', 1, 500, 100, 50, 6),
  ('invite_accepted', 'Invitation Master', '3 invites accepted', '📨', 'weekly', 'invite_accepted', 3, 350, 60, 30, 7)
ON CONFLICT (key) DO NOTHING;

INSERT INTO game_achievement_definitions (key, category, title, description, icon, rarity, condition_type, condition_value, xp_reward, pearl_reward, sort_order)
VALUES
  ('first_recruit', 'recruitment', 'First Recruit', 'Your first team member', '🎯', 'common', 'direct_count', 1, 150, 25, 20),
  ('elite_sponsor', 'recruitment', 'Elite Sponsor', '10 direct referrals', '👑', 'epic', 'direct_count', 10, 800, 150, 21),
  ('binary_master', 'team_growth', 'Binary Master', 'Balanced binary legs', '⚖️', 'rare', 'leg_balance', 1, 400, 75, 22),
  ('million_bv', 'team_growth', 'Million BV', '1M BV in organization', '💠', 'legendary', 'team_bv', 1000000, 2000, 500, 23),
  ('legendary_recruiter', 'recruitment', 'Legendary Recruiter', '50 directs', '🌟', 'mythic', 'direct_count', 50, 3000, 800, 24),
  ('founder_circle', 'leadership', 'Founder Circle', 'Agency founder role', '🏛️', 'legendary', 'agency_role', 1, 1000, 200, 25),
  ('seven_expansion', 'purchases', 'Seven Expansion', 'Septuple package active', '7️⃣', 'epic', 'package_level', 7, 600, 120, 26),
  ('rank_champion', 'rank', 'Rank Champion', 'Top 10% rank tier', '🏆', 'epic', 'rank_percentile', 90, 500, 100, 27)
ON CONFLICT (key) DO NOTHING;

-- Optional agency FKs when agencies table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agencies') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agency_activity_feed_agency_id_fkey') THEN
      ALTER TABLE agency_activity_feed ADD CONSTRAINT agency_activity_feed_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agency_member_xp_agency_id_fkey') THEN
      ALTER TABLE agency_member_xp ADD CONSTRAINT agency_member_xp_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
