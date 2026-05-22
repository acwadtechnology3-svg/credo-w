-- Run AFTER schema.sql + seed.sql in Supabase SQL Editor
-- Login: admin / Admin@1234

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
