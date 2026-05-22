-- Notification threading: sender, parent (reply chain)
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES notifications(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notif_sender ON notifications(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_parent ON notifications(parent_id, created_at ASC);
