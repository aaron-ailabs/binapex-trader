-- Promote user to admin role
-- Run this AFTER signing up with admin.01@binapex.my

UPDATE public.profiles
SET 
  role = 'admin',
  full_name = 'Admin User',
  kyc_verified = true
WHERE email = 'admin.01@binapex.my';

-- Verify the admin was created
SELECT id, email, role, full_name, created_at
FROM public.profiles
WHERE email = 'admin.01@binapex.my';
