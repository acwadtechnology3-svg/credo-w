-- Phase 6: Enterprise MLM Intelligence, Compensation & Propagation
-- Run after schema.sql, packages, tree, phase-p5-* migrations

-- =============================================================================
-- Compensation rules (super admin configurable)
-- =============================================================================
CREATE TABLE IF NOT EXISTS mlm_compensation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key VARCHAR(64) UNIQUE NOT NULL,
  label VARCHAR(120) NOT NULL,
  category VARCHAR(32) NOT NULL CHECK (category IN (
    'binary','direct','matching','leadership','fast_start','agency','rank','carry','overflow','fraud'
  )),
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Immutable MLM event log
-- =============================================================================
CREATE TABLE IF NOT EXISTS mlm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(48) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID,
  sponsor_user_id UUID REFERENCES users(id),
  placement_parent_id UUID,
  package_id UUID,
  order_id UUID,
  purchase_transaction_id UUID,
  bv_amount DECIMAL(15,2) DEFAULT 0,
  cv_amount DECIMAL(15,2) DEFAULT 0,
  pv_amount DECIMAL(15,2) DEFAULT 0,
  idempotency_key VARCHAR(128) UNIQUE,
  processing_status VARCHAR(24) NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending','processing','completed','failed','reversed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mlm_events_user ON mlm_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mlm_events_status ON mlm_events(processing_status) WHERE processing_status IN ('pending','processing');
CREATE INDEX IF NOT EXISTS idx_mlm_events_type ON mlm_events(event_type, created_at DESC);

-- Async job queue for propagation
CREATE TABLE IF NOT EXISTS mlm_job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(48) NOT NULL,
  event_id UUID REFERENCES mlm_events(id) ON DELETE CASCADE,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  idempotency_key VARCHAR(128) UNIQUE,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mlm_job_pending ON mlm_job_queue(status, scheduled_at) WHERE status = 'pending';

-- BV propagation audit trail
CREATE TABLE IF NOT EXISTS bv_propagation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES mlm_events(id) ON DELETE CASCADE,
  propagation_id UUID NOT NULL,
  beneficiary_user_id UUID NOT NULL REFERENCES users(id),
  source_user_id UUID NOT NULL REFERENCES users(id),
  side VARCHAR NOT NULL CHECK (side IN ('LEFT','RIGHT')),
  bv_amount DECIMAL(15,2) NOT NULL,
  depth_level INT NOT NULL DEFAULT 0,
  leg_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bv_prop_event ON bv_propagation_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_bv_prop_beneficiary ON bv_propagation_logs(beneficiary_user_id, created_at DESC);

-- User metric snapshots (PV/BV/CV/GV/TV)
CREATE TABLE IF NOT EXISTS user_metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES mlm_events(id),
  period_key VARCHAR(16) NOT NULL DEFAULT 'lifetime',
  pv DECIMAL(15,2) NOT NULL DEFAULT 0,
  bv_personal DECIMAL(15,2) NOT NULL DEFAULT 0,
  bv_left DECIMAL(15,2) NOT NULL DEFAULT 0,
  bv_right DECIMAL(15,2) NOT NULL DEFAULT 0,
  bv_matching DECIMAL(15,2) NOT NULL DEFAULT 0,
  cv DECIMAL(15,2) NOT NULL DEFAULT 0,
  gv DECIMAL(15,2) NOT NULL DEFAULT 0,
  tv DECIMAL(15,2) NOT NULL DEFAULT 0,
  direct_count INT NOT NULL DEFAULT 0,
  active_direct_count INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_user_metrics_user ON user_metric_snapshots(user_id);

-- Carry forward & overflow
CREATE TABLE IF NOT EXISTS carry_forward_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES mlm_events(id),
  period_key VARCHAR(16) NOT NULL,
  left_carry DECIMAL(15,2) NOT NULL DEFAULT 0,
  right_carry DECIMAL(15,2) NOT NULL DEFAULT 0,
  left_matched DECIMAL(15,2) NOT NULL DEFAULT 0,
  right_matched DECIMAL(15,2) NOT NULL DEFAULT 0,
  weak_leg VARCHAR CHECK (weak_leg IN ('LEFT','RIGHT')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS overflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES mlm_events(id),
  side VARCHAR NOT NULL CHECK (side IN ('LEFT','RIGHT')),
  overflow_amount DECIMAL(15,2) NOT NULL,
  reason VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Commission calculations & payouts
CREATE TABLE IF NOT EXISTS commission_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES mlm_events(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commission_type VARCHAR(32) NOT NULL,
  formula_key VARCHAR(64),
  base_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  rate_pct DECIMAL(8,4) NOT NULL DEFAULT 0,
  calculated_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  capped_amount DECIMAL(15,2),
  status VARCHAR(20) NOT NULL DEFAULT 'calculated'
    CHECK (status IN ('pending','calculated','approved','locked','paid','reversed','expired')),
  period_key VARCHAR(16),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key VARCHAR(128) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_calc_user ON commission_calculations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_calc_event ON commission_calculations(event_id);

CREATE TABLE IF NOT EXISTS commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID NOT NULL REFERENCES commission_calculations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(15,2) NOT NULL,
  wallet_tx_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','locked','paid','reversed','cancelled')),
  approved_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  audit_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payout_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID REFERENCES commission_payouts(id),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(32) NOT NULL,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rank qualification
CREATE TABLE IF NOT EXISTS rank_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank_id UUID NOT NULL REFERENCES ranks(id),
  event_id UUID REFERENCES mlm_events(id),
  qualified BOOLEAN NOT NULL DEFAULT false,
  metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rank_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank_id UUID REFERENCES ranks(id),
  rank_name VARCHAR(80),
  sort_order INT,
  event_id UUID REFERENCES mlm_events(id),
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qualification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  qualification_type VARCHAR(48) NOT NULL,
  passed BOOLEAN NOT NULL,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  event_id UUID REFERENCES mlm_events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agency MLM metrics
CREATE TABLE IF NOT EXISTS agency_metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  period_key VARCHAR(16) NOT NULL DEFAULT 'lifetime',
  agency_bv DECIMAL(15,2) NOT NULL DEFAULT 0,
  agency_cv DECIMAL(15,2) NOT NULL DEFAULT 0,
  agency_gv DECIMAL(15,2) NOT NULL DEFAULT 0,
  member_count INT NOT NULL DEFAULT 0,
  active_count INT NOT NULL DEFAULT 0,
  growth_rate DECIMAL(8,4) DEFAULT 0,
  leadership_score INT DEFAULT 0,
  retention_score INT DEFAULT 0,
  activity_score INT DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, period_key)
);

-- Fraud
CREATE TABLE IF NOT EXISTS fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  flag_type VARCHAR(48) NOT NULL,
  risk_score INT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','reviewing','cleared','confirmed')),
  event_id UUID REFERENCES mlm_events(id),
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_open ON fraud_flags(status) WHERE status = 'open';

-- Propagation locks (prevent double processing)
CREATE TABLE IF NOT EXISTS mlm_propagation_locks (
  lock_key VARCHAR(128) PRIMARY KEY,
  event_id UUID NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Default compensation rules
INSERT INTO mlm_compensation_rules (rule_key, label, category, config_json) VALUES
  ('binary_match_pct', 'Binary Matching %', 'binary', '{"default_pct":10,"min_package_level":1}'::jsonb),
  ('binary_weekly_cap', 'Binary Weekly Cap', 'binary', '{"use_rank_weekly_cap":true}'::jsonb),
  ('carry_forward', 'Carry Forward', 'carry', '{"enabled":true,"period":"weekly","max_carry":999999}'::jsonb),
  ('overflow_policy', 'Overflow Policy', 'overflow', '{"flush_excess":false,"max_imbalance_ratio":10}'::jsonb),
  ('direct_bonus', 'Direct Bonus', 'direct', '{"from_package":true}'::jsonb),
  ('cv_ratio', 'CV Ratio', 'matching', '{"cv_pct_of_bv":100}'::jsonb),
  ('fraud_self_referral', 'Self Referral Block', 'fraud', '{"enabled":true}'::jsonb),
  ('fraud_rapid_cycle', 'Rapid Cycle Detection', 'fraud', '{"max_events_per_hour":15}'::jsonb)
ON CONFLICT (rule_key) DO NOTHING;

-- Optional agency FK
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agencies') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mlm_events_agency_id_fkey') THEN
      ALTER TABLE mlm_events ADD CONSTRAINT mlm_events_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agency_metric_snapshots_agency_id_fkey') THEN
      ALTER TABLE agency_metric_snapshots ADD CONSTRAINT agency_metric_snapshots_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
