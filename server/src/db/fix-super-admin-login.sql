-- Run once in Supabase SQL Editor if superadmin login fails
-- Sets USR-000000 credentials to: superadmin / SuperAdmin@2026

UPDATE users
SET
  username = 'superadmin',
  email = 'superadmin@credow.com',
  role = 'super_admin',
  status = 'active',
  password_hash = '$2b$10$NAkXkLTSCz4l/SJGQjfXs.RHpz9PrhU8oHtJuCzo0o/UWpoUf6ncy',
  full_name = 'Super Admin'
WHERE user_code = 'USR-000000';
