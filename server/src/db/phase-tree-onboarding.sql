-- Binary tree onboarding, join requests, package-gated activation
-- Run in Supabase SQL Editor after schema.sql + package migrations
-- Does NOT require agencies table (agency_id is UUID only until phase-p4-agencies runs)

-- User tree access state
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tree_status VARCHAR DEFAULT 'locked'
    CHECK (tree_status IN ('locked', 'pending_placement', 'active', 'suspended')),
  ADD COLUMN IF NOT EXISTS tree_onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tree_unlocked_at TIMESTAMPTZ;

COMMENT ON COLUMN users.tree_status IS 'locked=no package; pending_placement=awaiting slot; active=in tree';

-- Join requests (inbound placement approval)
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID,
  sponsor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  placement_side VARCHAR NOT NULL DEFAULT 'AUTO'
    CHECK (placement_side IN ('LEFT', 'RIGHT', 'AUTO')),
  message TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  placement_node_id UUID REFERENCES tree_nodes(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_join_requests_requester ON join_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_sponsor ON join_requests(sponsor_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_pending ON join_requests(status) WHERE status = 'pending';

-- One active pending request per requester+sponsor
CREATE UNIQUE INDEX IF NOT EXISTS idx_join_requests_unique_pending
  ON join_requests(requester_id, sponsor_id)
  WHERE status = 'pending';

-- Deferred placement (referral/register before package purchase)
CREATE TABLE IF NOT EXISTS pending_tree_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  agency_id UUID,
  placement_side VARCHAR NOT NULL DEFAULT 'AUTO'
    CHECK (placement_side IN ('LEFT', 'RIGHT', 'AUTO')),
  source VARCHAR NOT NULL DEFAULT 'registration'
    CHECK (source IN ('registration', 'referral', 'join_request', 'invite', 'admin')),
  join_request_id UUID REFERENCES join_requests(id) ON DELETE SET NULL,
  status VARCHAR NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'activated', 'cancelled', 'failed')),
  activated_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_placements_status ON pending_tree_placements(status);

-- Onboarding progress per user
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_step_key VARCHAR,
  completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  first_purchase_id UUID,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  interrupted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin-configurable onboarding steps
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_key VARCHAR NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  title_ar VARCHAR NOT NULL,
  title_en VARCHAR,
  subtitle_ar TEXT,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  visualization_type VARCHAR DEFAULT 'cards'
    CHECK (visualization_type IN ('cards', 'tree_3d', 'metrics', 'simulation', 'agency', 'gamification', 'activation')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_package_level INT DEFAULT 0,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics / funnel events
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL,
  step_key VARCHAR,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user ON onboarding_events(user_id, created_at DESC);

-- Rewards granted during onboarding
CREATE TABLE IF NOT EXISTS onboarding_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_key VARCHAR,
  trigger_event VARCHAR NOT NULL DEFAULT 'step_complete',
  reward_type VARCHAR NOT NULL CHECK (reward_type IN ('pearls', 'badge', 'voucher', 'xp', 'notification')),
  reward_value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3D tree visualization settings (super admin)
CREATE TABLE IF NOT EXISTS tree_visualization_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR NOT NULL UNIQUE,
  label VARCHAR,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default onboarding steps
INSERT INTO onboarding_steps (step_key, sort_order, title_ar, title_en, visualization_type, content_json)
VALUES
  ('welcome', 1, 'مرحباً بك في الشبكة', 'Welcome to the Network', 'cards',
   '{"bullets":["نظام تنظيمي متقدم","وكالات ومنافسات","شجرة ثنائية للنمو"]}'::jsonb),
  ('tree_basics', 2, 'فهم الشجرة الثنائية', 'Understand the Tree', 'tree_3d',
   '{"topics":["left_leg","right_leg","sponsor","placement","uplines","downlines"]}'::jsonb),
  ('mlm_metrics', 3, 'مقاييس الأعمال', 'MLM Metrics', 'metrics',
   '{"metrics":["PV","BV","GV","TV","CV"]}'::jsonb),
  ('package_power', 4, 'قوة الباقة', 'Package Power', 'cards',
   '{"topics":["matching","bv_flow","upgrades","leadership"]}'::jsonb),
  ('earnings_sim', 5, 'محاكاة الأرباح', 'Earnings Simulation', 'simulation',
   '{"defaultLeftBv":1200,"defaultRightBv":800}'::jsonb),
  ('agency_intro', 6, 'وكالتك', 'Your Agency', 'agency', '{}'::jsonb),
  ('gamification', 7, 'التقدم والمكافآت', 'Progression & Rewards', 'gamification', '{}'::jsonb),
  ('activation', 8, 'تفعيل موقعك', 'Position Activation', 'activation', '{}'::jsonb)
ON CONFLICT (step_key) DO NOTHING;

INSERT INTO tree_visualization_configs (config_key, label, config_json)
VALUES
  ('default', 'Default 3D Tree', '{
    "glowIntensity": 0.85,
    "particleFlow": true,
    "cameraAutoRotate": false,
    "nodeColors": {"left": "#C4B8FF", "right": "#6BE4FF", "self": "#7B6CF6"},
    "maxDepth": 5
  }'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- Backfill: users already in tree with active membership
UPDATE users u
SET
  tree_status = 'active',
  tree_unlocked_at = COALESCE(u.tree_unlocked_at, u.active_date, NOW())
WHERE EXISTS (SELECT 1 FROM tree_nodes tn WHERE tn.user_id = u.id)
  AND COALESCE(u.membership_status, '') = 'active'
  AND COALESCE(u.tree_status, 'locked') = 'locked';

-- Users in tree but no package — keep node but mark locked until package
UPDATE users u
SET tree_status = 'locked'
WHERE EXISTS (SELECT 1 FROM tree_nodes tn WHERE tn.user_id = u.id)
  AND COALESCE(u.current_package_level, 0) = 0
  AND COALESCE(u.membership_status, 'unsubscribed') != 'active';

-- Existing members already in tree skip the new cinematic onboarding
UPDATE users u
SET tree_onboarding_completed = true
WHERE EXISTS (SELECT 1 FROM tree_nodes tn WHERE tn.user_id = u.id)
  AND COALESCE(u.tree_onboarding_completed, false) = false;

-- Optional FK to agencies (run after phase-p4-agencies.sql)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'agencies'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'join_requests_agency_id_fkey'
    ) THEN
      ALTER TABLE join_requests
        ADD CONSTRAINT join_requests_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'pending_tree_placements_agency_id_fkey'
    ) THEN
      ALTER TABLE pending_tree_placements
        ADD CONSTRAINT pending_tree_placements_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;
