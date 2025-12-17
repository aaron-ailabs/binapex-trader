-- Script to create or promote admin user: admin.01@binapex.my
-- This script should be run AFTER the user signs up through the normal flow
-- OR you can use the Edge Function instead: supabase functions invoke create-admin

-- If the user already exists in auth.users, promote them to admin
UPDATE public.profiles
SET 
  role = 'admin',
  full_name = 'System Administrator',
  balance_usd = 0,
  bonus_balance = 0,
  membership_tier = 'diamond',
  kyc_verified = true,
  risk_mode = 'neutral',
  updated_at = now()
WHERE email = 'admin.01@binapex.my';

-- Add admin RLS policy to allow admins to view all profiles
CREATE POLICY IF NOT EXISTS "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add admin RLS policy to allow admins to update any profile
CREATE POLICY IF NOT EXISTS "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add admin policies for transactions table
CREATE POLICY IF NOT EXISTS "transactions_select_admin"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "transactions_update_admin"
  ON public.transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verify the admin user was created/updated
SELECT id, email, role, full_name, membership_tier, kyc_verified
FROM public.profiles
WHERE email = 'admin.01@binapex.my';
