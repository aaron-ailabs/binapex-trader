-- Add role column to profiles table
-- This is a critical fix for admin authentication
-- The role column was missing from the initial schema but is required by all admin verification logic

-- Step 1: Add the role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN role VARCHAR(20) DEFAULT 'user' 
      CHECK (role IN ('user', 'admin', 'moderator'));
    
    RAISE NOTICE 'Added role column to profiles table';
  ELSE
    RAISE NOTICE 'Role column already exists in profiles table';
  END IF;
END $$;

-- Step 2: Create index on role column for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Step 3: Update existing admin users (if any were manually set via email)
-- This ensures any existing admin users have the correct role
UPDATE public.profiles 
SET role = 'admin'
WHERE email IN ('admin.01@binapex.my', 'admin88@binapex.my', 'admin@binapex.my')
  AND (role IS NULL OR role != 'admin');

-- Step 4: Verify the changes
DO $$
DECLARE
  role_exists BOOLEAN;
  admin_count INTEGER;
BEGIN
  -- Check if role column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) INTO role_exists;
  
  IF role_exists THEN
    RAISE NOTICE '✓ Role column exists in profiles table';
    
    -- Count admin users
    SELECT COUNT(*) INTO admin_count
    FROM public.profiles
    WHERE role = 'admin';
    
    RAISE NOTICE '✓ Found % admin user(s)', admin_count;
  ELSE
    RAISE WARNING '✗ Role column does NOT exist in profiles table';
  END IF;
END $$;

-- Step 5: Display all admin users for verification
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at;