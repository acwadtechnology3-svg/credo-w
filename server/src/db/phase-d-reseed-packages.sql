-- إصلاح: جدول packages فاضي بعد phase-d (شغّل هذا لو مفيش باقات في التطبيق)
-- Supabase SQL Editor → Run

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS package_level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS slots INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_upgrade_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_upgrade_to_level INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS required_current_level INT DEFAULT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS current_package_level INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_slots INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_slots_purchased INT DEFAULT 0;

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

-- أدخل الباقات فقط إذا الجدول فاضي (بدون DELETE)
INSERT INTO packages (
  name, package_level, slots, price_egp, bv_points, pv_points,
  direct_commission_egp, is_upgrade_only, required_current_level,
  can_upgrade_to_level, sort_order, description, is_active
)
SELECT * FROM (VALUES
  ('أحادي',  1, 1, 5000::decimal,  500,  500,  400::decimal,  false, NULL::int, 3,  1, 'الباقة الأساسية — slot واحد في الشجرة', true),
  ('ثنائي',  2, 2, 6000::decimal,  600,  600,  500::decimal,  true,  1,    3,  2, 'ترقية من أحادي — يضيف 2 slots ليصبح ثلاثي', true),
  ('ثلاثي',  3, 3, 10000::decimal, 1000, 1000, 900::decimal,  false, NULL::int, 7,  3, 'الباقة المتوسطة — 3 slots في الشجرة', true),
  ('رباعي',  4, 4, 12000::decimal, 1200, 1200, 1000::decimal, true,  3,    7,  4, 'ترقية من ثلاثي — يضيف 4 slots ليصبح سباعي', true),
  ('سباعي',  7, 7, 20000::decimal, 2000, 2000, 1800::decimal, false, NULL::int, NULL::int, 5, 'الباقة الكاملة — 7 slots في الشجرة', true)
) AS v(name, package_level, slots, price_egp, bv_points, pv_points, direct_commission_egp, is_upgrade_only, required_current_level, can_upgrade_to_level, sort_order, description, is_active)
WHERE NOT EXISTS (SELECT 1 FROM packages LIMIT 1);

-- تأكد إن RLS مش بيمنع السيرفر (لو بتستخدم anon key)
DROP POLICY IF EXISTS backend_all ON packages;
CREATE POLICY backend_all ON packages FOR ALL USING (true) WITH CHECK (true);

SELECT id, name, package_level, price_egp, is_active FROM packages ORDER BY sort_order;
