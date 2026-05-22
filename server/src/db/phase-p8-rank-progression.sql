-- Phase P8 — Rank Engine + Bonus System + Achievements + Career Progression
-- Prerequisites: schema.sql + seed.sql (users, ranks). P2/P5 optional — bootstrapped below if missing.
-- Run in Supabase SQL Editor (safe to re-run).

-- ─── 0. Bootstrap P2 rank studio (if phase-p2 was not run) ─────────
ALTER TABLE ranks
ADD COLUMN IF NOT EXISTS slug VARCHAR(64),
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(120),
ADD COLUMN IF NOT EXISTS name_en VARCHAR(120),
ADD COLUMN IF NOT EXISTS icon_key VARCHAR(48),
ADD COLUMN IF NOT EXISTS badge_url VARCHAR,
ADD COLUMN IF NOT EXISTS glow_theme VARCHAR(32),
ADD COLUMN IF NOT EXISTS frame_key VARCHAR(48),
ADD COLUMN IF NOT EXISTS rarity VARCHAR(24) DEFAULT 'common',
ADD COLUMN IF NOT EXISTS prestige_level INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS config_version INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS maintenance_json JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS rank_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_id UUID NOT NULL REFERENCES ranks(id) ON DELETE CASCADE,
  requirement_key VARCHAR(48) NOT NULL,
  requirement_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  requirement_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(rank_id, requirement_key)
);

CREATE TABLE IF NOT EXISTS rank_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_id UUID NOT NULL REFERENCES ranks(id) ON DELETE CASCADE,
  reward_key VARCHAR(48) NOT NULL,
  reward_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  reward_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(rank_id, reward_key)
);

INSERT INTO rank_requirements (rank_id, requirement_key, requirement_value)
SELECT id, 'personal_bv', pbv_required FROM ranks WHERE pbv_required > 0
ON CONFLICT (rank_id, requirement_key) DO NOTHING;
INSERT INTO rank_requirements (rank_id, requirement_key, requirement_value)
SELECT id, 'matching_bv', matching_bv_required FROM ranks WHERE matching_bv_required > 0
ON CONFLICT (rank_id, requirement_key) DO NOTHING;
INSERT INTO rank_requirements (rank_id, requirement_key, requirement_value)
SELECT id, 'directs', directs_required FROM ranks WHERE directs_required > 0
ON CONFLICT (rank_id, requirement_key) DO NOTHING;

-- Slug index (drop partial version from earlier P8 drafts if present)
DROP INDEX IF EXISTS idx_ranks_slug;
DO $$
BEGIN
  CREATE UNIQUE INDEX idx_ranks_slug ON ranks(slug);
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'idx_ranks_slug skipped — duplicate slugs in ranks; clean data then re-run';
  WHEN OTHERS THEN
    RAISE NOTICE 'idx_ranks_slug: %', SQLERRM;
END $$;

-- Bootstrap P5 gamification stubs (minimal — full engine in phase-p5-gamification.sql)
CREATE TABLE IF NOT EXISTS user_gamification (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  prestige INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_gamification
ADD COLUMN IF NOT EXISTS xp_global INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_seasonal INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_team INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_leadership INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS prestige_tier VARCHAR(32) DEFAULT 'none';

CREATE TABLE IF NOT EXISTS game_achievement_definitions (
  key VARCHAR(64) PRIMARY KEY,
  category VARCHAR(32) NOT NULL DEFAULT 'activity',
  title VARCHAR(120) NOT NULL,
  description TEXT,
  icon VARCHAR(16) DEFAULT '🏆',
  rarity VARCHAR(20) NOT NULL DEFAULT 'common',
  condition_type VARCHAR(48) NOT NULL DEFAULT 'direct_count',
  condition_value INT NOT NULL DEFAULT 1,
  xp_reward INT NOT NULL DEFAULT 0,
  pearl_reward INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS game_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key VARCHAR(64) NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

CREATE TABLE IF NOT EXISTS game_level_definitions (
  level INT PRIMARY KEY,
  title_en VARCHAR(80) NOT NULL,
  title_ar VARCHAR(80),
  xp_required INT NOT NULL,
  rarity VARCHAR(20) NOT NULL DEFAULT 'common',
  unlocks_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_leaderboard_definitions (
  key VARCHAR(48) PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  metric VARCHAR(32) NOT NULL DEFAULT 'xp_global',
  scope VARCHAR(24) NOT NULL DEFAULT 'global',
  refresh_minutes INT NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS achievement_definitions (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  icon VARCHAR(32) DEFAULT '🏆',
  tier VARCHAR(20) DEFAULT 'bronze',
  xp_reward INT DEFAULT 0,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rank_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank_id UUID REFERENCES ranks(id),
  rank_name VARCHAR(80),
  reached_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 1. Extend ranks (dynamic studio) ─────────────────────────────
ALTER TABLE ranks
ADD COLUMN IF NOT EXISTS category VARCHAR(48) DEFAULT 'leadership',
ADD COLUMN IF NOT EXISTS color_hex VARCHAR(16) DEFAULT '#534AB7',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS logic_mode VARCHAR(8) NOT NULL DEFAULT 'AND'
  CHECK (logic_mode IN ('AND','OR')),
ADD COLUMN IF NOT EXISTS unlock_animation VARCHAR(32) DEFAULT 'glow',
ADD COLUMN IF NOT EXISTS animation_config JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Requirement groups for AND/OR logic
CREATE TABLE IF NOT EXISTS rank_requirement_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_id UUID NOT NULL REFERENCES ranks(id) ON DELETE CASCADE,
  group_key VARCHAR(48) NOT NULL DEFAULT 'default',
  logic_operator VARCHAR(8) NOT NULL DEFAULT 'AND' CHECK (logic_operator IN ('AND','OR')),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(rank_id, group_key)
);

ALTER TABLE rank_requirements
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES rank_requirement_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS comparator VARCHAR(8) NOT NULL DEFAULT 'gte'
  CHECK (comparator IN ('gte','lte','eq','gt','lt')),
ADD COLUMN IF NOT EXISTS display_label VARCHAR(120);

-- ─── 2. User ranks + history ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank_id UUID NOT NULL REFERENCES ranks(id) ON DELETE CASCADE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  qualified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metrics_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  bonus_paid BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, rank_id)
);

CREATE INDEX IF NOT EXISTS idx_user_ranks_current ON user_ranks(user_id) WHERE is_current = true;

CREATE TABLE IF NOT EXISTS rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank_id UUID REFERENCES ranks(id) ON DELETE SET NULL,
  rank_name VARCHAR(120),
  event_type VARCHAR(24) NOT NULL DEFAULT 'promotion'
    CHECK (event_type IN ('promotion','demotion','manual','rollback','snapshot')),
  previous_rank_id UUID REFERENCES ranks(id),
  previous_rank_name VARCHAR(120),
  bonus_egp DECIMAL(12,2) DEFAULT 0,
  rewards_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rank_history_user ON rank_history(user_id, created_at DESC);

-- ─── 3. Dynamic bonus engine ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bonus_key VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  name_ar VARCHAR(120),
  description TEXT,
  bonus_type VARCHAR(48) NOT NULL
    CHECK (bonus_type IN (
      'direct','binary_matching','leadership','rank','fast_start',
      'team_expansion','agency_growth','monthly_residual','achievement',
      'seasonal_campaign','other'
    )),
  default_pct DECIMAL(8,4) DEFAULT 0,
  default_cap_egp DECIMAL(12,2),
  payout_wallet VARCHAR(24) DEFAULT 'BONUS',
  payout_frequency VARCHAR(16) DEFAULT 'instant'
    CHECK (payout_frequency IN ('instant','daily','weekly','monthly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  theme_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bonus_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bonus_id UUID NOT NULL REFERENCES bonuses(id) ON DELETE CASCADE,
  rule_key VARCHAR(64) NOT NULL,
  rule_type VARCHAR(32) NOT NULL DEFAULT 'percentage'
    CHECK (rule_type IN ('percentage','fixed','matching','tier','condition')),
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  min_rank_sort INT DEFAULT 0,
  max_rank_sort INT,
  package_level_min INT DEFAULT 0,
  cooldown_hours INT DEFAULT 0,
  cap_egp DECIMAL(12,2),
  carry_over BOOLEAN DEFAULT false,
  flush_on_period BOOLEAN DEFAULT false,
  activation_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  expiration_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bonus_id, rule_key)
);

CREATE TABLE IF NOT EXISTS bonus_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bonus_id UUID REFERENCES bonuses(id) ON DELETE SET NULL,
  bonus_key VARCHAR(64) NOT NULL,
  amount_egp DECIMAL(12,2) NOT NULL DEFAULT 0,
  wallet_type VARCHAR(24) DEFAULT 'BONUS',
  period_key VARCHAR(32),
  idempotency_key VARCHAR(160) UNIQUE,
  status VARCHAR(16) NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending','completed','reversed','failed')),
  calculation_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bonus_tx_user ON bonus_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bonus_tx_period ON bonus_transactions(period_key, bonus_key);

-- ─── 4. Achievement rewards (extends P5 achievements) ───────────
CREATE TABLE IF NOT EXISTS achievement_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id VARCHAR(64) NOT NULL,
  reward_key VARCHAR(48) NOT NULL,
  reward_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  reward_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(achievement_id, reward_key)
);

-- Alias views (only when base tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_level_definitions') THEN
    EXECUTE $v$
      CREATE OR REPLACE VIEW xp_levels AS
        SELECT level, xp_required, title_en AS title, title_ar, rarity, unlocks_json, sort_order
        FROM game_level_definitions
        ORDER BY level
    $v$;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_gamification') THEN
    EXECUTE $v$
      CREATE OR REPLACE VIEW user_xp AS
        SELECT
          user_id,
          COALESCE(xp_global, xp, 0) AS xp_total,
          COALESCE(xp_seasonal, 0) AS xp_seasonal,
          COALESCE(xp_team, 0) AS xp_team,
          COALESCE(xp_leadership, 0) AS xp_leadership,
          COALESCE(level, 1) AS level,
          prestige_tier,
          updated_at
        FROM user_gamification
    $v$;
  END IF;
END $$;

-- ─── 5. Seasonal campaigns + leaderboards ─────────────────────────
CREATE TABLE IF NOT EXISTS seasonal_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_key VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  name_ar VARCHAR(120),
  description TEXT,
  campaign_type VARCHAR(32) NOT NULL DEFAULT 'competition'
    CHECK (campaign_type IN ('competition','bonus_boost','rank_rush','recruitment','earnings')),
  rules_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  rewards_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  leaderboard_key VARCHAR(64),
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unified leaderboards registry (extends game_leaderboard_definitions)
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_key VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  name_ar VARCHAR(120),
  board_type VARCHAR(32) NOT NULL DEFAULT 'global'
    CHECK (board_type IN ('global','agency','rank','recruiter','earnings','xp')),
  metric_key VARCHAR(48) NOT NULL,
  period_type VARCHAR(16) NOT NULL DEFAULT 'weekly'
    CHECK (period_type IN ('daily','weekly','monthly','all_time','season')),
  scope_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  theme_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_key VARCHAR(64) NOT NULL,
  period_key VARCHAR(32) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID,
  score DECIMAL(15,2) NOT NULL DEFAULT 0,
  rank_position INT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(board_key, period_key, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lb_entries_board ON leaderboard_entries(board_key, period_key, score DESC);

-- ─── 6. Fraud scoring (anti-abuse) ────────────────────────────────
CREATE TABLE IF NOT EXISTS user_fraud_scores (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  flags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_evaluated_at TIMESTAMPTZ,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 7. Agency rank levels (P8) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS agency_rank_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_key VARCHAR(48) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  name_ar VARCHAR(120),
  min_gv DECIMAL(15,2) DEFAULT 0,
  min_retention_pct DECIMAL(5,2) DEFAULT 0,
  min_active_leaders INT DEFAULT 0,
  min_consistency_score INT DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  theme_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- ─── 8. Seed default ranks (12-tier ladder) — idempotent, no ON CONFLICT required ─
DO $$
DECLARE
  rec RECORD;
  existing_id UUID;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('Beginner', 'beginner', 1, 0::decimal, 0::decimal, 0, 'entry', '#6b7280', 'common', 0, 0::decimal),
      ('Starter', 'starter', 2, 100::decimal, 0::decimal, 0, 'entry', '#9ca3af', 'common', 0, 2::decimal),
      ('Builder', 'builder', 3, 500::decimal, 100::decimal, 1, 'growth', '#22c55e', 'common', 1, 3::decimal),
      ('Bronze', 'bronze', 4, 1500::decimal, 500::decimal, 2, 'growth', '#cd7f32', 'uncommon', 2, 4::decimal),
      ('Silver', 'silver', 5, 5000::decimal, 2000::decimal, 3, 'growth', '#c0c0c0', 'uncommon', 3, 5::decimal),
      ('Gold', 'gold', 6, 15000::decimal, 6000::decimal, 4, 'leadership', '#ffd700', 'rare', 4, 6::decimal),
      ('Platinum', 'platinum', 7, 35000::decimal, 15000::decimal, 5, 'leadership', '#e5e4e2', 'rare', 5, 7::decimal),
      ('Diamond', 'diamond', 8, 50000::decimal, 20000::decimal, 5, 'elite', '#b9f2ff', 'epic', 6, 8::decimal),
      ('Crown Diamond', 'crown-diamond', 9, 100000::decimal, 40000::decimal, 7, 'elite', '#a855f7', 'epic', 7, 9::decimal),
      ('Royal Leader', 'royal-leader', 10, 200000::decimal, 80000::decimal, 10, 'elite', '#7c3aed', 'legendary', 8, 10::decimal),
      ('Legend', 'legend', 11, 500000::decimal, 200000::decimal, 15, 'legend', '#ec4899', 'legendary', 9, 11::decimal),
      ('Legacy Founder', 'legacy-founder', 12, 1000000::decimal, 500000::decimal, 20, 'legend', '#c9a84c', 'mythic', 10, 12::decimal)
    ) AS t(name, slug, sort_order, pbv_required, matching_bv_required, directs_required,
           category, color_hex, rarity, prestige_level, commission_pct)
  LOOP
    SELECT id INTO existing_id FROM ranks
    WHERE slug = rec.slug
       OR LOWER(REPLACE(name, ' ', '-')) = rec.slug
    LIMIT 1;

    IF existing_id IS NOT NULL THEN
      UPDATE ranks SET
        slug = rec.slug,
        sort_order = rec.sort_order,
        pbv_required = rec.pbv_required,
        matching_bv_required = rec.matching_bv_required,
        directs_required = rec.directs_required,
        category = rec.category,
        color_hex = rec.color_hex,
        rarity = rec.rarity,
        prestige_level = rec.prestige_level,
        is_active = true,
        logic_mode = 'AND',
        commission_pct = rec.commission_pct
      WHERE id = existing_id;
    ELSE
      INSERT INTO ranks (
        name, slug, sort_order, pbv_required, matching_bv_required, directs_required,
        category, color_hex, rarity, prestige_level, is_active, logic_mode, commission_pct
      ) VALUES (
        rec.name, rec.slug, rec.sort_order, rec.pbv_required, rec.matching_bv_required, rec.directs_required,
        rec.category, rec.color_hex, rec.rarity, rec.prestige_level, true, 'AND', rec.commission_pct
      );
    END IF;
  END LOOP;
END $$;

-- ─── 9. Seed bonus types ──────────────────────────────────────────
INSERT INTO bonuses (bonus_key, name, name_ar, bonus_type, default_pct, payout_wallet, sort_order) VALUES
  ('direct_bonus', 'Direct Bonus', 'مكافأة مباشرة', 'direct', 10, 'BONUS', 1),
  ('binary_matching', 'Binary Matching Bonus', 'مكافأة المطابقة الثنائية', 'binary_matching', 8, 'BONUS', 2),
  ('leadership_bonus', 'Leadership Bonus', 'مكافأة القيادة', 'leadership', 5, 'BONUS', 3),
  ('rank_bonus', 'Rank Bonus', 'مكافأة الرتبة', 'rank', 0, 'RANK_REWARD', 4),
  ('fast_start', 'Fast Start Bonus', 'مكافأة البداية السريعة', 'fast_start', 15, 'BONUS', 5),
  ('team_expansion', 'Team Expansion Bonus', 'مكافأة توسيع الفريق', 'team_expansion', 3, 'BONUS', 6),
  ('agency_growth', 'Agency Growth Bonus', 'مكافأة نمو الوكالة', 'agency_growth', 4, 'BONUS', 7),
  ('monthly_residual', 'Monthly Residual Bonus', 'مكافأة شهرية متبقية', 'monthly_residual', 2, 'EARNINGS', 8),
  ('achievement_reward', 'Achievement Rewards', 'مكافآت الإنجازات', 'achievement', 0, 'BONUS', 9),
  ('seasonal_campaign', 'Seasonal Campaign Bonus', 'مكافأة الحملة الموسمية', 'seasonal_campaign', 0, 'BONUS', 10)
ON CONFLICT (bonus_key) DO NOTHING;

-- Default binary matching rule
INSERT INTO bonus_rules (bonus_id, rule_key, rule_type, value_json, carry_over, flush_on_period)
SELECT id, 'weak_leg_match', 'matching',
  '{"weak_leg_pct": 8, "balanced_bonus_pct": 2, "min_pair_bv": 100}'::jsonb,
  true, false
FROM bonuses WHERE bonus_key = 'binary_matching'
ON CONFLICT (bonus_id, rule_key) DO NOTHING;

-- ─── 10. Seed P8 achievements (game + legacy) ─────────────────────
INSERT INTO game_achievement_definitions (key, category, title, description, icon, rarity, condition_type, condition_value, xp_reward, pearl_reward, sort_order) VALUES
  ('p8_first_recruit', 'recruitment', 'First Recruit', 'Enrolled your first team member', '👤', 'common', 'direct_count', 1, 150, 50, 101),
  ('p8_team_builder', 'recruitment', 'Team Builder', 'Built a team of 5+ members', '👥', 'rare', 'direct_count', 5, 300, 100, 102),
  ('p8_seven_active', 'recruitment', '7 Active Members', '7 active direct referrals', '⚡', 'epic', 'active_direct_count', 7, 500, 200, 103),
  ('p8_first_100', 'wallet', 'First $100 Earned', 'Earned first commission milestone', '💰', 'common', 'commission_total', 100, 200, 0, 104),
  ('p8_agency_starter', 'team_growth', 'Agency Starter', 'Joined an agency', '🏢', 'rare', 'agency_member', 1, 250, 100, 105),
  ('p8_rank_hunter', 'rank', 'Rank Hunter', 'Reached Gold rank or higher', '🏅', 'epic', 'rank_sort', 6, 400, 150, 106),
  ('p8_consistency', 'streaks', 'Consistency Champion', '30-day activity streak', '🔥', 'epic', 'login_streak', 30, 350, 100, 107),
  ('p8_binary_master', 'activity', 'Binary Master', '10,000+ matching BV', '⚖️', 'epic', 'bv_matching', 10000, 450, 150, 108),
  ('p8_growth_machine', 'leadership', 'Growth Machine', '50,000+ group volume', '📈', 'legendary', 'gv_total', 50000, 600, 300, 109),
  ('p8_elite_leader', 'rank', 'Elite Leader', 'Reached Diamond rank', '👑', 'legendary', 'rank_sort', 8, 800, 400, 110)
ON CONFLICT (key) DO NOTHING;

INSERT INTO achievement_definitions (id, title, description, icon, tier, xp_reward, sort_order) VALUES
  ('p8_first_recruit', 'First Recruit', 'Your first team member', '👤', 'bronze', 150, 101),
  ('p8_team_builder', 'Team Builder', '5+ direct referrals', '👥', 'silver', 300, 102),
  ('p8_seven_active', '7 Active Members', '7 active directs', '⚡', 'gold', 500, 103),
  ('p8_rank_hunter', 'Rank Hunter', 'Gold rank achieved', '🏅', 'gold', 400, 106),
  ('p8_elite_leader', 'Elite Leader', 'Diamond rank achieved', '👑', 'platinum', 800, 110)
ON CONFLICT (id) DO NOTHING;

-- ─── 11. Seed leaderboards ─────────────────────────────────────────
INSERT INTO leaderboards (board_key, name, name_ar, board_type, metric_key, period_type, sort_order) VALUES
  ('global_xp', 'Global XP Leaders', 'قادة الخبرة', 'global', 'xp_global', 'weekly', 1),
  ('global_recruiters', 'Top Recruiters', 'أفضل المُحيلين', 'recruiter', 'direct_count', 'monthly', 2),
  ('global_earnings', 'Earnings Leaders', 'قادة الأرباح', 'earnings', 'commission_paid_total', 'monthly', 3),
  ('global_ranks', 'Rank Leaders', 'قادة الرتب', 'rank', 'rank_sort_order', 'all_time', 4),
  ('agency_gv', 'Agency GV Leaders', 'قادة حجم الوكالة', 'agency', 'agency_gv', 'weekly', 5)
ON CONFLICT (board_key) DO NOTHING;

-- Mirror into game_leaderboard_definitions (P5 schema) when table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_leaderboard_definitions') THEN
    INSERT INTO game_leaderboard_definitions (key, label, metric, scope, refresh_minutes)
    SELECT board_key, name,
      CASE metric_key
        WHEN 'xp_global' THEN 'xp_global'
        WHEN 'direct_count' THEN 'referrals'
        WHEN 'commission_paid_total' THEN 'activity'
        WHEN 'rank_sort_order' THEN 'prestige'
        ELSE 'activity'
      END,
      CASE board_type WHEN 'agency' THEN 'team' WHEN 'recruiter' THEN 'recruiter' ELSE 'global' END,
      15
    FROM leaderboards
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;

-- ─── 12. Agency rank levels ───────────────────────────────────────
INSERT INTO agency_rank_levels (level_key, name, name_ar, min_gv, min_retention_pct, min_active_leaders, sort_order) VALUES
  ('starter_agency', 'Starter Agency', 'وكالة مبتدئة', 0, 0, 0, 1),
  ('growth_agency', 'Growth Agency', 'وكالة النمو', 50000, 60, 3, 2),
  ('elite_agency', 'Elite Agency', 'وكالة النخبة', 200000, 70, 8, 3),
  ('diamond_agency', 'Diamond Agency', 'وكالة الماس', 500000, 75, 15, 4),
  ('royal_agency', 'Royal Agency', 'وكالة ملكية', 1000000, 80, 25, 5)
ON CONFLICT (level_key) DO NOTHING;

-- ─── 13. Sample seasonal campaign ─────────────────────────────────
INSERT INTO seasonal_campaigns (campaign_key, name, name_ar, campaign_type, rules_json, rewards_json, leaderboard_key, starts_at, ends_at) VALUES
  ('monthly_recruiters_may', 'Top Recruiters — May', 'أفضل المُحيلين — مايو', 'competition',
   '{"top_n": 10, "metric": "direct_count"}'::jsonb,
   '{"rank_1": {"wallet_bonus_egp": 5000}, "rank_2_3": {"wallet_bonus_egp": 2000}}'::jsonb,
   'global_recruiters',
   date_trunc('month', NOW()), date_trunc('month', NOW()) + interval '1 month' - interval '1 second'
  )
ON CONFLICT (campaign_key) DO NOTHING;

-- Enable realtime publication (Supabase) — safe if already added
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE rank_history;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE bonus_transactions;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE user_ranks;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
