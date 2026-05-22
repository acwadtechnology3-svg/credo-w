-- Pearls Wallet System (run in Supabase SQL Editor)
-- Replaces legacy pearls_transactions with the full gamification schema.

DROP TABLE IF EXISTS pearls_transactions CASCADE;

-- 1. Pearls wallet (one per user)
CREATE TABLE IF NOT EXISTS pearls_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  available_balance INT DEFAULT 0 CHECK (available_balance >= 0),
  lifetime_earned INT DEFAULT 0,
  lifetime_used INT DEFAULT 0,
  tier VARCHAR DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','diamond')),
  tier_multiplier DECIMAL(3,2) DEFAULT 1.0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_login_date DATE DEFAULT NULL,
  streak_freeze_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pearls_wallet_user ON pearls_wallet(user_id);

-- 2. All pearl transactions (earn / spend / expire / admin)
CREATE TABLE pearls_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR NOT NULL CHECK (type IN ('earn','spend','expire','admin')),
  source VARCHAR NOT NULL,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  reference_id UUID DEFAULT NULL,
  campaign_id UUID DEFAULT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '365 days'),
  is_expired BOOLEAN DEFAULT false,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pearls_tx_user ON pearls_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pearls_tx_expiry ON pearls_transactions(expires_at, is_expired);

-- 3. Marketplace rewards
CREATE TABLE IF NOT EXISTS pearl_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL CHECK (type IN ('voucher','discount','course','event','membership','ai_tool','badge','travel','product')),
  pearl_cost INT NOT NULL,
  egp_value DECIMAL(12,2) DEFAULT 0,
  min_tier VARCHAR DEFAULT 'bronze' CHECK (min_tier IN ('bronze','silver','gold','diamond')),
  stock INT DEFAULT -1,
  redeemed_count INT DEFAULT 0,
  is_limited BOOLEAN DEFAULT false,
  available_from TIMESTAMPTZ DEFAULT NOW(),
  available_until TIMESTAMPTZ DEFAULT NULL,
  image_url VARCHAR DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Redemption records
CREATE TABLE IF NOT EXISTS pearl_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  reward_id UUID NOT NULL REFERENCES pearl_rewards(id),
  pearls_spent INT NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending','fulfilled','cancelled')),
  voucher_code VARCHAR DEFAULT NULL,
  fulfilled_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON pearl_redemptions(user_id);

-- 5. Mission definitions
CREATE TABLE IF NOT EXISTS pearl_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR DEFAULT '🎯',
  type VARCHAR DEFAULT 'daily' CHECK (type IN ('daily','weekly','seasonal','flash')),
  action_trigger VARCHAR NOT NULL,
  target_count INT DEFAULT 1,
  pearl_reward INT NOT NULL,
  min_tier VARCHAR DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

-- 6. Mission progress per user per period
CREATE TABLE IF NOT EXISTS pearl_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  mission_id UUID NOT NULL REFERENCES pearl_missions(id),
  current_count INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  pearl_claimed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  period_key VARCHAR NOT NULL,
  UNIQUE(user_id, mission_id, period_key)
);
CREATE INDEX IF NOT EXISTS idx_mission_progress_user ON pearl_mission_progress(user_id, period_key);

-- 7. Achievement definitions
CREATE TABLE IF NOT EXISTS pearl_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR UNIQUE NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR DEFAULT '🏆',
  condition_type VARCHAR NOT NULL,
  condition_value INT NOT NULL,
  pearl_reward INT DEFAULT 0,
  is_secret BOOLEAN DEFAULT false
);

-- 8. User achievements unlocked
CREATE TABLE IF NOT EXISTS pearl_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  achievement_id UUID NOT NULL REFERENCES pearl_achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 9. Campaign system
CREATE TABLE IF NOT EXISTS pearl_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('multiplier','bonus','event')),
  multiplier DECIMAL(4,2) DEFAULT 1.0,
  bonus_flat INT DEFAULT 0,
  applies_to TEXT[] DEFAULT '{}',
  min_tier VARCHAR DEFAULT NULL,
  target_user_ids UUID[] DEFAULT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Fraud flags
CREATE TABLE IF NOT EXISTS pearl_fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  flag_type VARCHAR NOT NULL,
  severity VARCHAR DEFAULT 'low' CHECK (severity IN ('low','medium','high')),
  details JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Seed default missions
INSERT INTO pearl_missions (title, description, icon, type, action_trigger, target_count, pearl_reward, sort_order)
SELECT * FROM (VALUES
  ('Login today',          'Daily login streak',            '📅', 'daily',  'login',          1,  10,  1),
  ('Share referral link',  'Send your link to 2 contacts',  '👥', 'daily',  'referral_share', 2,  50,  2),
  ('Visit the shop',       'Browse any product page',       '🛍️', 'daily',  'shop_visit',     1,  25,  3),
  ('Watch a lesson',       'Complete 1 Academy lesson',     '🎓', 'daily',  'lesson_complete',1,  75,  4),
  ('Add to cart',          'Add any product to cart',       '🛒', 'daily',  'add_to_cart',    1,  15,  5),
  ('Weekly referral',      'Invite 3 people this week',     '🌟', 'weekly', 'referral_join',  3,  200, 6),
  ('Weekly purchase',      'Complete 1 order this week',   '💳', 'weekly', 'order_complete', 1,  150, 7)
) AS v(title, description, icon, type, action_trigger, target_count, pearl_reward, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM pearl_missions LIMIT 1);

-- 12. Seed default achievements
INSERT INTO pearl_achievements (key, title, description, icon, condition_type, condition_value, pearl_reward) VALUES
('first_pearl',       'First Pearl!',         'Earn your first Pearl',                    '⬡',  'lifetime_earned',  1,    0),
('pearls_100',        'Pearl Starter',        'Earn 100 lifetime Pearls',                 '🪙', 'lifetime_earned',  100,  50),
('pearls_1000',       'Pearl Collector',      'Earn 1,000 lifetime Pearls',               '💰', 'lifetime_earned',  1000, 200),
('pearls_5000',       'Pearl Master',         'Reach Gold tier — 5,000 Pearls',           '🥇', 'lifetime_earned',  5000, 500),
('pearls_20000',      'Pearl Diamond',        'Reach Diamond tier — 20,000 Pearls',       '💎', 'lifetime_earned',  20000,2000),
('streak_7',          '7-Day Streak',         '7 consecutive login days',                 '🔥', 'streak',           7,    100),
('streak_30',         '30-Day Streak',        '30 consecutive login days',                '🔥', 'streak',           30,   500),
('first_redeem',      'First Redemption',     'Redeem a reward from the marketplace',     '🎁', 'redemptions',      1,    50),
('first_referral',    'First Recruit',        'Your first referral joined',               '👥', 'referrals',        1,    100),
('referrals_10',      'Team Builder',         'Recruit 10 members',                       '🏗️', 'referrals',        10,   500),
('first_upgrade',     'Level Up!',            'Upgrade your first package',               '⬆️', 'upgrades',         1,    200)
ON CONFLICT (key) DO NOTHING;

-- 13. Seed marketplace rewards
INSERT INTO pearl_rewards (title, description, type, pearl_cost, egp_value, min_tier, is_limited, sort_order)
SELECT * FROM (VALUES
  ('EGP 5 Voucher',       'Shop discount voucher',              'voucher',    100,  5,    'bronze',  false, 1),
  ('EGP 50 Voucher',      'Shop discount voucher',              'voucher',    900,  50,   'bronze',  false, 2),
  ('EGP 200 Voucher',     'Shop discount voucher',              'voucher',    3200, 200,  'silver',  false, 3),
  ('5% Discount',         'One-time order discount',            'discount',   200,  0,    'bronze',  false, 4),
  ('10% Discount',        'One-time order discount',            'discount',   380,  0,    'silver',  false, 5),
  ('Free Shipping',       'Free shipping on 1 order',           'discount',   150,  0,    'bronze',  false, 6),
  ('Course Unlock',       'Access any Academy course',          'course',     500,  0,    'bronze',  false, 7),
  ('AI Tools 7 Days',     'Premium AI tool access',             'ai_tool',    800,  0,    'silver',  false, 8),
  ('Event Ticket',        'Credo W VIP event',                  'event',      3000, 0,    'gold',    true,  9),
  ('Travel 10% Off',      'Discount on travel packages',        'travel',     3000, 0,    'gold',    false, 10),
  ('Gold Profile Badge',  'Exclusive profile badge',            'badge',      300,  0,    'bronze',  true,  11),
  ('Membership 30 Days',  'Premium membership upgrade',         'membership', 2500, 0,    'silver',  false, 12)
) AS v(title, description, type, pearl_cost, egp_value, min_tier, is_limited, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM pearl_rewards LIMIT 1);

-- 14. Function to update tier automatically
CREATE OR REPLACE FUNCTION update_pearl_tier(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_lifetime INT;
  v_tier VARCHAR;
  v_multiplier DECIMAL;
BEGIN
  SELECT lifetime_earned INTO v_lifetime FROM pearls_wallet WHERE user_id = p_user_id;
  IF v_lifetime IS NULL THEN RETURN; END IF;
  IF v_lifetime >= 20000 THEN v_tier := 'diamond'; v_multiplier := 2.0;
  ELSIF v_lifetime >= 5000 THEN v_tier := 'gold';    v_multiplier := 1.5;
  ELSIF v_lifetime >= 1000 THEN v_tier := 'silver';  v_multiplier := 1.25;
  ELSE v_tier := 'bronze'; v_multiplier := 1.0;
  END IF;
  UPDATE pearls_wallet SET tier = v_tier, tier_multiplier = v_multiplier WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
