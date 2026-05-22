-- Phase A — Admin Control: Ban, Deposits, KYC, Reports

-- 1. Ban system columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ban_type VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ban_reason VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ban_scope VARCHAR[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Deposit requests
CREATE TABLE IF NOT EXISTS deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR NOT NULL,
  receipt_url VARCHAR,
  receipt_note VARCHAR,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  admin_note VARCHAR,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposit_requests(status);

-- 3. KYC documents
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  national_id_front_url VARCHAR,
  national_id_back_url VARCHAR,
  selfie_url VARCHAR,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending','under_review','verified','rejected')),
  rejection_reason VARCHAR,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. KYC status on users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_kyc_status_check;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS kyc_status VARCHAR DEFAULT 'not_submitted';
ALTER TABLE users ADD CONSTRAINT users_kyc_status_check
  CHECK (kyc_status IN ('not_submitted','pending','under_review','verified','rejected'));

-- 5. Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR UNIQUE NOT NULL,
  title VARCHAR NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO notification_templates (key, title, body) VALUES
('ban_temporary', 'Account temporarily suspended', 'Your account has been suspended until {{ban_expires_at}}. Reason: {{reason}}'),
('ban_permanent', 'Account permanently suspended', 'Your account has been permanently suspended. Reason: {{reason}}'),
('unban', 'Account reactivated', 'Your account has been reactivated. You can now access all features.'),
('deposit_confirmed', 'Deposit confirmed', 'Your deposit of EGP {{amount}} has been confirmed and added to your wallet.'),
('deposit_rejected', 'Deposit rejected', 'Your deposit request of EGP {{amount}} was rejected. Reason: {{reason}}'),
('kyc_approved', 'Identity verified', 'Your identity has been verified successfully. Your account is now fully verified.'),
('kyc_rejected', 'Identity verification failed', 'Your identity verification was rejected. Reason: {{reason}}. Please resubmit.')
ON CONFLICT (key) DO NOTHING;
