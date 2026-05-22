-- Run this AFTER schema.sql in Supabase SQL Editor

-- RANKS SEED
INSERT INTO ranks (name, pbv_required, matching_bv_required, directs_required, commission_pct, weekly_cap_egp, rank_bonus_usd, direct_commission_pct, sort_order) VALUES
('BAP',           10, 0,     0, 0,  0,      0,    0,  1),
('Star Achiever', 10, 200,   2, 10, 5000,   10,   10, 2),
('Bronze Star',   10, 600,   2, 10, 10000,  20,   10, 3),
('Silver Star',   10, 800,   3, 10, 15000,  40,   10, 4),
('Gold Star',     10, 1200,  4, 10, 20000,  60,   10, 5),
('Platinum Star', 10, 2000,  5, 10, 30000,  100,  10, 6),
('Sapphire',      10, 4000,  6, 10, 50000,  200,  10, 7),
('Emerald',       10, 8000,  7, 10, 80000,  400,  10, 8),
('Diamond',       10, 15000, 8, 10, 150000, 1000, 10, 9);

-- SYSTEM SETTINGS SEED
INSERT INTO system_settings (key, value, description) VALUES
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
('commission_run_day',           '0',    'Day of week for commission run (0=Sunday)');

-- SAMPLE PRODUCTS SEED
INSERT INTO products (category, name, description, price_egp, tax_rate, bv_points, pv_points, is_package, direct_commission_egp) VALUES
('LICENSES',  'Global License',       'Access to the Credo W platform', 1750,  14, 0,   50,  false, 0),
('PACKAGES',  'Level Up Package',     'Premium ambassador package',      43000, 14, 390, 390, true, 1800),
('PACKAGES',  'Standard Package',     'Standard ambassador package',     11250, 14, 100, 100, true, 400),
('RZN_BEAUTY','Pure Vibe Hair Mist',  'Refresh and protect hair',        390,   14, 5,   5,   false, 0),
('RZN_BEAUTY','RZN Sample Set',       'Complete sample collection',      990,   14, 10,  10,  false, 0),
('RZN_BEAUTY','Go Berry Body Wash',   'Berry antioxidant body wash',     159,   14, 3,   3,   false, 0);
