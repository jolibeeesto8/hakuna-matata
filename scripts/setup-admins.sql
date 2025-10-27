-- Admin Account Setup
-- This SQL will create 3 admin accounts with profile entries
-- Run this after creating the users via Supabase Auth Dashboard

-- ADMIN CREDENTIALS (Create these via Supabase Auth Dashboard first):
--
-- Admin 1:
--   Email: admin@hmos-platform.com
--   Password: Admin@HMOS2024!Secure
--
-- Admin 2:
--   Email: chiefadmin@hmos-platform.com
--   Password: ChiefAdmin@HMOS2024!Secure
--
-- Admin 3:
--   Email: superadmin@hmos-platform.com
--   Password: SuperAdmin@HMOS2024!Secure

-- After creating users in Auth Dashboard, insert profile records
-- Replace the UUIDs below with actual user IDs from auth.users table

-- Example profile inserts (update UUIDs after user creation):
-- INSERT INTO profiles (id, full_name, email, role, status, email_verified, country)
-- VALUES
--   ('UUID_FROM_AUTH_USERS_1', 'Primary Administrator', 'admin@hmos-platform.com', 'admin', 'active', true, 'Global'),
--   ('UUID_FROM_AUTH_USERS_2', 'Chief Administrator', 'chiefadmin@hmos-platform.com', 'admin', 'active', true, 'Global'),
--   ('UUID_FROM_AUTH_USERS_3', 'Super Administrator', 'superadmin@hmos-platform.com', 'admin', 'active', true, 'Global');
