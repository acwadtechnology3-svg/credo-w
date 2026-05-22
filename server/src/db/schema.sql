-- Write the complete SQL below exactly as given.
-- This file is NOT run by Node.js.
-- It must be copy-pasted into Supabase SQL Editor manually.

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- RANKS (must exist before users)
CREATE TABLE ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  pbv_required DECIMAL(12,2) DEFAULT 0,
  matching_bv_required DECIMAL(12,2) DEFAULT 0,
  directs_required INT DEFAULT 0,
  commission_pct DECIMAL(5,2) DEFAULT 0,
  weekly_cap_egp DECIMAL(12,2) DEFAULT 0,
  monthly_cap_egp DECIMAL(12,2) DEFAULT 0,
  rank_bonus_usd DECIMAL(10,2) DEFAULT 0,
  direct_commission_pct DECIMAL(5,2) DEFAULT 0,
  lead_team_bonus_pct DECIMAL(5,2) DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PACKAGES (business rules — managed by super_admin)
CREATE TABLE packages (
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

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_code VARCHAR UNIQUE,
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  cmoney_pin_hash VARCHAR,
  cmoney_pin_attempts INT DEFAULT 0,
  cmoney_locked_until TIMESTAMPTZ,
  role VARCHAR DEFAULT 'ambassador' CHECK (role IN ('customer','ambassador','franchise','admin','super_admin')),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  sponsor_id UUID REFERENCES users(id),
  rank_id UUID REFERENCES ranks(id),
  total_pv DECIMAL(12,2) DEFAULT 0,
  commission_earned_this_week DECIMAL(12,2) DEFAULT 0,
  commission_earned_this_month DECIMAL(12,2) DEFAULT 0,
  withdrawal_this_week DECIMAL(12,2) DEFAULT 0,
  withdrawal_this_month DECIMAL(12,2) DEFAULT 0,
  commission_paid_total DECIMAL(12,2) DEFAULT 0,
  direct_count INT DEFAULT 0,
  currency VARCHAR DEFAULT 'EGP',
  full_name VARCHAR,
  title VARCHAR DEFAULT 'Mr',
  national_id VARCHAR UNIQUE,
  phone VARCHAR,
  country VARCHAR DEFAULT 'Egypt',
  profile_image VARCHAR,
  active_date TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TREE NODES (binary placement)
CREATE TABLE tree_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tree_nodes(id),
  side VARCHAR CHECK (side IN ('LEFT','RIGHT')),
  depth_level INT DEFAULT 0,
  path TEXT NOT NULL DEFAULT '',
  placed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tree_parent_side ON tree_nodes(parent_id, side);
CREATE INDEX idx_tree_path ON tree_nodes(path);

-- WALLETS
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('EARNINGS','CMONEY','PEARLS')),
  balance DECIMAL(15,2) DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- WALLET TRANSACTIONS
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  user_id UUID NOT NULL REFERENCES users(id),
  category VARCHAR NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  description VARCHAR,
  ref_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_wtx_user ON wallet_transactions(user_id);
CREATE INDEX idx_wtx_wallet ON wallet_transactions(wallet_id);

-- BV LOGS
CREATE TABLE bv_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  side VARCHAR NOT NULL CHECK (side IN ('LEFT','RIGHT')),
  amount DECIMAL(12,2) NOT NULL,
  source_user_id UUID REFERENCES users(id),
  order_id UUID,
  note VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_bv_user ON bv_logs(user_id);

-- PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR DEFAULT 'ALL',
  name VARCHAR NOT NULL,
  description TEXT,
  price_egp DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 14.0,
  bv_points INT DEFAULT 0,
  pv_points INT DEFAULT 0,
  image_url VARCHAR,
  is_package BOOLEAN DEFAULT false,
  direct_commission_egp DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  stock INT DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CART ITEMS
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- SHIPPING ADDRESSES
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR,
  phone VARCHAR,
  country VARCHAR DEFAULT 'Egypt',
  governorate VARCHAR,
  city VARCHAR,
  zip_code VARCHAR,
  building_number VARCHAR,
  floor_number VARCHAR,
  apartment VARCHAR,
  address TEXT,
  delivery_notes TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref VARCHAR UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  shipping_addr_id UUID REFERENCES shipping_addresses(id),
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  status VARCHAR DEFAULT 'pending',
  payment_method VARCHAR DEFAULT 'cmoney',
  bv_credited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_user ON orders(user_id);

-- ORDER ITEMS
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  bv_points INT DEFAULT 0
);

-- COMMISSION CYCLES
CREATE TABLE commission_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  total_paid DECIMAL(12,2) DEFAULT 0,
  users_processed INT DEFAULT 0,
  ran_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start)
);

-- TEAM COMMISSIONS
CREATE TABLE team_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES commission_cycles(id),
  user_id UUID NOT NULL REFERENCES users(id),
  pay_leg_volume DECIMAL(12,2) DEFAULT 0,
  left_carry DECIMAL(12,2) DEFAULT 0,
  right_carry DECIMAL(12,2) DEFAULT 0,
  commission_pct DECIMAL(5,2) DEFAULT 0,
  rank_at_time VARCHAR,
  commission_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_id, user_id)
);

-- LEVEL BONUSES
CREATE TABLE level_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  source_user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  level_number INT NOT NULL,
  bv_amount DECIMAL(12,2) DEFAULT 0,
  bonus_pct DECIMAL(5,2) DEFAULT 0,
  bonus_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VOUCHERS
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  discount_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR DEFAULT 'available' CHECK (status IN ('available','redeemed','expired')),
  expires_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WITHDRAWALS
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  processing_fee DECIMAL(12,2) DEFAULT 0,
  payable_amount DECIMAL(12,2) NOT NULL,
  bank_account_id UUID,
  status VARCHAR DEFAULT 'requested' CHECK (status IN ('requested','processing','paid','rejected','cancelled')),
  paid_at TIMESTAMPTZ,
  admin_note VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BANK ACCOUNTS
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name VARCHAR NOT NULL,
  bank_name VARCHAR NOT NULL,
  account_number VARCHAR NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notif_user ON notifications(user_id, is_read);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR NOT NULL,
  entity VARCHAR NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SYSTEM SETTINGS
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description VARCHAR,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MARKETING ASSETS
CREATE TABLE marketing_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  type VARCHAR DEFAULT 'presentation',
  language VARCHAR DEFAULT 'en',
  region VARCHAR DEFAULT 'egypt',
  file_url VARCHAR,
  thumbnail_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUPPORT TICKETS
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  category VARCHAR,
  message TEXT NOT NULL,
  status VARCHAR DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PEARLS TRANSACTIONS
CREATE TABLE pearls_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount INT NOT NULL,
  description VARCHAR,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  price_egp DECIMAL(12,2) DEFAULT 0,
  duration_days INT DEFAULT 365,
  is_active BOOLEAN DEFAULT true
);

-- USER SUBSCRIPTIONS
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active','expired','cancelled'))
);
