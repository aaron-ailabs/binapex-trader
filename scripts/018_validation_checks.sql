-- Validation and Consistency Checks Script
-- Run this to verify all tables and policies are correctly set up

-- 1. Check RLS is enabled on all critical tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'wallets', 'trading_pairs', 'limit_orders', 
                    'executed_trades', 'orders', 'trades', 'transactions', 
                    'credit_score_history', 'admin_logs')
ORDER BY tablename;

-- 2. List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verify orders table has price column
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name = 'price';

-- 4. Verify is_admin function exists
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'is_admin';

-- 5. Test is_admin function (should return false for anonymous)
SELECT public.is_admin() as is_admin_result;

-- 6. Check for any duplicate policies
SELECT 
  tablename,
  policyname,
  COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, policyname
HAVING COUNT(*) > 1;

-- 7. Verify critical functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'execute_transaction', 'update_wallet_balance', 
                       'handle_new_user', 'execute_trade');

-- 8. Check schema consistency - profiles table columns
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 9. Check schema consistency - transactions table columns  
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Summary message
SELECT 'Validation checks completed. Review results above for any issues.' as status;
