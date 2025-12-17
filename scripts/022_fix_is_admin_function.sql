-- Fix is_admin() function to properly check admin role without RLS recursion
-- This function uses SECURITY DEFINER to bypass RLS policies

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.is_admin();

-- Create the is_admin function with SECURITY DEFINER
-- This allows it to query the profiles table without triggering RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Also create a get_user_role function for getting the role without RLS issues
DROP FUNCTION IF EXISTS public.get_user_role();

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role 
  FROM public.profiles 
  WHERE id = auth.uid();
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
