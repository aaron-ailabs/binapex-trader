-- Create admin user directly (if auth.users exists)
-- This script creates the admin profile and sets up all necessary permissions

-- First, check if the user exists in auth.users
-- If they don't, you need to manually create them in Supabase Dashboard

-- Ensure profiles table has the admin user record
INSERT INTO public.profiles (
  id,
  email,
  role,
  full_name,
  balance_usd,
  bonus_balance,
  membership_tier,
  kyc_verified,
  risk_mode
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Placeholder UUID - replace with actual user ID from auth.users
  'admin.01@binapex.my',
  'admin',
  'System Administrator',
  0,
  0,
  'diamond',
  true,
  'neutral'
)
ON CONFLICT (email) DO UPDATE
SET 
  role = 'admin',
  full_name = 'System Administrator',
  membership_tier = 'diamond',
  kyc_verified = true;

-- Verify admin user was created
SELECT id, email, role, full_name, membership_tier, kyc_verified
FROM public.profiles
WHERE email = 'admin.01@binapex.my';
