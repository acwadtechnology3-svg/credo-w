-- Premium Support & Administration Chat System
-- Run in Supabase SQL Editor after schema.sql

-- Extend support_tickets
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS department VARCHAR(64),
  ADD COLUMN IF NOT EXISTS subject VARCHAR(255),
  ADD COLUMN IF NOT EXISTS priority VARCHAR(16) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS context_json JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_escalated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS unread_user INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unread_admin INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
ALTER TABLE support_tickets
  ALTER COLUMN status SET DEFAULT 'open';

UPDATE support_tickets SET department = COALESCE(category, 'general') WHERE department IS NULL;

CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1;

CREATE OR REPLACE FUNCTION support_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'TKT-' || LPAD(nextval('support_ticket_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_ticket_number ON support_tickets;
CREATE TRIGGER trg_support_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION support_ticket_number();

-- Messages thread
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  sender_role VARCHAR(32) NOT NULL DEFAULT 'user',
  body TEXT,
  message_type VARCHAR(24) DEFAULT 'text'
    CHECK (message_type IN ('text','image','file','voice','system')),
  reply_to_id UUID REFERENCES support_messages(id),
  metadata JSONB DEFAULT '{}',
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id, created_at);

-- Attachments
CREATE TABLE IF NOT EXISTS support_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES support_messages(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  mime_type VARCHAR(128),
  size_bytes INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_attachments_ticket ON support_attachments(ticket_id);

-- Support agents registry
CREATE TABLE IF NOT EXISTS support_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department VARCHAR(64) NOT NULL DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  max_open_tickets INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity audit trail
CREATE TABLE IF NOT EXISTS support_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  action VARCHAR(64) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_activity_ticket ON support_activity_logs(ticket_id, created_at DESC);

-- Migrate legacy admin_reply into messages (idempotent)
INSERT INTO support_messages (ticket_id, sender_id, sender_role, body, message_type)
SELECT t.id, NULL, 'system', 'تم إنشاء التذكرة: ' || LEFT(t.message, 500), 'system'
FROM support_tickets t
WHERE NOT EXISTS (SELECT 1 FROM support_messages m WHERE m.ticket_id = t.id)
  AND t.message IS NOT NULL;

INSERT INTO support_messages (ticket_id, sender_id, sender_role, body, message_type)
SELECT t.id, NULL, 'admin', t.admin_reply, 'text'
FROM support_tickets t
WHERE t.admin_reply IS NOT NULL AND t.admin_reply <> ''
  AND NOT EXISTS (
    SELECT 1 FROM support_messages m
    WHERE m.ticket_id = t.id AND m.sender_role = 'admin' AND m.body = t.admin_reply
  );

-- RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_messages_user ON support_messages;
CREATE POLICY support_messages_user ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS support_messages_user_insert ON support_messages;
CREATE POLICY support_messages_user_insert ON support_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS support_attachments_user ON support_attachments;
CREATE POLICY support_attachments_user ON support_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

-- Server API (anon key): same pattern as fix-user-packages-rls.sql / rls-backend.sql
DROP POLICY IF EXISTS backend_all ON support_messages;
CREATE POLICY backend_all ON support_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS backend_all ON support_attachments;
CREATE POLICY backend_all ON support_attachments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS backend_all ON support_agents;
CREATE POLICY backend_all ON support_agents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS backend_all ON support_activity_logs;
CREATE POLICY backend_all ON support_activity_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS backend_all ON support_tickets;
CREATE POLICY backend_all ON support_tickets FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON support_messages TO authenticated;
GRANT SELECT, INSERT ON support_attachments TO authenticated;
GRANT SELECT ON support_agents TO authenticated;
GRANT SELECT ON support_activity_logs TO authenticated;

-- Realtime (optional — enable in Supabase dashboard if using client subscriptions)
-- ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
