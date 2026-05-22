-- Phase Super Admin — run in Supabase SQL Editor after schema.sql

-- 1. Add super_admin role to users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('customer', 'ambassador', 'franchise', 'admin', 'super_admin'));

-- 2. Create packages table (separate from products)
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  price_egp DECIMAL(12,2) NOT NULL,
  bv_points INT DEFAULT 0,
  pv_points INT DEFAULT 0,
  direct_commission_egp DECIMAL(12,2) DEFAULT 0,
  vouchers_count INT DEFAULT 0,
  pearls_amount INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add monthly caps to system_settings
INSERT INTO system_settings (key, value, description) VALUES
('weekly_commission_cap_egp',   '30000',  'الحد الأسبوعي لعمولة الفريق'),
('monthly_commission_cap_egp',  '300000', 'الحد الشهري لعمولة الفريق'),
('weekly_withdrawal_cap_egp',   '30000',  'الحد الأسبوعي للسحب'),
('monthly_withdrawal_cap_egp',  '300000', 'الحد الشهري للسحب'),
('min_deposit_egp',             '500',    'الحد الأدنى للإيداع'),
('pin_lock_attempts',           '3',      'عدد محاولات PIN قبل القفل'),
('pin_lock_minutes',            '30',     'مدة قفل PIN بالدقائق'),
('commission_run_schedule',     'weekly', 'جدول العمولة: daily / weekly / monthly'),
('maintenance_mode',            'false',  'وضع الصيانة — true = الموقع متوقف'),
('usd_to_egp_rate',             '50',     'سعر صرف الدولار للعمولات الدولارية'),
('fast_start_milestone_1',      '500',    'Fast Start milestone 1 (EGP)'),
('fast_start_milestone_2',      '1000',   'Fast Start milestone 2 (EGP)'),
('fast_start_milestone_3',      '2000',   'Fast Start milestone 3 (EGP)')
ON CONFLICT (key) DO NOTHING;

-- 4. Add monthly tracking to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS commission_earned_this_week DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_earned_this_month DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS withdrawal_this_week DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS withdrawal_this_month DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_paid_total DECIMAL(12,2) DEFAULT 0;

-- 5. Add lead_team_bonus_pct to ranks
ALTER TABLE ranks
ADD COLUMN IF NOT EXISTS lead_team_bonus_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_cap_egp DECIMAL(12,2) DEFAULT 0;

-- 6. Seed packages with correct values from contract
INSERT INTO packages (name, description, price_egp, bv_points, pv_points, direct_commission_egp, sort_order) VALUES
('Package 1', 'الباقة الأساسية', 5000,  500,  500,  400,  1),
('Package 2', 'الباقة المتوسطة', 10000, 1000, 1000, 1000, 2),
('Package 3', 'الباقة المتقدمة', 22000, 2200, 2200, 1800, 3);

-- 7. Update ranks with monthly caps
UPDATE ranks SET monthly_cap_egp = 0      WHERE name = 'BAP';
UPDATE ranks SET monthly_cap_egp = 20000  WHERE name = 'Star Achiever';
UPDATE ranks SET monthly_cap_egp = 40000  WHERE name = 'Bronze Star';
UPDATE ranks SET monthly_cap_egp = 60000  WHERE name = 'Silver Star';
UPDATE ranks SET monthly_cap_egp = 80000  WHERE name = 'Gold Star';
UPDATE ranks SET monthly_cap_egp = 120000 WHERE name = 'Platinum Star';
UPDATE ranks SET monthly_cap_egp = 200000 WHERE name = 'Sapphire';
UPDATE ranks SET monthly_cap_egp = 300000 WHERE name = 'Emerald';
UPDATE ranks SET monthly_cap_egp = 300000 WHERE name = 'Diamond';

-- 8. Super admin account (password: SuperAdmin@2026)
-- USR-000000 often already exists from admin-bootstrap.sql — promote it, don't insert a duplicate.
INSERT INTO users (user_code, username, email, password_hash, full_name, role, status, country)
VALUES (
  'USR-000000',
  'superadmin',
  'superadmin@credow.com',
  '$2b$10$NAkXkLTSCz4l/SJGQjfXs.RHpz9PrhU8oHtJuCzo0o/UWpoUf6ncy',
  'Super Admin',
  'super_admin',
  'active',
  'Egypt'
)
ON CONFLICT (user_code) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  role = 'super_admin',
  status = 'active',
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name;

-- Wallets for super_admin
INSERT INTO wallets (user_id, type, balance)
SELECT u.id, w.type, 0
FROM users u
CROSS JOIN (VALUES ('EARNINGS'), ('CMONEY'), ('PEARLS')) AS w(type)
WHERE u.user_code = 'USR-000000' OR u.role = 'super_admin'
ON CONFLICT (user_id, type) DO NOTHING;
