-- Phase 7: Tree Engine — network layer (binary + unilevel hybrid)
-- Run after: schema.sql, phase-tree-onboarding.sql, phase-p5-live-organization.sql, phase-p6-mlm-intelligence.sql
-- Extends tree_nodes (placement truth) with network_* enrichment, volumes, activity, admin controls.

-- =============================================================================
-- Admin placement strategy (global default)
-- =============================================================================
CREATE TABLE IF NOT EXISTS network_placement_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope VARCHAR NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'agency')),
  agency_id UUID,
  default_strategy VARCHAR NOT NULL DEFAULT 'AUTO_BALANCE'
    CHECK (default_strategy IN (
      'LEFT', 'RIGHT', 'AUTO_BALANCE', 'WEAKER_LEG', 'STRONGER_LEG', 'MANUAL_ONLY'
    )),
  allow_manual BOOLEAN NOT NULL DEFAULT true,
  max_view_depth INT NOT NULL DEFAULT 6,
  spillover_enabled BOOLEAN NOT NULL DEFAULT true,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scope, agency_id)
);

INSERT INTO network_placement_settings (scope, agency_id, default_strategy, config_json)
VALUES ('global', NULL, 'AUTO_BALANCE', '{"preferWeakerLeg":true,"minimizeDeadLegs":true}'::jsonb)
ON CONFLICT (scope, agency_id) DO NOTHING;

-- =============================================================================
-- Network nodes (enriched mirror of tree_nodes + metrics)
-- =============================================================================
CREATE TABLE IF NOT EXISTS network_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tree_node_id UUID UNIQUE REFERENCES tree_nodes(id) ON DELETE SET NULL,
  sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  placement_parent_id UUID REFERENCES tree_nodes(id) ON DELETE SET NULL,
  placement_side VARCHAR CHECK (placement_side IN ('LEFT', 'RIGHT')),
  level_depth INT NOT NULL DEFAULT 0,
  agency_id UUID,
  active_package_id UUID,
  current_rank_id UUID REFERENCES ranks(id) ON DELETE SET NULL,
  total_pv DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_gv DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_tv DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_bv DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_cv DECIMAL(15,2) NOT NULL DEFAULT 0,
  left_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
  right_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
  weak_leg_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
  strong_leg_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
  carry_over_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
  lifetime_earnings DECIMAL(15,2) NOT NULL DEFAULT 0,
  team_size INT NOT NULL DEFAULT 0,
  direct_recruits INT NOT NULL DEFAULT 0,
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  frozen_at TIMESTAMPTZ,
  frozen_reason TEXT,
  placement_strategy VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'frozen', 'suspended')),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_nodes_sponsor ON network_nodes(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_network_nodes_parent ON network_nodes(placement_parent_id, placement_side);
CREATE INDEX IF NOT EXISTS idx_network_nodes_agency ON network_nodes(agency_id) WHERE agency_id IS NOT NULL;

-- =============================================================================
-- Unilevel sponsor relationships (recruiter chain — may differ from placement parent)
-- =============================================================================
CREATE TABLE IF NOT EXISTS network_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INT NOT NULL DEFAULT 1,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  source VARCHAR NOT NULL DEFAULT 'registration'
    CHECK (source IN ('registration', 'referral', 'join_request', 'invite', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_sponsors_sponsor ON network_sponsors(sponsor_id);

-- Allow root/founder users without a sponsor (re-run safe)
ALTER TABLE network_sponsors ALTER COLUMN sponsor_id DROP NOT NULL;

-- =============================================================================
-- Placement audit trail
-- =============================================================================
CREATE TABLE IF NOT EXISTS network_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tree_node_id UUID REFERENCES tree_nodes(id) ON DELETE SET NULL,
  sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  placement_parent_id UUID REFERENCES tree_nodes(id) ON DELETE SET NULL,
  placement_side VARCHAR CHECK (placement_side IN ('LEFT', 'RIGHT')),
  strategy VARCHAR NOT NULL DEFAULT 'AUTO_BALANCE',
  placed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_override BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_positions_user ON network_positions(user_id, created_at DESC);

-- =============================================================================
-- Volume snapshots per user (PV/GV/TV/BV/CV)
-- =============================================================================
CREATE TABLE IF NOT EXISTS network_volumes (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pv DECIMAL(15,2) NOT NULL DEFAULT 0,
  gv DECIMAL(15,2) NOT NULL DEFAULT 0,
  tv DECIMAL(15,2) NOT NULL DEFAULT 0,
  bv DECIMAL(15,2) NOT NULL DEFAULT 0,
  cv DECIMAL(15,2) NOT NULL DEFAULT 0,
  left_bv DECIMAL(15,2) NOT NULL DEFAULT 0,
  right_bv DECIMAL(15,2) NOT NULL DEFAULT 0,
  weak_leg VARCHAR CHECK (weak_leg IN ('LEFT', 'RIGHT', 'BALANCED')),
  carry_over DECIMAL(15,2) NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Point-in-time network snapshots (rank reviews, payouts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS network_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_type VARCHAR NOT NULL DEFAULT 'daily'
    CHECK (snapshot_type IN ('daily', 'weekly', 'rank_review', 'payout', 'admin')),
  metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_snapshots_user ON network_snapshots(user_id, created_at DESC);

-- =============================================================================
-- Rank progression history on the network
-- =============================================================================
CREATE TABLE IF NOT EXISTS network_rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_rank_id UUID REFERENCES ranks(id) ON DELETE SET NULL,
  to_rank_id UUID REFERENCES ranks(id) ON DELETE SET NULL,
  trigger_event VARCHAR,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_rank_history_user ON network_rank_history(user_id, created_at DESC);

-- =============================================================================
-- Leg statistics (binary matching prep)
-- =============================================================================
CREATE TABLE IF NOT EXISTS network_leg_statistics (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  left_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
  right_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
  left_active_count INT NOT NULL DEFAULT 0,
  right_active_count INT NOT NULL DEFAULT 0,
  left_inactive_count INT NOT NULL DEFAULT 0,
  right_inactive_count INT NOT NULL DEFAULT 0,
  weak_leg VARCHAR CHECK (weak_leg IN ('LEFT', 'RIGHT', 'BALANCED')),
  strong_leg VARCHAR CHECK (strong_leg IN ('LEFT', 'RIGHT', 'BALANCED')),
  carry_over DECIMAL(15,2) NOT NULL DEFAULT 0,
  growth_streak_days INT NOT NULL DEFAULT 0,
  expansion_energy_pct INT NOT NULL DEFAULT 0 CHECK (expansion_energy_pct BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Live network activity feed (tree-specific, realtime-ready)
-- =============================================================================
CREATE TABLE IF NOT EXISTS network_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID,
  event_type VARCHAR(48) NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  icon VARCHAR(16) DEFAULT '⚡',
  severity VARCHAR(16) DEFAULT 'info'
    CHECK (severity IN ('info', 'success', 'warning', 'epic', 'legendary')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_activity_feed_time ON network_activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_network_activity_feed_agency ON network_activity_feed(agency_id, created_at DESC)
  WHERE agency_id IS NOT NULL;

-- User entry flow state (post-package, pre-placement)
CREATE TABLE IF NOT EXISTS network_entry_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  has_invite_code BOOLEAN,
  join_under_agency BOOLEAN,
  agency_id UUID,
  sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sponsor_code VARCHAR,
  expansion_side VARCHAR CHECK (expansion_side IN ('LEFT', 'RIGHT', 'AUTO')),
  placement_mode VARCHAR CHECK (placement_mode IN ('AUTO', 'MANUAL')),
  current_step INT NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Sync helper: upsert network row from tree_nodes + users
-- =============================================================================
CREATE OR REPLACE FUNCTION sync_network_node_from_tree(p_user_id UUID, p_strategy VARCHAR DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tn RECORD;
  v_u RECORD;
  v_left DECIMAL(15,2);
  v_right DECIMAL(15,2);
  v_weak DECIMAL(15,2);
  v_strong DECIMAL(15,2);
  v_weak_leg VARCHAR;
  v_node_id UUID;
BEGIN
  SELECT * INTO v_tn FROM tree_nodes WHERE user_id = p_user_id;
  SELECT id, sponsor_id, agency_id, current_package_level, rank_id, total_pv,
         commission_paid_total, direct_count
    INTO v_u FROM users WHERE id = p_user_id;

  IF v_u.id IS NULL THEN RETURN NULL; END IF;

  SELECT COALESCE(SUM(amount) FILTER (WHERE side = 'LEFT'), 0),
         COALESCE(SUM(amount) FILTER (WHERE side = 'RIGHT'), 0)
    INTO v_left, v_right
  FROM bv_logs WHERE user_id = p_user_id;

  v_weak := LEAST(v_left, v_right);
  v_strong := GREATEST(v_left, v_right);
  IF v_left = v_right THEN v_weak_leg := 'BALANCED';
  ELSIF v_left < v_right THEN v_weak_leg := 'LEFT';
  ELSE v_weak_leg := 'RIGHT';
  END IF;

  INSERT INTO network_nodes (
    user_id, tree_node_id, sponsor_id, placement_parent_id, placement_side,
    level_depth, agency_id, current_rank_id, total_pv, total_gv, left_volume, right_volume,
    weak_leg_volume, strong_leg_volume, lifetime_earnings, direct_recruits,
    placement_strategy, status, activated_at, updated_at
  ) VALUES (
    p_user_id,
    v_tn.id,
    v_u.sponsor_id,
    v_tn.parent_id,
    v_tn.side,
    COALESCE(v_tn.depth_level, 0),
    v_u.agency_id,
    v_u.rank_id,
    COALESCE(v_u.total_pv, 0),
    COALESCE(v_left + v_right, 0),
    v_left,
    v_right,
    v_weak,
    v_strong,
    COALESCE(v_u.commission_paid_total, 0),
    COALESCE(v_u.direct_count, 0),
    p_strategy,
    'active',
    COALESCE(v_tn.placed_at, NOW()),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tree_node_id = EXCLUDED.tree_node_id,
    sponsor_id = EXCLUDED.sponsor_id,
    placement_parent_id = EXCLUDED.placement_parent_id,
    placement_side = EXCLUDED.placement_side,
    level_depth = EXCLUDED.level_depth,
    agency_id = EXCLUDED.agency_id,
    current_rank_id = EXCLUDED.current_rank_id,
    total_pv = EXCLUDED.total_pv,
    total_gv = EXCLUDED.total_gv,
    left_volume = EXCLUDED.left_volume,
    right_volume = EXCLUDED.right_volume,
    weak_leg_volume = EXCLUDED.weak_leg_volume,
    strong_leg_volume = EXCLUDED.strong_leg_volume,
    lifetime_earnings = EXCLUDED.lifetime_earnings,
    direct_recruits = EXCLUDED.direct_recruits,
    placement_strategy = COALESCE(EXCLUDED.placement_strategy, network_nodes.placement_strategy),
    updated_at = NOW()
  RETURNING id INTO v_node_id;

  -- Root/founder users may have no sponsor_id — skip row instead of violating NOT NULL
  IF v_u.sponsor_id IS NOT NULL THEN
    INSERT INTO network_sponsors (user_id, sponsor_id, level, is_primary, source)
    VALUES (p_user_id, v_u.sponsor_id, 1, true, 'registration')
    ON CONFLICT (user_id) DO UPDATE SET sponsor_id = EXCLUDED.sponsor_id;
  ELSE
    DELETE FROM network_sponsors WHERE user_id = p_user_id;
  END IF;

  INSERT INTO network_volumes (user_id, pv, gv, tv, bv, cv, left_bv, right_bv, weak_leg, updated_at)
  VALUES (
    p_user_id,
    COALESCE(v_u.total_pv, 0),
    COALESCE(v_left + v_right, 0),
    COALESCE(v_left + v_right, 0),
    COALESCE(v_left + v_right, 0),
    COALESCE(v_u.commission_paid_total, 0),
    v_left,
    v_right,
    v_weak_leg,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    pv = EXCLUDED.pv, gv = EXCLUDED.gv, tv = EXCLUDED.tv, bv = EXCLUDED.bv,
    cv = EXCLUDED.cv, left_bv = EXCLUDED.left_bv, right_bv = EXCLUDED.right_bv,
    weak_leg = EXCLUDED.weak_leg, last_calculated_at = NOW(), updated_at = NOW();

  INSERT INTO network_leg_statistics (
    user_id, left_volume, right_volume, weak_leg, strong_leg, updated_at
  ) VALUES (
    p_user_id, v_left, v_right, v_weak_leg,
    CASE WHEN v_weak_leg = 'LEFT' THEN 'RIGHT' WHEN v_weak_leg = 'RIGHT' THEN 'LEFT' ELSE 'BALANCED' END,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    left_volume = EXCLUDED.left_volume,
    right_volume = EXCLUDED.right_volume,
    weak_leg = EXCLUDED.weak_leg,
    strong_leg = EXCLUDED.strong_leg,
    updated_at = NOW();

  RETURN v_node_id;
END;
$$;

-- Backfill existing tree members
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT user_id FROM tree_nodes LOOP
    PERFORM sync_network_node_from_tree(r.user_id);
  END LOOP;
END $$;

-- system_settings seed for tree engine
INSERT INTO system_settings (key, value) VALUES
  ('network_placement_engine', '{"defaultStrategy":"AUTO_BALANCE","allowManual":true,"maxViewDepth":6}')
ON CONFLICT (key) DO NOTHING;

-- RLS (service role bypasses; authenticated read own downline via API)
ALTER TABLE network_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_entry_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS network_nodes_select_own ON network_nodes;
CREATE POLICY network_nodes_select_own ON network_nodes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS network_activity_public ON network_activity_feed;
CREATE POLICY network_activity_public ON network_activity_feed FOR SELECT TO authenticated
  USING (is_public = true);

DROP POLICY IF EXISTS network_entry_own ON network_entry_sessions;
CREATE POLICY network_entry_own ON network_entry_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Realtime publication (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE network_activity_feed;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
