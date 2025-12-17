-- Fix admin role for admin88@binapex.my
-- This script ensures the admin user has the correct role in the profiles table

-- First, check if the user exists in auth.users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin88@binapex.my'
  ) THEN
    RAISE NOTICE 'Admin user exists in auth.users';
    
    -- Update the role in profiles table
    UPDATE public.profiles 
    SET role = 'admin',
        updated_at = NOW()
    WHERE id = (SELECT id FROM auth.users WHERE email = 'admin88@binapex.my');
    
    RAISE NOTICE 'Admin role assigned successfully';
  ELSE
    RAISE NOTICE 'Admin user does not exist in auth.users - please create the user first';
  END IF;
END $$;

-- Verify the update
SELECT 
  p.id,
  u.email,
  p.role,
  p.updated_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'admin88@binapex.my';
