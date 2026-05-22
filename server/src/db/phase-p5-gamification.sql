-- Phase P5: Gamification and Prestige Engine
-- Run after schema.sql (users table required).
-- Bootstraps user_gamification if phase-profile-identity.sql was not run.
-- Recommended: phase-pearls-wallet.sql and phase-p4-teams.sql first.

-- 0. Bootstrap profile gamification
CREATE TABLE IF NOT EXISTS user_gamification (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  prestige INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_active_date DATE,
  profile_banner_url VARCHAR,
  is_public BOOLEAN DEFAULT false,
  share_slug VARCHAR(32) UNIQUE,
  power_score INT DEFAULT 0,
  network_score INT DEFAULT 0,
  referral_score INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievement_definitions (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  icon VARCHAR(32) DEFAULT '🏆',
  tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum','legendary')),
  xp_reward INT DEFAULT 0,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(64) NOT NULL REFERENCES achievement_definitions(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS rank_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank_id UUID REFERENCES ranks(id),
  rank_name VARCHAR(80),
  reached_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO achievement_definitions (id, title, description, icon, tier, xp_reward, sort_order) VALUES
  ('first_referral', 'First Blood', 'Enrolled your first direct referral', '⚔️', 'bronze', 100, 1),
  ('three_directs', 'Squad Leader', '3 active direct referrals', '🛡️', 'silver', 250, 2),
  ('rank_bronze', 'Rank Climber', 'Advanced beyond BAP rank', '📈', 'silver', 300, 3),
  ('bv_1000', 'Volume Hunter', '1,000+ matching BV in network', '💎', 'gold', 500, 4),
  ('team_joined', 'Clan Member', 'Joined a Credo team', '🏰', 'bronze', 150, 5),
  ('streak_7', 'On Fire', '7-day activity streak', '🔥', 'gold', 400, 6),
  ('package_triple', 'Triple Threat', 'Activated Triple package', '📦', 'gold', 350, 7),
  ('wallet_earner', 'First Commission', 'Earned first wallet commission', '💰', 'bronze', 200, 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_gamification (user_id, share_slug)
SELECT id, LOWER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 12))
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- 1. Extend user_gamification (P5 columns)
ALTER TABLE user_gamification
ADD COLUMN IF NOT EXISTS xp_global INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_seasonal INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_team INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_leadership INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS prestige_tier VARCHAR(32) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS prestige_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS equipped_title_key VARCHAR(64),
ADD COLUMN IF NOT EXISTS equipped_frame_key VARCHAR(64),
ADD COLUMN IF NOT EXISTS equipped_theme_key VARCHAR(64),
ADD COLUMN IF NOT EXISTS profile_card_json JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS season_id UUID,
ADD COLUMN IF NOT EXISTS pearls_spent_lifetime INT NOT NULL DEFAULT 0;

UPDATE user_gamification SET xp_global = COALESCE(xp, 0) WHERE xp_global = 0 AND COALESCE(xp, 0) > 0;

-- 2. XP ledger
CREATE TABLE IF NOT EXISTS game_xp_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  xp_type VARCHAR(24) NOT NULL CHECK (xp_type IN ('global','seasonal','team','leadership')),
  amount INT NOT NULL,
  source VARCHAR(64) NOT NULL,
  reference_id UUID,
  idempotency_key VARCHAR(128),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_game_xp_ledger_user ON game_xp_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_xp_ledger_source ON game_xp_ledger(user_id, source, created_at DESC);

-- 3. Admin XP rules
CREATE TABLE IF NOT EXISTS game_xp_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key VARCHAR(64) UNIQUE NOT NULL,
  label VARCHAR(120) NOT NULL,
  xp_global INT NOT NULL DEFAULT 0,
  xp_seasonal INT NOT NULL DEFAULT 0,
  xp_team INT NOT NULL DEFAULT 0,
  xp_leadership INT NOT NULL DEFAULT 0,
  pearl_bonus INT NOT NULL DEFAULT 0,
  cooldown_seconds INT NOT NULL DEFAULT 0,
  max_per_hour INT NOT NULL DEFAULT 20,
  is_active BOOLEAN NOT NULL DEFAULT true,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Level definitions
CREATE TABLE IF NOT EXISTS game_level_definitions (
  level INT PRIMARY KEY,
  title_en VARCHAR(80) NOT NULL,
  title_ar VARCHAR(80),
  xp_required INT NOT NULL,
  rarity VARCHAR(20) NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary','mythic')),
  unlocks_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0
);

-- 5. Prestige definitions
CREATE TABLE IF NOT EXISTS game_prestige_definitions (
  tier_key VARCHAR(32) PRIMARY KEY,
  title_en VARCHAR(80) NOT NULL,
  title_ar VARCHAR(80),
  min_level INT NOT NULL DEFAULT 10,
  min_xp_global INT NOT NULL DEFAULT 0,
  min_achievements INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  rewards_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  visual_effect VARCHAR(32) DEFAULT 'glow_gold'
);

-- 6. Achievement engine
CREATE TABLE IF NOT EXISTS game_achievement_definitions (
  key VARCHAR(64) PRIMARY KEY,
  category VARCHAR(32) NOT NULL CHECK (category IN (
    'recruitment','purchases','leadership','team_growth','wallet','streaks',
    'rank','competitions','referrals','events','activity'
  )),
  title VARCHAR(120) NOT NULL,
  description TEXT,
  icon VARCHAR(16) DEFAULT '🏆',
  rarity VARCHAR(20) NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary','mythic')),
  condition_type VARCHAR(48) NOT NULL,
  condition_value INT NOT NULL DEFAULT 1,
  xp_reward INT NOT NULL DEFAULT 0,
  pearl_reward INT NOT NULL DEFAULT 0,
  cosmetic_unlock_key VARCHAR(64),
  title_unlock_key VARCHAR(64),
  is_secret BOOLEAN NOT NULL DEFAULT false,
  is_limited BOOLEAN NOT NULL DEFAULT false,
  available_until TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS game_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key VARCHAR(64) NOT NULL REFERENCES game_achievement_definitions(key),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claim_idempotency_key VARCHAR(128),
  UNIQUE(user_id, achievement_key)
);

-- 7. Missions
CREATE TABLE IF NOT EXISTS game_mission_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(64) UNIQUE NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  icon VARCHAR(16) DEFAULT '🎯',
  mission_type VARCHAR(24) NOT NULL DEFAULT 'daily' CHECK (mission_type IN ('daily','weekly','monthly','seasonal','flash','event')),
  action_trigger VARCHAR(64) NOT NULL,
  target_count INT NOT NULL DEFAULT 1,
  xp_reward INT NOT NULL DEFAULT 0,
  pearl_reward INT NOT NULL DEFAULT 0,
  booster_key VARCHAR(48),
  cosmetic_reward_key VARCHAR(64),
  min_level INT NOT NULL DEFAULT 1,
  rarity VARCHAR(20) NOT NULL DEFAULT 'common',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  event_tag VARCHAR(48)
);

CREATE TABLE IF NOT EXISTS game_user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES game_mission_definitions(id) ON DELETE CASCADE,
  period_key VARCHAR(24) NOT NULL,
  current_count INT NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  claim_idempotency_key VARCHAR(128),
  UNIQUE(user_id, mission_id, period_key)
);
CREATE INDEX IF NOT EXISTS idx_game_user_missions_user ON game_user_missions(user_id, period_key);

-- 8. Streaks
CREATE TABLE IF NOT EXISTS game_streak_definitions (
  streak_key VARCHAR(32) PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  max_days INT NOT NULL DEFAULT 365,
  pearl_per_day INT NOT NULL DEFAULT 10,
  xp_per_day INT NOT NULL DEFAULT 25,
  milestone_json JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS game_user_streaks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streak_key VARCHAR(32) NOT NULL REFERENCES game_streak_definitions(streak_key),
  current_days INT NOT NULL DEFAULT 0,
  longest_days INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  freeze_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, streak_key)
);

-- 9. Titles and cosmetics
CREATE TABLE IF NOT EXISTS game_title_definitions (
  key VARCHAR(64) PRIMARY KEY,
  title_en VARCHAR(80) NOT NULL,
  title_ar VARCHAR(80),
  rarity VARCHAR(20) NOT NULL DEFAULT 'rare',
  unlock_source VARCHAR(48) NOT NULL DEFAULT 'achievement',
  unlock_ref VARCHAR(64),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS game_user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_key VARCHAR(64) NOT NULL REFERENCES game_title_definitions(key),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, title_key)
);

CREATE TABLE IF NOT EXISTS game_cosmetic_definitions (
  key VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  cosmetic_type VARCHAR(32) NOT NULL CHECK (cosmetic_type IN (
    'profile_theme','frame','avatar_effect','team_banner','invite_theme',
    'rank_animation','card_skin','background'
  )),
  rarity VARCHAR(20) NOT NULL DEFAULT 'common',
  pearl_cost INT NOT NULL DEFAULT 0,
  unlock_level INT,
  unlock_prestige VARCHAR(32),
  visual_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_limited BOOLEAN NOT NULL DEFAULT false,
  available_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cosmetic_key VARCHAR(64) NOT NULL REFERENCES game_cosmetic_definitions(key),
  acquired_via VARCHAR(32) NOT NULL DEFAULT 'unlock',
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, cosmetic_key)
);

-- 10. Seasons and FOMO events
CREATE TABLE IF NOT EXISTS game_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(48) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  reset_seasonal_xp BOOLEAN NOT NULL DEFAULT true,
  theme_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_season_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES game_seasons(id) ON DELETE CASCADE,
  min_seasonal_xp INT NOT NULL DEFAULT 0,
  rank_position_max INT,
  reward_type VARCHAR(32) NOT NULL CHECK (reward_type IN ('cosmetic','title','pearls','xp','booster')),
  reward_ref VARCHAR(64) NOT NULL,
  reward_amount INT NOT NULL DEFAULT 0,
  rarity VARCHAR(20) NOT NULL DEFAULT 'epic',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_limited_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(48) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  event_type VARCHAR(32) NOT NULL DEFAULT 'multiplier' CHECK (event_type IN ('multiplier','exclusive','founder','countdown')),
  multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  applies_to TEXT[] NOT NULL DEFAULT '{}',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rewards_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 11. Boosters
CREATE TABLE IF NOT EXISTS game_booster_definitions (
  key VARCHAR(48) PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  booster_type VARCHAR(32) NOT NULL CHECK (booster_type IN ('xp','recruitment','pearl','event','bv')),
  multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.5,
  duration_hours INT NOT NULL DEFAULT 24,
  is_stackable BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS game_user_boosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booster_key VARCHAR(48) NOT NULL REFERENCES game_booster_definitions(key),
  multiplier DECIMAL(4,2) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  source VARCHAR(48) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_game_user_boosters_active ON game_user_boosters(user_id, expires_at);

-- 12. Leaderboards
CREATE TABLE IF NOT EXISTS game_leaderboard_definitions (
  key VARCHAR(48) PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  metric VARCHAR(32) NOT NULL CHECK (metric IN ('xp_global','xp_seasonal','referrals','bv','activity','prestige','team_growth','pearls')),
  scope VARCHAR(24) NOT NULL DEFAULT 'global' CHECK (scope IN ('global','regional','team','recruiter','seasonal')),
  refresh_minutes INT NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS game_leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_key VARCHAR(48) NOT NULL REFERENCES game_leaderboard_definitions(key),
  period_key VARCHAR(24) NOT NULL DEFAULT 'all',
  entity_type VARCHAR(16) NOT NULL DEFAULT 'user' CHECK (entity_type IN ('user','team')),
  entity_id UUID NOT NULL,
  score DECIMAL(15,2) NOT NULL DEFAULT 0,
  rank_position INT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(leaderboard_key, period_key, entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_game_lb_rank ON game_leaderboard_entries(leaderboard_key, period_key, rank_position);

-- 13. Reward claims
CREATE TABLE IF NOT EXISTS game_reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_type VARCHAR(32) NOT NULL,
  claim_ref VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, claim_type, claim_ref)
);

-- 14. Team gamification (requires teams from phase-p4-teams.sql)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teams') THEN
    CREATE TABLE IF NOT EXISTS game_team_progress (
      team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
      xp INT NOT NULL DEFAULT 0,
      level INT NOT NULL DEFAULT 1,
      prestige_tier VARCHAR(32) DEFAULT 'bronze',
      seasonal_xp INT NOT NULL DEFAULT 0,
      achievements_count INT NOT NULL DEFAULT 0,
      equipped_banner_key VARCHAR(64),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS game_team_achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      achievement_key VARCHAR(64) NOT NULL,
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(team_id, achievement_key)
    );
  END IF;
END $$;

-- 15. Fraud flags
CREATE TABLE IF NOT EXISTS game_progression_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flag_type VARCHAR(48) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. RPC: atomic XP grant
CREATE OR REPLACE FUNCTION game_grant_xp(
  p_user_id UUID,
  p_xp_type VARCHAR,
  p_amount INT,
  p_source VARCHAR,
  p_idempotency_key VARCHAR DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_existing UUID;
  v_col TEXT;
  v_new_xp INT;
  v_row user_gamification%ROWTYPE;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'zero_amount');
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing FROM game_xp_ledger WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object('duplicate', true);
    END IF;
  END IF;

  INSERT INTO user_gamification (user_id, share_slug)
  SELECT p_user_id, LOWER(SUBSTRING(REPLACE(p_user_id::text, '-', ''), 1, 12))
  ON CONFLICT (user_id) DO NOTHING;

  v_col := CASE p_xp_type
    WHEN 'seasonal' THEN 'xp_seasonal'
    WHEN 'team' THEN 'xp_team'
    WHEN 'leadership' THEN 'xp_leadership'
    ELSE 'xp_global'
  END;

  EXECUTE format(
    'UPDATE user_gamification SET %I = COALESCE(%I, 0) + $1, xp = COALESCE(xp, 0) + CASE WHEN $2 = ''global'' THEN $1 ELSE 0 END, updated_at = NOW() WHERE user_id = $3 RETURNING *',
    v_col, v_col
  ) INTO v_row USING p_amount, p_xp_type, p_user_id;

  INSERT INTO game_xp_ledger (user_id, xp_type, amount, source, reference_id, idempotency_key, meta)
  VALUES (p_user_id, p_xp_type, p_amount, p_source, p_reference_id, p_idempotency_key, p_meta);

  RETURN jsonb_build_object(
    'granted', p_amount,
    'xp_type', p_xp_type,
    'xp_global', v_row.xp_global,
    'xp_seasonal', v_row.xp_seasonal
  );
END;
$$ LANGUAGE plpgsql;

-- 17. Seeds
INSERT INTO game_xp_rules (event_key, label, xp_global, xp_seasonal, pearl_bonus, cooldown_seconds, max_per_hour) VALUES
  ('login', 'Daily login', 50, 25, 0, 86400, 2),
  ('purchase', 'Package purchase', 500, 300, 0, 0, 10),
  ('upgrade', 'Package upgrade', 350, 200, 0, 0, 10),
  ('referral_join', 'Referral enrolled', 200, 150, 50, 60, 30),
  ('referral_package', 'Referral purchased', 400, 250, 100, 0, 20),
  ('mission_complete', 'Mission completed', 100, 75, 0, 0, 60),
  ('achievement_unlock', 'Achievement unlocked', 150, 100, 0, 0, 60),
  ('team_activity', 'Team activity', 75, 50, 0, 300, 40),
  ('rank_up', 'Rank promotion', 800, 500, 0, 0, 5),
  ('streak_milestone', 'Streak milestone', 200, 150, 25, 0, 10),
  ('event_bonus', 'Limited event', 100, 100, 0, 0, 100)
ON CONFLICT (event_key) DO NOTHING;

INSERT INTO game_level_definitions (level, title_en, title_ar, xp_required, rarity, unlocks_json, sort_order) VALUES
  (1, 'Initiate', 'مبتدئ', 0, 'common', '{}', 1),
  (2, 'Rising Star', 'نجم صاعد', 500, 'common', '{"title":"Rising Star"}', 2),
  (3, 'Operator', 'مشغّل', 1200, 'common', '{}', 3),
  (4, 'Strategist', 'استراتيجي', 2500, 'rare', '{"frame":"silver_pulse"}', 4),
  (5, 'Commander', 'قائد', 5000, 'rare', '{"theme":"command_dark"}', 5),
  (6, 'Elite', 'نخبة', 10000, 'epic', '{"title":"Elite Operator"}', 6),
  (7, 'Diamond', 'ماسي', 20000, 'epic', '{"frame":"diamond_holo"}', 7),
  (8, 'Royal', 'ملكي', 40000, 'legendary', '{"background":"royal_nebula"}', 8),
  (9, 'Legend', 'أسطورة', 80000, 'legendary', '{"invite_theme":"legend_gold"}', 9),
  (10, 'Mythic Emperor', 'إمبراطور أسطوري', 150000, 'mythic', '{"card_skin":"mythic_emperor"}', 10)
ON CONFLICT (level) DO NOTHING;

INSERT INTO game_prestige_definitions (tier_key, title_en, title_ar, min_level, min_xp_global, min_achievements, sort_order, visual_effect) VALUES
  ('prestige_1', 'Prestige I', 'برستيج 1', 6, 8000, 5, 1, 'glow_bronze'),
  ('prestige_2', 'Prestige II', 'برستيج 2', 7, 18000, 10, 2, 'glow_silver'),
  ('prestige_3', 'Prestige III', 'برستيج 3', 8, 35000, 15, 3, 'glow_gold'),
  ('royal_prestige', 'Royal Prestige', 'برستيج ملكي', 9, 60000, 20, 4, 'holographic_royal'),
  ('legendary_prestige', 'Legendary Prestige', 'برستيج أسطوري', 10, 120000, 25, 5, 'particle_legend')
ON CONFLICT (tier_key) DO NOTHING;

INSERT INTO game_streak_definitions (streak_key, label, pearl_per_day, xp_per_day, milestone_json) VALUES
  ('login', 'Daily login', 10, 25, '[{"days":7,"pearls":100,"xp":200},{"days":30,"pearls":500,"xp":800}]'),
  ('referral', 'Referral streak', 0, 50, '[{"days":3,"xp":150},{"days":7,"pearls":200}]'),
  ('activity', 'Platform activity', 5, 15, '[]'),
  ('team', 'Team engagement', 0, 40, '[{"days":5,"xp":300}]')
ON CONFLICT (streak_key) DO NOTHING;

INSERT INTO game_achievement_definitions (key, category, title, description, icon, rarity, condition_type, condition_value, xp_reward, pearl_reward, sort_order) VALUES
  ('first_recruit', 'recruitment', 'First Recruit', 'Your first direct referral', '👤', 'common', 'direct_count', 1, 100, 100, 1),
  ('team_builder', 'recruitment', 'Team Builder', '10 direct referrals', '🏗️', 'rare', 'direct_count', 10, 500, 500, 2),
  ('elite_recruiter', 'recruitment', 'Elite Recruiter', '50 direct referrals', '🌟', 'legendary', 'direct_count', 50, 2000, 1500, 3),
  ('first_purchase', 'purchases', 'First Activation', 'First package purchase', '📦', 'common', 'package_level', 1, 200, 0, 4),
  ('diamond_leader', 'leadership', 'Diamond Leader', 'Reach rank sort 6+', '💎', 'epic', 'rank_sort', 6, 1000, 300, 5),
  ('legendary_founder', 'leadership', 'Legendary Founder', 'Founded a guild', '👑', 'legendary', 'team_founded', 1, 1500, 750, 6),
  ('wallet_master', 'wallet', 'Wallet Master', 'EGP 1000+ commissions', '💰', 'rare', 'commission_total', 1000, 400, 200, 7),
  ('streak_warrior', 'streaks', 'Streak Warrior', '7-day login streak', '🔥', 'rare', 'login_streak', 7, 300, 100, 8),
  ('streak_legend', 'streaks', 'Streak Legend', '30-day login streak', '🔥', 'legendary', 'login_streak', 30, 1000, 500, 9),
  ('founder_season', 'events', 'Founder Season', 'Top 100 seasonal XP', '🏆', 'mythic', 'season_rank', 100, 3000, 2000, 10)
ON CONFLICT (key) DO NOTHING;

INSERT INTO game_mission_definitions (key, title, description, icon, mission_type, action_trigger, target_count, xp_reward, pearl_reward, sort_order) VALUES
  ('daily_login', 'Daily Check-in', 'Log in today', '📅', 'daily', 'login', 1, 50, 10, 1),
  ('daily_invite', 'Send Invites', 'Share invite link 2 times', '📨', 'daily', 'referral_share', 2, 75, 25, 2),
  ('daily_shop', 'Explore Shop', 'Visit shop', '🛍️', 'daily', 'shop_visit', 1, 40, 15, 3),
  ('daily_onboard', 'Complete onboarding', 'Finish profile checklist', '✅', 'daily', 'onboarding_complete', 1, 100, 50, 4),
  ('weekly_recruit', 'Recruit One', '1 new referral this week', '👥', 'weekly', 'referral_join', 1, 300, 200, 5),
  ('weekly_bv', 'BV Generator', 'Earn 500 personal BV', '⚡', 'weekly', 'bv_earned', 500, 400, 150, 6),
  ('weekly_activate', 'Activate Member', 'Help activate a team member', '🚀', 'weekly', 'member_activate', 1, 250, 100, 7),
  ('seasonal_elite', 'Elite League', 'Reach 5000 seasonal XP', '🏅', 'seasonal', 'seasonal_xp', 5000, 2000, 500, 8)
ON CONFLICT (key) DO NOTHING;

INSERT INTO game_title_definitions (key, title_en, title_ar, rarity, unlock_source, unlock_ref, sort_order) VALUES
  ('founder', 'Founder', 'مؤسس', 'legendary', 'achievement', 'legendary_founder', 1),
  ('elite_leader', 'Elite Leader', 'قائد نخبة', 'epic', 'level', '6', 2),
  ('diamond_recruiter', 'Diamond Recruiter', 'مجند ماسي', 'legendary', 'achievement', 'elite_recruiter', 3),
  ('royal_ambassador', 'Royal Ambassador', 'سفير ملكي', 'mythic', 'prestige', 'royal_prestige', 4),
  ('team_emperor', 'Team Emperor', 'إمبراطور الفريق', 'legendary', 'team_level', '5', 5),
  ('legendary_builder', 'Legendary Builder', 'باني أسطوري', 'mythic', 'prestige', 'legendary_prestige', 6)
ON CONFLICT (key) DO NOTHING;

INSERT INTO game_cosmetic_definitions (key, name, cosmetic_type, rarity, pearl_cost, unlock_level, visual_config, sort_order) VALUES
  ('theme_void', 'Void Elite', 'profile_theme', 'rare', 500, 3, '{"gradient":["#0a0a12","#1a1030"]}', 1),
  ('frame_silver_pulse', 'Silver Pulse Frame', 'frame', 'rare', 0, 4, '{"animation":"pulse","color":"#C0C0C0"}', 2),
  ('frame_diamond_holo', 'Diamond Holo', 'frame', 'legendary', 1200, 7, '{"animation":"holo","particles":true}', 3),
  ('bg_royal_nebula', 'Royal Nebula', 'background', 'legendary', 0, 8, '{"animation":"nebula"}', 4),
  ('invite_legend_gold', 'Legend Gold Invite', 'invite_theme', 'mythic', 2000, 9, '{"gold":true}', 5),
  ('card_mythic_emperor', 'Mythic Emperor Card', 'card_skin', 'mythic', 0, 10, '{"holographic":true}', 6)
ON CONFLICT (key) DO NOTHING;

INSERT INTO game_booster_definitions (key, label, booster_type, multiplier, duration_hours) VALUES
  ('xp_boost_24h', 'XP Surge 24h', 'xp', 1.5, 24),
  ('pearl_boost_12h', 'Pearl Rush 12h', 'pearl', 2.0, 12),
  ('recruit_boost_48h', 'Recruitment Rush', 'recruitment', 1.25, 48)
ON CONFLICT (key) DO NOTHING;

INSERT INTO game_leaderboard_definitions (key, label, metric, scope, refresh_minutes) VALUES
  ('global_xp', 'Global XP', 'xp_global', 'global', 15),
  ('seasonal_xp', 'Season Leaders', 'xp_seasonal', 'seasonal', 15),
  ('recruiters', 'Top Recruiters', 'referrals', 'recruiter', 30),
  ('team_power', 'Team Power', 'team_growth', 'team', 30),
  ('prestige_hall', 'Prestige Hall', 'prestige', 'global', 60),
  ('pearls_earners', 'Pearl Earners', 'pearls', 'global', 30)
ON CONFLICT (key) DO NOTHING;

INSERT INTO game_seasons (key, name, description, starts_at, ends_at, is_active, theme_json) VALUES
  ('season_alpha', 'Season Alpha', 'Founder Season - exclusive cosmetics and rankings',
   NOW(), NOW() + INTERVAL '90 days', true,
   '{"banner":"season_alpha","color":"#7B6CF6"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO game_season_rewards (season_id, min_seasonal_xp, reward_type, reward_ref, reward_amount, rarity, sort_order)
SELECT s.id, v.min_xp, v.rtype, v.rref, v.ramt, v.rarity, v.ord
FROM game_seasons s,
(VALUES
  (1000, 'pearls', 'seasonal_tier_1', 200, 'common', 1),
  (5000, 'cosmetic', 'frame_diamond_holo', 0, 'epic', 2),
  (15000, 'title', 'royal_ambassador', 0, 'legendary', 3),
  (50000, 'cosmetic', 'card_mythic_emperor', 0, 'mythic', 4)
) AS v(min_xp, rtype, rref, ramt, rarity, ord)
WHERE s.key = 'season_alpha'
  AND NOT EXISTS (SELECT 1 FROM game_season_rewards sr WHERE sr.season_id = s.id LIMIT 1);

INSERT INTO game_limited_events (key, name, description, event_type, multiplier, applies_to, starts_at, ends_at, is_active) VALUES
  ('double_bv_weekend', 'Double BV Weekend', '2x seasonal XP on BV events', 'multiplier', 2.0,
   ARRAY['bv_earned','purchase'], NOW(), NOW() + INTERVAL '3 days', true),
  ('recruitment_rush', 'Recruitment Rush', 'Boost referral XP and pearls', 'multiplier', 1.5,
   ARRAY['referral_join','referral_package'], NOW(), NOW() + INTERVAL '7 days', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value) VALUES
  ('gamification_config', '{
    "enabled": true,
    "max_xp_per_hour": 5000,
    "leaderboard_refresh_minutes": 15,
    "season_reset_day": null,
    "fomo_banner_enabled": true,
    "cosmetic_fairness_note": "Cosmetics never affect MLM compensation"
  }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

UPDATE user_gamification ug
SET season_id = (SELECT id FROM game_seasons WHERE is_active = true ORDER BY starts_at DESC LIMIT 1)
WHERE season_id IS NULL
  AND EXISTS (SELECT 1 FROM game_seasons WHERE is_active = true);

-- 18. RLS
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_gamification','achievement_definitions','user_achievements','rank_milestones',
    'game_xp_ledger','game_xp_rules','game_level_definitions','game_prestige_definitions',
    'game_achievement_definitions','game_user_achievements','game_mission_definitions',
    'game_user_missions','game_streak_definitions','game_user_streaks',
    'game_title_definitions','game_user_titles','game_cosmetic_definitions','game_user_cosmetics',
    'game_seasons','game_season_rewards','game_limited_events','game_booster_definitions',
    'game_user_boosters','game_leaderboard_definitions','game_leaderboard_entries',
    'game_reward_claims','game_team_progress','game_team_achievements','game_progression_flags'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
      EXECUTE format('CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;
