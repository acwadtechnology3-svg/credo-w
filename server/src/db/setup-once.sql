-- ============================================================
-- Credo W — تشغيل مرة واحدة في Supabase SQL Editor
-- (بديل عن npm run db:setup بدون DATABASE_URL)
--
-- المتطلب: schema.sql مُنفَّذ مسبقاً
-- الرابط: https://supabase.com/dashboard/project/yxgbmhcobqeusgetynxc/sql/new
-- ============================================================

-- 1) RLS — يسمح للسيرفر بالقراءة/الكتابة مع publishable key
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS backend_all ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY backend_all ON public.%I FOR ALL USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- 2) Seed — رتب + إعدادات + منتجات (يُتخطى تلقائياً إن وُجدت بيانات)
INSERT INTO ranks (name, pbv_required, matching_bv_required, directs_required, commission_pct, weekly_cap_egp, rank_bonus_usd, direct_commission_pct, sort_order)
SELECT * FROM (VALUES
('BAP',           10, 0,     0, 0,  0,      0,    0,  1),
('Star Achiever', 10, 200,   2, 10, 5000,   10,   10, 2),
('Bronze Star',   10, 600,   2, 10, 10000,  20,   10, 3),
('Silver Star',   10, 800,   3, 10, 15000,  40,   10, 4),
('Gold Star',     10, 1200,  4, 10, 20000,  60,   10, 5),
('Platinum Star', 10, 2000,  5, 10, 30000,  100,  10, 6),
('Sapphire',      10, 4000,  6, 10, 50000,  200,  10, 7),
('Emerald',       10, 8000,  7, 10, 80000,  400,  10, 8),
('Diamond',       10, 15000, 8, 10, 150000, 1000, 10, 9)
) AS v(name, pbv_required, matching_bv_required, directs_required, commission_pct, weekly_cap_egp, rank_bonus_usd, direct_commission_pct, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM ranks LIMIT 1);

INSERT INTO system_settings (key, value, description)
SELECT * FROM (VALUES
('min_withdrawal_egp',           '500',  'Minimum withdrawal amount in EGP'),
('withdrawal_processing_fee_pct','2',    'Withdrawal processing fee percentage'),
('bv_credit_delay_days',         '0',    'Days to delay BV credit after purchase'),
('direct_commission_pct',        '10',   'Direct commission percentage on package purchase'),
('fast_start_directs_bonus_egp', '3000', 'Bonus EGP for every 3 new directs'),
('fast_start_directs_required',  '3',    'Number of directs required for fast start bonus'),
('level_bonus_l1_pct',           '7',    'Level 1 unilevel bonus percentage'),
('level_bonus_l2_pct',           '5',    'Level 2 unilevel bonus percentage'),
('level_bonus_l3_pct',           '3',    'Level 3 unilevel bonus percentage'),
('level_bonus_l4_pct',           '2',    'Level 4 unilevel bonus percentage'),
('level_bonus_l5_pct',           '1',    'Level 5 unilevel bonus percentage'),
('tax_rate_pct',                 '14',   'Default product tax rate'),
('commission_run_day',           '0',    'Day of week for commission run (0=Sunday)')
) AS v(key, value, description)
WHERE NOT EXISTS (SELECT 1 FROM system_settings LIMIT 1);

INSERT INTO products (category, name, description, price_egp, tax_rate, bv_points, pv_points, is_package)
SELECT * FROM (VALUES
('LICENSES',  'Global License',       'Access to the Credo W platform', 1750,  14, 0,   50,  false),
('PACKAGES',  'Level Up Package',     'Premium ambassador package',      43000, 14, 390, 390, true),
('PACKAGES',  'Standard Package',     'Standard ambassador package',     11250, 14, 100, 100, true),
('RZN_BEAUTY','Pure Vibe Hair Mist',  'Refresh and protect hair',        390,   14, 5,   5,   false),
('RZN_BEAUTY','RZN Sample Set',       'Complete sample collection',      990,   14, 10,  10,  false),
('RZN_BEAUTY','Go Berry Body Wash',   'Berry antioxidant body wash',     159,   14, 3,   3,   false)
) AS v(category, name, description, price_egp, tax_rate, bv_points, pv_points, is_package)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- 3) Admin — دخول: admin / Admin@1234
INSERT INTO users (
  user_code, username, email, password_hash,
  full_name, role, status, country
) VALUES (
  'USR-000000',
  'admin',
  'admin@credow.com',
  '$2b$10$rH0.BlM9NhrNUmi.lJx0pOzF/bJV7UtL9IgVgE2Jc2cdMvK/Fz8Na',
  'Super Admin',
  'admin',
  'active',
  'Egypt'
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO wallets (user_id, type, balance)
SELECT id, 'EARNINGS', 0 FROM users WHERE username = 'admin'
ON CONFLICT (user_id, type) DO NOTHING;

INSERT INTO wallets (user_id, type, balance)
SELECT id, 'CMONEY', 0 FROM users WHERE username = 'admin'
ON CONFLICT (user_id, type) DO NOTHING;

INSERT INTO wallets (user_id, type, balance)
SELECT id, 'PEARLS', 0 FROM users WHERE username = 'admin'
ON CONFLICT (user_id, type) DO NOTHING;

INSERT INTO tree_nodes (user_id, parent_id, side, depth_level, path)
SELECT id, NULL, NULL, 0, ''
FROM users WHERE username = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- 4) Shop — cart + direct count RPC (Phase 4)
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE OR REPLACE FUNCTION increment_direct_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET direct_count = COALESCE(direct_count, 0) + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cart_items') THEN
    EXECUTE 'ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS backend_all ON public.cart_items';
    EXECUTE 'CREATE POLICY backend_all ON public.cart_items FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- رتبة BAP للأدمن + رصيد C Money (اختبار المتجر)
UPDATE users SET rank_id = (SELECT id FROM ranks WHERE sort_order = 1 LIMIT 1)
WHERE username = 'admin' AND rank_id IS NULL;

UPDATE wallets SET balance = 100000
WHERE user_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
  AND type = 'CMONEY';

-- 5) Member invitations — see member-invitations-bootstrap.sql (run separately if this block was skipped)
