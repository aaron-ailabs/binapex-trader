-- Verification script for admin authentication setup
-- This script checks all components required for admin login to work

-- 1. Check if role column exists in profiles table
DO $$
DECLARE
  role_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) INTO role_column_exists;
  
  IF role_column_exists THEN
    RAISE NOTICE '✓ Role column exists in profiles table';
  ELSE
    RAISE WARNING '✗ Role column MISSING in profiles table - run 025_add_role_column_to_profiles.sql';
  END IF;
END $$;

-- 2. Check if is_admin function exists
DO $$
DECLARE
  is_admin_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'is_admin'
  ) INTO is_admin_exists;
  
  IF is_admin_exists THEN
    RAISE NOTICE '✓ is_admin() function exists';
  ELSE
    RAISE WARNING '✗ is_admin() function MISSING - run 022_fix_is_admin_function.sql';
  END IF;
END $$;

-- 3. Check if get_user_role function exists
DO $$
DECLARE
  get_user_role_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'get_user_role'
  ) INTO get_user_role_exists;
  
  IF get_user_role_exists THEN
    RAISE NOTICE '✓ get_user_role() function exists';
  ELSE
    RAISE WARNING '✗ get_user_role() function MISSING - run 022_fix_is_admin_function.sql';
  END IF;
END $$;

-- 4. Count admin users
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE NOTICE '✓ Found % admin user(s)', admin_count;
  ELSE
    RAISE WARNING '✗ No admin users found - create an admin user';
  END IF;
END $$;

-- 5. Display all admin users
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.membership_tier,
  p.kyc_verified,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at;

-- 6. Check RLS policies for profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;