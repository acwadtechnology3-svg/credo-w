-- Phase: Premium Member Invitation System
-- Run in Supabase SQL Editor after schema.sql / phase-profile-identity.sql
-- Note: `team_invitations` in phase-profile-identity.sql is for CLAN joins.
-- This table powers network / binary-tree recruitment invites.

CREATE TABLE IF NOT EXISTS member_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_email VARCHAR(255) NOT NULL,
  placement_side VARCHAR(10) NOT NULL DEFAULT 'AUTO'
    CHECK (placement_side IN ('LEFT','RIGHT','AUTO')),
  invite_code VARCHAR(32) UNIQUE NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending','opened','clicked','registered','joined_team','expired','rejected'
    )),
  invitation_message TEXT,
  invite_theme VARCHAR(32) DEFAULT 'valorant',
  card_style VARCHAR(32) DEFAULT 'holographic',
  invite_emoji VARCHAR(16) DEFAULT '🔥',
  invite_channel VARCHAR(20) DEFAULT 'email',
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  registered_user_id UUID REFERENCES users(id),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_inv_inviter ON member_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_member_inv_email ON member_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_member_inv_code ON member_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_member_inv_status ON member_invitations(status);

CREATE TABLE IF NOT EXISTS invitation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES member_invitations(id) ON DELETE CASCADE,
  event_type VARCHAR(24) NOT NULL
    CHECK (event_type IN ('sent','opened','clicked','registered','joined','rejected','expired')),
  meta JSONB DEFAULT '{}'::jsonb,
  ip_hash VARCHAR(64),
  user_agent VARCHAR(512),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_events_invitation ON invitation_events(invitation_id);
CREATE INDEX IF NOT EXISTS idx_inv_events_type ON invitation_events(event_type);

CREATE TABLE IF NOT EXISTS recruiter_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  invites_sent INT DEFAULT 0,
  invites_opened INT DEFAULT 0,
  invites_clicked INT DEFAULT 0,
  invites_converted INT DEFAULT 0,
  invite_streak INT DEFAULT 0,
  last_invite_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO achievement_definitions (id, title, description, icon, tier, xp_reward, sort_order) VALUES
  ('elite_recruiter', 'Elite Recruiter', '5 members joined via your invitations', '👑', 'gold', 600, 20),
  ('legendary_founder', 'Legendary Founder', '25 successful recruitment conversions', '🌟', 'legendary', 1500, 21),
  ('invite_streak_7', 'Recruitment On Fire', '7-day invite activity streak', '🔥', 'gold', 400, 22),
  ('team_builder_invite', 'Team Builder', 'First member joined through invite card', '🏗️', 'silver', 300, 23)
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_settings (key, value) VALUES
  ('invite_expiry_hours', '{"hours":168}'::jsonb),
  ('invite_limits', '{"max_pending_per_user":50,"max_per_day":20}'::jsonb),
  ('invite_themes', '{"themes":["valorant","nitro","royal","cyber"]}'::jsonb),
  ('invite_rewards', '{"pearls_per_join":250,"pearls_first_purchase":600}'::jsonb),
  ('invite_auto_placement', '{"mode":"weaker_bv_side"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
