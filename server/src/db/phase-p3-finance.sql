-- Phase P3 — Enterprise Finance & Payment Infrastructure (run after phase-p2-business-control.sql)

-- ─── 1. Wallet type catalog ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_type_definitions (
  type_key VARCHAR(32) PRIMARY KEY,
  name_en VARCHAR(80) NOT NULL,
  name_ar VARCHAR(80),
  currency VARCHAR(8) NOT NULL DEFAULT 'EGP',
  can_withdraw BOOLEAN NOT NULL DEFAULT false,
  can_transfer BOOLEAN NOT NULL DEFAULT false,
  can_pay_packages BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  rules_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO wallet_type_definitions (type_key, name_en, name_ar, can_withdraw, can_transfer, can_pay_packages, sort_order) VALUES
  ('CMONEY', 'C Money', 'سي موني', false, true, true, 1),
  ('EARNINGS', 'Earnings', 'الأرباح', true, false, false, 2),
  ('BONUS', 'Bonus Wallet', 'محفظة البونص', false, false, false, 3),
  ('LOCKED', 'Locked', 'مجمّد', false, false, false, 4),
  ('PENDING', 'Pending Settlement', 'قيد التسوية', false, false, false, 5),
  ('PROMO', 'Promotional Credits', 'رصيد ترويجي', false, false, true, 6),
  ('CASHBACK', 'Cashback', 'كاش باك', false, false, true, 7),
  ('RANK_REWARD', 'Rank Rewards', 'مكافآت الرتبة', false, false, false, 8),
  ('PEARLS', 'Pearls', 'اللآلئ', false, false, false, 9)
ON CONFLICT (type_key) DO NOTHING;

-- Expand wallet types (drop/recreate check)
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_type_check;
ALTER TABLE wallets ADD CONSTRAINT wallets_type_check CHECK (
  type IN ('EARNINGS','CMONEY','PEARLS','BONUS','LOCKED','PENDING','PROMO','CASHBACK','RANK_REWARD')
);

-- ─── 2. Immutable ledger ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  wallet_type VARCHAR(32) NOT NULL,
  entry_type VARCHAR(32) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'EGP',
  category VARCHAR(48) NOT NULL,
  description TEXT,
  ref_type VARCHAR(48),
  ref_id UUID,
  wallet_transaction_id UUID REFERENCES wallet_transactions(id),
  payment_session_id UUID,
  idempotency_key VARCHAR(128),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_idempotency
  ON wallet_ledger_entries(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_user ON wallet_ledger_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_wallet ON wallet_ledger_entries(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_ref ON wallet_ledger_entries(ref_type, ref_id);

-- ─── 3. Wallet holds (hybrid reserve) ──────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  wallet_type VARCHAR(32) NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  payment_session_id UUID,
  status VARCHAR(24) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','released','consumed','expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wallet_holds_user ON wallet_holds(user_id, status);

-- ─── 4. Payment sessions (hybrid + external) ───────────────────────
CREATE TABLE IF NOT EXISTS payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkout_session_id UUID REFERENCES checkout_sessions(id),
  package_id UUID REFERENCES packages(id),
  purchase_transaction_id UUID REFERENCES purchase_transactions(id),
  payment_method_id UUID REFERENCES payment_methods_config(id),
  status VARCHAR(32) NOT NULL DEFAULT 'INITIATED'
    CHECK (status IN (
      'INITIATED','WALLET_RESERVED','EXTERNAL_PENDING','UNDER_REVIEW',
      'APPROVED','REJECTED','COMPLETED','FAILED','EXPIRED','REVERSED','REFUNDED'
    )),
  total_amount DECIMAL(15,2) NOT NULL,
  wallet_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  external_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'EGP',
  allocations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key VARCHAR(128),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_sessions_idem
  ON payment_sessions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user ON payment_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON payment_sessions(status, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_session_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_session_id UUID NOT NULL REFERENCES payment_sessions(id) ON DELETE CASCADE,
  from_status VARCHAR(32),
  to_status VARCHAR(32) NOT NULL,
  actor_id UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. Payment proofs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_session_id UUID NOT NULL REFERENCES payment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proof_type VARCHAR(24) NOT NULL DEFAULT 'screenshot'
    CHECK (proof_type IN ('screenshot','receipt','transaction_id','other')),
  storage_path VARCHAR NOT NULL,
  file_hash VARCHAR(64),
  external_reference VARCHAR(128),
  amount_claimed DECIMAL(15,2),
  ocr_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_hash ON payment_proofs(file_hash) WHERE file_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_proofs_session ON payment_proofs(payment_session_id);

-- ─── 6. Manual approval queue ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_session_id UUID NOT NULL REFERENCES payment_sessions(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','needs_review','fraud_suspected','expired')),
  reviewer_id UUID REFERENCES users(id),
  risk_score INT NOT NULL DEFAULT 0,
  fraud_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  admin_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_reviews_session ON payment_reviews(payment_session_id);

-- ─── 7. Refunds & reversals ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_session_id UUID REFERENCES payment_sessions(id),
  purchase_transaction_id UUID REFERENCES purchase_transactions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(15,2) NOT NULL,
  refund_type VARCHAR(24) NOT NULL DEFAULT 'full'
    CHECK (refund_type IN ('full','partial','wallet_only','external_only')),
  status VARCHAR(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed')),
  reason TEXT,
  effects_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ─── 8. Fraud signals ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  payment_session_id UUID REFERENCES payment_sessions(id),
  signal_type VARCHAR(48) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','critical')),
  score_delta INT NOT NULL DEFAULT 10,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_user ON fraud_signals(user_id, created_at DESC);

-- ─── 9. Withdrawal enhancements ────────────────────────────────────
ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS payout_method VARCHAR(48),
ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS kyc_verified_snapshot BOOLEAN;

ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_status_check CHECK (
  status IN ('requested','pending','processing','approved','paid','rejected','cancelled')
);

-- ─── 10. Internal transfers log ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  from_wallet_type VARCHAR(32) NOT NULL,
  to_wallet_type VARCHAR(32) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'completed',
  ledger_entry_id UUID REFERENCES wallet_ledger_entries(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 11. Finance analytics events ──────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(48) NOT NULL,
  user_id UUID REFERENCES users(id),
  amount DECIMAL(15,2),
  currency VARCHAR(8) DEFAULT 'EGP',
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_analytics_type ON finance_analytics_events(event_type, created_at DESC);

-- ─── 12. Payment methods columns (from P2 — safe if P2 not run yet) ─
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

-- ─── 12b. Seed external payment methods ────────────────────────────
ALTER TABLE payment_methods_config DROP CONSTRAINT IF EXISTS payment_methods_config_method_type_check;
ALTER TABLE payment_methods_config ADD CONSTRAINT payment_methods_config_method_type_check CHECK (
  method_type IN ('internal_wallet','external_manual','external_gateway','external','crypto')
);

INSERT INTO payment_methods_config (code, name, name_ar, method_type, requires_proof, sort_order, config_json) VALUES
  ('instapay', 'Instapay', 'إنستاباي', 'external_manual', true, 10, '{"instructions_ar":"حوّل المبلغ ثم ارفع إثبات الدفع"}'::jsonb),
  ('vodafone_cash', 'Vodafone Cash', 'فودافون كاش', 'external_manual', true, 11, '{}'::jsonb),
  ('bank_transfer', 'Bank Transfer', 'تحويل بنكي', 'external_manual', true, 12, '{}'::jsonb),
  ('usdt', 'USDT', 'USDT', 'external_manual', true, 20, '{"network":"TRC20"}'::jsonb),
  ('binance_pay', 'Binance Pay', 'بينانس باي', 'external_manual', true, 21, '{}'::jsonb)
ON CONFLICT (code) DO NOTHING;

UPDATE payment_methods_config SET is_active = true WHERE code IN ('cmoney','instapay','vodafone_cash','bank_transfer');

-- ─── 13. wallet_apply_delta → ledger (replace function) ─────────────
CREATE OR REPLACE FUNCTION wallet_apply_delta(
  p_user_id UUID,
  p_wallet_type VARCHAR,
  p_delta DECIMAL,
  p_category VARCHAR,
  p_description VARCHAR,
  p_ref_id UUID DEFAULT NULL,
  p_ref_type VARCHAR DEFAULT NULL,
  p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_balance_before DECIMAL(15,2);
  v_new_balance DECIMAL(15,2);
  v_tx_id UUID;
  v_ledger_id UUID;
BEGIN
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'ZERO_DELTA';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM wallet_ledger_entries WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'DUPLICATE_TRANSACTION';
    END IF;
  END IF;

  SELECT * INTO v_wallet
  FROM wallets
  WHERE user_id = p_user_id AND type = p_wallet_type
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  v_balance_before := ROUND(v_wallet.balance::numeric, 2);
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

  INSERT INTO wallet_ledger_entries (
    user_id, wallet_id, wallet_type, entry_type,
    amount, balance_before, balance_after, currency,
    category, description, ref_type, ref_id,
    wallet_transaction_id, idempotency_key
  ) VALUES (
    p_user_id, v_wallet.id, p_wallet_type,
    CASE WHEN p_delta >= 0 THEN 'credit' ELSE 'debit' END,
    p_delta, v_balance_before, v_new_balance, 'EGP',
    p_category, p_description, p_ref_type, p_ref_id,
    v_tx_id, p_idempotency_key
  )
  RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object(
    'wallet_id', v_wallet.id,
    'transaction_id', v_tx_id,
    'ledger_entry_id', v_ledger_id,
    'balance_before', v_balance_before,
    'balance_after', v_new_balance,
    'amount', p_delta
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'DUPLICATE_TRANSACTION';
END;
$$;

-- ─── 14. Ensure extended wallets for existing users ────────────────
INSERT INTO wallets (user_id, type, balance)
SELECT u.id, w.type_key, 0
FROM users u
CROSS JOIN wallet_type_definitions w
WHERE w.type_key IN ('BONUS','LOCKED','PENDING','PROMO','CASHBACK','RANK_REWARD')
  AND NOT EXISTS (
    SELECT 1 FROM wallets wx WHERE wx.user_id = u.id AND wx.type = w.type_key
  );

-- RLS
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'wallet_type_definitions','wallet_ledger_entries','wallet_holds',
    'payment_sessions','payment_session_transitions','payment_proofs',
    'payment_reviews','financial_refunds','fraud_signals','wallet_transfers',
    'finance_analytics_events'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
      EXECUTE format('CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;
