-- Phase P2 — Dynamic Business Control Layer (run after phase-p1-purchase-engine.sql)

-- ─── 1. Package Studio extensions ─────────────────────────────────
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS slug VARCHAR(64),
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(120),
ADD COLUMN IF NOT EXISTS name_en VARCHAR(120),
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(48) DEFAULT 'membership',
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(16) DEFAULT '#534AB7',
ADD COLUMN IF NOT EXISTS glow_theme VARCHAR(32),
ADD COLUMN IF NOT EXISTS icon_key VARCHAR(48),
ADD COLUMN IF NOT EXISTS banner_url VARCHAR,
ADD COLUMN IF NOT EXISTS animation_type VARCHAR(32) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS visibility_regions TEXT[] DEFAULT ARRAY['EG'],
ADD COLUMN IF NOT EXISTS matching_bv_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_directs INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_rank_id UUID REFERENCES ranks(id),
ADD COLUMN IF NOT EXISTS duration_days INT,
ADD COLUMN IF NOT EXISTS renewal_rule VARCHAR(32) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS promo_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS config_version INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS rewards_json JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug) WHERE slug IS NOT NULL;

-- ─── 2. Dynamic upgrade graph (replaces hardcoded paths) ───────────
CREATE TABLE IF NOT EXISTS package_upgrade_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type VARCHAR(24) NOT NULL DEFAULT 'upgrade'
    CHECK (rule_type IN ('direct','upgrade')),
  from_membership_level INT NOT NULL DEFAULT 0,
  via_package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  resulting_level INT NOT NULL,
  additional_cost_override DECIMAL(12,2),
  required_rank_id UUID REFERENCES ranks(id),
  required_directs INT DEFAULT 0,
  required_team_volume DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  campaign_tag VARCHAR(64),
  config_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upgrade_rules_active
  ON package_upgrade_rules(from_membership_level, is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_upgrade_rules_via_pkg ON package_upgrade_rules(via_package_id);

-- ─── 3. Rank studio extensions ─────────────────────────────────────
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

-- Migrate legacy rank columns → requirements (idempotent)
INSERT INTO rank_requirements (rank_id, requirement_key, requirement_value)
SELECT id, 'personal_bv', pbv_required FROM ranks
ON CONFLICT (rank_id, requirement_key) DO NOTHING;
INSERT INTO rank_requirements (rank_id, requirement_key, requirement_value)
SELECT id, 'matching_bv', matching_bv_required FROM ranks
ON CONFLICT (rank_id, requirement_key) DO NOTHING;
INSERT INTO rank_requirements (rank_id, requirement_key, requirement_value)
SELECT id, 'directs', directs_required FROM ranks
ON CONFLICT (rank_id, requirement_key) DO NOTHING;

-- ─── 4. Payment methods (expand P0 stub) ───────────────────────────
ALTER TABLE payment_methods_config
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(120),
ADD COLUMN IF NOT EXISTS provider VARCHAR(64),
ADD COLUMN IF NOT EXISTS logo_url VARCHAR,
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS qr_code_url VARCHAR,
ADD COLUMN IF NOT EXISTS account_details JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS supported_currencies TEXT[] DEFAULT ARRAY['EGP'],
ADD COLUMN IF NOT EXISTS regions TEXT[] DEFAULT ARRAY['EG'],
ADD COLUMN IF NOT EXISTS fee_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fee_fixed DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS processing_hours INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS config_version INT NOT NULL DEFAULT 1;

-- ─── 5. Promotions engine ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(48) UNIQUE,
  name VARCHAR(120) NOT NULL,
  name_ar VARCHAR(120),
  description TEXT,
  promo_type VARCHAR(32) NOT NULL DEFAULT 'discount'
    CHECK (promo_type IN ('discount','bv_multiplier','cash_bonus','rank_boost','bundle','referral')),
  discount_pct DECIMAL(5,2) DEFAULT 0,
  discount_fixed DECIMAL(12,2) DEFAULT 0,
  bv_multiplier DECIMAL(5,2) DEFAULT 1,
  wallet_bonus_egp DECIMAL(12,2) DEFAULT 0,
  theme_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  target_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  config_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  rule_type VARCHAR(32) NOT NULL,
  rule_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  package_id UUID REFERENCES packages(id),
  rank_id UUID REFERENCES ranks(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- ─── 6. Feature flags ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_pct INT NOT NULL DEFAULT 100 CHECK (rollout_pct >= 0 AND rollout_pct <= 100),
  target_roles TEXT[] DEFAULT '{}',
  target_regions TEXT[] DEFAULT '{}',
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 7. UI configurations ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ui_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(64) UNIQUE NOT NULL,
  config_group VARCHAR(48) NOT NULL DEFAULT 'general',
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 8. Team & wallet rules (runtime config) ───────────────────────
CREATE TABLE IF NOT EXISTS team_policy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key VARCHAR(48) UNIQUE NOT NULL,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config_version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_rules_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key VARCHAR(48) UNIQUE NOT NULL,
  wallet_type VARCHAR(16),
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config_version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 9. RBAC ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key VARCHAR(64) UNIQUE NOT NULL,
  module VARCHAR(32) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_admin_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- ─── 10. Config versioning (immutable history) ─────────────────────
CREATE TABLE IF NOT EXISTS config_version_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(32) NOT NULL,
  entity_id UUID NOT NULL,
  version INT NOT NULL,
  snapshot_json JSONB NOT NULL,
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, version)
);

-- ─── 11. Business events (BI prep) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS business_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(48) NOT NULL,
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(32),
  entity_id UUID,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_events_type ON business_events(event_type, created_at DESC);

-- ─── Seed: admin roles & permissions ─────────────────────────────
INSERT INTO admin_roles (role_key, name, description, is_system) VALUES
  ('super_admin', 'Super Admin', 'Full platform control', true),
  ('finance_admin', 'Finance Admin', 'Wallets, transactions, refunds', true),
  ('marketing_admin', 'Marketing Admin', 'Promotions, packages, UI', true),
  ('support_admin', 'Support Admin', 'Users, tickets, read-only finance', true),
  ('risk_admin', 'Risk Admin', 'Fraud, reconciliation, approvals', true)
ON CONFLICT (role_key) DO NOTHING;

INSERT INTO admin_permissions (permission_key, module, description) VALUES
  ('packages.read', 'packages', 'View packages'),
  ('packages.write', 'packages', 'Edit packages'),
  ('upgrades.read', 'upgrades', 'View upgrade rules'),
  ('upgrades.write', 'upgrades', 'Edit upgrade rules'),
  ('ranks.read', 'ranks', 'View ranks'),
  ('ranks.write', 'ranks', 'Edit ranks'),
  ('payments.read', 'payments', 'View payment methods'),
  ('payments.write', 'payments', 'Edit payment methods'),
  ('promotions.read', 'promotions', 'View promotions'),
  ('promotions.write', 'promotions', 'Edit promotions'),
  ('flags.read', 'flags', 'View feature flags'),
  ('flags.write', 'flags', 'Edit feature flags'),
  ('ui.read', 'ui', 'View UI config'),
  ('ui.write', 'ui', 'Edit UI config'),
  ('audit.read', 'audit', 'View audit logs'),
  ('finance.approve', 'finance', 'Approve financial actions')
ON CONFLICT (permission_key) DO NOTHING;

-- Grant super_admin all permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r CROSS JOIN admin_permissions p
WHERE r.role_key = 'super_admin'
ON CONFLICT DO NOTHING;

-- ─── Seed: feature flags ───────────────────────────────────────────
INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
  ('package_purchases', 'Package Purchases', 'Enable package checkout', true),
  ('team_creation', 'Team Creation', 'Allow team foundation flow', true),
  ('external_payments', 'External Payments', 'Manual payment rails', false),
  ('promotions_engine', 'Promotions Engine', 'Apply active promotions', true)
ON CONFLICT (flag_key) DO NOTHING;

-- ─── Seed: team & wallet rules ─────────────────────────────────────
INSERT INTO team_policy_rules (rule_key, value_json) VALUES
  ('min_level_create_team', '{"level":3}'::jsonb),
  ('max_team_members_default', '{"max":100}'::jsonb),
  ('invite_expiry_hours', '{"hours":168}'::jsonb)
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO wallet_rules_config (rule_key, wallet_type, value_json) VALUES
  ('withdrawal_min_egp', 'EARNINGS', '{"min":500}'::jsonb),
  ('withdrawal_fee_pct', 'EARNINGS', '{"pct":0}'::jsonb),
  ('cmoney_transfer_enabled', 'CMONEY', '{"enabled":true}'::jsonb)
ON CONFLICT (rule_key) DO NOTHING;

-- ─── Seed: upgrade rules from packages (when catalog exists) ───────
-- Direct purchases from level 0
INSERT INTO package_upgrade_rules (rule_type, from_membership_level, via_package_id, resulting_level, priority)
SELECT 'direct', 0, p.id, p.package_level, 10
FROM packages p
WHERE p.is_active = true
  AND COALESCE(p.is_upgrade_only, false) = false
  AND p.package_level IN (1, 3, 7)
  AND NOT EXISTS (SELECT 1 FROM package_upgrade_rules r WHERE r.via_package_id = p.id AND r.rule_type = 'direct')
ON CONFLICT DO NOTHING;

-- Upgrade paths via is_upgrade_only packages
INSERT INTO package_upgrade_rules (rule_type, from_membership_level, via_package_id, resulting_level, priority)
SELECT 'upgrade', p.required_current_level, p.id, p.can_upgrade_to_level, 20
FROM packages p
WHERE p.is_active = true
  AND COALESCE(p.is_upgrade_only, false) = true
  AND p.required_current_level IS NOT NULL
  AND p.can_upgrade_to_level IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM package_upgrade_rules r WHERE r.via_package_id = p.id AND r.rule_type = 'upgrade')
ON CONFLICT DO NOTHING;

-- Fallback: infer from package_level for legacy rows
INSERT INTO package_upgrade_rules (rule_type, from_membership_level, via_package_id, resulting_level, priority)
SELECT 'upgrade', 1, p.id, 3, 20 FROM packages p
WHERE p.name = 'ثنائي' AND p.is_active = true
  AND NOT EXISTS (SELECT 1 FROM package_upgrade_rules r WHERE r.via_package_id = p.id)
ON CONFLICT DO NOTHING;

INSERT INTO package_upgrade_rules (rule_type, from_membership_level, via_package_id, resulting_level, priority)
SELECT 'upgrade', 3, p.id, 7, 20 FROM packages p
WHERE p.name = 'رباعي' AND p.is_active = true
  AND NOT EXISTS (SELECT 1 FROM package_upgrade_rules r WHERE r.via_package_id = p.id)
ON CONFLICT DO NOTHING;

-- RLS
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'package_upgrade_rules','rank_requirements','rank_rewards','promotions',
    'promotion_rules','feature_flags','ui_configurations','team_policy_rules',
    'wallet_rules_config','admin_roles','admin_permissions','admin_role_permissions',
    'user_admin_roles','config_version_snapshots','business_events'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
      EXECUTE format('CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;
