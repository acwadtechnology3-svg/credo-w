-- Phase P0 — Production foundation (run in Supabase SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / conditional blocks

-- ─── Package catalog (SA-prep) ───────────────────────────────────
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS rules_version INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS permissions_json JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN packages.permissions_json IS 'P0: { can_create_team, max_team_members, ... } — future SA control';

-- ─── User membership + team foundation prep ──────────────────────
ALTER TABLE users
ADD COLUMN IF NOT EXISTS current_package_level INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_slots INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_slots_purchased INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS membership_status VARCHAR(20) NOT NULL DEFAULT 'unsubscribed',
ADD COLUMN IF NOT EXISTS team_foundation_status VARCHAR(24) NOT NULL DEFAULT 'not_applicable';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_membership_status_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_membership_status_check
      CHECK (membership_status IN ('unsubscribed','active','suspended','refunded'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_team_foundation_status_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_team_foundation_status_check
      CHECK (team_foundation_status IN (
        'not_applicable','pending','completed','skipped'
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_current_package_level_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_current_package_level_check
      CHECK (current_package_level IN (0, 1, 3, 7));
  END IF;
END $$;

-- Sync membership_status from legacy rows
UPDATE users
SET membership_status = 'active'
WHERE current_package_level > 0 AND membership_status = 'unsubscribed';

-- ─── user_packages hardening ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  package_id UUID NOT NULL REFERENCES packages(id),
  purchase_transaction_id UUID,
  package_snapshot_id UUID,
  order_id UUID REFERENCES orders(id),
  package_level INT NOT NULL,
  slots_added INT NOT NULL CHECK (slots_added > 0),
  is_upgrade BOOLEAN NOT NULL DEFAULT false,
  previous_level INT NOT NULL DEFAULT 0,
  resulting_level INT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_packages
ADD COLUMN IF NOT EXISTS purchase_transaction_id UUID,
ADD COLUMN IF NOT EXISTS package_snapshot_id UUID,
ADD COLUMN IF NOT EXISTS resulting_level INT;

CREATE INDEX IF NOT EXISTS idx_user_packages_user ON user_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_purchased ON user_packages(user_id, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_packages_purchase_tx ON user_packages(purchase_transaction_id);

-- ─── Immutable package snapshot at purchase time ───────────────────
CREATE TABLE IF NOT EXISTS package_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  purchase_transaction_id UUID,
  name VARCHAR NOT NULL,
  description TEXT,
  price_egp DECIMAL(12,2) NOT NULL CHECK (price_egp >= 0),
  bv_points INT NOT NULL DEFAULT 0 CHECK (bv_points >= 0),
  pv_points INT NOT NULL DEFAULT 0 CHECK (pv_points >= 0),
  direct_commission_egp DECIMAL(12,2) NOT NULL DEFAULT 0,
  package_level INT NOT NULL,
  slots INT NOT NULL CHECK (slots > 0),
  is_upgrade_only BOOLEAN NOT NULL DEFAULT false,
  required_current_level INT,
  can_upgrade_to_level INT,
  rules_version INT NOT NULL DEFAULT 1,
  permissions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_package_snapshots_user ON package_snapshots(user_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_package_snapshots_purchase ON package_snapshots(purchase_transaction_id);

-- ─── Purchase transaction log (audit + idempotency) ───────────────
CREATE TABLE IF NOT EXISTS purchase_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  package_id UUID NOT NULL REFERENCES packages(id),
  package_snapshot_id UUID REFERENCES package_snapshots(id),
  order_id UUID REFERENCES orders(id),
  payment_method VARCHAR(32) NOT NULL DEFAULT 'cmoney',
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  previous_level INT NOT NULL DEFAULT 0,
  resulting_level INT,
  slots_added INT,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  idempotency_key VARCHAR(64) NOT NULL,
  failure_reason TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT purchase_transactions_status_check CHECK (
    status IN ('pending','processing','completed','failed','reversed')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_transactions_idempotency
  ON purchase_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_purchase_transactions_user_status
  ON purchase_transactions(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_transactions_user_created
  ON purchase_transactions(user_id, created_at DESC);

-- FK links (after both tables exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_packages_purchase_tx_fkey') THEN
    ALTER TABLE user_packages
      ADD CONSTRAINT user_packages_purchase_tx_fkey
      FOREIGN KEY (purchase_transaction_id) REFERENCES purchase_transactions(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_packages_snapshot_fkey') THEN
    ALTER TABLE user_packages
      ADD CONSTRAINT user_packages_snapshot_fkey
      FOREIGN KEY (package_snapshot_id) REFERENCES package_snapshots(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'package_snapshots_purchase_tx_fkey') THEN
    ALTER TABLE package_snapshots
      ADD CONSTRAINT package_snapshots_purchase_tx_fkey
      FOREIGN KEY (purchase_transaction_id) REFERENCES purchase_transactions(id);
  END IF;
END $$;

-- ─── Wallet ledger: prevent duplicate debit per purchase ref ───────
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_purchase_ref
  ON wallet_transactions(user_id, category, ref_id)
  WHERE category = 'PURCHASE' AND ref_id IS NOT NULL;

-- ─── Teams (create if missing — otherwise run phase-profile-identity.sql) ─
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

CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_founder ON teams(founder_id);
CREATE INDEX IF NOT EXISTS idx_teams_power ON teams(power_score DESC);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- ─── Future SA: payment methods placeholder ────────────────────────
CREATE TABLE IF NOT EXISTS payment_methods_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  method_type VARCHAR(24) NOT NULL DEFAULT 'internal_wallet'
    CHECK (method_type IN ('internal_wallet','external_manual','external_gateway')),
  wallet_types TEXT[] DEFAULT ARRAY['CMONEY'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_proof BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO payment_methods_config (code, name, method_type, wallet_types, sort_order)
VALUES ('cmoney', 'C Money Wallet', 'internal_wallet', ARRAY['CMONEY'], 1)
ON CONFLICT (code) DO NOTHING;

-- ─── Atomic wallet delta (prevents race negative balance) ──────────
CREATE OR REPLACE FUNCTION wallet_apply_delta(
  p_user_id UUID,
  p_wallet_type VARCHAR,
  p_delta DECIMAL,
  p_category VARCHAR,
  p_description VARCHAR,
  p_ref_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_new_balance DECIMAL(15,2);
  v_tx_id UUID;
BEGIN
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'ZERO_DELTA';
  END IF;

  SELECT * INTO v_wallet
  FROM wallets
  WHERE user_id = p_user_id AND type = p_wallet_type
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  v_new_balance := ROUND((v_wallet.balance + p_delta)::numeric, 2);

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  UPDATE wallets
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_wallet.id;

  INSERT INTO wallet_transactions (
    wallet_id, user_id, category, amount, balance_after, description, ref_id
  ) VALUES (
    v_wallet.id, p_user_id, p_category, p_delta, v_new_balance, p_description, p_ref_id
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'wallet_id', v_wallet.id,
    'transaction_id', v_tx_id,
    'balance_after', v_new_balance,
    'amount', p_delta
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'DUPLICATE_TRANSACTION';
END;
$$;

-- RLS: allow backend policies on new P0 tables (skip if table missing)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'user_packages','package_snapshots','purchase_transactions','payment_methods_config',
    'teams','team_members'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)',
        t
      );
    END IF;
  END LOOP;
END $$;

-- Verify P0 (optional — should return rows after success)
SELECT 'packages' AS tbl, COUNT(*)::int AS n FROM packages
UNION ALL SELECT 'package_snapshots', COUNT(*)::int FROM package_snapshots
UNION ALL SELECT 'purchase_transactions', COUNT(*)::int FROM purchase_transactions;
