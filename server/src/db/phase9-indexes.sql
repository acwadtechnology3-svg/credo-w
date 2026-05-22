-- Phase 9 — performance indexes + updated_at trigger (run in Supabase SQL Editor)

CREATE INDEX IF NOT EXISTS idx_users_sponsor ON users(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_category ON wallet_transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_bv_logs_user_side ON bv_logs(user_id, side);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_commissions_cycle ON team_commissions(cycle_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
