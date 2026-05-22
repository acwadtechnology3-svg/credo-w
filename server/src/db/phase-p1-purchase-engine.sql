-- Phase P1 — Enterprise purchase & checkout engine (run after phase-p0-foundation.sql)

-- ─── Checkout sessions (price lock + single active checkout) ───────
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  package_id UUID NOT NULL REFERENCES packages(id),
  package_snapshot_id UUID REFERENCES package_snapshots(id),
  current_level_snapshot INT NOT NULL DEFAULT 0,
  amount_locked DECIMAL(12,2) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','expired','cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user ON checkout_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_expires ON checkout_sessions(expires_at)
  WHERE status = 'active';

-- One active checkout per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_one_active_per_user
  ON checkout_sessions(user_id)
  WHERE status = 'active';

-- ─── Expand purchase_transactions (P1 state machine + amounts) ───
ALTER TABLE purchase_transactions
ADD COLUMN IF NOT EXISTS checkout_session_id UUID REFERENCES checkout_sessions(id),
ADD COLUMN IF NOT EXISTS amount_total DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS amount_wallet DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_external DECIMAL(12,2) DEFAULT 0;

UPDATE purchase_transactions
SET amount_total = amount
WHERE amount_total IS NULL AND amount IS NOT NULL;

-- Drop old status constraint BEFORE migrating row values
ALTER TABLE purchase_transactions DROP CONSTRAINT IF EXISTS purchase_transactions_status_check;

-- Migrate legacy P0 statuses → P1
UPDATE purchase_transactions SET status = 'initiated' WHERE status = 'pending';

ALTER TABLE purchase_transactions ADD CONSTRAINT purchase_transactions_status_check CHECK (
  status IN (
    'initiated',
    'eligibility_checked',
    'payment_pending',
    'payment_confirmed',
    'processing',
    'completed',
    'failed',
    'compensating',
    'reversed',
    'manual_review'
  )
);

-- ─── Purchase step log (debugging + recovery) ──────────────────────
CREATE TABLE IF NOT EXISTS purchase_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_transaction_id UUID NOT NULL REFERENCES purchase_transactions(id) ON DELETE CASCADE,
  step_name VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'started'
    CHECK (status IN ('started','completed','failed','skipped')),
  error_message TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_purchase_steps_tx ON purchase_steps(purchase_transaction_id, started_at);

-- ─── State transition audit (append-only) ───────────────────────────
CREATE TABLE IF NOT EXISTS purchase_transition_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_transaction_id UUID NOT NULL REFERENCES purchase_transactions(id) ON DELETE CASCADE,
  from_status VARCHAR(24),
  to_status VARCHAR(24) NOT NULL,
  actor VARCHAR(32) NOT NULL DEFAULT 'system',
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_transitions_tx
  ON purchase_transition_log(purchase_transaction_id, created_at DESC);

-- ─── Wallet reconciliation (integrity monitoring) ────────────────
CREATE TABLE IF NOT EXISTS wallet_reconciliation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  wallet_id UUID REFERENCES wallets(id),
  purchase_transaction_id UUID REFERENCES purchase_transactions(id),
  expected_balance DECIMAL(15,2),
  actual_balance DECIMAL(15,2),
  discrepancy DECIMAL(15,2),
  issue_type VARCHAR(48) NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wallet_recon_unresolved
  ON wallet_reconciliation_logs(resolved, created_at DESC)
  WHERE resolved = false;

-- ─── Job queue prep (P1 stub — no external broker yet) ─────────────
CREATE TABLE IF NOT EXISTS purchase_job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(48) NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_jobs_pending
  ON purchase_job_queue(status, run_after)
  WHERE status = 'pending';

-- Link checkout snapshot FK when created before purchase
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'checkout_sessions_snapshot_fkey') THEN
    ALTER TABLE checkout_sessions
      ADD CONSTRAINT checkout_sessions_snapshot_fkey
      FOREIGN KEY (package_snapshot_id) REFERENCES package_snapshots(id);
  END IF;
END $$;

-- RLS on new tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'checkout_sessions','purchase_steps','purchase_transition_log',
    'wallet_reconciliation_logs','purchase_job_queue'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)', t
      );
    END IF;
  END LOOP;
END $$;
