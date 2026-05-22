-- Phase D — Cumulative package upgrade system (run in Supabase SQL Editor after phase-super-admin.sql)

-- 1. Upgrade columns on packages
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS package_level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS slots INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_upgrade_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_upgrade_to_level INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS required_current_level INT DEFAULT NULL;

-- 2. Seed packages (safe: only if empty — لا تستخدم DELETE لأنه يفرّغ الجدول لو فشل الـ INSERT)
INSERT INTO packages (name, package_level, slots, price_egp, bv_points, pv_points, direct_commission_egp, is_upgrade_only, required_current_level, can_upgrade_to_level, sort_order, description, is_active)
SELECT * FROM (VALUES
  ('أحادي',  1, 1, 5000::decimal,  500,  500,  400::decimal,  false, NULL::int, 3,  1, 'الباقة الأساسية — slot واحد في الشجرة', true),
  ('ثنائي',  2, 2, 6000::decimal,  600,  600,  500::decimal,  true,  1,    3,  2, 'ترقية من أحادي — يضيف 2 slots ليصبح ثلاثي', true),
  ('ثلاثي',  3, 3, 10000::decimal, 1000, 1000, 900::decimal,  false, NULL::int, 7,  3, 'الباقة المتوسطة — 3 slots في الشجرة', true),
  ('رباعي',  4, 4, 12000::decimal, 1200, 1200, 1000::decimal, true,  3,    7,  4, 'ترقية من ثلاثي — يضيف 4 slots ليصبح سباعي', true),
  ('سباعي',  7, 7, 20000::decimal, 2000, 2000, 1800::decimal, false, NULL::int, NULL::int, 5, 'الباقة الكاملة — 7 slots في الشجرة', true)
) AS v(name, package_level, slots, price_egp, bv_points, pv_points, direct_commission_egp, is_upgrade_only, required_current_level, can_upgrade_to_level, sort_order, description, is_active)
WHERE NOT EXISTS (SELECT 1 FROM packages LIMIT 1);

-- 3. Purchase history (cumulative — each row adds slots/BV)
CREATE TABLE IF NOT EXISTS user_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  package_id UUID NOT NULL REFERENCES packages(id),
  order_id UUID REFERENCES orders(id),
  package_level INT NOT NULL,
  slots_added INT NOT NULL,
  is_upgrade BOOLEAN DEFAULT false,
  previous_level INT DEFAULT NULL,
  resulting_level INT DEFAULT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_packages_user ON user_packages(user_id);

-- 4. User package state on users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS current_package_level INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_slots INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_slots_purchased INT DEFAULT 0;

-- 5. Allowed upgrade lookup (for admin/reporting)
CREATE OR REPLACE FUNCTION get_allowed_upgrade(p_user_id UUID)
RETURNS TABLE(package_id UUID, name VARCHAR, package_level INT, slots INT, price_egp DECIMAL, bv_points INT, direct_commission_egp DECIMAL) AS $$
DECLARE
  v_current_level INT;
BEGIN
  SELECT current_package_level INTO v_current_level FROM users WHERE id = p_user_id;

  RETURN QUERY
  SELECT p.id, p.name, p.package_level, p.slots, p.price_egp, p.bv_points, p.direct_commission_egp
  FROM packages p
  WHERE p.is_upgrade_only = true
    AND p.required_current_level = v_current_level
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql;
