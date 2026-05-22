-- Phase: Profile Identity System (Teams + Gamification)
-- Run manually in Supabase SQL Editor after schema.sql

-- ─── CLAN / TEAM SYSTEM ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  motto VARCHAR(240),
  logo_url VARCHAR,
  banner_url VARCHAR,
  team_color VARCHAR(16) DEFAULT '#7B6CF6',
  level INT DEFAULT 1 CHECK (level >= 1),
  leader_id UUID NOT NULL REFERENCES users(id),
  founder_id UUID NOT NULL REFERENCES users(id),
  total_bv DECIMAL(15,2) DEFAULT 0,
  total_members INT DEFAULT 1,
  power_score INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  max_members INT DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_power ON teams(power_score DESC);
CREATE INDEX IF NOT EXISTS idx_teams_bv ON teams(total_bv DESC);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader','officer','member')),
  contribution_bv DECIMAL(12,2) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id),
  invitee_id UUID REFERENCES users(id),
  invite_code VARCHAR(32) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USER GAMIFICATION ────────────────────────────────────────────
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

-- Seed achievement definitions
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

-- Auto-init gamification row for existing users
INSERT INTO user_gamification (user_id, share_slug)
SELECT id, LOWER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 12))
FROM users
ON CONFLICT (user_id) DO NOTHING;
